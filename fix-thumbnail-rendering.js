// Fix Thumbnail Rendering Script
// Run this in the browser console to fix iframe rendering issues

(() => {
  console.log('🔧 Fixing thumbnail rendering...');
  
  // Find all slide thumbnails
  const setEditor = document.querySelector('set-editor');
  if (!setEditor || !setEditor.shadowRoot) {
    console.log('❌ Set editor not found or not open');
    return;
  }
  
  const thumbnails = setEditor.shadowRoot.querySelectorAll('.slide-thumbnail');
  console.log(`📸 Found ${thumbnails.length} thumbnails`);
  
  thumbnails.forEach((thumbnail, index) => {
    const iframe = thumbnail.querySelector('iframe');
    if (!iframe) {
      console.log(`❌ No iframe in thumbnail ${index}`);
      return;
    }
    
    // Remove the gradient background
    thumbnail.style.background = 'transparent';
    
    // Fix iframe styling
    iframe.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      background: white;
      transform: none;
      pointer-events: none;
    `;
    
    // Try to access iframe content
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc) {
        // Ensure content is visible
        const style = iframeDoc.createElement('style');
        style.textContent = `
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: hidden !important;
            transform: scale(0.25) !important;
            transform-origin: top left !important;
            width: 400% !important;
            height: 400% !important;
          }
          * {
            max-width: none !important;
          }
        `;
        iframeDoc.head.appendChild(style);
        console.log(`✅ Fixed thumbnail ${index}`);
      }
    } catch (e) {
      console.log(`⚠️ Cannot access iframe ${index} content (cross-origin)`);
      
      // Alternative: Create a wrapper div with transform
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 400%;
        height: 400%;
        transform: scale(0.25);
        transform-origin: top left;
        overflow: hidden;
      `;
      
      // Move iframe into wrapper
      iframe.parentNode.insertBefore(wrapper, iframe);
      wrapper.appendChild(iframe);
      
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        background: white;
      `;
    }
  });
  
  console.log('✨ Thumbnail rendering fixes applied!');
  console.log('💡 If thumbnails still don\'t show content:');
  console.log('   1. The iframes may be loading slowly');
  console.log('   2. The content may be blocked by CORS');
  console.log('   3. Try refreshing the modal');
})();