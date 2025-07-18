// Safe gallery set injection with error handling
(() => {
  try {
    // First check if we're on the right page
    const galleryEnhanced = document.querySelector('canvas-gallery-enhanced');
    if (!galleryEnhanced) {
      console.error('❌ Gallery Sets component not found. Make sure you are on the Gallery Sets tab.');
      return;
    }

    const gallerySet = {
      "id": "1752809064622",
      "name": "All Public Presentations",
      "icon": "🌍",
      "description": "Complete collection of all public AI Canvas visuals",
      "slideIds": [
        "canvas-html-2025-07-17T23-36-22-944Z.html",
        "canvas-html-2025-07-17T23-36-51-006Z.html",
        "canvas-html-2025-07-18T00-45-49-322Z.html",
        "canvas-html-2025-07-18T02-56-57-744Z.html",
        "canvas-html-2025-07-18T02-57-05-683Z.html",
        "canvas-html-2025-07-18T02-57-13-271Z.html",
        "canvas-html-2025-07-18T02-58-40-950Z.html",
        "canvas-html-2025-07-18T02-58-50-682Z.html",
        "canvas-html-2025-07-18T02-58-52-988Z.html",
        "canvas-html-2025-07-18T02-58-57-467Z.html",
        "canvas-html-2025-07-18T02-59-03-723Z.html",
        "canvas-html-2025-07-18T02-59-08-939Z.html",
        "canvas-html-2025-07-18T02-59-26-805Z.html",
        "test-visual.html"
      ],
      "created": new Date().toISOString(),
      "lastModified": new Date().toISOString()
    };
    
    // Check if localStorage is available
    if (typeof Storage === "undefined") {
      console.error('❌ localStorage not supported in this browser');
      return;
    }
    
    // Get existing sets from localStorage
    let existingSets = [];
    try {
      const stored = localStorage.getItem('canvas-gallery-sets');
      if (stored) {
        existingSets = JSON.parse(stored);
        if (!Array.isArray(existingSets)) {
          console.warn('⚠️ Existing sets data was not an array, creating new array');
          existingSets = [];
        }
      }
    } catch (e) {
      console.error('❌ Error parsing existing sets:', e);
      existingSets = [];
    }
    
    // Check if this set already exists
    const existingIndex = existingSets.findIndex(s => s.name === gallerySet.name);
    if (existingIndex >= 0) {
      existingSets[existingIndex] = gallerySet;
      console.log('✅ Updated existing set');
    } else {
      existingSets.push(gallerySet);
      console.log('✅ Added new set');
    }
    
    // Save back to localStorage
    try {
      localStorage.setItem('canvas-gallery-sets', JSON.stringify(existingSets));
      console.log('✅ Gallery set "All Public Presentations" has been saved!');
      console.log('📌 Total sets in gallery:', existingSets.length);
      
      // Try to update the component directly if possible
      if (galleryEnhanced && galleryEnhanced.loadSets) {
        galleryEnhanced.sets = galleryEnhanced.loadSets();
        galleryEnhanced.requestUpdate();
        console.log('✅ Gallery updated without refresh needed!');
      } else {
        console.log('🔄 Please refresh the page to see the new set in Gallery Sets');
      }
      
    } catch (e) {
      console.error('❌ Error saving to localStorage:', e);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
})();