# Nexus User Stories - For Notion Product Backlog

Copy these into your "Product Backlog w/ DoR and DoD" template in Notion.

---

## 📋 Instructions:

1. **Delete existing example stories** (or keep them for reference in a different page)
2. **Create these category groups** (use the collapse arrows):
   - User Authentication and Account Management
   - CV Intelligence System (HR-01)
   - Interview Coordinator (HR-02)
   - Support Ticket System
   - Analytics and Reporting
   - Admin Panel and Management
   - Future Enhancements

3. **For each story below:**
   - Click "+ New page" in the appropriate category
   - Copy the PBI name
   - Copy the User Story text
   - Set Priority, Status, and Sprint as indicated

---

## 🔐 User Authentication and Account Management

### PBI: User Registration

**User Story:** As a potential user, I want to create a new account with my email and password, so I can start using the Nexus platform.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 1
**Notes:** JWT-based authentication, password hashing with bcrypt

### PBI: Email Verification

**User Story:** As a new user, I want to verify my email address before logging in, so the platform can confirm my identity.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 1
**Notes:** Verification required before first login, token expires in 24h

### PBI: Login with Email

**User Story:** As a registered user, I want to log in using my email and password, ensuring a secure and personalized experience on the platform.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 1
**Notes:** Returns access token (24h) and refresh token (30-90d)

### PBI: Two-Factor Authentication (2FA)

**User Story:** As a security-conscious user, I want to enable email-based 2FA, so I can add an extra layer of security to my account.
**Priority:** Medium
**Status:** Done ✅
**Sprint:** Sprint 1
**Notes:** Optional per user, 6-digit OTP via email, 10min expiry

### PBI: Password Reset

**User Story:** As a user who forgot their password, I want to request a password reset via email, so I can regain access to my account.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 1
**Notes:** Secure token via email, one-time use, expires in 1 hour

### PBI: OAuth Login - Google

**User Story:** As a user, I want the option to log in using my Google account, reducing the need to remember additional login credentials.
**Priority:** Medium
**Status:** Done ✅
**Sprint:** Sprint 1
**Notes:** OAuth2 flow, also used for Google Calendar integration

### PBI: OAuth Login - Microsoft/Outlook

**User Story:** As a user, I want to log in using my Microsoft account, so I can quickly access the platform with my existing credentials.
**Priority:** Medium
**Status:** Done ✅
**Sprint:** Sprint 1
**Notes:** Microsoft Graph API, also used for Outlook integration

### PBI: Update User Profile

**User Story:** As a registered user, I want to edit and update my profile information, ensuring my account details are current and accurate.
**Priority:** Medium
**Status:** Done ✅
**Sprint:** Sprint 1
**Notes:** Update name, email (requires re-verification), profile settings

### PBI: Role-Based Access Control

**User Story:** As an admin, I want different user roles (user, admin, superadmin) with appropriate permissions, so I can control access to sensitive features.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 1
**Notes:** Middleware guards in place: requireAdmin, requireSuperAdmin

---

## 📄 CV Intelligence System (HR-01)

### PBI: Upload CV Batch

**User Story:** As a hiring manager, I want to upload multiple CVs at once, so I can efficiently process candidate applications.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Supports PDF format, 10MB file size limit

### PBI: Parse CV Data

**User Story:** As a recruiter, I want the system to automatically extract information from CVs (name, email, skills, experience), so I can save time on manual data entry.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Uses pdf-parse library, extracts structured data

### PBI: Score Candidates

**User Story:** As a hiring manager, I want candidates to be automatically scored based on their qualifications, so I can quickly identify top talent.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Automated scoring algorithm based on skills match

### PBI: Rank Candidates

**User Story:** As a recruiter, I want to see candidates ranked by their scores, making it easier to prioritize who to interview first.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Sortable ranking view with scores

### PBI: View CV Batch Results

**User Story:** As a hiring manager, I want to view all processed CVs in a batch with their scores and details, so I can make informed hiring decisions.
**Priority:** Medium
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Batch view with candidate details and download options

### PBI: Filter Candidates by Criteria

**User Story:** As a recruiter, I want to filter candidates by skills, experience level, or score, so I can find candidates that match specific requirements.
**Priority:** Medium
**Status:** Backlog 📋
**Sprint:** Sprint 4
**Notes:** Planned enhancement for better candidate discovery

---

## 📅 Interview Coordinator (HR-02)

### PBI: Schedule Interview

**User Story:** As a hiring manager, I want to schedule interviews with candidates and automatically create calendar events, so interviews are organized and tracked.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Integrates with Google Calendar and Outlook

### PBI: Google Calendar Integration

