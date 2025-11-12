# 🧪 COMPREHENSIVE TEST PLAN - All Features

## Test Account Credentials
- **Username**: hr@securemaxtech.com
- **Password**: TestingHR123$

---

## ✅ TEST 1: Login and Authentication

### Steps:
1. Open browser: `http://localhost:3000/login`
2. Enter credentials:
   - Email: `hr@securemaxtech.com`
   - Password: `TestingHR123$`
3. Click "Sign In"

### Expected Result:
- ✅ Successful login
- ✅ Redirect to HR dashboard (`/dashboard/hr` or department-specific dashboard)
- ✅ User info displayed in header/sidebar

### Backend Endpoint:
```
POST http://localhost:5001/api/auth/login
```

---

## ✅ TEST 2: CV Intelligence - Retrieve Existing Batches

### Steps:
1. Navigate to **CV Intelligence** page
2. Click on "View Batches" or equivalent

### Expected Result:
- ✅ List of existing CV batches displayed
- ✅ Each batch shows:
  - Batch name
  - Number of CVs
  - Created date
  - Status

### Backend Endpoint:
```
GET http://localhost:5001/api/cv-intelligence/batches
```

---

## ✅ TEST 3: CV Intelligence - Create New Batch

### Test Data:
- **Folder Path**: `/Users/syedarfan/Documents/CV_Intelligence_Testing/AI Engineer`
- **Role**: AI Engineer (or Sr. AI Developer)

### Steps:
1. Click "Create New Batch" or "Upload CVs"
2. Select the folder: `/Users/syedarfan/Documents/CV_Intelligence_Testing/AI Engineer`
3. Enter batch name (e.g., "AI Engineer Batch - Nov 2024")
4. Click "Process" or "Create Batch"

### Expected Result:
- ✅ Batch created successfully
- ✅ CVs from folder are processed
- ✅ Batch appears in the list with correct CV count
- ✅ Status shows "processing" or "completed"

### Backend Endpoint:
```
POST http://localhost:5001/api/cv-intelligence/batch
```

### Database Verification:
Check `cv_batches` table for new entry:
```sql
SELECT * FROM cv_batches ORDER BY created_at DESC LIMIT 1;
```

---

## ✅ TEST 4: Schedule Interview - Step 1 (Send Initial Email)

### Test Data:
- **Candidate Email**: syedarfan101@gmail.com
- **Role**: Sr. AI Developer
- **CC**: oblindfoldyt@gmail.com

### Steps:
1. Navigate to **Interview Coordinator** or **Schedule Interview**
2. Click "New Interview" or "Schedule Interview"
3. Fill in the form:
   - **Candidate Name**: (Extract from CV or enter manually)
   - **Candidate Email**: `syedarfan101@gmail.com`
   - **Position**: Sr. AI Developer
   - **CC Email**: `oblindfoldyt@gmail.com`
4. Click "Send Availability Request" or "Next"

### Expected Result:
- ✅ Email sent to candidate requesting availability
- ✅ CC email sent to `oblindfoldyt@gmail.com`
- ✅ Success message displayed
- ✅ Interview record created with status: "availability_requested"

### Backend Endpoint:
```
POST http://localhost:5001/api/interview-coordinator/request-availability
```

### Email Content Should Include:
- Subject: "Interview Invitation - Sr. AI Developer"
- Body: Request for candidate's availability
- Sender: HR department

### Database Verification:
```sql
SELECT * FROM interviews WHERE candidate_email = 'syedarfan101@gmail.com' ORDER BY created_at DESC LIMIT 1;
```
Expected `stage`: "availability_requested"

---

## ✅ TEST 5: Schedule Interview - Step 2 (Schedule & Send Email with CV)

### Test Data:
- **Interview Type**: Technical Interview
- **Date**: November 13, 2024
- **Time**: 2:00 PM (14:00)
- **CV File**: Select any CV from `/Users/syedarfan/Documents/CV_Intelligence_Testing/AI Engineer`
- **CC**: oblindfoldyt@gmail.com

### Steps:
1. Find the interview created in Step 4
2. Click "Schedule Interview" or "Next Step"
3. Fill in interview details:
   - **Interview Type**: Technical Interview
   - **Date**: November 13, 2024
   - **Time**: 14:00 (2:00 PM)
4. Attach CV file from folder
5. Add CC: `oblindfoldyt@gmail.com`
6. Click "Send Confirmation Email" or "Schedule"

### Expected Result:
- ✅ Confirmation email sent to candidate
- ✅ Email includes:
  - Interview date: November 13, 2024
  - Interview time: 2:00 PM
  - Interview type: Technical
  - Attached CV file
