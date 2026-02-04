export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          issue_url: string;
          repo_owner: string;
          repo_name: string;
          issue_number: number;
          status: "pending" | "running" | "completed" | "failed";
          agent_logs: AgentLog[];
          proposed_fix: string | null;
          pr_url: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          issue_url: string;
          repo_owner: string;
          repo_name: string;
          issue_number: number;
          status?: "pending" | "running" | "completed" | "failed";
          agent_logs?: AgentLog[];
          proposed_fix?: string | null;
          pr_url?: string | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          issue_url?: string;
          repo_owner?: string;
          repo_name?: string;
          issue_number?: number;
          status?: "pending" | "running" | "completed" | "failed";
          agent_logs?: AgentLog[];
          proposed_fix?: string | null;
          pr_url?: string | null;
          error_message?: string | null;
        };
      };
      repo_embeddings: {
        Row: {
          id: string;
          created_at: string;
          repo_owner: string;
          repo_name: string;
          file_path: string;
          content: string;
          embedding: number[];
          metadata: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          repo_owner: string;
          repo_name: string;
          file_path: string;
          content: string;
          embedding: number[];
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          repo_owner?: string;
          repo_name?: string;
          file_path?: string;
          content?: string;
          embedding?: number[];
          metadata?: Json;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
          filter_repo_owner: string;
          filter_repo_name: string;
        };
        Returns: {
          id: string;
          file_path: string;
          content: string;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}

export interface AgentLog {
  timestamp: string;
  agent: "manager" | "developer" | "system";
  type: "thought" | "action" | "result" | "error";
  content: string;
}
