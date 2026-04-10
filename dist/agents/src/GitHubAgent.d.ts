import { BaseAgent } from './BaseAgent';
/**
 * GitHubAgent — AI skill agent for GitHub repository interactions.
 *
 * Tools registered:
 *   github_list_prs   — list open pull requests for a repo
 *   github_get_file   — fetch a file's content from a repo
 *   github_list_issues — list open issues with optional label filter
 *
 * Requires GITHUB_TOKEN env var for authenticated requests.
 */
export declare class GitHubAgent extends BaseAgent {
    name: string;
    private get token();
    start(): Promise<void>;
    stop(): Promise<void>;
    init(): Promise<void>;
    process(task: string): Promise<string>;
}
//# sourceMappingURL=GitHubAgent.d.ts.map