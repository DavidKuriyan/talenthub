Boot Camp

systems-thinking-boot-camp-day-one
 systems-thinking-boot-camp-day-one
 
Executive Summary: Systems Thinking Bootcamp – Day 1 for engineering students in their 3rd year all belonging to school of computing branches.
 
Purpose
10‑hour intensive builds a production‑ready multi‑tenant SaaS vertical slice that solves real SME problems while teaching 8 core CS foundations: Digital Systems, Architecture, Networks, OS, DS, OOPS, AI/ML, Security.
 
**Format**: 34 students in 17 pairs (pair programming) — each pair equipped with GitHub Copilot or equivalent AI coding assistant.
 
**Key Insight**: This isn't just a website - it's a complete **software system** that mirrors what you learn in 8 semesters:
- **Digital Design** → UI Components
- **Computer Architecture** → Database schema
- **Operating Systems** → Process isolation (tenants)
- **Networks** → API calls + WebSockets
- **Data Structures** → Efficient queries
- **OOPS** → Component reusability
- **AI/ML** → Smart matching + AI assistance
- **Security** → Multi-layered protection
 
Now let's build it step by step...
 
The Problem Solved
Tamil Nadu SMEs (doctors, lawyers, civil engineers, electrical and plumbing technicians, manpower agencies) lose 70% leads trapped in WhatsApp→Excel chaos. No secure client portals, no payments, no video consults, no scale.
  Solution Delivered
Students ship a 100% working multi‑tenant marketplace with:
✅ Multi‑tenancy + RLS (tenant1.localhost vs tenant2.localhost)
✅ Razorpay payments + HMAC security
✅ Private chat + Jitsi video
✅ Admin dashboards (revenue, orders, tenant mgmt)
✅ 85%+ test coverage (unit + E2E)
✅ Docker deployment
 
Technical Excellence
Next.js 15 + Supabase RLS + Razorpay + Jitsi
Mobile app.localhost ↔ Desktop admin.localhost
Dark mode + responsive + AI‑safe annotations
85%+ test coverage (140+ passing tests)
Production security (TLS + bcrypt + audit logs)
 
Business Impact
Before: ₹1.2L/month (15 placements, 70% lead loss)
After: ₹6.8L/month (85 placements, 70% conversion)
5.6x revenue growth demonstrated live.
 
Learning Outcomes
Students master systems thinking: how Digital Design → OS → Networks → APIs → UI → Security → Tests form a shippable product. They leave with GitHub portfolio code ready for production.
 
Day 2 Preview
AGV (IoT+Edge+AI) extends same architecture to hardware, showing students can solve software AND hardware SME problems.
 
"From WhatsApp hell to ₹6.8L/month in 10 hours.
This is what systems thinking builds."
 
---
 
## 🏗️ Platform Architecture
 
```mermaid
---
title: TalentHub Platform Architecture - Systems Thinking Bootcamp
---
flowchart TD
    %% ========== USERS ==========
    subgraph Users
        direction LR
        U1[Subscriber<br/>Client]
        U2[Provider<br/>Service Provider]
        U3[Admin<br/>Tenant Owner]
    end
   
    %% ========== FRONTEND TIER ==========
    subgraph Frontend["Frontend Tier (Next.js 15)"]
        direction TB
        F1["App Router<br/>app.localhost:3000"]
        F2["Admin Router<br/>admin.localhost:3000"]
        F3["Middleware<br/>Auth + Tenant Routing"]
       
        F1 --> F4["Mobile UI<br/>Bottom Navigation"]
        F2 --> F5["Desktop UI<br/>Collapsible Sidebars"]
       
        F6["UI Components<br/>shadcn/ui + Tailwind"]
        F7["Theme System<br/>Dark/Light Mode"]
    end
   
    %% ========== BACKEND TIER ==========
    subgraph Backend["Backend Tier (Supabase + Next.js API)"]
        direction TB
        B1["Auth & Session<br/>Email + JWT"]
        B2["API Routes<br/>REST Endpoints"]
        B3["Server Actions<br/>Form Handling"]
       
        B4["Row Level Security<br/>Tenant Isolation"]
        B5["Realtime<br/>WebSocket Connections"]
        B6["Edge Functions<br/>Serverless Logic"]
    end
   
    %% ========== DATABASE TIER ==========
    subgraph Database["Database Tier (PostgreSQL)"]
        direction LR
        DB1["tenants<br/>Multi-tenant Isolation"]
        DB2["users<br/>Role-based Access"]
        DB3["products<br/>Service Listings"]
        DB4["orders<br/>Transaction History"]
        DB5["messages<br/>Chat History"]
        DB6["audit_logs<br/>Compliance Tracking"]
    end
   
    %% ========== EXTERNAL SERVICES ==========
    subgraph External["External Services"]
        direction TB
        E1["Razorpay<br/>Payment Gateway"]
        E2["Jitsi Meet<br/>Video Conferencing"]
        E3["Supabase Auth<br/>Identity Management"]
        E4["GitHub Copilot<br/>AI Pair Programmer"]
    end
   
    %% ========== SECURITY LAYER ==========
    subgraph Security["Security Layer"]
        direction LR
        S1["TLS/HTTPS<br/>Data in Transit"]
        S2["RLS Policies<br/>Data at Rest"]
        S3["HMAC Verification<br/>Webhook Security"]
        S4["bcrypt<br/>Password Hashing"]
    end
   
    %% ========== DEPLOYMENT ==========
    subgraph Deployment["Deployment & DevOps"]
        direction TB
        D1["Docker Container<br/>Portable Environment"]
        D2["GitHub Actions<br/>CI/CD Pipeline"]
        D3["Vercel/Cloud<br/>Hosting Platform"]
        D4["Environment Variables<br/>Configuration"]
    end
   
    %% ========== TESTING PYRAMID ==========
    subgraph Testing["Testing Pyramid (85%+ Coverage)"]
        direction TB
        T1["Unit Tests<br/>70% - Pure Functions"]
        T2["Integration Tests<br/>20% - API + DB"]
        T3["E2E Tests<br/>10% - User Journeys"]
    end
   
    %% ========== CONNECTIONS ==========
    Users --> Frontend
    Frontend --> Backend
    Backend --> Database
    Backend --> External
    Backend --> Security
    Backend -.-> Deployment
    Backend -.-> Testing
   
    %% ========== DATA FLOWS ==========
    linkStyle 10 stroke:#00a86b,stroke-width:2px
    linkStyle 11 stroke:#00a86b,stroke-width:2px
    linkStyle 12 stroke:#00a86b,stroke-width:2px
    linkStyle 13 stroke:#00a86b,stroke-width:2px
    linkStyle 14 stroke:#00a86b,stroke-width:2px
   
    %% ========== TENANT ISOLATION ==========
    subgraph Tenants["Multi-Tenant Architecture"]
        direction LR
        Tenant1["Tenant 1: TalentHub<br/>tenant1.localhost"]
        Tenant2["Tenant 2: TechStaff<br/>tenant2.localhost"]
        TenantN["Tenant N: New Agency<br/>tenantN.localhost"]
    end
   
    Database --> Tenants
   
    %% ========== ANNOTATIONS ==========
    note1["🏢 Each tenant has isolated data<br/>but shared codebase"]
    note2["🔒 RLS ensures Tenant A cannot<br/>access Tenant B's data"]
    note3["🤖 AI annotations guide<br/>future AI agents safely"]
    note4["📱 Mobile-first responsive design<br/>with desktop admin panel"]
   
    Tenants -.- note1
    Database -.- note2
    Backend -.- note3
    Frontend -.- note4
   
    %% ========== STYLING ==========
    classDef user fill:#e1f5fe,stroke:#0288d1,stroke-width:2px
    classDef frontend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef backend fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef database fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef external fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef security fill:#e0f2f1,stroke:#00796b,stroke-width:2px
    classDef deployment fill:#f5f5f5,stroke:#616161,stroke-width:2px
    classDef testing fill:#fff8e1,stroke:#ff8f00,stroke-width:2px
    classDef tenants fill:#e8eaf6,stroke:#303f9f,stroke-width:2px
    classDef notes fill:#fffde7,stroke:#fbc02d,stroke-width:1px
   
    class U1,U2,U3 user
    class Frontend,frontend
    class Backend,backend
    class Database,database
    class External,external
    class Security,security
    class Deployment,deployment
    class Testing,testing
    class Tenants,tenants
    class note1,note2,note3,note4 notes
```
 
