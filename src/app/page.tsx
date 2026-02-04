"use client";

import { useState, useCallback } from "react";
import { Sidebar, AgentWorkspace, IssueInput } from "@/components/dashboard";
import type { Repository, AgentState, AgentLogEntry } from "@/types";

// Mock repositories for demo
const mockRepositories: Repository[] = [
  {
    id: "1",
    owner: "facebook",
    name: "react",
    fullName: "facebook/react",
    description: "A declarative, efficient, and flexible JavaScript library",
    defaultBranch: "main",
    isPrivate: false,
  },
  {
    id: "2",
    owner: "vercel",
    name: "next.js",
    fullName: "vercel/next.js",
    description: "The React Framework",
    defaultBranch: "canary",
    isPrivate: false,
  },
];

const initialAgentState: AgentState = {
  issueDetail: null,
  codeContext: null,
  fixPlan: null,
  proposedFix: null,
  testStatus: null,
  currentAgent: null,
  status: "idle",
  error: null,
  logs: [],
};

export default function DashboardPage() {
  const [repositories] = useState<Repository[]>(mockRepositories);
  const [activeRepoId, setActiveRepoId] = useState<string | undefined>();
  const [agentState, setAgentState] = useState<AgentState>(initialAgentState);
  const [isProcessing, setIsProcessing] = useState(false);

  const addLog = useCallback(
    (agent: AgentLogEntry["agent"], type: AgentLogEntry["type"], content: string) => {
      const newLog: AgentLogEntry = {
        timestamp: new Date(),
        agent,
        type,
        content,
      };
      setAgentState((prev) => ({
        ...prev,
        logs: [...prev.logs, newLog],
      }));
    },
    []
  );

  const handleRepoSelect = (repo: Repository) => {
    setActiveRepoId(repo.id);
  };

  const handleAddRepo = () => {
    // TODO: Implement add repository modal
    console.log("Add repository clicked");
  };

  const handleIssueSubmit = async (issueUrl: string) => {
    setIsProcessing(true);
    setAgentState({
      ...initialAgentState,
      status: "analyzing",
      logs: [],
    });

    try {
      // Call the API route
      const response = await fetch("/api/agents/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ issueUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to start agent execution");
      }

      // Set up SSE for real-time updates
      const eventSource = new EventSource(
        `/api/agents/execute/stream?issueUrl=${encodeURIComponent(issueUrl)}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "log") {
            addLog(data.agent, data.logType, data.content);
          } else if (data.type === "state") {
            setAgentState((prev) => ({
              ...prev,
              ...data.state,
            }));
          } else if (data.type === "complete") {
            setAgentState((prev) => ({
              ...prev,
              status: "complete",
              currentAgent: null,
            }));
            eventSource.close();
            setIsProcessing(false);
          } else if (data.type === "error") {
            setAgentState((prev) => ({
              ...prev,
              status: "error",
              error: data.message,
              currentAgent: null,
            }));
            eventSource.close();
            setIsProcessing(false);
          }
        } catch (err) {
          console.error("Failed to parse event data:", err);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsProcessing(false);
        setAgentState((prev) => ({
          ...prev,
          status: "error",
          error: "Connection lost. Please try again.",
        }));
      };

      // Demo: Simulate agent activity for preview
      simulateAgentActivity(addLog, setAgentState);

    } catch (error) {
      setAgentState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }));
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        repositories={repositories}
        activeRepoId={activeRepoId}
        onRepoSelect={handleRepoSelect}
        onAddRepo={handleAddRepo}
      />

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b px-6">
          <div>
            <h1 className="text-xl font-semibold">Commit Companion</h1>
            <p className="text-sm text-muted-foreground">
              AI-Powered GitHub Issue Resolver
            </p>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Issue Input */}
            <IssueInput
              onSubmit={handleIssueSubmit}
              isProcessing={isProcessing}
            />

            {/* Agent Workspace */}
            <AgentWorkspace agentState={agentState} className="min-h-[500px]" />
          </div>
        </div>
      </main>
    </div>
  );
}

// Simulate agent activity for demo/preview purposes
function simulateAgentActivity(
  addLog: (agent: AgentLogEntry["agent"], type: AgentLogEntry["type"], content: string) => void,
  setAgentState: React.Dispatch<React.SetStateAction<AgentState>>
) {
  const steps = [
    { delay: 500, agent: "system" as const, type: "action" as const, content: "Initializing agent pipeline..." },
    { delay: 1000, agent: "manager" as const, type: "thought" as const, content: "Analyzing GitHub issue URL and fetching issue details..." },
    { delay: 1500, agent: "manager" as const, type: "action" as const, content: "Fetching issue #123 from repository..." },
    { delay: 2000, agent: "manager" as const, type: "result" as const, content: "Issue fetched successfully. Title: 'Fix authentication bug in login flow'" },
    { delay: 2500, agent: "manager" as const, type: "thought" as const, content: "Identifying relevant files in the codebase..." },
    { delay: 3500, agent: "manager" as const, type: "result" as const, content: "Found 3 relevant files: auth.ts, login.tsx, middleware.ts" },
    { delay: 4000, agent: "manager" as const, type: "thought" as const, content: "Creating fix plan based on issue analysis..." },
    { delay: 5000, agent: "manager" as const, type: "result" as const, content: "Fix plan created with 2 steps: 1) Update auth logic 2) Add error handling" },
    { delay: 5500, agent: "developer" as const, type: "thought" as const, content: "Starting implementation based on fix plan..." },
    { delay: 6500, agent: "developer" as const, type: "action" as const, content: "Generating code changes for auth.ts..." },
    { delay: 7500, agent: "developer" as const, type: "result" as const, content: "Generated diff for auth.ts (+15 lines, -3 lines)" },
    { delay: 8000, agent: "developer" as const, type: "action" as const, content: "Generating code changes for login.tsx..." },
    { delay: 9000, agent: "developer" as const, type: "result" as const, content: "Generated diff for login.tsx (+8 lines, -2 lines)" },
    { delay: 9500, agent: "system" as const, type: "result" as const, content: "All changes generated successfully. Ready to create PR." },
  ];

  steps.forEach(({ delay, agent, type, content }) => {
    setTimeout(() => {
      addLog(agent, type, content);

      // Update status based on progress
      if (delay === 500) {
        setAgentState(prev => ({ ...prev, status: "analyzing", currentAgent: "manager" }));
      } else if (delay === 4000) {
        setAgentState(prev => ({ ...prev, status: "planning" }));
      } else if (delay === 5500) {
        setAgentState(prev => ({ ...prev, status: "implementing", currentAgent: "developer" }));
      } else if (delay === 9500) {
        setAgentState(prev => ({ ...prev, status: "complete", currentAgent: null }));
      }
    }, delay);
  });
}
