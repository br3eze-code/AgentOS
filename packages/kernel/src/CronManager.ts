import cron from 'node-cron';
import { logger } from './Logger';

export type CronTask = () => Promise<void> | void;

export class CronManager {
  private static instance: CronManager;
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  private constructor() {}

  static getInstance(): CronManager {
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
  schedule(name: string, schedule: string, task: CronTask): void {
    if (this.tasks.has(name)) {
      this.tasks.get(name)?.stop();
    }

    const scheduledTask = cron.schedule(schedule, async () => {
      try {
        logger.debug(`CronManager: Executing task '${name}'`);
        await task();
      } catch (err: any) {
        logger.error(`CronManager: Task '${name}' failed: ${err.message}`);
      }
    });

    this.tasks.set(name, scheduledTask);
    logger.info(`CronManager: Scheduled task '${name}' with schedule '${schedule}'`);
  }

  stop(name: string): void {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      this.tasks.delete(name);
      logger.info(`CronManager: Stopped task '${name}'`);
    }
  }

  stopAll(): void {
    for (const [name, task] of this.tasks) {
      task.stop();
      logger.info(`CronManager: Stopped task '${name}'`);
    }
    this.tasks.clear();
  }
}

export const cronManager = CronManager.getInstance();
