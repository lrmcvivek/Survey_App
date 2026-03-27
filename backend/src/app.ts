import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes';
import surveyorRoutes from './routes/surveyorRoutes';
import surveyRoutes from './routes/surveyRoutes';
import masterDataRoutes from './routes/masterDataRoutes';
import { authenticateJWT, restrictToWebPortal } from './middleware/authMiddleware';
import wardRoutes from './routes/wardRoutes';
import userRoutes from './routes/userRoutes';
import ulbRoutes from './routes/ulbRoutes';
import zoneRoutes from './routes/zoneRoutes';
import mohallaRoutes from './routes/mohallaRoutes';
import qcRoutes from './routes/qcRoutes';
import reportsRoutes from './routes/reportsRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import imageRoutes from './routes/imageRoutes';
import devRoutes from './routes/devRoutes';



dotenv.config();

// Initialize Express app
const app = express();
const prisma = new PrismaClient();

// Default origins for development
const defaultOrigins = [
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://survey-app-orpin-seven.vercel.app',
  'https://ptms.lrmconsultant.in'
];

// Build allowed origins list from environment variables
const allowedOrigins = [...defaultOrigins];

// Add frontend URLs from environment variables
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
if (process.env.FRONTEND_URL_PRODUCTION) {
  allowedOrigins.push(process.env.FRONTEND_URL_PRODUCTION);
}
if (process.env.CORS_ORIGINS) {
  // Allow comma-separated list of origins
  const additionalOrigins = process.env.CORS_ORIGINS.split(',').map(url => url.trim());
  allowedOrigins.push(...additionalOrigins);
}



// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Blocked CORS origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};
// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  
  // Only set headers if the origin is allowed
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
  }
  
  next();
});

// Routes
app.use('/api/auth', authRoutes);

// Master data routes (public for now, can be protected later if needed)
app.use('/api/master-data', masterDataRoutes);

// Protected routes - Web Portal Only (ADMIN/SUPERADMIN)
app.use('/api/ward', authenticateJWT, restrictToWebPortal, wardRoutes);
app.use('/api/user', authenticateJWT, userRoutes);

// Protected routes - All Authenticated Users
app.use('/api/surveyors', authenticateJWT, surveyorRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/surveyor', surveyorRoutes);

// Protected routes - ULBs
app.use('/api/ulbs', authenticateJWT, ulbRoutes);

// Protected routes - Zones
app.use('/api/zones', authenticateJWT, zoneRoutes);

// Protected routes - Wards (master data)
app.use('/api/wards', authenticateJWT, wardRoutes);

// Protected routes - Mohallas
app.use('/api/mohallas', authenticateJWT, mohallaRoutes);

// Protected routes - QC
app.use('/api/qc', authenticateJWT, qcRoutes);

// Protected routes - Reports
app.use('/api/reports', authenticateJWT, reportsRoutes);

// Protected routes - Assignments
app.use('/api/assignments', authenticateJWT, assignmentRoutes);

// Image upload routes (protected)
app.use('/api/images', authenticateJWT, imageRoutes);

// Developer toggle routes (hidden, protected)
app.use('/api/dev', devRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Catch-all route for unknown endpoints to return JSON error
app.use((req, res) => {
  console.log(`404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('DB URL:', process.env.DATABASE_URL?.substring(0, 5));
  console.log(`Server is running on port ${PORT}`);
  console.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
});

