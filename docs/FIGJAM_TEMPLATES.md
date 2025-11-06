# FigJam Templates for Nexus

Quick-copy templates you can paste directly into FigJam boards for the Nexus platform.

---

## Table of Contents

1. [User Journey Templates](#user-journey-templates)
2. [User Persona Cards](#user-persona-cards)
3. [Feature Mapping](#feature-mapping)
4. [Workflow Diagrams](#workflow-diagrams)
5. [System Architecture](#system-architecture)
6. [Brainstorming Templates](#brainstorming-templates)

---

## User Journey Templates

### Template 1: Authentication Journey

**Copy this into FigJam:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION & ONBOARDING JOURNEY               │
│                                                                       │
│  Persona: Sarah (HR Manager)                                        │
│  Goal: Create account and access CV Intelligence                    │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: Registration
┌─────────────────┐
│   User Action   │  Visits nexus.com → Clicks "Sign Up"
├─────────────────┤
│   Screen/UI     │  Registration Form (name, email, dept, password)
├─────────────────┤
│   Emotion       │  😊 "Looks simple and professional"
├─────────────────┤
│  Pain Points    │  • Password requirements unclear
│                 │  • Unsure about department field
├─────────────────┤
│ Opportunities   │  • Add password strength meter
│                 │  • Show department examples
└─────────────────┘
         │
         ↓
STEP 2: Email Verification
┌─────────────────┐
│   User Action   │  Checks email → Clicks verification link
├─────────────────┤
│   Screen/UI     │  "Check your email" message
├─────────────────┤
│   Emotion       │  😕 "Hope email arrives quickly"
├─────────────────┤
│  Pain Points    │  • Email delay (spam folder)
│                 │  • Link expires in 15 min
├─────────────────┤
│ Opportunities   │  • "Resend code" button
│                 │  • Show countdown timer
│                 │  • Tips: "Check spam folder"
└─────────────────┘
         │
         ↓
STEP 3: First Login
┌─────────────────┐
│   User Action   │  Enters email & password → Clicks "Login"
├─────────────────┤
│   Screen/UI     │  Login page
├─────────────────┤
│   Emotion       │  😊 "Excited to start"
├─────────────────┤
│  Pain Points    │  • Forgot password already?
│                 │  • 2FA setup confusing
├─────────────────┤
│ Opportunities   │  • Welcome tour/onboarding
│                 │  • Quick start guide
└─────────────────┘
         │
         ↓
STEP 4: Dashboard Landing
┌─────────────────┐
│   User Action   │  Views dashboard → Sees CV Intelligence option
├─────────────────┤
│   Screen/UI     │  Dashboard with feature cards
├─────────────────┤
│   Emotion       │  😃 "Clean interface, ready to start"
├─────────────────┤
│  Pain Points    │  • Too many options (overwhelm)
│                 │  • Where to start?
├─────────────────┤
│ Opportunities   │  • Highlight suggested first action
│                 │  • "Start here" tooltip
│                 │  • Interactive tutorial
└─────────────────┘

SUCCESS METRICS:
✅ Registration completion rate > 80%
✅ Email verification < 5 min average
✅ First login within 24h of registration > 70%
✅ Feature exploration within first session > 60%
```

---

### Template 2: CV Intelligence Journey

**Copy this into FigJam:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CV INTELLIGENCE JOURNEY (HR-01)                  │
│                                                                       │
│  Persona: Sarah (HR Manager)                                        │
│  Goal: Process 50 resumes and identify top 5 candidates             │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: Create Batch
┌─────────────────┐
│   User Action   │  Clicks "Create New Batch"
│                 │  Enters: "Software Engineers Q1 2025"
├─────────────────┤
│   Screen/UI     │  Modal with batch name & description fields
├─────────────────┤
│   Emotion       │  😊 "Easy to start"
├─────────────────┤
│  Pain Points    │  • Not sure what description is for
├─────────────────┤
│ Opportunities   │  • Add placeholder examples
│                 │  • Explain description purpose
└─────────────────┘
         │
         ↓
STEP 2: Upload CVs
┌─────────────────┐
│   User Action   │  Drags & drops 50 PDF files
│                 │  Or clicks "Browse files"
├─────────────────┤
│   Screen/UI     │  Large drop zone with file list preview
├─────────────────┤
│   Emotion       │  😃 "Drag & drop is so easy!"
├─────────────────┤
│  Pain Points    │  • Some files are .docx (rejected)
│                 │  • Large files slow to upload
├─────────────────┤
│ Opportunities   │  • Support .docx format
│                 │  • Show upload progress per file
│                 │  • File size validation before upload
└─────────────────┘
         │
         ↓
STEP 3: Processing
┌─────────────────┐
│   User Action   │  Clicks "Process Batch"
│                 │  Waits for processing
├─────────────────┤
│   Screen/UI     │  Progress bar with "Processing X of 50 CVs..."
├─────────────────┤
│   Emotion       │  😐 "Hope this doesn't take too long"
├─────────────────┤
│  Pain Points    │  • No time estimate
│                 │  • Can't leave page (fear)
├─────────────────┤
│ Opportunities   │  • Show estimated time
│                 │  • Email notification when done
│                 │  • Background processing (can navigate away)
└─────────────────┘
         │
         ↓
STEP 4: Review Results
┌─────────────────┐
│   User Action   │  Views ranked candidates
│                 │  Filters by skills, experience
├─────────────────┤
│   Screen/UI     │  Table with scores, skills, experience
├─────────────────┤
│   Emotion       │  😲 "Wow, this is impressive!"
├─────────────────┤
│  Pain Points    │  • Unclear how scores calculated
│                 │  • Want to adjust weights
├─────────────────┤
│ Opportunities   │  • Score breakdown tooltip
│                 │  • Custom scoring weights
│                 │  • Comparison view (side-by-side)
└─────────────────┘
         │
         ↓
STEP 5: Select Candidates
┌─────────────────┐
│   User Action   │  Selects top 5 candidates
│                 │  Clicks "Schedule Interviews"
├─────────────────┤
│   Screen/UI     │  Checkbox selection → Batch action button
├─────────────────┤
│   Emotion       │  😃 "Saved me hours of work!"
├─────────────────┤
│  Pain Points    │  • Can't export selection to share
├─────────────────┤
│ Opportunities   │  • Export selected candidates
│                 │  • Share link to team
│                 │  • Notes field per candidate
└─────────────────┘

TIME SAVINGS:
⏱️  Manual review: ~10 hours
⏱️  With CV Intelligence: ~30 minutes
💰 ROI: 95% time reduction
```

---

### Template 3: Interview Coordinator Journey

**Copy this into FigJam:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                 INTERVIEW COORDINATOR JOURNEY (HR-02)                │
│                                                                       │
│  Persona: Lisa (Recruitment Coordinator)                            │
│  Goal: Schedule 5 interviews this week                              │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: View Calendar
┌─────────────────┐
│   User Action   │  Opens Interview Coordinator
│                 │  Switches to Week view
├─────────────────┤
│   Screen/UI     │  Calendar with existing interviews
├─────────────────┤
│   Emotion       │  😊 "Clear overview of my week"
├─────────────────┤
│  Pain Points    │  • Hard to see availability gaps
│                 │  • Need to cross-check multiple calendars
├─────────────────┤
│ Opportunities   │  • Highlight available slots
│                 │  • Sync with Google Calendar
│                 │  • Team availability overlay
└─────────────────┘
         │
         ↓
STEP 2: Request Availability
┌─────────────────┐
│   User Action   │  Selects candidate
│                 │  Clicks "Request Availability"
├─────────────────┤
│   Screen/UI     │  Email template preview
├─────────────────┤
│   Emotion       │  😃 "Auto-email saves so much time"
├─────────────────┤
│  Pain Points    │  • Email might land in spam
│                 │  • Candidate doesn't respond
├─────────────────┤
│ Opportunities   │  • Follow-up reminder automation
│                 │  • SMS option
│                 │  • Self-service scheduling link
└─────────────────┘
         │
         ↓
STEP 3: Schedule Interview
┌─────────────────┐
│   User Action   │  Receives availability
│                 │  Fills schedule form:
│                 │  • Date/Time
│                 │  • Platform: Google Meet
│                 │  • Panel: Selects 2 interviewers
├─────────────────┤
│   Screen/UI     │  Schedule form with date picker, time picker
├─────────────────┤
│   Emotion       │  😃 "Form is intuitive"
├─────────────────┤
│  Pain Points    │  • Time zone confusion
│                 │  • Interviewer availability unknown
├─────────────────┤
│ Opportunities   │  • Auto-detect candidate timezone
│                 │  • Check interviewer calendar before scheduling
│                 │  • Suggest optimal time slots
└─────────────────┘
         │
         ↓
STEP 4: Send Invitation
┌─────────────────┐
│   User Action   │  Reviews meeting details
│                 │  Clicks "Send Invitation"
├─────────────────┤
│   Screen/UI     │  Preview modal → Confirmation
├─────────────────┤
│   Emotion       │  😊 "Meeting link auto-generated!"
├─────────────────┤
│  Pain Points    │  • Want to customize email message
├─────────────────┤
│ Opportunities   │  • Email template editor
│                 │  • Save custom templates
│                 │  • Add company branding
└─────────────────┘
         │
         ↓
STEP 5: Automated Reminders
┌─────────────────┐
│   User Action   │  (Automatic) System sends reminders
│                 │  • 24h before
│                 │  • 1h before
├─────────────────┤
│   Screen/UI     │  Reminder settings page
├─────────────────┤
│   Emotion       │  😌 "Set it and forget it"
├─────────────────┤
│  Pain Points    │  • Can't customize reminder timing
├─────────────────┤
│ Opportunities   │  • Configurable reminder schedule
│                 │  • Different reminders per interview type
└─────────────────┘
         │
         ↓
STEP 6: Post-Interview
┌─────────────────┐
│   User Action   │  Marks interview as "Completed"
│                 │  Adds feedback notes
├─────────────────┤
│   Screen/UI     │  Interview detail view with feedback form
├─────────────────┤
│   Emotion       │  😃 "Easy to track outcomes"
├─────────────────┤
│  Pain Points    │  • Interviewers forget to add feedback
├─────────────────┤
│ Opportunities   │  • Feedback reminder to interviewers
│                 │  • Structured feedback form
│                 │  • Candidate scorecard integration
└─────────────────┘

EFFICIENCY GAINS:
📧 Email automation: 80% time saved
📅 Calendar sync: No double-bookings
⏰ Auto-reminders: 90% reduction in no-shows
```

---

## User Persona Cards

### Persona 1: Sarah - HR Manager

**Copy this into FigJam:**

```
┌─────────────────────────────────────────────────────────┐
│                      👩‍💼 SARAH                              │
│                    HR Manager                            │
└─────────────────────────────────────────────────────────┘

📊 DEMOGRAPHICS
• Age: 32
• Location: San Francisco Bay Area
• Education: MBA, Human Resources
• Company: Tech startup (150 employees)

💼 ROLE & RESPONSIBILITIES
• Manage recruitment for engineering roles
• Screen 50-100 resumes per week
• Coordinate 10-15 interviews weekly
• Report hiring metrics to leadership

🎯 GOALS
• Reduce time-to-hire from 45 days to 30 days
• Improve candidate quality
• Streamline interview scheduling
• Data-driven hiring decisions

😫 PAIN POINTS
• Drowning in resumes (100+ per role)
• Manual screening takes 10+ hours/week
• Interview scheduling back-and-forth (avg 8 emails per interview)
• No centralized candidate tracking
• Inconsistent feedback from interviewers

💻 TECH SAVVINESS
• Medium-High
• Daily tools: Gmail, Google Calendar, LinkedIn, ATS (Greenhouse)
• Comfortable with SaaS platforms
• Prefers simple, intuitive UIs

📱 DEVICES USED
• Primary: MacBook Pro (work)
• Secondary: iPhone (mobile access)

🌟 MOTIVATIONS
• Career growth (wants to be VP of HR)
• Efficiency (hates wasted time)
• Team collaboration
• Positive candidate experience

❓ QUESTIONS SARAH ASKS
• "How can I screen resumes faster?"
• "Which candidate is the best fit?"
• "When are my interviewers available?"
• "How is our hiring funnel performing?"

✅ HOW NEXUS HELPS SARAH
• CV Intelligence: Auto-screen & rank candidates (saves 8 hrs/week)
• Interview Coordinator: One-click scheduling with auto-reminders
• Analytics: Real-time hiring funnel metrics
• Support: Quick help when stuck

💬 SARAH'S QUOTE
"I need tools that save me time, not add complexity.
 If it takes longer to learn than it saves, I won't use it."
```

---

### Persona 2: Michael - Startup CTO

**Copy this into FigJam:**

```
┌─────────────────────────────────────────────────────────┐
│                      👨‍💻 MICHAEL                            │
│                  Startup CTO/Founder                     │
└─────────────────────────────────────────────────────────┘

📊 DEMOGRAPHICS
• Age: 28
• Location: Austin, TX
• Education: BS Computer Science, Stanford
• Company: Early-stage SaaS startup (5 employees)

💼 ROLE & RESPONSIBILITIES
• CTO + Acting recruiter (no HR team yet)
• Hiring first 10 engineers
• Building product + recruiting simultaneously
• Wearing all hats (engineering, hiring, fundraising)

🎯 GOALS
• Hire top engineers quickly (on startup budget)
• Minimize time spent on recruiting
• No fancy ATS needed yet
• Focus on technical talent quality

😫 PAIN POINTS
• No HR experience or training
• Limited budget (can't afford recruiters)
• Overwhelmed by resume volume
• Can't assess soft skills effectively
• Afraid of bad hires (expensive mistakes)

💻 TECH SAVVINESS
• Very High (developer background)
• Tools: GitHub, Slack, Notion, Linear, Vercel
• Loves automation and APIs
• Prefers minimal UI, fast performance

📱 DEVICES USED
• Primary: MacBook Pro + external monitor
• Secondary: iPad for reviews
• Phone: Minimal usage

🌟 MOTIVATIONS
• Build great company culture from day 1
• Hire A+ players who fit startup pace
• Scale team efficiently
• Technical excellence

❓ QUESTIONS MICHAEL ASKS
• "Is this candidate actually skilled?" (not just resume fluff)
• "Can I afford to hire them?"
• "Will they fit our startup culture?"
• "How fast can I move from resume → offer?"

✅ HOW NEXUS HELPS MICHAEL
• Affordable self-service platform (no enterprise pricing)
• AI-powered resume screening (he doesn't know how to read non-tech resumes)
• Simple, fast UI (no training needed)
• Technical skill extraction from CVs
• API access (he'll build integrations himself if needed)

💬 MICHAEL'S QUOTE
"I don't have time to learn a complex tool.
 Just give me the best candidates and let me interview them."
```

---

### Persona 3: Lisa - Recruitment Coordinator

**Copy this into FigJam:**

```
┌─────────────────────────────────────────────────────────┐
│                      👩‍💼 LISA                              │
│                Recruitment Coordinator                   │
└─────────────────────────────────────────────────────────┘

📊 DEMOGRAPHICS
• Age: 26
• Location: New York, NY
• Education: BA Business Administration
• Company: Mid-size consulting firm (500 employees)

💼 ROLE & RESPONSIBILITIES
• Schedule 20-25 interviews per week
• Coordinate with hiring managers and candidates
• Manage interview calendars
• Send confirmation emails and reminders
• Track no-shows and reschedules

🎯 GOALS
• Reduce interview no-shows (current rate: 15%)
• Minimize scheduling back-and-forth
• Keep calendar organized and conflict-free
• Improve candidate experience
• Hit SLA: Schedule within 48hrs of request

😫 PAIN POINTS
• Endless email chains ("Are you available at 2pm?")
• Time zone confusion (EST vs PST vs GMT)
• Last-minute cancellations
• Manually creating calendar invites
• Copying meeting links from Zoom/Teams
• Interviewers forget to join (no reminders)

💻 TECH SAVVINESS
• Medium
• Expert at: Outlook, Google Calendar
• Uses: ATS (Lever), Calendly (personal use)
• Comfortable with calendar tools, less so with complex software

📱 DEVICES USED
• Primary: Windows laptop (work)
• Secondary: iPhone (checking emails constantly)

🌟 MOTIVATIONS
• Being organized and efficient
• Candidate satisfaction (good experience)
• Zero errors (double-bookings are nightmare)
• Recognition from hiring managers

❓ QUESTIONS LISA ASKS
• "Is everyone available at this time?"
• "Did I send the reminder?"
• "What's the meeting link?"
• "Did the candidate confirm?"

✅ HOW NEXUS HELPS LISA
• One-click scheduling (no email chains)
• Auto-generated meeting links (Google Meet/Zoom)
• Automatic reminders (24h, 1h before)
• ICS calendar attachments (professional touch)
• Time zone auto-detection
• Centralized interview tracking

💬 LISA'S QUOTE
"If I can schedule an interview in under 2 minutes
 and never worry about reminders, I'm happy."
```

---

## Feature Mapping

### Features → User Benefits Matrix

**Copy this into FigJam:**

```
┌────────────────────────────────────────────────────────────────────────┐
│                    NEXUS FEATURES → USER BENEFITS                       │
└────────────────────────────────────────────────────────────────────────┘

┌──────────────────┬─────────────┬────────────┬─────────────┐
│ FEATURE          │   SARAH     │  MICHAEL   │    LISA     │
│                  │ (HR Manager)│   (CTO)    │ (Recruiter) │
├──────────────────┼─────────────┼────────────┼─────────────┤
│ CV Intelligence  │ ⭐⭐⭐⭐⭐    │ ⭐⭐⭐⭐⭐   │ ⭐⭐⭐        │
│ (Auto-screening) │ Saves 8h/wk │ No HR exp  │ Pre-vetted  │
│                  │ Better hires│ needed     │ candidates  │
├──────────────────┼─────────────┼────────────┼─────────────┤
│ Interview        │ ⭐⭐⭐⭐⭐    │ ⭐⭐⭐       │ ⭐⭐⭐⭐⭐     │
│ Coordinator      │ No more     │ Simple     │ Core job    │
│                  │ email chains│ scheduling │ automated!  │
├──────────────────┼─────────────┼────────────┼─────────────┤
│ Google/Outlook   │ ⭐⭐⭐⭐      │ ⭐⭐         │ ⭐⭐⭐⭐⭐     │
│ Integration      │ Existing    │ Doesn't    │ Already     │
│                  │ workflow    │ care much  │ uses daily  │
├──────────────────┼─────────────┼────────────┼─────────────┤
│ Support Tickets  │ ⭐⭐⭐        │ ⭐⭐⭐⭐      │ ⭐⭐          │
│                  │ Nice to have│ Needs help │ Rarely uses │
│                  │             │ learning   │             │
├──────────────────┼─────────────┼────────────┼─────────────┤
│ Analytics        │ ⭐⭐⭐⭐⭐    │ ⭐⭐⭐⭐      │ ⭐⭐          │
│ Dashboard        │ Reports to  │ Track      │ Not her     │
│                  │ leadership  │ metrics    │ focus       │
├──────────────────┼─────────────┼────────────┼─────────────┤
│ 2FA Security     │ ⭐⭐⭐        │ ⭐⭐⭐⭐⭐    │ ⭐⭐          │
│                  │ Company req │ Security   │ Extra step  │
│                  │             │ critical   │ (annoying)  │
├──────────────────┼─────────────┼────────────┼─────────────┤
│ Mobile Access    │ ⭐⭐⭐⭐      │ ⭐⭐         │ ⭐⭐⭐⭐       │
│                  │ Reviews on  │ Desktop    │ Checks on   │
│                  │ commute     │ only       │ phone often │
└──────────────────┴─────────────┴────────────┴─────────────┘

Legend:
⭐⭐⭐⭐⭐ = Critical feature (can't live without)
⭐⭐⭐⭐  = Very important (uses frequently)
⭐⭐⭐   = Nice to have
⭐⭐    = Rarely uses
⭐     = Doesn't use
```

---

## Workflow Diagrams

### Admin User Management Workflow

**Copy this into FigJam:**

```
┌─────────────────────────────────────────────────────────┐
│           ADMIN USER MANAGEMENT WORKFLOW                 │
└─────────────────────────────────────────────────────────┘

                  [Admin Dashboard]
                         │
                         ↓
              [Clicks "User Management"]
                         │
                         ↓
                  [Users Table Loads]
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ↓               ↓               ↓
   [Search User]   [Filter Users]  [Create New User]
         │               │               │
         │               │               ↓
         │               │         [Fill Form]
         │               │         • Name
         │               │         • Email
         │               │         • Role
         │               │         • Department
         │               │               │
         │               │               ↓
         │               │         [Submit]
         │               │               │
         │               │               ↓
         │               │        [Validation]
         │               │         ┌─────┴─────┐
         │               │         │           │
         │               │      [Pass]      [Fail]
         │               │         │           │
         │               │         ↓           ↓
         │               │   [User Created] [Show Error]
         │               │         │
         └───────────────┴─────────┤
                                   ↓
                          [Updated Users List]
                                   │
                                   ↓
                     [Select User Row Actions]
                                   │
                   ┌───────────────┼───────────────┐
                   │               │               │
                   ↓               ↓               ↓
              [Edit User]   [Deactivate]    [Delete User]
                   │               │               │
                   ↓               ↓               ↓
             [Update Form]  [Confirm Modal] [Confirm Modal]
                   │               │               │
                   ↓               ↓               ↓
              [Save Changes] [Deactivate]    [Delete]
                   │               │               │
                   └───────────────┴───────────────┘
                                   │
                                   ↓
                          [Success Toast]
                                   │
                                   ↓
                          [Refresh Table]
```

---

### CV Intelligence Processing Flow

**Copy this into FigJam:**

```
┌─────────────────────────────────────────────────────────┐
│          CV INTELLIGENCE PROCESSING FLOW                 │
└─────────────────────────────────────────────────────────┘

[User] → [CV Intelligence Page]
              │
              ↓
       [Create New Batch]
              │
              ↓
       [Batch Info Form]
       • Name: "Q1 Engineers"
       • Description: "Senior engineers"
              │
              ↓
         [Submit] → [Batch Created in DB]
              │           │
              ↓           ↓
       [Upload Interface] [cv_batches table]
              │            id, name, status="pending"
              │
              ↓
    [User Uploads 50 PDFs]
              │
              ↓
       [File Validation]
         ┌─────┴─────┐
         │           │
      [Valid]     [Invalid]
         │           │
         │           ↓
         │      [Show Error]
         │      "Only PDFs allowed"
         │           │
         ↓           ↓
  [Upload to Server] [Remove from list]
         │
         ↓
  [Click "Process"]
         │
         ↓
  [Backend Processing Starts]
         │
    ┌────┴────┐
    │ FOR EACH CV:
    │
    │ 1. [Extract Text] (pdf-parse)
    │         │
    │         ↓
    │ 2. [Parse Fields]
    │    • Name
    │    • Email
    │    • Phone
    │    • Skills
    │    • Experience
    │    • Education
    │         │
    │         ↓
    │ 3. [Calculate Score]
    │    • Skills match (40%)
    │    • Experience (30%)
    │    • Education (20%)
    │    • Certifications (10%)
    │         │
    │         ↓
    │ 4. [Save to DB]
    │    [candidates table]
    │         │
    └─────────┘
              │
              ↓
      [All CVs Processed]
              │
              ↓
   [Update batch status = "completed"]
              │
              ↓
   [Frontend Polls Status]
              │
              ↓
    [Redirect to Results]
              │
              ↓
      [Show Ranked Candidates]
      • Sorted by score (high → low)
      • Filters available
      • Export option
```

---

## System Architecture

### High-Level System Diagram

**Copy this into FigJam:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXUS SYSTEM ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   FRONTEND   │  Next.js (Static Export)
│  (Netlify)   │  • React components
│              │  • AuthContext (JWT)
│  Port: 3000  │  • API calls via axios
└──────┬───────┘
       │
       │ HTTPS (API requests)
       │ /api/*
       │
       ↓
┌──────────────┐
│   BACKEND    │  Node.js + Express
│   (Vercel)   │  • Routes: /api/*
│              │  • Controllers
│  Port: 5000  │  • Middleware (auth, rate limiting)
└──────┬───────┘
       │
       ├────────────────────────────────────┐
       │                                    │
       ↓                                    ↓
┌──────────────┐                    ┌──────────────┐
│   DATABASE   │                    │ EXTERNAL APIs│
│    (Neon)    │                    │              │
│ PostgreSQL   │                    │ • Google     │
│              │                    │   Calendar   │
│ Tables:      │                    │ • Google     │
│ • users      │                    │   OAuth      │
│ • sessions   │                    │ • Microsoft  │
│ • cv_batches │                    │   Graph      │
│ • candidates │                    │ • SMTP       │
│ • interviews │                    │   (Email)    │
│ • tickets    │                    │              │
└──────────────┘                    └──────────────┘
       │
       │ (Optional)
       │
       ↓
┌──────────────┐
│    CACHE     │
│   (Redis)    │  Upstash Redis
│              │  • Session cache
│              │  • API response cache
└──────────────┘


DATA FLOW EXAMPLE: User Login
─────────────────────────────

[User] → [Login Page] → POST /api/auth/login
                              ↓
                        [AuthController]
                              ↓
                        [Check credentials]
                              ↓
                        [Query DB: users table]
                              ↓
                        [Validate password (bcrypt)]
                              ↓
                        [Generate JWT tokens]
                              ↓
                        [Store in user_sessions]
                              ↓
                        [Return tokens to frontend]
                              ↓
                        [Frontend saves in cookies]
                              ↓
                        [Redirect to dashboard]
```

---

## Brainstorming Templates

### Feature Brainstorm: Email Notifications

**Copy this into FigJam:**

```
┌─────────────────────────────────────────────────────────┐
│         FEATURE BRAINSTORM: EMAIL NOTIFICATIONS          │
└─────────────────────────────────────────────────────────┘

PROBLEM STATEMENT:
"Users miss important updates because there's no email notification system"

WHO IS AFFECTED?
• All users (miss ticket responses)
• Candidates (miss interview invitations)
• Admins (miss new tickets)

GOALS:
✅ Increase user engagement
✅ Reduce missed interviews
✅ Improve response times

NOTIFICATION TYPES TO BUILD:
┌─────────────────────────────────────┐
│ 1. INTERVIEW REMINDERS              │
│    • 24h before                     │
│    • 1h before                      │
│    Priority: HIGH                   │
│    User preference: Yes/No          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 2. SUPPORT TICKET UPDATES           │
│    • New comment                    │
│    • Status changed                 │
│    Priority: MEDIUM                 │
│    User preference: Immediate/Daily │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 3. CV BATCH PROCESSING COMPLETE     │
│    • Email when batch done          │
│    Priority: HIGH                   │
│    User preference: Always          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 4. SYSTEM ANNOUNCEMENTS             │
│    • New features                   │
│    • Maintenance windows            │
│    Priority: LOW                    │
│    User preference: Weekly          │
└─────────────────────────────────────┘

TECHNICAL CONSIDERATIONS:
• Use existing emailService.js
• Add notification_preferences table
• Queue system for bulk emails? (future)
• Unsubscribe link in all emails (legal requirement)

USER PREFERENCES UI:
[Settings Page]
  └─ Notifications Tab
       ├─ Email Notifications: [Toggle ON]
       ├─ Interview Reminders: [Immediate]
       ├─ Ticket Updates: [Daily Digest]
       ├─ CV Processing: [Immediate]
       └─ System Announcements: [Weekly]

SUCCESS METRICS:
📧 Email open rate > 40%
📧 Click-through rate > 15%
📧 Unsubscribe rate < 2%
📅 Interview no-show reduction: 15% → 5%

NEXT STEPS:
1. [ ] Design notification preferences UI
2. [ ] Create email templates (HTML)
3. [ ] Build notification service
4. [ ] Add to user settings
5. [ ] Test with real users
```

---

## Quick Copy: Journey Template (Blank)

**Use this blank template for any new journey:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         [JOURNEY NAME]                               │
│                                                                       │
│  Persona: [Name]                                                     │
│  Goal: [What they want to achieve]                                  │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: [Step Name]
┌─────────────────┐
│   User Action   │  [Description]
├─────────────────┤
│   Screen/UI     │  [What they see]
├─────────────────┤
│   Emotion       │  [Emoji + feeling]
├─────────────────┤
│  Pain Points    │  • [Issue 1]
│                 │  • [Issue 2]
├─────────────────┤
│ Opportunities   │  • [Improvement 1]
│                 │  • [Improvement 2]
└─────────────────┘
         │
         ↓
STEP 2: [Step Name]
[... repeat structure ...]

SUCCESS METRICS:
✅ [Metric 1]
✅ [Metric 2]
```

---

Use these templates in your FigJam boards to quickly document user journeys, personas, workflows, and brainstorming sessions for the Nexus platform!
