import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import fs from 'fs';
import path from 'path';

/**
 * Cloudinary Service
 * 
 * Handles uploading images to Cloudinary cloud storage
 */

// Configure Cloudinary (credentials should be in .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
});

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
}

/**
 * Upload image to Cloudinary
 * 
 * @param filePath - Local file path of the image
 * @param folder - Optional folder name in Cloudinary
 * @returns Upload result with URLs
 */
export const uploadToCloudinary = async (
  filePath: string,
  folder: string = 'ptms_survey_images'
): Promise<CloudinaryUploadResult> => {
  try {
    console.log('[Cloudinary] Starting upload:', filePath);

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Upload to Cloudinary
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload(
        filePath,
        {
          folder,
          resource_type: 'image',
          transformation: [
            { quality: 'auto' }, // Use Cloudinary's auto-quality optimization
            { fetch_format: 'auto' }, // Auto-select best format
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result as UploadApiResponse);
          }
        }
      );
    });

    console.log('[Cloudinary] Upload successful:', result.secure_url);

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('[Cloudinary] Upload failed:', error);
    throw new Error(
      `Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Delete image from Cloudinary
 * 
 * @param publicId - The public ID of the image to delete
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    console.log('[Cloudinary] Deleting:', publicId);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    console.log('[Cloudinary] Deletion result:', result);
  } catch (error) {
    console.error('[Cloudinary] Deletion failed:', error);
    throw new Error(
      `Cloudinary deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Bulk upload multiple images to Cloudinary
 * 
 * @param filePaths - Array of local file paths
 * @param folder - Optional folder name in Cloudinary
 * @returns Array of upload results
 */
export const bulkUploadToCloudinary = async (
  filePaths: string[],
  folder: string = 'survey_images'
): Promise<CloudinaryUploadResult[]> => {
  const results: CloudinaryUploadResult[] = [];

  for (const filePath of filePaths) {
    try {
      const result = await uploadToCloudinary(filePath, folder);
      results.push(result);
    } catch (error) {
      console.error(`[Cloudinary] Failed to upload ${filePath}:`, error);
      // Continue with other uploads even if one fails
    }
  }

  return results;
};
