# Decision Tapestry - Claude Code Integration Guide

## Overview

Decision Tapestry now includes real-time activity tracking that shows what you're currently working on in the decision graph. This creates a live development experience where you can watch your progress unfold visually.

## Quick Start for Development Sessions

### 1. Start the Dashboard

```bash
npm start
# Opens at http://localhost:8080
```

### 2. Enable Activity Tracking (Optional)

```bash
# Start activity tracking for this coding session
decision-tapestry activity start "Working on feature X"

# Or use the integrated Claude Code monitoring
node claude-code-integration/monitor.mjs
```

### 3. Code with Visual Feedback

As you work with Claude Code, your activities will automatically appear in the dashboard:

- 🟢 **Green**: Working (editing files, building features)
- 🟠 **Orange**: Debugging (fixing errors, troubleshooting)
- 🔵 **Blue**: Testing (running tests, validation)
- 🟣 **Purple**: Reviewing (code review, documentation)

## What You'll See in Real-Time

### Decision Map Indicators

- **Colored borders** on decision nodes showing current activity
- **Background highlighting** (50% opacity of the border color)
- **Agent badges** showing which agent is working on what
- **Activity labels** with current task descriptions

### Activity Panels

- **Agent Status Panel**: Live view of all active agents
- **Activity Timeline**: Chronological history of development activities
- **Analytics**: Activity patterns and productivity metrics

## Commands for Manual Activity Tracking

```bash
# Basic activity commands
decision-tapestry activity start "Feature development"
decision-tapestry activity end
decision-tapestry activity status

# Context-aware activities (auto-maps to decisions)
decision-tapestry activity context "Implementing authentication"
decision-tapestry activity toggle  # Enable/disable tracking
```

## Integration with Development Workflow

### For Individual Development

1. Start Decision Tapestry dashboard
2. Begin coding - activities auto-detected through file changes
3. Watch your progress visualized in real-time
4. Use activity history to track productivity patterns

### For Team Collaboration

1. Each developer can broadcast their activities
2. See team coordination in the decision graph
3. Identify dependencies and blockers visually
4. Track multi-person feature development

### For AI-Assisted Development

- Claude Code activities are automatically tracked
- Tool usage maps to activity states (Edit=working, Bash=testing, etc.)
- File changes are linked to relevant decisions
- Multi-agent coordination shows distributed AI development

## Technical Details

### Activity API

```javascript
// POST /api/activity
{
  "agentId": "your-name",
  "state": "working|debugging|testing|reviewing|idle",
  "decisionId": 123,
  "taskDescription": "What you're doing"
}

// GET /api/activity?includeHistory=true
// GET /api/activity/analytics?timeRange=1h
```

### File-to-Decision Mapping

The system automatically maps file changes to decisions using `affected_components`:

```yaml
# In decisions.yml
- id: 42
  title: "Add Authentication"
  affected_components:
    - src/auth/
    - server/middleware/auth.js
```

### WebSocket Real-Time Updates

All activity changes broadcast via WebSocket for immediate dashboard updates.

## Best Practices

### 1. Decision-Driven Development

- Create decisions BEFORE starting major work
- Link file changes to decisions via `affected_components`
- Use descriptive task descriptions in activities

### 2. Activity State Guidelines

- **working**: Building new features, writing code
- **debugging**: Fixing bugs, troubleshooting issues
- **testing**: Running tests, validation, QA
- **reviewing**: Code review, documentation, analysis
- **idle**: Between tasks, meetings, breaks

### 3. Team Coordination

- Use consistent agent naming (your name/initials)
- Include decision IDs in activity descriptions
- End activities when switching contexts
- Review activity analytics for productivity insights

## Troubleshooting

### Dashboard Not Updating

1. Check server is running at localhost:8080
2. **Refresh browser** to load latest components and CSS changes
3. Check browser console for WebSocket connection errors
4. Verify activities are being sent: `curl localhost:8080/api/activity`
5. **CSS/styling changes require browser refresh** - only activity data updates in real-time

### Activities Not Auto-Detecting

1. Ensure Claude Code integration is enabled
2. Check file paths match `affected_components` in decisions.yml
3. Verify monitor.mjs is running if using manual integration

### Performance Issues

- Activity history is limited to 1000 entries
- Analytics queries are time-bounded
- WebSocket connections auto-reconnect
- Clear old activities: POST /api/activity with state="idle"

## Future Enhancements

This system provides the foundation for:

- Productivity analytics and reporting
- Team coordination visualization
- Automated progress tracking
- Integration with other development tools
- Multi-project activity aggregation

The meta-experience demonstrates how AI agents can coordinate development work while visualizing their own coordination process in real-time.

## UI Component Naming Conventions

- The filtering component is called "Filters" (not "Advanced Filters")
- When the user says "we shall" this indicates a permanent rule change that should be remembered
