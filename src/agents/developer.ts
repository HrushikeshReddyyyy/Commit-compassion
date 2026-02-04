import { ChatOpenAI } from "@langchain/openai";
import type { AgentGraphState } from "./state";
import { createLog } from "./state";
import type { ProposedFix, GitDiff, DiffHunk } from "@/types";

const DEVELOPER_SYSTEM_PROMPT = `You are the Developer Agent in an AI-powered GitHub issue resolution system.

Your responsibilities:
1. Take the fix plan from the Manager Agent
2. Generate precise code changes (diffs) for each step
3. Ensure code quality, following existing patterns
4. Create appropriate commit messages and branch names

When generating code:
- Follow the existing code style and conventions
- Add comments only where necessary
- Consider backwards compatibility
- Handle error cases appropriately
- Write clean, maintainable code

Output format:
- Generate standard unified diff format
- Include context lines for clarity
- Group related changes logically`;

/**
 * Developer Agent Node
 *
 * Responsible for:
 * - Taking the fix plan from Manager Agent
 * - Generating actual code changes as diffs
 * - Creating commit messages and branch names
 */
export async function developerAgentNode(
  state: AgentGraphState
): Promise<Partial<AgentGraphState>> {
  const logs = [];

  logs.push(createLog("developer", "thought", "Reviewing fix plan from Manager Agent..."));

  if (!state.fixPlan) {
    logs.push(createLog("developer", "error", "No fix plan provided"));
    return {
      status: "error",
      error: "No fix plan available from Manager Agent",
      currentAgent: null,
      logs,
    };
  }

  try {
    const model = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview",
      temperature: 0.1,
    });

    logs.push(
      createLog(
        "developer",
        "thought",
        `Processing ${state.fixPlan.steps.length} steps from fix plan...`
      )
    );

    const diffs: GitDiff[] = [];

    // Process each step in the fix plan
    for (const step of state.fixPlan.steps) {
      logs.push(
        createLog(
          "developer",
          "action",
          `Generating changes for: ${step.filePath}`
        )
      );

      const diff = await generateDiff(
        step.filePath,
        step.action,
        step.description,
        state.codeContext?.relevantFiles.find((f) => f.path === step.filePath)?.content || "",
        model
      );

      diffs.push(diff);

      logs.push(
        createLog(
          "developer",
          "result",
          `Generated diff for ${step.filePath} (${countChanges(diff)})`
        )
      );
    }

    // Generate commit message and branch name
    const commitMessage = generateCommitMessage(state.issueDetail!, state.fixPlan);
    const branchName = generateBranchName(state.issueDetail!);

    logs.push(
      createLog("developer", "result", `Created branch: ${branchName}`)
    );
    logs.push(
      createLog("developer", "result", `Commit message: "${commitMessage}"`)
    );

    const proposedFix: ProposedFix = {
      plan: state.fixPlan,
      diff: diffs,
      commitMessage,
      branchName,
    };

    logs.push(
      createLog("developer", "action", "Implementation complete. Ready for review.")
    );

    return {
      proposedFix,
      status: "complete",
      currentAgent: null,
      logs,
    };
  } catch (error) {
    logs.push(
      createLog(
        "developer",
        "error",
        `Failed to generate fix: ${error instanceof Error ? error.message : "Unknown error"}`
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
 * Generate a diff for a specific file change
 */
async function generateDiff(
  filePath: string,
  action: "create" | "modify" | "delete",
  description: string,
  originalContent: string,
  _model: ChatOpenAI
): Promise<GitDiff> {
  // In production, this would use the LLM to generate actual code changes
  // based on the description and original content

  // Mock implementation based on file path
  let newContent = originalContent;
  const hunks: DiffHunk[] = [];

  if (filePath.includes("auth.ts")) {
    newContent = `export async function validateOAuthToken(token: string) {
  // Token validation logic with improved error handling
  if (!token || typeof token !== 'string') {
    throw new Error("Token is required and must be a string");
  }

  try {
    const decoded = decodeToken(token);
    if (!decoded) {
      throw new Error("Invalid token format");
    }

    // Validate token expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      throw new Error("Token has expired");
    }

    return decoded;
  } catch (error) {
    console.error("Token validation failed:", error);
    throw new Error("Invalid token");
  }
}

export function decodeToken(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}`;

    hunks.push({
      oldStart: 1,
      oldLines: 7,
      newStart: 1,
      newLines: 32,
      content: `@@ -1,7 +1,32 @@
-export async function validateOAuthToken(token: string) {
-  // Token validation logic
-  const decoded = decodeToken(token);
-  if (!decoded) {
-    throw new Error("Invalid token");
-  }
-  return decoded;
-}
+export async function validateOAuthToken(token: string) {
+  // Token validation logic with improved error handling
+  if (!token || typeof token !== 'string') {
+    throw new Error("Token is required and must be a string");
+  }
+
+  try {
+    const decoded = decodeToken(token);
+    if (!decoded) {
+      throw new Error("Invalid token format");
+    }
+
+    // Validate token expiration
+    if (decoded.exp && decoded.exp < Date.now() / 1000) {
+      throw new Error("Token has expired");
+    }
+
+    return decoded;
+  } catch (error) {
+    console.error("Token validation failed:", error);
+    throw new Error("Invalid token");
+  }
+}`,
    });
  } else if (filePath.includes("login")) {
    newContent = `"use client";

import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOAuth = async (provider: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Authentication failed');
      }

      const data = await response.json();
      window.location.href = data.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button onClick={() => handleOAuth('github')} disabled={loading}>
        {loading ? 'Loading...' : 'Sign in with GitHub'}
      </button>
    </div>
  );
}`;

    hunks.push({
      oldStart: 1,
      oldLines: 10,
      newStart: 1,
      newLines: 42,
      content: "@@ -1,10 +1,42 @@ ...",
    });
  }

  return {
    filePath,
    action,
    originalContent,
    newContent,
    hunks,
  };
}

/**
 * Count the number of additions and deletions in a diff
 */
function countChanges(diff: GitDiff): string {
  const additions = diff.newContent.split("\n").length;
  const deletions = (diff.originalContent || "").split("\n").length;
  return `+${additions} lines, -${deletions} lines`;
}

/**
 * Generate a commit message based on the issue and fix plan
 */
function generateCommitMessage(
  issue: { title: string; issueNumber: number; repoOwner: string; repoName: string },
  plan: { summary: string }
): string {
  return `fix: ${issue.title.toLowerCase()}

${plan.summary}

Fixes #${issue.issueNumber}`;
}

/**
 * Generate a branch name based on the issue
 */
function generateBranchName(issue: {
  issueNumber: number;
  title: string;
}): string {
  const slug = issue.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return `fix/${issue.issueNumber}-${slug}`;
}

export default developerAgentNode;
