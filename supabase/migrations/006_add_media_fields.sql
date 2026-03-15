-- =====================================================
-- ADD MEDIA FIELDS TO EVENTS TABLE
-- Adds media_url and media_type for news article images/videos
-- =====================================================

ALTER TABLE events
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video'));

-- Partial index for quick lookup of events that have media
CREATE INDEX IF NOT EXISTS events_media_url_idx ON events (media_url) WHERE media_url IS NOT NULL;

COMMENT ON COLUMN events.media_url IS 'URL of an image or video associated with this event';
COMMENT ON COLUMN events.media_type IS 'Type of media: image or video';
