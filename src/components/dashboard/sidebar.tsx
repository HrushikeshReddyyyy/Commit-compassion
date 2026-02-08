"use client";

import { useState } from "react";
import { GitBranch, Plus, Settings, ChevronRight, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { Repository } from "@/types";

interface SidebarProps {
  repositories: Repository[];
  activeRepoId?: string;
  onRepoSelect: (repo: Repository) => void;
  onAddRepo: () => void;
}

export function Sidebar({
  repositories,
  activeRepoId,
  onRepoSelect,
  onAddRepo,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <span className="font-semibold">Repositories</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed ? "" : "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Repository List */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-1">
          {repositories.map((repo) => (
            <Button
              key={repo.id}
              variant={activeRepoId === repo.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                collapsed ? "px-2" : "px-3"
              )}
              onClick={() => onRepoSelect(repo)}
            >
              <Folder className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <div className="ml-2 flex flex-1 items-center justify-between overflow-hidden">
                  <span className="truncate text-sm">{repo.name}</span>
                  {repo.isPrivate && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Private
                    </Badge>
                  )}
                </div>
              )}
            </Button>
          ))}

          {repositories.length === 0 && !collapsed && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No repositories yet.
              <br />
              Add one to get started.
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Footer Actions */}
      <div className="p-2">
        <Button
          variant="outline"
          className={cn("w-full", collapsed ? "px-2" : "")}
          onClick={onAddRepo}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Add Repository</span>}
        </Button>
      </div>

      {!collapsed && (
        <>
          <Separator />
          <div className="p-2">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="h-4 w-4" />
              <span className="ml-2">Settings</span>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
