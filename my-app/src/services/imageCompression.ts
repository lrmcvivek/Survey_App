import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Image Compression Service
 * 
 * Compresses images to target size of 300-700KB using expo-image-manipulator
 * Following the implementation guide requirements:
 * - Resize to max 1280px width
 * - JPEG format
 * - Quality: 60-70%
 */

export interface CompressionResult {
  uri: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
  width: number;
  height: number;
}

/**
 * Configuration for image compression
 */
const COMPRESSION_CONFIG = {
  maxWidth: 1280, // Max width in pixels
  quality: 0.65, // 65% quality (sweet spot between 60-70%)
  format: SaveFormat.JPEG,
};

/**
 * Get file size in bytes
 */
const getFileSize = async (uri: string): Promise<number> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    // In newer versions of expo-file-system, size might not be available
    // We'll use a workaround by reading the file
    if ('size' in fileInfo && fileInfo.size !== undefined) {
      return fileInfo.size;
    }
    // Fallback: estimate size by reading file (less accurate but works)
    // For now, return 0 if size not available
    console.warn('File size not available in this version of expo-file-system');
    return 0;
  } catch (error) {
    console.error('Failed to get file size:', error);
    return 0;
  }
};

/**
 * Compress an image using expo-image-manipulator
 * 
 * @param uri - The URI of the image to compress
 * @param customConfig - Optional custom configuration overrides
 * @returns Compressed image URI and metadata
 */
