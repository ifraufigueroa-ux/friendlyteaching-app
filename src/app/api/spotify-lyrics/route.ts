// FriendlyTeaching.cl — Synced Lyrics API (kept at /api/spotify-lyrics for backwards compat)
//
// Tries multiple providers in order and returns the first hit:
//   1. Spotify color-lyrics (gated by EXPERIMENTAL_SPOTIFY_TOTP=1).
//      Currently Spotify blocks server-side access without a constantly-rotated
//      TOTP secret, so it stays disabled by default. The code path is kept so
//      we can flip the switch the moment we have a working TOTP cipher.
//   2. lrclib.net — public, no auth, decent coverage. Tries multiple
//      normalised queries (without "(feat ...)", main-artist-only, free text).
//   3. Musixmatch desktop API — public usertoken-based endpoint. Less stable
//      but covers tracks lrclib doesn't have.
//
// The response shape stays { syncType, lines } so existing clients keep
// working. An extra "source" field tells the debug overlay which provider hit.
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';

interface SyncedLine {
  startTimeMs: string;
  words: string;
  endTimeMs?: string;
  syllables?: { startTimeMs: string; text: string }[];
}

interface ProviderResult {
  syncType: string;
  lines: SyncedLine[];
  source: 'spotify' | 'lrclib' | 'lrclib-search' | 'musixmatch';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(feat\.?[^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\sfeat\.?\s.+$/gi, '')
    .replace(/\swith\s.+$/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mainArtist(artist: string): string {
  return artist.split(/[,&]|feat\.?|with|x | x |\bft\.?\b/i)[0].trim();
}

// Parse [mm:ss.xx] LRC text to SyncedLine[]. Fills endTimeMs from next line.
function parseLrcText(lrc: string): SyncedLine[] {
  const out: SyncedLine[] = [];
  for (const raw of lrc.split('\n')) {
    const m = raw.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/);
    if (!m) continue;
    const seconds = parseInt(m[1], 10) * 60 + parseFloat(m[2]);
    const text = m[3].trim();
    if (!text) continue;
    out.push({ startTimeMs: String(Math.round(seconds * 1000)), words: text });
  }
  for (let i = 0; i < out.length - 1; i++) {
    out[i].endTimeMs = out[i + 1].startTimeMs;
  }
  return out;
}

// ── Provider 1: Spotify color-lyrics (gated) ─────────────────────────────────

const ACCOUNTS_URL  = 'https://accounts.spotify.com/api/token';
const SEARCH_URL    = 'https://api.spotify.com/v1/search';
const LYRICS_URL    = 'https://spclient.wg.spotify.com/color-lyrics/v2/track';

let searchCache: { token: string; expiresAt: number } | null = null;
let webCache:    { token: string; expiresAt: number } | null = null;

async function getSearchToken(): Promise<string> {
  const directToken = process.env.SPOTIFY_ACCESS_TOKEN;
  if (directToken) return directToken;
  if (searchCache && Date.now() < searchCache.expiresAt - 30_000) return searchCache.token;

  const id      = process.env.SPOTIFY_CLIENT_ID?.trim();
  const secret  = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN?.trim();
  if (!id || !secret || !refresh) throw new Error('Spotify env vars not configured');

  const res = await fetch(ACCOUNTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
  });
  if (!res.ok) throw new Error(`Token refresh failed ${res.status}`);
  const data = await res.json() as { access_token: string; expires_in: number };
  searchCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return searchCache.token;
}

async function searchTrackId(title: string, artist: string, token: string): Promise<string | null> {
  const q   = `track:${title}${artist ? ` artist:${artist}` : ''}`;
  const url = `${SEARCH_URL}?q=${encodeURIComponent(q)}&type=track&limit=1&market=US`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const data = await res.json() as { tracks?: { items?: { id: string }[] } };
  return data.tracks?.items?.[0]?.id ?? null;
}

// TOTP — only used when EXPERIMENTAL_SPOTIFY_TOTP=1 AND a fresh cipher is set.
const SPOTIFY_TOTP_CIPHER = [12, 56, 76, 33, 88, 44, 88, 33, 78, 78, 11, 66, 22, 22, 55, 69, 54];
const SPOTIFY_TOTP_VERSION = 5;

function generateTotp(): { code: string; ts: number } {
  const ts = Date.now();
  const processed = SPOTIFY_TOTP_CIPHER.map((b, i) => String(b ^ ((i % 33) + 9))).join('');
  const secret = Buffer.from(processed, 'utf8');
  const counter = Math.floor(ts / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const num = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1_000_000;
  return { code: num.toString().padStart(6, '0'), ts };
}

async function getWebPlayerToken(): Promise<string> {
  if (webCache && Date.now() < webCache.expiresAt - 30_000) return webCache.token;
  const sp_dc = process.env.SPOTIFY_SP_DC?.trim();
  if (!sp_dc) throw new Error('SPOTIFY_SP_DC not configured');

  const { code, ts } = generateTotp();
  const url = `https://open.spotify.com/get_access_token`
    + `?reason=transport&productType=web_player`
    + `&totp=${code}&totpServer=${code}&totpVer=${SPOTIFY_TOTP_VERSION}&ts=${ts}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'App-Platform': 'WebPlayer',
      'Accept': 'application/json',
      'Cookie': `sp_dc=${sp_dc}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Web-player token failed ${res.status}`);
  const data = await res.json() as { accessToken?: string; accessTokenExpirationTimestampMs?: number; isAnonymous?: boolean };
  if (!data.accessToken || data.isAnonymous) throw new Error('Web-player token anonymous');
  webCache = {
    token: data.accessToken,
    expiresAt: data.accessTokenExpirationTimestampMs ?? Date.now() + 3500_000,
  };
  return webCache.token;
}

async function trySpotify(title: string, artist: string): Promise<ProviderResult | null> {
  if (process.env.EXPERIMENTAL_SPOTIFY_TOTP !== '1') return null;
  const searchToken = await getSearchToken();
  const trackId     = await searchTrackId(title, artist, searchToken);
  if (!trackId) return null;
  const webToken = await getWebPlayerToken();
  const res = await fetch(
    `${LYRICS_URL}/${trackId}?format=json&vocalRemoval=false&market=from_token`,
    {
      headers: {
        Authorization: `Bearer ${webToken}`,
        'App-Platform': 'WebPlayer',
        'User-Agent': UA,
        Accept: 'application/json',
      },
      cache: 'no-store',
    },
  );
  if (!res.ok) return null;
  const data = await res.json() as { lyrics?: { syncType: string; lines: SyncedLine[] } };
  if (!data.lyrics?.lines?.length) return null;
  return { syncType: data.lyrics.syncType, lines: data.lyrics.lines, source: 'spotify' };
}

// ── Provider 2: lrclib.net ───────────────────────────────────────────────────

async function tryLrclib(title: string, artist: string): Promise<ProviderResult | null> {
  // 1. Try /api/get with three artist variants — exact, normalised, main-only.
  const getQueries: { t: string; a: string }[] = [
    { t: title, a: artist },
    { t: normalize(title), a: normalize(artist) },
    { t: normalize(title), a: mainArtist(artist) },
  ];

  for (const q of getQueries) {
    if (!q.t || !q.a) continue;
    const params = new URLSearchParams({ track_name: q.t, artist_name: q.a });
    const r = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers: { 'User-Agent': 'friendlyteaching.cl (synced-lyrics)' },
      cache: 'no-store',
    });
    if (!r.ok) continue;
    const d = await r.json() as { syncedLyrics?: string } | null;
    if (!d?.syncedLyrics) continue;
    const lines = parseLrcText(d.syncedLyrics);
    if (lines.length > 2) return { syncType: 'LINE_SYNCED', lines, source: 'lrclib' };
  }

  // 2. Try /api/search — returns a list of candidates, pick best with synced lyrics.
  const searchQueries: { params: URLSearchParams }[] = [
    { params: new URLSearchParams({ track_name: normalize(title), artist_name: mainArtist(artist) }) },
    { params: new URLSearchParams({ q: `${normalize(title)} ${mainArtist(artist)}` }) },
    { params: new URLSearchParams({ q: normalize(title) }) },
  ];

  for (const q of searchQueries) {
    const r = await fetch(`https://lrclib.net/api/search?${q.params}`, {
      headers: { 'User-Agent': 'friendlyteaching.cl (synced-lyrics)' },
      cache: 'no-store',
    });
    if (!r.ok) continue;
    const list = await r.json() as Array<{ syncedLyrics?: string; artistName?: string; trackName?: string }>;
    if (!Array.isArray(list)) continue;
    // Prefer candidates whose artist matches our main artist, then any with synced lyrics.
    const ma = mainArtist(artist).toLowerCase();
    const ranked = list
      .filter(it => it.syncedLyrics)
      .sort((a, b) => {
        const am = (a.artistName ?? '').toLowerCase().includes(ma) ? 0 : 1;
        const bm = (b.artistName ?? '').toLowerCase().includes(ma) ? 0 : 1;
        return am - bm;
      });
    const hit = ranked[0];
    if (hit?.syncedLyrics) {
      const lines = parseLrcText(hit.syncedLyrics);
      if (lines.length > 2) return { syncType: 'LINE_SYNCED', lines, source: 'lrclib-search' };
    }
  }
  return null;
}

