/**
 * Gallery Set Helper - AI Integration for Creating Presentation Sets
 * 
 * Usage:
 * import { createGallerySet } from './claude-code-integration/gallery-set-helper.mjs';
 * 
 * await createGallerySet({
 *   name: "Q4 2024 Roadmap",
 *   description: "Product roadmap presentation for Q4",
 *   icon: "🚀",
 *   slideIds: ["slide1.html", "slide2.html"]
 * });
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Create a new gallery set programmatically
 * @param {Object} options - Set configuration
 * @param {string} options.name - Name of the set
 * @param {string} [options.description] - Description of the set
 * @param {string} [options.icon] - Icon for the set (emoji)
 * @param {string[]} [options.slideIds] - Array of slide filenames
 * @param {boolean} [options.autoDetect] - Auto-detect slides from AI Canvas
 * @param {string} [options.pattern] - Pattern to match slides (e.g., "opengov", "decision")
 * @returns {Promise<Object>} The created set
 */
export async function createGallerySet(options) {
  const {
    name,
    description = '',
    icon = '📊',
    slideIds = [],
    autoDetect = false,
    pattern = null
  } = options;

  // Validate required fields
  if (!name) {
    throw new Error('Set name is required');
  }

  let finalSlideIds = slideIds;

  // Auto-detect slides if requested
  if (autoDetect || pattern) {
    const detectedSlides = await detectSlides(pattern);
    finalSlideIds = [...new Set([...slideIds, ...detectedSlides])];
  }

  // Create the set object
  const newSet = {
    id: Date.now().toString(),
    name,
    icon,
    description,
    slideIds: finalSlideIds,
    created: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };

  // Save to storage (for now using localStorage simulation)
  await saveSet(newSet);

  console.log(`✅ Created gallery set "${name}" with ${finalSlideIds.length} slides`);
  
  return newSet;
}

/**
 * Update an existing gallery set
 * @param {string} setId - ID of the set to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} The updated set
 */
export async function updateGallerySet(setId, updates) {
  const sets = await loadSets();
  const setIndex = sets.findIndex(s => s.id === setId);
  
  if (setIndex === -1) {
    throw new Error(`Set with ID ${setId} not found`);
  }

  const updatedSet = {
    ...sets[setIndex],
    ...updates,
    lastModified: new Date().toISOString()
  };

  sets[setIndex] = updatedSet;
  await saveSets(sets);

  console.log(`✅ Updated gallery set "${updatedSet.name}"`);
  
  return updatedSet;
}

/**
 * Create a set from a presentation script
 * @param {string} scriptPath - Path to the presentation script
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} The created set
 */
