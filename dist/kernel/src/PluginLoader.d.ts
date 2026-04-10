export declare class PluginLoader {
    private static instance;
    private constructor();
    static getInstance(): PluginLoader;
    loadPlugins(pluginsDir: string): Promise<void>;
    loadPlugin(pluginPath: string): Promise<void>;
}
export declare const pluginLoader: PluginLoader;
//# sourceMappingURL=PluginLoader.d.ts.map