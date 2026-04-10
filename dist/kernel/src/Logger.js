"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = require("winston");
const path_1 = __importDefault(require("path"));
const { combine, timestamp, colorize, printf, json } = winston_1.format;
const consoleFormat = printf(({ level, message, timestamp }) => {
    return `[${timestamp}] [${level}] ${message}`;
});
exports.logger = (0, winston_1.createLogger)({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
    transports: [
        new winston_1.transports.Console({
            format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
        }),
        new winston_1.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'agentclaw-error.log'),
            level: 'error',
        }),
        new winston_1.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'agentclaw-combined.log'),
        }),
    ],
});
//# sourceMappingURL=Logger.js.map