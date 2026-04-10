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
exports.GitHubAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const kernel_1 = require("@agentclaw/kernel");
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
class GitHubAgent extends BaseAgent_1.BaseAgent {
    name = 'GitHubAgent';
    get token() {
        return process.env.GITHUB_TOKEN || '';
    }
    async start() { }
    async stop() { }
    async init() {
        this.log('Registering GitHub tools with MCPRegistry...');
        kernel_1.mcpRegistry.registerTool({
            name: 'github_list_prs',
            description: 'List open pull requests for a GitHub repository',
            inputSchema: {
                type: 'object',
                properties: {
                    owner: { type: 'string', description: 'Repository owner (org or user)' },
                    repo: { type: 'string', description: 'Repository name' },
                    state: { type: 'string', description: 'PR state: open|closed|all (default: open)' },
                    limit: { type: 'number', description: 'Max results (default: 10)' },
                },
                required: ['owner', 'repo'],
            },
        }, async (args) => {
            const { owner, repo, state = 'open', limit = 10 } = args;
            // @ts-ignore Optional peer dependency
            const { Octokit } = await Promise.resolve().then(() => __importStar(require('@octokit/rest'))).catch(() => {
                throw new Error('Install @octokit/rest: npm install @octokit/rest');
            });
            const octokit = new Octokit({ auth: this.token || undefined });
            const { data } = await octokit.pulls.list({
                owner, repo,
                state: state,
                per_page: Math.min(limit, 100),
            });
            return {
                success: true,
                repo: `${owner}/${repo}`,
                total: data.length,
                prs: data.map((pr) => ({
                    number: pr.number,
                    title: pr.title,
                    author: pr.user?.login,
                    state: pr.state,
                    draft: pr.draft,
                    labels: pr.labels.map((l) => l.name),
                    createdAt: pr.created_at,
                    url: pr.html_url,
                })),
            };
        }, 'GitHubAgent');
        kernel_1.mcpRegistry.registerTool({
            name: 'github_get_file',
            description: 'Fetch the content of a file from a GitHub repository',
            inputSchema: {
                type: 'object',
                properties: {
                    owner: { type: 'string', description: 'Repository owner' },
                    repo: { type: 'string', description: 'Repository name' },
                    path: { type: 'string', description: 'File path within the repository' },
                    ref: { type: 'string', description: 'Branch, tag, or commit SHA (default: main)' },
                },
                required: ['owner', 'repo', 'path'],
            },
        }, async (args) => {
            const { owner, repo, path: filePath, ref = 'main' } = args;
            // @ts-ignore Optional peer dependency
            const { Octokit } = await Promise.resolve().then(() => __importStar(require('@octokit/rest'))).catch(() => {
                throw new Error('Install @octokit/rest: npm install @octokit/rest');
            });
            const octokit = new Octokit({ auth: this.token || undefined });
            const { data } = await octokit.repos.getContent({ owner, repo, path: filePath, ref });
            if (Array.isArray(data)) {
                // It's a directory
                return {
                    success: true,
                    type: 'directory',
                    path: filePath,
                    entries: data.map(e => ({ name: e.name, type: e.type, size: e.size })),
                };
            }
            const content = 'content' in data && data.content
                ? Buffer.from(data.content, 'base64').toString('utf-8')
                : null;
            return {
                success: true,
                type: 'file',
                path: filePath,
                size: 'size' in data ? data.size : null,
                sha: data.sha,
                content,
            };
        }, 'GitHubAgent');
        kernel_1.mcpRegistry.registerTool({
            name: 'github_list_issues',
            description: 'List open issues for a GitHub repository',
            inputSchema: {
                type: 'object',
                properties: {
                    owner: { type: 'string', description: 'Repository owner' },
                    repo: { type: 'string', description: 'Repository name' },
                    labels: { type: 'string', description: 'Comma-separated label filter' },
                    limit: { type: 'number', description: 'Max results (default: 10)' },
                },
                required: ['owner', 'repo'],
            },
        }, async (args) => {
            const { owner, repo, labels, limit = 10 } = args;
            // @ts-ignore Optional peer dependency
            const { Octokit } = await Promise.resolve().then(() => __importStar(require('@octokit/rest'))).catch(() => {
                throw new Error('Install @octokit/rest: npm install @octokit/rest');
            });
            const octokit = new Octokit({ auth: this.token || undefined });
            const { data } = await octokit.issues.listForRepo({
                owner, repo,
                state: 'open',
                labels: labels || undefined,
                per_page: Math.min(limit, 100),
            });
            return {
                success: true,
                repo: `${owner}/${repo}`,
                total: data.length,
                issues: data
                    .filter((i) => !i.pull_request) // exclude PRs
                    .map((i) => ({
                    number: i.number,
                    title: i.title,
                    author: i.user?.login,
                    labels: i.labels.map((l) => l.name),
                    comments: i.comments,
                    createdAt: i.created_at,
                    url: i.html_url,
                })),
            };
        }, 'GitHubAgent');
        this.log('GitHubAgent: 3 tools registered (github_list_prs, github_get_file, github_list_issues)');
    }
    async process(task) {
        return `GitHubAgent received task: "${task}". Use github_list_prs, github_get_file, or github_list_issues via the planner.`;
    }
}
exports.GitHubAgent = GitHubAgent;
//# sourceMappingURL=GitHubAgent.js.map