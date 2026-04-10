import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { logger } from './Logger';
import { agentRegistry, IAgent } from './AgentRegistry';

export class PluginLoader {
  private static instance: PluginLoader;

  private constructor() {}

  static getInstance(): PluginLoader {
    if (!PluginLoader.instance) {
      PluginLoader.instance = new PluginLoader();
    }
    return PluginLoader.instance;
  }

  async loadPlugins(pluginsDir: string): Promise<void> {
    if (!fs.existsSync(pluginsDir)) {
      logger.warn(`PluginLoader: Dir ${pluginsDir} not found, skipping.`);
      return;
    }

    const folders = fs.readdirSync(pluginsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const folder of folders) {
      const pluginPath = path.join(pluginsDir, folder);
      await this.loadPlugin(pluginPath);
    }
  }

  async loadPlugin(pluginPath: string): Promise<void> {
    try {
      const manifestPath = path.join(pluginPath, 'manifest.yaml');
      if (!fs.existsSync(manifestPath)) throw new Error('Missing manifest.yaml');

      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = yaml.load(manifestContent) as any;

      const mainFile = manifest.main || 'index.js';
      const modulePath = path.join(pluginPath, mainFile);

      if (!fs.existsSync(modulePath)) throw new Error(`Main file ${mainFile} not found`);

      // Dynamically load the module
      const pluginModule = await import(modulePath);

      // Expecting the module to export a default class OR specific agents
      for (const exportName in pluginModule) {
        const ExportedItem = pluginModule[exportName];
        if (typeof ExportedItem === 'function') {
          const instance = new ExportedItem();
          if (instance.name && typeof instance.start === 'function') {
            agentRegistry.register(instance as IAgent);
            logger.info(`PluginLoader: Registered external agent ${instance.name} from plugin ${manifest.name}`);
          }
        }
      }
    } catch (err: any) {
      logger.error(`PluginLoader: Failed to load plugin at ${pluginPath} - ${err.message}`);
    }
  }
}

export const pluginLoader = PluginLoader.getInstance();