---
 
HR Manpower Consultant Use‑Case Story
"From Excel Hell to Agency Rocket Ship"
 
Scene 1: The Problem (Week 0)
Ravi runs "TalentHub Solutions" – a manpower consultancy placing engineers in Chennai IT firms.
 
Current workflow:
Client call → WhatsApp → Excel sheet → Manual UPI → Forgotten follow‑up
 
Problems:
30 placement leads/week, 70% lost (no system)
Engineers assigned to wrong clients (no skills matching)
No client portal ("When is my engineer joining?")
Payments scattered (3 clients → 3 bank accounts)
Ravi works 14h/day coordinating
 
Monthly revenue: ₹1.2L (15 placements × ₹8K fee)
Dream: ₹10L/month, automated matching, client self‑service.
 
Scene 2: Failed Attempts (Week 1–4)
1. Google Forms → No chat, no payments
2. Freelancer.com → No white‑label branding
3. Custom Laravel → ₹80K, broke after 50 users
Lost opportunity: 120 placements × ₹8K = ₹9.6L
 
Scene 3: Bootcamp Solution (Day 1)
Students build TalentHub's multi‑tenant platform:
 
Tenant 1: TalentHub Solutions (Ravi's agency)
├── Clients self‑register → post requirements
├── Engineer pool (skills, availability)
├── Auto‑matching → private video interviews (Jitsi)
├── Razorpay invoicing → instant payment
├── Admin dashboard: revenue ₹1.2L → placements 15
 
Tenant 2: TechStaff Co (Chennai competitor)  
├── Same platform, isolated data
├── Their branding, their engineers, their clients
 
Live demo:
1. New client "ABC Corp" registers → posts "10 React devs"
2. Matches 3 engineers → schedules Jitsi interviews
3. Ravi approves → Razorpay invoice → payment complete
4. admin.talenthub.localhost → sees ₹80K revenue
5. techstaff.localhost → completely isolated
 
Scene 4: Production Reality (Month 3)
✅ 120 leads/month → 85 placements (70% conversion)
✅ Revenue: ₹6.8L/month (was ₹1.2L)
✅ Ravi hires 2 recruiters (was solo)
✅ Clients self‑serve (no daily calls)
✅ Competitors also onboard as tenants
Growth: 5.6x revenue in 90 days.
 
Scene 5: The Platform Scales
5 agencies now use the platform:
 
TalentHub (Chennai IT)
StaffEasy (Coimbatore manufacturing)
EduStaff (engineering college placements)
HealthForce (nursing agencies)
GigHub (freelance marketplace)
 
Each gets:
✅ Their subdomain (talenthub.localhost/app)
✅ Isolated engineers, clients, payments
✅ Shared codebase (you maintain once)
✅ 70% margins (SaaS model)
 
🎯 Why Perfect for Tamil Nadu
1. **Real market**: Manpower agencies = 5000+ SMEs in Tamil Nadu
2. **Identical problems**: WhatsApp → Excel → lost revenue
3. **Identical solution**: Multi‑tenant matching + payments + video
4. **Your expertise**: i45G consulting → perfect domain fit
5. **Scalable**: 5 agencies → 50 → 500 (₹50Cr opportunity)
 
Closing pitch:
"Ravi went from ₹1.2L to ₹6.8L in 90 days.
You just built his platform.
Now imagine serving 5000 agencies..."
 
---
 
## 🚀 Bootcamp Kickoff (First 15 Minutes)
 
**Pre-requisites** (students arrive with these installed):
- Node.js 18+ (`node --version`)
- Docker Desktop running
- Git Bash (Windows) or Terminal (Mac/Linux)
- VS Code + GitHub Copilot extension
- Supabase account (free tier)
- Razorpay account (test mode)
 
### Environment Setup Checklist
```bash
# 1. Create project
npx create-next-app@latest st-bc-d1 --typescript --tailwind --eslint --app --src-dir=false
cd st-bc-d1
 
# 2. Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install razorpay zod
npm install -D jest @testing-library/react playwright
 
# 3. Create .env.local (copy from .env.example)
cp .env.example .env.local
 
# 4. Verify setup
npm run dev
# Open http://localhost:3000 - should see Next.js welcome page
```
 
### `.env.example` (commit this, NOT `.env.local`)
```env
# Supabase (get from: supabase.com/dashboard → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 
# Razorpay (get from: dashboard.razorpay.com → Settings → API Keys)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-secret-key
 
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
 
---
 
## 📊 Database Schema
 
### Core Tables
```sql
-- Tenants (organizations using the platform)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,  -- e.g., 'talenthub', 'techstaff'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
 
-- Users (belong to one tenant)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'provider', 'subscriber')) DEFAULT 'subscriber',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, email)
);
 
-- Products (per tenant)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,  -- in paise (₹100 = 10000)
  created_at TIMESTAMPTZ DEFAULT now()
);
 
-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  total INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
 
-- Chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  room_id TEXT NOT NULL,  -- format: tenant_id:user1_id:user2_id
  sender_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
 
-- Audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
 
### RLS Policies (CRITICAL)
```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
 
-- Example policy (repeat for each table)
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = auth.jwt() ->> 'tenant_id');
```
 
### Seed Data (2 Demo Tenants)
```sql
INSERT INTO tenants (name, slug) VALUES
  ('TalentHub Solutions', 'talenthub'),
  ('TechStaff Co', 'techstaff');
 
-- Add 3 products per tenant
INSERT INTO products (tenant_id, name, price) VALUES
  ((SELECT id FROM tenants WHERE slug = 'talenthub'), 'React Developer Placement', 800000),
  ((SELECT id FROM tenants WHERE slug = 'talenthub'), 'Node.js Developer Placement', 750000),
  ((SELECT id FROM tenants WHERE slug = 'talenthub'), 'Full Stack Developer Placement', 900000),
  ((SELECT id FROM tenants WHERE slug = 'techstaff'), 'Junior Developer Placement', 500000),
  ((SELECT id FROM tenants WHERE slug = 'techstaff'), 'Senior Developer Placement', 1000000),
  ((SELECT id FROM tenants WHERE slug = 'techstaff'), 'Tech Lead Placement', 1500000);
```
 