// ── Provider 3: Musixmatch desktop API ───────────────────────────────────────

let mxmTokenCache: { token: string; expiresAt: number } | null = null;
const MXM_BASE = 'https://apic-desktop.musixmatch.com/ws/1.1';
const MXM_APP  = 'web-desktop-app-v1.0';

async function getMxmUserToken(): Promise<string> {
  if (mxmTokenCache && Date.now() < mxmTokenCache.expiresAt) return mxmTokenCache.token;
  const url = `${MXM_BASE}/token.get?app_id=${MXM_APP}&t=${Date.now()}`;
  const r = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Cookie: 'AWSELBCORS=0; AWSELB=0',
    },
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`mxm token http ${r.status}`);
  const d = await r.json() as { message?: { body?: { user_token?: string }; header?: { status_code?: number } } };
  const tok = d?.message?.body?.user_token;
  if (!tok || tok.startsWith('UpgradeOnly')) throw new Error('mxm token captcha/upgrade');
  mxmTokenCache = { token: tok, expiresAt: Date.now() + 9 * 60 * 1000 };
  return tok;
}

async function tryMusixmatch(title: string, artist: string): Promise<ProviderResult | null> {
  const userToken = await getMxmUserToken();
  const params = new URLSearchParams({
    q_track: title,
    q_artist: artist,
    app_id: MXM_APP,
    format: 'json',
    subtitle_format: 'lrc',
    usertoken: userToken,
  });
  const r = await fetch(`${MXM_BASE}/macro.subtitles.get?${params}`, {
    headers: {
      'User-Agent': UA,
      Cookie: 'AWSELBCORS=0; AWSELB=0',
    },
    cache: 'no-store',
  });
  if (!r.ok) return null;
  const d = await r.json() as {
    message?: { body?: { macro_calls?: Record<string, {
      message?: { body?: { subtitle_list?: { subtitle?: { subtitle_body?: string } }[] } };
    }> } };
  };
  const lrc = d?.message?.body?.macro_calls?.['track.subtitles.get']
    ?.message?.body?.subtitle_list?.[0]?.subtitle?.subtitle_body;
  if (!lrc) return null;
  const lines = parseLrcText(lrc);
  if (lines.length < 3) return null;
  return { syncType: 'LINE_SYNCED', lines, source: 'musixmatch' };
}

// ── GET handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title  = searchParams.get('title') ?? '';
  const artist = searchParams.get('artist') ?? '';
  const debug  = searchParams.get('debug') === '1';

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const tried: Record<string, string> = {};
  const providers: Array<[string, () => Promise<ProviderResult | null>]> = [
    ['spotify',    () => trySpotify(title, artist)],
    ['lrclib',     () => tryLrclib(title, artist)],
    ['musixmatch', () => tryMusixmatch(title, artist)],
  ];

  for (const [name, fn] of providers) {
    try {
      const res = await fn();
      if (res) {
        const payload = debug
          ? { syncType: res.syncType, lines: res.lines, source: res.source, tried }
          : { syncType: res.syncType, lines: res.lines, source: res.source };
        return NextResponse.json(payload, {
          headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' },
        });
      }
      tried[name] = 'no-result';
    } catch (e) {
      tried[name] = (e instanceof Error ? e.message : String(e)).slice(0, 160);
    }
  }

  return NextResponse.json({ error: 'no synced lyrics', tried }, { status: 404 });
}
