#!/bin/bash

# Launch demo agents in separate Terminal windows
echo "🚀 Launching demo agents..."

# Agent 1
osascript -e 'tell application "Terminal" to do script "cd \"'"$PWD"'\" && node cli/demo-agent.mjs Agent-1-SearchFilter \"Fixing search and filter panels\""' &

# Agent 2
osascript -e 'tell application "Terminal" to do script "cd \"'"$PWD"'\" && node cli/demo-agent.mjs Agent-2-VisualTest \"Creating visual test system\""' &

# Agent 3
osascript -e 'tell application "Terminal" to do script "cd \"'"$PWD"'\" && node cli/demo-agent.mjs Agent-3-Music \"Implementing music integration\""' &

echo "✅ Demo agents launched!"
echo "📊 Monitor with: node cli/cli.mjs agent monitor"