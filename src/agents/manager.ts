import { ChatOpenAI } from "@langchain/openai";
import type { AgentGraphState } from "./state";
import { createLog } from "./state";
import type { IssueDetail, CodeContext, FixPlan, FixStep } from "@/types";

const MANAGER_SYSTEM_PROMPT = `You are the Manager Agent in an AI-powered GitHub issue resolution system.

Your responsibilities:
1. Parse and understand GitHub issues thoroughly
2. Identify the root cause and affected components
3. Search the codebase to find relevant files
4. Create a detailed, actionable fix plan for the Developer Agent

When analyzing an issue:
- Extract key information: error messages, stack traces, reproduction steps
- Identify the type of issue: bug, feature, refactor, documentation
- Determine the scope and complexity of the fix

When creating a fix plan:
- Be specific about which files need to be modified
- Explain WHY each change is needed
- Consider edge cases and potential side effects
- Estimate complexity (low/medium/high)

Always output structured, actionable plans that the Developer Agent can execute.`;

/**
 * Manager Agent Node
 *
 * Responsible for:
 * - Parsing the GitHub issue
 * - Identifying relevant files in the codebase
 * - Creating a structured fix plan
 */
export async function managerAgentNode(
  state: AgentGraphState
): Promise<Partial<AgentGraphState>> {
  const logs = [];

  logs.push(createLog("manager", "thought", "Starting issue analysis..."));

  try {
    // Initialize the LLM
    const model = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview",
      temperature: 0.1,
    });

    // Step 1: Parse the issue (simulated for now - would use GitHub API)
    logs.push(createLog("manager", "action", "Fetching issue details from GitHub..."));

    const issueDetail = await parseGitHubIssue(state.issueDetail?.url || "");
    logs.push(
      createLog(
        "manager",
        "result",
        `Issue parsed: "${issueDetail.title}" by @${issueDetail.author}`
      )
    );

    // Step 2: Search for relevant files
    logs.push(createLog("manager", "thought", "Searching codebase for relevant files..."));

    const codeContext = await findRelevantFiles(issueDetail, model);
    logs.push(
      createLog(
        "manager",
        "result",
        `Found ${codeContext.relevantFiles.length} relevant files: ${codeContext.relevantFiles
          .map((f) => f.path)
          .join(", ")}`
      )
    );

    // Step 3: Create fix plan
    logs.push(createLog("manager", "thought", "Creating fix plan..."));

    const fixPlan = await createFixPlan(issueDetail, codeContext, model);
    logs.push(
      createLog(
        "manager",
        "result",
        `Fix plan created with ${fixPlan.steps.length} steps. Complexity: ${fixPlan.estimatedComplexity}`
      )
    );

    logs.push(createLog("manager", "action", "Handing off to Developer Agent..."));

    return {
      issueDetail,
      codeContext,
      fixPlan,
      status: "planning",
      currentAgent: "developer",
      logs,
    };
  } catch (error) {
    logs.push(
      createLog(
        "manager",
        "error",
        `Failed to analyze issue: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    );

    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      currentAgent: null,
      logs,
    };
  }
}

/**
 * Parse a GitHub issue URL and fetch issue details
 */
async function parseGitHubIssue(url: string): Promise<IssueDetail> {
  // Extract owner, repo, and issue number from URL
  const match = url.match(
    /github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/
  );

  if (!match) {
    throw new Error("Invalid GitHub issue URL");
  }

  const [, owner, repo, issueNumber] = match;

  // In production, this would call the GitHub API
  // For now, return mock data
  return {
    url,
    title: "Fix authentication bug in login flow",
    body: `## Description
The login flow fails when users try to authenticate with OAuth providers.

## Steps to Reproduce
1. Go to login page
2. Click "Sign in with GitHub"
3. Complete OAuth flow
4. Get redirected back with error

## Expected Behavior
User should be logged in successfully.

## Actual Behavior
Error: "Invalid token" is displayed.

## Environment
- Browser: Chrome 120
- OS: macOS 14.2`,
    labels: ["bug", "auth", "high-priority"],
    author: "user123",
    repoOwner: owner,
    repoName: repo,
    issueNumber: parseInt(issueNumber, 10),
  };
}

/**
 * Find relevant files in the codebase based on the issue
 */
async function findRelevantFiles(
  issue: IssueDetail,
  _model: ChatOpenAI
): Promise<CodeContext> {
  // In production, this would:
  // 1. Use embeddings to search the codebase
  // 2. Use the LLM to understand which files are most relevant
  // 3. Fetch and analyze file contents

  // Mock implementation
  return {
    relevantFiles: [
      {
        path: "src/lib/auth.ts",
        content: `export async function validateOAuthToken(token: string) {
  // Token validation logic
  const decoded = decodeToken(token);
  if (!decoded) {
    throw new Error("Invalid token");
  }
  return decoded;
}`,
        relevanceScore: 0.95,
        reason: "Contains OAuth token validation logic mentioned in error",
      },
      {
        path: "src/app/login/page.tsx",
        content: `export default function LoginPage() {
  const handleOAuth = async (provider: string) => {
    const response = await fetch('/api/auth/oauth', {
      method: 'POST',
      body: JSON.stringify({ provider })
    });
    // Handle response
  };
}`,
        relevanceScore: 0.85,
        reason: "Login page component handling OAuth flow",
      },
      {
        path: "src/middleware.ts",
        content: `export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  // Middleware logic
}`,
        relevanceScore: 0.7,
        reason: "Middleware that may affect auth flow",
      },
    ],
    dependencies: ["next-auth", "@auth/core"],
    projectStructure: `src/
  app/
    login/
      page.tsx
    api/
      auth/
        oauth/
          route.ts
  lib/
    auth.ts
  middleware.ts`,
  };
}

/**
 * Create a fix plan based on the issue and code context
 */
async function createFixPlan(
  issue: IssueDetail,
  context: CodeContext,
  _model: ChatOpenAI
): Promise<FixPlan> {
  // In production, this would use the LLM to generate a detailed plan
  // based on the issue description and code context

  const steps: FixStep[] = [
    {
      id: 1,
      description: "Update token validation to handle edge cases",
      filePath: "src/lib/auth.ts",
      action: "modify",
      reasoning:
        "The current validation doesn't properly handle tokens from OAuth callback",
    },
    {
      id: 2,
      description: "Add error handling in login page",
      filePath: "src/app/login/page.tsx",
      action: "modify",
      reasoning: "Need to catch and display auth errors properly to users",
    },
  ];

  return {
    summary: `Fix OAuth authentication flow by updating token validation and adding proper error handling. The issue is caused by improper token parsing in the callback handler.`,
    steps,
    estimatedComplexity: "medium",
    affectedFiles: context.relevantFiles.map((f) => f.path),
  };
}

export default managerAgentNode;
