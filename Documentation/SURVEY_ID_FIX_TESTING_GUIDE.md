# Survey ID Fix - Quick Testing Guide

**Purpose**: Verify the survey ID fix works correctly without breaking existing features  
**Time Required**: 15 minutes  
**Risk Level**: Low

---

## Pre-Testing Setup

1. **Clear Previous Data** (Optional but recommended)
   ```bash
   # In my-app directory
   npx react-native run-android
   # Clear app data from device settings
   ```

2. **Enable Logging**
   - Open terminal with `npx react-native start`
   - Keep terminal visible to monitor logs

---

## Test 1: Draft Recovery (Unsaved Survey)

**Duration**: 5 minutes

### Steps:
1. Open app → Surveyor Dashboard
2. Click "Residential" card
3. Fill in 2-3 fields (e.g., Parcel ID, Map ID)
4. Press back button (DON'T save)
5. App returns to dashboard

### Expected Logs:
```
✅ [SurveyID] Generated new survey ID on mount: survey_TIMESTAMP_RANDOM
✅ [SaveCompleteDraft] Survey ID: survey_TIMESTAMP_RANDOM
✅ [HandleExit] Calling saveCompleteDraft...
✅ [HandleExit] Draft saved/updated successfully
```

### Verification:
6. Close app completely
7. Reopen app
8. Should see recovery dialog

### Expected Dialog:
```
"You have an unsaved Residential survey from X minutes ago"
Buttons: Continue Survey / Start New Survey / Cancel
```

9. Click "Continue Survey"

### Success Criteria:
- ✅ Form opens with previously filled data
- ✅ Same survey ID maintained (check logs)
- ✅ No crashes or errors

---

## Test 2: Ongoing Survey (Saved Survey)

**Duration**: 5 minutes

### Steps:
1. Open app → Surveyor Dashboard
2. Click "Mixed" card
3. Fill complete form data
4. Take at least 1 photo
5. Click "Save Survey" button

### Expected Logs:
```
✅ [SurveyID] Generated new survey ID on mount: survey_TIMESTAMP_RANDOM
✅ [STORAGE] 💾 Starting background storage for survey: survey_TIMESTAMP_RANDOM
✅ [SaveSurvey] Using survey ID: survey_TIMESTAMP_RANDOM
✅ [SurveyForm] Survey marked as saved, draft cleared
✅ [SurveyStatus] Updated status: survey_TIMESTAMP_RANDOM true
```

### Verification:
6. Returns to dashboard
7. Should see "Ongoing Survey" card

### Expected Card:
```
"Ongoing Mixed Survey"
Button: "Continue Survey"
```

8. Click "Continue Survey"

### Success Criteria:
- ✅ Form opens in edit mode
- ✅ All data preserved
- ✅ Photo accessible
- ✅ Same survey ID used throughout

---

## Test 3: Camera & Photo Storage

**Duration**: 3 minutes

### Steps:
1. Open app → Surveyor Dashboard
2. Click "Non-Residential" card
3. Fill basic details
4. Navigate to photo section
5. Take 3 photos rapidly (Khasra, Front, Left)

### Expected Logs (FOR EACH PHOTO):
```
✅ [SurveyID] Generated new survey ID on mount: survey_TIMESTAMP_RANDOM
✅ [Camera] Captured photo for key: khasra
✅ [STORAGE] 💾 Starting background storage for survey: survey_TIMESTAMP_RANDOM
✅ [SQLite] Store image called with surveyId: survey_TIMESTAMP_RANDOM
```

### Critical Check:
**ALL photos must use SAME survey ID!**

### Verification:
6. Fill remaining form
7. Click "Save Survey"

### Success Criteria:
- ✅ All 3 photos captured successfully
- ✅ All photos stored with same survey ID
- ✅ Photos retrievable after save
- ✅ No "temp_survey_" IDs in logs

---

## Test 4: Edge Case - Rapid App Switching

**Duration**: 2 minutes

### Steps:
1. Open survey form
2. Fill 1 field
3. Press home button (app goes background)
4. Open another app
5. Return to survey app
6. Fill another field
7. Repeat 3 times

### Expected Behavior:
- ✅ Survey ID remains constant
- ✅ Draft saves with same ID each time
- ✅ No duplicate surveys created
- ✅ Data persists across switches

---

## Test 5: Error Scenario - Immediate Exit

**Duration**: 1 minute

### Steps:
1. Open survey form
2. Immediately press back (no data filled)

### Expected Logs:
```
✅ [SurveyID] Generated new survey ID on mount: survey_TIMESTAMP_RANDOM
✅ [HandleExit] Calling saveCompleteDraft...
✅ [SaveCompleteDraft] Saving draft with minimal data
```

### Success Criteria:
- ✅ No crash on exit
- ✅ Draft created (even if empty)
- ✅ Recovery works on next launch

---

## Red Flags to Watch For 🚩

### CRITICAL ERRORS (Stop Testing If Seen):

1. **Multiple Survey IDs Generated**
   ```
   ❌ [SurveyID] Generated new survey ID on mount: survey_A
   ❌ [Camera] Generated temporary survey ID: temp_survey_B
   ❌ [SaveCompleteDraft] Generated survey ID: temp_survey_C
   ```
   
   **Action**: Revert changes immediately

2. **Survey ID Missing When Needed**
   ```
   ❌ [SaveCompleteDraft] No survey ID available - this should not happen!
   ❌ [Camera] No survey ID for photo storage - this should not happen!
   ```
   
   **Action**: Check mount useEffect timing

3. **App Crashes**
   - Any crash during photo capture
   - Crash on save
   - Crash on navigation
   
   **Action**: Check error logs, revert if critical

### MINOR ISSUES (Log and Continue):

1. **Draft Not Restoring**
   - Check AsyncStorage manually
   - Verify 30-minute expiry not triggered

2. **Photo Not Appearing**
   - Check database storage
   - Verify retrieval query

---

## Success Checklist

After completing all tests, verify:

### Draft Recovery
- [ ] Unsaved drafts appear in recovery dialog
- [ ] "Continue Survey" restores data correctly
- [ ] "Start New" clears draft properly
- [ ] Draft expires after 30 minutes

### Ongoing Survey
- [ ] Saved surveys appear as "Ongoing Survey" card
- [ ] "Continue Survey" opens in edit mode
- [ ] Data persists correctly
- [ ] Can complete and clear ongoing survey

### Camera & Photos
- [ ] Camera captures without crashes
- [ ] Photos store with correct survey ID
- [ ] Multiple photos use same ID
- [ ] Photos retrievable after save

### General Stability
- [ ] No crashes during testing
- [ ] No infinite loops
- [ ] No memory leaks (app doesn't slow down)
- [ ] Navigation works smoothly

---

## Terminal Log Cheat Sheet

### GOOD Logs (What You Want to See):

```
✅ [SurveyID] Generated new survey ID on mount: survey_1774691828423_qvrrfjaa2
✅ [STORAGE] 💾 Starting background storage for survey: survey_1774691828423_qvrrfjaa2
✅ [SaveCompleteDraft] Survey ID: survey_1774691828423_qvrrfjaa2
✅ [SaveSurvey] Using survey ID: survey_1774691828423_qvrrfjaa2
```

**Pattern**: SAME survey ID everywhere!

### BAD Logs (Problem Indicators):

```
❌ [SurveyID] Generated new survey ID on mount: survey_A
❌ [Camera] Generated temporary survey ID for storage: temp_survey_B
❌ [SaveCompleteDraft] Generated survey ID: temp_survey_C
❌ [HandleExit] Generated temporary ID: temp_survey_D
```

**Pattern**: Different IDs = PROBLEM!

---

## Manual Verification Commands

### Check AsyncStorage (Android):
```bash
adb shell
cd /data/data/com.yourapp/files/react-native_localstorage
cat AsyncStorage.json | jq '.["@ptms_unsaved_survey_draft"]'
```

Look for consistent `surveyId` field.

### Check Database:
```bash
adb shell
sqlite3 /data/data/com.yourapp/databases/yourdb.db
SELECT * FROM survey_images WHERE survey_id = 'survey_TIMESTAMP_RANDOM';
```

All photos should have same survey_id.

---

## Rollback Instructions

If testing fails, revert immediately:

### Option 1: Git Revert
```bash
git checkout HEAD~1  # Go back to previous commit
npm install
npx react-native run-android
```

### Option 2: Manual Revert
Revert these 4 changes in `SurveyForm.tsx`:
1. Line 463-471: Restore ID generation in `saveCompleteDraft`
2. Line 600-609: Restore ID generation in `handleExit`
3. Line 1621-1630: Restore temp ID in camera capture
4. Lines 2263, 2309: Restore fallback ID generation in save

---

## Post-Testing Actions

### If All Tests Pass ✅:

1. **Commit Changes**
   ```bash
   git add .
   git commit -m "Fix: Prevent duplicate survey ID generation (closes #ISSUE)"
   git push origin main
   ```

2. **Update Documentation**
   - Link to SURVEY_ID_FIX_IMPACT_ANALYSIS.md
   - Note deployment date

3. **Monitor Production**
   - Watch for error logs in first 24 hours
   - Track draft recovery success rate
   - Monitor photo storage consistency

### If Tests Fail ❌:

1. **Document Failure**
   - Screenshot error logs
   - Note reproduction steps
   - Identify which change caused issue

2. **Rollback Immediately**
   - Use rollback instructions above
   - Don't deploy broken code

3. **Debug Offline**
   - Test in isolated environment
   - Fix root cause
   - Re-test before redeploying

---

## Contact & Support

**Issues During Testing:**
- Check SURVEY_ID_FIX_IMPACT_ANALYSIS.md
- Review original terminal logs from user query
- Compare with expected behavior in documentation

**Questions:**
- Refer to SURVEY_DRAFT_RECOVERY_IMPLEMENTATION.md for feature specs
- Check IMPLEMENTATION_SUMMARY.md for architecture details

---

**Testing Guide Version**: 1.0  
**Last Updated**: March 28, 2026  
**Approved By**: AI Code Review Assistant
