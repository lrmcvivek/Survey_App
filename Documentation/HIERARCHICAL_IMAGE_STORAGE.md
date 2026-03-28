# Hierarchical Image Storage Implementation - Complete Guide

## 🎯 **Overview**

Implemented hierarchical folder organization for survey images in Cloudinary/GCP based on geographic location:
```
ptms_survey_images/
├── ULB_Name_1/
│   ├── Zone_1/
│   │   ├── Ward_5/
│   │   │   ├── Mohalla_A/
│   │   │   │   ├── survey_XXX_khasra_123.jpg
│   │   │   │   └── survey_XXX_front_456.jpg
│   │   │   └── Mohalla_B/
│   │   └── Ward_10/
│   └── Zone_2/
└── ULB_Name_2/
```

---

## 🔧 **Changes Made**

### **1. Database Schema Update** (`sqlite.ts`)

**Added Geographic Columns:**
```typescript
export type SurveyImageRow = {
  // ... existing fields
  ulbName?: string | null;
  zoneName?: string | null;
  wardNumber?: string | null;
  mohallaName?: string | null;
};
```

**Updated Table Schema:**
```sql
CREATE TABLE SurveyImages (
  -- existing columns...
  ulbName TEXT,
  zoneName TEXT,
  wardNumber TEXT,
  mohallaName TEXT
);
```

---

### **2. Image Storage Service** (`imageStorage.ts`)

**Updated Function Signature:**
```typescript
export const storeImageForSurvey = async (
  surveyId: string,
  tempImageUri: string,
  label: string,
  geographicData?: {
    ulbName?: string;
    zoneName?: string;
    wardNumber?: string;
    mohallaName?: string;
  }
): Promise<string>
```

**Stores Geographic Metadata:**
```typescript
await insertSurveyImage({
  // ... existing fields
  ulbName: geographicData?.ulbName || null,
  zoneName: geographicData?.zoneName || null,
  wardNumber: geographicData?.wardNumber || null,
  mohallaName: geographicData?.mohallaName || null,
});
```

---

### **3. Storage Provider Interface** (`imageStorageProvider.ts`)

**Updated Interface:**
```typescript
export interface ImageStorageProvider {
  uploadImage(
    localPath: string,
    geographicData?: {
      ulbName?: string;
      zoneName?: string;
      wardNumber?: string;
      mohallaName?: string;
    }
  ): Promise<UploadResult>;
}
```

---

### **4. Cloudinary Provider** (`CloudinaryProvider.ts`)

**Passes Geographic Data to Backend:**
```typescript
async uploadImage(localPath: string, geographicData?: {...}) {
  const formData = new FormData();
  formData.append('image', file);
  
  // Append geographic data
  if (geographicData) {
    formData.append('ulbName', geographicData.ulbName || '');
    formData.append('zoneName', geographicData.zoneName || '');
    formData.append('wardNumber', geographicData.wardNumber || '');
    formData.append('mohallaName', geographicData.mohallaName || '');
  }
}
```

---

### **5. Backend Cloudinary Service** (`cloudinaryService.ts`)

**Builds Hierarchical Folder Path:**
```typescript
export const uploadToCloudinary = async (
  filePath: string,
  folder: string = 'ptms_survey_images',
  geographicData?: {...}
) => {
  let fullPath = folder;
  if (geographicData) {
    const pathSegments = [folder];
    if (geographicData.ulbName) pathSegments.push(geographicData.ulbName);
    if (geographicData.zoneName) pathSegments.push(geographicData.zoneName);
    if (geographicData.wardNumber) pathSegments.push(geographicData.wardNumber);
    if (geographicData.mohallaName) pathSegments.push(geographicData.mohallaName);
    fullPath = pathSegments.join('/');
  }
  
  // Upload to Cloudinary with fullPath
  await cloudinary.uploader.upload(filePath, { folder: fullPath });
}
```

---

### **6. Backend GCP Service** (`gcpStorageService.ts`)

**Similar Hierarchical Logic:**
```typescript
export const uploadToGCP = async (
  filePath: string,
  destinationPath: string = 'survey_images',
  geographicData?: {...}
) => {
  let fullPath = destinationPath;
  if (geographicData) {
    const pathSegments = [destinationPath];
    // ... build hierarchical path
    fullPath = pathSegments.join('/');
  }
  
  const destination = `${fullPath}/${fileName}`;
  await bucket.upload(filePath, { destination });
}
```

---

### **7. Backend Image Controller** (`imageController.ts`)

**Extracts Geographic Data from Request:**
```typescript
export const uploadImage = async (req: Request, res: Response) => {
  // Extract from request body
  const geographicData = {
    ulbName: req.body.ulbName || undefined,
    zoneName: req.body.zoneName || undefined,
    wardNumber: req.body.wardNumber || undefined,
    mohallaName: req.body.mohallaName || undefined,
  };
  
  // Pass to upload service
  await uploadToCloudinary(req.file.path, 'ptms_survey_images', geographicData);
}
```

---

### **8. Image Upload Service** (`imageUploadService.ts`)

