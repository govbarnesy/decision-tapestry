# Decision Tapestry VS Code Extension

Visualize and manage architectural decisions directly within Visual Studio Code.

## Features
- **Dashboard View:** See a visual map of architectural decisions in your project.
- **CodeLens Integration:** Quickly jump to decisions affecting the current file.
- **Decision Creation:** Add new decisions from within VS Code.
- **YAML Validation:** Validate your `decisions.yml` against the project schema.
- **Real-Time Updates:** Changes to `decisions.yml` are reflected instantly in the dashboard.

## Getting Started
1. Open your project in VS Code.
2. Make sure your project contains a `decisions.yml` file (see [Decision Tapestry](https://github.com/govbarnesy/decision-tapestry)).
3. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run `Decision Tapestry: Show Dashboard`.
4. Use CodeLens links at the top of files to see related decisions.

## Creating a New Decision
- Use the `Decision Tapestry: Create New Decision` command to add a new entry to your `decisions.yml`.

## YAML Schema Validation
- The extension validates your `decisions.yml` against the built-in schema for correctness and completeness.

## Automated Releases
This extension uses [semantic-release](https://semantic-release.gitbook.io/) for automated versioning, changelog generation, and GitHub releases.

### How to Trigger a Release
- Push commits to `main` or `release-automation` using [Conventional Commits](https://www.conventionalcommits.org/).
- The release process will:
  - Analyze commit messages to determine the next version.
  - Update `CHANGELOG.md` with release notes.
  - Push changelog and version updates to GitHub.
  - Create a GitHub release with release notes.

### Publishing to the VS Code Marketplace
- Publishing is handled by [`vsce`](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).
- To publish manually:
  ```bash
  yarn workspace decision-tapestry-vscode vsce publish
  ```
- To automate publishing, a CI workflow runs `vsce publish` with the `VSCE_PAT` secret.

## Contributing
See the main [Decision Tapestry](https://github.com/govbarnesy/decision-tapestry) repository for contribution guidelines.

## License
[MIT](../LICENSE)
