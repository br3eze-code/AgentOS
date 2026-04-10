export declare class SkillLoader {
    private static instance;
    private constructor();
    static getInstance(): SkillLoader;
    loadSkills(skillsDir: string): Promise<void>;
    loadSkill(skillPath: string): Promise<void>;
}
export declare const skillLoader: SkillLoader;
//# sourceMappingURL=SkillLoader.d.ts.map