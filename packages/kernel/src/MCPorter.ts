import { spawn, ChildProcess } from 'child_process';
import { logger } from './Logger';

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface MCPToolManifest {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

/**
 * MCPorter — wraps an MCP (Model Context Protocol) server subprocess
 * as a typed TypeScript API, enabling native integration of any MCP-compatible
 * tool server without custom adapters.
 *
 * The server communicates over stdin/stdout using JSON-RPC 2.0.
 */
export class MCPorter {
  private process: ChildProcess | null = null;
  private config: MCPServerConfig;
  private pendingRequests: Map<number, {
    resolve: (v: any) => void;
    reject: (e: Error) => void;
  }> = new Map();
  private requestCounter = 0;
  private buffer = '';

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  /** Start the MCP server subprocess */
  async spawn(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn(this.config.command, this.config.args || [], {
        env: { ...process.env, ...this.config.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.process.stdout?.on('data', (data: Buffer) => {
        this.buffer += data.toString();
        // Process complete JSON lines from the buffer
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.trim()) {
            try {
              const msg = JSON.parse(line);
              this.handleMessage(msg);
            } catch {
              logger.warn(`MCPorter: Failed to parse message: ${line}`);
            }
          }
        }
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        logger.debug(`MCPorter [${this.config.command}] stderr: ${data.toString().trim()}`);
      });

      this.process.on('error', (err) => {
        logger.error(`MCPorter: Process error for ${this.config.command}:`, err);
        reject(err);
      });

      this.process.on('spawn', () => {
        logger.info(`MCPorter: Started server '${this.config.command}'`);
        resolve();
      });
    });
  }

  private handleMessage(msg: any): void {
    if (msg.id !== undefined) {
      const pending = this.pendingRequests.get(msg.id);
      if (pending) {
        this.pendingRequests.delete(msg.id);
        if (msg.error) {
          pending.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        } else {
          pending.resolve(msg.result);
        }
      }
    }
  }

  private send(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process?.stdin?.writable) {
        return reject(new Error('MCPorter: Server process is not running'));
      }
      const id = ++this.requestCounter;
      const request = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
      this.pendingRequests.set(id, { resolve, reject });

      // Timeout after 30s
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`MCPorter: Request ${id} timed out`));
        }
      }, 30000);

      this.process.stdin.write(request);
    });
  }

  /** List all tools provided by this MCP server */
  async listTools(): Promise<MCPToolManifest[]> {
    try {
      const result = await this.send('tools/list', {});
      return result?.tools || [];
    } catch (err: any) {
      logger.error(`MCPorter: listTools failed: ${err.message}`);
      return [];
    }
  }

  /** Call a specific tool on the MCP server */
  async call(toolName: string, args: Record<string, any>): Promise<any> {
    return this.send('tools/call', { name: toolName, arguments: args });
  }

  /** Terminate the server subprocess */
  async terminate(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
      logger.info(`MCPorter: Terminated server '${this.config.command}'`);
    }
  }

  get isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }
}
