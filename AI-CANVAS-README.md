# AI Canvas System Documentation

## Overview

The AI Canvas is an ephemeral visual communication system that displays content in real-time without automatic saving. Users can explicitly save visuals to the gallery when needed.

## How It Works

### 1. Ephemeral Display
- Content sent via `canvas.showHTML()` or other canvas methods appears immediately in the dashboard
- Nothing is saved automatically - all content is ephemeral by default
- Content persists in the browser session until cleared or replaced

### 2. Saving to Gallery
- Click the **Save** button in the AI Canvas panel to save the current visual
- Toggle between **Public** (committed to repo) and **Private** (local only)
- Saved files go to:
  - Public: `/ai-canvas-gallery/public/`
  - Private: `/ai-canvas-gallery/private/`

### 3. Gallery Sets
- Saved visuals can be organized into presentation sets
- Use the Gallery tab to create and manage sets
- Sets are stored in `/settings/gallery-sets.json`

## File Organization

```
decision-tapestry/
├── ai-canvas-gallery/
│   ├── public/          # Saved public visuals (committed to repo)
│   ├── private/         # Saved private visuals (gitignored)
│   └── sets/           # (Future: Set-specific metadata)
├── scripts/
│   ├── presentations/   # Presentation generation scripts
│   ├── tests/          # Test scripts
│   └── demos/          # Demo scripts
└── claude-code-integration/
    ├── ai-canvas-helper.mjs         # Helper for sending to canvas
    └── presentation-to-gallery.mjs  # Convert presentations to gallery format
```

## Usage

### For AI/Claude Code
```javascript
import canvas from './claude-code-integration/ai-canvas-helper.mjs';

// Display content ephemerally
await canvas.showHTML('<h1>Hello World</h1>');
await canvas.showCode('console.log("Hello");', 'javascript');
await canvas.showDiagram(svgContent);
```

### For Users
1. Content appears automatically in the AI Canvas panel
2. Click **Save** to preserve a visual to the gallery
3. Use **Public/Private** toggle to control visibility
4. Access saved visuals through the Gallery tab

## Key Features

- **No Auto-Save**: Content only saved when explicitly requested
- **Privacy Control**: Choose between public and private storage
- **Gallery Integration**: Saved visuals can be organized into sets
- **Clean Repository**: All generated files organized in proper directories

## Keyboard Shortcuts

- `G` - Toggle grid view
- `F` - Toggle fullscreen
- `←/→` - Navigate through visual history
- `Esc` - Exit fullscreen/grid view

## API Endpoints

- `POST /api/canvas/show` - Display content (ephemeral)
- `POST /api/canvas/save` - Save current visual to gallery
- `GET /api/gallery/sets` - List gallery sets
- `POST /api/gallery/sets` - Create/update gallery sets