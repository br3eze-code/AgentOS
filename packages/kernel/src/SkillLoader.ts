import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { logger } from './Logger';
import { agentRegistry, IAgent } from './AgentRegistry';

export class SkillLoader {
  private static instance: SkillLoader;

  private constructor() {}

  static getInstance(): SkillLoader {
    if (!SkillLoader.instance) {
      SkillLoader.instance = new SkillLoader();
    }
    return SkillLoader.instance;
  }

  async loadSkills(skillsDir: string): Promise<void> {
    if (!fs.existsSync(skillsDir)) {
      logger.warn(`SkillLoader: Dir ${skillsDir} not found, skipping.`);
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

  async loadSkill(skillPath: string): Promise<void> {
    try {
      const manifestPath = path.join(skillPath, 'manifest.yaml');
      if (!fs.existsSync(manifestPath)) throw new Error('Missing manifest.yaml');

      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = yaml.load(manifestContent) as any;

      const mainFile = manifest.main || 'index.js';
      const modulePath = path.join(skillPath, mainFile);

      if (!fs.existsSync(modulePath)) throw new Error(`Main file ${mainFile} not found`);

      // Dynamically load the module
      const skillModule = await import(modulePath);

      // Expecting the module to export a default class OR specific agents
      for (const exportName in skillModule) {
        const ExportedItem = skillModule[exportName];
        if (typeof ExportedItem === 'function') {
          const instance = new ExportedItem();
          if (instance.name && typeof instance.start === 'function') {
            agentRegistry.register(instance as IAgent);
            logger.info(`SkillLoader: Registered external agent ${instance.name} from skill ${manifest.name}`);
          }
        }
      }
    } catch (err: any) {
      logger.error(`SkillLoader: Failed to load skill at ${skillPath} - ${err.message}`);
    }
  }
}

export const skillLoader = SkillLoader.getInstance();
