import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentStateAnnotation, type AgentGraphState } from "./state";
import { managerAgentNode } from "./manager";
import { developerAgentNode } from "./developer";

/**
 * Create the Agent Workflow Graph
 *
 * Flow:
 * 1. START -> Manager Agent (analyzes issue, creates fix plan)
 * 2. Manager Agent -> Developer Agent (implements the fix)
 * 3. Developer Agent -> END (or back to Manager for iteration)
 */
export function createAgentGraph() {
  const workflow = new StateGraph(AgentStateAnnotation)
    // Add nodes
    .addNode("manager", managerAgentNode)
    .addNode("developer", developerAgentNode)

    // Define edges
    .addEdge(START, "manager")
    .addConditionalEdges("manager", routeFromManager)
    .addConditionalEdges("developer", routeFromDeveloper);

  // Compile the graph
  return workflow.compile();
}

/**
 * Route from Manager Agent
 * - On success: Go to Developer Agent
 * - On error: End the workflow
 */
function routeFromManager(state: AgentGraphState): "developer" | typeof END {
  if (state.status === "error") {
    return END;
  }

  if (state.fixPlan) {
    return "developer";
  }

  return END;
}

/**
 * Route from Developer Agent
 * - On success: End the workflow
 * - On error: End the workflow (could route back to manager for retry)
 */
function routeFromDeveloper(state: AgentGraphState): typeof END {
  // In a more advanced version, we could route back to manager
  // for iteration if tests fail or review is needed
  return END;
}

/**
 * Execute the agent workflow with a GitHub issue URL
 */
export async function executeAgentWorkflow(
  issueUrl: string,
  sessionId?: string,
  onStateChange?: (state: AgentGraphState) => void
): Promise<AgentGraphState> {
  const graph = createAgentGraph();

  // Initial state
  const initialState: Partial<AgentGraphState> = {
    issueDetail: {
      url: issueUrl,
      title: "",
      body: "",
      labels: [],
      author: "",
      repoOwner: "",
      repoName: "",
      issueNumber: 0,
    },
    status: "analyzing",
    currentAgent: "manager",
    sessionId: sessionId || crypto.randomUUID(),
    logs: [],
  };

  let finalState: AgentGraphState | null = null;

  // Execute the graph
  for await (const event of await graph.stream(initialState)) {
    // Get the latest state from the event
    const nodeStates = Object.values(event) as AgentGraphState[];
    if (nodeStates.length > 0) {
      finalState = nodeStates[0];
      if (onStateChange) {
        onStateChange(finalState);
      }
    }
  }

  return finalState || (initialState as AgentGraphState);
}

export { AgentStateAnnotation, type AgentGraphState };
