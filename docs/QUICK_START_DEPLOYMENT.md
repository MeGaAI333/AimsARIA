# Quick-Start Production Deployment Checklist

**Time to Deploy:** 30 minutes  
**Prerequisites:** Supabase account + Vercel/Railway account

---

## ⚡ 30-Minute Deployment

### Phase 1: Setup (5 min)

- [ ] Create Supabase project: https://supabase.com
- [ ] Copy Project URL: `https://xxx.supabase.co`
- [ ] Copy Anon Key from `Settings > API > Project API keys`
- [ ] Copy Service Role Key (keep secret!)

### Phase 2: Database (5 min)

- [ ] Open Supabase SQL Editor
- [ ] Paste contents of `LYRIC_SCHEMA.sql`
- [ ] Run all migrations
- [ ] Verify tables created: `SELECT * FROM information_schema.tables WHERE table_schema='public'`

### Phase 3: Environment (5 min)

Create `.env.production`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
ANTHROPIC_API_KEY=sk-ant-xxxxx
BLAND_API_KEY=your-bland-key
```

### Phase 4: Edge Functions (5 min)

```bash
npm install -g supabase

supabase login
supabase link --project-ref your-project-ref
supabase functions deploy
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### Phase 5: Frontend (5 min)

**For Vercel:**
```bash
npm install -g vercel
vercel link
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

**For Railway:**
```bash
npm install -g @railway/cli
railway login
railway init
railway variables set VITE_SUPABASE_URL=https://...
railway variables set VITE_SUPABASE_ANON_KEY=...
railway deploy
```

---

## ✅ Verify It Works

```bash
# 1. Frontend loads
curl https://yourdomain.com | grep "AIMS"

# 2. Create test contact
# (Use UI or API call)

# 3. Generate test content
# Go to LYRIC > Create tab > Generate Post

# 4. Check Buffer settings
# Go to Settings > Buffer Integration

# 5. Verify database
# Supabase Dashboard > Browser > lyric_posts
```

---

## 🚨 If Anything Fails

| Problem | Check |
|---------|-------|
| App blank/white | Check browser console (F12) for errors |
| Env vars not loading | Verify platform set them, restart server |
| Database connection fails | Verify SUPABASE_URL and ANON_KEY correct |
| Content generation fails | Check ANTHROPIC_API_KEY is valid |
| Deploy stuck | Check logs: `vercel logs` or `railway logs` |

---

## 🔄 Rollback Plan

If deployment fails:

```bash
# Vercel: Go to Deployments tab, click "Redeploy" on previous version
vercel rollback

# Railway: Go to Deployments, select previous version
# AWS Amplify: Deployments > Previous version > Redeploy
```

---

## 📊 CRM Features Deployed

✅ **Contacts** — Create, view, update contacts  
✅ **Tasks** — Task management with status  
✅ **Notes** — Quick note taking  
✅ **Calendar** — Event scheduling  
✅ **Conversations** — AI agent interactions  
✅ **Communication Logs** — Track all outreach  
✅ **Settings** — User preferences & API keys  

---

## 🎵 LYRIC Workstation Features Deployed

✅ **Create Tab** — Generate content with Claude  
✅ **Calendar Tab** — Schedule rules & bulk generation  
✅ **Schedule Tab** — View pending/scheduled posts  
✅ **Published Tab** — View live posts from database  
✅ **Approval Workflow** — Review & approve posts  
✅ **Buffer Integration** — Auto-post to social media  
✅ **Cron Job** — Automatic scheduled posting  

---

## 💡 Pro Tips

1. **Monitor from day 1:**
   ```
   Vercel: https://vercel.com/dashboard
   Supabase: https://supabase.com/dashboard
   ```

2. **Set up alerts** for errors/downtime

3. **Enable auto-backups** (Supabase: 7 days default)

4. **Test cron job** after 5 minutes:
   - Schedule a post for "now"
   - Check if status changes to published

5. **Scale gradually:**
   - Start small (free tier okay)
   - Monitor usage
   - Upgrade when needed

---

## 📝 After Deployment

**Day 1:**
- [ ] Test all CRM features
- [ ] Generate test LYRIC post
- [ ] Create test schedule rule
- [ ] Connect Buffer token
- [ ] Test post approval workflow

**Week 1:**
- [ ] Monitor error logs daily
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Fix any critical bugs

**Month 1:**
- [ ] Optimize slow queries
- [ ] Review security logs
- [ ] Plan next features
- [ ] Team training

---

## 🎯 Success Criteria

- [x] App loads without errors
- [x] Users can sign up
- [x] Contacts can be created
- [x] LYRIC generates content
- [x] Posts can be scheduled
- [x] Approval workflow works
- [x] Posts publish to Buffer
- [x] Monitoring active

---

**Deployment Status: Ready to Go! 🚀**

Full guide: See `PRODUCTION_DEPLOYMENT_GUIDE.md`  
Test report: See `LYRIC_TEST_REPORT.md`
