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
  localPath: string,
  geographicData?: {
    ulbName?: string;
    zoneName?: string;
    wardNumber?: string;
    mohallaName?: string;
  }
): Promise<ImageUploadResult> => {
  try {
    console.log(`[IMAGE] 📤 Starting upload for image ID: ${imageId}`);
    console.log('[IMAGE] 📍 Local path:', localPath);
    console.log('[IMAGE] 📍 Geographic data for upload:', geographicData);
    
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
    const result = await provider.uploadImage(localPath, geographicData);
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
    console.log(`[SurveyImageUpload] ════════════════════════════════`);
    console.log(`[SurveyImageUpload] Starting image upload for survey: ${surveyId}`);
    console.log(`[SurveyImageUpload] Timestamp: ${new Date().toISOString()}`);
    console.log(`[SurveyImageUpload] ════════════════════════════════`);
    
    // Lock provider for this sync session
    console.log('[SurveyImageUpload] 🔒 Locking provider for sync...');
    await lockProviderForSync();
    console.log('[SurveyImageUpload] ✅ Provider locked');
    
    // Get all pending and failed images for this survey
    console.log('[SurveyImageUpload] 📊 Querying database for pending/failed images...');
    const allImages = await getPendingAndFailedImages();
    console.log(`[SurveyImageUpload] Total pending/failed images in DB: ${allImages?.length || 0}`);
    
    // Filter by surveyId
    const surveyImages = allImages?.filter(img => img.surveyId === surveyId) || [];
    console.log(`[SurveyImageUpload] Images for THIS survey (${surveyId}): ${surveyImages.length}`);
    
    if (surveyImages.length > 0) {
      console.log('[SurveyImageUpload] 📋 Image details:');
      surveyImages.forEach((img, idx) => {
        console.log(`  [${idx + 1}] ID: ${img.id}, Label: ${img.label}, Status: ${img.status}, SurveyId: ${img.surveyId}`);
      });
    }
    
    if (surveyImages.length === 0) {
      console.warn('[SurveyImageUpload] ⚠️ No images found for this survey!');
      console.warn('[SurveyImageUpload] Possible causes:');
      console.warn('[SurveyImageUpload]   1. Images were never inserted into database');
      console.warn('[SurveyImageUpload]   2. SurveyId mismatch between insert and query');
      console.warn('[SurveyImageUpload]   3. Status was changed from "pending" to something else');
      console.warn('[SurveyImageUpload]   4. Database query failed silently');
      
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
    
    console.log(`[SurveyImageUpload] 🚀 Starting upload of ${surveyImages.length} images in batches of ${MAX_PARALLEL}...`);
    
    // Process in batches
    for (let i = 0; i < surveyImages.length; i += MAX_PARALLEL) {
      const batch = surveyImages.slice(i, i + MAX_PARALLEL);
      console.log(`[SurveyImageUpload] Processing batch ${Math.floor(i / MAX_PARALLEL) + 1}/${Math.ceil(surveyImages.length / MAX_PARALLEL)}`);
      
      const batchResults = await Promise.all(
        batch.map(img => uploadSingleImage(
          img.id!, 
          img.photoUri,
          {
            ulbName: img.ulbName || undefined,
            zoneName: img.zoneName || undefined,
            wardNumber: img.wardNumber || undefined,
            mohallaName: img.mohallaName || undefined,
          }
        ))
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
    
    console.log(`[SurveyImageUpload] 📊 Upload results: ${successful.length} succeeded, ${failed.length} failed`);
    
    // Create URL mapping for survey submission
    const imageUrls: Record<string, string> = {};
    successful.forEach(result => {
      const image = surveyImages.find(img => img.id === result.imageId);
      if (image) {
        imageUrls[image.label] = result.url!;
        console.log(`[SurveyImageUpload] ✅ Mapped ${image.label} → ${result.url}`);
      }
    });
    
    // Release provider lock
    releaseProviderLock();
    console.log('[SurveyImageUpload] 🔓 Provider lock released');
    console.log(`[SurveyImageUpload] ════════════════════════════════`);
    console.log(`[SurveyImageUpload] Upload completed successfully`);
    console.log(`[SurveyImageUpload] ════════════════════════════════`);
    
    return {
      surveyId,
      allImagesUploaded: failed.length === 0,
      uploadedCount: successful.length,
      failedCount: failed.length,
      imageUrls,
    };
  } catch (error) {
    console.error(`[SurveyImageUpload] ❌ Critical error for survey ${surveyId}:`, error);
    console.error(`[SurveyImageUpload] Error stack:`, error instanceof Error ? error.stack : 'No stack');
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
