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
exports.skillLoader = exports.SkillLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const Logger_1 = require("./Logger");
const AgentRegistry_1 = require("./AgentRegistry");
class SkillLoader {
    static instance;
    constructor() { }
    static getInstance() {
        if (!SkillLoader.instance) {
            SkillLoader.instance = new SkillLoader();
        }
        return SkillLoader.instance;
    }
    async loadSkills(skillsDir) {
        if (!fs.existsSync(skillsDir)) {
            Logger_1.logger.warn(`SkillLoader: Dir ${skillsDir} not found, skipping.`);
            return;
        }
        const folders = fs.readdirSync(skillsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        for (const folder of folders) {
            const skillPath = path.join(skillsDir, folder);
            await this.loadSkill(skillPath);
        }
    }
    async loadSkill(skillPath) {
        try {
            const manifestPath = path.join(skillPath, 'manifest.yaml');
            if (!fs.existsSync(manifestPath))
                throw new Error('Missing manifest.yaml');
            const manifestContent = fs.readFileSync(manifestPath, 'utf8');
            const manifest = yaml.load(manifestContent);
            const mainFile = manifest.main || 'index.js';
            const modulePath = path.join(skillPath, mainFile);
            if (!fs.existsSync(modulePath))
                throw new Error(`Main file ${mainFile} not found`);
            // Dynamically load the module
            const skillModule = await Promise.resolve(`${modulePath}`).then(s => __importStar(require(s)));
            // Expecting the module to export a default class OR specific agents
            for (const exportName in skillModule) {
                const ExportedItem = skillModule[exportName];
                if (typeof ExportedItem === 'function') {
                    const instance = new ExportedItem();
                    if (instance.name && typeof instance.start === 'function') {
                        AgentRegistry_1.agentRegistry.register(instance);
                        Logger_1.logger.info(`SkillLoader: Registered external agent ${instance.name} from skill ${manifest.name}`);
                    }
                }
            }
        }
        catch (err) {
            Logger_1.logger.error(`SkillLoader: Failed to load skill at ${skillPath} - ${err.message}`);
        }
    }
}
exports.SkillLoader = SkillLoader;
exports.skillLoader = SkillLoader.getInstance();
//# sourceMappingURL=SkillLoader.js.map