---
 
## 👥 Role Definitions
 
| Role | Access | Can Do |
|------|--------|--------|
| **admin** | Full tenant access | Manage users, view all orders, access chat logs, revenue dashboard |
| **provider** | Service provider | List services, respond to chats, view own orders |
| **subscriber** | End customer | Browse products, place orders, initiate chat |
 
---
 
## 🔧 Troubleshooting Guide
 
| Problem | Cause | Solution |
|---------|-------|----------|
| `npm run dev` fails | Missing dependencies | Run `npm install` again |
| Supabase connection error | Wrong env vars | Check `NEXT_PUBLIC_SUPABASE_URL` and key |
| RLS blocks all queries | Missing tenant context | Ensure JWT includes `tenant_id` claim |
| Razorpay "invalid key" | Test mode mismatch | Use `rzp_test_*` keys, not live |
| Docker won't start | Port conflict | Stop other services on port 5432 |
| Git merge conflicts | Parallel edits | Use `git stash`, pull, then `git stash pop` |
 
---
 
## 📋 Instructor Sync Points
 
| Time | Checkpoint | What to Verify |
|------|------------|----------------|
| **0:15** | Environment ready | All 17 pairs: `npm run dev` shows Next.js page |
| **1:00** | Supabase connected | Database tables created, seed data visible |
| **2:00** | Auth working | Demo: Login → tenant selection → dashboard |
| **2:15** | **SYNC**: Track A + B align on schema | Quick standup: any blockers? |
| **4:00** | Marketplace + payments | Demo: Add to cart → Razorpay checkout → order confirmation |
| **4:15** | **SYNC**: Integration check | Pairs merge auth + marketplace branches |
| **6:00** | Chat + video | Demo: Send message → see realtime → open Jitsi |
| **6:15** | **SYNC**: Feature complete | All core features working individually |
| **8:00** | Admin panel + security | Demo: Switch tenants → view orders → E2E tests pass |
| **8:15** | **SYNC**: Feature freeze | No new features, only bug fixes |
| **9:00** | Integration complete | Full test suite passes, all branches merged |
| **10:00** | Demo ready | Each pair can demo the complete flow |
 
---
 
Lets Begin:
 
1. Authentication & Multi‑tenancy (CORE)
• Supabase Auth (email/password + social)
• Path-based routing: localhost:3000/app (mobile), localhost:3000/admin (desktop)
• Tenant selection via login (no subdomain complexity)
• RLS policies: Tenant A data completely isolated from Tenant B
• 2 demo tenants pre‑seeded
 
**✅ Definition of Done:**
- [ ] User can register with email/password
- [ ] User can login and see tenant selection (if multi-tenant)
- [ ] Login persists across page refresh (session works)
- [ ] Tenant A user cannot see Tenant B data (RLS verified)
- [ ] 3 unit tests pass for `isTenantAuthorized()`
 
2. B2C Marketplace (CORE)
• User registration → subscriber role
• Product listing (3 fake products per tenant)
• Cart → Razorpay checkout (test mode)
• Order confirmation page
 
**✅ Definition of Done:**
- [ ] Products page shows 3 products for current tenant
- [ ] "Add to Cart" updates cart state
- [ ] Cart page shows items with total
- [ ] Razorpay checkout opens (test mode)
- [ ] Order confirmation shows after payment
- [ ] 3 unit tests pass for `calculateTotal()`
 
3. Private Chat (CORE)
• Tenant‑scoped chat rooms (1‑to‑1 client‑provider)
• Supabase realtime for messages
• File upload (max 5MB, images only)
• Jitsi iframe for video (room auto‑generated per chat)
 
**✅ Definition of Done:**
- [ ] User can start chat with provider
- [ ] Messages appear in realtime (no refresh needed)
- [ ] Image upload works (< 5MB)
- [ ] "Start Video" button opens Jitsi room
- [ ] Chat history persists across sessions
- [ ] 2 unit tests pass for `generateJitsiRoomId()`
 
4. Admin Panel (localhost:3000/admin)
• Switch between tenants
• View orders, users, chat logs
• Revenue dashboard (fake numbers)
• Basic tenant management (suspend tenant)
 
**✅ Definition of Done:**
- [ ] Admin can switch between tenants
- [ ] Orders list shows all tenant orders
- [ ] Users list shows tenant users with roles
- [ ] Revenue dashboard shows fake metrics
- [ ] "Suspend tenant" button toggles `is_active`
- [ ] E2E test: admin flow passes
 
5. Security (BOTH TRANSIT + REST)
Data in Transit:
• HTTPS redirect (Next.js middleware)
• Secure cookies (NextAuth defaults)
• Razorpay webhook HMAC verification ✅
 
Data at Rest:
• Supabase RLS ✅
• bcrypt passwords ✅
• Audit log table (who did what) ✅
 
6. UI/UX
✅ app.localhost: Mobile bottom nav (Home, Orders, Chat, Profile)
✅ admin.localhost: Desktop collapsable sidebars on left and right
✅ Dark/light theme toggle
✅ Responsive (works on phone + desktop)
 
7. Documentation
✅ app.localhost: inline [?] icons with tooltips
✅ admin.localhost: documentation in right sidebar
✅ Coding Agent must generated annotations along with code. They are NOT overhead—they're safety guarantees that force future AI agents to understand business context before making changes.
 
✅ Annotation Tags Defined
@feature      Link code to user-facing features // @feature admin:user-management
@aiNote         Explicit guidance for AI on what/how to safely modify // @aiNote This function enforces RLS tenant isolation. Only modify if also updating database RLS policies.
@businessRule Business logic that requires stakeholder approval to change // @businessRule Partnership revenue split: 30% vendor A, 70% vendor B
@dpdp         India DPDP Act compliance enforcement // @dpdp Rule 10: Child data protection - parental consent required for users < 18
@compliance     Other regulations (HIPAA, GDPR) // @compliance HIPAA: Patient health records require encryption
@deprecated Code scheduled for removal  // @deprecated Remove after v2 API sunset (ETA: Jan 2027)
@aiNote         Patterns (Most Important for AI Safety)
 
✅ Pattern When to Use Example
 
Constraint & Consequence  
    Explain what breaks if changed  // @aiNote Tenant ID must be validated before any query. Removing this check causes permission denied errors.
 
Coordination Requirements
    List files that must change together  // @aiNote If you change the permissions matrix schema, also update: PermissionMatrix.tsx, permissions API, RBAC tests.
 
Import Path Warnings  
    Prevent stub usage  // @aiNote Import from '/lib/rbac/' (not '/lib/middleware/'). Middleware has stubs for testing only.
 
External Dependency Warnings  
    Note API/test dependencies  // @aiNote This function calls the Razorpay API. Changing signature affects payment processing tests.
 
Data Sensitivity  
    Flag compliance-sensitive code  // @aiNote This component displays health/personal data. All changes must maintain DPDP compliance.
 