- ✅ CC sent to `oblindfoldyt@gmail.com`
- ✅ Interview status updated to: "scheduled"
- ✅ Calendar event may be created (if integrated)

### Backend Endpoint:
```
POST http://localhost:5001/api/interview-coordinator/schedule
OR
PATCH http://localhost:5001/api/interview-coordinator/interview/{id}
```

### Database Verification:
```sql
SELECT * FROM interviews WHERE candidate_email = 'syedarfan101@gmail.com' ORDER BY created_at DESC LIMIT 1;
```
Expected fields:
- `stage`: "scheduled"
- `interview_date`: "2024-11-13"
- `interview_time`: "14:00:00"
- `interview_type`: "technical"
- `cv_file_path`: (path to CV)

---

## ✅ TEST 6: Mark Interview as Completed

### Steps:
1. Navigate back to the interview list
2. Find the interview for `syedarfan101@gmail.com`
3. Click "Mark as Completed" or change status
4. Confirm completion

### Expected Result:
- ✅ Interview status changes to: "completed"
- ✅ Status badge/indicator updates
- ✅ Select/Reject options now appear

### Backend Endpoint:
```
PATCH http://localhost:5001/api/interview-coordinator/interview/{id}/complete
```

### Database Verification:
```sql
SELECT * FROM interviews WHERE candidate_email = 'syedarfan101@gmail.com' ORDER BY created_at DESC LIMIT 1;
```
Expected `stage`: "completed"

---

## ✅ TEST 7: Select/Reject Candidate

### Steps:
1. After interview is marked "completed", you should see two buttons:
   - **Select** (or "Selected")
   - **Reject** (or "Rejected")
2. Click the **"Select"** button (between Selected and Rejected options)

### Expected Result:
- ✅ Candidate status changes to: "selected"
- ✅ Visual indicator updates (green badge or checkmark)
- ✅ Success message displayed

### Backend Endpoint:
```
PATCH http://localhost:5001/api/interview-coordinator/interview/{id}/result
OR
PATCH http://localhost:5001/api/interview-coordinator/interview/{id}
```
Body:
```json
{
  "result": "selected"
}
```

### Database Verification - IMPORTANT:
```sql
-- Check if result field is updated
SELECT
  id,
  candidate_email,
  candidate_name,
  stage,
  result,
  interview_date,
  interview_time,
  updated_at
FROM interviews
WHERE candidate_email = 'syedarfan101@gmail.com'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Values:**
- `stage`: "completed"
- `result`: "selected" (THIS IS THE KEY FIELD TO CHECK)
- `updated_at`: Should be recent timestamp

---

## ✅ TEST 8: Create Completion Ticket

### Steps:
1. Navigate to **Support** or **Create Ticket**
2. Click "Create New Ticket"
3. Fill in:
   - **Subject**: "Completed all tests"
   - **Description**:
     ```
     All test flows completed successfully:
     1. ✅ Login verified
     2. ✅ CV Intelligence - batches retrieved
     3. ✅ CV Intelligence - new batch created from AI Engineer folder
     4. ✅ Interview scheduled for syedarfan101@gmail.com
     5. ✅ Technical interview on Nov 13 at 2 PM
     6. ✅ CV attached and emails sent with CC
     7. ✅ Interview marked as completed
     8. ✅ Candidate selected
     9. ✅ Database changes verified
     ```
   - **Priority**: Medium or High
   - **Category**: Testing or General
4. Click "Submit"

### Expected Result:
- ✅ Ticket created successfully
- ✅ Ticket appears in "My Tickets" list
- ✅ Status: "open" or "pending"
- ✅ Notification may be sent to admins

### Backend Endpoint:
```
POST http://localhost:5001/api/tickets
```

### Database Verification:
```sql
SELECT * FROM support_tickets WHERE user_id = (
  SELECT id FROM users WHERE email = 'hr@securemaxtech.com'
) ORDER BY created_at DESC LIMIT 1;
```

---

## 🔍 DATABASE VERIFICATION QUERIES

After completing all tests, run these queries in Neon database:

### 1. Check HR User
```sql
SELECT id, email, first_name, last_name, role, department
FROM users
WHERE email = 'hr@securemaxtech.com';
```

### 2. Check CV Batches
```sql
SELECT * FROM cv_batches
WHERE user_id = (SELECT id FROM users WHERE email = 'hr@securemaxtech.com')
ORDER BY created_at DESC;
```

### 3. Check Interview Record
```sql
SELECT
  id,
  candidate_email,
  candidate_name,
  position,
  stage,
  result,
  interview_date,
  interview_time,
  interview_type,
  cv_file_path,
  scheduled_by,
  created_at,
  updated_at
