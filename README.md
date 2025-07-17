# Decision Tapestry

> Visualize and manage architectural decisions with interactive dashboards and automated workflows.

## Quick Start

### 1. Install
```bash
npm install -g decision-tapestry
```

### 2. Initialize Your Project
```bash
# For new projects
decision-tapestry init

# For existing projects (auto-analyzes your codebase)
decision-tapestry analyze
```

### 3. Start Dashboard
```bash
decision-tapestry start
```
Open http://localhost:8080 to view your decision dashboard.

---

## CLI Commands

- `decision-tapestry init` - Create decisions.yml for new projects
- `decision-tapestry analyze` - Generate decisions from existing codebase
- `decision-tapestry start` - Launch interactive dashboard
- `decision-tapestry validate` - Check decisions.yml format
- `decision-tapestry plan` - Generate AI planning prompt
- `decision-tapestry capture "title"` - Quick decision logging
- `decision-tapestry quick-task "description"` - Create decision & start agent immediately ⚡
- `decision-tapestry agent` - Manage AI agents
- `decision-tapestry help` - Show all commands

## Documentation

- [Installation Guide](docs/installation.md) - Detailed setup options
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions
- [Development Guide](docs/development.md) - Contributing and automation
- [Collaboration Charter](docs/collaboration-charter.md) - Team workflow principles

## Features

✅ **Interactive Dashboard** - Visual decision map with search and filtering  
✅ **Real-time Collaboration** - Live updates across all connected clients  
  - Instant decision and task status changes
  - Agent activity tracking with visual indicators  
  - Auto-focus on active decisions
  - WebSocket-based synchronization
✅ **Dark/Light Themes** - Automatic system preference detection  
✅ **AI-Human Collaboration** - Persistent context for AI development workflows
  - Never lose context when AI tools hit token limits
  - Real-time monitoring of AI agent activities
  - Track decisions across multiple AI conversations
  - Export project context to any AI tool
✅ **AI-Powered Planning** - Context-aware project onboarding  
✅ **Quality Automation** - Pre-commit hooks and CI/CD  
✅ **Historical Analysis** - Extract decisions from existing codebases

## 🤖 AI Development Workflow

**Stop losing hours to AI context limits.** Decision Tapestry maintains persistent project context across all your AI tool conversations.

### The Problem
- Hit Cursor's context limit and lose 3 hours of architecture discussion
- Explain the same project structure to Claude repeatedly  
- v0 forgets your design decisions from previous sessions
- Multiple AI tools give conflicting suggestions without context

### The Solution
```bash
# Track AI activity in real-time
decision-tapestry activity start

# Export context to any AI tool
decision-tapestry plan --context-export
```

**Perfect for teams using:** Cursor • Claude • v0 • Windsurf • GitHub Copilot • Lovable

### 🆕 New in v1.7.0: Enhanced Real-time Experience
- **Live Dashboard Updates**: All changes appear instantly without browser refresh
- **Agent Activity Visualization**: See who's working on what in real-time
- **Improved Reliability**: Robust file watching with automatic fallbacks
- **Better Visual Feedback**: Activity badges and animations on decision nodes  

### ⚡ Quick Tasks: From Idea to Execution in One Command
```bash
# Create decision and start agent immediately
decision-tapestry quick-task "Fix login button styling"

# With specific files
decision-tapestry qt "Refactor user auth" -f src/auth/login.js src/auth/validate.js

# With multiple tasks
decision-tapestry qt "Add profile page" -t "Create component" "Add route" "Add tests"

# High priority without agent
decision-tapestry qt "Fix production bug" -p high --no-agent
```

Quick tasks are perfect for:
- Bug fixes that need immediate attention
- Small refactoring jobs
- Feature additions with clear scope
- Experimentation and prototyping

Visual indicators (⚡) in the dashboard show which decisions were created as quick tasks.

---

**Requirements:** Node.js 20+ | **License:** ISC | **Feedback:** [GitHub Issues](https://github.com/govbarnesy/decision-tapestry/issues)