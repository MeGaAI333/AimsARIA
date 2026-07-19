# AIMS AI Command Center — User Manual

## Overview

AIMS AI Command Center is a unified platform for managing client relationships, AI-driven outreach, and content generation. Four specialized AI agents (ARIA, MELODY, LYRIC, MUSE) work together to automate sales recovery, closing, content creation, and reputation management.

**Current Build:** June 2026  
**Platform:** React 18 + Vite + Supabase  
**API:** Anthropic Claude Sonnet 4.6 (server-side via Edge Function)

---

## User Roles & Permissions

### **Admin**
Full system access. Manages team, configuration, and all client data.

**Can do:**
- View all contacts and conversations across all clients
- Manage team members (invite, assign roles)
- Configure onboarding wizard (AIMS staff only steps)
- Claim conversations from Work Queue
- View dashboards, KPIs, and revenue tracking
- Access all agent pages and LYRIC workstation

**Default Access:**
- Command Center (dashboard with KPIs)
- Contacts (CRM)
- Pipeline
- Conversations
- Work Queue
- Campaigns
- AI Agents (ARIA, MELODY, LYRIC, MUSE + Workstation)
- Onboarding
- Calendar
- Tasks & Notes
- Client Profiles
- Pricing
- Settings

---

### **Client**
Limited access to their own business and operations.

**Can do:**
- View their own pipeline and conversations
- Complete client onboarding (business basics, brand voice, digital presence)
- Access calendar, tasks, and notes
- View pricing
- See their business profile

**Default Access:**
- Command Center
- My Onboarding
- Pipeline
- Conversations
- Campaigns
- Calendar
- Tasks & Notes
- My Business Profile
- Pricing
- Settings

**Cannot do:**
- See other clients' data
- Access Work Queue
- Manage team members
- View AIMS-only agent configuration

---

### **LYRIC Client**
Specialized access for content generation only.

**Can do:**
- Use LYRIC Workstation (AI content generator for social media)
- View business profile
- Access settings

**Default Access:**
- LYRIC Workstation
- My Business Profile
- Settings

---

### **User**
Minimal read-only access for team members without admin privileges.

**Can do:**
- View conversations
- Access calendar and tasks
- Basic collaboration features

**Default Access:**
- Command Center
- Conversations
- Calendar
- Tasks

---

## Getting Started

### **Login**
1. Visit the Command Center URL
2. Enter email and password
3. You'll be redirected to the dashboard matching your role

### **Your First Session**
- **Command Center** shows KPIs, active pipeline, revenue recovered, and today's events
- Check **Settings** to review your role and account info
- Admins can invite team members from Settings → Invite Team Member / Client

---

## Core Features

### **1. Live Agent Chat (Conversations)**

Access real-time conversations with AI agents and clients.

**How it works:**
1. Navigate to **Conversations**
2. Select a contact from the left sidebar (or click "+ New Chat" for a new conversation)
3. Choose an agent (ARIA, MELODY, LYRIC, MUSE) from the buttons at the top
4. Type your message and hit Enter or click Send

**Agent Overview:**
- **ARIA** — Inbound recovery (reaching out to inactive customers)
- **MELODY** — Outbound closing (moving prospects through pipeline)
- **LYRIC** — Content generation (social media, email templates)
- **MUSE** — Reputation management (review responses, PR)

**Key Features:**
- Full conversation history is saved
- Switch agents mid-chat (each agent has its own thread with the contact)
- Request a human agent anytime with the "👤 Request Human Agent" button

**When you request a human agent:**
1. Conversation status changes to "Waiting for human agent"
2. Chat input is disabled (AI can no longer respond)
3. Conversation moves to the Work Queue
4. An AIMS staff member claims it and takes over
5. All previous messages remain visible to the human agent

---

### **2. Work Queue (Admin Only)**

Manage conversations that need human agent intervention.

**How it works:**
1. Navigate to **Work Queue**
2. Left sidebar lists all conversations flagged as "needs_human" or "human_active"
3. Click a conversation to open it in the right panel
4. Click **Claim** to assign it to yourself
5. Type responses in the message input at the bottom

