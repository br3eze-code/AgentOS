import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, colorize, printf, json } = format;

const consoleFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level}] ${message}`;
});

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        consoleFormat
      ),
    }),
    new transports.File({
      filename: path.join(process.cwd(), 'logs', 'agentclaw-error.log'),
      level: 'error',
    }),
    new transports.File({
      filename: path.join(process.cwd(), 'logs', 'agentclaw-combined.log'),
    }),
  ],
});
