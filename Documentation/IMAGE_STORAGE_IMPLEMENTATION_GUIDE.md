# Complete Image Storage System Implementation (Offline-First + Toggle-Based Providers)

## Objective

Design and implement a **scalable, offline-first image storage system** for a survey mobile application that:

* Handles **200,000+ images efficiently**
* Works reliably in **low/no network conditions**
* Minimizes **storage + bandwidth cost**
* Supports **dual storage providers**:

  * Cloudinary (testing / early prod)
  * GCP (production scale)
* Allows **runtime switching via /dev/toggle**
* Is fully **future-proof and migration-safe**

---

# 0. Preparation
Environment Variables Setup
→ Create the required variables with dummy values, will be replaced by original later

# 1. High-Level System Architecture

Mobile App (Offline First) (my-app ✅) (my-expo-app ❌)

→ Capture Image
→ Compress Image (Frontend)
→ Store Locally (File System)
→ Store Metadata (SQLite + AsyncStorage)
→ Manual Sync Trigger

→ Storage Provider Layer (Dynamic Selection)

→ (Cloudinary OR Backend API → GCP)

→ Receive Image URL
→ Attach URL to Survey
→ Send Survey to Backend

→ On Success: Cleanup Local Storage

---

# 2. End-to-End Image Workflow (CRITICAL)

## Step 1: Image Capture

* User captures image using mobile camera
* Image is immediately passed to compression pipeline

---

## Step 2: Frontend Compression (MANDATORY)

Apply BEFORE storing locally:

* Resize:

  * Max width: 1280px (preferred)
* Format:

  * JPEG
* Quality:

  * 60–70%

### Target Output:

* 300KB – 700KB per image

---

## Step 3: Local Storage

### Store Image:

* Device file system (compressed version only)

### Store Metadata (SQLite):

```
SurveyImage {
  id: string
  survey_id: string
  local_path: string
  status: 'pending' | 'uploading' | 'synced' | 'failed'
  retry_count: number
  provider?: 'cloudinary' | 'gcp'
  uploaded_url?: string
  created_at: timestamp
}
```

---

## Step 4: Sync Trigger

* Manual button in app
* No auto-sync (for now)

---

## Step 5: Sync Execution Flow

For each survey:

1. Lock current storage provider (important)
2. Fetch images with:

   * status = 'pending' OR 'failed'

---

### Image Upload Loop

For each image:

* Mark status → `uploading`

* Upload via selected provider:

  * Cloudinary OR GCP

* On success:

  * Store returned URL
  * Mark status → `synced`

* On failure:

  * Mark status → `failed`
  * Increment retry_count

---

## Step 6: Survey Submission

After ALL images uploaded:

* Send survey data + image URLs to backend

---

## Step 7: Cleanup (ONLY AFTER FULL SUCCESS)

* Delete local image files
* Delete SQLite records
* Clear AsyncStorage survey data

---

# 3. Storage Provider Abstraction (CORE DESIGN)

## Interface

```
interface ImageStorageProvider {
  uploadImage(localPath: string): Promise<{
    url: string;
    provider: 'cloudinary' | 'gcp';
  }>;
}
```

---

## Providers

### A. Cloudinary Provider

Uses: Cloudinary

* Direct upload from mobile (unsigned preset)

* Endpoint:
  https://api.cloudinary.com/v1_1/{cloud_name}/image/upload

* Returns:

  * secure_url

---

### B. GCP Provider

Uses: Google Cloud Platform

* Mobile → Backend → GCS

* Backend uploads to:

  * Google Cloud Storage

* Returns:

  * public/signed URL

---

## Storage Factory

```
function getStorageProvider() {
  const provider = getConfig(); // AsyncStorage

  if (provider === 'cloudinary') return new CloudinaryProvider();
  return new GCPProvider();
}
```

---

# 4. /dev/toggle Developer System

## Purpose

Enable runtime switching between providers without redeploy through web-portal.

---

## Access

* Hidden route: `/dev/toggle`
* Not visible in UI
* Optional:

  * Multi-tap gesture unlock

---

## Features

### 1. Provider Switch

Options:

* Cloudinary
* GCP

Stored in:

* AsyncStorage (`STORAGE_PROVIDER`)

---

### 2. Debug Panel

Show:

* Active provider
* Pending uploads
* Failed uploads

---

### 3. Utility Actions

* Force Sync
* Retry Failed Uploads
* Clear Local Data (confirmation required)

---

# 5. CRITICAL TOGGLE RULES

1. Toggle affects ONLY future uploads
2. Existing uploaded images remain untouched
3. Mixed storage is allowed and expected
4. Provider must be LOCKED during sync

---

# 6. URL Strategy (VERY IMPORTANT)

* Always store FULL URL
* Never infer provider from logic

Examples:

* Cloudinary:
  https://res.cloudinary.com/...

* GCP:
  https://storage.googleapis.com/...

---

# 7. Failure Handling

## Must Handle:

### Network Failure

* Mark as failed
* Retry next sync

### App Crash During Upload

* Resume using stored state

### Partial Success

* Do not re-upload successful images

---

# 8. Performance Constraints

* Max parallel uploads: 2–3
* Avoid large batch blocking
* Optimize for slow networks

---

# 9. Security Rules

### Cloudinary

* Use unsigned uploads ONLY for testing
* Restrict preset

### GCP

* Upload ONLY via backend
* Validate file type & size

---

# 10. Cost Optimization Strategy

* Frontend compression (70–85% reduction)
* Avoid storing original large images
* Use GCP for long-term storage
* Use Cloudinary free-tier for testing

---

# 11. Migration Strategy (Cloudinary → GCP)

Future migration must support:

* No schema changes
* Script-based migration:

  * Download from Cloudinary
  * Upload to GCP
  * Update DB URLs

---

# 12. Acceptance Criteria

* End-to-end flow works offline → sync → cleanup
* Provider switching requires ZERO refactor
* No duplicate uploads
* No data loss
* System supports mixed providers
* Compression is always applied

---

# Final Note

This system must be:

* Provider-agnostic
* Scalable to 200K+ images
* Fault-tolerant
* Easily switchable via dev toggle

Failure to maintain abstraction or separation of concerns is unacceptable.
