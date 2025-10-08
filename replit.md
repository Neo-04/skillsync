# Employee Management System

## Overview

This is a full-stack Employee Management System built with Next.js 15, featuring AI-powered productivity tools for workforce management. The application enables organizations to manage employees, track daily progress reports (DPRs), monitor key performance indicators (KPIs), conduct annual performance appraisals (APARs), and manage projects with a Kanban-style task board. AI integration via OpenAI provides intelligent summarization and draft generation capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: Next.js 15 with App Router and React 19
- Client-side rendered pages with 'use client' directive for interactive components
- TypeScript for type safety across the application
- Tailwind CSS v4 for styling with PostCSS integration
- Responsive design with dark mode support via CSS custom properties

**Routing Strategy**: App Router with page-based routing
- `/login` - Authentication (login/signup)
- `/dashboard` - Main dashboard overview
- `/profile` - User profile and KPI management
- `/dpr` - Daily Progress Reports
- `/apar` - Annual Performance Appraisals
- `/kanban` - Project and task management

**State Management**: React useState hooks with localStorage for authentication persistence
- JWT tokens stored in localStorage for session management
- User data cached client-side for quick access
- No global state management library; component-level state only

### Backend Architecture

**API Design**: Next.js API Routes (App Router pattern)
- RESTful API endpoints under `/app/api/*`
- Route handlers follow GET/POST/PUT/DELETE patterns
- Middleware-based authentication using custom `authenticate()` and `requireAdmin()` functions

**Authentication & Authorization**:
- JWT-based authentication with 7-day token expiry
- Bearer token authentication via Authorization headers
- Password hashing with bcryptjs (10 salt rounds)
- Role-based access control (admin/employee roles)
- Session secret stored in `SESSION_SECRET` environment variable

**Middleware Pattern**:
- Custom `authenticate()` wrapper for protected routes
- Request augmentation with user context (userId, email, role)
- `requireAdmin()` for admin-only endpoints
- Centralized error handling for unauthorized/forbidden access

### Data Storage

**Database**: MongoDB with Mongoose ODM
- Connection pooling with cached connections for serverless optimization
- Schema-based models with TypeScript interfaces

**Data Models**:

1. **User Model** - Employee and admin accounts
   - Fields: name, email, password (hashed), role (hq_staff|field_staff|admin|super_admin|employee), department, position, themePreference
   - Unique email constraint for user identification
   - Theme preference for personalized UI

2. **DPR Model** - Daily Progress Reports
   - Linked to User and optionally to Project
   - Contains content, AI-generated summary, and date tracking

3. **APAR Model** - Annual Performance Appraisal Reports
   - Employee self-appraisal with achievements, challenges, innovations
   - Reviewer comments and scoring system
   - Final score calculated from KPI average + reviewer score
   - Status workflow: draft → submitted → reviewed → finalized
   - Stores AI-generated drafts

4. **KPI Model** - Key Performance Indicators
   - Metric-based tracking with value vs target comparison
   - Progress percentage auto-calculated
   - Deadline tracking and role assignment
   - Admin scoring and remarks system
   - Period-based organization (monthly, quarterly, annual)
   - Status: not_started, in_progress, completed, at_risk

5. **Project Model** - Project and task management
   - Embedded task subdocuments with Kanban status (todo/in-progress/done)
   - Multiple assignees support
   - Project status tracking (active/completed/on-hold)

6. **Mail Model** - Email history and tracking
   - Sender (User reference), recipient email, subject, body
   - Status tracking (sent/failed) with error logging
   - Timestamp for audit trail

7. **Notification Model** - System notifications
   - User-specific notifications
   - Types: kpi, apar, mail, system
   - Read/unread status tracking
   - Related entity references for context

**Database Connection**:
- URI configured via `MONGO_URI` environment variable
- Global connection caching to prevent connection exhaustion in serverless
- Auto-reconnection with error handling

### External Dependencies

**OpenAI Integration**:
- OpenAI API (v6.1.0) for AI-powered features
- GPT-3.5-turbo model for text generation
- API key stored in `OPENAI_API_KEY` environment variable

**AI Features**:
1. **DPR Summarization** (`/api/ai/dpr-summary`)
   - Automatically generates concise summaries from daily reports
   - Highlights key accomplishments and blockers
   - Max tokens: 300

2. **APAR Draft Generation** (`/api/ai/apar-draft`)
   - Creates professional performance appraisal drafts
   - Structures content based on achievements, challenges, and goals
   - Max tokens: 800

