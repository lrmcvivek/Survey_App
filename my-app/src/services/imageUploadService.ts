import { getPendingAndFailedImages, updateImageUploadStatus } from './sqlite';
import { StorageProviderFactory, lockProviderForSync, releaseProviderLock } from './imageStorageProvider';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/**
 * Image Upload Service
 * 
 * Handles uploading images to cloud storage during sync operations
 * following the offline-first architecture
 */

export interface ImageUploadResult {
  imageId: number;
  success: boolean;
  url?: string;
  provider?: 'cloudinary' | 'gcp';
  error?: string;
}

export interface SurveyUploadResult {
  surveyId: string;
  allImagesUploaded: boolean;
  uploadedCount: number;
  failedCount: number;
  imageUrls: Record<string, string>; // label -> URL mapping
}

/**
 * Upload a single image using the current storage provider
 */
export const uploadSingleImage = async (
  imageId: number,
  localPath: string
): Promise<ImageUploadResult> => {
  try {
    console.log(`[IMAGE] 📤 Starting upload for image ID: ${imageId}`);
    console.log('[IMAGE] 📍 Local path:', localPath);
    
    // Update status to uploading
    console.log('[IMAGE] 🔄 Updating status to: uploading');
    await updateImageUploadStatus(imageId, 'uploading');
    
    // Get provider and upload
    const provider = await StorageProviderFactory.getProvider();
    console.log('[IMAGE] ☁️ Using storage provider:', provider.getProviderType());
    
    // Check if file exists before uploading
    console.log('[IMAGE] 🔍 Verifying file exists...');
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (!fileInfo.exists) {
      console.error('[IMAGE] ❌ File not found:', localPath);
      throw new Error(`Local image file not found: ${localPath}`);
    }
    console.log('[IMAGE] ✅ File verified, size:', fileInfo.size ? `${(fileInfo.size / 1024).toFixed(2)} KB` : 'unknown');
    
    // Perform upload
    console.log('[IMAGE] 🚀 Initiating upload to cloud...');
    const result = await provider.uploadImage(localPath);
    console.log('[IMAGE] ✅ Upload successful!');
    console.log('[IMAGE] 🔗 URL:', result.url);
    console.log('[IMAGE] ☁️ Provider:', result.provider);
    
    // Update database with success
    console.log('[IMAGE] 🗄️ Updating database status to: synced');
    await updateImageUploadStatus(
      imageId,
      'synced',
      result.url,
      result.provider
    );
    
    console.log('[IMAGE] ✨ Image upload completed successfully');
    
    return {
      imageId,
      success: true,
      url: result.url,
      provider: result.provider,
    };
  } catch (error) {
    console.error('[IMAGE] ❌ Upload failed for image', imageId, ':', error);
    console.error('[IMAGE] Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // Update database with failure (auto-increments retry count)
    console.log('[IMAGE] 🔄 Updating status to: failed');
    await updateImageUploadStatus(
      imageId,
      'failed',
      null,
      null
    );
    
    return {
      imageId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
};

/**
 * Upload all pending/failed images for a specific survey
 * This is called BEFORE submitting the survey to backend
 */
export const uploadSurveyImages = async (
  surveyId: string
): Promise<SurveyUploadResult> => {
  try {
    console.log(`[SurveyImageUpload] Starting image upload for survey: ${surveyId}`);
    
    // Lock provider for this sync session
    await lockProviderForSync();
    
    // Get all pending and failed images for this survey
    const allImages = await getPendingAndFailedImages();
    const surveyImages = allImages.filter(img => img.surveyId === surveyId);
    
    console.log(`[SurveyImageUpload] Found ${surveyImages.length} images to upload`);
    
    if (surveyImages.length === 0) {
      releaseProviderLock();
      return {
        surveyId,
        allImagesUploaded: true,
        uploadedCount: 0,
        failedCount: 0,
        imageUrls: {},
      };
    }
    
    // Upload images with concurrency control (max 3 parallel)
    const MAX_PARALLEL = 3;
    const results: ImageUploadResult[] = [];
    
    // Process in batches
    for (let i = 0; i < surveyImages.length; i += MAX_PARALLEL) {
      const batch = surveyImages.slice(i, i + MAX_PARALLEL);
      console.log(`[SurveyImageUpload] Processing batch ${Math.floor(i / MAX_PARALLEL) + 1}`);
      
      const batchResults = await Promise.all(
        batch.map(img => uploadSingleImage(img.id!, img.photoUri))
      );
      
      results.push(...batchResults);
      
      // Small delay between batches to prevent overwhelming network
      if (i + MAX_PARALLEL < surveyImages.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Compile results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    // Create URL mapping for survey submission
    const imageUrls: Record<string, string> = {};
    successful.forEach(result => {
      const image = surveyImages.find(img => img.id === result.imageId);
      if (image) {
        imageUrls[image.label] = result.url!;
      }
    });
    
    // Release provider lock
    releaseProviderLock();
    
    console.log(`[SurveyImageUpload] Completed: ${successful.length} succeeded, ${failed.length} failed`);
    
    return {
      surveyId,
      allImagesUploaded: failed.length === 0,
      uploadedCount: successful.length,
      failedCount: failed.length,
      imageUrls,
    };
  } catch (error) {
    console.error(`[SurveyImageUpload] Critical error for survey ${surveyId}:`, error);
    releaseProviderLock(); // Ensure lock is released
    
    return {
      surveyId,
      allImagesUploaded: false,
      uploadedCount: 0,
      failedCount: 999, // Indicate critical failure
      imageUrls: {},
    };
  }
};

/**
 * Get upload statistics for display in UI
 */
export const getImageUploadStats = async (): Promise<{
  pending: number;
  uploading: number;
  synced: number;
  failed: number;
  totalSize: number;
}> => {
  try {
    const pending = await getPendingAndFailedImages();
    const pendingCount = pending.filter(img => img.status === 'pending').length;
    const failedCount = pending.filter(img => img.status === 'failed').length;
    
    // Note: We'd need additional queries for uploading and synced counts
    // For now, returning basic stats
    
    return {
      pending: pendingCount,
      uploading: 0, // Would need query
      synced: 0, // Would need query
      failed: failedCount,
      totalSize: 0, // Would need FileSystem calculation
    };
  } catch (error) {
    console.error('[ImageUpload] Failed to get stats:', error);
    return {
      pending: 0,
      uploading: 0,
      synced: 0,
      failed: 0,
      totalSize: 0,
    };
  }
};
