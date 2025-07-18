#!/usr/bin/env node

/**
 * Create Gallery Set Script
 * 
 * Usage:
 * node create-gallery-set.mjs --name "My Presentation" --description "A great presentation" --slides "slide1.html,slide2.html"
 * node create-gallery-set.mjs --all-public
 * node create-gallery-set.mjs --from-script presentation-opengov-cpo.mjs
 */

import { createGallerySet, createSetFromScript, quickCreate } from './claude-code-integration/gallery-set-helper.mjs';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--name':
    case '-n':
      options.name = args[++i];
      break;
    case '--description':
    case '-d':
      options.description = args[++i];
      break;
    case '--icon':
    case '-i':
      options.icon = args[++i];
      break;
    case '--slides':
    case '-s':
      options.slideIds = args[++i].split(',');
      break;
    case '--pattern':
    case '-p':
      options.pattern = args[++i];
      options.autoDetect = true;
      break;
    case '--all-public':
      // Special flag to create set from all public slides
      quickCreate.allPublic().then(set => {
        console.log('✨ Gallery set created successfully!');
        console.log(`   Name: ${set.name}`);
        console.log(`   Slides: ${set.slideIds.length}`);
        process.exit(0);
      }).catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
      });
      return;
    case '--from-script':
      // Create from a presentation script
      const scriptPath = args[++i];
      createSetFromScript(scriptPath, options).then(set => {
        console.log('✨ Gallery set created from script!');
        console.log(`   Name: ${set.name}`);
        console.log(`   Slides: ${set.slideIds.length}`);
        process.exit(0);
      }).catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
      });
      return;
    case '--help':
    case '-h':
      console.log(`
Gallery Set Creator

Usage:
  node create-gallery-set.mjs [options]

Options:
  --name, -n <name>           Set name (required unless using special flags)
  --description, -d <desc>    Set description
  --icon, -i <emoji>          Set icon (default: 📊)
  --slides, -s <list>         Comma-separated list of slide filenames
  --pattern, -p <pattern>     Auto-detect slides matching pattern
  --all-public                Create set from all public slides
  --from-script <path>        Create set from presentation script
  --help, -h                  Show this help

Examples:
  # Create a custom set
  node create-gallery-set.mjs -n "Q4 Roadmap" -d "Product roadmap" -i "🚀"
  
  # Create from all public slides
  node create-gallery-set.mjs --all-public
  
  # Create from specific slides
  node create-gallery-set.mjs -n "Demo" -s "slide1.html,slide2.html"
  
  # Auto-detect slides by pattern
  node create-gallery-set.mjs -n "OpenGov Demos" -p "opengov|demo"
  
  # Create from presentation script
  node create-gallery-set.mjs --from-script presentation-opengov-cpo.mjs
      `);
      process.exit(0);
    default:
      if (arg.startsWith('-')) {
        console.error(`Unknown option: ${arg}`);
        console.log('Use --help for usage information');
        process.exit(1);
      }
  }
}

// Validate options
if (!options.name && !options.autoDetect) {
  console.error('❌ Error: Set name is required');
  console.log('Use --help for usage information');
  process.exit(1);
}

// Create the gallery set
createGallerySet(options)
  .then(set => {
    console.log('✨ Gallery set created successfully!');
    console.log(`   Name: ${set.name}`);
    console.log(`   Icon: ${set.icon}`);
    console.log(`   Slides: ${set.slideIds.length}`);
    if (set.description) {
      console.log(`   Description: ${set.description}`);
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });