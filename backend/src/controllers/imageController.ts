import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { uploadToCloudinary, deleteFromCloudinary, type CloudinaryUploadResult } from '../services/cloudinaryService';
import { uploadToGCP, deleteFromGCP, type GCPUploadResult } from '../services/gcpStorageService';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter - only allow images
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (should be compressed on mobile already)
  },
  fileFilter,
});

/**
 * Upload single image to cloud storage
 * 
 * Expected flow:
 * 1. Mobile app sends compressed image to backend
 * 2. Backend uploads to configured provider (Cloudinary or GCP)
 * 3. Backend returns public URL to mobile
 */
export const uploadImage = async (req: Request, res: Response) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('[ImageUpload] Received file:', req.file.filename);

    // Extract geographic data from request body (sent from mobile app)
    const geographicData = {
      ulbName: req.body.ulbName || undefined,
      zoneName: req.body.zoneName || undefined,
      wardNumber: req.body.wardNumber || undefined,
      mohallaName: req.body.mohallaName || undefined,
    };
    
    console.log('[ImageUpload] Geographic data:', geographicData);

    // Determine which provider to use (default to Cloudinary for now)
    // In production, this could come from database config or environment
    const provider = process.env.IMAGE_STORAGE_PROVIDER || 'cloudinary';
    console.log('[ImageUpload] Using provider:', provider);

    let uploadResult: { url: string; provider: string };

    try {
      if (provider === 'gcp') {
        // Upload to Google Cloud Storage
        const result: GCPUploadResult = await uploadToGCP(req.file.path);
        uploadResult = {
          url: result.publicUrl,
          provider: 'gcp',
        };
        console.log('[ImageUpload] GCP upload successful:', result.publicUrl);
      } else {
        // Upload to Cloudinary (default)
        const result: CloudinaryUploadResult = await uploadToCloudinary(
          req.file.path,
          'ptms_survey_images',
          geographicData
        );
        uploadResult = {
          url: result.secureUrl,
          provider: 'cloudinary',
        };
        console.log('[ImageUpload] Cloudinary upload successful:', result.secureUrl);
      }

      // Cleanup local file after successful upload
      await cleanupLocalFile(req.file.filename);

      res.json({
        message: 'Image uploaded successfully',
        url: uploadResult.url,
        provider: uploadResult.provider,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (uploadError) {
      console.error('[ImageUpload] Cloud upload failed:', uploadError);
      
      // Try to cleanup even on failure
      await cleanupLocalFile(req.file.filename);
      
      throw uploadError;
    }
  } catch (error) {
    console.error('[ImageUpload] Error:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Upload multiple images in a single request
 */
export const uploadMultipleImages = async (req: Request, res: Response) => {
  try {
    // Check if files were uploaded
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const files = req.files as Express.Multer.File[];
    console.log(`[ImageUpload] Received ${files.length} files`);

    // Extract geographic data (applies to all images in batch)
    const geographicData = {
      ulbName: req.body.ulbName || undefined,
      zoneName: req.body.zoneName || undefined,
      wardNumber: req.body.wardNumber || undefined,
      mohallaName: req.body.mohallaName || undefined,
    };

    // Determine provider
    const provider = process.env.IMAGE_STORAGE_PROVIDER || 'cloudinary';

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        try {
          let url: string;
          
          if (provider === 'gcp') {
            const result: GCPUploadResult = await uploadToGCP(file.path, 'ptms_survey_images', geographicData);
            url = result.publicUrl;
          } else {
            const result: CloudinaryUploadResult = await uploadToCloudinary(file.path, 'ptms_survey_images', geographicData);
            url = result.secureUrl;
          }
          
          // Cleanup local file
          await cleanupLocalFile(file.filename);
          
          return {
            originalName: file.originalname,
            filename: file.filename,
            url,
            size: file.size,
          };
        } catch (error) {
          console.error(`[ImageUpload] Failed to upload ${file.filename}:`, error);
          return {
            originalName: file.originalname,
            filename: file.filename,
            url: null,
            size: file.size,
            error: 'Upload failed',
          };
        }
      })
    );

    const successful = uploadResults.filter(r => r.url !== null);
    const failed = uploadResults.filter(r => r.url === null);

    res.json({
      message: `${successful.length}/${files.length} images uploaded successfully`,
      results: uploadResults,
      provider,
      stats: {
        total: files.length,
        successful: successful.length,
        failed: failed.length,
      },
    });
  } catch (error) {
    console.error('[ImageUpload] Error:', error);
    res.status(500).json({
      error: 'Failed to upload images',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Cleanup function to remove uploaded files after processing
 * Should be called after successful cloud upload
 */
export const cleanupLocalFile = async (filename: string): Promise<void> => {
  try {
    const filePath = path.join(__dirname, '../../uploads', filename);
    
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`[ImageUpload] Cleaned up local file: ${filename}`);
    }
  } catch (error) {
    console.error(`[ImageUpload] Failed to cleanup file ${filename}:`, error);
  }
};
