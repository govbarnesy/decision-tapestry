# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Real-time Dashboard Updates**: Complete real-time synchronization across all dashboard panels
  - Live decision status updates without browser refresh
  - Real-time task status changes in detail panel
  - Agent activity updates with visual indicators and auto-selection
  - WebSocket-based communication for instant updates
- **Enhanced Activity Tracking**: Comprehensive agent activity visualization
  - Activity badges with animated indicators on decision nodes
  - Activity timeline with agent state tracking
  - Auto-focus on decisions when agents become active
  - Real-time activity broadcasting across all connected clients
- **Improved File Watching**: Robust file change detection system
  - Replaced unreliable `fs.watch()` with `chokidar` for cross-platform reliability
  - Added polling fallback for extreme cases
  - Manual refresh endpoint (`/api/refresh`) as backup
  - Proper debouncing and stability checks
- **Visual Enhancements**: Better user experience and feedback
  - Multi-font support in vis.js network nodes for activity badges
  - Improved node styling with consistent formatting
  - Activity state animations and visual indicators
  - Better error handling and user feedback

### Fixed
- **File Watcher Reliability**: Solved issues with file changes not triggering dashboard updates
- **Lit Component Reactivity**: Fixed task updates not appearing in real-time
- **vis.js Configuration**: Removed unsupported properties causing console warnings
- **WebSocket Stability**: Improved connection handling and reconnection logic

### Changed
- **Codebase Cleanup**: Significant repository organization improvements
  - Removed redundant files (`README-old.md`, `semantic-release-test.txt`)
  - Consolidated test directories from `/tests` and `/__tests__` into single `/__tests__`
  - Cleaned up unused dependencies (nodemon, husky, lint-staged, etc.)
  - Removed debug logging from production code
  - Simplified package.json scripts
- **Architecture Improvements**: Streamlined real-time update system
  - Unified component update methods
  - Better separation of concerns in WebSocket handling
  - Improved error handling and fallback mechanisms

### Removed
- Unused development dependencies and configuration files
- Redundant HTML files and test utilities
- Excessive debug logging from production builds
- Outdated nodemon configuration

## [1.1.0] - Previous Release
- Initial dashboard implementation
- Basic decision visualization
- CLI functionality
- YAML-based decision storage