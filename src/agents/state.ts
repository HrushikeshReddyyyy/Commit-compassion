import { Annotation } from "@langchain/langgraph";
import type {
  IssueDetail,
  CodeContext,
  FixPlan,
  ProposedFix,
  TestStatus,
  AgentLogEntry,
} from "@/types";

/**
 * LangGraph State Annotation for the Commit Companion Agent System
 *
 * This state is shared between the Manager and Developer agents
 * and tracks the entire lifecycle of issue resolution.
 */
export const AgentStateAnnotation = Annotation.Root({
  // Issue information from GitHub
  issueDetail: Annotation<IssueDetail | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Context about the codebase relevant to the issue
  codeContext: Annotation<CodeContext | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // The plan created by the Manager Agent
  fixPlan: Annotation<FixPlan | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // The implementation created by the Developer Agent
  proposedFix: Annotation<ProposedFix | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Test results after applying the fix
  testStatus: Annotation<TestStatus | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Current active agent
  currentAgent: Annotation<"manager" | "developer" | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Overall status of the workflow
  status: Annotation<
    "idle" | "analyzing" | "planning" | "implementing" | "testing" | "complete" | "error"
  >({
    reducer: (_, update) => update,
    default: () => "idle",
  }),

  // Error message if something goes wrong
  error: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Accumulated logs from all agents
  logs: Annotation<AgentLogEntry[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Session ID for tracking
  sessionId: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // GitHub API responses cache
  githubData: Annotation<Record<string, unknown>>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),
});

export type AgentGraphState = typeof AgentStateAnnotation.State;

/**
 * Helper function to create a log entry
 */
export function createLog(
  agent: AgentLogEntry["agent"],
  type: AgentLogEntry["type"],
  content: string
): AgentLogEntry {
  return {
    timestamp: new Date(),
    agent,
    type,
    content,
  };
}