**Third-Party Libraries**:
- `bcryptjs` - Password hashing and verification
- `jsonwebtoken` - JWT token generation and verification
- `mongoose` - MongoDB ODM with schema validation
- `openai` - OpenAI API client
- `tailwindcss` - Utility-first CSS framework
- `autoprefixer` - CSS vendor prefixing

**Environment Variables Required**:
- `MONGO_URI` - MongoDB connection string
- `SESSION_SECRET` - JWT signing secret
- `OPENAI_API_KEY` - OpenAI API authentication key

**Development Server**: Runs on port 5000 (configured in package.json scripts)

## Replit Environment Setup

### Recent Changes (October 5, 2025)

**Performance Management Module Enhancement**:
1. **Extended User Model**:
   - Added expanded role support: hq_staff, field_staff, admin, super_admin (backward compatible with 'employee')
   - Added themePreference field for dark/light/system theme persistence

2. **Enhanced KPI Module**:
   - Added title, progress (%), deadline, role fields
   - Extended status options: not_started, in_progress, completed, at_risk (backward compatible)
   - Added remarks field for admin feedback
   - Auto-calculates progress percentage from achievedValue/target
   - Frontend includes employee view (update progress) and admin view (assign KPIs, score)

3. **Comprehensive APAR Module**:
   - Restructured with selfAppraisal (achievements, challenges, innovations)
   - Added reviewer, reviewerComments, reviewerScore fields
   - Added finalScore calculation (avg KPI score + reviewer score)
   - Status workflow: draft → submitted → reviewed → finalized
   - Frontend includes employee view (fill self-appraisal, view history) and admin view (review, finalize)

4. **New Mail Module**:
   - Mail model for email history tracking
   - API endpoint `/api/mail/send` for sending emails
   - Frontend at `/mail` with compose form and sent mail history
   - Tracks sent/failed status with error logging

5. **Notification System**:
   - Notification model for system notifications
   - API endpoints for creating, reading, and managing notifications
   - Types: kpi, apar, mail, system
   - Supports read/unread status tracking

6. **Enhanced Settings Page**:
   - Theme preferences now sync to database via User model
   - Persists to both localStorage and DB for consistency
   - Loads user's saved theme on login

7. **New API Endpoints**:
   - `/api/mail/send` (POST) - Send emails
   - `/api/mail` (GET) - Get mail history
   - `/api/notifications` (GET, POST) - Manage notifications
   - `/api/notifications/[id]` (PATCH, DELETE) - Update/delete notifications
   - `/api/apar` (GET, POST) - Enhanced APAR management
   - `/api/apar/[id]` (PATCH) - Update APAR with review/finalize
   - `/api/auth/me` (PATCH) - Added themePreference update support

8. **Navigation Updated**:
   - Added Mail tab to navigation
   - All features accessible from sidebar navigation

**Backward Compatibility**:
- All existing database entries preserved with defaults for new fields
- Old KPI status values (Pending, In Progress, Completed) still supported
- Old APAR structure supported alongside new structure
- Employee role still works alongside new role types

## Recent Changes (October 4, 2025)

**Initial Replit Environment Configuration**:
1. Installed all npm dependencies
2. Configured Next.js for Replit proxy environment with `allowedDevOrigins: ['*']`
3. Set up MongoDB locally on port 3001 (Replit port restriction)
4. Created .env.local with environment variables:
   - `MONGO_URI=mongodb://127.0.0.1:3001/employee-management`
   - `OPENAI_API_KEY=your_openai_api_key_here` (needs to be updated with real key)
5. Configured two workflows:
   - **MongoDB**: Runs local MongoDB server on port 3001
   - **Server**: Runs Next.js development server on port 5000
6. Configured deployment settings for autoscale with build and start commands

### Important Notes

**MongoDB Configuration**:
- MongoDB runs on port 3001 instead of default 27017 due to Replit port restrictions
- Data stored in `./mongodb_data` directory
- Logs available in `./mongodb_data/mongodb.log`
- MongoDB workflow must be running for the application to connect to the database

**OpenAI Integration**:
- The `OPENAI_API_KEY` environment variable needs to be set with a valid API key to use AI features
- AI features include DPR summarization and APAR draft generation
- Application will work without OpenAI key but AI features will fail

**Next.js Configuration**:
- Configured to allow all dev origins for Replit proxy compatibility
- CORS headers set to allow all origins in development
- Server actions allowed from all origins

**Workflows**:
- MongoDB must be running before starting the Server workflow
- Both workflows are configured to auto-start
- Server workflow binds to 0.0.0.0:5000 for external access

**Deployment**:
- Configured for autoscale deployment
- Build command: `npm run build`
- Start command: `npm start`
- Environment variables need to be configured in deployment settings