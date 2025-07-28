# Decision Tapestry v1.8.0 Release Notes

## 🚀 Major Feature: GitHub-Native Backend

Decision Tapestry can now run entirely on GitHub's infrastructure! This release introduces a complete GitHub-native workflow that eliminates the need for local `decisions.yml` files.

### ✨ New Features

#### GitHub Issues as Decisions

- **Structured Issue Templates**: New GitHub issue template for creating architectural decisions
- **Native GitHub Features**: Leverage comments, labels, milestones, and assignees
- **Real-time Sync**: Decisions update instantly across all viewers via webhooks
- **Zero Configuration**: Works with any GitHub repository immediately

#### Migration Tool

```bash
decision-tapestry migrate-to-github
```

- Interactive CLI to migrate existing `decisions.yml` to GitHub Issues
- Preserves all metadata, relationships, and history
- Creates mapping file for reference updates
- Supports dry-run mode for preview

#### GitHub Projects v2 Integration

- Organize decisions using GitHub Projects
- Custom fields for decision metadata
- Multiple views (Kanban, Table, Timeline)
- Advanced filtering and sorting

#### Dashboard Enhancements

- Works seamlessly with GitHub backend
- No local file dependencies
- Caches data for performance
- Real-time updates via webhooks

### 🛠️ Technical Improvements

- **New API Module**: `GitHubDecisionsAPI` for complete GitHub integration
- **GraphQL Support**: Comprehensive queries for Projects v2
- **Dashboard Adapter**: Drop-in replacement for local file reading
- **GitHub App Manifest**: Easy authentication setup

### 📚 Documentation

- Complete guide for GitHub-native workflow
- Migration instructions from local files
- Best practices for GitHub-based decision tracking
- Examples of cross-repository decision management

### 🔄 Migration Path

1. Install the latest version:

   ```bash
   npm install -g decision-tapestry@1.8.0
   ```

2. Run the migration tool:

   ```bash
   decision-tapestry migrate-to-github
   ```

3. Follow the interactive prompts to:
   - Authenticate with GitHub
   - Select your repository
   - Preview the migration
   - Create GitHub issues

4. Update your workflow to use GitHub:
   ```bash
   decision-tapestry start --github
   ```

### 💡 Benefits

- **Zero Configuration**: No setup required
- **Better Collaboration**: Native GitHub features
- **Version Control**: Automatic with GitHub
- **Cross-Repository**: Track decisions across projects
- **Real-time Updates**: Webhook-based synchronization
- **Familiar Interface**: Use GitHub's UI for management

### 🔗 Compatibility

- Backward compatible with existing `decisions.yml` files
- Can run in hybrid mode (local + GitHub)
- Supports export from GitHub back to YAML

### 🙏 Acknowledgments

This release represents a major simplification of Decision Tapestry, transforming it from a tool requiring local configuration into a pure visualization layer on top of GitHub's robust infrastructure.

---

**Full Changelog**: https://github.com/govbarnesy/decision-tapestry/compare/v1.7.0...v1.8.0
