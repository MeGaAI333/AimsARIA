# AIMS AI Command Center — User Manual
**AIMS Marketing Systems, Inc. · Version 2.0 · June 2026**

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

The LYRIC Workstation is a dedicated content generation studio powered by AI.

### Generating Content
1. Select a **Content Type** (Social Post, Email, Blog Post, Ad Copy, etc.)
2. Choose your **Industry** (HVAC, Roofing, Legal, etc.) or type a custom one
3. Select a **Tone** (Professional, Casual, Urgent, etc.)
4. Add any **Additional Notes** (optional — specific angles, offers, keywords)
5. Click **Generate Content**

### What Gets Generated
- **Written content** — full copy ready to use or edit
- **Visual concept** — an AI-generated image that matches the content, ideal for social media or ads

### Copying Your Content
Click the **Copy** button below the generated text to copy it to your clipboard.

### Regenerating
Click **Generate Content** again at any time to produce a fresh variation.

> **Requires:** Anthropic API key set in Settings.

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
Shows your email address and current role badge.

### Anthropic API Key
This is required to activate all AI features (agent chat, LYRIC content generation).

1. Go to **console.anthropic.com** and generate an API key
2. Paste it into the **Anthropic API Key** field
3. The key is saved automatically — you won't need to re-enter it after refreshing

> **Security:** Your API key is stored only in your browser. It is never shared or sent to AIMS servers.

### Inviting Team Members & Clients
*(Admin only)*

1. Go to **Settings → Invite Team Member / Client**
2. Enter their **Name**, **Email**, and **Company Name**
3. Select their **Access Level** (Admin / Client / LYRIC Client / User)
4. Click **Send Invite →**

The invitee receives an email with a link to set their password. When they log in, their role and data access are automatically configured.

### Active Agents
*(Admin only)*

Shows all four AI agents with their live status.

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

**Q: Why can't I see the CRM or AI Agents?**
A: These sections are Admin-only. If you need access, ask your AIMS administrator to update your role.

**Q: The AI isn't responding — what do I do?**
A: Go to **Settings** and make sure your Anthropic API key is entered. If it is and still not working, your key may have expired — generate a new one at console.anthropic.com.

**Q: I invited a client but they didn't receive an email.**
A: Check their spam/junk folder. If it's not there, go to **Supabase Dashboard → Authentication → Users** to confirm the invite was created, then resend from there.

**Q: Can a client see data I added for another client?**
A: No. Data isolation is enforced at the database level — each client's data is completely separate. Admins can see all data.

**Q: How do I change someone's role after they've been invited?**
A: Go to **Supabase Dashboard → Authentication → Users**, click the user, and update their `role` field in the user metadata.

**Q: Do I need to re-enter my API key every time I log in?**
A: No. Your API key is saved in your browser and persists across sessions.

---

*For support, contact AIMS Marketing Systems.*
*Platform: AIMS AI Command Center v2.0 · aimsai.aimsmarketingsystems.com*
