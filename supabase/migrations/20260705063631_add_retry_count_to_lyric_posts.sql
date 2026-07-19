-- Add retry_count column to lyric_posts table if it doesn't exist
ALTER TABLE lyric_posts
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Add index for querying failed posts with retry count < 3
CREATE INDEX IF NOT EXISTS idx_lyric_posts_failed_retries
ON lyric_posts(status, retry_count)
WHERE status = 'failed' AND retry_count < 3;

-- Add backoff_until column to track when to next retry (for exponential backoff)
ALTER TABLE lyric_posts
ADD COLUMN IF NOT EXISTS backoff_until TIMESTAMPTZ;

-- Add index for backoff queries
CREATE INDEX IF NOT EXISTS idx_lyric_posts_backoff
ON lyric_posts(backoff_until)
WHERE status = 'failed' AND backoff_until IS NOT NULL;
