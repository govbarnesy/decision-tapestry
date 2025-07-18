// Gallery diagnostic script
console.log('🔍 Running Gallery Diagnostics...\n');

// Check 1: Component presence
console.log('1️⃣ Checking for gallery components:');
const gallery = document.querySelector('canvas-gallery');
const galleryEnhanced = document.querySelector('canvas-gallery-enhanced');
console.log('  - canvas-gallery:', gallery ? '✅ Found' : '❌ Not found');
console.log('  - canvas-gallery-enhanced:', galleryEnhanced ? '✅ Found' : '❌ Not found');

// Check 2: Current tab
console.log('\n2️⃣ Checking current tab:');
const activeTab = document.querySelector('.center-tab.active');
console.log('  - Active tab:', activeTab ? activeTab.textContent : 'None');

// Check 3: localStorage
console.log('\n3️⃣ Checking localStorage:');
try {
  const sets = localStorage.getItem('canvas-gallery-sets');
  if (sets) {
    const parsed = JSON.parse(sets);
    console.log('  - Gallery sets found:', parsed.length);
    parsed.forEach((set, i) => {
      console.log(`    ${i + 1}. ${set.name} (${set.slideIds?.length || 0} slides)`);
    });
  } else {
    console.log('  - No gallery sets in localStorage');
  }
} catch (e) {
  console.log('  - Error reading localStorage:', e.message);
}

// Check 4: Visual files
console.log('\n4️⃣ Checking for visual files:');
fetch('/api/gallery/public')
  .then(res => res.json())
  .then(data => {
    console.log('  - Public visuals:', data.visuals?.length || 0);
  })
  .catch(e => console.log('  - Error fetching public visuals:', e.message));

fetch('/api/gallery/private')
  .then(res => res.json())
  .then(data => {
    console.log('  - Private visuals:', data.visuals?.length || 0);
  })
  .catch(e => console.log('  - Error fetching private visuals:', e.message));

// Check 5: Component state
console.log('\n5️⃣ Checking component state:');
if (galleryEnhanced) {
  console.log('  - Sets loaded:', galleryEnhanced.sets?.length || 0);
  console.log('  - All visuals:', galleryEnhanced.allVisuals?.length || 0);
  console.log('  - Component ready:', galleryEnhanced.isConnected);
}

console.log('\n✅ Diagnostics complete!');
console.log('\n💡 To fix common issues:');
console.log('1. Make sure you\'re on the Gallery Sets tab');
console.log('2. Try refreshing the page');
console.log('3. Check if the server is running (npm start)');
console.log('4. Look for any red errors above');