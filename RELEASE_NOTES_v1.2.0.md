# Decision Tapestry v1.2.0 Release Notes

## 🎉 Major Release: Enhanced Real-time Collaboration

This release transforms Decision Tapestry into a truly collaborative tool with comprehensive real-time updates and significant improvements to reliability and user experience.

## 🚀 Headline Features

### 1. **Complete Real-time Dashboard Synchronization**
- **Live Updates**: All changes to decisions and tasks appear instantly across all connected clients
- **No More Refresh**: Browser refreshing is now a thing of the past
- **Multi-user Support**: Perfect for team collaboration and pair programming sessions

### 2. **Agent Activity Tracking & Visualization**
- **Visual Indicators**: See real-time activity badges on decision nodes
- **Auto-focus**: Dashboard automatically highlights decisions when agents become active
- **Activity Timeline**: Track agent states and decision work over time
- **WebSocket Broadcasting**: Instant activity updates across all connected clients

### 3. **Bulletproof File Watching**
- **Cross-platform Reliability**: Replaced unreliable `fs.watch()` with industry-standard `chokidar`
- **Automatic Fallbacks**: Polling fallback ensures updates even in extreme scenarios
- **Manual Override**: New `/api/refresh` endpoint for guaranteed updates
- **Smart Debouncing**: Prevents update spam while maintaining responsiveness

## 🔧 Technical Improvements

### **WebSocket Infrastructure**
- Robust connection handling with automatic reconnection
- Proper error handling and graceful degradation
- Optimized message broadcasting for performance

### **Component Architecture**
- Fixed Lit component reactivity issues
- Streamlined update mechanisms
- Better separation of concerns

### **Development Experience**
- Removed 371 unused npm packages
- Consolidated test directories
- Cleaned debug logging from production code
- Simplified npm scripts and configuration

## 🐛 Bug Fixes

- **File Watcher**: Solved macOS file watching reliability issues
- **Task Updates**: Fixed real-time task status changes not appearing
- **vis.js Warnings**: Removed unsupported configuration properties
- **Memory Leaks**: Improved WebSocket connection cleanup

## 📦 What's Included

- ✅ Fully backward compatible with existing `decisions.yml` files
- ✅ No migration required for existing projects
- ✅ All existing CLI commands work unchanged
- ✅ Enhanced dashboard experience with zero configuration changes

## 🔄 Upgrade Instructions

```bash
# For global installation
npm update -g decision-tapestry

# For local project installation
npm update decision-tapestry

# Verify installation
decision-tapestry --version  # Should show 1.2.0
```

## 🎯 Usage Examples

### Real-time Collaboration
1. **Team Member A** opens dashboard: `decision-tapestry start`
2. **Team Member B** opens same URL in their browser
3. **Member A** updates a task status in `decisions.yml`
4. **Member B** sees the change instantly without refresh!

### Agent Activity Tracking
```bash
# Agent reports activity via CLI integration
curl -X POST http://localhost:8080/api/activity \
  -H "Content-Type: application/json" \
  -d '{"agentId": "developer-1", "state": "working", "decisionId": 42, "taskDescription": "Implementing authentication"}'

# All dashboard viewers see the activity badge appear on decision 42
```

### Manual Refresh (if needed)
```bash
# Force dashboard refresh for all connected clients
curl -X POST http://localhost:8080/api/refresh
```

## 🚦 Breaking Changes

**None!** This release is fully backward compatible.

## 🎉 What's Next

This release establishes the foundation for advanced collaboration features planned for v1.3.0:
- Real-time collaborative editing
- Decision discussion threads
- Advanced agent coordination patterns
- Integration with popular development tools

## 💡 Feedback

We'd love to hear about your experience with the new real-time features:
- [Report Issues](https://github.com/govbarnesy/decision-tapestry/issues)
- [Feature Requests](https://github.com/govbarnesy/decision-tapestry/discussions)
- [Join the Community](https://github.com/govbarnesy/decision-tapestry)

---

**Full Changelog**: [CHANGELOG.md](./CHANGELOG.md)  
**Documentation**: [docs/](./docs/)  
**Upgrade Guide**: This README