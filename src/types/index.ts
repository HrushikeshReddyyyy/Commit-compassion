// Agent State Types for LangGraph
export interface IssueDetail {
  url: string;
  title: string;
  body: string;
  labels: string[];
  author: string;
  repoOwner: string;
  repoName: string;
  issueNumber: number;
}

export interface CodeContext {
  relevantFiles: RelevantFile[];
  dependencies: string[];
  projectStructure: string;
}

export interface RelevantFile {
  path: string;
  content: string;
  relevanceScore: number;
  reason: string;
}

export interface FixPlan {
  summary: string;
  steps: FixStep[];
  estimatedComplexity: "low" | "medium" | "high";
  affectedFiles: string[];
}

export interface FixStep {
  id: number;
  description: string;
  filePath: string;
  action: "create" | "modify" | "delete";
  reasoning: string;
}

export interface ProposedFix {
  plan: FixPlan;
  diff: GitDiff[];
  commitMessage: string;
  branchName: string;
}

export interface GitDiff {
  filePath: string;
  action: "create" | "modify" | "delete";
  originalContent?: string;
  newContent: string;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
}

export interface TestStatus {
  passed: boolean;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  errors: string[];
  coverage?: number;
}

// Agent State for LangGraph
export interface AgentState {
  issueDetail: IssueDetail | null;
  codeContext: CodeContext | null;
  fixPlan: FixPlan | null;
  proposedFix: ProposedFix | null;
  testStatus: TestStatus | null;
  currentAgent: "manager" | "developer" | null;
  status: "idle" | "analyzing" | "planning" | "implementing" | "testing" | "complete" | "error";
  error: string | null;
  logs: AgentLogEntry[];
}

export interface AgentLogEntry {
  timestamp: Date;
  agent: "manager" | "developer" | "system";
  type: "thought" | "action" | "result" | "error";
  content: string;
}

// Repository Types
export interface Repository {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  description?: string;
  defaultBranch: string;
  isPrivate: boolean;
  lastSynced?: Date;
}

// Session Types
export interface Session {
  id: string;
  issueUrl: string;
  repoOwner: string;
  repoName: string;
  issueNumber: number;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
  prUrl?: string;
  errorMessage?: string;
}
