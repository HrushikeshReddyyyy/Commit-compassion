# Commit Companion

An autonomous multi-agent GitHub maintainer that analyzes issues and creates pull requests using AI.

## Overview

Commit Companion is a Next.js application that leverages LangGraph.js to orchestrate two AI agents (Manager and Developer) that collaborate to resolve GitHub issues automatically. Simply paste a GitHub issue URL, and watch as the agents analyze the problem, create a fix plan, and generate code changes.

## Features

### Dashboard UI
- **Collapsible Sidebar** - Manage active repositories with an intuitive sidebar interface
- **Agent Workspace** - Live terminal feed showing real-time agent thoughts and actions
- **Timeline View** - Visual timeline of agent activities with status indicators
- **Issue Input** - GitHub Issue URL input with validation and preview

### Multi-Agent System (LangGraph.js)
- **AgentState** - Centralized state tracking for:
  - `issueDetail` - Parsed GitHub issue information
  - `codeContext` - Relevant files and project structure
  - `proposedFix` - Generated code changes and diffs
  - `testStatus` - Test execution results

- **ManagerAgent** - The planning agent that:
  - Parses and understands GitHub issues
  - Searches the codebase for relevant files
  - Creates detailed, actionable fix plans

- **DeveloperAgent** - The implementation agent that:
  - Takes fix plans from the Manager
  - Generates precise Git diffs
  - Creates commit messages and branch names

### Database (Supabase + pgvector)
- **sessions** - Stores agent execution logs and results
- **repo_embeddings** - Vector embeddings for semantic code search
- **match_documents** - PostgreSQL function for similarity queries

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI (Radix primitives)
- **Agent Orchestration**: LangGraph.js
- **LLM**: OpenAI GPT-4
- **Database**: Supabase (PostgreSQL + pgvector)
- **Real-time**: Server-Sent Events (SSE)

## Project Structure

```
src/
├── agents/                     # LangGraph agent system
│   ├── state.ts               # AgentState annotation & types
│   ├── manager.ts             # ManagerAgent node
│   ├── developer.ts           # DeveloperAgent node
│   ├── graph.ts               # LangGraph workflow definition
│   └── index.ts               # Agent exports
├── app/
│   ├── api/agents/execute/    # API routes
│   │   ├── route.ts           # POST/GET for agent execution
│   │   └── stream/route.ts    # SSE streaming endpoint
│   ├── globals.css            # Global styles & CSS variables
│   ├── layout.tsx             # Root layout with dark mode
│   └── page.tsx               # Main dashboard page
├── components/
│   ├── dashboard/             # Dashboard-specific components
│   │   ├── sidebar.tsx        # Repository sidebar
│   │   ├── agent-workspace.tsx # Terminal & timeline views
│   │   ├── issue-input.tsx    # GitHub URL input
│   │   └── index.ts           # Component exports
│   ├── ui/                    # Shadcn UI components
│   └── theme-provider.tsx     # Dark/light mode provider
├── lib/
│   ├── supabase/              # Supabase client & types
│   │   ├── client.ts          # Browser & server clients
│   │   ├── types.ts           # Database type definitions
│   │   └── index.ts           # Supabase exports
│   └── utils.ts               # Utility functions (cn)
└── types/
    └── index.ts               # Shared TypeScript types

supabase/
└── schema.sql                 # Database schema with pgvector
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HrushikeshReddyyyy/Commit-compassion.git
   cd Commit-compassion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:
   ```env
   # OpenAI API Key for LangGraph agents
   OPENAI_API_KEY=your_openai_api_key_here

   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # GitHub Token for API access
   GITHUB_TOKEN=your_github_personal_access_token
   ```

4. **Set up the database**

   Run the SQL schema in your Supabase SQL editor:
   ```bash
   # Copy contents of supabase/schema.sql and execute in Supabase Dashboard
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Add a Repository** - Click "Add Repository" in the sidebar to connect a GitHub repo
2. **Paste Issue URL** - Enter a GitHub issue URL (e.g., `https://github.com/owner/repo/issues/123`)
3. **Watch the Agents** - The terminal feed shows real-time agent activity:
   - Manager Agent analyzes the issue
   - Manager Agent identifies relevant files
   - Manager Agent creates a fix plan
   - Developer Agent implements the changes
   - Developer Agent generates a PR-ready diff

## API Endpoints

### POST `/api/agents/execute`
Start agent workflow for a GitHub issue.

**Request:**
```json
{
  "issueUrl": "https://github.com/owner/repo/issues/123"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid",
  "message": "Agent workflow started"
}
```

### GET `/api/agents/execute?sessionId=uuid`
Get the status of an agent execution session.

### GET `/api/agents/execute/stream?issueUrl=...`
Server-Sent Events endpoint for real-time agent updates.

## Database Schema

### sessions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| issue_url | TEXT | GitHub issue URL |
| repo_owner | TEXT | Repository owner |
| repo_name | TEXT | Repository name |
| issue_number | INTEGER | Issue number |
| status | TEXT | pending/running/completed/failed |
| agent_logs | JSONB | Array of agent log entries |
| proposed_fix | JSONB | Generated fix details |
| pr_url | TEXT | Created PR URL |

### repo_embeddings
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| repo_owner | TEXT | Repository owner |
| repo_name | TEXT | Repository name |
| file_path | TEXT | File path in repo |
| content | TEXT | File content |
| embedding | vector(1536) | OpenAI embedding |

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding New UI Components

This project uses Shadcn UI. To add new components:

```bash
npx shadcn-ui@latest add [component-name]
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Sidebar   │  │ Issue Input │  │   Agent Workspace   │  │
│  │             │  │             │  │  ┌───────┬───────┐  │  │
│  │  Repos List │  │  URL Input  │  │  │Terminal│Status │  │  │
│  │             │  │  Validation │  │  │ Feed  │ Panel │  │  │
│  └─────────────┘  └─────────────┘  │  └───────┴───────┘  │  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ SSE / REST
┌─────────────────────────────────────────────────────────────┐
│                      API Routes                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │            /api/agents/execute                          ││
│  │  POST: Start workflow  │  GET: Get session status       ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │            /api/agents/execute/stream (SSE)             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LangGraph Workflow                        │
│                                                             │
│  ┌──────────┐         ┌──────────────┐         ┌─────────┐ │
│  │  START   │────────▶│ManagerAgent  │────────▶│Developer│ │
│  │          │         │              │         │  Agent  │ │
│  └──────────┘         │ • Parse Issue│         │         │ │
│                       │ • Find Files │         │• Gen Diff│ │
│                       │ • Fix Plan   │         │• Commit  │ │
│                       └──────────────┘         └────┬────┘ │
│                                                     │      │
│                                                     ▼      │
│                                                 ┌───────┐  │
│                                                 │  END  │  │
│                                                 └───────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Supabase                               │
│  ┌─────────────────┐        ┌─────────────────────────────┐ │
│  │    sessions     │        │      repo_embeddings        │ │
│  │                 │        │                             │ │
│  │ • Agent logs    │        │ • File content              │ │
│  │ • Fix results   │        │ • Vector embeddings         │ │
│  │ • PR URLs       │        │ • Semantic search           │ │
│  └─────────────────┘        └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [LangGraph.js](https://github.com/langchain-ai/langgraphjs) - Agent orchestration framework
- [Shadcn UI](https://ui.shadcn.com/) - Beautiful UI components
- [Supabase](https://supabase.com/) - Backend as a Service with pgvector
- [Next.js](https://nextjs.org/) - React framework
