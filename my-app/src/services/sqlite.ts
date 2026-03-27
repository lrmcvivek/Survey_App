import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

export type SurveyImageRow = {
  id?: number;
  surveyId: string | null;
  photoUri: string; // local file path
  label: string; // e.g., 'khasra' | 'front' | 'left' | 'right' | 'other1' | 'other2'
  timestamp: string; // ISO string
  status?: 'pending' | 'uploading' | 'synced' | 'failed'; // upload status
  retryCount?: number; // number of failed attempts
  provider?: 'cloudinary' | 'gcp' | null; // storage provider used
  uploadedUrl?: string | null; // URL after successful upload
};

let dbPromise: Promise<SQLiteDatabase> | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
let isDatabaseCorrupted = false;
let lastErrorTime = 0;
const ERROR_COOLDOWN = 5000; // 5 seconds between error attempts

// Reset database state completely
const resetDatabaseState = () => {
  dbPromise = null;
  initializationPromise = null;
  isInitialized = false;
  console.log('Database state reset');
};

// Check if we should attempt database operations
const shouldAttemptDatabase = (): boolean => {
  const now = Date.now();
  if (isDatabaseCorrupted && (now - lastErrorTime) < ERROR_COOLDOWN) {
    return false;
  }
  return true;
};

export const getDbAsync = async (): Promise<SQLiteDatabase | null> => {
  if (!shouldAttemptDatabase()) {
    console.log('Database corrupted, skipping operation');
    return null;
  }

  try {
    if (!dbPromise) {
      console.log('Opening new database connection...');
      dbPromise = openDatabaseAsync('app.db');
    }
    
    const db = await dbPromise;
    
    // Simple test to ensure database is working
    await db.getAllAsync('SELECT 1;');
    
    return db;
  } catch (error) {
    console.error('Database connection failed:', error);
    isDatabaseCorrupted = true;
    lastErrorTime = Date.now();
    resetDatabaseState();
    return null;
  }
};

export const initializeDatabase = async (): Promise<void> => {
  console.log('[SQLite] Initialize called, isInitialized:', isInitialized);
  
  if (isInitialized || !shouldAttemptDatabase()) {
    console.log('[SQLite] Already initialized or database not allowed');
    return;
  }
  
  if (initializationPromise) {
    console.log('[SQLite] Returning existing initialization promise');
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    try {
      console.log('[SQLite] Starting database initialization...');
      const db = await getDbAsync();
      if (!db) {
        console.error('[SQLite] No database connection available');
        throw new Error('Database connection not available');
      }
      
      console.log('[SQLite] Dropping existing SurveyImages table if exists...');
      // Drop old table to ensure clean schema (testing phase only)
      await db.execAsync(`DROP TABLE IF EXISTS SurveyImages;`);
      
      console.log('[SQLite] Creating SurveyImages table with new schema...');
      await db.execAsync(
        `CREATE TABLE SurveyImages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          surveyId TEXT,
          photoUri TEXT NOT NULL,
          label TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          retryCount INTEGER DEFAULT 0,
          provider TEXT,
          uploadedUrl TEXT
        );`
      );
      
      console.log('[SQLite] Creating indexes...');
      await db.execAsync(
        `CREATE INDEX idx_survey_images_surveyId ON SurveyImages(surveyId);`
      );
      await db.execAsync(
        `CREATE INDEX idx_survey_images_status ON SurveyImages(status);`
      );
      
      console.log('[SQLite] Testing table access...');
      await db.getAllAsync('SELECT COUNT(*) as count FROM SurveyImages;');
      
      isInitialized = true;
      isDatabaseCorrupted = false;
      console.log('[SQLite] Database initialized successfully');
    } catch (error) {
      console.error('[SQLite] Failed to initialize database:', error);
      console.error('[SQLite] Error stack:', error instanceof Error ? error.stack : 'No stack');
      isInitialized = false;
      initializationPromise = null;
      isDatabaseCorrupted = true;
      lastErrorTime = Date.now();
      throw error;
    }
  })();
  
  return initializationPromise;
};

