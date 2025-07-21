#!/usr/bin/env node

/**
 * Presentation to Gallery Converter
 * Converts standalone presentation scripts into proper gallery sets
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createGallerySet } from './gallery-set-helper.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Convert a presentation script to gallery format
 * @param {string} presentationPath - Path to the presentation script
 * @param {Object} options - Conversion options
 */
export async function convertPresentationToGallery(presentationPath, options = {}) {
  const {
    name,
    description,
    icon,
    deleteOriginal = false
  } = options;

  console.log(`📋 Converting presentation: ${presentationPath}`);

  // Read the presentation script
  const scriptContent = await fs.readFile(presentationPath, 'utf-8');
  
  // Extract metadata from the script
  const metadata = extractMetadata(scriptContent);
  
  // Create modified script that saves to gallery
  const modifiedScript = await createGalleryScript(scriptContent, metadata);
  
  // Run the modified script to generate gallery files
  const slideFiles = await runPresentationScript(modifiedScript);
  
  // Create gallery set
  const set = await createGallerySet({
    name: name || metadata.name || 'Untitled Presentation',
    description: description || metadata.description || '',
    icon: icon || metadata.icon || '📊',
    slideIds: slideFiles
  });
  
  console.log(`✅ Created gallery set: ${set.name}`);
  console.log(`   Slides: ${slideFiles.length}`);
  
  // Delete original if requested
  if (deleteOriginal) {
    await fs.unlink(presentationPath);
    console.log(`🗑️  Removed original file: ${presentationPath}`);
  }
  
  return set;
}

/**
 * Extract metadata from presentation script
 */
function extractMetadata(scriptContent) {
  const metadata = {
    name: 'Presentation',
    description: '',
    icon: '📊',
    slideCount: 0
  };
  
  // Extract name from console.log patterns
  const nameMatch = scriptContent.match(/Creating.*?([A-Za-z\s]+)\s+Presentation/i);
  if (nameMatch) {
    metadata.name = nameMatch[1].trim();
  }
  
  // Extract icon
  const iconMatch = scriptContent.match(/console\.log\(['"]([🏛️📊🚀💡✨])/u);
  if (iconMatch) {
    metadata.icon = iconMatch[1];
  }
  
  // Count slides
  const slideMatches = scriptContent.match(/Creating slide \d+/g);
  metadata.slideCount = slideMatches ? slideMatches.length : 0;
  
  return metadata;
}

/**
 * Create a modified script that saves to gallery
 */
async function createGalleryScript(originalScript, metadata) {
  // Create a wrapper that intercepts canvas.showHTML calls
  const wrapper = `
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const galleryPath = path.join(process.cwd(), 'ai-canvas-gallery', 'public');
const slideFiles = [];

// Override canvas.showHTML to save to gallery
const originalShowHTML = canvas.showHTML;
canvas.showHTML = async function(html) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = \`canvas-html-\${timestamp}.html\`;
  const filePath = path.join(galleryPath, filename);
  
  // Wrap HTML in proper document structure
  const fullHtml = \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gallery Slide</title>
    <style>
      body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    </style>
</head>
<body>
    \${html}
</body>
</html>\`;
  
  await fs.writeFile(filePath, fullHtml);
  slideFiles.push(filename);
  console.log(\`   💾 Saved to gallery: \${filename}\`);
  
  // Still call original for live preview if needed
  if (typeof originalShowHTML === 'function') {
    return originalShowHTML.call(this, html);
  }
};

// At the end, output the slide files
process.on('beforeExit', () => {
  console.log('GALLERY_FILES:' + JSON.stringify(slideFiles));
});

${originalScript}
`;
  
  return wrapper;
}

/**
 * Run the presentation script and capture generated files
 */
async function runPresentationScript(script) {
  // Save script to temp file
  const tempFile = path.join(process.cwd(), `.temp-presentation-${Date.now()}.mjs`);
  await fs.writeFile(tempFile, script);
  
  try {
    // Run the script and capture output
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync(`node ${tempFile}`);
    
    // Extract gallery files from output
    const filesMatch = stdout.match(/GALLERY_FILES:(\[.*?\])/);
    if (filesMatch) {
      return JSON.parse(filesMatch[1]);
    }
    
    // Fallback: look for saved files in output
    const fileMatches = [...stdout.matchAll(/Saved to gallery: (canvas-html-[\w-]+\.html)/g)];
    return fileMatches.map(match => match[1]);
    
  } finally {
    // Clean up temp file
    await fs.unlink(tempFile).catch(() => {});
  }
}

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const presentationPath = process.argv[2];
  const options = {
    name: process.argv[3],
    deleteOriginal: process.argv.includes('--delete')
  };
  
  if (!presentationPath) {
    console.error('Usage: node presentation-to-gallery.mjs <presentation-path> [name] [--delete]');
    process.exit(1);
  }
  
  convertPresentationToGallery(presentationPath, options)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

export default { convertPresentationToGallery };