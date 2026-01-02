import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './router.js';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// CORS configuration
app.use(cors({
  origin: true, // Разрешить любые origin для deve
  // lopmen
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

// Static files
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// Serve static files from dist folder (production build)
app.use(express.static(path.join(__dirname, '../dist')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/assets');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (for videos)
  },
  fileFilter: (_req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'));
    }
  }
});

// Upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/assets/${req.file.filename}`;
    res.json({ 
      success: true, 
      imageUrl: fileUrl, // Keep for backward compatibility
      fileUrl: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      message: error.message || 'Unknown error'
    });
  }
});

// Delete image endpoint
app.delete('/api/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// tRPC middleware
app.use('/api', createExpressMiddleware({
  router: appRouter,
  createContext: () => ({}),
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for root route
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((_req, res) => {
  // For SPA, serve index.html for all routes
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {

  let localIP = 'localhost';
  try {
    const interfaces = os.networkInterfaces();
    // Найдем локальный IP адрес
    for (const name of Object.keys(interfaces)) {
      const ifaceList = interfaces[name];
      if (!ifaceList) continue;
      for (const iface of ifaceList) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIP = iface.address;
          break;
        }
      }
    }
  } catch (e) {
    // В некоторых окружениях (песочницы/CI) os.networkInterfaces() может быть запрещен
    localIP = 'localhost';
  }
  
  console.log(`🚀 Server running on:`);
  console.log(`   ➜ Local:   http://localhost:${PORT}`);
  console.log(`   ➜ Network: http://${localIP}:${PORT}`);
  console.log(`📡 tRPC API available at:`);
  console.log(`   ➜ Local:   http://localhost:${PORT}/api`);
  console.log(`   ➜ Network: http://${localIP}:${PORT}/api`);
});

export default app;