export interface IPlanningStep {
    thought: string;
    action?: {
        tool: string;
        args: any;
    };
    observation?: string;
}
export interface IPlanningResult {
    goal: string;
    steps: IPlanningStep[];
    success: boolean;
    finalOutput?: string;
}
export declare class PlanningEngine {
    private static instance;
    private constructor();
    init(): Promise<void>;
    static getInstance(): PlanningEngine;
    runAutonomousLoop(goal: string, maxSteps?: number): Promise<IPlanningResult>;
    /** Mock fallback when no LLM key is configured */
    private mockDecideAction;
}
export declare const planningEngine: PlanningEngine;
//# sourceMappingURL=PlanningEngine.d.ts.map