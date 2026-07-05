# AIMS Command Center — Production Deployment Guide

**Version:** 2.0 (June 2026)  
**Components:** Full CRM + LYRIC Workstation  
**Target:** Production environment (AWS/Vercel/Railway)

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Deployment](#database-deployment)
4. [Supabase Edge Functions](#supabase-edge-functions)
5. [Frontend Deployment](#frontend-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass locally: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors/warnings in dev
- [ ] TypeScript compiles clean: `npm run type-check` (if applicable)
- [ ] Security review completed
- [ ] Code review approved

### Secrets & Configuration
- [ ] `.env.local` files are NOT committed
- [ ] All API keys stored in platform secrets
- [ ] Database connection strings secured
- [ ] CORS origins configured correctly
- [ ] Rate limiting configured

### Database
- [ ] Schema migrations tested locally
- [ ] Backups created
- [ ] Indexes on large tables verified
- [ ] Row-level security (RLS) policies reviewed
- [ ] Data retention policies documented

### Documentation
- [ ] README updated with deploy steps
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Architecture diagram current
- [ ] Known issues/limitations listed

---

## 🔧 Environment Setup

### Required Services

**Supabase Project** (for database, auth, Edge Functions)
- Database: PostgreSQL
- Authentication: OAuth + Email
- Storage: S3-compatible (for images)
- Edge Functions: Deno serverless

**API Keys Needed**
1. **Anthropic API Key** (Claude API)
2. **Supabase Project URL & Service Role Key**
3. **Buffer API Token** (optional, user-configurable)
4. **Twilio Credentials** (optional, for phone integrations)
5. **Bland AI API Key** (for voice agents)

### Platform Choice

Choose one:

#### **Option A: Vercel (Recommended for React)**
- Free tier: 50GB bandwidth/month
- Automatic deployments from git
- Built-in analytics & monitoring
- Serverless functions included

#### **Option B: Railway**
- $5/month minimum
- Simple git-based deployment
- Good for full-stack apps
- PostgreSQL database included

#### **Option C: AWS Amplify**
- Flexible pricing
- CI/CD pipeline
- Custom domain support
- More control, more setup

### Step 1: Create Environment File

Create `.env.production`:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Keys (for Edge Functions and backend)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-xxxxx
BLAND_API_KEY=your-bland-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# App Configuration
VITE_APP_NAME="AIMS Command Center"
VITE_API_URL=https://your-domain.com/api
NODE_ENV=production
```

**Never commit secrets.** Use platform environment variables instead.

### Step 2: Update CORS Configuration

In Supabase dashboard → Project Settings → API:

```
Allowed origins:
- https://yourdomain.com
- https://www.yourdomain.com
- https://app.yourdomain.com
```

### Step 3: Configure Supabase RLS Policies

Ensure all tables have row-level security enabled:

```sql
-- Example: Users can only see their org data
ALTER TABLE lyric_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org posts"
ON lyric_posts
FOR SELECT
USING (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can insert their org posts"
ON lyric_posts
FOR INSERT
WITH CHECK (org_id = auth.jwt() ->> 'org_id');
```

---

## 🗄️ Database Deployment

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Create new project
3. Choose region closest to users
4. Save connection string and keys

### Step 2: Run Migrations

Connect to Supabase and run schema:

```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Manual SQL
# Copy schema from LYRIC_SCHEMA.sql and run in Supabase SQL editor
```

**Database Schema** (in `/supabase/schema.sql`):

```sql
-- Main tables
CREATE TABLE clients (...);
CREATE TABLE contacts (...);
CREATE TABLE tasks (...);
CREATE TABLE notes (...);
CREATE TABLE events (...);
CREATE TABLE conversations (...);
CREATE TABLE communication_logs (...);

-- LYRIC tables
CREATE TABLE lyric_posts (...);
CREATE TABLE schedule_rules (...);

-- Settings
CREATE TABLE org_settings (...);
CREATE TABLE client_profiles (...);
CREATE TABLE onboarding_data (...);

-- Indexes for performance
CREATE INDEX idx_lyric_posts_org ON lyric_posts(org_id);
CREATE INDEX idx_lyric_posts_scheduled ON lyric_posts(scheduled_at);
CREATE INDEX idx_schedule_rules_org ON schedule_rules(org_id);
```

### Step 3: Verify Data

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public';
```

---

## ⚡ Supabase Edge Functions

### Step 1: Install Supabase CLI

```bash
npm install -g supabase

supabase login
# Authenticate with your Supabase account
```

### Step 2: Deploy Edge Functions

All functions in `/supabase/functions/` deploy automatically:

```bash
supabase functions deploy \
  call-claude \
  generate-calendar-posts \
  post-to-buffer \
  scheduled-posting \
  bland-voices \
  bland-speak \
  send-outreach \
  invite-user

# Or deploy all at once:
supabase functions deploy
```

### Step 3: Set Function Secrets

```bash
supabase secrets set \
  ANTHROPIC_API_KEY=sk-ant-xxxxx \
  BLAND_API_KEY=your-key

# Verify:
supabase secrets list
```

### Step 4: Configure Cron Jobs

For `scheduled-posting` function to run on schedule:

In Supabase dashboard → Edge Functions → `scheduled-posting`:

```
Cron Expression: 0 */5 * * * * 
(runs every 5 minutes)

Or: 0 * * * *
(runs every hour)
```

### Step 5: Test Functions

```bash
# Local test
curl -X POST http://localhost:54321/functions/v1/call-claude \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4-6", "messages":[...]}'

# Production test (after deploy)
curl -X POST https://your-project.supabase.co/functions/v1/call-claude \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4-6", "messages":[...]}'
```

---

## 🚀 Frontend Deployment

### Option A: Vercel (Recommended)

#### 1. Connect Repository

```bash
npm install -g vercel

vercel link
# Follow prompts to connect to Vercel account
```

#### 2. Set Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key
```

#### 3. Configure Build

Vercel auto-detects Vite. Verify `.vercelignore`:

```
/supabase
.env.local
node_modules
```

#### 4. Deploy

```bash
vercel --prod
# Or push to main branch for auto-deploy
```

#### 5. Set Custom Domain

In Vercel dashboard → Domains:
```
Add your domain (e.g., app.aimscenter.com)
Configure DNS records
```

### Option B: Railway

#### 1. Create Railway Project

```bash
npm install -g @railway/cli

railway login
railway init
```

#### 2. Configure Railway

Create `railway.json`:

```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm run build && npm run preview",
    "restartPolicyMaxRetries": 3
  }
}
```

#### 3. Set Secrets

```bash
railway variables set VITE_SUPABASE_URL=https://your-project.supabase.co
railway variables set VITE_SUPABASE_ANON_KEY=your-key
```

#### 4. Deploy

```bash
railway deploy

# View logs
railway logs
```

### Option C: AWS Amplify

#### 1. Connect Repository

In AWS Amplify → New App → Connect Repository

#### 2. Configure Build

Create `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
env:
  variables:
    VITE_SUPABASE_URL: $VITE_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY: $VITE_SUPABASE_ANON_KEY
```

#### 3. Deploy

Push to main branch → Amplify auto-builds and deploys

---

## ✔️ Post-Deployment Verification

### 1. Health Check

```bash
# Test frontend loads
curl -I https://yourdomain.com
# Expected: 200 OK

# Test API endpoints
curl https://yourdomain.com/api/health
# Expected: { "status": "ok" }
```

### 2. Authentication Flow

- [ ] Sign up with new email works
- [ ] Email verification sent
- [ ] Login with credentials works
- [ ] Logout works
- [ ] Sessions persist on refresh

### 3. Core Features

**CRM:**
- [ ] Create contact → Saves to DB
- [ ] Create task → Appears in task list
- [ ] Create note → Shows in sidebar
- [ ] Create event → Shows in calendar

**LYRIC Workstation:**
- [ ] Generate content → Claude API responds
- [ ] Create schedule rule → Generates posts
- [ ] Approve post → Status changes
- [ ] View published posts → Shows real data

**Settings:**
- [ ] Theme toggle works
- [ ] Buffer settings UI appears
- [ ] Invite user sends email
- [ ] Voice picker loads voices

### 4. Database Verification

```sql
-- Check org data created
SELECT COUNT(*) FROM contacts;

-- Check LYRIC posts
SELECT COUNT(*) FROM lyric_posts;

-- Check logs for errors
SELECT * FROM pg_stat_statements LIMIT 10;
```

### 5. Performance Checks

```bash
# Frontend bundle size
ls -lh dist/assets/

# Expected: Under 600KB total JS
# If larger: check build optimization

# API response time
time curl https://yourdomain.com/api/data

# Expected: < 500ms
```

### 6. Security Checks

- [ ] HTTPS enabled (no HTTP)
- [ ] Security headers set:
  ```
  Strict-Transport-Security: max-age=31536000
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'
  ```
- [ ] CORS properly configured
- [ ] RLS policies enforced
- [ ] API keys not exposed
- [ ] Sensitive data encrypted

---

## 📊 Monitoring & Maintenance

### Real-Time Monitoring

#### Vercel Dashboard
- Deployments & rollback
- Function analytics
- Error tracking
- Performance metrics

#### Supabase Dashboard
- Database health
- Function execution logs
- Storage usage
- Auth metrics

#### Sentry (Optional Error Tracking)

```bash
npm install @sentry/react @sentry/tracing

# In main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-sentry-dsn@sentry.io/xxxxx",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

### Health Checks

Set up automated monitoring:

```bash
# Uptime robot (free tier)
# Check every 5 minutes: https://yourdomain.com/health

# Or use cron job:
0 */1 * * * curl -f https://yourdomain.com/health || alert
```

### Logs to Monitor

**Edge Functions:**
```
supabase functions logs call-claude --limit=50
supabase functions logs scheduled-posting --limit=50
```

**Database:**
```sql
SELECT * FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;
```

### Backup Strategy

**Daily Backups:**

```bash
# Supabase auto-backups (7 days free)
# Premium: 30-day backup history

# Manual backup (monthly):
supabase db dump -f backup-$(date +%Y%m%d).sql
```

### Performance Optimization

If slow:

1. **Add database indexes** (see `LYRIC_SCHEMA.sql`)
2. **Cache API responses** (use Vercel edge caching)
3. **Compress images** (use CloudFlare or Imgix)
4. **Code split** (lazy load heavy components)
5. **CDN** (use Vercel CDN or CloudFlare)

---

## 🐛 Troubleshooting

### Issue: Deploy Fails

```bash
# Check build locally first
npm run build

# Check errors
npm run build --verbose

# Clear cache and retry
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: 404 on Frontend Routes

**Solution:** Configure catch-all redirect in deployment:

**Vercel:** Add `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Railway/Amplify:** Add route rewrite for SPA

### Issue: CORS Errors

```bash
# Check allowed origins in Supabase
# Dashboard → Project Settings → API

# Temporary debug (production)
curl -H "Origin: https://yourdomain.com" \
  https://your-project.supabase.co \
  -v
```

### Issue: Edge Function Timeout

```bash
# Increase timeout in function code
// After 25 seconds, respond with error

setTimeout(() => {
  response.status(504).json({ error: "Gateway timeout" });
}, 25000);
```

### Issue: Database Connection Pool Exhausted

```sql
-- Check connections
SELECT * FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND query_start < NOW() - INTERVAL '1 hour';
```

### Issue: Memory Leak in Edge Functions

```bash
# Check function memory usage
supabase functions logs scheduled-posting

# Optimize:
# - Clear large objects after use
# - Use streaming for large responses
# - Set explicit memory limits
```

### Issue: Slow Queries

```sql
-- Find slow queries
SELECT query, calls, mean_time 
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC;

-- Add indexes
CREATE INDEX idx_lyric_posts_org_status 
ON lyric_posts(org_id, status);
```

---

## 📈 Scaling Guide (When Ready)

### Vertical Scaling
- Upgrade Supabase plan (more compute)
- Increase Edge Function memory
- Upgrade database tier

### Horizontal Scaling
- Use database read replicas
- Implement caching (Redis)
- Use CDN for static assets
- Queue background jobs (Bull, Temporal)

### Cost Optimization
- Archive old records
- Compress images
- Reduce log retention
- Use spot instances

---

## 🔐 Security Checklist (Production)

- [ ] Enable 2FA on all accounts
- [ ] Rotate API keys monthly
- [ ] Enable WAF (Web Application Firewall)
- [ ] Set up DDoS protection
- [ ] Enable database encryption at rest
- [ ] Use VPN for database access
- [ ] Audit logs enabled
- [ ] PII data encrypted
- [ ] GDPR compliance verified
- [ ] Incident response plan documented

---

## 📞 Support & Escalation

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| App loads blank | Check console for JS errors, verify env vars |
| Posts not saving | Check Supabase RLS policies, verify auth |
| Buffer posts fail | Check API token in org_settings, verify account |
| Cron job not running | Check Supabase schedule, review function logs |
| Slow performance | Add indexes, check API response times, enable caching |
| Auth failures | Verify JWT secret, check session timeout |

### Getting Help

1. **Check logs first:** `supabase functions logs`
2. **Search docs:** https://supabase.com/docs
3. **Contact support:** Support ticket with logs
4. **Community:** Supabase Discord/GitHub

---

## ✅ Deployment Completion Checklist

- [ ] All environment variables set
- [ ] Database deployed and verified
- [ ] Edge Functions deployed and tested
- [ ] Frontend built and deployed
- [ ] Custom domain configured
- [ ] SSL/HTTPS enabled
- [ ] Health checks passing
- [ ] Monitoring active
- [ ] Backups enabled
- [ ] Team has access
- [ ] Documentation updated
- [ ] Incident response plan ready

---

## 📋 Post-Deployment Tasks

1. **Week 1:**
   - Monitor error rates and performance
   - Gather user feedback
   - Fix any critical issues
   - Update documentation

2. **Month 1:**
   - Optimize slow queries
   - Review security logs
   - Capacity planning
   - Customer training

3. **Ongoing:**
   - Monthly security updates
   - Performance tuning
   - Backup verification
   - Cost monitoring

---

## 🎉 Deployment Complete!

Your AIMS Command Center is now live in production. 

**Next Steps:**
1. Monitor dashboards daily
2. Set up team notifications
3. Gather feedback from users
4. Plan first feature release
5. Schedule security audit

**Questions?** Check the troubleshooting section or contact Supabase/platform support.

---

**Last Updated:** July 5, 2026  
**Maintained By:** AIMS Development Team  
**Version:** 2.0
