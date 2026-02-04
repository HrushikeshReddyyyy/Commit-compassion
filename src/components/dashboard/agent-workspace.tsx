"use client";

import { useEffect, useRef } from "react";
import { Bot, Brain, Code, Terminal, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AgentLogEntry, AgentState } from "@/types";

interface AgentWorkspaceProps {
  agentState: AgentState;
  className?: string;
}

const agentConfig = {
  manager: {
    name: "Manager Agent",
    icon: Brain,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  developer: {
    name: "Developer Agent",
    icon: Code,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  system: {
    name: "System",
    icon: Terminal,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
  },
};

const statusConfig = {
  idle: { label: "Idle", variant: "secondary" as const },
  analyzing: { label: "Analyzing Issue", variant: "info" as const },
  planning: { label: "Creating Fix Plan", variant: "info" as const },
  implementing: { label: "Implementing Fix", variant: "warning" as const },
  testing: { label: "Running Tests", variant: "warning" as const },
  complete: { label: "Complete", variant: "success" as const },
  error: { label: "Error", variant: "destructive" as const },
};

function LogEntry({ log }: { log: AgentLogEntry }) {
  const config = agentConfig[log.agent];
  const Icon = config.icon;

  const typeStyles = {
    thought: "border-l-blue-500/50",
    action: "border-l-yellow-500/50",
    result: "border-l-green-500/50",
    error: "border-l-red-500/50",
  };

  return (
    <div
      className={cn(
        "flex gap-3 border-l-2 py-3 pl-4 pr-2",
        typeStyles[log.type]
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={cn(config.bgColor, config.color)}>
          <Icon className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium", config.color)}>
            {config.name}
          </span>
          <Badge variant="outline" className="text-xs">
            {log.type}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm text-foreground/90">
          {log.content}
        </p>
      </div>
    </div>
  );
}

function TerminalFeed({ logs }: { logs: AgentLogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full rounded-lg border bg-black/95 font-mono text-sm">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs text-white/60">Agent Terminal</span>
      </div>
      <ScrollArea className="h-[calc(100%-40px)]" ref={scrollRef}>
        <div className="p-4 space-y-2">
          {logs.length === 0 ? (
            <div className="text-white/40">
              Waiting for agent activity...
              <span className="cursor-blink" />
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-white/40 shrink-0">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span
                  className={cn(
                    "shrink-0",
                    log.agent === "manager"
                      ? "text-blue-400"
                      : log.agent === "developer"
                      ? "text-green-400"
                      : "text-gray-400"
                  )}
                >
                  [{log.agent.toUpperCase()}]
                </span>
                <span
                  className={cn(
                    log.type === "error"
                      ? "text-red-400"
                      : log.type === "result"
                      ? "text-green-300"
                      : "text-white/90"
                  )}
                >
                  {log.content}
                </span>
              </div>
            ))
          )}
          {logs.length > 0 && (
            <div className="text-white/40">
              <span className="cursor-blink" />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function StatusPanel({ state }: { state: AgentState }) {
  const status = statusConfig[state.status];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Status</CardTitle>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.issueDetail && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Issue</p>
            <p className="text-sm text-muted-foreground truncate">
              {state.issueDetail.title}
            </p>
          </div>
        )}

        {state.currentAgent && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">
              {agentConfig[state.currentAgent].name} is working...
            </span>
          </div>
        )}

        {state.fixPlan && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Fix Plan</p>
            <div className="space-y-1">
              {state.fixPlan.steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2 text-sm">
                  {index < (state.proposedFix?.diff.length || 0) ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border" />
                  )}
                  <span className="truncate">{step.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.testStatus && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Test Results</p>
            <div className="flex items-center gap-4 text-sm">
              {state.testStatus.passed ? (
                <span className="flex items-center gap-1 text-green-500">
                  <CheckCircle className="h-4 w-4" />
                  {state.testStatus.testsPassed} passed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle className="h-4 w-4" />
                  {state.testStatus.testsFailed} failed
                </span>
              )}
            </div>
          </div>
        )}

        {state.error && (
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{state.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AgentWorkspace({ agentState, className }: AgentWorkspaceProps) {
  return (
    <div className={cn("flex h-full flex-col gap-4", className)}>
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold">Agent Workspace</h2>
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="terminal" className="h-full flex flex-col">
            <TabsList>
              <TabsTrigger value="terminal">
                <Terminal className="mr-2 h-4 w-4" />
                Terminal
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Bot className="mr-2 h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>
            <TabsContent value="terminal" className="flex-1 mt-4">
              <TerminalFeed logs={agentState.logs} />
            </TabsContent>
            <TabsContent value="timeline" className="flex-1 mt-4 overflow-hidden">
              <Card className="h-full">
                <ScrollArea className="h-full">
                  <div className="divide-y">
                    {agentState.logs.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No agent activity yet. Submit a GitHub issue URL to get started.
                      </div>
                    ) : (
                      agentState.logs.map((log, index) => (
                        <LogEntry key={index} log={log} />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <StatusPanel state={agentState} />
        </div>
      </div>
    </div>
  );
}
