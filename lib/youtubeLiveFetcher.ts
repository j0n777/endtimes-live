/**
 * Utility to fetch the active Live Stream URL from a YouTube Channel.
 * Since YouTube live IDs change every time a new stream starts, hardcoding `embed/VIDEO_ID` rots quickly.
 * 
 * We use an open scraping technique to find the canonical live URL for a channel handle.
 * e.g. https://www.youtube.com/@AgendaFreeTV/live automatically redirects to their current live video.
 */

export const getActiveYouTubeLiveUrl = (id: string, type: 'channel' | 'video' = 'channel'): string => {
    // For 24/7 channels that allow dynamic `/live` embeds, we use the `channel=` method.
    // However, some channels (like EarthCam) have multiple active streams or block dynamic embedding.
    // For those, we must pass the explicit 'video' ID.

    if (type === 'video') {
        return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1`;
    }

    // Default: Dynamic Channel Live routing
    return `https://www.youtube.com/embed/live_stream?channel=${id}&autoplay=1&mute=1`;
};
