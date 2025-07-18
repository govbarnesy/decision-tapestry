// Browser script to create a gallery set from all public visuals
// Run this in the browser console while on the Gallery Sets tab

(async () => {
  try {
    // Fetch all public visuals
    const response = await fetch('/api/gallery/public');
    const data = await response.json();
    const publicVisuals = data.visuals || [];
    
    if (publicVisuals.length === 0) {
      console.log('❌ No public visuals found');
      return;
    }
    
    // Extract filenames
    const slideIds = publicVisuals.map(v => v.filename);
    
    // Create the gallery set
    const newSet = {
      id: Date.now().toString(),
      name: "All Public Presentations",
      icon: "🌍",
      description: "Complete collection of all public AI Canvas visuals",
      slideIds: slideIds,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    // Load existing sets
    const existingSets = JSON.parse(localStorage.getItem('canvas-gallery-sets') || '[]');
    
    // Check if this set already exists
    const existingIndex = existingSets.findIndex(s => s.name === newSet.name);
    if (existingIndex >= 0) {
      existingSets[existingIndex] = newSet;
      console.log('✅ Updated existing "All Public Presentations" set');
    } else {
      existingSets.push(newSet);
      console.log('✅ Created new "All Public Presentations" set');
    }
    
    // Save back to localStorage
    localStorage.setItem('canvas-gallery-sets', JSON.stringify(existingSets));
    
    console.log(`📊 Set contains ${slideIds.length} slides`);
    console.log('🔄 Refreshing Gallery Sets view...');
    
    // Refresh the gallery sets component if it's visible
    const gallerySets = document.querySelector('gallery-sets');
    if (gallerySets && gallerySets.loadData) {
      await gallerySets.loadData();
      console.log('✨ Gallery Sets refreshed!');
    } else {
      console.log('💡 Switch to the Gallery Sets tab to see your new set');
    }
    
  } catch (error) {
    console.error('❌ Error creating gallery set:', error);
  }
})();