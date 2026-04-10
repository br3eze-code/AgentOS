"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronManager = exports.CronManager = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Logger_1 = require("./Logger");
class CronManager {
    static instance;
    tasks = new Map();
    constructor() { }
    static getInstance() {
        if (!CronManager.instance) {
            CronManager.instance = new CronManager();
        }
        return CronManager.instance;
    }
    /**
     * Schedule a new task
     * @param name Unique name for the task
     * @param schedule Cron expression
     * @param task Function to execute
     */
    schedule(name, schedule, task) {
        if (this.tasks.has(name)) {
            this.tasks.get(name)?.stop();
        }
        const scheduledTask = node_cron_1.default.schedule(schedule, async () => {
            try {
                Logger_1.logger.debug(`CronManager: Executing task '${name}'`);
                await task();
            }
            catch (err) {
                Logger_1.logger.error(`CronManager: Task '${name}' failed: ${err.message}`);
            }
        });
        this.tasks.set(name, scheduledTask);
        Logger_1.logger.info(`CronManager: Scheduled task '${name}' with schedule '${schedule}'`);
    }
    stop(name) {
        const task = this.tasks.get(name);
        if (task) {
            task.stop();
            this.tasks.delete(name);
            Logger_1.logger.info(`CronManager: Stopped task '${name}'`);
        }
    }
    stopAll() {
        for (const [name, task] of this.tasks) {
            task.stop();
            Logger_1.logger.info(`CronManager: Stopped task '${name}'`);
        }
        this.tasks.clear();
    }
}
exports.CronManager = CronManager;
exports.cronManager = CronManager.getInstance();
//# sourceMappingURL=CronManager.js.map