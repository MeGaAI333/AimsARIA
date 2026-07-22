-- Adds send_analysis_link so Allegra actually texts the Profit Leak
-- Analysis form (voice-agent/server.js sendAnalysisLink) instead of just
-- promising to. Voice calls only reliably have a phone number, not a
-- verified email — SMS is the one Allegra can trigger mid-call; email
-- sending for other outreach flows already exists via send-outreach's
-- "email" action if that link needs to go out that way instead.
update agent_voice_configs
set
  settings = jsonb_set(
    jsonb_set(
      settings,
      '{agent,think,functions}',
      (settings -> 'agent' -> 'think' -> 'functions') || '[
        {
          "name": "send_analysis_link",
          "description": "Texts the Profit Leak Analysis form link to the prospect''s phone right now. Use this the moment the prospect says text (not email) is fine for the analysis link.",
          "parameters": { "type": "object", "properties": {} }
        }
      ]'::jsonb
    ),
    '{agent,think,prompt}',
    to_jsonb(
      (settings -> 'agent' -> 'think' ->> 'prompt') || E'\n\n## SENDING THE ANALYSIS LINK\nWhen the prospect agrees to complete the Profit Leak Analysis and says text is fine, call the send_analysis_link function immediately -- do not just say you sent it. If they ask for email instead, tell them a teammate will follow up by email shortly rather than claiming to send one yourself, since you can only text it directly.'
    )
  )
where agent_id = 'allegra' and org_id is null;
