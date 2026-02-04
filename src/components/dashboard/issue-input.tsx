"use client";

import { useState } from "react";
import { Send, Loader2, Github, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface IssueInputProps {
  onSubmit: (issueUrl: string) => Promise<void>;
  isProcessing: boolean;
  className?: string;
}

const GITHUB_ISSUE_REGEX =
  /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)\/?$/;

export function IssueInput({
  onSubmit,
  isProcessing,
  className,
}: IssueInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setError("Please enter a GitHub issue URL");
      return false;
    }

    if (!GITHUB_ISSUE_REGEX.test(value)) {
      setError(
        "Invalid GitHub issue URL. Expected format: https://github.com/owner/repo/issues/123"
      );
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUrl(url)) return;
    if (isProcessing) return;

    try {
      await onSubmit(url);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process issue");
    }
  };

  const parseIssueUrl = (value: string) => {
    const match = value.match(GITHUB_ISSUE_REGEX);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        issueNumber: parseInt(match[3], 10),
      };
    }
    return null;
  };

  const parsedUrl = parseIssueUrl(url);

  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="issue-url" className="text-sm font-medium">
              GitHub Issue URL
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="issue-url"
                  type="url"
                  placeholder="https://github.com/owner/repo/issues/123"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  className={cn(
                    "pl-10",
                    error && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={isProcessing}
                />
              </div>
              <Button type="submit" disabled={isProcessing || !url.trim()}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {parsedUrl && !error && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Detected Issue:</p>
              <p className="text-muted-foreground">
                Repository: {parsedUrl.owner}/{parsedUrl.repo}
                <br />
                Issue: #{parsedUrl.issueNumber}
              </p>
            </div>
          )}
        </form>

        <div className="mt-4 text-xs text-muted-foreground">
          <p>
            Paste a GitHub issue URL and our AI agents will analyze it, create a
            fix plan, and generate a pull request.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
