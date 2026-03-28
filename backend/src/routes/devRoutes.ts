import express from 'express';
import { getProviderConfig, setProviderConfig, resetProviderConfig, verifyAccessKey } from '../controllers/devToggleController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * Developer Toggle Routes
 * 
 * Hidden routes for runtime provider switching
 * Access via /api/dev/toggle/*
 */

// All dev routes require authentication
router.use(authenticateJWT);

// Verify access key (must be called first)
router.post('/verify-access-key', verifyAccessKey);

// Get current provider configuration
router.get('/toggle/provider', getProviderConfig);

// Set provider configuration
router.post('/toggle/provider', setProviderConfig);

// Reset provider to default
router.post('/toggle/reset', resetProviderConfig);

export default router;