**Workflow:**
- Once you claim a conversation, its status becomes "human_active"
- Other team members can see you're assigned to it
- Reply to the client directly in the chat thread (your messages appear with 👤 avatar)
- Full AI + human conversation history is always visible
- Click **Return to AI** to let the AI resume handling the conversation
- Click **Close** to remove it from the queue

---

### **3. Onboarding Wizard**

Split wizard based on role for gathering client information and AIMS configuration.

#### **Client Onboarding (5 Steps)**
Clients fill in what they know about their business.

1. **Business Basics** — Name, industry, website, location
2. **Your Situation** — Current challenges, goals, target audience
3. **Brand Voice** — How clients should speak about their business
4. **Digital Presence** — Social media accounts, email list size, current marketing tools
5. **Contacts & Access** — Provide contacts for integration and team access

**Status:** After submission, status becomes "Awaiting AIMS Configuration"

#### **Admin Onboarding (8 Steps)**
AIMS staff fills in everything related to what AIMS AI will do for the client.

1. **Client Info** — Review client-submitted business data (read-only)
2. **Service Setup** — Select services (sales recovery, outbound, content, reputation)
3. **Plan Tier** — Choose tier (Starter $497/mo, Pro $797/mo, Elite $1,497/mo)
4. **Agent Configuration** — Assign agent names and customize each agent's voice
5. **CRM Integration** — Connect to existing CRM or databases
6. **Technical Setup** — API keys, webhooks, data mappings
7. **Go-Live Planning** — Set launch date, training checklist
8. **Review & Confirm** — Final review before marking complete

**Status:** After submission, status becomes "Config Complete" and auto-generates tasks for each service

---

### **4. LYRIC Content Workstation**

AI-powered social media content generator.

**Create Tab:**
1. Select platform (LinkedIn, Twitter, TikTok, Instagram, Facebook)
2. Choose content type (Thought Leadership, Product Demo, Case Study, etc.)
3. Fill in details (industry, topic, tone, brand voice)
4. Click **Generate**
5. AI creates copy + auto-generates matching image
6. Edit, copy, or schedule directly to platform

