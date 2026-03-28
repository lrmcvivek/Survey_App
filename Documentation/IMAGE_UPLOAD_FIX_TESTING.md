# Image Upload Sync Fix - Testing Guide

## 🔧 **Fixes Implemented**

### 1. Enhanced Diagnostic Logging
- Added comprehensive logging to `getPendingAndFailedImages()`
- Logs database access, query execution, and results
- Shows sample data when images are found

### 2. Image Upload Service Logging
- Detailed logging throughout upload process
- Shows total images vs images for specific survey
- Displays image details (ID, label, status, surveyId)
- Warns about possible causes when no images found

### 3. Database Insert Logging  
- Comprehensive logging for insert operations
- Verifies surveyId, label, status before insert
- Confirms successful insert with generated ID

---

## 📋 **Testing Steps**

### **Test 1: Basic Image Capture & Storage**

**Purpose**: Verify images are being stored in SQLite correctly

**Steps**:
1. Open SurveyForm (new survey)
2. Fill 2-3 form fields
3. Click camera icon for "Khasra" photo
4. Take a photo
5. Wait for compression and storage

**Expected Logs**:
```
[CAMERA] Setting photo for key: khasra URI length: XXX
[CAMERA] New photo state created successfully, ref updated
[IMAGE] 🗄️ Storing metadata in SQLite...
[SQLite] 📝 insertSurveyImage called
[SQLite] Survey ID: survey_TIMESTAMP_ID
[SQLite] Label: khasra
[SQLite] Status: pending
[SQLite] Attempting database insert...
[SQLite] Database instance obtained: true
[SQLite] Database initialized, executing INSERT...
[SQLite] ✅ Insert successful! Generated ID: 1
[IMAGE] ✅ Database record created successfully
```

**✅ Pass Criteria**:
- Insert is called with correct surveyId
- Status is 'pending'
- Insert generates an ID (>0)
- No errors logged

---

### **Test 2: Multiple Photos**

**Purpose**: Verify multiple photos can be stored

**Steps**:
1. Take photo for "Front" side
2. Take photo for "Left" side  
3. Take photo for "Right" side

**Expected Logs**:
- Each photo should generate sequential IDs (1, 2, 3...)
- All should have status='pending'
- All should have same surveyId

**✅ Pass Criteria**:
- All inserts successful
- Sequential IDs generated
- Consistent surveyId across all photos

---

### **Test 3: Sync Process - Image Query**

**Purpose**: Verify sync can find pending images

**Steps**:
1. After taking 2-3 photos, navigate back to dashboard
2. Dashboard will auto-trigger sync for submitted surveys

**Expected Logs**:
```
[Sync] Starting sync for survey: survey_TIMESTAMP_ID
[Sync] Uploading images for survey survey_TIMESTAMP_ID...
[SurveyImageUpload] ════════════════════════════════
[SurveyImageUpload] Starting image upload for survey: survey_TIMESTAMP_ID
[SurveyImageUpload] 🔒 Locking provider for sync...
[SurveyImageUpload] ✅ Provider locked
[SurveyImageUpload] 📊 Querying database for pending/failed images...
[SQLite] 🔍 getPendingAndFailedImages called
[SQLite] Attempting database access...
[SQLite] Database instance obtained: true
[SQLite] Database initialized, executing query...
[SQLite] Query returned 3 images
[SQLite] Sample result: { id: 1, surveyId: 'survey_XXX', status: 'pending', label: 'khasra' }
[SurveyImageUpload] Total pending/failed images in DB: 3
[SurveyImageUpload] Images for THIS survey (survey_TIMESTAMP_ID): 3
[SurveyImageUpload] 📋 Image details:
  [1] ID: 1, Label: khasra, Status: pending, SurveyId: survey_TIMESTAMP_ID
  [2] ID: 2, Label: front, Status: pending, SurveyId: survey_TIMESTAMP_ID
  [3] ID: 3, Label: left, Status: pending, SurveyId: survey_TIMESTAMP_ID
```

**✅ Pass Criteria**:
- Query returns correct number of images
- Images filtered correctly by surveyId
- Status shows 'pending' for all
- Image details displayed correctly

---

### **Test 4: Full Image Upload**

**Purpose**: Verify images upload to cloud successfully

**Steps**:
1. Ensure internet connection available
2. Sync should automatically start after query

**Expected Logs**:
```
[SurveyImageUpload] 🚀 Starting upload of 3 images in batches of 3...
[SurveyImageUpload] Processing batch 1/1
[IMAGE] 📤 Starting upload for image ID: 1
[IMAGE] 📍 Local path: file:///data/user/0/.../survey_XXX_khasra_YYY.jpg
[IMAGE] 🔄 Updating status to: uploading
[IMAGE] ☁️ Using storage provider: cloudinary
[IMAGE] 🔍 Verifying file exists...
[IMAGE] ✅ File verified, size: XXX KB
[IMAGE] 🚀 Initiating upload to cloud...
[IMAGE] ✅ Upload successful!
[IMAGE] 🔗 URL: https://cloudinary.com/...
[IMAGE] 🗄️ Updating database status to: synced
[SurveyImageUpload] 📊 Upload results: 3 succeeded, 0 failed
[SurveyImageUpload] ✅ Mapped khasra → https://cloudinary.com/...
[SurveyImageUpload] ✅ Mapped front → https://cloudinary.com/...
[SurveyImageUpload] ✅ Mapped left → https://cloudinary.com/...
[SurveyImageUpload] 🔓 Provider lock released
[SurveyImageUpload] ════════════════════════════════
[SurveyImageUpload] Upload completed successfully
[SurveyImageUpload] ════════════════════════════════
```

