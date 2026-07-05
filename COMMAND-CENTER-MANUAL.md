# AIMS AI Command Center — User Manual
**AIMS Marketing Systems, Inc. · Version 2.0 · July 2026**

## Welcome to AIMS Command Center

Your complete AI-powered platform for customer relationship management, marketing automation, and social content creation. Featuring:

- **Full CRM System** — Manage contacts, tasks, notes, and communications
- **LYRIC Workstation** — AI-powered content generation and automatic social media publishing
- **AI Agents** — ARIA, MELODY, LYRIC, and MUSE working 24/7 for your business
- **Multi-Platform Support** — Facebook, Instagram, LinkedIn, Twitter, TikTok, Email
- **Automated Publishing** — Schedule content to publish automatically via Buffer
- **Team Collaboration** — Invite team members with role-based access control

---

## Table of Contents
1. [Getting Started](#1-getting-started)
2. [User Roles & Access](#2-user-roles--access)
3. [Command Center Dashboard](#3-command-center-dashboard)
4. [CRM — Contacts](#4-crm--contacts)
5. [Pipeline](#5-pipeline)
6. [Conversations](#6-conversations)
7. [Campaigns](#7-campaigns)
8. [AI Agents](#8-ai-agents)
9. [LYRIC Workstation](#9-lyric-workstation)
10. [Calendar](#10-calendar)
11. [Tasks](#11-tasks)
12. [Notes](#12-notes)
13. [Pricing](#13-pricing)
14. [Settings](#14-settings)
15. [Onboarding a New Client](#15-onboarding-a-new-client)
16. [FAQ](#16-faq)

---

## 1. Getting Started

### Accessing the Platform
Navigate to: **https://aimsai.aimsmarketingsystems.com**

### Logging In
1. Enter your email address and password
2. Click **Sign In**
3. If it's your first login (invited by an admin), click the link in your invitation email first to set your password

### Signing Out
Click **Sign Out** in the bottom-left corner of the sidebar, or go to **Settings → Sign Out**.

---

## 2. User Roles & Access

There are four access levels. Each user is assigned a role when they are invited.

| Role | What They See |
|---|---|
| **Admin** | Everything — full access to all views, data, settings, and all client data |
| **Client** | Command Center, Pipeline, Conversations, Campaigns, Calendar, Tasks, Notes, Pricing, Settings |
| **LYRIC Client** | LYRIC Workstation only + Settings |
| **User** | Command Center, Conversations, Calendar, Tasks |

> **Data isolation:** Each client only sees data belonging to their own company. Business A cannot see Business B's contacts, tasks, notes, or calendar events. Admins can see all data across all clients.

---

## 3. Command Center Dashboard

The Dashboard is the home screen and gives a live overview of your revenue flywheel.

**What you'll see:**
- **Revenue Flywheel** — status of all four AI agents (ARIA, MELODY, LYRIC, MUSE)
- **Lead Pipeline Summary** — counts by stage (cold, contacted, qualified, etc.)
- **Recent Activity** — latest contacts and interactions
- **Quick Actions** — shortcuts to add contacts, schedule events, and navigate to key views

**Navigation:** Use the left sidebar to move between sections. Your role badge (Admin / Client / LYRIC Client / User) is shown at the top of the sidebar.

---

## 4. CRM — Contacts

*Available to: Admin*

The CRM is your central database of all leads and clients.

### Viewing Contacts
- All contacts are listed on the left panel
- Use the **search bar** to find by name or company
- Use the **stage filter buttons** to filter by: Cold, Contacted, Qualified, Negotiating, Won, Lost

### Adding a Contact
1. Click **+ Add Contact** at the bottom of the contact list
2. Fill in: Name, Company, Email, Phone, Industry, Deal Value, Source, Stage, Assigned Agent
3. Click **Add Contact**

### Viewing a Contact's Details
Click any contact to open their detail panel on the right:
- **Overview tab** — contact info, deal value, assigned agent, last contact date
- **Notes tab** — view and add notes specific to this contact

### Changing a Contact's Stage
In the contact detail panel, use the **stage dropdown** at the top to move them through the pipeline (Cold → Contacted → Qualified → Negotiating → Won / Lost).

### Adding a Note to a Contact
1. Open the contact → click the **Notes** tab
2. Type your note in the text area
3. Click **Save Note**

---

## 5. Pipeline

*Available to: Admin, Client*

The Pipeline is a Kanban-style board showing leads organized by stage.

### Using the Pipeline
- Each column represents a stage in your sales process
- Cards show the lead name, company, value, and assigned agent
- Use the **stage dropdown** on each card to move a lead to a new stage

### Adding a Lead
1. Click **+ Add Lead**
2. Fill in the lead details
3. Click **Save** — the lead appears in the appropriate column

---

## 6. Conversations

*Available to: Admin, Client, User*

Conversations is your AI-powered messaging hub for communicating with leads.

### Starting a Conversation
1. Select a contact from the left panel
2. Type your message in the input box at the bottom
3. Press **Enter** or click **Send**

### AI-Assisted Replies
If your Anthropic API key is set in Settings, the AI agents can assist with crafting responses. The appropriate agent (ARIA, MELODY, etc.) will respond based on the conversation context.

> **Note:** An Anthropic API key is required for live AI responses. Set it in **Settings → Anthropic API Key**.

---

## 7. Campaigns

*Available to: Admin, Client*

Campaigns shows all active and scheduled marketing campaigns managed by the AI agents.

- View campaign name, description, assigned agent, lead count, and engagement rate
- Click a campaign to see more details
- Active campaigns are marked with a green **● Active** badge

---

## 8. AI Agents

*Available to: Admin*

Each of the four AIMS AI agents has its own page showing their profile, performance, and live chat.

### The Four Agents

| Agent | Direction | Focus |
|---|---|---|
| **ARIA** | Inbound | Lead capture, qualification, initial outreach |
| **MELODY** | Outbound | Proactive prospecting, follow-up sequences |
| **LYRIC** | Content | Content creation, social media, brand voice |
| **MUSE** | Strategy | Campaign strategy, analytics, optimization |

### Accessing an Agent's Page
Click the agent's name in the sidebar under **AI AGENTS**.

### Each Agent Page Shows:
- **Brand Voice** — tone, style, do's and don'ts, example copy
- **Capabilities** — what this agent specializes in
- **Performance (30d)** — KPI metrics for the past 30 days
- **Active Campaigns** — campaigns this agent is running
- **Live Chat** — chat directly with the agent

### Chatting with an Agent
1. Scroll to the **Live Chat** panel on the agent's page
2. Type your question or request
3. Press **Enter** or click **Send**
4. The agent responds using its specific persona and brand voice

> **Requires:** Anthropic API key set in Settings.

---

## 9. LYRIC Workstation

*Available to: Admin, LYRIC Client*

The LYRIC Workstation is a dedicated content generation studio powered by AI. It includes automated content creation, scheduling, approval workflows, and direct social media publishing via Buffer.

### Five Tabs

#### **✨ Create Tab**
Generate unique social content with AI.

1. Select a **Platform**: All Platforms, Facebook, Instagram, LinkedIn, Twitter, TikTok
2. Choose a **Content Type**: 
   - Post (social media post)
   - Reel Script (short video script)
   - Carousel (multi-slide post)
   - Email (marketing email)
   - Newsletter (monthly newsletter)
   - Blog Post (long-form content)
3. Select an **Industry** (12 pre-configured: Roofing, HVAC, Law Firm, Real Estate, MedSpa, CPA/Tax, Plumbing, Pest Control, Landscaping, Fence & Gate, Financial Services, Other)
4. Enter a **Topic/Goal** (e.g., "Generate roofing leads before storm season")
5. Choose a **Tone**: Authoritative, Educational, Conversational, Urgency-Driven
6. For Carousels: Select a **Template Style**: Overlay, Panel, or Split
7. Click **✨ Generate [Content Type]**

**What You Get:**
- AI-generated copy tailored to your industry and platform
- Auto-generated professional image that matches the content
- Published preview showing how it will look on the platform
- Copy button for quick clipboard access
- Regenerate button to create variations

#### **📅 Calendar Tab**
Manage recurring content schedules and bulk post generation.

**Creating a Schedule Rule:**
1. Click **+ New Rule**
2. Fill in:
   - Rule Name (e.g., "Client A - Facebook Afternoons")
   - Platforms (select one or more)
   - Days of Week (Mon, Tue, Wed, etc.)
   - Time of Day (09:00, 14:30, etc.)
   - Duration (how many days to generate posts for)
   - Start Date
   - Allow Recent (toggle to allow similar content to recent posts, or require fresh content)
3. Click **Create Rule**

**What Happens:**
- LYRIC automatically generates unique posts for each scheduled slot
- Each post is different (content deduplication prevents repeating topics from last 4 months)
- Posts appear in "Upcoming Posts" as drafts (amber border)

**Reviewing Posts:**
- Click **Review** on any draft post to open the Approval Modal
- See full post details: topic, platform, content, images
- **Approve** (✓) to move to pending status (blue border)
- **Reject** to keep as draft and regenerate

#### **📋 Schedule Tab**
View posts waiting to be published.

- Shows all **pending approval** and **scheduled** posts
- Displays: Platform icon, topic, content type, scheduled date/time
- Click any post to view full details in the Post Detail Modal
- Filter by status to find what needs attention

#### **📡 Published Tab**
View all posts that have been published to social media.

- Shows all **published** posts with green checkmark
- Displays: Platform, topic, publish date, status
- Click any post to view full details and performance metrics
- Historical record of all content sent to clients' social accounts

#### **📊 Analytics Tab**
View content performance and engagement metrics.

- **Summary Stats**: Posts published, avg engagement, email open rates, leads generated
- **Platform Breakdown**: LinkedIn, Instagram, Facebook, Email with individual metrics
- **Performance Tracking**: See which content types and platforms perform best

### Complete Workflow

1. **Generate** content in Create tab (AI creates unique copy + image)
2. **Schedule** (optional) — Create recurring rules to bulk-generate multiple posts
3. **Review** — Go to Calendar tab, review each draft post
4. **Approve** — Click Approve to move post to "pending" status
5. **Auto-Publish** — Scheduled-posting cron job automatically publishes at scheduled time
6. **View Results** — Check Published tab to see live posts

### Post Statuses

- 🟡 **Draft** — Generated but not reviewed (amber)
- 🔵 **Pending Approval** — Approved but awaiting scheduled time (blue)
- 🟢 **Published** — Successfully posted to social media (green)
- 🔴 **Failed** — Post failed to publish (red) — check error message

### Copying & Sharing Content
Click **Copy** to copy post text to your clipboard for manual posting, or approve for automatic Buffer publishing.

### Brand Customization
- **Brand Color Picker**: Choose from 6 presets or custom color for carousel templates
- Colors persist per client for consistent visual branding

> **Requires:** Anthropic API key set in Settings for content generation. Buffer API token set in Settings for automatic social media posting.

---

## 10. Calendar

*Available to: Admin, Client*

The Calendar tracks all scheduled calls, demos, onboarding sessions, and events.

### Viewing Events
Events are listed in chronological order showing: type, title, date, time, duration, contact name, and assigned agent.

### Scheduling an Event
1. Click **+ Schedule Event**
2. Fill in: Title, Contact Name, Date, Time, Duration, Type, Agent
3. Click **Schedule**

### Event Types
- **Call** — phone or video call
- **Demo** — product or service demonstration
- **Discovery** — initial discovery meeting
- **Onboarding** — new client onboarding session
- **Close** — closing / contract signing meeting
- **Internal** — internal team meeting

### Removing an Event
Click the **✕** button on the right side of any event.

---

## 11. Tasks

*Available to: Admin, Client, User*

Tasks keeps your team organized with prioritized to-do items.

### Viewing Tasks
Tasks are grouped by priority: **High**, **Medium**, **Low**.

### Adding a Task
1. Click **+ Add Task**
2. Fill in: Task name, Due date/time, Contact (optional), Assignee (optional), Priority
3. Click **Add Task**

### Completing a Task
Click the **checkbox** on the left of any task to mark it done. Completed tasks are shown with a strikethrough.

### Deleting a Task
Click the **✕** button on the right side of any task.

---

## 12. Notes

*Available to: Admin, Client*

Notes is a general-purpose notepad for your team, organized by contact.

### Adding a Note
1. (Optional) Enter a contact name to link the note
2. Type your note in the text area
3. Click **Save Note**

### Filtering Notes
Use the left sidebar to filter notes by contact name, or select **All Notes** to see everything.

### Deleting a Note
Click the **✕** button on any note card.

---

## 13. Pricing

*Available to: Admin, Client*

The Pricing section displays your service packages and pricing tiers for reference during sales conversations.

---

## 14. Settings

*Available to: All roles*

### Account Information
Shows your email address and current role badge. Click **Sign Out** to log out.

### Appearance
**Theme Toggle**
- Switch between 🌙 **Dark Mode** and ☀️ **Light Mode**
- Your preference is saved automatically
- Includes WCAG-compliant text contrast for accessibility

### AI Configuration
Shows if all AI features are enabled (always enabled for our system). Confirms that Claude API is active for content generation.

### Buffer Integration
*(Admin only)*

Connect your Buffer account to automatically post LYRIC content to all social platforms (Facebook, Instagram, LinkedIn, Twitter, TikTok).

**To Connect:**
1. Go to **Buffer Developer Settings**: https://buffer.com/developers/api
2. Generate an API token
3. Paste it into the **Buffer API Token** field in Settings
4. Click **Save Token**
5. Connection status shows as **● Connected**

**What Happens:**
- When you approve a LYRIC post, it moves to "pending approval" status
- Our scheduled cron job automatically posts it to Buffer at the scheduled time
- Posts go to all selected platforms (Facebook, Instagram, LinkedIn, Twitter)
- Post status automatically updates to "published"

**To Disconnect:**
1. Click **Disconnect** button in Buffer Integration section
2. Confirm when prompted
3. LYRIC will no longer auto-post to social media

> **Note:** Without Buffer connected, you can still manually copy LYRIC content and post it yourself. Buffer connection enables automatic publishing.

### Anthropic API Key
*(Admin only)*

This is required to activate all AI features (LYRIC content generation, agent chat).

1. Go to **console.anthropic.com** and generate an API key
2. Paste it into the **Anthropic API Key** field
3. The key is saved automatically — you won't need to re-enter it after refreshing

> **Security:** Your API key is stored securely on the server. It is required for LYRIC content generation and agent interactions.

### Inviting Team Members & Clients
*(Admin only)*

1. Go to **Settings → Invite Team Member / Client**
2. Enter their **Name**, **Email**, and **Company Name**
3. Select their **Access Level** (Admin / Client / LYRIC Client / User)
4. Click **Send Invite →**

The invitee receives an email with a link to set their password. When they log in, their role and data access are automatically configured.

**Access Levels:**
- **Admin** — Full access to all views and all client data
- **Client** — CRM, Pipeline, Calendar, Tasks, LYRIC, Settings (own org only)
- **LYRIC Client** — LYRIC Workstation only + Settings
- **User** — Conversations, Calendar, Tasks, Notes

### Agent Voices
*(Admin only)*

Configure which AI voice each agent uses for outbound calls.

1. Browse 100+ professional voices from Bland AI
2. Preview any voice by clicking **▶**
3. Click **Choose Voice** or **Change** to select a voice for that agent
4. Selection is saved automatically

### Active Agents
*(Admin only)*

Shows all four AI agents with their live status and availability.

| Agent | Role | Status |
|-------|------|--------|
| **ARIA** | Inbound lead capture & qualification | ● Active |
| **MELODY** | Outbound prospecting & follow-up | ● Active |
| **LYRIC** | Content creation & social media | ● Active |
| **MUSE** | Strategy & analytics | ● Active |

### System Information
Shows platform version, build date, AI model, and company information.

---

## 15. Onboarding a New Client

Follow these steps to add a new client to the Command Center:

1. **Log in as Admin** and go to **Settings**
2. In the **Invite Team Member / Client** panel:
   - Enter the client's name and email
   - Enter their **company name** (this creates their private data workspace)
   - Select their role: **Client** (full client view) or **LYRIC Client** (workstation only)
3. Click **Send Invite →**
4. The client receives an email — they click the link and set their password
5. When they log in, they see only their own workspace with no access to other clients' data

---

## 16. FAQ

### Account & Access
**Q: Why can't I see the CRM or AI Agents?**
A: These sections are Admin-only. If you need access, ask your AIMS administrator to update your role in Settings.

**Q: Can a client see data I added for another client?**
A: No. Data isolation is enforced at the database level — each client's data is completely separate. Admins can see all data across all clients.

**Q: How do I change someone's role after they've been invited?**
A: Go to **Settings → Invite Team Member / Client**, or contact your AIMS admin to update user roles in the system.

**Q: I invited a client but they didn't receive an email.**
A: Check their spam/junk folder. If still not there, ask your AIMS admin to verify the invite in the system and resend if needed.

### AI & Content Generation
**Q: The AI isn't generating content — what do I do?**
A: Go to **Settings** and make sure your **Anthropic API Key** is entered. If it is and still not working, your key may have expired — generate a new one at https://console.anthropic.com.

**Q: Why is the Buffer connection showing as "not connected"?**
A: Go to **Settings → Buffer Integration** and paste a valid Buffer API token from https://buffer.com/developers/api. Click **Save Token**.

**Q: Will my posts be posted immediately or at the scheduled time?**
A: Posts move to **pending approval** when approved. Our automated cron job checks every 5 minutes for posts ready to publish (scheduled_at time has arrived) and automatically posts them to Buffer. You'll see the status change to **published** once complete.

**Q: What if Buffer fails to post a post?**
A: The post status changes to **failed** with an error message. Go to the **Published** tab, click on the failed post to see the error. Common issues: Buffer token expired, platform disconnected in Buffer. Fix the issue and our system will retry automatically.

### LYRIC Workstation
**Q: Why do some posts have the same topic if I'm trying to avoid repetition?**
A: You can use the same topic, but our AI ensures the content is different. This is done by passing recent posts as context so Claude generates fresh angles. For truly unique topics, enable "Allow Recent" when creating a schedule rule.

**Q: Can I edit a post after it's approved but before it publishes?**
A: Currently, you can reject it to revert to draft, then regenerate. Future versions will include edit capability.

**Q: How do I schedule posts manually instead of using schedule rules?**
A: In the **Create** tab, generate your content, then click the **Schedule →** button to choose a specific date and time. The post is created as scheduled and will be published automatically at that time.

**Q: Can I post to multiple platforms at once?**
A: Yes. When creating a schedule rule, select all platforms you want. Each post will be published to all selected platforms via Buffer. Individual posts can specify which platform to target.

**Q: Where can I see the performance of published posts?**
A: Go to **Published** tab to see all live posts, or check **Analytics** tab for summary metrics (engagement, reach, conversions by platform).

### General
**Q: How are my API keys protected?**
A: 
- Anthropic API Key: Required for content generation on the server
- Buffer API Token: Stored securely in encrypted database, never exposed in frontend
- API keys are never logged or shared

**Q: What happens if I delete a schedule rule?**
A: The rule is removed, but previously generated posts remain in the system. You can still approve/publish them individually, or delete them if you don't want them.

**Q: Can I have multiple schedule rules for the same client?**
A: Yes. Create different rules for different platforms, times, or days. All rules generate unique content and don't duplicate.

**Q: How often does the scheduled posting run?**
A: Every 5 minutes, our system checks for posts ready to publish and automatically posts them to Buffer. Posts publish within 5 minutes of their scheduled time.

---

*For support, contact AIMS Marketing Systems.*
*Platform: AIMS AI Command Center v2.0 · aimsai.aimsmarketingsystems.com*
*Last Updated: July 5, 2026*
