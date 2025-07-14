# Claude Code Integration

Agent-3 (Integration) - Decision #58

This module provides automatic activity detection and broadcasting for Claude Code tool usage, enabling real-time visualization of development activities in the Decision Tapestry dashboard.

## Architecture

The integration consists of three main components:

### 1. Monitor (`monitor.mjs`)
- Monitors Claude Code tool usage
- Maps file paths to decision IDs
- Detects activity states (working, debugging, testing, reviewing)
- Broadcasts activities to the Decision Tapestry server

### 2. Hook System (`claude-code-hook.mjs`)
- Provides tool interception capabilities
- Manages activity sessions
- Offers pattern detection for intelligent activity classification

### 3. CLI Integration (`activity-cli.mjs`)
- Standalone CLI for testing and manual activity management
- Integrated with main Decision Tapestry CLI

## How It Works

1. **Tool Detection**: When Claude Code uses a tool (Edit, Read, Bash, etc.), the hook system intercepts it
2. **Decision Mapping**: The monitor analyzes file paths to determine which decision the work relates to
3. **State Classification**: Based on tool type and parameters, the system classifies the activity:
   - `working`: File edits, writes, TODOs
   - `debugging`: Grep searches, error fixes
   - `testing`: Test execution, test file edits
   - `reviewing`: File reads, documentation
4. **Broadcasting**: Activities are sent to the Decision Tapestry server via the `/api/activity` endpoint

## Usage

### Via Decision Tapestry CLI

```bash
# Start activity tracking for a specific decision
decision-tapestry activity start 58

# Check current status
decision-tapestry activity status

# End tracking session
decision-tapestry activity end

# Set decision context
decision-tapestry activity context 58

# Toggle tracking on/off
decision-tapestry activity toggle off
```

### Standalone CLI

```bash
# Run from the claude-code-integration directory
node activity-cli.mjs status
node activity-cli.mjs start -d 58
node activity-cli.mjs simulate Edit -f /path/to/file.js
node activity-cli.mjs test  # Run test sequence
```

### Environment Variables

- `DECISION_TAPESTRY_URL`: Server URL (default: http://localhost:8080)
- `DISABLE_ACTIVITY_TRACKING`: Set to 'true' to disable tracking

## Integration with Claude Code

The hook system can be integrated with Claude Code's tool system:

```javascript
import { integrateWithClaudeCode } from './claude-code-hook.mjs';

// Wrap Claude Code tools with activity monitoring
const monitoredTools = integrateWithClaudeCode(claudeCodeTools);
```

## Testing

Test the integration:

```bash
# Test individual tool simulations
node monitor.mjs test-edit
node monitor.mjs test-bash
node monitor.mjs test-read
node monitor.mjs status

# Run full test sequence
node activity-cli.mjs test
```

## Activity States

- **idle**: No active work or session ended
- **working**: Active development (editing, writing files)
- **debugging**: Problem solving (searching, fixing errors)
- **testing**: Running or writing tests
- **reviewing**: Reading files, documentation

## File-to-Decision Mapping

The system automatically maps files to decisions based on `affected_components` in decisions.yml:

1. Exact path match
2. Relative path variations
3. Parent directory matching

This ensures activities are correctly associated with the relevant decision.