**✅ Pass Criteria**:
- All images upload successfully
- Status updates to 'synced'
- URLs mapped correctly
- No failures reported

---

### **Test 5: Survey Submission with Images**

**Purpose**: Verify uploaded image URLs attached to survey

**Steps**:
1. After image upload completes, survey submission should start
2. Check logs for URL attachment

**Expected Logs**:
```
[Sync] Submitting survey survey_TIMESTAMP_ID to backend...
[Sync] Attaching 3 image URLs to survey payload
[Sync] Mapped khasra → image1Url: https://cloudinary.com/...
[Sync] Mapped front → image2Url: https://cloudinary.com/...
[Sync] Mapped left → image3Url: https://cloudinary.com/...
```

**✅ Pass Criteria**:
- All 3 image URLs attached
- Correct field mapping (khasra→image1Url, etc.)
- Survey submits successfully

---

### **Test 6: Error Scenarios**

#### **Scenario A: No Images Found**

**Trigger**: Query returns 0 images

**Expected Warning Logs**:
```
[SurveyImageUpload] ⚠️ No images found for this survey!
[SurveyImageUpload] Possible causes:
[SurveyImageUpload]   1. Images were never inserted into database
[SurveyImageUpload]   2. SurveyId mismatch between insert and query
[SurveyImageUpload]   3. Status was changed from "pending" to something else
[SurveyImageUpload]   4. Database query failed silently
```

**Action Required**: Check previous logs to identify which cause

---

#### **Scenario B: Database Not Available**

**Trigger**: Database corrupted or not initialized

**Expected Error Logs**:
```
[SQLite] 🚫 Database marked as corrupted, cannot access
OR
[SQLite] ❌ Initialization failed: <error>
```

**Action Required**: Restart app, database will reinitialize

---

#### **Scenario C: Upload Fails**

**Trigger**: Network error or cloud storage issue

**Expected Logs**:
```
[IMAGE] ❌ Upload failed for image 1: <error>
[IMAGE] 🔄 Updating status to: failed
[SurveyImageUpload] 📊 Upload results: 2 succeeded, 1 failed
```

**Action Required**: Retry sync later, failed images remain in DB with status='failed'

---

## 🐛 **Debugging Guide**

### **Problem: 0 Images Found During Sync**

**Check these logs in order**:

1. **During Photo Capture**:
   ```
   Look for: [SQLite] ✅ Insert successful! Generated ID: X
   If missing: Insert failed - check database initialization
   ```

2. **During Sync Query**:
   ```
   Look for: [SQLite] Query returned X images
   If X=0: Query failed or no pending images
   ```

3. **SurveyId Mismatch**:
   ```
   Compare: Insert surveyId vs Query surveyId
   If different: SurveyId generation inconsistent
   ```

4. **Status Change**:
   ```
   Check: [SQLite] Sample result: { status: 'pending' }
   If status != 'pending': Status changed unexpectedly
   ```

---

### **Problem: Upload Fails**

**Check these**:

1. **File Exists**:
   ```
   Look for: [IMAGE] ✅ File verified, size: XXX KB
   If missing: File path incorrect or file deleted
   ```

2. **Provider Lock**:
   ```
   Look for: [SurveyImageUpload] ✅ Provider locked
   If missing: Lock acquisition failed
   ```

3. **Network Error**:
   ```
   Look for: [IMAGE] ❌ Upload failed: <network error>
   Action: Check internet connection
   ```

---

## ✅ **Success Indicators**

### **Complete Successful Flow**:

```
1. Photo captured
   ↓
2. Insert successful (ID generated)
   ↓
3. Query returns correct count
   ↓
4. Upload succeeds (all images)
   ↓
5. URLs mapped to survey
   ↓
6. Survey submitted with images
   ↓
7. Images cleaned up (deleted from device)
```

**All these logs should appear in sequence without errors.**

---

## 📊 **Log Analysis Checklist**

When reviewing logs, verify:

- [ ] Insert called with correct surveyId
- [ ] Insert generates valid ID (>0)
- [ ] Status = 'pending' after insert
- [ ] Query returns expected count
- [ ] Query filters by correct surveyId
- [ ] Upload starts for all images
- [ ] Status updates to 'synced'
- [ ] URLs mapped correctly
- [ ] No error messages in flow
- [ ] Provider lock acquired/released properly

---

## 🎯 **What to Report**

If issues persist, provide these logs:

1. **Photo Capture Logs**: From camera open to insert complete
2. **Sync Start Logs**: From sync trigger to query execution
3. **Query Result Logs**: The `[SQLite] Query returned X images` line
4. **Error Logs**: Any lines with ❌ or "failed"

**Format**: Copy full log output from Android Studio terminal or device logs.

---

## 🔧 **Advanced Diagnostics**

### **Manual Database Query** (if needed):

Add this temporary code to check database directly:

```typescript
// In SurveyForm.tsx or any component
const checkDatabase = async () => {
  const images = await getImagesBySurveyId('your_survey_id');
  console.log('Direct DB query result:', images);
};
```

Run this to bypass sync and check what's actually in database.

---

**Last Updated**: March 28, 2026  
**Status**: ✅ READY FOR TESTING  
**Confidence**: High - comprehensive logging will identify exact failure point
