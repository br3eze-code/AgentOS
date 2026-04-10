"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginLoader = exports.PluginLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const Logger_1 = require("./Logger");
const AgentRegistry_1 = require("./AgentRegistry");
class PluginLoader {
    static instance;
    constructor() { }
    static getInstance() {
        if (!PluginLoader.instance) {
            PluginLoader.instance = new PluginLoader();
        }
        return PluginLoader.instance;
    }
    async loadPlugins(pluginsDir) {
        if (!fs.existsSync(pluginsDir)) {
            Logger_1.logger.warn(`PluginLoader: Dir ${pluginsDir} not found, skipping.`);
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
    async loadPlugin(pluginPath) {
        try {
            const manifestPath = path.join(pluginPath, 'manifest.yaml');
            if (!fs.existsSync(manifestPath))
                throw new Error('Missing manifest.yaml');
            const manifestContent = fs.readFileSync(manifestPath, 'utf8');
            const manifest = yaml.load(manifestContent);
            const mainFile = manifest.main || 'index.js';
            const modulePath = path.join(pluginPath, mainFile);
            if (!fs.existsSync(modulePath))
                throw new Error(`Main file ${mainFile} not found`);
            // Dynamically load the module
            const pluginModule = await Promise.resolve(`${modulePath}`).then(s => __importStar(require(s)));
            // Expecting the module to export a default class OR specific agents
            for (const exportName in pluginModule) {
                const ExportedItem = pluginModule[exportName];
                if (typeof ExportedItem === 'function') {
                    const instance = new ExportedItem();
                    if (instance.name && typeof instance.start === 'function') {
                        AgentRegistry_1.agentRegistry.register(instance);
                        Logger_1.logger.info(`PluginLoader: Registered external agent ${instance.name} from plugin ${manifest.name}`);
                    }
                }
            }
        }
        catch (err) {
            Logger_1.logger.error(`PluginLoader: Failed to load plugin at ${pluginPath} - ${err.message}`);
        }
    }
}
exports.PluginLoader = PluginLoader;
exports.pluginLoader = PluginLoader.getInstance();
//# sourceMappingURL=PluginLoader.js.map