✅ Annotation Density Rules
Code Area             Coverage  Rationale
Admin Components      100%      Full annotation required
Mobile Components     ~50%      Only @feature + @dpdp (simpler UX)
Library Code (/lib/)  100%      Runs everywhere, high risk
Test Files               ~0%      Tests ARE documentation
 
✅ Key Decisions Captured
All exported components MUST have @feature tag (ESLint rule planned)
@aiNote REQUIRED if function modifies RLS/permissions (lint rule planned)
@dpdp tags MUST link to migration files (CI check planned)
Mobile gets 50% coverage - rationale: Mobile UX is simple/intuitive, help system optional
Test files need NO annotations - exception: edge case documentation
Annotations sync to markdown help docs (future automation)
 
8. Design‑for‑Test Philosophy
 
Every feature has tests.
Coverage target: 85%+
 
Test Pyramid Implemented:
Unit (70%) → Integration (20%) → E2E (10%)
 
### 🎯 Core Principles
Pure functions first → trivial unit tests
└── Input → Output (no side effects)
 
Extract before you test
└── Don't test 200‑line components
└── Extract 5x10‑line pure functions
 
Mock external dependencies
└── Supabase? Mock the client ✅
└── Razorpay? Mock webhook ✅
└── Jitsi? Mock iframe ✅
 
E2E tests tell user stories
└── One test = one complete journey
 
### 📊 Test Coverage Breakdown
 
Files: 45 total
✅ Unit Tests: 95/110 passing (86%)
✅ Integration: 18/20 passing (90%)
✅ E2E (Playwright): 8/10 passing (80%)
✅ Total Coverage: 85%+
 
**Run tests:**
```bash
npm test                # Unit + integration
npx playwright test     # E2E
npm run coverage        # Coverage report
```
 
🧪 Live Test Examples
Block 1: Auth + RLS
├── `isTenantAuthorized(tenantId, user)` → 3 unit tests
├── `TenantGuard` component → renders "Access Denied"
└── E2E: tenant1 sees data, tenant2 gets 403
 
Block 2: Marketplace
├── `calculateTotal(items)` → exact match test
├── `formatRazorpayOrder()` → schema validation
└── E2E: add item → cart → checkout → confirmation
 
Block 3: Chat
├── `generateJitsiRoomId(tenant, chatId)` → predictable
├── File upload validators → 3 pure functions
└── E2E: message → realtime → Jitsi opens
 
9. 🛠️ Exact tech stack (battle‑tested)
Frontend: Next.js 15 (app router)
Auth/DB: Supabase (Auth + Postgres + RLS + Realtime)
Payments: Razorpay (test mode)
Chat: Supabase Realtime + Jitsi iframe
Validation: Zod
Styling: Tailwind + shadcn/ui
Tests: Jest + React Testing Library + Playwright
Deployment: Docker (single container)
 
10. 📊 Implementation Breakdown (10h — Parallel Execution)
 
**Strategy**: 17 pairs work in parallel tracks, then integrate. AI coding assistants accelerate each pair.
 
| Time | Track A (9 pairs) | Track B (8 pairs) |
|------|-------------------|-------------------|
| **Hour 1–2** | Auth + Supabase + RLS + tenant routing | Database schema + seed data + RLS policies |
| **Hour 3–4** | Marketplace UI + cart + orders | Razorpay integration + webhook + tests |
| **Hour 5–6** | Chat UI + Supabase Realtime | Jitsi integration + file upload |
| **Hour 7–8** | Admin panel + tenant switching | Security hardening + E2E tests |
| **Hour 9** | **Integration**: Merge Track A + B, resolve conflicts, run full test suite |
| **Hour 10** | Docker deploy + demo prep + "what's next" roadmap |
 
**Sync Points** (15 min each):
- After Hour 2: Auth working, both tracks aligned on tenant schema
- After Hour 4: Marketplace + payments integrated
- After Hour 6: Chat + video working end-to-end
- After Hour 8: Full feature freeze, focus on tests + polish
 
**Why This Works**:
- Pairs with AI assistants move 2–3x faster than solo devs
- Track A = UI/UX focus, Track B = backend/integration focus
- Integration hour (9) catches conflicts early
- Final hour = everyone deploys the same working product
 
11. Items Omitted from Bootcamp Demo (Required for Real Production)
Here's the complete gap analysis – what you deliberately cut for the 10h demo vs what's mandatory for production. Perfect for a "what's next" slide.
 
❌ Compliance & Legal (High Risk)
1. Full DPDP Compliance
   ├── Consent management UI + database
   ├── 72‑hour breach notification workflows
   ├── 30‑day automated data erasure (cron + event triggers)
   ├── Data Subject Rights (DSAR) portal (access, correction, deletion)
   └── Child protection (KYC/age verification + parental consent)
 
2. GDPR/CCPA (if international)
   ├── Cookie consent banner
   ├── Data export APIs
   └── Privacy policy generator
 
❌ Scale & Performance (Medium Risk)text
1. Multi‑tenancy at Scale
   ├── 100+ concurrent tenants (Supabase Pro tier)
   ├── Tenant onboarding automation
   ├── Rate limiting per tenant
   └── Tenant‑specific custom domains/SSL
 
2. Payments Production
   ├── Daily automated payouts (cron + Razorpay Payouts API)
   ├── Multi‑vendor revenue splits (accounting logic)
   ├── Failed payment retry logic
   └── Refund workflows
 
❌ Operational Reliability (High Risk)
1. Monitoring & Observability
   ├── Error tracking (Sentry)
   ├── Performance monitoring (New Relic/Datadog)
   ├── Uptime monitoring + alerts (UptimeRobot)
   └── Centralized logging (structured JSON to ELK/LogRocket)
 
2. Infrastructure
   ├── Multi‑region database replication
   ├── CDN for static assets
   ├── Load balancer + auto‑scaling
   └── Disaster recovery (backups + restore)
 
❌ Advanced Security (Medium Risk)
1. Data Protection
   ├── Field‑level encryption (AES‑GCM for PII)
   ├── Database encryption at rest (Supabase Enterprise)
   ├── WAF (Cloudflare/AWS WAF)
   └── Regular pen‑testing + vulnerability scans
 
2. Session & Access
   ├── IP allowlisting
   ├── 2FA/MFA
   ├── Session revocation APIs
   └── Brute force protection
 
❌ Business Features (Low Risk)
1. Workforce Management
   ├── Capacity planning + auto‑assignment algorithms
   ├── Provider ratings + matching
   ├── Shift scheduling
   └── Availability calendar
 
2.  Analytics & Reporting
    ├── Real‑time dashboards (Metabase/Grafana)
    ├── Revenue reporting per tenant
    ├── User behaviour analytics
    └── Export to CSV/PDF
 
🎯 Bootcamp & These Gaps
"Today you built the CORE ENGINE (5% vertical slice). Production = Core Engine + these 20 wrappers around it.
Each wrapper is a 10‑20h project you can tackle post‑bootcamp."
 
📊 Implementation Priority Matrix
HIGH PRIORITY (do next week):
├── Consent tracking schema ✅
├── Error tracking (Sentry) ✅
└── Rate limiting ✅
 
MEDIUM PRIORITY (do next month):
├── Payout cron job ✅
├── Multi‑region setup ✅
└── 2FA ✅
 
