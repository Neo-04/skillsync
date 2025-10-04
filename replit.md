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
   - Fields: name, email, password (hashed), role, department, position
   - Unique email constraint for user identification

2. **DPR Model** - Daily Progress Reports
   - Linked to User and optionally to Project
   - Contains content, AI-generated summary, and date tracking

3. **APAR Model** - Annual Performance Appraisal Reports
   - Tracks achievements, challenges, goals by period/year
   - Status workflow: draft → submitted → reviewed
   - Stores AI-generated drafts

4. **KPI Model** - Key Performance Indicators
   - Metric-based tracking with value vs target comparison
   - Period-based organization (monthly, quarterly, annual)

5. **Project Model** - Project and task management
   - Embedded task subdocuments with Kanban status (todo/in-progress/done)
   - Multiple assignees support
   - Project status tracking (active/completed/on-hold)

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