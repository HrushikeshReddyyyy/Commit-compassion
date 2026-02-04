import { NextRequest } from "next/server";
import { executeAgentWorkflow } from "@/agents";

/**
 * GET /api/agents/execute/stream
 *
 * Server-Sent Events (SSE) endpoint for real-time agent updates
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const issueUrl = searchParams.get("issueUrl");

  if (!issueUrl) {
    return new Response("Issue URL is required", { status: 400 });
  }

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper function to send SSE events
  const sendEvent = async (data: Record<string, unknown>) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (err) {
      console.error("Failed to write to stream:", err);
    }
  };

  // Start the agent workflow
  const sessionId = crypto.randomUUID();

  // Run the workflow in the background
  (async () => {
    try {
      await sendEvent({
        type: "start",
        sessionId,
        message: "Agent workflow started",
      });

      let lastLogIndex = 0;

      await executeAgentWorkflow(issueUrl, sessionId, async (state) => {
        // Send new logs
        const newLogs = state.logs.slice(lastLogIndex);
        for (const log of newLogs) {
          await sendEvent({
            type: "log",
            agent: log.agent,
            logType: log.type,
            content: log.content,
            timestamp: log.timestamp.toISOString(),
          });
        }
        lastLogIndex = state.logs.length;

        // Send state updates
        await sendEvent({
          type: "state",
          state: {
            status: state.status,
            currentAgent: state.currentAgent,
            issueDetail: state.issueDetail,
            fixPlan: state.fixPlan
              ? {
                  summary: state.fixPlan.summary,
                  steps: state.fixPlan.steps,
                  estimatedComplexity: state.fixPlan.estimatedComplexity,
                }
              : null,
            proposedFix: state.proposedFix
              ? {
                  commitMessage: state.proposedFix.commitMessage,
                  branchName: state.proposedFix.branchName,
                  diffCount: state.proposedFix.diff.length,
                }
              : null,
            testStatus: state.testStatus,
            error: state.error,
          },
        });
      });

      await sendEvent({
        type: "complete",
        sessionId,
        message: "Agent workflow completed",
      });
    } catch (error) {
      await sendEvent({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