export const compressImage = async (
  uri: string,
  customConfig?: Partial<typeof COMPRESSION_CONFIG>
): Promise<CompressionResult> => {
  try {
    const config = { ...COMPRESSION_CONFIG, ...customConfig };
    
    console.log('[IMAGE] 📸 Starting image compression');
    console.log('[IMAGE] 📋 Compression config:', JSON.stringify(config, null, 2));
    console.log('[IMAGE] 📍 Source URI:', uri);

    // Step 1: Get original file size
    const originalSize = await getFileSize(uri);
    const originalSizeKB = (originalSize / 1024).toFixed(2);
    console.log('[IMAGE] 📦 Original image size:', originalSizeKB, 'KB (', originalSize, 'bytes)');

    // Step 2: Resize and compress using new ImageManipulator API
    console.log('[IMAGE] 🔧 Starting image manipulation...');
    
    // Create a manipulation context and chain operations
    const context = ImageManipulator.manipulate(uri);
    
    // Apply resize operation (maintains aspect ratio when only width is specified)
    context.resize({ width: config.maxWidth });
    
    // Render and save with compression
    const renderedImage = await context.renderAsync();
    const manipulatedImage = await renderedImage.saveAsync({
      compress: config.quality,
      format: config.format,
    });

    console.log('[IMAGE] ✅ Image manipulation completed');
    console.log('[IMAGE] 📐 Dimensions:', manipulatedImage.width, 'x', manipulatedImage.height);

    // Step 3: Get compressed file size
    const compressedSize = await getFileSize(manipulatedImage.uri);
    const compressedSizeKB = (compressedSize / 1024).toFixed(2);
    console.log('[IMAGE] 📦 Compressed image size:', compressedSizeKB, 'KB (', compressedSize, 'bytes)');

    // Step 4: Calculate compression ratio
    const compressionRatio = originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0;
    const savedKB = ((originalSize - compressedSize) / 1024).toFixed(2);
    console.log('[IMAGE] 📉 Compression ratio:', compressionRatio.toFixed(2), '% reduction');
    console.log('[IMAGE] 💾 Space saved:', savedKB, 'KB');
    
    console.log('[IMAGE] ✨ Compression successful!');
    console.log('[IMAGE] Summary:', {
      original: originalSizeKB + ' KB',
      compressed: compressedSizeKB + ' KB',
      reduction: compressionRatio.toFixed(2) + '%',
      saved: savedKB + ' KB',
      dimensions: `${manipulatedImage.width}x${manipulatedImage.height}`,
    });

    return {
      uri: manipulatedImage.uri,
      originalSize,
      compressedSize,
      compressionRatio,
      width: manipulatedImage.width,
      height: manipulatedImage.height,
    };
  } catch (error) {
    console.error('[IMAGE] ❌ Image compression failed:', error);
    console.error('[IMAGE] Error details:', error instanceof Error ? error.message : 'Unknown error');
    // Return original URI if compression fails (fallback)
    throw new Error(`Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Compress image with adaptive quality to hit target size range
 * This is a more aggressive compression that adjusts quality based on result
 * 
 * @param uri - The URI of the image to compress
 * @param targetMinSize - Target minimum size in bytes (default: 300KB)
 * @param targetMaxSize - Target maximum size in bytes (default: 700KB)
 * @returns Compressed image URI and metadata
 */
export const compressImageAdaptive = async (
  uri: string,
  targetMinSize: number = 300 * 1024, // 300KB
  targetMaxSize: number = 700 * 1024  // 700KB
): Promise<CompressionResult> => {
  try {
    console.log('[IMAGE] 🎯 Starting adaptive compression');
    console.log('[IMAGE] 📊 Target range:', {
      min: `${(targetMinSize / 1024).toFixed(0)} KB`,
      max: `${(targetMaxSize / 1024).toFixed(0)} KB`,
    });

    // First pass: Use default quality
    console.log('[IMAGE] 🔄 Pass 1: Using default quality (65%)');
    let result = await compressImage(uri);
    
    // If still too large, reduce quality progressively
    let quality = COMPRESSION_CONFIG.quality;
    const maxAttempts = 3;
    let attempts = 0;

    while (result.compressedSize && result.compressedSize > targetMaxSize && attempts < maxAttempts) {
      quality -= 0.1; // Reduce quality by 10%
      if (quality < 0.4) {
        quality = 0.4; // Don't go below 40% quality
        break;
      }

      console.log(`[IMAGE] ⚠️ Image still too large (${(result.compressedSize / 1024).toFixed(2)} KB), reducing quality to ${(quality * 100).toFixed(0)}%`);
      
      console.log(`[IMAGE] 🔄 Pass ${attempts + 2}: Retrying with ${Math.round(quality * 100)}% quality`);
      result = await compressImage(uri, { quality });
      attempts++;
    }

    const finalSizeKB = (result.compressedSize || 0) / 1024;
    console.log('[IMAGE] ✅ Adaptive compression completed');
    console.log('[IMAGE] Summary:', {
      finalSize: `${finalSizeKB.toFixed(2)} KB`,
      finalQuality: `${Math.round(quality * 100)}%`,
      totalAttempts: attempts + 1,
      withinTarget: finalSizeKB <= (targetMaxSize / 1024),
    });

    return result;
  } catch (error) {
    console.error('[IMAGE] ❌ Adaptive compression failed:', error);
    console.error('[IMAGE] Error details:', error instanceof Error ? error.message : 'Unknown error');
    // Fallback to standard compression
    console.log('[IMAGE] ⚠️ Falling back to standard compression');
    return await compressImage(uri);
  }
};

/**
 * Validate that an image meets size requirements
 * 
 * @param uri - The URI of the image to validate
 * @param maxSize - Maximum allowed size in bytes (default: 1MB)
 * @returns True if image is within size limit
 */
export const validateImageSize = async (
  uri: string,
  maxSize: number = 1024 * 1024 // 1MB default
): Promise<boolean> => {
  try {
    const size = await getFileSize(uri);
    const isValid = size <= maxSize;
    
    if (!isValid) {
      console.warn(`Image size (${(size / 1024).toFixed(2)}KB) exceeds limit (${(maxSize / 1024).toFixed(2)}KB)`);
    }
    
    return isValid;
  } catch (error) {
    console.error('Image validation failed:', error);
    return false;
  }
};
