import { NextRequest, NextResponse } from "next/server";
import { executeAgentWorkflow } from "@/agents";
import { createServerClient } from "@/lib/supabase";

/**
 * POST /api/agents/execute
 *
 * Starts the agent workflow for a given GitHub issue URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueUrl } = body;

    if (!issueUrl) {
      return NextResponse.json(
        { error: "Issue URL is required" },
        { status: 400 }
      );
    }

    // Validate the GitHub issue URL format
    const urlMatch = issueUrl.match(
      /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)\/?$/
    );

    if (!urlMatch) {
      return NextResponse.json(
        { error: "Invalid GitHub issue URL format" },
        { status: 400 }
      );
    }

    const [, repoOwner, repoName, issueNumber] = urlMatch;

    // Create a session in the database
    const supabase = createServerClient();
    const sessionId = crypto.randomUUID();

    const { error: dbError } = await supabase.from("sessions").insert({
      id: sessionId,
      issue_url: issueUrl,
      repo_owner: repoOwner,
      repo_name: repoName,
      issue_number: parseInt(issueNumber, 10),
      status: "running",
      agent_logs: [],
    });

    if (dbError) {
      console.error("Database error:", dbError);
      // Continue even if database fails - we can still run the agents
    }

    // Start the agent workflow asynchronously
    executeAgentWorkflow(issueUrl, sessionId, async (state) => {
      // Update the session with new state
      try {
        await supabase
          .from("sessions")
          .update({
            status: state.status === "complete" ? "completed" :
                   state.status === "error" ? "failed" : "running",
            agent_logs: state.logs.map((log) => ({
              timestamp: log.timestamp.toISOString(),
              agent: log.agent,
              type: log.type,
              content: log.content,
            })),
            proposed_fix: state.proposedFix,
            error_message: state.error,
          })
          .eq("id", sessionId);
      } catch (err) {
        console.error("Failed to update session:", err);
      }
    }).catch((error) => {
      console.error("Agent workflow error:", error);
      // Update session with error
      supabase
        .from("sessions")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", sessionId);
    });

    return NextResponse.json({
      success: true,
      sessionId,
      message: "Agent workflow started",
    });
  } catch (error) {
    console.error("Error starting agent workflow:", error);
    return NextResponse.json(
      { error: "Failed to start agent workflow" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/execute
 *
 * Get the status of an agent execution session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session: data,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
