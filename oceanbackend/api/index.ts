import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDatabase } from '../src/config/database';
import authRoutes from '../src/routes/authRoutes';
import hazardRoutes from '../src/routes/hazardRoutes';
import newsRoutes from '../src/routes/newsRoutes';
import analyticsRoutes from '../src/routes/analyticsRoutes';
import userRoutes from '../src/routes/userRoutes';
import socialMediaRoutes from '../src/routes/socialMediaRoutes';
import governmentAlertsRoutes from '../src/routes/governmentAlertsRoutes';

// Load environment variables
dotenv.config();

const app: Application = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hazards', hazardRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/government-alerts', governmentAlertsRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'OceanGuard API is running' });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

export default app;
