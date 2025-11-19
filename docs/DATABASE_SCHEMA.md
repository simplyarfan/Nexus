# Database Schema Documentation

**Database**: neondb (PostgreSQL 17)
**Provider**: Neon (Cloud PostgreSQL)
**Schema**: public
**Last Updated**: 2025-11-19

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Tables](#tables)
   - [users](#users)
   - [candidates](#candidates)
   - [cv_batches](#cv_batches)
   - [interviews](#interviews)
   - [interview_reminders](#interview_reminders)
   - [jobs](#jobs)
   - [resumes_raw](#resumes_raw)
   - [resume_entities](#resume_entities)
   - [notifications](#notifications)
   - [support_tickets](#support_tickets)
   - [ticket_comments](#ticket_comments)
   - [user_sessions](#user_sessions)
   - [user_preferences](#user_preferences)
   - [user_analytics](#user_analytics)
   - [agent_usage_stats](#agent_usage_stats)
   - [system_settings](#system_settings)
4. [Relationships](#relationships)

---

## Overview

The Nexus AI Platform database consists of **16 tables** organized into the following functional areas:

### **1. User Management**
- `users` - Core user accounts
- `user_sessions` - Authentication sessions
- `user_preferences` - User settings and preferences
- `user_analytics` - User activity tracking
- `agent_usage_stats` - AI agent usage statistics

### **2. CV Intelligence & Recruitment**
- `cv_batches` - CV processing batches
- `candidates` - Processed candidate profiles
- `interviews` - Interview scheduling
- `interview_reminders` - Interview reminder emails
- `jobs` - Job descriptions and requirements
- `resumes_raw` - Raw uploaded resumes
- `resume_entities` - Extracted resume entities (NER)

### **3. Support & Notifications**
- `notifications` - User notifications
- `support_tickets` - Support ticket system
- `ticket_comments` - Ticket comment threads

### **4. System**
- `system_settings` - Application-wide settings

---

## Entity Relationship Diagram

```
┌─────────────┐
│    users    │──┐
└─────────────┘  │
       │         │
       │ 1:N     │ 1:N
       │         │
       ├─────────┼──────────────────┬─────────────┬──────────────┬─────────────┬─────────────┐
       │         │                  │             │              │             │             │
       ▼         ▼                  ▼             ▼              ▼             ▼             ▼
┌──────────┐ ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐
│cv_batches│ │interviews│  │resumes_raw│  │   jobs   │  │user_sess│  │user_pref │  │user_anal │
└──────────┘ └──────────┘  └───────────┘  └──────────┘  └─────────┘  └──────────┘  └──────────┘
     │             │              │
     │ 1:N         │ 1:N          │ 1:N
     │             │              │
     ▼             ▼              ▼
┌──────────┐ ┌──────────┐  ┌───────────┐
│candidates│ │int_remind│  │resume_ent │
└──────────┘ └──────────┘  └───────────┘


┌──────────────┐
│support_tickets│──┐
└──────────────┘  │ 1:N
                  │
                  ▼
           ┌──────────────┐
           │ticket_comments│
           └──────────────┘
```

---

## Tables

### users

**Purpose**: Core user authentication and profile management

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | integer | NO | nextval | Primary key |
| `email` | varchar(255) | NO | - | Unique email address |
| `password_hash` | varchar(255) | NO | - | Bcrypt hashed password |
| `first_name` | varchar(100) | NO | - | User's first name |
| `last_name` | varchar(100) | NO | - | User's last name |
| `role` | varchar(50) | YES | 'user' | User role (user/admin) |
| `department` | varchar(100) | YES | - | Department name |
| `job_title` | varchar(100) | YES | - | Job title |
| `is_active` | boolean | YES | true | Account active status |
| `is_verified` | boolean | YES | false | Email verification status |
| `verification_token` | varchar(255) | YES | - | Email verification token |
| `verification_expiry` | timestamp | YES | - | Verification token expiry |
| `reset_token` | varchar(255) | YES | - | Password reset token |
| `reset_token_expiry` | timestamp | YES | - | Reset token expiry |
| `last_login` | timestamp | YES | - | Last login timestamp |
| `failed_login_attempts` | integer | YES | 0 | Failed login counter |
| `account_locked_until` | timestamp | YES | - | Account lock expiry |
| `outlook_access_token` | text | YES | - | Microsoft Outlook OAuth token |
| `outlook_refresh_token` | text | YES | - | Outlook refresh token |
| `outlook_token_expires_at` | timestamp | YES | - | Outlook token expiry |
| `outlook_email` | varchar(255) | YES | - | Connected Outlook email |
| `outlook_pkce_verifier` | text | YES | - | PKCE verifier for OAuth |
| `two_factor_enabled` | boolean | YES | false | 2FA enabled flag |
| `two_factor_secret` | varchar(255) | YES | - | TOTP secret |
| `two_factor_code` | varchar(10) | YES | - | Current 2FA code |
| `two_factor_code_expires_at` | timestamp | YES | - | 2FA code expiry |
| `google_access_token` | text | YES | - | Google OAuth token |
| `google_refresh_token` | text | YES | - | Google refresh token |
| `google_token_expires_at` | timestamp | YES | - | Google token expiry |
| `phone` | varchar(50) | YES | - | Phone number |
| `profile_picture_url` | text | YES | - | Profile picture URL |
| `bio` | text | YES | - | User bio |
| `timezone` | varchar(100) | YES | 'Asia/Riyadh' | User timezone |
| `date_format` | varchar(20) | YES | 'MM/DD/YYYY' | Preferred date format |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Account creation timestamp |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | Last update timestamp |

**Constraints**:
- PRIMARY KEY: `id`
- UNIQUE: `email`

**Indexes**:
- `idx_users_email` (unique)
- `idx_users_role`
- `idx_users_is_active`

---

### candidates

**Purpose**: Stores processed candidate profiles from CV Intelligence system

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | varchar(255) | NO | - | Primary key (UUID format) |
| `batch_id` | varchar(255) | NO | - | Foreign key to cv_batches |
| `name` | varchar(255) | YES | - | Candidate full name |
| `email` | varchar(255) | YES | - | Candidate email |
| `phone` | varchar(50) | YES | - | Candidate phone |
| `location` | varchar(255) | YES | - | Candidate location |
| `profile_json` | text | YES | - | Complete CV profile (JSON) |
| `overall_score` | integer | YES | 0 | Overall match score (0-100) |
| `professional_assessment` | text | YES | - | **NEW**: ChatGPT professional assessment |
| `experience` | jsonb | YES | - | **NEW**: Work experience (JSONB) |
| `education` | jsonb | YES | - | **NEW**: Education history (JSONB) |
| `rank_reasoning` | text | YES | - | **NEW**: ChatGPT ranking reasoning |
| `recommendation_level` | text | YES | - | **NEW**: Hire recommendation level |
| `matched_skills` | text | YES | - | **NEW**: Skills matching JD (JSON array) |
| `missing_skills` | text | YES | - | **NEW**: Skills missing from JD (JSON array) |
| `additional_skills` | text | YES | - | **NEW**: Extra skills not in JD (JSON array) |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Record creation timestamp |

**Constraints**:
- PRIMARY KEY: `id`

**Note**: This table was recently enhanced with ChatGPT-based skill matching and assessment columns.

---

### cv_batches

**Purpose**: Manages CV processing batches with job requirements

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | varchar(255) | NO | - | Primary key (UUID format) |
| `user_id` | integer | NO | - | Foreign key to users |
| `name` | varchar(255) | NO | - | Batch name |
| `status` | varchar(50) | YES | 'processing' | Batch status (processing/completed/failed) |
| `total_resumes` | integer | YES | 0 | Total CVs in batch |
| `processed_resumes` | integer | YES | 0 | Successfully processed CVs |
| `jd_requirements` | text | YES | - | Job description requirements (JSON) |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Batch creation timestamp |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | Last update timestamp |

**Constraints**:
- PRIMARY KEY: `id`

**Note**: One batch can have multiple candidates (1:N relationship).

---

### interviews

**Purpose**: Interview scheduling and management system

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | varchar(255) | NO | - | Primary key (UUID format) |
| `candidate_id` | varchar(255) | NO | - | Candidate identifier |
| `candidate_name` | varchar(255) | NO | - | Candidate full name |
| `candidate_email` | varchar(255) | NO | - | Candidate email |
| `job_title` | varchar(255) | NO | - | Position title |
| `interview_type` | varchar(50) | YES | 'technical' | Interview type |
| `status` | varchar(50) | YES | 'scheduled' | Interview status |
| `scheduled_time` | timestamp | YES | - | Interview date/time |
| `scheduled_at` | timestamp | YES | - | When interview was scheduled |
| `duration` | integer | YES | 60 | Duration in minutes |
| `location` | varchar(255) | YES | 'Video Call' | Interview location |
| `meeting_link` | text | YES | - | Video meeting URL |
| `calendly_link` | text | YES | - | Calendly booking link |
| `google_form_link` | text | YES | - | Pre-interview form link |
| `google_event_id` | varchar(255) | YES | - | Google Calendar event ID |
| `teams_meeting_id` | varchar(255) | YES | - | MS Teams meeting ID |
| `panel_members` | text | YES | - | Interview panel (JSON array) |
| `generated_questions` | text | YES | - | AI-generated questions (JSON) |
| `notes` | text | YES | - | Interview notes |
| `outcome` | varchar(50) | YES | - | Interview result |
| `platform` | varchar(100) | YES | - | Meeting platform (Google/Teams) |
| `scheduled_by` | integer | NO | - | User ID who scheduled |
| `cv_file_path` | text | YES | - | Path to candidate CV |
| `cc_emails` | text | YES | - | CC email addresses (JSON array) |
| `bcc_emails` | text | YES | - | BCC email addresses (JSON array) |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | Last update timestamp |

**Constraints**:
- PRIMARY KEY: `id`

---

### interview_reminders

**Purpose**: Automated interview reminder emails

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | varchar(255) | NO | - | Primary key (UUID format) |
| `interview_id` | varchar(255) | NO | - | Foreign key to interviews |
| `reminder_type` | varchar(50) | NO | - | Reminder type (24h/1h/etc) |
| `recipient_email` | varchar(255) | NO | - | Email recipient |
| `message` | text | NO | - | Reminder message |
| `send_at` | timestamp | NO | - | Scheduled send time |
| `sent` | boolean | YES | false | Sent status flag |
| `sent_at` | timestamp | YES | - | Actual send timestamp |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Record creation timestamp |

**Constraints**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `interview_id` → `interviews.id`

---

### jobs

**Purpose**: Job descriptions and requirements for CV matching

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `user_id` | integer | NO | - | Foreign key to users |
| `title` | varchar(255) | NO | - | Job title |
| `description` | text | NO | - | Job description |
| `requirements_json` | jsonb | NO | - | Job requirements (JSONB) |
| `embedding` | text | YES | - | Vector embedding for semantic search |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Record creation timestamp |

**Constraints**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` → `users.id`

---

### resumes_raw

**Purpose**: Stores raw uploaded resume files and extracted text

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `user_id` | integer | NO | - | Foreign key to users |
| `filename` | varchar(255) | NO | - | Original filename |
| `file_url` | text | NO | - | S3/storage URL |
| `file_size` | integer | YES | - | File size in bytes |
| `file_type` | varchar(50) | YES | - | MIME type |
| `upload_timestamp` | timestamp | YES | CURRENT_TIMESTAMP | Upload timestamp |
| `raw_text` | text | YES | - | Extracted text from PDF/DOCX |
| `processing_status` | varchar(50) | YES | 'pending' | Processing status |

**Constraints**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` → `users.id`

---

### resume_entities

**Purpose**: Named Entity Recognition (NER) results from resume parsing

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `resume_id` | uuid | NO | - | Foreign key to resumes_raw |
| `entity_type` | varchar(50) | NO | - | Entity type (PERSON/ORG/SKILL/etc) |
| `entity_value` | text | NO | - | Extracted entity text |
| `confidence_score` | double precision | YES | 0.0 | NER confidence (0.0-1.0) |
| `start_offset` | integer | YES | - | Character start position |
| `end_offset` | integer | YES | - | Character end position |
| `spacy_label` | varchar(50) | YES | - | spaCy NER label |
| `context_window` | text | YES | - | Surrounding text context |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Record creation timestamp |

**Constraints**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `resume_id` → `resumes_raw.id`

---

### notifications

**Purpose**: User notification system

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | integer | NO | nextval | Primary key |
| `user_id` | integer | NO | - | Foreign key to users |
| `type` | varchar(50) | NO | - | Notification type |
| `title` | varchar(255) | NO | - | Notification title |
| `message` | text | NO | - | Notification message |
| `metadata` | json | YES | - | Additional metadata (JSON) |
| `is_read` | boolean | YES | false | Read status flag |
| `read_at` | timestamp | YES | - | Read timestamp |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Record creation timestamp |

**Constraints**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` → `users.id`

---

### support_tickets

**Purpose**: Customer support ticket system

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | integer | NO | nextval | Primary key |
| `user_id` | integer | NO | - | Foreign key to users (requester) |
| `subject` | varchar(255) | NO | - | Ticket subject |
| `description` | text | NO | - | Ticket description |
| `status` | varchar(50) | YES | 'open' | Ticket status (open/closed/pending) |
| `priority` | varchar(20) | YES | 'medium' | Priority (low/medium/high/urgent) |
| `category` | varchar(50) | YES | 'general' | Ticket category |
| `assigned_to` | integer | YES | - | Foreign key to users (assignee) |
| `resolution` | text | YES | - | Resolution notes |
| `resolved_at` | timestamp | YES | - | Resolution timestamp |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Ticket creation timestamp |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | Last update timestamp |

**Constraints**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` → `users.id`
- FOREIGN KEY: `assigned_to` → `users.id`

---

### ticket_comments

**Purpose**: Comment threads for support tickets

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | integer | NO | nextval | Primary key |
| `ticket_id` | integer | NO | - | Foreign key to support_tickets |
| `user_id` | integer | NO | - | Foreign key to users (commenter) |
| `comment` | text | NO | - | Comment text |
| `is_internal` | boolean | YES | false | Internal note flag |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Comment timestamp |

**Constraints**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `ticket_id` → `support_tickets.id`
- FOREIGN KEY: `user_id` → `users.id`

---

### user_sessions

**Purpose**: JWT session management

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | integer | NO | nextval | Primary key |
| `user_id` | integer | NO | - | Foreign key to users |
| `session_token` | varchar(255) | NO | - | JWT access token |
| `refresh_token` | varchar(255) | NO | - | JWT refresh token |
| `expires_at` | timestamp | NO | - | Session expiry |
| `ip_address` | varchar(45) | YES | - | Client IP address |
| `user_agent` | text | YES | - | Client user agent |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Session creation timestamp |

**Constraints**:
- PRIMARY KEY: `id`
- UNIQUE: `session_token`
- UNIQUE: `refresh_token`
- FOREIGN KEY: `user_id` → `users.id`

---

### user_preferences

**Purpose**: User settings and preferences

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | integer | NO | nextval | Primary key |
| `user_id` | integer | NO | - | Foreign key to users |
| `theme` | varchar(20) | YES | 'light' | UI theme (light/dark) |
| `notifications_email` | boolean | YES | true | Email notifications enabled |
| `notifications_browser` | boolean | YES | true | Browser notifications enabled |
| `language` | varchar(10) | YES | 'en' | UI language |
| `timezone` | varchar(50) | YES | 'UTC' | User timezone |
| `date_format` | varchar(20) | YES | 'MM/DD/YYYY' | Preferred date format |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | Last update timestamp |

**Constraints**:
- PRIMARY KEY: `id`
- UNIQUE: `user_id` (one preference per user)
- FOREIGN KEY: `user_id` → `users.id`

---

### user_analytics

**Purpose**: Tracks user actions and events

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | integer | NO | nextval | Primary key |
| `user_id` | integer | YES | - | Foreign key to users (nullable for anonymous) |
| `action` | varchar(100) | NO | - | Action type (page_view/button_click/etc) |
| `agent_id` | varchar(100) | YES | - | AI agent identifier |
| `metadata` | jsonb | YES | - | Additional event data (JSONB) |
| `ip_address` | varchar(45) | YES | - | Client IP address |
| `user_agent` | text | YES | - | Client user agent |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Event timestamp |

**Constraints**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` → `users.id`

---

### agent_usage_stats

**Purpose**: AI agent usage statistics by user

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | integer | NO | nextval | Primary key |
| `user_id` | integer | NO | - | Foreign key to users |
| `agent_id` | varchar(100) | NO | - | AI agent identifier |
| `usage_count` | integer | YES | 0 | Number of times used |
| `total_time_spent` | integer | YES | 0 | Total time in seconds |
| `date` | date | NO | - | Usage date |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | Last update timestamp |

**Constraints**:
- PRIMARY KEY: `id`
- UNIQUE: (`user_id`, `agent_id`, `date`) - One record per user/agent/date
- FOREIGN KEY: `user_id` → `users.id`

---

### system_settings

**Purpose**: Application-wide configuration settings

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | integer | NO | nextval | Primary key |
| `key` | varchar(100) | NO | - | Setting key (unique) |
| `value` | text | NO | - | Setting value |
| `description` | text | YES | - | Setting description |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP | Last update timestamp |

**Constraints**:
- PRIMARY KEY: `id`
- UNIQUE: `key`

---

## Relationships

### Foreign Key Relationships

```sql
-- User-related relationships
cv_batches.user_id            → users.id
jobs.user_id                  → users.id
resumes_raw.user_id           → users.id
notifications.user_id         → users.id
support_tickets.user_id       → users.id
support_tickets.assigned_to   → users.id
ticket_comments.user_id       → users.id
user_sessions.user_id         → users.id
user_preferences.user_id      → users.id (1:1)
user_analytics.user_id        → users.id
agent_usage_stats.user_id     → users.id

-- CV Intelligence relationships
resume_entities.resume_id     → resumes_raw.id

-- Interview relationships
interview_reminders.interview_id → interviews.id

-- Support relationships
ticket_comments.ticket_id     → support_tickets.id
```

### Logical Relationships (Non-FK)

```sql
-- CV Intelligence flow
cv_batches.id ─────(1:N)─────> candidates.batch_id

-- Interview flow
candidates.id ─────(1:N)─────> interviews.candidate_id (logical)
```

---

## Notes

### Recent Schema Changes (2025-11-19)

**CV Intelligence Enhancement**:
- Added `professional_assessment` (TEXT) to `candidates` - ChatGPT professional assessment
- Added `experience` (JSONB) to `candidates` - Work experience history
- Added `education` (JSONB) to `candidates` - Education history
- Added `rank_reasoning` (TEXT) to `candidates` - ChatGPT ranking reasoning
- Added `recommendation_level` (TEXT) to `candidates` - Hire recommendation (Strong Hire/Hire/Maybe/Pass)
- Added `matched_skills` (TEXT) to `candidates` - Skills matching JD (JSON array)
- Added `missing_skills` (TEXT) to `candidates` - Skills missing from JD (JSON array)
- Added `additional_skills` (TEXT) to `candidates` - Extra skills not in JD (JSON array)

**Purpose**: Enable 100% ChatGPT-based CV analysis with complete skill matching and assessment.

### Data Types

- **UUID columns**: Stored as `varchar(255)` for compatibility (candidates, cv_batches, interviews)
- **JSON columns**: Mix of `text` (JSON strings) and `jsonb` (binary JSON)
- **JSONB advantages**: Better query performance, indexable, automatic validation
- **TEXT JSON**: Used for skill arrays where simple parsing is sufficient

### Indexes

Key indexes for performance:
- `idx_users_email` - Unique login lookups
- `idx_users_role` - Role-based queries
- `idx_users_is_active` - Active user filtering

---

## Connection Information

**Database URL** (from .env):
```
postgresql://neondb_owner:***@ep-sweet-dust-adc4jjkh-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Region**: AWS US-East-1
**Connection Type**: Pooled (Neon Serverless)
