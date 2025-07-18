
// Run this in the browser console to add the gallery set
(() => {
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
  "created": "2025-07-18T03:24:24.622Z",
  "lastModified": "2025-07-18T03:24:24.626Z"
};
  
  // Get existing sets from localStorage
  const existingSets = JSON.parse(localStorage.getItem('canvas-gallery-sets') || '[]');
  
  // Check if this set already exists
  const existingIndex = existingSets.findIndex(s => s.name === gallerySet.name);
  if (existingIndex >= 0) {
    existingSets[existingIndex] = gallerySet;
    console.log('Updated existing set');
  } else {
    existingSets.push(gallerySet);
    console.log('Added new set');
  }
  
  // Save back to localStorage
  localStorage.setItem('canvas-gallery-sets', JSON.stringify(existingSets));
  
  console.log('✅ Gallery set "All Public Presentations" has been added!');
  console.log('Refresh the page to see it in Gallery Sets');
})();
