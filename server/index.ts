import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './router.js';
import { createContext } from './trpc.js';
import { getUserFromAuthHeader } from './lib/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const isProd = process.env.NODE_ENV === 'production';

/** В production обязателен список origin через запятую (например https://site.fly.dev). */
function getCorsConfig(): cors.CorsOptions {
  if (!isProd) {
    return { origin: true, credentials: true };
  }
  const raw = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (raw.length === 0) {
    console.error(
      '[FATAL] В production задайте CORS_ORIGINS (через запятую), например: https://your-app.fly.dev'
    );
    process.exit(1);
  }
  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (raw.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin not allowed: ${origin}`));
    },
    credentials: true,
  };
}

app.use(cors(getCorsConfig()));

app.use(express.json());

app.use('/assets', express.static(path.join(__dirname, '../public/assets')));
app.use(express.static(path.join(__dirname, '../dist')));

const uploadsDir = path.join(__dirname, '../public/assets');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'));
    }
  },
});

async function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  if (!user?.isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Требуется вход администратора',
    });
  }
  next();
}

app.post('/api/upload', requireAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/assets/${req.file.filename}`;
    res.json({
      success: true,
      imageUrl: fileUrl,
      fileUrl: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message,
    });
  }
});

app.delete('/api/images/:filename', requireAdmin, (req, res) => {
  try {
    const safe = path.basename(req.params.filename);
    if (safe !== req.params.filename || safe.includes('..')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    const filePath = path.join(uploadsDir, safe);

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

app.use(
  '/api',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  const message = err instanceof Error ? err.message : 'Something went wrong';
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? message : 'Something went wrong',
  });
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  let localIP = 'localhost';
  try {
    const interfaces = os.networkInterfaces();
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
  } catch {
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
