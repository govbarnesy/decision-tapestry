#!/bin/bash

# Launch agents in separate Terminal windows with proper escaping

echo "🎭 Launching 5 agents in separate terminals..."

# Agent 1
osascript <<EOF
tell application "Terminal"
    do script "cd '$PWD' && AGENT_ID=Agent-1-SearchFilter node cli/cli.mjs agent task 'Fix search and filter panels. The panels are not showing content. Apply consistent tab button structure and style as middle/right panels. Remove analytics panel. Look at dashboard/search-panel.mjs, dashboard/enhanced-time-filter.mjs, dashboard/author-filter.mjs'"
    activate
end tell
EOF

sleep 1

# Agent 2
osascript <<EOF
tell application "Terminal"
    do script "cd '$PWD' && AGENT_ID=Agent-2-VisualTest node cli/cli.mjs agent task 'Design and implement visual test to observe agent actions in real-time. Create mechanism to watch tasks being marked as Done. Make it triggerable via CLI. Use existing agent activity system and real-time updates.'"
    activate
end tell
EOF

sleep 1

# Agent 3
osascript <<EOF
tell application "Terminal"
    do script "cd '$PWD' && AGENT_ID=Agent-3-Music node cli/cli.mjs agent task 'Plan and implement music integration using strudel.cc. Add delightful audio signaling for agent updates with comedic timing. Add demo mode button next to dark/light mode toggle. Ensure buttons fit tab header size.'"
    activate
end tell
EOF

sleep 1

# Agent 4
osascript <<EOF
tell application "Terminal"
    do script "cd '$PWD' && AGENT_ID=Agent-4-Mobile node cli/cli.mjs agent task 'Design and implement mobile-friendly view. Create mobile menu system for panels. Make all panels resizable on desktop. Ensure responsive design across all device sizes.'"
    activate
end tell
EOF

sleep 1

# Agent 5
osascript <<EOF
tell application "Terminal"
    do script "cd '$PWD' && AGENT_ID=Agent-5-Architecture node cli/cli.mjs agent task 'Implement feature to toggle on/off component types in architecture view. Add UI controls to selectively show/hide different component categories. Update dashboard/decision-map.mjs architecture visualization.'"
    activate
end tell
EOF

echo "✅ All agents launched!"
echo ""
echo "📊 Monitor progress:"
echo "  • Dashboard: http://localhost:8080" 
echo "  • Terminal: node cli/cli.mjs agent monitor"
echo ""
echo "  Refresh your browser to see UI updates!"