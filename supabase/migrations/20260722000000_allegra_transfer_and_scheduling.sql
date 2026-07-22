-- Adds two real function-calling tools to Allegra's Deepgram config —
-- transfer_to_human (live-redirects the Twilio call to a real phone number,
-- handled in voice-agent/server.js) and schedule_appointment (books the
-- review directly onto the Calendar as a Melody event). Appends new
-- instructions to the end of her existing prompt rather than rewriting it,
-- so the original discovery/objection-handling script is untouched.
--
-- "Today is <day>" phrasing is injected fresh at connect time by
-- voice-agent/server.js (todayContext()), not stored here — the prompt
-- just needs to know to use it.

update agent_voice_configs
set
  settings = jsonb_set(
    jsonb_set(
      settings,
      '{agent,think,functions}',
      (settings -> 'agent' -> 'think' -> 'functions') || '[
        {
          "name": "transfer_to_human",
          "description": "Transfers the live call to a real AIMS team member immediately. Use only when the prospect explicitly asks to speak with a person right now instead of scheduling a callback.",
          "parameters": {
            "type": "object",
            "properties": {
              "reason": { "type": "string", "description": "Brief reason for the transfer, e.g. the prospect requested to speak with a person now" }
            },
            "required": ["reason"]
          }
        },
        {
          "name": "schedule_appointment",
          "description": "Books the Profit Leak Review appointment on Melody''s calendar once the prospect has agreed on a specific day and time.",
          "parameters": {
            "type": "object",
            "properties": {
              "date": { "type": "string", "description": "Appointment date in YYYY-MM-DD format" },
              "time": { "type": "string", "description": "Appointment time, e.g. 2:00 PM" }
            },
            "required": ["date", "time"]
          }
        }
      ]'::jsonb
    ),
    '{agent,think,prompt}',
    to_jsonb(
      (settings -> 'agent' -> 'think' ->> 'prompt') || E'\n\n## LIVE TRANSFER OR SCHEDULING\nOnce you''ve created enough curiosity, offer the prospect a real choice:\n"Would you like to speak with someone on our team right now, or would a quick 15-minute Profit Leak Review work better for you?"\n\n- If they want to talk to a person right now: call the transfer_to_human function immediately with a brief reason. Do not keep talking while the transfer happens.\n- If they want to schedule: you know today''s exact date and day of week from context provided at the start of this call. Reference specific day names when suggesting times (e.g. "Today is Tuesday -- how does Thursday sound?"), not vague relative terms. Once you and the prospect agree on a specific date and time, call the schedule_appointment function with that exact date (YYYY-MM-DD) and time, then confirm the booking back to them in your own words.'
    )
  )
where agent_id = 'allegra' and org_id is null;
