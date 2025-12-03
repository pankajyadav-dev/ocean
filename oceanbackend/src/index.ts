import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { connectDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import hazardRoutes from './routes/hazardRoutes';
import newsRoutes from './routes/newsRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import userRoutes from './routes/userRoutes';
import socialMediaRoutes from './routes/socialMediaRoutes';
import governmentAlertsRoutes from './routes/governmentAlertsRoutes';

// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);

// Initialize Socket.io
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hazards', hazardRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/government', governmentAlertsRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'OceanGuard API is running', status: 'healthy' });
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../OceanFrontend/dist');
  
  // Serve static files
  app.use(express.static(frontendPath));
  
  // Handle React Router - send all non-API requests to index.html
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // Development mode - API only
  app.use((req: Request, res: Response) => {
    res.status(404).json({ message: 'Route not found' });
  });
}

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
      console.log(`🔌 Socket.io is ready for real-time notifications`);
      if (process.env.NODE_ENV === 'production') {
        console.log(`🎨 Serving frontend from /`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

