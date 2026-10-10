const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/** Convert a YouTube URL or raw 11-character video ID to a safe embed ID. */
export function extractYoutubeVideoId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (!input) return null;
  if (VIDEO_ID_PATTERN.test(input)) return input;

  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    const isYoutubeHost = hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'youtube-nocookie.com';
    const isShortHost = hostname === 'youtu.be';
    if (!isYoutubeHost && !isShortHost) return null;

    let candidate = '';
    if (isShortHost) {
      candidate = url.pathname.split('/').filter(Boolean)[0] || '';
    } else if (url.pathname === '/watch') {
      candidate = url.searchParams.get('v') || '';
    } else {
      const parts = url.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live', 'v'].includes(parts[0] || '')) candidate = parts[1] || '';
    }

    return VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}
