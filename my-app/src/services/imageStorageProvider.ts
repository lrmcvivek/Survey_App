import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage Provider Interface
 * 
 * Abstracts the image upload mechanism to support multiple providers:
 * - Cloudinary (testing / early production)
 * - GCP (production scale)
 * 
 * Following the implementation guide requirements for provider abstraction
 */

// Storage provider types
export type StorageProviderType = 'cloudinary' | 'gcp';

// Upload result interface
export interface UploadResult {
  url: string;
  provider: StorageProviderType;
}

/**
 * Image Storage Provider Interface
 * 
 * All storage providers must implement this interface
 */
export interface ImageStorageProvider {
  /**
   * Upload an image to the storage provider
   * 
   * @param localPath - Local file path of the compressed image
   * @param geographicData - Optional geographic data for folder organization
   * @returns Upload result with URL and provider info
   */
  uploadImage(localPath: string, geographicData?: {
    ulbName?: string;
    zoneName?: string;
    wardNumber?: string;
    mohallaName?: string;
  }): Promise<UploadResult>;
  
  /**
   * Get the provider type
   */
  getProviderType(): StorageProviderType;
}

/**
 * AsyncStorage key for provider configuration
 */
const STORAGE_PROVIDER_KEY = '@ptms_storage_provider';

/**
 * Default provider (used when no provider is configured)
 */
const DEFAULT_PROVIDER: StorageProviderType = 'cloudinary';

/**
 * Get the currently configured storage provider from AsyncStorage
 */
export const getStorageProviderConfig = async (): Promise<StorageProviderType> => {
  try {
    const provider = await AsyncStorage.getItem(STORAGE_PROVIDER_KEY);
    if (provider === 'cloudinary' || provider === 'gcp') {
      return provider;
    }
    return DEFAULT_PROVIDER;
  } catch (error) {
    console.error('Failed to get storage provider config:', error);
    return DEFAULT_PROVIDER;
  }
};

/**
 * Set the storage provider in AsyncStorage
 * This is used by the /dev/toggle system
 */
export const setStorageProviderConfig = async (provider: StorageProviderType): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_PROVIDER_KEY, provider);
    console.log('Storage provider updated to:', provider);
  } catch (error) {
    console.error('Failed to set storage provider config:', error);
    throw new Error('Failed to update storage provider');
  }
};

/**
 * Reset provider to default
 */
export const resetStorageProviderConfig = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_PROVIDER_KEY);
    console.log('Storage provider reset to default');
  } catch (error) {
    console.error('Failed to reset storage provider:', error);
  }
};

/**
 * Provider Factory
 * 
 * Returns the appropriate provider instance based on current configuration
 * 
 * IMPORTANT: The provider is locked at the start of sync operations to prevent
 * mid-sync provider switching which could cause data inconsistency
 */
export class StorageProviderFactory {
  private static cloudinaryProvider: ImageStorageProvider | null = null;
  private static gcpProvider: ImageStorageProvider | null = null;
  
  /**
   * Get provider instance based on current configuration
   */
  static async getProvider(providerType?: StorageProviderType): Promise<ImageStorageProvider> {
    const type = providerType || await getStorageProviderConfig();
    
    console.log('Getting storage provider:', type);
    
    switch (type) {
      case 'cloudinary':
        return this.getCloudinaryProvider();
      case 'gcp':
        return this.getGCPProvider();
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }
  
  /**
   * Get or create Cloudinary provider instance (singleton pattern)
   */
  private static async getCloudinaryProvider(): Promise<ImageStorageProvider> {
    if (!this.cloudinaryProvider) {
      // Lazy import to prevent circular dependencies
      const { CloudinaryProvider } = require('./providers/CloudinaryProvider');
      this.cloudinaryProvider = new CloudinaryProvider();
      console.log('Created Cloudinary provider instance');
    }
    return this.cloudinaryProvider!;
  }
  
  /**
   * Get or create GCP provider instance (singleton pattern)
   */
  private static async getGCPProvider(): Promise<ImageStorageProvider> {
    if (!this.gcpProvider) {
      // Lazy import to prevent circular dependencies
      const { GCPProvider } = require('./providers/GCPProvider');
      this.gcpProvider = new GCPProvider();
      console.log('Created GCP provider instance');
    }
    return this.gcpProvider!;
  }
  
  /**
   * Clear cached provider instances (useful for testing)
   */
  static clearCache(): void {
    this.cloudinaryProvider = null;
    this.gcpProvider = null;
  }
}

/**
 * Lock provider during sync operations to prevent mid-sync changes
 */
let lockedProvider: StorageProviderType | null = null;

/**
 * Lock the current provider for a sync session
 * This ensures consistency during upload operations
 */
export const lockProviderForSync = async (): Promise<StorageProviderType> => {
  if (lockedProvider) {
    console.log('Provider already locked:', lockedProvider);
    return lockedProvider;
  }
  
  lockedProvider = await getStorageProviderConfig();
  console.log('Provider locked for sync:', lockedProvider);
  return lockedProvider;
};

/**
 * Release the provider lock after sync completion
 */
export const releaseProviderLock = (): void => {
  console.log('Releasing provider lock');
  lockedProvider = null;
};

/**
 * Check if provider is currently locked
 */
export const isProviderLocked = (): boolean => {
  return lockedProvider !== null;
};

/**
 * Get the locked provider type (if locked)
 */
export const getLockedProvider = (): StorageProviderType | null => {
  return lockedProvider;
};
