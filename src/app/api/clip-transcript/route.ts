// FriendlyTeaching.cl — Friendlyflix: YouTube captions fetcher
//
// GET /api/clip-transcript?videoId=XXX&lang=en
//
// Tries YouTube's unofficial timedtext endpoint to pull captions for a
// public video. Returns { lines: [{ start, dur, text }] } on success or
// { error } if the video has no public captions in that language.
// The teacher can then prefill the dialogue + timings array in the slide
// editor; if this fails, they paste manually.
import { NextRequest, NextResponse } from 'next/server';

interface Caption { start: number; dur: number; text: string }

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function parseTimedTextXml(xml: string): Caption[] {
  const out: Caption[] = [];
  // <text start="123.45" dur="2.1">Hello world</text>
  const re = /<text\s+start="([\d.]+)"\s+dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const start = parseFloat(m[1]);
    const dur   = parseFloat(m[2]);
    const text  = decodeEntities(m[3].replace(/<[^>]+>/g, '').trim());
    if (text) out.push({ start, dur, text });
  }
  return out;
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  const lang    = req.nextUrl.searchParams.get('lang') ?? 'en';
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId' }, { status: 400 });
  }

  const tryFetch = async (params: string): Promise<Caption[] | null> => {
    try {
      const res = await fetch(`https://www.youtube.com/api/timedtext?${params}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (FriendlyTeaching CaptionsFetcher)' },
      });
      if (!res.ok) return null;
      const xml = await res.text();
      if (!xml || xml.length < 30) return null;
      const lines = parseTimedTextXml(xml);
      return lines.length > 0 ? lines : null;
    } catch {
      return null;
    }
  };

  // Try in order: manual captions in requested lang, auto-generated in lang,
  // English fallback.
  const attempts = [
    `lang=${lang}&v=${videoId}`,
    `lang=${lang}&v=${videoId}&kind=asr`,
  ];
  if (lang !== 'en') {
    attempts.push(`lang=en&v=${videoId}`);
    attempts.push(`lang=en&v=${videoId}&kind=asr`);
  }

  for (const params of attempts) {
    const lines = await tryFetch(params);
    if (lines) {
      return NextResponse.json({ videoId, lang, lines, source: params.includes('kind=asr') ? 'auto' : 'manual' });
    }
  }

  return NextResponse.json({ error: 'No captions found for this video' }, { status: 404 });
}
