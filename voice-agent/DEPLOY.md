# Deploying voice-agent

This service is a standalone Node/Express/WebSocket process — it is not part
of `deploy.sh` (which only handles the frontend build + Supabase secrets) and
is not a Supabase Edge Function. It has to be running continuously on a host
that Twilio can reach over HTTPS/WSS, because it holds the live audio bridge
for every active call.

## First-time setup on the server

```bash
# 1. Get the code onto the box
git clone https://github.com/MeGaAI333/command-center.git
cd command-center/voice-agent

# 2. Node >= 22 required — @supabase/supabase-js's realtime client needs
#    the native WebSocket global that only Node 22+ provides, even though
#    this service never uses realtime subscriptions itself. Check first:
node -v
#    If it's below 22, install a current LTS via NodeSource:
#    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
#    sudo apt-get install -y nodejs

npm ci --omit=dev

# 3. Configure
cp .env.example .env
vim .env   # fill in DEEPGRAM_API_KEY, SUPABASE_SERVICE_ROLE_KEY,
           # TWILIO_ACCOUNT_SID/AUTH_TOKEN, VOICE_AGENT_BASE_URL

# 4. Run it under systemd (see deploy/voice-agent.service — edit the User/
#    WorkingDirectory paths to match where you cloned it, then:)
sudo cp deploy/voice-agent.service /etc/systemd/system/voice-agent.service
sudo systemctl daemon-reload
sudo systemctl enable --now voice-agent
sudo systemctl status voice-agent   # should show "active (running)"

# 5. Wire nginx to it (see deploy/nginx-voice-agent.conf — merge those
#    location blocks into the existing aimsai.aimsmarketingsystems.com
#    server{} block, then:)
sudo nginx -t && sudo systemctl reload nginx
```

## Verifying it's actually live

```bash
# Process is up and listening
ss -tlnp | grep 8091

# HTTP endpoints respond (through nginx, from the public domain)
curl -X POST https://aimsai.aimsmarketingsystems.com/voice/status -d 'CallStatus=test&CallSid=test'
# -> should return 200, empty body

# Tail logs while placing a real test call
journalctl -u voice-agent -f
```

## Also required before Allegra can place a real call

- Twilio phone number's Voice webhook doesn't need to point anywhere for
  *outbound* calls — `send-outreach` sets the `Url`/`StatusCallback` per-call.
  For *inbound* calls (Muse), the number's Voice webhook must be set to
  `https://aimsai.aimsmarketingsystems.com/voice/incoming`.
- `send-outreach` (Supabase Edge Function) needs its own env vars set via
  `supabase secrets set`: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
  `TWILIO_PHONE_NUMBER`, `VOICE_AGENT_BASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- The Supabase migrations under `supabase/migrations/` must be applied
  (`add_twilio_voice_pipeline.sql`, `add_agent_voice_configs.sql`, and the
  earlier CRM/campaign migrations) — `agent_voice_configs` needs Allegra's
  row to exist or calls will connect and immediately hang up with "No
  Deepgram voice config found".

## Updating after a code change

```bash
cd command-center && git pull
cd voice-agent && npm ci --omit=dev
sudo systemctl restart voice-agent
```
