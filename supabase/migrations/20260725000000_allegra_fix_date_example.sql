-- The "Today is Tuesday -- how does Thursday sound?" example baked into
-- the scheduling instructions was being parroted literally regardless of
-- the actual day injected at connect time (voice-agent/server.js
-- todayContext()) -- confirmed live: she kept saying Tuesday no matter
-- what day it actually was. Replacing the hardcoded example with an
-- instruction that has no specific day name to copy.
update agent_voice_configs
set
  settings = jsonb_set(
    settings,
    '{agent,think,prompt}',
    to_jsonb(
      replace(
        settings -> 'agent' -> 'think' ->> 'prompt',
        'Reference specific day names when suggesting times (e.g. "Today is Tuesday -- how does Thursday sound?"), not vague relative terms.',
        'The actual current day and date were given to you at the very start of this conversation -- always use that real value, never a hardcoded or example day name, when referencing today or suggesting a specific upcoming day.'
      )
    )
  )
where agent_id = 'allegra' and org_id is null;