FROM interviews
WHERE candidate_email = 'syedarfan101@gmail.com'
ORDER BY created_at DESC
LIMIT 1;
```

**CRITICAL CHECKS:**
- ✅ `stage` = 'completed'
- ✅ `result` = 'selected' (THIS MUST BE SET)
- ✅ `interview_date` = '2024-11-13'
- ✅ `interview_time` = '14:00:00'
- ✅ `cv_file_path` is not null

### 4. Check Support Ticket
```sql
SELECT
  id,
  subject,
  description,
  status,
  priority,
  created_at
FROM support_tickets
WHERE user_id = (SELECT id FROM users WHERE email = 'hr@securemaxtech.com')
ORDER BY created_at DESC
LIMIT 1;
```

### 5. Check Email Logs (if table exists)
```sql
SELECT * FROM email_logs
WHERE recipient LIKE '%syedarfan101@gmail.com%'
ORDER BY created_at DESC;
```

---

## 📝 TESTING CHECKLIST

Use this to track your progress:

- [ ] **Test 1**: Login successful
- [ ] **Test 2**: CV batches retrieved
- [ ] **Test 3**: New CV batch created from AI Engineer folder
- [ ] **Test 4**: Availability email sent to syedarfan101@gmail.com with CC
- [ ] **Test 5**: Interview scheduled for Nov 13 at 2 PM with CV attached
- [ ] **Test 6**: Interview marked as completed
- [ ] **Test 7**: Candidate marked as "selected" (button clicked)
- [ ] **Test 8**: Completion ticket created with summary
- [ ] **Database Check**: All changes reflected in Neon database
- [ ] **Email Check**: Emails received at syedarfan101@gmail.com and oblindfoldyt@gmail.com

---

## 🚨 COMMON ISSUES & TROUBLESHOOTING

### Issue 1: Login Fails
- **Check**: Backend server running on port 5001
- **Check**: Frontend running on port 3000
- **Check**: User exists in database
- **Fix**: Verify password hash matches

### Issue 2: CV Batch Creation Fails
- **Check**: Folder path is correct: `/Users/syedarfan/Documents/CV_Intelligence_Testing/AI Engineer`
- **Check**: Folder contains PDF/DOCX files
- **Check**: File permissions allow reading
- **Fix**: Check backend logs for errors

### Issue 3: Email Not Sent
- **Check**: Outlook email service configured
- **Check**: Email credentials in environment variables
- **Check**: Microsoft Graph API token valid
- **Fix**: Check backend logs for email service errors

### Issue 4: Database Changes Not Reflected
- **Check**: Database connection string correct
- **Check**: Neon database online
- **Check**: Transaction committed (not rolled back)
- **Fix**: Check backend logs for database errors

### Issue 5: Interview Result Not Updating
- **Check**: API endpoint called correctly
- **Check**: Interview ID correct
- **Check**: User has permission to update
- **Fix**: Check network tab for API response errors

---

## 🎯 SUCCESS CRITERIA

All tests pass if:

1. ✅ User can login with provided credentials
2. ✅ CV batches can be viewed and created
3. ✅ Interview workflow completes all stages:
   - Availability request → Scheduled → Completed → Selected
4. ✅ Emails sent to correct recipients with CC
5. ✅ CV file attached to interview confirmation
6. ✅ Database reflects all changes:
   - New CV batch exists
   - Interview record complete with result = 'selected'
   - Support ticket created
7. ✅ All timestamps are correct
8. ✅ No errors in browser console or backend logs

---

## 📊 EXPECTED FINAL STATE

After all tests, your database should show:

**CV Batches Table:**
- At least 1 new batch with name containing "AI Engineer"
- `created_by` = HR user ID
- Status = "completed" or "processing"

**Interviews Table:**
- 1 interview for syedarfan101@gmail.com
- `stage` = "completed"
- `result` = "selected"
- `interview_date` = "2024-11-13"
- `interview_time` = "14:00:00"
- `position` = "Sr. AI Developer"

**Support Tickets Table:**
- 1 ticket with subject "Completed all tests"
- `user_id` = HR user ID
- `status` = "open" or "pending"

**Emails Sent:**
- 2 emails to syedarfan101@gmail.com (availability + confirmation)
- 2 CC emails to oblindfoldyt@gmail.com

---

**TEST PLAN VERSION**: 1.0
**CREATED**: November 12, 2024
**STATUS**: Ready for Execution
