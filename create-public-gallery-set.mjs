import fs from 'fs/promises';
import path from 'path';

async function createPublicGallerySet() {
  try {
    // Read all files from public gallery
    const publicPath = path.join(process.cwd(), 'ai-canvas-gallery', 'public');
    const files = await fs.readdir(publicPath);
    
    // Filter HTML files
    const htmlFiles = files.filter(file => 
      file.endsWith('.html') && !file.startsWith('.')
    );
    
    console.log(`Found ${htmlFiles.length} public visuals`);
    
    // Sort by timestamp in filename
    htmlFiles.sort();
    
    // Create gallery set
    const gallerySet = {
      id: Date.now().toString(),
      name: 'All Public Presentations',
      icon: '🌍',
      description: 'Complete collection of all public AI Canvas visuals',
      slideIds: htmlFiles,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    // Load existing sets from localStorage simulation
    const existingSetsFile = path.join(process.cwd(), 'settings', 'gallery-sets.json');
    let existingSets = [];
    
    try {
      const data = await fs.readFile(existingSetsFile, 'utf-8');
      existingSets = JSON.parse(data);
    } catch (e) {
      // File doesn't exist yet, that's OK
    }
    
    // Add new set
    existingSets.push(gallerySet);
    
    // Save sets
    await fs.writeFile(
      existingSetsFile, 
      JSON.stringify(existingSets, null, 2)
    );
    
    console.log('\n✅ Gallery set created successfully!');
    console.log(`\nSet Details:`);
    console.log(`- Name: ${gallerySet.name}`);
    console.log(`- Slides: ${gallerySet.slideIds.length}`);
    console.log(`- ID: ${gallerySet.id}`);
    
    console.log('\nSlides included:');
    gallerySet.slideIds.forEach((slide, index) => {
      console.log(`  ${index + 1}. ${slide}`);
    });
    
    console.log('\n📝 To use this set:');
    console.log('1. Open the Decision Tapestry dashboard');
    console.log('2. Go to the "Gallery Sets" tab');
    console.log('3. You\'ll see "All Public Presentations" ready to launch!');
    
    // Also create a browser-compatible script to inject the set
    const browserScript = `
// Run this in the browser console to add the gallery set
(() => {
  const gallerySet = ${JSON.stringify(gallerySet, null, 2)};
  
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
  
  console.log('✅ Gallery set "${gallerySet.name}" has been added!');
  console.log('Refresh the page to see it in Gallery Sets');
})();
`;
    
    await fs.writeFile(
      path.join(process.cwd(), 'inject-gallery-set.js'),
      browserScript
    );
    
    console.log('\n💡 Alternative method:');
    console.log('Copy and paste the contents of inject-gallery-set.js into the browser console');
    
  } catch (error) {
    console.error('Error creating gallery set:', error);
  }
}

createPublicGallerySet();