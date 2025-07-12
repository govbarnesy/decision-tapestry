# Development Guide

## Getting Started

To start the server for development, run:

```bash
npm start
```

This will start the server using `nodemon`, which will automatically restart the server when files change.

## Background Automation & Development Tools

Decision Tapestry includes several automation features to improve developer productivity:

### Development Mode with Auto-Testing
```bash
npm run dev
```
This runs the server and test watcher simultaneously for continuous feedback.

### Pre-commit Quality Checks
- Automatic linting and code quality checks run before each commit
- Set up via Husky and lint-staged
- Ensures consistent code quality across all contributions

### Continuous Integration
- GitHub Actions automatically run tests, linting, and builds on all PRs
- Semantic release automation for versioning and publishing
- Multi-platform Docker image building

### Manual Quality Commands
```bash
npm run lint:fix    # Auto-fix linting issues
npm run test:watch  # Run tests in watch mode
npm run build       # TypeScript compilation check
```

## Automated Releases

This project uses [semantic-release](https://semantic-release.gitbook.io/) for fully automated versioning, changelog generation, and publishing to npm and GitHub.

### How to Trigger a Release
- **Releases are triggered automatically** when commits are pushed to the `main` branch that follow [Conventional Commits](https://www.conventionalcommits.org/) format.
- The release process will:
  - Analyze commit messages to determine the next version.
  - Update `CHANGELOG.md` with release notes.
  - Publish the new version to npm (if configured).
  - Push changelog and version updates to GitHub.
  - Create a GitHub release with release notes.

### Manual Release (for testing)
You can run a release locally (dry run) to see what would happen:

```bash
yarn release --dry-run
```

To perform a real release (requires proper environment variables for npm and GitHub tokens):

```bash
yarn release
```

See the `package.json` for configuration details.

## How to Use the Backlog and Decision Log

All backlog items and decisions are now managed in a single file: `decisions.yml`.
- The `backlog:` section contains open tasks, ideas, and features.
- The `decisions:` section contains completed, promoted, or superseded decisions.

> **New!** For new projects, start from the provided template: `decisions.template.yml`.
> This file contains example entries and comments to help you structure your backlog and decisions.

Update your backlog and promote items to decisions as you work. No separate PRODUCT_BACKLOG.md is needed.