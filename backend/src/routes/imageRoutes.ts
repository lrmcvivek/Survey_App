import express from 'express';
import { upload, uploadImage, uploadMultipleImages } from '../controllers/imageController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * Image Upload Routes
 * 
 * These routes handle image uploads from mobile app to backend,
 * which then uploads to cloud storage (Cloudinary or GCP)
 */

// Single image upload - requires authentication
router.post(
  '/upload',
  authenticateJWT,
  upload.single('image'),
  uploadImage
);

// Multiple image upload - requires authentication  
router.post(
  '/upload-multiple',
  authenticateJWT,
  upload.array('images', 10), // Max 10 images per request
  uploadMultipleImages
);

export default router;
