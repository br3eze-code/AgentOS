"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPorter = void 0;
const child_process_1 = require("child_process");
const Logger_1 = require("./Logger");
/**
 * MCPorter — wraps an MCP (Model Context Protocol) server subprocess
 * as a typed TypeScript API, enabling native integration of any MCP-compatible
 * tool server without custom adapters.
 *
 * The server communicates over stdin/stdout using JSON-RPC 2.0.
 */
class MCPorter {
    process = null;
    config;
    pendingRequests = new Map();
    requestCounter = 0;
    buffer = '';
    constructor(config) {
        this.config = config;
    }
    /** Start the MCP server subprocess */
    async spawn() {
        return new Promise((resolve, reject) => {
            this.process = (0, child_process_1.spawn)(this.config.command, this.config.args || [], {
                env: { ...process.env, ...this.config.env },
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            this.process.stdout?.on('data', (data) => {
                this.buffer += data.toString();
                // Process complete JSON lines from the buffer
                const lines = this.buffer.split('\n');
                this.buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const msg = JSON.parse(line);
                            this.handleMessage(msg);
                        }
                        catch {
                            Logger_1.logger.warn(`MCPorter: Failed to parse message: ${line}`);
                        }
                    }
                }
            });
            this.process.stderr?.on('data', (data) => {
                Logger_1.logger.debug(`MCPorter [${this.config.command}] stderr: ${data.toString().trim()}`);
            });
            this.process.on('error', (err) => {
                Logger_1.logger.error(`MCPorter: Process error for ${this.config.command}:`, err);
                reject(err);
            });
            this.process.on('spawn', () => {
                Logger_1.logger.info(`MCPorter: Started server '${this.config.command}'`);
                resolve();
            });
        });
    }
    handleMessage(msg) {
        if (msg.id !== undefined) {
            const pending = this.pendingRequests.get(msg.id);
            if (pending) {
                this.pendingRequests.delete(msg.id);
                if (msg.error) {
                    pending.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
                }
                else {
                    pending.resolve(msg.result);
                }
            }
        }
    }
    send(method, params) {
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
    async listTools() {
        try {
            const result = await this.send('tools/list', {});
            return result?.tools || [];
        }
        catch (err) {
            Logger_1.logger.error(`MCPorter: listTools failed: ${err.message}`);
            return [];
        }
    }
    /** Call a specific tool on the MCP server */
    async call(toolName, args) {
        return this.send('tools/call', { name: toolName, arguments: args });
    }
    /** Terminate the server subprocess */
    async terminate() {
        if (this.process) {
            this.process.kill();
            this.process = null;
            Logger_1.logger.info(`MCPorter: Terminated server '${this.config.command}'`);
        }
    }
    get isRunning() {
        return this.process !== null && !this.process.killed;
    }
}
exports.MCPorter = MCPorter;
//# sourceMappingURL=MCPorter.js.map