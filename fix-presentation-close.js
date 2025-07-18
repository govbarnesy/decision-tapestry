// Fix Presentation Close Script
// Run this in the browser console if the presentation doesn't close properly

(() => {
  console.log('🔧 Fixing presentation close...');
  
  // Find the presentation launcher
  const launcher = document.querySelector('presentation-launcher');
  
  if (!launcher) {
    console.log('❌ Presentation launcher not found');
    return;
  }
  
  console.log('📊 Presentation state:', {
    active: launcher.active,
    fullscreen: document.fullscreenElement !== null,
    slides: launcher.slides?.length || 0
  });
  
  // Force close the presentation
  const forceClose = async () => {
    // Exit fullscreen first
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        console.log('✅ Exited fullscreen');
      } catch (e) {
        console.log('⚠️ Could not exit fullscreen:', e.message);
      }
    }
    
    // Reset the launcher state
    launcher.active = false;
    launcher.slides = [];
    launcher.currentIndex = 0;
    launcher.setData = null;
    launcher.showGrid = false;
    launcher.showNotes = false;
    launcher.showHelp = false;
    
    // Force update
    launcher.requestUpdate();
    
    console.log('✅ Presentation closed');
  };
  
  // Add keyboard shortcut to force close
  const handleKeydown = (e) => {
    if (e.key === 'Escape' && e.shiftKey && e.ctrlKey) {
      console.log('🚨 Force closing presentation...');
      forceClose();
      document.removeEventListener('keydown', handleKeydown);
    }
  };
  
  document.addEventListener('keydown', handleKeydown);
  
  console.log('💡 Tips:');
  console.log('- Press ESC to exit normally');
  console.log('- Press Ctrl+Shift+ESC to force close');
  console.log('- Click the "Exit Presentation" button');
  
  // Try normal close first
  if (launcher.active) {
    launcher.exit();
  }
})();