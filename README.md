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
- `decision-tapestry help` - Show all commands

## Documentation

- [Installation Guide](docs/installation.md) - Detailed setup options
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions
- [Development Guide](docs/development.md) - Contributing and automation
- [Collaboration Charter](docs/collaboration-charter.md) - Team workflow principles

## Features

✅ **Interactive Dashboard** - Visual decision map with search and filtering  
✅ **Dark/Light Themes** - Automatic system preference detection  
✅ **Real-time Updates** - Live sync across team members  
✅ **AI-Powered Planning** - Context-aware project onboarding  
✅ **Quality Automation** - Pre-commit hooks and CI/CD  
✅ **Historical Analysis** - Extract decisions from existing codebases  

---

**Requirements:** Node.js 20+ | **License:** ISC | **Feedback:** [GitHub Issues](https://github.com/govbarnesy/decision-tapestry/issues)