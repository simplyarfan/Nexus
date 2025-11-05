# User Journey Maps - Nexus Platform

## What is a User Journey?

A user journey map visualizes the steps a user takes to accomplish a goal in your application. It helps you:

- Understand user needs and pain points
- Identify improvement opportunities
- Design better user experiences
- Communicate flow to developers (or your future self!)

---

## Core User Journeys (MVP)

Use these to guide design, testing, and acceptance criteria. Copy to Figma/Notion later if needed.

### 1) Authentication & Onboarding

**Goal:** User creates account and accesses platform

**Steps:**

1. Register → backend sends verification code via email
2. Verify email → backend logs user in (tokens issued)
3. Login → if 2FA enabled, enter code → dashboard
4. Manage profile → update name/department/job title
5. Enable/disable 2FA

**Emotions:**

- Registration: 😊 Easy signup
- Email verification: 😕 Waiting for email (potential friction)
- 2FA: 😐 Security vs convenience tradeoff
- Dashboard: 😃 Successfully logged in

**Pain Points:**

- Email delays or spam folder
- 2FA code expiration
- Unclear password requirements

**Opportunities:**

- Social login (Google, Microsoft)
- "Resend code" button with countdown
- Password strength indicator
- Welcome tour after first login

**Acceptance Criteria:**

- Registration blocks duplicates; verification required before login
- 2FA path works end-to-end (code email, verify, login)
- Refresh token flow keeps session alive

---

### 2) Support Ticketing

**Goal:** User gets help with an issue

**Steps:**

1. User creates ticket (subject, description, priority)
2. User views "My Tickets"
3. Admin views all tickets; filters by status/priority
4. Admin or user adds comments (admin can add internal comments)
5. Admin updates status; when resolved → `resolved_at` set
6. Notifications: user gets updates on responses/status changes

**Emotions:**

- Problem encountered: 😕 Frustrated
- Ticket submitted: 😊 Relief (being heard)
- Waiting for response: 😐 Patient but anxious
- Resolution: 😃 Happy if solved quickly

**Pain Points:**

- Unclear response timeline
- Lack of status updates
- Can't attach screenshots easily

**Opportunities:**

- Auto-response templates for common issues
- File attachment support
- Estimated response time display
- Real-time status notifications

**Acceptance Criteria:**

- Permissions: users only see own tickets; admins see all
- `resolved_at` timestamp set when status becomes `resolved`
- Notifications created on responses/status updates

---

### 3) Interview Coordinator (HR-02 Blueprint)

**Goal:** HR schedules interview and sends invitations

**Steps:**

1. HR triggers availability email to candidate (via Outlook)
2. HR schedules interview (date/time, platform, notes)
   - If Google connected and platform is Meet → create real Meet event
   - Otherwise generate a platform link
3. System updates interview record (scheduled time, link)
4. System emails confirmation with ICS attachment (+ CV if uploaded)
5. HR updates status (scheduled/completed/cancelled; outcome optional)

**Emotions:**

- Scheduling start: 😊 Ready to coordinate
- Calendar integration: 😃 Automated magic!
- Confirmation sent: 😃 Accomplished
- Interview completed: 😊 Productive

**Pain Points:**

- Time zone confusion
- Calendar sync failures
- Candidate no-shows
- Manual email copying

**Opportunities:**

- Auto-detect time zones
- Multiple reminder emails (24h, 1h before)
- Candidate confirmation tracking
- Interview feedback form

**Acceptance Criteria:**

- No Google requirement for availability email
- ICS generation consistent (job_title used, one endpoint at `/calendar/:id/ics`)
- On Vercel, file writes are skipped (still attaches uploaded file from memory in email)

---

### 4) CV Intelligence (HR-01 Blueprint)

**Goal:** Process batch of resumes and identify top candidates

**Steps:**

1. User navigates to CV Intelligence
2. Creates new batch (name, description)
3. Uploads multiple PDF resumes (drag & drop or browse)
4. System processes CVs (parsing, scoring, ranking)
5. User reviews candidate list with scores
6. Filters by skills, experience, education
7. Selects top candidates
8. Exports or moves to interview stage

**Emotions:**

- Upload: 😊 Easy bulk upload
- Processing: 😐 Waiting (if long), 😃 Fast results
- Results: 😲 Impressed by scoring
- Selection: 😃 Productive, time-saved