LOW PRIORITY (do when revenue justifies):
├── KYC integration
├── WAF
└── Pen‑testing
Executive Summary: Systems Thinking Bootcamp – Day 1 for engineering students in their 3rd year all belonging to school of computing branches.
 
Purpose
10‑hour intensive builds a production‑ready multi‑tenant SaaS vertical slice that solves real SME problems while teaching 8 core CS foundations: Digital Systems, Architecture, Networks, OS, DS, OOPS, AI/ML, Security.
 
**Format**: 34 students in 17 pairs (pair programming) — each pair equipped with GitHub Copilot or equivalent AI coding assistant.
 
**Key Insight**: This isn't just a website - it's a complete **software system** that mirrors what you learn in 8 semesters:
- **Digital Design** → UI Components
- **Computer Architecture** → Database schema
- **Operating Systems** → Process isolation (tenants)
- **Networks** → API calls + WebSockets
- **Data Structures** → Efficient queries
- **OOPS** → Component reusability
- **AI/ML** → Smart matching + AI assistance
- **Security** → Multi-layered protection
 
Now let's build it step by step...
 
The Problem Solved
Tamil Nadu SMEs (doctors, lawyers, civil engineers, electrical and plumbing technicians, manpower agencies) lose 70% leads trapped in WhatsApp→Excel chaos. No secure client portals, no payments, no video consults, no scale.
 
The Solution Delivered
Students ship a 100% working multi‑tenant marketplace with:
✅ Multi‑tenancy + RLS (tenant1.localhost vs tenant2.localhost)
✅ Razorpay payments + HMAC security
✅ Private chat + Jitsi video
✅ Admin dashboards (revenue, orders, tenant mgmt)
✅ 85%+ test coverage (unit + E2E)
✅ Docker deployment
 
Technical Excellence
Next.js 15 + Supabase RLS + Razorpay + Jitsi
Mobile app.localhost ↔ Desktop admin.localhost
Dark mode + responsive + AI‑safe annotations
85%+ test coverage (140+ passing tests)
Production security (TLS + bcrypt + audit logs)
 
Business Impact
Before: ₹1.2L/month (15 placements, 70% lead loss)
After: ₹6.8L/month (85 placements, 70% conversion)
5.6x revenue growth demonstrated live.
 
Learning Outcomes
Students master systems thinking: how Digital Design → OS → Networks → APIs → UI → Security → Tests form a shippable product. They leave with GitHub portfolio code ready for production.
 
Day 2 Preview
AGV (IoT+Edge+AI) extends same architecture to hardware, showing students can solve software AND hardware SME problems.
 
"From WhatsApp hell to ₹6.8L/month in 10 hours.
This is what systems thinking builds."
 
---
 
## 🏗️ Platform Architecture
 
```mermaid
---
title: TalentHub Platform Architecture - Systems Thinking Bootcamp
---
flowchart TD
    %% ========== USERS ==========
    subgraph Users
        direction LR
        U1[Subscriber<br/>Client]
        U2[Provider<br/>Service Provider]
        U3[Admin<br/>Tenant Owner]
    end
   
    %% ========== FRONTEND TIER ==========
    subgraph Frontend["Frontend Tier (Next.js 15)"]
        direction TB
        F1["App Router<br/>app.localhost:3000"]
        F2["Admin Router<br/>admin.localhost:3000"]
        F3["Middleware<br/>Auth + Tenant Routing"]
       
        F1 --> F4["Mobile UI<br/>Bottom Navigation"]
        F2 --> F5["Desktop UI<br/>Collapsible Sidebars"]
       
        F6["UI Components<br/>shadcn/ui + Tailwind"]
        F7["Theme System<br/>Dark/Light Mode"]
    end
   
    %% ========== BACKEND TIER ==========
    subgraph Backend["Backend Tier (Supabase + Next.js API)"]
        direction TB
        B1["Auth & Session<br/>Email + JWT"]
        B2["API Routes<br/>REST Endpoints"]
        B3["Server Actions<br/>Form Handling"]
       
        B4["Row Level Security<br/>Tenant Isolation"]
        B5["Realtime<br/>WebSocket Connections"]
        B6["Edge Functions<br/>Serverless Logic"]
    end
   
    %% ========== DATABASE TIER ==========
    subgraph Database["Database Tier (PostgreSQL)"]
        direction LR
        DB1["tenants<br/>Multi-tenant Isolation"]
        DB2["users<br/>Role-based Access"]
        DB3["products<br/>Service Listings"]
        DB4["orders<br/>Transaction History"]
        DB5["messages<br/>Chat History"]
        DB6["audit_logs<br/>Compliance Tracking"]
    end
   
    %% ========== EXTERNAL SERVICES ==========
    subgraph External["External Services"]
        direction TB
        E1["Razorpay<br/>Payment Gateway"]
        E2["Jitsi Meet<br/>Video Conferencing"]
        E3["Supabase Auth<br/>Identity Management"]
        E4["GitHub Copilot<br/>AI Pair Programmer"]
    end
   
    %% ========== SECURITY LAYER ==========
    subgraph Security["Security Layer"]
        direction LR
        S1["TLS/HTTPS<br/>Data in Transit"]
        S2["RLS Policies<br/>Data at Rest"]
        S3["HMAC Verification<br/>Webhook Security"]
        S4["bcrypt<br/>Password Hashing"]
    end
   
    %% ========== DEPLOYMENT ==========
    subgraph Deployment["Deployment & DevOps"]
        direction TB
        D1["Docker Container<br/>Portable Environment"]
        D2["GitHub Actions<br/>CI/CD Pipeline"]
        D3["Vercel/Cloud<br/>Hosting Platform"]
        D4["Environment Variables<br/>Configuration"]
    end
   
    %% ========== TESTING PYRAMID ==========
    subgraph Testing["Testing Pyramid (85%+ Coverage)"]
        direction TB
        T1["Unit Tests<br/>70% - Pure Functions"]
        T2["Integration Tests<br/>20% - API + DB"]
        T3["E2E Tests<br/>10% - User Journeys"]
    end
   
    %% ========== CONNECTIONS ==========
    Users --> Frontend
    Frontend --> Backend
    Backend --> Database
    Backend --> External
    Backend --> Security
    Backend -.-> Deployment
    Backend -.-> Testing
   
    %% ========== DATA FLOWS ==========
    linkStyle 10 stroke:#00a86b,stroke-width:2px
    linkStyle 11 stroke:#00a86b,stroke-width:2px
    linkStyle 12 stroke:#00a86b,stroke-width:2px
    linkStyle 13 stroke:#00a86b,stroke-width:2px
    linkStyle 14 stroke:#00a86b,stroke-width:2px
   
    %% ========== TENANT ISOLATION ==========
    subgraph Tenants["Multi-Tenant Architecture"]
        direction LR
        Tenant1["Tenant 1: TalentHub<br/>tenant1.localhost"]
        Tenant2["Tenant 2: TechStaff<br/>tenant2.localhost"]
        TenantN["Tenant N: New Agency<br/>tenantN.localhost"]
    end
   
    Database --> Tenants
   
    %% ========== ANNOTATIONS ==========
    note1["🏢 Each tenant has isolated data<br/>but shared codebase"]
    note2["🔒 RLS ensures Tenant A cannot<br/>access Tenant B's data"]
    note3["🤖 AI annotations guide<br/>future AI agents safely"]
    note4["📱 Mobile-first responsive design<br/>with desktop admin panel"]
   
    Tenants -.- note1
    Database -.- note2
    Backend -.- note3
    Frontend -.- note4
   
    %% ========== STYLING ==========
    classDef user fill:#e1f5fe,stroke:#0288d1,stroke-width:2px
    classDef frontend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef backend fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef database fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef external fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef security fill:#e0f2f1,stroke:#00796b,stroke-width:2px
    classDef deployment fill:#f5f5f5,stroke:#616161,stroke-width:2px
    classDef testing fill:#fff8e1,stroke:#ff8f00,stroke-width:2px
    classDef tenants fill:#e8eaf6,stroke:#303f9f,stroke-width:2px
    classDef notes fill:#fffde7,stroke:#fbc02d,stroke-width:1px
   
    class U1,U2,U3 user
    class Frontend,frontend
    class Backend,backend
    class Database,database
    class External,external
    class Security,security
    class Deployment,deployment
    class Testing,testing
    class Tenants,tenants
    class note1,note2,note3,note4 notes
```
 
