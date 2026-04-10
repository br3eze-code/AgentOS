"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const kernel_1 = require("@agentclaw/kernel");
class BaseAgent {
    id;
    name;
    description;
    status = 'IDLE';
    constructor(id, name, description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }
    publishEvent(type, data) {
        kernel_1.eventBus.publish(type, data, this.name);
        kernel_1.logger.debug(`${this.name}: Published event '${type}'`);
    }
    log(message, level = 'info') {
        kernel_1.logger[level](`${this.name}: ${message}`);
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=BaseAgent.js.map