**Pain Points:**

- Large files slow to upload
- Non-PDF formats rejected
- Unclear scoring criteria
- Can't edit candidate info

**Opportunities:**

- Support .docx files
- Background processing with email notification
- Explain score breakdown
- Custom scoring weights
- Batch comparison view

**Acceptance Criteria:**

- Handles up to 100 CVs per batch
- PDF parsing accuracy > 90%
- Processing time < 2 minutes for 50 CVs
- Export to CSV/Excel works

---

### 5) Admin & Analytics (Superadmin)

**Goal:** Monitor platform usage and manage users

**Steps:**

1. Admin lists all users; filters by role, search
2. Admin creates/updates users; can deactivate users
3. Superadmin views analytics dashboards
   - User activity metrics
   - Feature usage stats
   - System performance
4. Exports data for reporting

**Emotions:**

- Dashboard view: 😊 Clear overview
- User management: 😃 Efficient controls
- Analytics: 😃 Insightful data

**Pain Points:**

- Slow loading with many users
- Limited filtering options
- Can't bulk edit users

**Opportunities:**

- Real-time metrics
- Custom date ranges
- User activity timeline
- Bulk user operations
- Automated reports

**Acceptance Criteria:**

- Admin-only endpoints guarded by `requireAdmin`/`requireSuperAdmin`
- Analytics load in < 3 seconds
- Export formats: CSV, Excel, PDF

---

## User Personas

### Persona 1: Sarah - HR Manager

- **Age:** 32
- **Role:** HR Manager at tech company
- **Goals:** Hire efficiently, reduce time-to-hire
- **Pain Points:** Manual resume review, interview coordination
- **Tech Savvy:** Medium (uses Google Workspace daily)

**How Nexus Helps:**

- CV Intelligence saves 10+ hours per week
- Interview Coordinator eliminates scheduling chaos
- Centralized candidate tracking

---

### Persona 2: Michael - Startup Founder

- **Age:** 28
- **Role:** CTO recruiting first hires
- **Goals:** Fast hiring on budget
- **Pain Points:** No HR experience, limited time
- **Tech Savvy:** High (developer)

**How Nexus Helps:**

- Affordable self-service solution
- Automated screening
- Simple setup, no training needed

---

### Persona 3: Lisa - Recruitment Coordinator

- **Age:** 26
- **Role:** Interview scheduler
- **Goals:** Schedule 20+ interviews/week, reduce no-shows
- **Pain Points:** Email back-and-forth, time zones, manual calendar entries
- **Tech Savvy:** Medium (expert at Outlook/Google Calendar)

**How Nexus Helps:**

- One-click scheduling
- Automatic reminders
- Calendar integration

---

## Creating User Journeys in Figma

### Quick Start

1. **Open FigJam** (Figma's whiteboard tool)
2. **Use Template:** Search "User Journey Map"
3. **Structure:**

   ```
   [User Persona] [Goal]

   Step 1 → Step 2 → Step 3 → Success!
     ↓         ↓         ↓
   [😊/😕]   [😐]     [😃]

   Pain Points: [list]
   Opportunities: [list]
   ```

4. **Add Screenshots:** Drag actual UI screenshots
5. **Color Code:** Green = positive, Red = friction, Yellow = neutral
6. **Collaborate:** Share link for feedback

---

## Journey Mapping Template (Text Format)

```markdown
## Journey: [Name]

**User:** [Persona]
**Goal:** [What they want to achieve]

### Steps:

1. [Action] → [Result]
   - Emotion: [😊/😕/😐/😃]
   - Pain Points: [Issues]
   - Opportunities: [Improvements]

2. [Next Action] → [Result]
   ...

### Success Metrics:

- [Metric 1]
- [Metric 2]

### Edge Cases:

- [What if scenario 1]
- [What if scenario 2]
```

---

## Resources

- [Figma User Journey Template](https://www.figma.com/community/file/1037228011847428474)
- [FigJam (Free)](https://www.figma.com/figjam/)
- [Nielsen Norman Group - Journey Mapping](https://www.nngroup.com/articles/customer-journey-mapping/)

---

## Next Steps

1. Review journeys above
2. Create Figma board for visual journey maps
3. Use journeys to write user stories (GitHub Issues)
4. Reference when designing new features
5. Update based on user feedback
