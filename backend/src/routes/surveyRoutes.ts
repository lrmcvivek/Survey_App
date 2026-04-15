import { Router } from 'express';
import { submitSurvey, getSurveyByGisId } from '../controllers/surveyController';
import { authenticateJWT, restrictToRoles, restrictToWebPortal } from '../middleware/authMiddleware';

const router = Router();

// ========================================
// SURVEY SEARCH ROUTES
// ========================================

// Get survey by GIS ID
router.get(
  '/gis/:gisId',
  authenticateJWT,
  restrictToWebPortal,
  getSurveyByGisId
);

// ========================================
// SURVEY SUBMISSION ROUTES (MOBILE APP)
// ========================================

// Submit new survey (mobile app)
router.post(
  '/addSurvey',
  authenticateJWT,
  restrictToRoles(['SURVEYOR', 'SUPERVISOR']),
  submitSurvey
);

// ========================================
// SURVEY MANAGEMENT ROUTES (WEB PORTAL)
// ========================================

// Get all surveys with pagination and filters
router.get(
  '/',
  authenticateJWT,
  restrictToWebPortal,
  async (req, res) => {
    try {
      // Mock response for now - implement actual controller
      res.json({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch surveys' });
    }
  }
);

// Get survey by ID
router.get(
  '/:surveyUniqueCode',
  authenticateJWT,
  restrictToWebPortal,
  async (req, res) => {
    try {
      const { surveyUniqueCode } = req.params;
      // Mock response for now - implement actual controller
      res.json({
        data: {
          surveyUniqueCode,
          gisId: 'GIS123',
          uploadedBy: { username: 'admin1', name: 'Admin User' },
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch survey' });
    }
  }
);

// Sync survey
router.post(
  '/:surveyUniqueCode/sync',
  authenticateJWT,
  restrictToWebPortal,
  async (req, res) => {
    try {
      const { surveyUniqueCode } = req.params;
      // Mock response for now - implement actual controller
      res.json({
        message: `Survey ${surveyUniqueCode} synced successfully`,
        data: { surveyUniqueCode, syncStatus: 'SYNCED' }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to sync survey' });
    }
  }
);

// Bulk sync surveys
router.post(
  '/bulk-sync',
  authenticateJWT,
  restrictToWebPortal,
  async (req, res) => {
    try {
      const { surveyUniqueCodes } = req.body;
      // Mock response for now - implement actual controller
      res.json({
        message: `${surveyUniqueCodes.length} surveys synced successfully`,
        data: { syncedCount: surveyUniqueCodes.length }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to bulk sync surveys' });
    }
  }
);

// Get survey statistics
router.get(
  '/stats/overview',
  authenticateJWT,
  restrictToWebPortal,
  async (req, res) => {
    try {
      // Mock response for now - implement actual controller
      res.json({
        data: {
          totalSurveys: 1250,
          syncedSurveys: 1100,
          pendingSync: 100,
          failedSync: 30,
          conflictSync: 20
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch survey stats' });
    }
  }
);

// Get surveys by ward
router.get(
  '/ward/:wardId',
  authenticateJWT,
  restrictToWebPortal,
  async (req, res) => {
    try {
      const { wardId } = req.params;
      // Mock response for now - implement actual controller
      res.json({
        data: []
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch surveys by ward' });
    }
  }
);

// Get surveys by user
router.get(
  '/user/:userId',
  authenticateJWT,
  restrictToWebPortal,
  async (req, res) => {
    try {
      const { userId } = req.params;
      // Mock response for now - implement actual controller
      res.json({
        data: []
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch surveys by user' });
    }
  }
);

// Get surveys by status
router.get(
  '/status/:status',
  authenticateJWT,
  restrictToWebPortal,
  async (req, res) => {
    try {
      const { status } = req.params;
      // Mock response for now - implement actual controller
      res.json({
        data: []
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch surveys by status' });
    }
  }
);

// Search surveys
router.get(
  '/search',
  authenticateJWT,
  restrictToWebPortal,
  async (req, res) => {
    try {
      const { q, wardId, userId, status, syncStatus } = req.query;
      // Mock response for now - implement actual controller
      res.json({
        data: []
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to search surveys' });
    }
  }
);

export default router; 