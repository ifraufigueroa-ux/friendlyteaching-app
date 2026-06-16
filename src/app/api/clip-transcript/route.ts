// FriendlyTeaching.cl — Friendlyflix: YouTube captions fetcher
//
// GET /api/clip-transcript?videoId=XXX&lang=en
//
// The direct `youtube.com/api/timedtext` endpoint is unreliable now:
// YouTube returns empty XML for most public videos unless you discover
// the signed `baseUrl` of each caption track from the player response
// first. So we:
//   1. Fetch the watch page HTML
//   2. Pull `ytInitialPlayerResponse` (or `playerResponse`) from it
//   3. Walk to `captions.playerCaptionsTracklistRenderer.captionTracks`
//   4. Pick by language (requested → English fallback → first track)
//   5. Fetch the track's signed baseUrl — that one returns the XML
//
// Falls back to the legacy unsigned endpoint as a last resort.
import { NextRequest, NextResponse } from 'next/server';

interface CaptionLine { start: number; dur: number; text: string }
interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;            // 'asr' for auto-generated, else manual
  name?: { simpleText?: string };
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function parseTimedTextXml(xml: string): CaptionLine[] {
  const out: CaptionLine[] = [];
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

// json3 format: { events: [{ tStartMs, dDurationMs, segs: [{utf8}] }] }
interface Json3Event { tStartMs?: number; dDurationMs?: number; segs?: { utf8?: string }[] }
function parseJson3(raw: string): CaptionLine[] {
  try {
    const obj = JSON.parse(raw) as { events?: Json3Event[] };
    const out: CaptionLine[] = [];
    for (const ev of obj.events ?? []) {
      if (typeof ev.tStartMs !== 'number' || !ev.segs) continue;
      const text = ev.segs.map(s => s.utf8 ?? '').join('').replace(/\n/g, ' ').trim();
      if (!text) continue;
      out.push({
        start: ev.tStartMs / 1000,
        dur:   (ev.dDurationMs ?? 0) / 1000,
        text:  decodeEntities(text),
      });
    }
    return out;
  } catch { return []; }
}

// Try json3 first (more reliable from server IPs) then fall back to the
// classic XML format. Some Vercel/AWS IPs receive empty XML responses
// from the default endpoint but valid JSON when ?fmt=json3 is forced.
async function fetchTrackContent(baseUrl: string, debug?: { logs: string[] }): Promise<CaptionLine[] | null> {
  const tryFmt = async (url: string, parser: (s: string) => CaptionLine[], label: string): Promise<CaptionLine[] | null> => {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.youtube.com/',
          'Origin': 'https://www.youtube.com',
          'Cookie': 'CONSENT=YES+cb; SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjA1X3AwGgJlbiACGgYIgL_NpwY',
        },
      });
      const body = await res.text();
      debug?.logs.push(`${label}: status=${res.status} len=${body.length} head=${body.slice(0, 80).replace(/\s+/g, ' ')}`);
      if (!res.ok) return null;
      if (!body || body.length < 20) return null;
      const lines = parser(body);
      return lines.length > 0 ? lines : null;
    } catch (err) {
      debug?.logs.push(`${label}: throw ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  };

  // The baseUrl already carries a `fmt=` for some videos. Strip it and try
  // both json3 and srv1 (XML) explicitly.
  const cleanBase = baseUrl.replace(/&fmt=[^&]*/g, '');

  // 1. json3 (modern, JSON)
  const json3Url = `${cleanBase}${cleanBase.includes('?') ? '&' : '?'}fmt=json3`;
  const j = await tryFmt(json3Url, parseJson3, 'json3');
  if (j) return j;

  // 2. Classic XML (srv1)
  const xmlUrl = `${cleanBase}${cleanBase.includes('?') ? '&' : '?'}fmt=srv1`;
  const x = await tryFmt(xmlUrl, parseTimedTextXml, 'srv1');
  if (x) return x;

  // 3. Raw baseUrl (whatever YouTube defaults to)
  const r1 = await tryFmt(baseUrl, parseTimedTextXml, 'raw-xml');
  if (r1) return r1;
  const r2 = await tryFmt(baseUrl, parseJson3, 'raw-json');
  if (r2) return r2;

  return null;
}

// Extract a balanced JSON object starting at the given `{` index.
// Walks character by character tracking brace depth + string state so
// we don't stop at a `}` that lives inside a quoted string.
function extractBalancedJson(s: string, startIdx: number): string | null {
  if (s[startIdx] !== '{') return null;
  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = startIdx; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return s.slice(startIdx, i + 1);
    }
  }
  return null;
}

// Pull captionTracks from the watch page HTML. The player response JSON
// is embedded as `ytInitialPlayerResponse = {...};` (modern) or
// `"playerResponse":"...escaped JSON..."` (older). We balance braces
// manually because regex can't match nested structures.
function extractCaptionTracks(html: string): CaptionTrack[] {
  const candidates: string[] = [];

  // Modern: ytInitialPlayerResponse = { ... };
  const m1 = html.match(/ytInitialPlayerResponse\s*=\s*\{/);
  if (m1 && typeof m1.index === 'number') {
    const braceIdx = html.indexOf('{', m1.index);
    const json = extractBalancedJson(html, braceIdx);
    if (json) candidates.push(json);
  }

  // Old-style: "playerResponse":"{\"...\"}" (escaped string).
  const m2 = html.match(/"playerResponse"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (m2) {
    try {
      const unescaped = JSON.parse(`"${m2[1]}"`);
      candidates.push(unescaped);
    } catch { /* ignore */ }
  }

  for (const raw of candidates) {
    try {
      const obj = JSON.parse(raw);
      const tracks: CaptionTrack[] | undefined =
        obj?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (Array.isArray(tracks) && tracks.length > 0) return tracks;
    } catch { /* try next */ }
  }
  return [];
}

function pickTrack(tracks: CaptionTrack[], wantLang: string): CaptionTrack | null {
  if (tracks.length === 0) return null;
  // 1. Manual track in requested language
  const manualLang = tracks.find(t => t.languageCode === wantLang && t.kind !== 'asr');
  if (manualLang) return manualLang;
  // 2. Any track (incl. ASR) in requested language
  const anyLang = tracks.find(t => t.languageCode === wantLang);
  if (anyLang) return anyLang;
  // 3. Manual English
  const manualEn = tracks.find(t => t.languageCode === 'en' && t.kind !== 'asr');
  if (manualEn) return manualEn;
  // 4. Any English
  const anyEn = tracks.find(t => t.languageCode === 'en');
  if (anyEn) return anyEn;
  // 5. First track available
  return tracks[0];
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  const lang    = req.nextUrl.searchParams.get('lang') ?? 'en';
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId' }, { status: 400 });
  }

  // ── Path A: watch page → player response → track baseUrl → XML ───
  try {
    const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
      headers: {
        'User-Agent': UA,
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (watchRes.ok) {
      const html = await watchRes.text();
      const tracks = extractCaptionTracks(html);
      const track = pickTrack(tracks, lang);
      const debug = req.nextUrl.searchParams.get('debug') === '1' ? { logs: [] as string[] } : undefined;
      if (track) {
        const lines = await fetchTrackContent(track.baseUrl, debug);
        if (lines && lines.length > 0) {
          return NextResponse.json({
            videoId,
            lang: track.languageCode,
            source: track.kind === 'asr' ? 'auto' : 'manual',
            trackName: track.name?.simpleText,
            availableLanguages: tracks.map(t => ({
              lang: t.languageCode,
              kind: t.kind ?? 'manual',
              name: t.name?.simpleText,
            })),
            lines,
            ...(debug ? { debug: debug.logs } : {}),
          });
        }
      }
      // If we got tracks but couldn't fetch the XML, return helpful info.
      if (tracks.length > 0) {
        return NextResponse.json({
          error: `Found ${tracks.length} caption track(s) but the XML fetch failed. Available: ${tracks.map(t => `${t.languageCode}${t.kind === 'asr' ? '(auto)' : ''}`).join(', ')}`,
          ...(debug ? { debug: debug.logs, baseUrl: track?.baseUrl } : {}),
        }, { status: 404 });
      }
    }
  } catch (err) {
    console.warn('[clip-transcript] watch page path failed:', err);
  }

  // ── Path B: legacy direct timedtext (last resort) ─────────────────
  const attempts = [
    `lang=${lang}&v=${videoId}`,
    `lang=${lang}&v=${videoId}&kind=asr`,
  ];
  if (lang !== 'en') {
    attempts.push(`lang=en&v=${videoId}`);
    attempts.push(`lang=en&v=${videoId}&kind=asr`);
  }
  for (const params of attempts) {
    const lines = await fetchTrackContent(`https://www.youtube.com/api/timedtext?${params}`);
    if (lines) {
      return NextResponse.json({
        videoId,
        lang,
        lines,
        source: params.includes('kind=asr') ? 'auto' : 'manual',
      });
    }
  }

  return NextResponse.json({
    error: 'No captions found for this video. The owner may have disabled captions or this video has no caption tracks.',
  }, { status: 404 });
}
