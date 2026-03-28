import type { ImageStorageProvider, UploadResult, StorageProviderType } from '../imageStorageProvider';
import api from '../../api/axiosConfig';

/**
 * GCP Provider Implementation
 * 
 * Handles image uploads to Google Cloud Platform via backend proxy
 * Mobile → Backend API → Google Cloud Storage
 */
export class GCPProvider implements ImageStorageProvider {
  private readonly providerType: StorageProviderType = 'gcp';
  
  /**
   * Get the provider type
   */
  getProviderType(): StorageProviderType {
    return this.providerType;
  }
  
  /**
   * Upload image to GCP Cloud Storage via backend proxy
   * 
   * @param localPath - Local file path of the compressed image
   * @returns Upload result with GCS public/signed URL
   */
  async uploadImage(localPath: string): Promise<UploadResult> {
    console.log('GCPProvider: Starting upload for:', localPath);
    
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
      
      console.log('GCPProvider: Uploading to backend...');
      
      // Upload to backend which handles GCS integration
      const response = await api.post('/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.url) {
        console.log('GCPProvider: Upload successful:', response.data.url);
        
        return {
          url: response.data.url,
          provider: 'gcp',
        };
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (error) {
      console.error('GCPProvider: Upload failed:', error);
      throw new Error(
        `GCP upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
