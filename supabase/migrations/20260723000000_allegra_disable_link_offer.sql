-- Temporarily stops Allegra from offering/mentioning the Profit Leak
-- Analysis link at all. Her original base prompt's PRIMARY CTA ("Would you
-- prefer I text or email the Profit Leak Analysis link?") predates this
-- session and conflicts with the newer live-transfer-or-schedule flow
-- added on top of it, causing her to bring up the link instead of sticking
-- to the two intended options. Appending an explicit override rather than
-- editing the original CTA text buried in the base prompt — easy to revert
-- by dropping this migration's effect once the link flow is ready again.
update agent_voice_configs
set
  settings = jsonb_set(
    settings,
    '{agent,think,prompt}',
    to_jsonb(
      (settings -> 'agent' -> 'think' ->> 'prompt') || E'\n\n## OVERRIDE -- DO NOT OFFER THE ANALYSIS LINK RIGHT NOW\nIgnore any earlier instruction to text or email the Profit Leak Analysis link, and do not call send_analysis_link. Do not mention the link at all for now.\n\nInstead, once you''ve created enough curiosity, offer exactly these two choices and nothing else: speaking with a team member live right now (call transfer_to_human), or scheduling a 15-minute Profit Leak Review with Melody (call schedule_appointment once you and the prospect agree on a specific day and time). Always present both options together, and let the prospect pick.'
    )
  )
where agent_id = 'allegra' and org_id is null;