**User Story:** As a user with a Google account, I want my scheduled interviews to automatically appear in my Google Calendar with Meet links, so I don't have to manually create events.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** OAuth2 with Google Calendar API, auto-generates Meet links

### PBI: Outlook Calendar Integration

**User Story:** As a user with Microsoft Outlook, I want my interviews to sync with my Outlook calendar, so I can manage all my appointments in one place.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Microsoft Graph API for calendar sync

### PBI: Email Interview Reminders

**User Story:** As a hiring manager, I want to receive email reminders before scheduled interviews with ICS attachments, so I never miss an interview.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Sends 24h before interview, includes ICS file

### PBI: Interview Reminder Settings

**User Story:** As a user, I want to configure when I receive interview reminders (24h, 1h, custom), so I can personalize my notification preferences.
**Priority:** Medium
**Status:** Planned 📋
**Sprint:** Sprint 4
**Notes:** Allow users to customize reminder timing

### PBI: Candidate Interview Confirmation

**User Story:** As a candidate, I want to receive an interview invitation with the option to confirm or request reschedule, so I can manage my interview schedule.
**Priority:** Medium
**Status:** Planned 📋
**Sprint:** Sprint 5
**Notes:** Two-way communication for interview scheduling

### PBI: View Scheduled Interviews

**User Story:** As a hiring manager, I want to view all my upcoming and past interviews in a calendar view, so I can stay organized.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Calendar interface with interview list

### PBI: Interview Feedback Form

**User Story:** As an interviewer, I want to submit structured feedback after each interview, so we can make data-driven hiring decisions.
**Priority:** Medium
**Status:** In Progress 🚧
**Sprint:** Sprint 3
**Notes:** Currently being developed

---

## 🎫 Support Ticket System

### PBI: Submit Support Ticket

**User Story:** As a user experiencing an issue, I want to submit a support ticket with details about my problem, so I can get help from the support team.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Ticket creation with title, description, priority

### PBI: View My Support Tickets

**User Story:** As a user, I want to view all my submitted support tickets and their current status, so I can track the progress of my issues.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** User dashboard showing ticket history

### PBI: Add Comments to Ticket

**User Story:** As a user or support agent, I want to add comments to tickets, so we can have a conversation thread about the issue.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Thread-based comment system

### PBI: Update Ticket Status

**User Story:** As a support admin, I want to update ticket status (open, in-progress, resolved, closed), so users know the current state of their issues.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Status workflow: open → in-progress → resolved → closed

### PBI: Assign Tickets to Agents

**User Story:** As a support manager, I want to assign tickets to specific support agents, so workload is distributed efficiently.
**Priority:** Medium
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Admin can assign tickets to team members

### PBI: Email Notifications for Ticket Updates

**User Story:** As a user with an open ticket, I want to receive email notifications when there are updates or new comments, so I stay informed without constantly checking the platform.
**Priority:** Medium
**Status:** Planned 📋
**Sprint:** Sprint 4
**Notes:** Automated email notifications on ticket activity

### PBI: Ticket Priority Levels

**User Story:** As a user submitting a ticket, I want to set the priority level (low, medium, high, critical), so urgent issues get faster attention.
**Priority:** Medium
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Priority field available on ticket creation

---

## 📊 Analytics and Reporting

### PBI: User Activity Dashboard

**User Story:** As an admin, I want to view user activity analytics (login frequency, feature usage, page views), so I can understand how users interact with the platform.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Activity tracking with page views and API calls

### PBI: System Metrics Dashboard

**User Story:** As a superadmin, I want to view system performance metrics (API response times, error rates, uptime), so I can monitor platform health.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Health check endpoints and metrics tracking

### PBI: Export Analytics Data

**User Story:** As a superadmin, I want to export analytics data as CSV or JSON, so I can perform custom analysis or share reports.
**Priority:** Medium
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Export functionality for superadmins only

### PBI: Advanced Analytics Dashboard

**User Story:** As a product manager, I want detailed analytics with charts and trends over time, so I can make data-driven decisions about feature development.
**Priority:** Medium
**Status:** Planned 📋
**Sprint:** Sprint 5
**Notes:** Enhanced visualization and deeper insights

### PBI: User Behavior Heatmaps

**User Story:** As a UX designer, I want to see heatmaps of user behavior on key pages, so I can optimize the user interface.
**Priority:** Low
**Status:** Backlog 💡
**Sprint:** Future
**Notes:** Requires integration with analytics tool (e.g., Hotjar)

---

## ⚙️ Admin Panel and Management

### PBI: View All Users

