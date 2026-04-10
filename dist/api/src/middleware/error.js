"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = exports.errorMiddleware = void 0;
const kernel_1 = require("@agentclaw/kernel");
const errorMiddleware = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    kernel_1.logger.error(`API Error [${req.method} ${req.path}]: ${err.message}`, {
        stack: err.stack,
        body: req.body,
        params: req.params,
        query: req.query
    });
    return res.status(statusCode).json({
        success: false,
        error: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR'
    });
};
exports.errorMiddleware = errorMiddleware;
const notFoundMiddleware = (req, res) => {
    return res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`,
        code: 'NOT_FOUND'
    });
};
exports.notFoundMiddleware = notFoundMiddleware;
//# sourceMappingURL=error.js.map