**Passes Geographic Data During Upload:**
```typescript
export const uploadSingleImage = async (
  imageId: number,
  localPath: string,
  geographicData?: {...}
) => {
  const result = await provider.uploadImage(localPath, geographicData);
  // ... rest of upload logic
}
```

**Retrieves from Database:**
```typescript
const allImages = await getPendingAndFailedImages();
const surveyImages = allImages.filter(img => img.surveyId === surveyId);

// Upload with geographic data
surveyImages.forEach(img => {
  const geoData = {
    ulbName: img.ulbName,
    zoneName: img.zoneName,
    wardNumber: img.wardNumber,
    mohallaName: img.mohallaName,
  };
  uploadSingleImage(img.id, img.photoUri, geoData);
});
```

---

## 📋 **Testing Steps**

### **Step 1: Verify Database Schema**

1. Open app and take a photo
2. Check terminal logs for:
```
[IMAGE] 📍 Geographic data: {
  ulbName: "TANDA",
  zoneName: "Zone 1", 
  wardNumber: "Ward 5",
  mohallaName: "Test Mohalla"
}
```

3. Query SQLite directly (optional):
```sql
SELECT * FROM SurveyImages LIMIT 1;
```
Should show geographic columns populated.

---

### **Step 2: Test Upload Flow**

1. Capture 2-3 photos in survey form
2. Navigate back to trigger sync
3. Watch logs for hierarchical path:

**Expected Logs:**
```
[SurveyImageUpload] Starting image upload for survey: survey_TIMESTAMP_ID
[SurveyImageUpload] Images for THIS survey: 3
[IMAGE] 📤 Starting upload for image ID: 1
[IMAGE] 📍 Local path: file:///data/user/0/.../survey_XXX_khasra.jpg
[CloudinaryProvider] Geographic data: {
  ulbName: "TANDA",
  zoneName: "Zone 1",
  wardNumber: "Ward 5", 
  mohallaName: "Test Mohalla"
}
[Cloudinary] Hierarchical folder path: ptms_survey_images/TANDA/Zone 1/Ward 5/Test Mohalla
[Cloudinary] Upload successful: https://cloudinary.com/...
```

---

### **Step 3: Verify Cloudinary Folders**

1. Login to Cloudinary dashboard
2. Navigate to Media Library
3. Check folder structure:
```
ptms_survey_images/
└── TANDA/
    └── Zone 1/
        └── Ward 5/
            └── Test Mohalla/
                ├── survey_XXX_khasra_123.jpg
                └── survey_XXX_front_456.jpg
```

---

### **Step 4: Test Different Locations**

Take surveys in different wards/mohallas and verify they go to separate folders:

**Survey 1** (Ward 5, Test Mohalla):
```
ptms_survey_images/TANDA/Zone 1/Ward 5/Test Mohalla/
```

**Survey 2** (Ward 10, Another Mohalla):
```
ptms_survey_images/TANDA/Zone 1/Ward 10/Another Mohalla/
```

---

## 🎯 **Key Benefits**

1. **Organized Storage**: Clear hierarchy based on geography
2. **Easy Management**: Non-tech staff can identify location from folder name
3. **Efficient Retrieval**: Quick filtering by ULB/Zone/Ward/Mohalla
4. **Scalable**: Works for any number of surveys across multiple locations
5. **Backup-Friendly**: Can backup specific zones/wards independently

---

## 🐛 **Debugging Guide**

### **Issue: Geographic Data Not Captured**

**Check:**
1. Assignment loaded correctly?
   ```
   [Assignment] Loaded and pre-filled form data once
   ```

2. Photo capture has access to assignment?
   ```javascript
   // In SurveyForm.tsx, when calling storeImageForSurvey
   const geoData = assignment ? {
     ulbName: assignment.ulb?.ulbName,
     zoneName: assignment.zone?.zoneName,
     wardNumber: assignment.ward?.wardNumber,
     mohallaName: assignment.mohallas?.[0]?.mohallaName,
   } : undefined;
   
   await storeImageForSurvey(surveyId, uri, label, geoData);
   ```

---

### **Issue: All Images in Single Folder**

**Check:**
1. Backend receiving geographic data?
   ```
   [ImageUpload] Geographic data: { ulbName: "...", zoneName: "..." }
   ```

2. Cloudinary building correct path?
   ```
   [Cloudinary] Hierarchical folder path: ptms_survey_images/ULB/Zone/Ward/Mohalla
   ```

If missing, check FormData append in CloudinaryProvider.

---

## ✅ **Success Indicators**

Look for these logs confirming proper operation:

```
✅ [IMAGE] 📍 Geographic data: { ulbName, zoneName, wardNumber, mohallaName }
✅ [CloudinaryProvider] Geographic data: { ... }
✅ [Cloudinary] Hierarchical folder path: ptms_survey_images/...
✅ [Cloudinary] Upload successful
✅ [SurveyImageUpload] Upload results: 3 succeeded, 0 failed
```

---

**Status**: ✅ IMPLEMENTATION COMPLETE  
**Next Step**: User testing to verify end-to-end flow  
**Confidence**: Very High - comprehensive logging at every step
