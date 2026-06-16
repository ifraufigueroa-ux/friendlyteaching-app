// FriendlyTeaching.cl — YouTube transcript paste parser
//
// Accepts text copied from YouTube's transcript panel (3-dots → "Show
// transcript") in the common formats and returns a list of timed lines.
//
// Supported shapes (all may appear within the same paste):
//   1) Timestamp on its own line, text on the next line:
//        0:12
//        Hello world
//        0:15
//        How are you
//   2) Timestamp and text on the same line, separated by spaces/tab:
//        0:12 Hello world
//        0:15 How are you
//   3) Hours included:
//        1:23:45 Hello world
//   4) [MM:SS] bracket prefix:
//        [0:12] Hello world

export interface ParsedTranscriptLine { time: number; text: string }

const TS_RE_PURE = /^(?:\[)?\s*(\d{1,2}:)?(\d{1,2}):(\d{2})\s*(?:\])?$/;
const TS_RE_LINE = /^(?:\[)?\s*(\d{1,2}:)?(\d{1,2}):(\d{2})\s*(?:\])?\s+(.+)$/;

function tsToSeconds(h: string | undefined, m: string, s: string): number {
  return (h ? parseInt(h.replace(':', ''), 10) * 3600 : 0)
       + parseInt(m, 10) * 60
       + parseInt(s, 10);
}

export function parseYouTubeTranscript(raw: string): ParsedTranscriptLine[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const out: ParsedTranscriptLine[] = [];

  let pendingTime: number | null = null;
  let pendingText: string[] = [];

  function flush() {
    if (pendingTime != null && pendingText.length > 0) {
      out.push({ time: pendingTime, text: pendingText.join(' ').trim() });
    }
    pendingTime = null;
    pendingText = [];
  }

  for (const ln of lines) {
    // Case 2/3/4: timestamp + text on one line
    const m2 = ln.match(TS_RE_LINE);
    if (m2) {
      flush();
      out.push({ time: tsToSeconds(m2[1], m2[2], m2[3]), text: m2[4].trim() });
      continue;
    }
    // Case 1: timestamp only
    const m1 = ln.match(TS_RE_PURE);
    if (m1) {
      flush();
      pendingTime = tsToSeconds(m1[1], m1[2], m1[3]);
      continue;
    }
    // Text continuation for a previously seen timestamp
    if (pendingTime != null) {
      pendingText.push(ln);
    }
  }
  flush();

  // De-duplicate near-identical adjacent lines (YouTube sometimes repeats
  // a segment as it scrolls into view).
  const dedup: ParsedTranscriptLine[] = [];
  for (const ln of out) {
    const prev = dedup[dedup.length - 1];
    if (prev && prev.text === ln.text && Math.abs(prev.time - ln.time) < 1) continue;
    dedup.push(ln);
  }

  return dedup.sort((a, b) => a.time - b.time);
}