---
 
HR Manpower Consultant Use‑Case Story
"From Excel Hell to Agency Rocket Ship"
 
Scene 1: The Problem (Week 0)
Ravi runs "TalentHub Solutions" – a manpower consultancy placing engineers in Chennai IT firms.
 
Current workflow:
Client call → WhatsApp → Excel sheet → Manual UPI → Forgotten follow‑up
 
Problems:
30 placement leads/week, 70% lost (no system)
Engineers assigned to wrong clients (no skills matching)
No client portal ("When is my engineer joining?")
Payments scattered (3 clients → 3 bank accounts)
Ravi works 14h/day coordinating
 
Monthly revenue: ₹1.2L (15 placements × ₹8K fee)
Dream: ₹10L/month, automated matching, client self‑service.
 
Scene 2: Failed Attempts (Week 1–4)
1. Google Forms → No chat, no payments
2. Freelancer.com → No white‑label branding
3. Custom Laravel → ₹80K, broke after 50 users
Lost opportunity: 120 placements × ₹8K = ₹9.6L
 
Scene 3: Bootcamp Solution (Day 1)
Students build TalentHub's multi‑tenant platform:
 
Tenant 1: TalentHub Solutions (Ravi's agency)
├── Clients self‑register → post requirements
├── Engineer pool (skills, availability)
├── Auto‑matching → private video interviews (Jitsi)
├── Razorpay invoicing → instant payment
├── Admin dashboard: revenue ₹1.2L → placements 15
 
Tenant 2: TechStaff Co (Chennai competitor)  
├── Same platform, isolated data
├── Their branding, their engineers, their clients
 
Live demo:
1. New client "ABC Corp" registers → posts "10 React devs"
2. Matches 3 engineers → schedules Jitsi interviews
3. Ravi approves → Razorpay invoice → payment complete
4. admin.talenthub.localhost → sees ₹80K revenue
5. techstaff.localhost → completely isolated
 
Scene 4: Production Reality (Month 3)
✅ 120 leads/month → 85 placements (70% conversion)
✅ Revenue: ₹6.8L/month (was ₹1.2L)
✅ Ravi hires 2 recruiters (was solo)
✅ Clients self‑serve (no daily calls)
✅ Competitors also onboard as tenants
Growth: 5.6x revenue in 90 days.
 
Scene 5: The Platform Scales
5 agencies now use the platform:
 
TalentHub (Chennai IT)
StaffEasy (Coimbatore manufacturing)
EduStaff (engineering college placements)
HealthForce (nursing agencies)
GigHub (freelance marketplace)
 
Each gets:
✅ Their subdomain (talenthub.localhost/app)
✅ Isolated engineers, clients, payments
✅ Shared codebase (you maintain once)
✅ 70% margins (SaaS model)
 
🎯 Why Perfect for Tamil Nadu
1. **Real market**: Manpower agencies = 5000+ SMEs in Tamil Nadu
2. **Identical problems**: WhatsApp → Excel → lost revenue
3. **Identical solution**: Multi‑tenant matching + payments + video
4. **Your expertise**: i45G consulting → perfect domain fit
5. **Scalable**: 5 agencies → 50 → 500 (₹50Cr opportunity)
 
Closing pitch:
"Ravi went from ₹1.2L to ₹6.8L in 90 days.
You just built his platform.
Now imagine serving 5000 agencies..."
 
---
 
## 🚀 Bootcamp Kickoff (First 15 Minutes)
 
**Pre-requisites** (students arrive with these installed):
- Node.js 18+ (`node --version`)
- Docker Desktop running
- Git Bash (Windows) or Terminal (Mac/Linux)
- VS Code + GitHub Copilot extension
- Supabase account (free tier)
- Razorpay account (test mode)
 
### Environment Setup Checklist
```bash
# 1. Create project
npx create-next-app@latest st-bc-d1 --typescript --tailwind --eslint --app --src-dir=false
cd st-bc-d1
 
# 2. Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install razorpay zod
npm install -D jest @testing-library/react playwright
 
# 3. Create .env.local (copy from .env.example)
cp .env.example .env.local
 
# 4. Verify setup
npm run dev
# Open http://localhost:3000 - should see Next.js welcome page
```
 
### `.env.example` (commit this, NOT `.env.local`)
```env
# Supabase (get from: supabase.com/dashboard → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 
# Razorpay (get from: dashboard.razorpay.com → Settings → API Keys)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-secret-key
 
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
 
---
 
## 📊 Database Schema
 
### Core Tables
```sql
-- Tenants (organizations using the platform)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,  -- e.g., 'talenthub', 'techstaff'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
 
-- Users (belong to one tenant)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'provider', 'subscriber')) DEFAULT 'subscriber',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, email)
);
 
-- Products (per tenant)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,  -- in paise (₹100 = 10000)
  created_at TIMESTAMPTZ DEFAULT now()
);
 
-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  total INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
 
-- Chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  room_id TEXT NOT NULL,  -- format: tenant_id:user1_id:user2_id
  sender_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
 
-- Audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
 
### RLS Policies (CRITICAL)
```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
 
-- Example policy (repeat for each table)
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = auth.jwt() ->> 'tenant_id');
```
 
### Seed Data (2 Demo Tenants)
```sql
INSERT INTO tenants (name, slug) VALUES
  ('TalentHub Solutions', 'talenthub'),
  ('TechStaff Co', 'techstaff');
 
-- Add 3 products per tenant
INSERT INTO products (tenant_id, name, price) VALUES
  ((SELECT id FROM tenants WHERE slug = 'talenthub'), 'React Developer Placement', 800000),
  ((SELECT id FROM tenants WHERE slug = 'talenthub'), 'Node.js Developer Placement', 750000),
  ((SELECT id FROM tenants WHERE slug = 'talenthub'), 'Full Stack Developer Placement', 900000),
  ((SELECT id FROM tenants WHERE slug = 'techstaff'), 'Junior Developer Placement', 500000),
  ((SELECT id FROM tenants WHERE slug = 'techstaff'), 'Senior Developer Placement', 1000000),
  ((SELECT id FROM tenants WHERE slug = 'techstaff'), 'Tech Lead Placement', 1500000);
```
 
