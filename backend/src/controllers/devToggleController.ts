import { Request, Response } from 'express';

/**
 * Developer Toggle Controller
 * 
 * Allows runtime switching between storage providers
 * This is accessed via hidden /dev/toggle route
 */

// In-memory storage for provider config (could be moved to database/Redis)
let currentProvider = 'cloudinary'; // Default provider

// Access key verification (should match DEV_CONFIG_KEY in .env)
const ACCESS_KEY = process.env.DEV_CONFIG_KEY || 'ptmsdevconfig@2026';

/**
 * Verify access key for developer tools
 */
export const verifyAccessKey = async (req: Request, res: Response) => {
  try {
    const { accessKey } = req.body;
    
    if (!accessKey) {
      return res.status(400).json({
        success: false,
        error: 'Access key is required',
      });
    }
    
    // Verify the access key
    if (accessKey !== ACCESS_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access key',
      });
    }
    
    console.log('[DevToggle] Access key verified successfully');
    
    res.json({
      success: true,
      message: 'Access granted',
    });
  } catch (error) {
    console.error('[DevToggle] Error verifying access key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify access key',
    });
  }
};

/**
 * Get current storage provider configuration
 */
export const getProviderConfig = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      provider: currentProvider,
      availableProviders: ['cloudinary', 'gcp'],
    });
  } catch (error) {
    console.error('[DevToggle] Error getting provider config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get provider config',
    });
  }
};

/**
 * Set storage provider configuration
 */
export const setProviderConfig = async (req: Request, res: Response) => {
  try {
    const { provider } = req.body;
    
    // Validate provider
    if (!provider || !['cloudinary', 'gcp'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider. Must be "cloudinary" or "gcp"',
      });
    }
    
    // Update provider
    currentProvider = provider;
    
    // Also update environment variable for this process
    process.env.IMAGE_STORAGE_PROVIDER = provider;
    
    console.log('[DevToggle] Provider switched to:', provider);
    
    res.json({
      success: true,
      message: `Provider switched to ${provider}`,
      provider,
    });
  } catch (error) {
    console.error('[DevToggle] Error setting provider config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set provider config',
    });
  }
};

/**
 * Reset provider to default
 */
export const resetProviderConfig = async (req: Request, res: Response) => {
  try {
    currentProvider = 'cloudinary';
    process.env.IMAGE_STORAGE_PROVIDER = 'cloudinary';
    
    console.log('[DevToggle] Provider reset to default');
    
    res.json({
      success: true,
      message: 'Provider reset to default (cloudinary)',
      provider: 'cloudinary',
    });
  } catch (error) {
    console.error('[DevToggle] Error resetting provider config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset provider config',
    });
  }
};
