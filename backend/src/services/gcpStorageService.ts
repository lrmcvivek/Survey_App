import { Storage, Bucket } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

/**
 * Google Cloud Platform (GCP) Service
 * 
 * Handles uploading images to Google Cloud Storage
 */

// Initialize GCP Storage client
// Credentials should be set via GOOGLE_APPLICATION_CREDENTIALS environment variable
// or ADC (Application Default Credentials)
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  // Key filename is optional if using ADC or running on GCP infrastructure
  keyFilename: process.env.GCP_KEY_FILE_PATH,
});

// Get bucket name from environment
const BUCKET_NAME = process.env.GCP_BUCKET_NAME || 'survey-images-bucket';

export interface GCPUploadResult {
  url: string;
  publicUrl: string;
  gcsUri: string;
  bucket: string;
  objectName: string;
}

/**
 * Upload image to Google Cloud Storage
 * 
 * @param filePath - Local file path of the image
 * @param destinationPath - Optional destination path in bucket (default: survey_images/)
 * @returns Upload result with URLs
 */
export const uploadToGCP = async (
  filePath: string,
  destinationPath: string = 'survey_images'
): Promise<GCPUploadResult> => {
  try {
    console.log('[GCP] Starting upload:', filePath);

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const bucket = storage.bucket(BUCKET_NAME);
    
    // Generate unique object name
    const fileName = `${Date.now()}_${path.basename(filePath)}`;
    const destination = `${destinationPath}/${fileName}`;

    // Upload file to GCS
    await bucket.upload(filePath, {
      destination,
      metadata: {
        contentType: getContentType(filePath),
        metadata: {
          originalName: path.basename(filePath),
          uploadedAt: new Date().toISOString(),
        },
      },
      public: true, // Make publicly accessible (or use signed URLs for private)
    });

    console.log('[GCP] Upload successful:', destination);

    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destination}`;

    return {
      url: publicUrl,
      publicUrl,
      gcsUri: `gs://${BUCKET_NAME}/${destination}`,
      bucket: BUCKET_NAME,
      objectName: destination,
    };
  } catch (error) {
    console.error('[GCP] Upload failed:', error);
    throw new Error(
      `GCP upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Delete object from Google Cloud Storage
 * 
 * @param objectName - The object name/path in the bucket
 */
export const deleteFromGCP = async (objectName: string): Promise<void> => {
  try {
    console.log('[GCP] Deleting:', objectName);

    const bucket = storage.bucket(BUCKET_NAME);
    await bucket.file(objectName).delete();

    console.log('[GCP] Deletion successful');
  } catch (error) {
    console.error('[GCP] Deletion failed:', error);
    throw new Error(
      `GCP deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Generate signed URL for private object access
 * 
 * @param objectName - The object name/path in the bucket
 * @param expires - Expiration time in milliseconds (default: 1 hour)
 * @returns Signed URL
 */
export const generateSignedUrl = async (
  objectName: string,
  expires: number = 60 * 60 * 1000 // 1 hour
): Promise<string> => {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(objectName);

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expires,
    });

    return url;
  } catch (error) {
    console.error('[GCP] Failed to generate signed URL:', error);
    throw new Error(
      `Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Bulk upload multiple images to GCP
 * 
 * @param filePaths - Array of local file paths
 * @param destinationPath - Optional destination path in bucket
 * @returns Array of upload results
 */
export const bulkUploadToGCP = async (
  filePaths: string[],
  destinationPath: string = 'survey_images'
): Promise<GCPUploadResult[]> => {
  const results: GCPUploadResult[] = [];

  for (const filePath of filePaths) {
    try {
      const result = await uploadToGCP(filePath, destinationPath);
      results.push(result);
    } catch (error) {
      console.error(`[GCP] Failed to upload ${filePath}:`, error);
      // Continue with other uploads even if one fails
    }
  }

  return results;
};

/**
 * Helper function to determine content type based on file extension
 */
const getContentType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
};