---
 
## 👥 Role Definitions
 
| Role | Access | Can Do |
|------|--------|--------|
| **admin** | Full tenant access | Manage users, view all orders, access chat logs, revenue dashboard |
| **provider** | Service provider | List services, respond to chats, view own orders |
| **subscriber** | End customer | Browse products, place orders, initiate chat |
 
---
 
## 🔧 Troubleshooting Guide
 
| Problem | Cause | Solution |
|---------|-------|----------|
| `npm run dev` fails | Missing dependencies | Run `npm install` again |
| Supabase connection error | Wrong env vars | Check `NEXT_PUBLIC_SUPABASE_URL` and key |
| RLS blocks all queries | Missing tenant context | Ensure JWT includes `tenant_id` claim |
| Razorpay "invalid key" | Test mode mismatch | Use `rzp_test_*` keys, not live |
| Docker won't start | Port conflict | Stop other services on port 5432 |
| Git merge conflicts | Parallel edits | Use `git stash`, pull, then `git stash pop` |
 
---
 
## 📋 Instructor Sync Points
 
| Time | Checkpoint | What to Verify |
|------|------------|----------------|
| **0:15** | Environment ready | All 17 pairs: `npm run dev` shows Next.js page |
| **1:00** | Supabase connected | Database tables created, seed data visible |
| **2:00** | Auth working | Demo: Login → tenant selection → dashboard |
| **2:15** | **SYNC**: Track A + B align on schema | Quick standup: any blockers? |
| **4:00** | Marketplace + payments | Demo: Add to cart → Razorpay checkout → order confirmation |
| **4:15** | **SYNC**: Integration check | Pairs merge auth + marketplace branches |
| **6:00** | Chat + video | Demo: Send message → see realtime → open Jitsi |
| **6:15** | **SYNC**: Feature complete | All core features working individually |
| **8:00** | Admin panel + security | Demo: Switch tenants → view orders → E2E tests pass |
| **8:15** | **SYNC**: Feature freeze | No new features, only bug fixes |
| **9:00** | Integration complete | Full test suite passes, all branches merged |
| **10:00** | Demo ready | Each pair can demo the complete flow |
 
---
 
Lets Begin:
 
1. Authentication & Multi‑tenancy (CORE)
• Supabase Auth (email/password + social)
• Path-based routing: localhost:3000/app (mobile), localhost:3000/admin (desktop)
• Tenant selection via login (no subdomain complexity)
• RLS policies: Tenant A data completely isolated from Tenant B
• 2 demo tenants pre‑seeded
 
**✅ Definition of Done:**
- [ ] User can register with email/password
- [ ] User can login and see tenant selection (if multi-tenant)
- [ ] Login persists across page refresh (session works)
- [ ] Tenant A user cannot see Tenant B data (RLS verified)
- [ ] 3 unit tests pass for `isTenantAuthorized()`
 
2. B2C Marketplace (CORE)
• User registration → subscriber role
• Product listing (3 fake products per tenant)
• Cart → Razorpay checkout (test mode)
• Order confirmation page
 
**✅ Definition of Done:**
- [ ] Products page shows 3 products for current tenant
- [ ] "Add to Cart" updates cart state
- [ ] Cart page shows items with total
- [ ] Razorpay checkout opens (test mode)
- [ ] Order confirmation shows after payment
- [ ] 3 unit tests pass for `calculateTotal()`
 
3. Private Chat (CORE)
• Tenant‑scoped chat rooms (1‑to‑1 client‑provider)
• Supabase realtime for messages
• File upload (max 5MB, images only)
• Jitsi iframe for video (room auto‑generated per chat)
 
**✅ Definition of Done:**
- [ ] User can start chat with provider
- [ ] Messages appear in realtime (no refresh needed)
- [ ] Image upload works (< 5MB)
- [ ] "Start Video" button opens Jitsi room
- [ ] Chat history persists across sessions
- [ ] 2 unit tests pass for `generateJitsiRoomId()`
 
4. Admin Panel (localhost:3000/admin)
• Switch between tenants
• View orders, users, chat logs
• Revenue dashboard (fake numbers)
• Basic tenant management (suspend tenant)
 
**✅ Definition of Done:**
- [ ] Admin can switch between tenants
- [ ] Orders list shows all tenant orders
- [ ] Users list shows tenant users with roles
- [ ] Revenue dashboard shows fake metrics
- [ ] "Suspend tenant" button toggles `is_active`
- [ ] E2E test: admin flow passes
 
5. Security (BOTH TRANSIT + REST)
Data in Transit:
• HTTPS redirect (Next.js middleware)
• Secure cookies (NextAuth defaults)
• Razorpay webhook HMAC verification ✅
 
Data at Rest:
• Supabase RLS ✅
• bcrypt passwords ✅
• Audit log table (who did what) ✅
 
6. UI/UX
✅ app.localhost: Mobile bottom nav (Home, Orders, Chat, Profile)
✅ admin.localhost: Desktop collapsable sidebars on left and right
✅ Dark/light theme toggle
✅ Responsive (works on phone + desktop)
 
7. Documentation
✅ app.localhost: inline [?] icons with tooltips
✅ admin.localhost: documentation in right sidebar
✅ Coding Agent must generated annotations along with code. They are NOT overhead—they're safety guarantees that force future AI agents to understand business context before making changes.
 
✅ Annotation Tags Defined
@feature      Link code to user-facing features // @feature admin:user-management
@aiNote         Explicit guidance for AI on what/how to safely modify // @aiNote This function enforces RLS tenant isolation. Only modify if also updating database RLS policies.
@businessRule Business logic that requires stakeholder approval to change // @businessRule Partnership revenue split: 30% vendor A, 70% vendor B
@dpdp         India DPDP Act compliance enforcement // @dpdp Rule 10: Child data protection - parental consent required for users < 18
@compliance     Other regulations (HIPAA, GDPR) // @compliance HIPAA: Patient health records require encryption
@deprecated Code scheduled for removal  // @deprecated Remove after v2 API sunset (ETA: Jan 2027)
@aiNote         Patterns (Most Important for AI Safety)
 
✅ Pattern When to Use Example
 
Constraint & Consequence  
    Explain what breaks if changed  // @aiNote Tenant ID must be validated before any query. Removing this check causes permission denied errors.
 
Coordination Requirements
    List files that must change together  // @aiNote If you change the permissions matrix schema, also update: PermissionMatrix.tsx, permissions API, RBAC tests.
 
Import Path Warnings  
    Prevent stub usage  // @aiNote Import from '/lib/rbac/' (not '/lib/middleware/'). Middleware has stubs for testing only.
 
External Dependency Warnings  
    Note API/test dependencies  // @aiNote This function calls the Razorpay API. Changing signature affects payment processing tests.
 
Data Sensitivity  
    Flag compliance-sensitive code  // @aiNote This component displays health/personal data. All changes must maintain DPDP compliance.
 
✅ Annotation Density Rules
Code Area             Coverage  Rationale
Admin Components      100%      Full annotation required
Mobile Components     ~50%      Only @feature + @dpdp (simpler UX)
Library Code (/lib/)  100%      Runs everywhere, high risk
Test Files               ~0%      Tests ARE documentation
 
