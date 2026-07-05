# CRM Completion Checklist

## ✅ Just Built (Commit: d7d0967)

### Voice Picker + Preview Feature
- [x] `bland-voices` Edge Function — browse Bland voice catalog
- [x] `bland-speak` Edge Function — generate preview audio
- [x] VoicePicker component in Settings (admin only)
  - Search voices
  - Preview button plays sample
  - Selection persists per agent/org
- [x] Database functions: `getOrgSettings`, `updateAgentVoice`, `getAgentVoice`
- [x] Voice flows into outbound calls via `send-outreach`

### Outbound Communication (Call/Text/Email)
- [x] ComposeModal in CRM contact detail
- [x] Channel selection (Call / Text / Email with icons)
- [x] Message composition with dynamic placeholders
- [x] Contact info preview before send
- [x] `send-outreach` Edge Function supporting:
  - Call via Bland API (with voice_id)
  - Text via Twilio SMS API
  - Email via Resend API
- [x] orgId passed to CRM and Settings components

---

## 🚀 Next Priority: Communication History & Logging

### 1. Database Schema (run in Supabase SQL Editor)
- [ ] `communication_logs` table
  - Track all sent calls/texts/emails
  - Store external IDs (Bland call_id, Twilio sid, Resend id)
  - Status tracking (pending → sent → completed/failed)
- [ ] `call_recordings` table
  - Store Bland webhook call data
  - Transcript and recording URL
  - Duration and status

**See:** `SCHEMA_UPDATES.sql` in this directory

### 2. Communication History UI
- [ ] New "Activity" or "History" tab in contact detail
- [ ] List of sent calls/texts/emails with:
  - Channel icon (☎️ / 💬 / 📧)
  - Message snippet
  - Status badge (sent / failed / completed)
  - Timestamp
  - Duration (for calls)
  - Transcript link (for calls with recording)

### 3. Logging After Send
- [ ] `send-outreach` saves to `communication_logs` after successful send
- [ ] Update contact's `last_call`, `last_text`, `last_email` timestamps
- [ ] Handle failures gracefully (log error, show in UI)

---

## 🔄 Inbound Integration: Work Queue

### 1. Incoming Call/Text Webhooks
- [ ] Bland webhook for incoming calls
- [ ] Twilio webhook for incoming SMS
- [ ] Route to Work Queue with:
  - Caller/sender info
  - Contact lookup (match to existing contact)
  - Auto-link to conversation

### 2. Work Queue Enhancements
- [ ] Display incoming communications (calls/SMS)
- [ ] Show matched contact or prompt to create
- [ ] Quick actions: claim, respond, close

---

## 📊 CRM Core Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| Contact CRUD | ✅ Complete | Add, edit, delete, search |
| Pipeline (stages) | ✅ Complete | cold → contacted → qualified → negotiating → won/lost |
| Agent assignment | ✅ Complete | Per-contact agent selection |
| Contact scoring | ✅ Complete | Manual score + auto-calc possible |
| Notes | ✅ Complete | Per-contact notes with timestamps |
| **Voice picker** | ✅ **Complete** | Browse, preview, assign |
| **Outbound messaging** | ✅ **Complete** | Call/text/email compose + send |
| Communication history | 🔄 In Progress | Needs logging table + UI |
| Incoming webhooks | 📋 Planned | Bland + Twilio webhooks |
| Call recordings | 📋 Planned | Transcripts and playback |
| Bulk actions | 📋 Planned | Send to segment, bulk stage change |
| Custom fields | 📋 Planned | Dynamic contact attributes |
| Approval queue | 📋 Planned | Messages need review before send |
| A/B testing | 📋 Planned | Test script variants |

---

## 🔧 Required Environment Variables (for Edge Functions)

```
BLAND_API_KEY            # For voice picker + calls
TWILIO_ACCOUNT_SID       # For SMS
TWILIO_AUTH_TOKEN        # For SMS
TWILIO_PHONE_NUMBER      # From number (per-client ideal)
RESEND_API_KEY          # For email delivery
RESEND_FROM_EMAIL       # Sender email
API_BASE_URL            # For Bland webhook callbacks (https://...)
```

---

## 📝 Deployment Steps

### 1. Deploy Edge Functions to Supabase
```bash
supabase functions deploy bland-voices
supabase functions deploy bland-speak
supabase functions deploy send-outreach
```

### 2. Run Schema Updates
- Copy `SCHEMA_UPDATES.sql`
- Paste in Supabase SQL Editor
- Execute all statements

### 3. Set Environment Variables
- Go to Supabase → Project → Settings → Environment Variables
- Add the six variables above

### 4. Build & Deploy App
```bash
npm run build
git push origin claude/aims-command-center-agents-h49o16
# Deploy to VPS or hosting
```

---

## 🎯 Critical Path to MVP

**Currently:** Basic CRM with voice-aware outbound messaging ✅

**Missing for MVP:**
1. Communication logging (1-2 hours)
2. Activity/history tab (1 hour)
3. Webhook receivers for incoming calls/SMS (2-3 hours)
4. Work Queue integration with inbound (1 hour)

**Estimated to full CRM MVP: 5-7 hours of dev**

---

## 📞 Integration Points

### Bland (Voice Calls)
- `/v1/voices/shared` → browse catalog
- `/v1/speak` → generate preview
- `/v1/calls` → place AI call
- Webhook ← incoming call data
- ✅ Voice picker & outbound call built

### Twilio (SMS)
- `/2010-04-01/Accounts/{SID}/Messages.json` → send SMS
- Webhook ← incoming SMS
- ✅ SMS send built (needs Twilio setup)
- ❌ Incoming webhook needed

### Resend (Email)
- `/emails` → send email
- ✅ Email send built (needs Resend setup)
- ❌ Delivery webhooks (optional)

---

## Questions for Next Session

1. **Approval queue:** Should messages be sent immediately or wait for human approval?
2. **Twilio setup:** Does AIMS have existing Twilio account? One number per client or shared?
3. **Incoming routing:** Should all inbound go to Work Queue, or route to assigned agent?
4. **Call recordings:** Store transcripts? Show playback in UI?
5. **Bulk actions:** Priority for segmented outreach or stick with one-at-a-time?
