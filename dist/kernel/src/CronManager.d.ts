export type CronTask = () => Promise<void> | void;
export declare class CronManager {
    private static instance;
    private tasks;
    private constructor();
    static getInstance(): CronManager;
    /**
     * Schedule a new task
     * @param name Unique name for the task
     * @param schedule Cron expression
     * @param task Function to execute
     */
    schedule(name: string, schedule: string, task: CronTask): void;
    stop(name: string): void;
    stopAll(): void;
}
export declare const cronManager: CronManager;
//# sourceMappingURL=CronManager.d.ts.map