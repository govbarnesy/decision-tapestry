import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Get list of saved visuals
router.get('/api/gallery/:type', async (req, res) => {
  const { type } = req.params;
  
  if (!['private', 'public'].includes(type)) {
    return res.status(400).json({ error: 'Invalid gallery type' });
  }
  
  try {
    const galleryPath = path.join(process.cwd(), 'ai-canvas-gallery', type);
    const files = await fs.readdir(galleryPath);
    
    // Filter HTML files and get metadata
    const visuals = [];
    for (const file of files) {
      if (file.endsWith('.html') && !file.startsWith('.')) {
        const filePath = path.join(galleryPath, file);
        const stats = await fs.stat(filePath);
        
        visuals.push({
          filename: file,
          path: `/ai-canvas-gallery/${type}/${file}`,
          created: stats.birthtime,
          size: stats.size,
          type: type
        });
      }
    }
    
    // Sort by creation date (newest first)
    visuals.sort((a, b) => new Date(b.created) - new Date(a.created));
    
    res.json({ visuals, count: visuals.length });
  } catch (error) {
    console.error(`[Gallery] Error reading ${type} gallery:`, error);
    res.status(500).json({ error: 'Failed to read gallery' });
  }
});

// Delete a visual
router.delete('/api/gallery/:type/:filename', async (req, res) => {
  const { type, filename } = req.params;
  
  console.log(`[Gallery] Delete request - type: ${type}, filename: ${filename}`);
  
  if (!['private', 'public'].includes(type)) {
    return res.status(400).json({ error: 'Invalid gallery type' });
  }
  
  try {
    const filePath = path.join(process.cwd(), 'ai-canvas-gallery', type, filename);
    console.log(`[Gallery] Attempting to delete file at: ${filePath}`);
    
    // Check if file exists
    await fs.access(filePath);
    console.log(`[Gallery] File exists, proceeding with deletion`);
    
    // Delete the file
    await fs.unlink(filePath);
    
    console.log(`[Gallery] Successfully deleted ${type} visual: ${filename}`);
    res.json({ message: 'Visual deleted successfully' });
  } catch (error) {
    console.error(`[Gallery] Error deleting visual:`, error);
    res.status(404).json({ error: 'Visual not found' });
  }
});

// Move visual between private/public
router.post('/api/gallery/move', async (req, res) => {
  const { filename, from, to } = req.body;
  
  if (!['private', 'public'].includes(from) || !['private', 'public'].includes(to)) {
    return res.status(400).json({ error: 'Invalid directory' });
  }
  
  if (!filename || !filename.endsWith('.html')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  try {
    const sourcePath = path.join(process.cwd(), 'ai-canvas-gallery', from, filename);
    const targetPath = path.join(process.cwd(), 'ai-canvas-gallery', to, filename);
    
    // Check if source exists
    await fs.access(sourcePath);
    
    // Move the file
    await fs.rename(sourcePath, targetPath);
    
    console.log(`[Gallery] Moved ${filename} from ${from} to ${to}`);
    res.json({ success: true, message: `Moved to ${to}` });
  } catch (error) {
    console.error('[Gallery] Error moving file:', error);
    res.status(500).json({ error: 'Failed to move file' });
  }
});

// Serve gallery files
router.use('/ai-canvas-gallery', express.static(path.join(process.cwd(), 'ai-canvas-gallery')));

export { router as galleryRouter };