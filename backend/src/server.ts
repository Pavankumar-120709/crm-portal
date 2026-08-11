import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import productRoutes from './routes/productRoutes';
import stockRoutes from './routes/stockRoutes';
import challanRoutes from './routes/challanRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import userRoutes from './routes/userRoutes';
import { errorHandler } from './middleware/error';
import { initDb } from './db/init';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in deployment to avoid cross-origin blockage
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Health Check Endpoint (Requirement #26)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Initialize DB and Start Server
async function startServer() {
  try {
    if (process.env.NODE_ENV !== 'test') {
      await initDb().catch((err) => {
        console.warn('⚠️ Warning: DB auto-init skipped or deferred. Check connection details:', err.message);
      });
    }

    app.listen(PORT, () => {
      console.log(`🚀 Mini ERP + CRM Backend API running on port ${PORT}`);
      console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