**User Story:** As an admin, I want to view a list of all registered users with their details and roles, so I can manage user accounts effectively.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 1
**Notes:** Admin dashboard with user table

### PBI: Edit User Roles

**User Story:** As a superadmin, I want to change user roles (promote to admin, demote to user), so I can manage permissions appropriately.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 1
**Notes:** Role management restricted to superadmins

### PBI: Disable/Enable User Accounts

**User Story:** As an admin, I want to disable problematic user accounts, so I can prevent misuse of the platform.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 1
**Notes:** Account status toggle (active/disabled)

### PBI: System Health Monitoring

**User Story:** As a superadmin, I want to check system health (database connectivity, Redis cache, API status), so I can quickly identify and resolve issues.
**Priority:** High
**Status:** Done ✅
**Sprint:** Sprint 1
**Notes:** Health check endpoint at /api/system/health

### PBI: View System Logs

**User Story:** As a superadmin, I want to view system logs with errors and warnings, so I can troubleshoot issues and maintain platform stability.
**Priority:** Medium
**Status:** Done ✅
**Sprint:** Sprint 2
**Notes:** Winston logger with daily rotation in backend/logs/

### PBI: Manage System Settings

**User Story:** As a superadmin, I want to configure system-wide settings (email templates, rate limits, feature flags), so I can customize platform behavior.
**Priority:** Medium
**Status:** Planned 📋
**Sprint:** Sprint 4
**Notes:** Centralized settings management UI

---

## 🚀 Future Enhancements

### PBI: TypeScript Migration

**User Story:** As a developer, I want the codebase migrated to TypeScript, so we have better type safety and fewer runtime errors.
**Priority:** Medium
**Status:** Planned 📋
**Sprint:** Sprint 5
**Notes:** Improve code quality and developer experience

### PBI: Dark Mode UI

**User Story:** As a user who prefers dark themes, I want a dark mode option, so I can use the platform comfortably in low-light environments.
**Priority:** Low
**Status:** Backlog 💡
**Sprint:** Future
**Notes:** User requested feature

### PBI: Mobile Responsive Design

**User Story:** As a mobile user, I want the platform to be fully responsive on my phone and tablet, so I can use it on any device.
**Priority:** High
**Status:** Planned 📋
**Sprint:** Sprint 3
**Notes:** Improve mobile experience across all pages

### PBI: SMS Notifications

**User Story:** As a user, I want to receive SMS notifications for important events (interview reminders, ticket updates), so I'm notified even when I'm not checking email.
**Priority:** Low
**Status:** Backlog 💡
**Sprint:** Future
**Notes:** Requires SMS service integration (Twilio)

### PBI: API Rate Limiting Dashboard

**User Story:** As a superadmin, I want to view API rate limiting stats per user, so I can identify potential abuse or adjust limits.
**Priority:** Low
**Status:** Backlog 💡
**Sprint:** Future
**Notes:** Enhanced monitoring for API usage

### PBI: Automated Testing Suite

**User Story:** As a developer, I want comprehensive unit and integration tests, so we can deploy with confidence and catch bugs early.
**Priority:** High
**Status:** Planned 📋
**Sprint:** Sprint 3
**Notes:** Part of Phase 3 workflow improvements

### PBI: GitHub Workflow Integration

**User Story:** As a developer, I want automated CI/CD with GitHub Actions, so code is tested and deployed automatically.
**Priority:** High
**Status:** In Progress 🚧
**Sprint:** Sprint 3 (Current)
**Notes:** Phase 3 - Setting up now!

---

## 📝 How to Use This:

1. **Copy each PBI** into your Notion template
2. **Set Status:**
   - Done ✅ = Already implemented and working
   - In Progress 🚧 = Currently being worked on
   - Planned 📋 = Next few sprints
   - Backlog 💡 = Future consideration
3. **Update Sprint numbers** to match your actual sprints
4. **Add notes** with technical details or links to code files
5. **Link to GitHub issues** once you set up the repo in Phase 3

---

## Sprint Planning Summary:

- **Sprint 1:** Authentication system (COMPLETE ✅)
- **Sprint 2:** Core features - CV Intelligence, Interview Coordinator, Support (COMPLETE ✅)
- **Sprint 3:** GitHub workflow, mobile responsive, testing (IN PROGRESS 🚧)
- **Sprint 4:** Enhancements - notifications, settings, filters (PLANNED 📋)
- **Sprint 5:** Advanced features - TypeScript, advanced analytics (PLANNED 📋)
- **Future:** Nice-to-have features - SMS, dark mode, heatmaps (BACKLOG 💡)

---

Ready to move to Phase 3: GitHub Workflow Setup!