export const insertSurveyImage = async (row: SurveyImageRow): Promise<number> => {
  // Try database first - no fallback storage as per new requirements
  if (shouldAttemptDatabase()) {
    try {
      const db = await getDbAsync();
      if (db) {
        await initializeDatabase();
        
        const res: any = await db.runAsync(
          `INSERT INTO SurveyImages (surveyId, photoUri, label, timestamp, status, retryCount, provider, uploadedUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [row.surveyId, row.photoUri, row.label, row.timestamp, row.status || 'pending', row.retryCount || 0, row.provider || null, row.uploadedUrl || null]
        );
        
        const insertId = res?.lastInsertRowId || 0;
        console.log('Image URI stored in database with ID:', insertId);
        return insertId;
      }
    } catch (error) {
      console.error('Database insert failed:', error);
      isDatabaseCorrupted = true;
      lastErrorTime = Date.now();
      throw error; // Re-throw to indicate failure
    }
  }
  
  throw new Error('Database not available for image URI storage');
};

export const getImagesBySurveyId = async (surveyId: string | null): Promise<SurveyImageRow[]> => {
  // Only use database - no fallback storage as per requirements
  if (shouldAttemptDatabase()) {
    try {
      const db = await getDbAsync();
      if (db) {
        await initializeDatabase();
        
        if (surveyId === null) {
          return await db.getAllAsync<SurveyImageRow>(
            `SELECT id, surveyId, photoUri, label, timestamp, status, retryCount, provider, uploadedUrl FROM SurveyImages WHERE surveyId IS NULL ORDER BY timestamp DESC;`
          );
        } else {
          return await db.getAllAsync<SurveyImageRow>(
            `SELECT id, surveyId, photoUri, label, timestamp, status, retryCount, provider, uploadedUrl FROM SurveyImages WHERE surveyId = ? ORDER BY timestamp DESC;`,
            [surveyId]
          );
        }
      }
    } catch (error) {
      console.error('Database query failed:', error);
      isDatabaseCorrupted = true;
      lastErrorTime = Date.now();
    }
  }
  
  console.warn('Database not available, returning empty image list');
  return [];
};

// New helper functions for upload status management
export const updateImageUploadStatus = async (
  imageId: number, 
  status: 'pending' | 'uploading' | 'synced' | 'failed',
  uploadedUrl?: string | null,
  provider?: 'cloudinary' | 'gcp' | null
): Promise<void> => {
  if (shouldAttemptDatabase()) {
    try {
      const db = await getDbAsync();
      if (db) {
        await initializeDatabase();
        
        if (status === 'failed') {
          // Increment retry count on failure
          await db.runAsync(
            `UPDATE SurveyImages SET status = ?, uploadedUrl = ?, provider = ?, retryCount = retryCount + 1 WHERE id = ?;`,
            [status, uploadedUrl ?? null, provider ?? null, imageId]
          );
        } else {
          await db.runAsync(
            `UPDATE SurveyImages SET status = ?, uploadedUrl = ?, provider = ? WHERE id = ?;`,
            [status, uploadedUrl ?? null, provider ?? null, imageId]
          );
        }
        console.log(`Image ${imageId} status updated to: ${status}`);
        return;
      }
    } catch (error) {
      console.error('Failed to update image upload status:', error);
    }
  }
  
  console.warn('Database not available for status update');
};

export const getImagesByStatus = async (status: 'pending' | 'uploading' | 'synced' | 'failed'): Promise<SurveyImageRow[]> => {
  if (shouldAttemptDatabase()) {
    try {
      const db = await getDbAsync();
      if (db) {
        await initializeDatabase();
        
        return await db.getAllAsync<SurveyImageRow>(
          `SELECT id, surveyId, photoUri, label, timestamp, status, retryCount, provider, uploadedUrl FROM SurveyImages WHERE status = ? ORDER BY timestamp ASC;`,
          [status]
        );
      }
    } catch (error) {
      console.error('Database query failed:', error);
      isDatabaseCorrupted = true;
      lastErrorTime = Date.now();
    }
  }
  
  return [];
};

export const getPendingAndFailedImages = async (): Promise<SurveyImageRow[]> => {
  if (shouldAttemptDatabase()) {
    try {
      const db = await getDbAsync();
      if (db) {
        await initializeDatabase();
        
        return await db.getAllAsync<SurveyImageRow>(
          `SELECT id, surveyId, photoUri, label, timestamp, status, retryCount, provider, uploadedUrl FROM SurveyImages WHERE status IN ('pending', 'failed') ORDER BY timestamp ASC;`
        );
      }
    } catch (error) {
      console.error('Database query failed:', error);
      isDatabaseCorrupted = true;
      lastErrorTime = Date.now();
    }
  }
  
  return [];
};

export const deleteImageById = async (id: number): Promise<void> => {
  if (shouldAttemptDatabase()) {
    try {
      const db = await getDbAsync();
      if (db) {
        await db.runAsync(`DELETE FROM SurveyImages WHERE id = ?;`, [id]);
        console.log('Image record deleted from database:', id);
        return;
      }
    } catch (error) {
      console.error('Failed to delete image by ID:', error);
    }
  }
  
  console.warn('Database not available for image deletion');
};

export const deleteImagesBySurveyId = async (surveyId: string | null): Promise<void> => {
  if (shouldAttemptDatabase()) {
    try {
      const db = await getDbAsync();
      if (db) {
        if (surveyId === null) {
          await db.runAsync(`DELETE FROM SurveyImages WHERE surveyId IS NULL;`);
        } else {
          await db.runAsync(`DELETE FROM SurveyImages WHERE surveyId = ?;`, [surveyId]);
        }
        console.log('Image records deleted from database for survey:', surveyId);
        return;
      }
    } catch (error) {
      console.error('Failed to delete images by survey ID:', error);
    }
  }
  
  console.warn('Database not available for image deletion');
};

// Health check function to verify database state
export const checkDatabaseHealth = async (): Promise<boolean> => {
  if (!shouldAttemptDatabase()) {
    return false;
  }
  
  try {
    const db = await getDbAsync();
    if (!db) return false;
    
    // Try to perform a simple query to check if table exists
    const result = await db.getAllAsync(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='SurveyImages';`
    );
    
    const tableExists = result.length > 0;
    
    if (!tableExists) {
      console.warn('SurveyImages table does not exist, reinitializing...');
      isInitialized = false;
      initializationPromise = null;
      await initializeDatabase();
    }
    
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    isDatabaseCorrupted = true;
    lastErrorTime = Date.now();
    return false;
  }
};

// Initialize on import to ensure table exists
// Commented out to prevent race conditions during app startup
// Database will be initialized when first needed
// initializeDatabase().catch((e) => {
//   console.error('SQLite init failed on import:', e);
//   isDatabaseCorrupted = true;
//   lastErrorTime = Date.now();
// });