✅ Key Decisions Captured
All exported components MUST have @feature tag (ESLint rule planned)
@aiNote REQUIRED if function modifies RLS/permissions (lint rule planned)
@dpdp tags MUST link to migration files (CI check planned)
Mobile gets 50% coverage - rationale: Mobile UX is simple/intuitive, help system optional
Test files need NO annotations - exception: edge case documentation
Annotations sync to markdown help docs (future automation)
 
8. Design‑for‑Test Philosophy
 
Every feature has tests.
Coverage target: 85%+
 
Test Pyramid Implemented:
Unit (70%) → Integration (20%) → E2E (10%)
 
### 🎯 Core Principles
Pure functions first → trivial unit tests
└── Input → Output (no side effects)
 
Extract before you test
└── Don't test 200‑line components
└── Extract 5x10‑line pure functions
 
Mock external dependencies
└── Supabase? Mock the client ✅
└── Razorpay? Mock webhook ✅
└── Jitsi? Mock iframe ✅
 
E2E tests tell user stories
└── One test = one complete journey
 
### 📊 Test Coverage Breakdown
 
Files: 45 total
✅ Unit Tests: 95/110 passing (86%)
✅ Integration: 18/20 passing (90%)
✅ E2E (Playwright): 8/10 passing (80%)
✅ Total Coverage: 85%+
 
**Run tests:**
```bash
npm test                # Unit + integration
npx playwright test     # E2E
npm run coverage        # Coverage report
```
 
🧪 Live Test Examples
Block 1: Auth + RLS
├── `isTenantAuthorized(tenantId, user)` → 3 unit tests
├── `TenantGuard` component → renders "Access Denied"
└── E2E: tenant1 sees data, tenant2 gets 403
 
Block 2: Marketplace
├── `calculateTotal(items)` → exact match test
├── `formatRazorpayOrder()` → schema validation
└── E2E: add item → cart → checkout → confirmation
 
Block 3: Chat
├── `generateJitsiRoomId(tenant, chatId)` → predictable
├── File upload validators → 3 pure functions
└── E2E: message → realtime → Jitsi opens
 
9. 🛠️ Exact tech stack (battle‑tested)
Frontend: Next.js 15 (app router)
Auth/DB: Supabase (Auth + Postgres + RLS + Realtime)
Payments: Razorpay (test mode)
Chat: Supabase Realtime + Jitsi iframe
Validation: Zod
Styling: Tailwind + shadcn/ui
Tests: Jest + React Testing Library + Playwright
Deployment: Docker (single container)
 
10. 📊 Implementation Breakdown (10h — Parallel Execution)
 
**Strategy**: 17 pairs work in parallel tracks, then integrate. AI coding assistants accelerate each pair.
 
| Time | Track A (9 pairs) | Track B (8 pairs) |
|------|-------------------|-------------------|
| **Hour 1–2** | Auth + Supabase + RLS + tenant routing | Database schema + seed data + RLS policies |
| **Hour 3–4** | Marketplace UI + cart + orders | Razorpay integration + webhook + tests |
| **Hour 5–6** | Chat UI + Supabase Realtime | Jitsi integration + file upload |
| **Hour 7–8** | Admin panel + tenant switching | Security hardening + E2E tests |
| **Hour 9** | **Integration**: Merge Track A + B, resolve conflicts, run full test suite |
| **Hour 10** | Docker deploy + demo prep + "what's next" roadmap |
 
**Sync Points** (15 min each):
- After Hour 2: Auth working, both tracks aligned on tenant schema
- After Hour 4: Marketplace + payments integrated
- After Hour 6: Chat + video working end-to-end
- After Hour 8: Full feature freeze, focus on tests + polish
 
**Why This Works**:
- Pairs with AI assistants move 2–3x faster than solo devs
- Track A = UI/UX focus, Track B = backend/integration focus
- Integration hour (9) catches conflicts early
- Final hour = everyone deploys the same working product
 
11. Items Omitted from Bootcamp Demo (Required for Real Production)
Here's the complete gap analysis – what you deliberately cut for the 10h demo vs what's mandatory for production. Perfect for a "what's next" slide.
 
❌ Compliance & Legal (High Risk)
1. Full DPDP Compliance
   ├── Consent management UI + database
   ├── 72‑hour breach notification workflows
   ├── 30‑day automated data erasure (cron + event triggers)
   ├── Data Subject Rights (DSAR) portal (access, correction, deletion)
   └── Child protection (KYC/age verification + parental consent)
 
2. GDPR/CCPA (if international)
   ├── Cookie consent banner
   ├── Data export APIs
   └── Privacy policy generator
 
❌ Scale & Performance (Medium Risk)text
1. Multi‑tenancy at Scale
   ├── 100+ concurrent tenants (Supabase Pro tier)
   ├── Tenant onboarding automation
   ├── Rate limiting per tenant
   └── Tenant‑specific custom domains/SSL
 
2. Payments Production
   ├── Daily automated payouts (cron + Razorpay Payouts API)
   ├── Multi‑vendor revenue splits (accounting logic)
   ├── Failed payment retry logic
   └── Refund workflows
 
❌ Operational Reliability (High Risk)
1. Monitoring & Observability
   ├── Error tracking (Sentry)
   ├── Performance monitoring (New Relic/Datadog)
   ├── Uptime monitoring + alerts (UptimeRobot)
   └── Centralized logging (structured JSON to ELK/LogRocket)
 
2. Infrastructure
   ├── Multi‑region database replication
   ├── CDN for static assets
   ├── Load balancer + auto‑scaling
   └── Disaster recovery (backups + restore)
 
❌ Advanced Security (Medium Risk)
1. Data Protection
   ├── Field‑level encryption (AES‑GCM for PII)
   ├── Database encryption at rest (Supabase Enterprise)
   ├── WAF (Cloudflare/AWS WAF)
   └── Regular pen‑testing + vulnerability scans
 
2. Session & Access
   ├── IP allowlisting
   ├── 2FA/MFA
   ├── Session revocation APIs
   └── Brute force protection
 
❌ Business Features (Low Risk)
1. Workforce Management
   ├── Capacity planning + auto‑assignment algorithms
   ├── Provider ratings + matching
   ├── Shift scheduling
   └── Availability calendar
 
2.  Analytics & Reporting
    ├── Real‑time dashboards (Metabase/Grafana)
    ├── Revenue reporting per tenant
    ├── User behaviour analytics
    └── Export to CSV/PDF
 
🎯 Bootcamp & These Gaps
"Today you built the CORE ENGINE (5% vertical slice). Production = Core Engine + these 20 wrappers around it.
Each wrapper is a 10‑20h project you can tackle post‑bootcamp."
 
📊 Implementation Priority Matrix
HIGH PRIORITY (do next week):
├── Consent tracking schema ✅
├── Error tracking (Sentry) ✅
└── Rate limiting ✅
 
MEDIUM PRIORITY (do next month):
├── Payout cron job ✅
├── Multi‑region setup ✅
└── 2FA ✅
 
LOW PRIORITY (do when revenue justifies):
├── KYC integration
├── WAF
└── Pen‑testing