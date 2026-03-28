# Database Migration Commands - PropertyAttachmentDetails Schema Update

**Date**: March 28, 2026  
**Purpose**: Increase VARCHAR size for image URL columns from 50 to 255 characters  
**Issue**: Cloudinary URLs exceed 50 character limit (~100+ characters)

---

## 📋 **Migration Steps**

### Step 1: Generate Prisma Migration

Run this command in the backend directory:

```bash
cd d:\Development\Survey_App\backend
npx prisma migrate dev --name increase_property_attachment_url_size
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded - prisma\schema.prisma
Datasource: db - PostgreSQL database

Applying migration `20260328_increase_property_attachment_url_size`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20260328_increase_property_attachment_url_size/
      └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client
```

---

### Step 2: Review Generated SQL (Optional but Recommended)

Check what SQL will be executed:

```bash
cat prisma/migrations/[TIMESTAMP]_increase_property_attachment_url_size/migration.sql
```

**Expected SQL:**
```sql
-- AlterTable
ALTER TABLE "PropertyAttachmentDetails" 
  ALTER COLUMN "image1Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image2Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image3Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image4Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image5Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image6Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image7Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image8Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image9Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image10Url" SET DATA TYPE VARCHAR(255);
```

---

### Step 3: Deploy to Production Database

#### Option A: If you have direct database access

```bash
npx prisma migrate deploy
```

This will apply all pending migrations to your production database.

---

#### Option B: Manual SQL Execution (If you can't run Prisma commands)

Connect to your PostgreSQL database and run:

```sql
-- Increase URL column sizes to accommodate Cloudinary URLs
ALTER TABLE "PropertyAttachmentDetails" 
  ALTER COLUMN "image1Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image2Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image3Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image4Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image5Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image6Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image7Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image8Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image9Url" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "image10Url" SET DATA TYPE VARCHAR(255);
```

**To connect via psql:**
```bash
psql -h <your-host> -U postgres -d <your-database-name>
```

Or via pgAdmin:
1. Open pgAdmin
2. Connect to your database
3. Open Query Tool
4. Paste and execute the SQL above

---

### Step 4: Verify Migration

Check that columns were updated:

```sql
SELECT 
  column_name, 
  data_type, 
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'propertyattachmentdetails'
  AND column_name LIKE 'image%Url';
```

**Expected Result:**
```
column_name | data_type | character_maximum_length
------------|-----------|----------------------
image1Url   | character | 255
image2Url   | character | 255
image3Url   | character | 255
... (and so on)
```

---

## 🔧 **Troubleshooting**

### Issue: Migration fails with "relation already exists"

**Solution**: The table might already exist. Run:
```bash
npx prisma db pull
npx prisma migrate dev --name sync_schema
```

---

### Issue: Can't connect to database

**Check .env file:**
```bash
# backend/.env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

**Test connection:**
```bash
npx prisma db studio
```

---

### Issue: Production database is remote

**Option 1: Use connection string from .env**
```bash
# Make sure DATABASE_URL points to production
npx prisma migrate deploy
```

**Option 2: Export and import SQL**
```bash
# Generate SQL locally
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migration.sql

# Copy migration.sql content and run manually on production
```

---

## 📊 **Impact Assessment**

### What Changes:
- ✅ All `image[1-10]Url` columns increased from VARCHAR(50) to VARCHAR(255)
- ✅ Existing data preserved (PostgreSQL handles this automatically)
- ✅ No downtime required (online schema change)

### What Doesn't Change:
- ❌ Table structure remains the same
- ❌ No new columns added
- ❌ No relationships modified
- ❌ Existing queries continue to work

---

## ✅ **Post-Migration Checklist**

After running the migration:

- [ ] Verify all image URL columns are VARCHAR(255)
- [ ] Test survey submission with images
- [ ] Check that Cloudinary URLs are stored correctly
- [ ] Confirm no errors in backend logs
- [ ] Test QC workflow with image attachments

---

## 🚀 **Next Steps**

After this migration is complete, we'll proceed with:

1. **Batch 2**: Fix backend service to create PropertyAttachmentDetails records
2. **Batch 3**: Fix geographic data extraction for hierarchical folder structure
3. **Batch 4**: Test end-to-end image upload and storage flow

---

## 📞 **Support**

If you encounter issues:
- Check PostgreSQL logs: `SELECT * FROM pg_log ORDER BY log_time DESC LIMIT 10;`
- Verify Prisma version: `npx prisma -v`
- Ensure database user has ALTER TABLE permissions

---

**Migration Created By**: AI Code Review Assistant  
**Date**: March 28, 2026  
**Estimated Time**: 5-10 minutes  
**Risk Level**: Low (non-breaking schema change)
