import type { ImageStorageProvider, UploadResult, StorageProviderType } from '../imageStorageProvider';
import api from '../../api/axiosConfig';

/**
 * Cloudinary Provider Implementation
 * 
 * Handles image uploads to Cloudinary via backend proxy
 * Mobile → Backend API → Cloudinary
 */
export class CloudinaryProvider implements ImageStorageProvider {
  private readonly providerType: StorageProviderType = 'cloudinary';
  
  /**
   * Get the provider type
   */
  getProviderType(): StorageProviderType {
    return this.providerType;
  }
  
  /**
   * Upload image to Cloudinary via backend proxy
   * 
   * @param localPath - Local file path of the compressed image
   * @returns Upload result with Cloudinary URL
   */
  async uploadImage(localPath: string): Promise<UploadResult> {
    console.log('CloudinaryProvider: Starting upload for:', localPath);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Append the file to FormData
      const file: any = {
        uri: localPath,
        type: 'image/jpeg', // Assume JPEG (compressed images are JPEG)
        name: `image_${Date.now()}.jpg`,
      };
      
      formData.append('image', file);
      
      console.log('CloudinaryProvider: Uploading to backend...');
      
      // Upload to backend which handles Cloudinary integration
      const response = await api.post('/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.url) {
        console.log('CloudinaryProvider: Upload successful:', response.data.url);
        
        return {
          url: response.data.url,
          provider: 'cloudinary',
        };
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (error) {
      console.error('CloudinaryProvider: Upload failed:', error);
      throw new Error(
        `Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