export async function createSetFromScript(scriptPath, options = {}) {
  console.log(`📖 Reading presentation script from ${scriptPath}`);
  
  // Extract slide references from the script
  const content = await fs.readFile(scriptPath, 'utf-8');
  const slideMatches = content.match(/canvas-html-[\d-TZ]+\.html/g) || [];
  const uniqueSlides = [...new Set(slideMatches)];

  // Extract name from script if not provided
  let name = options.name;
  if (!name) {
    const nameMatch = content.match(/presentation[^'"]*['"]([^'"]+)['"]/i);
    name = nameMatch ? nameMatch[1] : path.basename(scriptPath, '.mjs');
  }

  return createGallerySet({
    name,
    description: options.description || `Generated from ${path.basename(scriptPath)}`,
    icon: options.icon || '🎨',
    slideIds: uniqueSlides
  });
}

/**
 * Detect slides based on pattern
 * @param {string} pattern - Pattern to match in filenames
 * @returns {Promise<string[]>} Array of matching slide filenames
 */
async function detectSlides(pattern) {
  const slides = [];
  
  try {
    // Check public directory
    const publicDir = path.join(process.cwd(), 'ai-canvas-gallery', 'public');
    const publicFiles = await fs.readdir(publicDir).catch(() => []);
    
    // Check private directory  
    const privateDir = path.join(process.cwd(), 'ai-canvas-gallery', 'private');
    const privateFiles = await fs.readdir(privateDir).catch(() => []);
    
    const allFiles = [...publicFiles, ...privateFiles];
    
    if (pattern) {
      const regex = new RegExp(pattern, 'i');
      return allFiles.filter(file => file.endsWith('.html') && regex.test(file));
    }
    
    return allFiles.filter(file => file.endsWith('.html'));
  } catch (error) {
    console.error('Error detecting slides:', error);
    return slides;
  }
}

/**
 * Load existing sets
 * @returns {Promise<Array>} Array of sets
 */
async function loadSets() {
  // For now, simulate loading from localStorage
  // In production, this would load from server
  try {
    const setsFile = path.join(process.cwd(), 'settings', 'gallery-sets.json');
    const data = await fs.readFile(setsFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

/**
 * Save a single set
 * @param {Object} set - The set to save
 */
async function saveSet(set) {
  const sets = await loadSets();
  const existingIndex = sets.findIndex(s => s.id === set.id);
  
  if (existingIndex >= 0) {
    sets[existingIndex] = set;
  } else {
    sets.push(set);
  }
  
  await saveSets(sets);
}

/**
 * Save all sets
 * @param {Array} sets - Array of sets to save
 */
async function saveSets(sets) {
  const settingsDir = path.join(process.cwd(), 'settings');
  await fs.mkdir(settingsDir, { recursive: true });
  
  const setsFile = path.join(settingsDir, 'gallery-sets.json');
  await fs.writeFile(setsFile, JSON.stringify(sets, null, 2));
}

/**
 * Quick function to create common presentation types
 */
export const quickCreate = {
  /**
   * Create a demo presentation set
   */
  async demo(name = "Demo Presentation") {
    return createGallerySet({
      name,
      description: "A demo presentation showcasing key features",
      icon: "🎯",
      autoDetect: true,
      pattern: "demo|showcase|feature"
    });
  },

  /**
   * Create a roadmap presentation
   */
  async roadmap(quarter = "Q1", year = new Date().getFullYear()) {
    return createGallerySet({
      name: `${quarter} ${year} Roadmap`,
      description: `Product roadmap for ${quarter} ${year}`,
      icon: "🗺️",
      autoDetect: true,
      pattern: "roadmap|plan|timeline"
    });
  },

  /**
   * Create a pitch deck
   */
  async pitch(company = "Company") {
    return createGallerySet({
      name: `${company} Pitch Deck`,
      description: `Investment pitch for ${company}`,
      icon: "💼",
      autoDetect: true,
      pattern: "pitch|investment|funding"
    });
  },

  /**
   * Create from all public slides
   */
  async allPublic() {
    const publicDir = path.join(process.cwd(), 'ai-canvas-gallery', 'public');
    const files = await fs.readdir(publicDir).catch(() => []);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    
    return createGallerySet({
      name: "All Public Presentations",
      description: "Complete collection of all public AI Canvas visuals",
      icon: "🌍",
      slideIds: htmlFiles
    });
  }
};

// Export a browser-compatible version for use in dashboard
export const browserHelper = `
// Browser version for console use
window.createGallerySet = async function(options) {
  const newSet = {
    id: Date.now().toString(),
    name: options.name,
    icon: options.icon || '📊',
    description: options.description || '',
    slideIds: options.slideIds || [],
    created: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
  
  const existingSets = JSON.parse(localStorage.getItem('canvas-gallery-sets') || '[]');
  existingSets.push(newSet);
  localStorage.setItem('canvas-gallery-sets', JSON.stringify(existingSets));
  
  // Refresh the gallery sets view if it's active
  const gallerySets = document.querySelector('gallery-sets');
  if (gallerySets) {
    await gallerySets.loadData();
  }
  
  console.log('✅ Created gallery set "' + newSet.name + '"');
  return newSet;
};
`;