**Published Tab:**
Shows all published content with engagement metrics (synced from platforms you've connected).

---

### **5. Pipeline Management**

Visual sales pipeline with contact stages and deal values.

**Stages:**
- Cold
- Contacted
- Qualified
- Negotiating
- Won
- Lost

**Features:**
- Drag-and-drop contacts between stages (if implemented)
- See deal value and stage breakdown
- Click a contact to open conversation with MELODY (closing agent)

---

### **6. Contacts (CRM)**

Central repository of all business contacts.

**View:**
- Contact name, company, industry
- Stage in pipeline
- Source (how they were acquired)
- Recent interactions
- Custom tags

**Actions:**
- Click to open in Conversations
- Add to pipeline
- Add notes
- Create tasks

---

### **7. Calendar & Tasks**

**Calendar:**
- View scheduled activities, meetings, and go-live dates
- Filter by agent or team member
- Create events tied to contacts or clients

**Tasks:**
- Track action items (auto-generated from onboarding + manual)
- Mark complete
- Assign to team members
- Filter by status or owner

---

### **8. Settings**

**Account Section:**
- View your email and role
- Sign out

**Invite Team Member / Client (Admin Only):**
- Email address (required)
- Name
- Company (used to isolate their data via org_id)
- Role (Admin, Client, LYRIC Client, User)
- Invited users receive email with login link

**AI Configuration:**
- Shows "API Active" status (API key is managed server-side by AIMS staff)
- No manual key entry needed

**Active Agents (Admin Only):**
- Lists all 4 agents and their status
- Shows agent names, roles, and live status

**System Information:**
- Platform version
- Build date
- AI model version
- Company info

---

## Architecture & Data Flow

### **Authentication**
- Supabase Auth (email/password)
- Role and org_id stored in user metadata
- RLS (Row Level Security) enforces data isolation at database level

### **Multi-Tenancy**
- Each organization (client company) has a unique `org_id`
- All data (contacts, conversations, tasks, notes) tagged with org_id
- Admins see all orgs; clients only see their own

### **AI API Calls**
- All Anthropic API calls route through Supabase Edge Function (`call-claude`)
- API key stored securely in Supabase secrets (never exposed to frontend)
- Every user automatically uses the same backend API key
- No manual key management needed

### **Conversations**
- Stored as JSONB array in Supabase
- Full message history (user, AI, human, system events)
- Status: active | needs_human | human_active | closed
- Persisted after every message/response

---

## Common Workflows

### **Workflow 1: Inbound Recovery (ARIA)**
1. Contact requests recovery from previous project
2. Open Conversations → select contact → choose ARIA
3. ARIA follows recovery script, proposes re-engagement
4. If client wants to talk to human → click "Request Human Agent"
5. Conversation moves to Work Queue
6. Admin claims it and completes negotiation
7. Deal won → status moves to "Won" in Pipeline

### **Workflow 2: Outbound Sales (MELODY)**
1. New prospect in "Cold" stage
2. Open Conversations → new chat → choose MELODY
3. MELODY delivers pitch, qualifies fit
4. If interested → move to "Qualified" stage
5. Continue conversation until deal or rejection
6. Admin can intervene anytime via "Request Human Agent"

### **Workflow 3: Content Generation (LYRIC)**
1. Client needs social media content
2. Go to LYRIC Workstation → Create tab
3. Select platform, content type, fill in details
4. Click Generate → copy + image created
5. Click Publish (if platform connected) or copy manually

### **Workflow 4: Reputation Management (MUSE)**
1. New review or mention appears
2. Open Conversations → select contact → choose MUSE
3. MUSE drafts response (professional, on-brand)
4. Admin reviews and sends or edits
5. Response posted to review platform

### **Workflow 5: Onboarding a New Client**
1. Admin invites client via Settings → Invite Team Member
2. Client receives email, logs in
3. Client navigates to Onboarding → fills 5-step wizard
4. Admin reviews client data, completes admin 8-step wizard
5. Status becomes "Config Complete"
6. Tasks auto-generate for each service tier
7. Launch date arrives → ARIA/MELODY begin outreach

---

## Troubleshooting

### **"Connection error. Please try again."**
- Check internet connection
- Refresh page
- If persists, Supabase may be down (check status.supabase.com)

### **"API key not configured"**
- AIMS admin needs to add `ANTHROPIC_API_KEY` to Supabase Edge Function secrets
- Go to Supabase Dashboard → Edge Functions → call-claude → Secrets
- Verify secret is set and active

### **Conversation history not showing**
- Reload page
- If still missing, check Supabase conversations table (may need RLS debug)

### **Can't see other org's data as admin**
- This is by design — RLS enforces org isolation even for admins
- To see another org, contact Supabase support or use service role key (server-side only)

### **Invited user not receiving email**
- Check spam/junk folder
- Verify email address spelling
- Confirm Supabase SMTP is configured
- Check Edge Function logs for errors

---

## Tips & Best Practices

1. **Use consistent contact sources** — Helps ARIA/MELODY tailor messaging
2. **Tag contacts** — Makes filtering and bulk actions easier (future feature)
3. **Claim Work Queue conversations immediately** — Don't leave clients waiting
4. **Document everything in Notes** — Helps hand-offs between team members
5. **Review LYRIC content before publishing** — AI-generated copy needs human review
6. **Set go-live dates in Onboarding** — Ensures coordinated launch across agents
7. **Use Tasks for action items** — Prevents follow-ups from slipping through cracks

---

## Support & Contact

For technical issues, bugs, or feature requests:
- Contact AIMS AI technical support
- Check system logs in Supabase Dashboard
- Review agent system prompts in Settings → Active Agents

---

**Last Updated:** June 2026  
**Version:** Command Center v2.0
