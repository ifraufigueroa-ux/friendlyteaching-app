// Friendlistenings® — standalone HTML exporter.
//
// Packages a lesson + its generated audio into a single self-contained .html
// file the teacher can send over WhatsApp / email. The audio MP3 is inlined
// as a base64 data URI, and a vanilla-JS runtime inside the file reproduces
// the 8-step CLT arc (progress bar, question locking, transcript toggle,
// completion recap) so the student needs nothing but a browser.
//
// The runtime is pre-rendered as plain strings — no bundler, no React, no
// network calls once downloaded. Everything the runner reads comes from the
// `LESSON` and `AUDIO_URI` globals the server-side page bakes into the file.

import type { FLLesson } from '@/types/friendlistenings';

export interface ExportProgress {
  (message: string): void;
}

export async function exportLessonToHTML(
  lesson:      FLLesson,
  audioUrl:    string | null,
  onProgress?: ExportProgress,
): Promise<void> {
  let audioDataUri: string | null = null;
  if (audioUrl) {
    onProgress?.('Downloading audio…');
    // Firebase Storage blocks cross-origin fetches — route through our
    // same-origin audio proxy so the browser actually hands us the bytes.
    const proxied = `/api/audio-proxy?url=${encodeURIComponent(audioUrl)}`;
    const res = await fetch(proxied);
    if (!res.ok) throw new Error(`Audio fetch failed: HTTP ${res.status}`);
    const blob = await res.blob();
    onProgress?.(`Encoding audio (${(blob.size / 1024 / 1024).toFixed(1)} MB)…`);
    audioDataUri = await blobToDataURL(blob);
  }

  onProgress?.('Building HTML…');
  const html = buildHTML(lesson, audioDataUri);

  const htmlBlob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url      = URL.createObjectURL(htmlBlob);
  const a        = document.createElement('a');
  a.href         = url;
  a.download     = `${lesson.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Safari needs the URL alive for a tick after click.
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  onProgress?.('Done.');
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

// ─── Page template ──────────────────────────────────────────

function buildHTML(lesson: FLLesson, audioDataUri: string | null): string {
  // Escape `</` inside JSON so a stray close-script in lesson text can't
  // break out of the inline <script>.
  const lessonJSON = JSON.stringify(lesson).replace(/</g, '\\u003c');
  const audioJSON  = JSON.stringify(audioDataUri).replace(/</g, '\\u003c');
  const title      = escapeHTML(lesson.title);
  const subtitle   = escapeHTML(lesson.subtitle);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · Friendlistenings</title>
<meta name="description" content="${subtitle}">
<style>${PAGE_CSS}</style>
</head>
<body>
<div id="app"></div>
<script>
const LESSON    = ${lessonJSON};
const AUDIO_URI = ${audioJSON};
${PAGE_JS}
</script>
</body>
</html>`;
}

function escapeHTML(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Embedded CSS ───────────────────────────────────────────

const PAGE_CSS = `
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: #2E2A33;
  background: linear-gradient(135deg, #E8D8F5 0%, #FFFDF5 100%);
  min-height: 100vh;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
button { font: inherit; cursor: pointer; }
.serif { font-family: 'Fraunces', 'Playfair Display', Georgia, 'Times New Roman', serif; }

/* layout */
.container { max-width: 760px; margin: 0 auto; padding: 24px 16px 80px; }
.header    { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.eyebrow   { font-size: 11px; font-weight: 900; letter-spacing: .25em; text-transform: uppercase; color: #9B72B8; margin: 0 0 2px; }
.h-title   { font-family: 'Fraunces', Georgia, serif; font-size: 20px; font-weight: 700; margin: 0; line-height: 1.15; }

/* progress bar */
.progress  { display: flex; gap: 6px; margin-bottom: 24px; }
.progress button {
  flex: 1; height: 6px; border-radius: 999px; border: 0; padding: 0; cursor: pointer;
  background: #ffffff; transition: background-color .15s ease;
}
.progress button.done   { background: #9B72B8; }
.progress button.active { background: rgba(155, 114, 184, 0.6); }

/* step card */
.card {
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 10px 30px -16px rgba(74, 32, 96, 0.25);
  overflow: hidden;
}
.card-head {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid #E8D8F5;
}
.step-badge {
  flex-shrink: 0; width: 40px; height: 40px; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-family: 'Fraunces', Georgia, serif; font-size: 18px; font-weight: 900;
}
.step-label { font-size: 10px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; color: #4A2060; margin: 0 0 2px; }
.step-title { font-family: 'Fraunces', Georgia, serif; font-size: 22px; font-weight: 700; margin: 0; line-height: 1.2; }

.audio-slot { padding: 12px 24px; background: linear-gradient(90deg, #E8D8F5, #FBE7F1); border-bottom: 1px solid #E8D8F5; }
.audio-slot audio { width: 100%; }
.audio-missing { padding: 12px 24px; background: #FCF7D8; border-bottom: 1px solid #E8D8F5; display: flex; align-items: center; gap: 10px; }
.audio-missing .m-title { font-size: 12px; font-weight: 700; color: #4A2060; margin: 0; }
.audio-missing .m-sub   { font-size: 11px; color: #7A7387; margin: 2px 0 0; }

/* speed pills (both inline and dock) */
.speed-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.speed-row .label { font-size: 10px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; color: #4A2060; }
.speed-pill {
  padding: 2px 10px; border-radius: 999px; border: 1px solid #E8D8F5;
  background: #fff; color: #4A2060; font-size: 11px; font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.speed-pill:hover { background: #F0E5FF; }
.speed-pill.active { background: #9B72B8; color: #fff; border-color: #9B72B8; }

/* floating audio dock */
.dock {
  position: fixed; top: 16px; left: 0; right: 0;
  display: flex; justify-content: center; padding: 0 12px;
  pointer-events: none; z-index: 30;
  opacity: 0; transform: translateY(-8px); visibility: hidden;
  transition: opacity .15s ease-out, transform .15s ease-out;
}
.dock.visible { opacity: 1; transform: translateY(0); visibility: visible; }
.dock-inner {
  pointer-events: auto;
  display: flex; align-items: center; gap: 12px;
  width: 100%; max-width: 760px;
  border-radius: 999px;
  border: 1px solid rgba(200, 168, 220, 0.7);
  background: rgba(240, 229, 255, 0.95);
  box-shadow: 0 10px 25px -10px rgba(74, 32, 96, 0.35);
  backdrop-filter: blur(8px);
  padding: 6px 12px 6px 6px;
}
.dock-play {
  width: 36px; height: 36px; border-radius: 999px; border: 0;
  background: #9B72B8; color: #fff; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.dock-play:hover { background: #4A2060; }
.dock-time { font-size: 10px; color: #4A2060; width: 32px; text-align: right; flex-shrink: 0; font-variant-numeric: tabular-nums; }
.dock-time.end { color: rgba(74, 32, 96, 0.7); text-align: left; }
.dock-scrub {
  position: relative; flex: 1; min-width: 60px; height: 8px; border-radius: 999px;
  background: rgba(155, 114, 184, 0.2); cursor: pointer;
}
.dock-scrub .bar { position: absolute; inset: 0; width: 0%; border-radius: 999px; background: #9B72B8; }
.dock-scrub:focus { outline: 2px solid rgba(155, 114, 184, 0.4); outline-offset: 2px; }
.dock-label {
  font-size: 9px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase;
  color: rgba(74, 32, 96, 0.8);
  max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  flex-shrink: 0;
}
.dock-speeds { display: flex; gap: 4px; flex-shrink: 0; }
.dock-speeds .speed-pill { font-size: 10px; padding: 1px 8px; }
@media (max-width: 640px) {
  .dock-label, .dock-speeds { display: none; }
}

.body { padding: 24px 24px; }
.body > * + * { margin-top: 20px; }
.prose { font-size: 15px; margin: 0; }

.tip {
  font-size: 12px; padding: 10px 14px; border-radius: 12px; line-height: 1.4;
  background: #FCF7D8; color: #6B5B00;
}
.tip.cyan { background: #E6F6F9; color: #1D5B67; }

/* grid helpers */
.grid-1 { display: grid; grid-template-columns: 1fr; gap: 12px; }
.grid-2 { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 640px) { .grid-2 { grid-template-columns: 1fr 1fr; } }

/* lead-in textareas */
.open-q {
  border-radius: 16px; border: 1px solid #E8D8F5; background: #FFFDF5; padding: 14px 16px;
}
.open-q .p { font-family: 'Fraunces', Georgia, serif; font-size: 16px; font-weight: 600; color: #4A2060; margin: 0 0 8px; }
.open-q .hint { font-size: 12px; color: #7A7387; font-style: italic; margin: 0 0 8px; }
.open-q textarea {
  width: 100%; padding: 10px 12px; border-radius: 12px; border: 2px solid #E8D8F5;
  background: #fff; font: inherit; color: #2E2A33; resize: vertical; min-height: 80px;
  transition: border-color .15s;
}
.open-q textarea:focus { outline: none; border-color: #9B72B8; }

/* vocab cards */
.vocab-card {
  text-align: left; border-radius: 16px; border: 1px solid #E8D8F5;
  background: linear-gradient(135deg, #FCF7D8, #fff);
  padding: 14px 16px; transition: box-shadow .15s;
}
.vocab-card:hover { box-shadow: 0 6px 16px -10px rgba(74, 32, 96, 0.35); }
.vocab-card .vhead { display: flex; justify-content: space-between; gap: 8px; align-items: start; }
.vocab-card .word { font-family: 'Fraunces', Georgia, serif; font-size: 18px; font-weight: 900; color: #4A2060; margin: 0; line-height: 1.15; }
.vocab-card .pos  { font-size: 10px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; color: #9B72B8; margin: 2px 0 0; }
.vocab-card .toggle { font-size: 10px; color: #7A7387; }
.vocab-card .face { margin-top: 8px; font-size: 14px; }
.vocab-card .face .example { font-style: italic; color: #2E2A33; }
.vocab-card .face .def { font-size: 12px; color: #7A7387; margin-top: 4px; }
.vocab-card .face .sounds { font-size: 11px; color: #9B72B8; font-weight: 600; margin-top: 4px; }

/* question blocks (shared) */
.qblock {
  border-radius: 16px; border: 1px solid #E8D8F5; background: #fff; padding: 14px 16px;
}
.qblock + .qblock { margin-top: 12px; }
.qblock .qprompt { font-family: 'Fraunces', Georgia, serif; font-size: 15px; font-weight: 600; color: #4A2060; margin: 0 0 10px; }
.qhint  { font-size: 11px; color: #7A7387; font-style: italic; margin: 0 0 6px; }

/* MCQ */
.opt {
  display: block; width: 100%; text-align: left;
  padding: 10px 12px; border-radius: 12px;
  border: 2px solid #E8D8F5; background: #fff; color: #2E2A33; font-size: 14px;
  transition: border-color .15s, background-color .15s;
}
.opt + .opt { margin-top: 8px; }
.opt:hover:not(:disabled) { border-color: #9B72B8; background: rgba(232, 216, 245, 0.3); }
.opt.picked { border-color: #9B72B8; background: rgba(232, 216, 245, 0.4); }
.opt.correct { border-color: #7BC67E; background: #EAF7EB; }
.opt.wrong   { border-color: #E87BAD; background: #FBE7F1; }
.opt.fade    { opacity: 0.5; }
.opt .k { font-weight: 900; color: #9B72B8; margin-right: 6px; }

/* True/False */
.tf-row { display: flex; gap: 8px; flex-wrap: wrap; }
.tf {
  padding: 8px 16px; border-radius: 999px; border: 2px solid #E8D8F5; background: #fff;
  color: #4A2060; font-size: 14px; font-weight: 700;
}
.tf:hover:not(:disabled) { border-color: #9B72B8; }
.tf.picked { border-color: #9B72B8; background: rgba(232, 216, 245, 0.4); }
.tf.correct { border-color: #7BC67E; background: #EAF7EB; }
.tf.wrong   { border-color: #E87BAD; background: #FBE7F1; }
.tf.fade    { opacity: 0.5; }

/* Gap fill */
.gap-input {
  display: inline-block; min-width: 92px; margin: 0 4px; padding: 2px 6px;
  border: 0; border-bottom: 2px solid #9B72B8; background: transparent;
  text-align: center; font: inherit; color: #2E2A33;
}
.gap-input:focus { outline: none; }
.gap-input.ok    { border-bottom-color: #7BC67E; color: #2F6B33; }
.gap-input.bad   { border-bottom-color: #E87BAD; color: #7A3B5F; }

/* Question action row */
.check-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 10px; }
.check-btn {
  padding: 6px 16px; border-radius: 999px; border: 0; color: #fff; background: #9B72B8;
  font-size: 12px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase;
}
.check-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.explain {
  flex: 1; min-width: 200px; font-size: 12px; color: #4A2060;
  background: rgba(232, 216, 245, 0.5); border-radius: 10px; padding: 8px 12px;
}
.explain.good { color: #2F6B33; background: rgba(234, 247, 235, 0.6); }
.explain.bad  { color: #7A3B5F; background: rgba(251, 231, 241, 0.6); }
.redo-btn {
  background: none; border: 0; padding: 0; color: #7A7387; font-size: 11px; font-weight: 700;
}
.redo-btn:hover { color: #4A2060; }

/* chunks */
.chunk-card {
  border-radius: 16px; border: 1px solid #E8D8F5;
  background: linear-gradient(135deg, #FBE7F1, #fff);
  padding: 14px 16px;
}
.chunk-card + .chunk-card { margin-top: 10px; }
.chunk-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.chunk-word { font-family: 'Fraunces', Georgia, serif; font-size: 18px; font-weight: 900; color: #4A2060; }
.chunk-cat {
  font-size: 9px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase;
  color: #9B72B8; background: #fff; border: 1px solid #E8D8F5; border-radius: 999px;
  padding: 2px 8px;
}
.chunk-gloss   { font-size: 14px; margin: 6px 0; }
.chunk-example { font-size: 14px; font-style: italic; background: rgba(255, 255, 255, 0.8); border: 1px solid #E8D8F5; border-radius: 10px; padding: 8px 12px; margin: 6px 0; }
.chunk-notice  { font-size: 12px; color: #7A7387; margin: 0; }
.chunk-notice .label { color: #9B72B8; font-weight: 600; }

/* transcript */
.transcript-toggle {
  background: none; border: 0; padding: 0; color: #9B72B8; font-size: 12px; font-weight: 700;
}
.transcript-toggle:hover { color: #4A2060; }
.transcript {
  border-radius: 16px; border: 1px solid #E8D8F5; background: #FFFDF5;
  padding: 12px 16px; max-height: 320px; overflow-y: auto;
}
.transcript .line { display: flex; gap: 12px; margin: 6px 0; }
.transcript .who  { flex-shrink: 0; width: 70px; font-size: 10px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; color: #9B72B8; }
.transcript .what { font-size: 13px; color: #2E2A33; }

/* listen-for callout */
.listen-for {
  border-radius: 16px; border: 1px solid #EAF7EB; background: rgba(234, 247, 235, 0.6);
  padding: 12px 16px;
}
.listen-for p { font-size: 11px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; color: #4A2060; margin: 0 0 6px; }
.listen-for ul { margin: 0; padding-left: 20px; font-size: 14px; }
.listen-for li + li { margin-top: 2px; }

/* production */
.prod-task {
  border-radius: 20px; border: 2px solid #E87BAD; background: #FBE7F1;
  padding: 18px 20px;
}
.prod-task .lab { font-size: 11px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; color: #7A3B5F; margin: 0 0 4px; }
.prod-task .prompt { font-family: 'Fraunces', Georgia, serif; font-size: 18px; color: #4A2060; margin: 0; }

.target-chunks { border-radius: 16px; border: 1px solid #E8D8F5; background: #FFFDF5; padding: 12px 16px; }
.target-chunks p { font-size: 11px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; color: #9B72B8; margin: 0 0 8px; }
.target-chunks .chip {
  display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px;
  background: #fff; border: 2px solid #E8D8F5; font-size: 13px; font-weight: 600; color: #4A2060;
  margin: 0 6px 6px 0;
}

.prod-textarea {
  width: 100%; padding: 14px 16px; border-radius: 16px; border: 2px solid #E8D8F5;
  background: #fff; font: inherit; color: #2E2A33; resize: vertical; min-height: 180px;
  transition: border-color .15s;
}
.prod-textarea:focus { outline: none; border-color: #9B72B8; }
.word-count { font-size: 11px; color: #7A7387; text-align: right; margin: 4px 0 0; }

.speaking-stub {
  border: 2px dashed #9B72B8; border-radius: 16px; background: #fff; padding: 24px 16px; text-align: center;
}
.speaking-stub .big { font-size: 36px; margin: 0; }
.speaking-stub .title { font-size: 14px; font-weight: 600; color: #4A2060; margin: 6px 0 2px; }
.speaking-stub .sub { font-size: 12px; color: #7A7387; margin: 0; }

/* navigation */
.nav {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 20px; gap: 12px;
}
.nav button {
  display: inline-flex; align-items: center; gap: 6px;
  border: 0; padding: 10px 18px; border-radius: 999px; font-size: 13px; font-weight: 700;
  background: rgba(255, 255, 255, 0.8); color: #4A2060;
}
.nav button:hover:not(:disabled) { background: #fff; }
.nav button:disabled { opacity: 0.4; cursor: not-allowed; }
.nav .primary {
  background: #9B72B8; color: #fff; padding: 12px 24px;
  font-size: 13px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase;
  box-shadow: 0 10px 24px -14px rgba(74, 32, 96, 0.6);
}
.nav .primary.finish { background: #7BC67E; }
.nav .primary:active { transform: scale(0.97); }

.shortcuts {
  text-align: center; font-size: 11px; color: #7A7387; margin-top: 12px;
}

/* recap */
.recap-hero {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 24px;
  background: linear-gradient(90deg, #E8D8F5, #FBE7F1);
}
.recap-hero .avatar {
  width: 52px; height: 52px; border-radius: 999px; background: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 28px;
}
.recap-hero .lab { font-size: 11px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; color: #4A2060; margin: 0; }
.recap-hero .big { font-family: 'Fraunces', Georgia, serif; font-size: 22px; font-weight: 700; margin: 2px 0 0; }

.stat-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.stat-tile {
  border-radius: 16px; background: #fff; padding: 12px 10px; text-align: center;
  border: 1px solid rgba(155, 114, 184, 0.3);
}
.stat-tile .v { font-family: 'Fraunces', Georgia, serif; font-size: 22px; font-weight: 900; margin: 0; }
.stat-tile .l { font-size: 10px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; color: #7A7387; margin: 4px 0 0; }

.recap-list-title { font-size: 11px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; color: #9B72B8; margin: 20px 0 8px; padding-top: 16px; border-top: 1px solid #E8D8F5; }
.recap-chip {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
  border-radius: 999px; background: #FBE7F1; border: 2px solid #E8D8F5;
  font-size: 13px; font-weight: 600; color: #4A2060;
  margin: 0 6px 6px 0;
}
.recap-btn-row { display: flex; justify-content: space-between; align-items: center; margin-top: 18px; gap: 12px; flex-wrap: wrap; }
.recap-btn-row .restart {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 18px; border-radius: 999px; border: 0;
  background: rgba(255, 255, 255, 0.8); color: #4A2060; font-size: 13px; font-weight: 700;
}
.recap-btn-row .restart:hover { background: #fff; }

/* review bubble buttons */
.review-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 999px; border: 2px solid #E8D8F5;
  background: #fff; color: #4A2060; font-size: 12px; font-weight: 700;
  margin: 0 6px 6px 0;
}
.review-btn:hover { border-color: #9B72B8; }

/* small screens */
@media (max-width: 480px) {
  .container { padding: 16px 12px 60px; }
  .card-head { padding: 12px 16px; }
  .body { padding: 18px 16px; }
  .step-title { font-size: 19px; }
}
`;

// ─── Embedded runtime JS ────────────────────────────────────

const PAGE_JS = `
// ─── state ───
let idx = 0;
const state = { answers: {}, openText: {}, flipped: {}, transcript: false };

const STEP_META = {
  'lead-in':             { label: 'Lead-in',    color: '#E87BAD', icon: '💬' },
  'vocab':               { label: 'Vocab',      color: '#F9F0A8', icon: '📚' },
  'prediction':          { label: 'Predict',    color: '#7ED6E0', icon: '🔮' },
  'gist':                { label: 'Gist',       color: '#7BC67E', icon: '🎧' },
  'detail':              { label: 'Detail',     color: '#F4A261', icon: '🔍' },
  'language-awareness':  { label: 'Language',   color: '#9B72B8', icon: '✨' },
  'controlled-practice': { label: 'Practice',   color: '#9B72B8', icon: '🧩' },
  'production':          { label: 'Production', color: '#E87BAD', icon: '🎤' }
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function app() { return document.getElementById('app'); }

function go(i) {
  idx = Math.max(0, Math.min(LESSON.steps.length, i));
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── render shell ───
function render() {
  const root = app();
  root.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'container';
  root.appendChild(container);

  const done = idx >= LESSON.steps.length;
  container.innerHTML = renderHeader() + renderProgress(done);

  const content = document.createElement('div');
  if (done) content.innerHTML = renderRecap();
  else content.innerHTML = renderStepCard(LESSON.steps[idx]);
  container.appendChild(content);

  container.insertAdjacentHTML('beforeend', renderNav(done));

  bind();
  wireAudio();
}

function renderHeader() {
  return (
    '<div class="header">' +
      '<div style="flex:1; min-width:0">' +
        '<p class="eyebrow">' + esc(LESSON.level) + ' · Friendlistenings</p>' +
        '<h1 class="h-title">' + esc(LESSON.title) + '</h1>' +
      '</div>' +
    '</div>'
  );
}

function renderProgress(done) {
  const n = LESSON.steps.length;
  let html = '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + (done ? n : idx + 1) + '">';
  for (let i = 0; i < n; i++) {
    const meta = STEP_META[LESSON.steps[i].kind];
    const cls = i < idx || done ? 'done' : i === idx ? 'active' : '';
    html += '<button type="button" data-goto="' + i + '" class="' + cls + '" title="' + esc((i + 1) + '. ' + meta.label) + '" aria-label="Go to step ' + (i + 1) + '"></button>';
  }
  html += '</div>';
  return html;
}

// ─── step card ───
function renderStepCard(step) {
  const meta = STEP_META[step.kind];
  const needsAudio = step.kind === 'gist' || step.kind === 'detail';
  return (
    '<div class="card">' +
      '<div class="card-head" style="background:' + meta.color + '18">' +
        '<div class="step-badge" style="background:' + meta.color + '">' + (idx + 1) + '</div>' +
        '<div style="flex:1; min-width:0">' +
          '<p class="step-label">' + meta.icon + ' ' + esc(meta.label) + '</p>' +
          '<p class="step-title">' + esc(step.title) + '</p>' +
        '</div>' +
      '</div>' +
      (needsAudio ? renderAudio() : '') +
      '<div class="body">' + renderStepBody(step) + '</div>' +
    '</div>'
  );
}

function renderAudio() {
  if (AUDIO_URI) {
    return (
      '<div class="audio-slot" id="audio-slot">' +
        '<audio id="lesson-audio" controls preload="metadata" src="' + AUDIO_URI + '"></audio>' +
        '<div class="speed-row">' +
          '<span class="label">Speed</span>' +
          '<button type="button" class="speed-pill" data-speed="0.75">0.75×</button>' +
          '<button type="button" class="speed-pill" data-speed="0.85">0.85×</button>' +
          '<button type="button" class="speed-pill active" data-speed="1">1×</button>' +
        '</div>' +
      '</div>'
    );
  }
  return (
    '<div class="audio-missing">' +
      '<div style="font-size:22px">🎧</div>' +
      '<div><p class="m-title">Audio not available</p>' +
      '<p class="m-sub">Your teacher didn\\'t include the audio in this file.</p></div>' +
    '</div>'
  );
}

// ─── step bodies ───
function renderStepBody(step) {
  switch (step.kind) {
    case 'lead-in':             return renderLeadIn(step);
    case 'vocab':               return renderVocab(step);
    case 'prediction':          return renderPrediction(step);
    case 'gist':                return renderGist(step);
    case 'detail':              return renderDetail(step);
    case 'language-awareness':  return renderAwareness(step);
    case 'controlled-practice': return renderPractice(step);
    case 'production':          return renderProduction(step);
    default: return '';
  }
}

function renderLeadIn(step) {
  let items = '';
  for (let i = 0; i < step.openQuestions.length; i++) {
    const q = step.openQuestions[i];
    const val = esc(state.openText[q.id] || '');
    items += (
      '<div class="open-q">' +
        '<p class="p">' + (i + 1) + '. ' + esc(q.prompt) + '</p>' +
        (q.hint ? '<p class="hint">' + esc(q.hint) + '</p>' : '') +
        '<textarea data-opentext="' + esc(q.id) + '" rows="3" placeholder="Write it, or just think it…">' + val + '</textarea>' +
      '</div>'
    );
  }
  return (
    '<p class="prose">' + esc(step.intro) + '</p>' +
    '<div class="grid-1">' + items + '</div>' +
    '<p class="tip">💡 No right answers here — this step just warms your brain up for what\\'s coming.</p>'
  );
}

function renderVocab(step) {
  let cards = '';
  for (const item of step.items) {
    const flipped = !!state.flipped[item.id];
    cards += (
      '<button type="button" class="vocab-card" data-flip="' + esc(item.id) + '">' +
        '<div class="vhead">' +
          '<div>' +
            '<p class="word">' + esc(item.word) + '</p>' +
            (item.pos ? '<p class="pos">' + esc(item.pos) + '</p>' : '') +
          '</div>' +
          '<span class="toggle">' + (flipped ? 'example ↓' : 'meaning ↓') + '</span>' +
        '</div>' +
        '<div class="face">' +
          (flipped
            ? ('<p class="example">&ldquo;' + esc(item.example) + '&rdquo;</p>' +
               (item.definition ? '<p class="def">' + esc(item.definition) + '</p>' : '') +
               (item.soundsLike ? '<p class="sounds">🔊 ' + esc(item.soundsLike) + '</p>' : ''))
            : '<p>' + esc(item.translation) + '</p>'
          ) +
        '</div>' +
      '</button>'
    );
  }
  let quiz = '';
  if (step.quiz && step.quiz.length) {
    let qhtml = '';
    for (let i = 0; i < step.quiz.length; i++) qhtml += renderMCQ(step.quiz[i], i + 1, false);
    quiz = (
      '<div style="padding-top:12px; border-top:1px solid #E8D8F5">' +
        '<p style="font-size:11px; font-weight:900; letter-spacing:.25em; text-transform:uppercase; color:#9B72B8; margin:0 0 10px">Quick check</p>' +
        qhtml +
      '</div>'
    );
  }
  return (
    '<p class="prose">' + esc(step.intro) + '</p>' +
    '<div class="grid-2">' + cards + '</div>' +
    quiz
  );
}

function renderPrediction(step) {
  let qs = '';
  for (let i = 0; i < step.questions.length; i++) qs += renderMCQ(step.questions[i], i + 1, true);
  return (
    '<p class="prose">' + esc(step.intro) + '</p>' +
    '<div>' + qs + '</div>' +
    '<p class="tip cyan">💡 Predictions aren\\'t graded — we\\'ll come back to them after you listen.</p>'
  );
}

function renderGist(step) {
  let callout = '';
  if (step.listenFor && step.listenFor.length) {
    let lis = '';
    for (const l of step.listenFor) lis += '<li>' + esc(l) + '</li>';
    callout = '<div class="listen-for"><p>Listen for</p><ul>' + lis + '</ul></div>';
  }
  return (
    '<p class="prose">' + esc(step.intro) + '</p>' +
    callout +
    renderQuestionList(step.questions)
  );
}

function renderDetail(step) {
  const toggle = step.allowTranscript
    ? '<button type="button" class="transcript-toggle" data-toggle-transcript>' +
      '📖 ' + (state.transcript ? 'Hide transcript' : 'Show transcript') +
      '</button>'
    : '';
  const transcript = state.transcript ? renderTranscript() : '';
  return (
    '<p class="prose">' + esc(step.intro) + '</p>' +
    toggle + transcript +
    renderQuestionList(step.questions)
  );
}

function renderTranscript() {
  const byId = {};
  for (const s of LESSON.audio.speakers) byId[s.id] = s;
  let lines = '';
  for (const line of LESSON.audio.script) {
    const who = byId[line.speakerId] ? byId[line.speakerId].displayName : line.speakerId;
    lines += '<div class="line"><span class="who">' + esc(who) + '</span><p class="what">' + esc(line.text) + '</p></div>';
  }
  return '<div class="transcript">' + lines + '</div>';
}

function renderAwareness(step) {
  let chunks = '';
  for (const c of step.chunks) {
    chunks += (
      '<div class="chunk-card">' +
        '<div class="chunk-head">' +
          '<span class="chunk-word">' + esc(c.chunk) + '</span>' +
          '<span class="chunk-cat">' + esc(c.category.replace('-', ' ')) + '</span>' +
        '</div>' +
        '<p class="chunk-gloss">' + esc(c.gloss) + '</p>' +
        '<p class="chunk-example">&ldquo;' + esc(c.example) + '&rdquo;</p>' +
        '<p class="chunk-notice"><span class="label">💡 Notice:</span> ' + esc(c.notice) + '</p>' +
      '</div>'
    );
  }
  return (
    '<p class="prose">' + esc(step.intro) + '</p>' +
    '<div>' + chunks + '</div>'
  );
}

function renderPractice(step) {
  return (
    '<p class="prose">' + esc(step.intro) + '</p>' +
    renderQuestionList(step.activities)
  );
}

function renderProduction(step) {
  const key = 'prod-' + LESSON.id;
  const text = state.openText[key] || '';
  const wordCount = text.trim() ? text.trim().split(/\\s+/).length : 0;

  // target chunks
  let chunkChips = '';
  if (step.targetChunks && step.targetChunks.length) {
    const awareness = LESSON.steps.find(function (s) { return s.kind === 'language-awareness'; });
    if (awareness) {
      const byId = {};
      for (const c of awareness.chunks) byId[c.id] = c;
      let chips = '';
      for (const id of step.targetChunks) {
        if (byId[id]) chips += '<span class="chip">' + esc(byId[id].chunk) + '</span>';
      }
      if (chips) chunkChips = '<div class="target-chunks"><p>Try to use these chunks</p><div>' + chips + '</div></div>';
    }
  }

  const input = step.mode === 'writing'
    ? ('<div>' +
        '<textarea class="prod-textarea" data-opentext="' + esc(key) + '" rows="8" placeholder="Write here…">' + esc(text) + '</textarea>' +
        '<p class="word-count">' + wordCount + (step.minWords ? ' / ' + step.minWords : '') + ' words</p>' +
      '</div>')
    : ('<div class="speaking-stub">' +
        '<p class="big">🎙️</p>' +
        '<p class="title">Audio recording — record on your favourite app</p>' +
        '<p class="sub">Target: ' + (step.minSeconds || 60) + ' seconds. Share it back with your teacher.</p>' +
      '</div>');

  return (
    '<p class="prose">' + esc(step.intro) + '</p>' +
    '<div class="prod-task">' +
      '<p class="lab">' + (step.mode === 'speaking' ? '🎤 Your task' : '✍️ Your task') + '</p>' +
      '<p class="prompt">' + esc(step.prompt) + '</p>' +
    '</div>' +
    chunkChips +
    input
  );
}

// ─── question dispatcher & shared blocks ───
function renderQuestionList(questions) {
  let out = '<div>';
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q.kind === 'mcq')        out += renderMCQ(q, i + 1, false);
    else if (q.kind === 'gap-fill')   out += renderGap(q, i + 1);
    else if (q.kind === 'true-false') out += renderTF(q, i + 1);
  }
  out += '</div>';
  return out;
}

function renderMCQ(q, index, prediction) {
  const a = state.answers[q.id] && state.answers[q.id].kind === 'mcq' ? state.answers[q.id] : { kind: 'mcq', picked: null, locked: false };
  const correct = Array.isArray(q.correct) ? q.correct : [q.correct];

  let opts = '';
  for (const opt of q.options) {
    const isPicked  = a.picked === opt.id;
    const isCorrect = correct.indexOf(opt.id) !== -1;
    let cls = 'opt';
    if (!a.locked) {
      if (isPicked) cls += ' picked';
    } else {
      if (prediction) {
        if (isPicked) cls += ' picked';
        else cls += ' fade';
      } else if (isCorrect) cls += ' correct';
      else if (isPicked) cls += ' wrong';
      else cls += ' fade';
    }
    opts += '<button type="button" class="' + cls + '" data-qid="' + esc(q.id) + '" data-pick="' + esc(opt.id) + '"' + (a.locked ? ' disabled' : '') + '>' +
            '<span class="k">' + esc(opt.id.toUpperCase()) + '.</span> ' + esc(opt.text) + '</button>';
  }

  const action = !a.locked
    ? '<button type="button" class="check-btn" data-check="' + esc(q.id) + '"' + (a.picked ? '' : ' disabled') + '>' + (prediction ? 'Confirm' : 'Check') + '</button>'
    : (
      '<div class="check-row">' +
        (!prediction && q.explain
          ? '<p class="explain">💡 ' + esc(q.explain) + '</p>'
          : '') +
        '<button type="button" class="redo-btn" data-redo="' + esc(q.id) + '">↺ Redo</button>' +
      '</div>'
    );

  return (
    '<div class="qblock">' +
      '<p class="qprompt">' + index + '. ' + esc(q.prompt) + '</p>' +
      opts +
      (a.locked ? action : '<div class="check-row">' + action + '</div>') +
    '</div>'
  );
}

function renderTF(q, index) {
  const a = state.answers[q.id] && state.answers[q.id].kind === 'true-false' ? state.answers[q.id] : { kind: 'true-false', picked: null, locked: false };
  const labels = { T: 'True', F: 'False', NG: 'Not given' };
  let btns = '';
  for (const k of ['T', 'F', 'NG']) {
    const isPicked = a.picked === k;
    const isCorrect = k === q.correct;
    let cls = 'tf';
    if (!a.locked) {
      if (isPicked) cls += ' picked';
    } else {
      if (isCorrect) cls += ' correct';
      else if (isPicked) cls += ' wrong';
      else cls += ' fade';
    }
    btns += '<button type="button" class="' + cls + '" data-qid="' + esc(q.id) + '" data-pick-tf="' + k + '"' + (a.locked ? ' disabled' : '') + '>' + labels[k] + '</button>';
  }
  const action = !a.locked
    ? '<button type="button" class="check-btn" data-check="' + esc(q.id) + '"' + (a.picked ? '' : ' disabled') + '>Check</button>'
    : (
      '<div class="check-row">' +
        (q.explain ? '<p class="explain">💡 ' + esc(q.explain) + '</p>' : '') +
        '<button type="button" class="redo-btn" data-redo="' + esc(q.id) + '">↺ Redo</button>' +
      '</div>'
    );
  return (
    '<div class="qblock">' +
      '<p class="qprompt">' + index + '. ' + esc(q.prompt) + '</p>' +
      '<div class="tf-row">' + btns + '</div>' +
      (a.locked ? action : '<div class="check-row">' + action + '</div>') +
    '</div>'
  );
}

function renderGap(q, index) {
  const parts = q.sentence.split('___');
  const blankCount = Math.max(0, parts.length - 1);
  const a = state.answers[q.id] && state.answers[q.id].kind === 'gap-fill'
    ? state.answers[q.id]
    : { kind: 'gap-fill', vals: new Array(blankCount).fill(''), locked: false };
  const vals = a.vals;

  function ok(i) {
    const want = (q.answers[i] || '').trim().toLowerCase();
    const got  = (vals[i] || '').trim().toLowerCase();
    if (!want) return false;
    if (got === want) return true;
    const alts = (q.alts && q.alts[i]) || [];
    for (const x of alts) if (x.trim().toLowerCase() === got) return true;
    return false;
  }

  let sentence = '<span style="font-weight:900; margin-right:6px">' + index + '.</span>';
  for (let i = 0; i < parts.length; i++) {
    sentence += esc(parts[i]);
    if (i < blankCount) {
      let cls = 'gap-input';
      if (a.locked) cls += ok(i) ? ' ok' : ' bad';
      sentence += '<input type="text" class="' + cls + '" data-gap="' + esc(q.id) + '" data-gap-i="' + i + '" value="' + esc(vals[i] || '') + '"' + (a.locked ? ' disabled' : '') + '>';
    }
  }

  const allOk = vals.every(function (_, i) { return ok(i); });
  const hasEmpty = vals.some(function (v) { return !v || !v.trim(); });

  const action = !a.locked
    ? '<button type="button" class="check-btn" data-check="' + esc(q.id) + '"' + (hasEmpty ? ' disabled' : '') + '>Check</button>'
    : (
      '<div class="check-row">' +
        '<p class="explain ' + (allOk ? 'good' : 'bad') + '">' +
          (allOk ? '✓ Perfect.' : 'Expected: ' + esc(q.answers.join(' · '))) +
        '</p>' +
        '<button type="button" class="redo-btn" data-redo="' + esc(q.id) + '">↺ Redo</button>' +
      '</div>'
    );

  return (
    '<div class="qblock">' +
      (q.hint ? '<p class="qhint">' + esc(q.hint) + '</p>' : '') +
      '<p class="qprompt" style="font-weight:400; line-height:1.9">' + sentence + '</p>' +
      (a.locked ? action : '<div class="check-row">' + action + '</div>') +
    '</div>'
  );
}

// ─── navigation ───
function renderNav(done) {
  if (done) return '';
  const isLast = idx === LESSON.steps.length - 1;
  return (
    '<div class="nav">' +
      '<button type="button" data-prev' + (idx === 0 ? ' disabled' : '') + '>← Back</button>' +
      '<button type="button" class="primary' + (isLast ? ' finish' : '') + '" data-next>' + (isLast ? 'Finish' : 'Next') + ' →</button>' +
    '</div>' +
    '<p class="shortcuts">Shortcuts: ← / → to navigate · Enter to advance</p>'
  );
}

// ─── recap ───
function renderRecap() {
  const scored = scoreLesson();
  const awareness = LESSON.steps.find(function (s) { return s.kind === 'language-awareness'; });
  const chunks = awareness ? awareness.chunks : [];
  const accuracy = scored.total === 0 ? '—' : Math.round(100 * scored.correct / scored.total) + '%';

  let chunkChips = '';
  for (const c of chunks) chunkChips += '<span class="recap-chip">✓ ' + esc(c.chunk) + '</span>';

  let reviewChips = '';
  for (let i = 0; i < LESSON.steps.length; i++) {
    const m = STEP_META[LESSON.steps[i].kind];
    reviewChips += '<button type="button" class="review-btn" data-goto="' + i + '">' + m.icon + ' ' + (i + 1) + '. ' + esc(m.label) + '</button>';
  }

  return (
    '<div class="card">' +
      '<div class="recap-hero">' +
        '<div class="avatar">🎉</div>' +
        '<div>' +
          '<p class="lab">You made it!</p>' +
          '<p class="big">Nice work on those chunks</p>' +
        '</div>' +
      '</div>' +
      '<div class="body">' +
        '<div class="stat-tiles">' +
          '<div class="stat-tile" style="border-color:#7BC67E55"><p class="v" style="color:#7BC67E">' + scored.correct + '/' + scored.total + '</p><p class="l">Correct</p></div>' +
          '<div class="stat-tile" style="border-color:#9B72B855"><p class="v" style="color:#9B72B8">' + accuracy + '</p><p class="l">Accuracy</p></div>' +
          '<div class="stat-tile" style="border-color:#E87BAD55"><p class="v" style="color:#E87BAD">' + chunks.length + '</p><p class="l">Chunks</p></div>' +
        '</div>' +
        (chunks.length ? '<p class="recap-list-title">✨ Today\\'s chunks</p><div>' + chunkChips + '</div>' : '') +
        '<p class="recap-list-title">Jump back to any step</p><div>' + reviewChips + '</div>' +
        '<div class="recap-btn-row">' +
          '<button type="button" class="restart" data-restart>↺ Do it again</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function scoreLesson() {
  let correct = 0, total = 0;
  function scoreQ(q) {
    const a = state.answers[q.id];
    if (!a || !a.locked) return;
    total++;
    if (q.kind === 'mcq') {
      const corr = Array.isArray(q.correct) ? q.correct : [q.correct];
      if (a.kind === 'mcq' && corr.indexOf(a.picked) !== -1) correct++;
    } else if (q.kind === 'true-false') {
      if (a.kind === 'true-false' && a.picked === q.correct) correct++;
    } else if (q.kind === 'gap-fill') {
      if (a.kind === 'gap-fill') {
        const ok = q.answers.every(function (exp, i) {
          const got  = ((a.vals[i] || '') + '').trim().toLowerCase();
          const want = (exp + '').trim().toLowerCase();
          if (got === want) return true;
          const alts = (q.alts && q.alts[i]) || [];
          for (const x of alts) if (x.trim().toLowerCase() === got) return true;
          return false;
        });
        if (ok) correct++;
      }
    }
  }
  for (const step of LESSON.steps) {
    if (step.kind === 'vocab') for (const q of step.quiz) scoreQ(q);
    else if (step.kind === 'gist' || step.kind === 'detail') for (const q of step.questions) scoreQ(q);
    else if (step.kind === 'controlled-practice') for (const q of step.activities) scoreQ(q);
  }
  return { correct: correct, total: total };
}

// ─── event wiring ───
function bind() {
  document.querySelectorAll('[data-goto]').forEach(function (el) {
    el.addEventListener('click', function () { go(parseInt(el.getAttribute('data-goto'), 10)); });
  });
  const prev = document.querySelector('[data-prev]');
  if (prev) prev.addEventListener('click', function () { go(idx - 1); });
  const next = document.querySelector('[data-next]');
  if (next) next.addEventListener('click', function () { go(idx + 1); });
  const restart = document.querySelector('[data-restart]');
  if (restart) restart.addEventListener('click', function () {
    idx = 0;
    for (const k in state.answers) delete state.answers[k];
    for (const k in state.openText) delete state.openText[k];
    for (const k in state.flipped) delete state.flipped[k];
    state.transcript = false;
    go(0);
  });

  // Flip vocab
  document.querySelectorAll('[data-flip]').forEach(function (el) {
    el.addEventListener('click', function () {
      const id = el.getAttribute('data-flip');
      state.flipped[id] = !state.flipped[id];
      render();
    });
  });

  // Open text (lead-in textareas, production writing)
  document.querySelectorAll('[data-opentext]').forEach(function (el) {
    el.addEventListener('input', function () {
      state.openText[el.getAttribute('data-opentext')] = el.value;
      // For production, update the word count inline (full re-render would steal focus).
      const wc = document.querySelector('.word-count');
      if (wc && el.classList.contains('prod-textarea')) {
        const t = el.value.trim();
        const n = t ? t.split(/\\s+/).length : 0;
        const currentText = wc.textContent || '';
        const slashMatch = currentText.match(/\\/\\s*\\d+/);
        wc.textContent = n + (slashMatch ? ' ' + slashMatch[0] : '') + ' words';
      }
    });
  });

  // MCQ pick
  document.querySelectorAll('[data-pick]').forEach(function (el) {
    el.addEventListener('click', function () {
      const qid = el.getAttribute('data-qid');
      const pick = el.getAttribute('data-pick');
      const a = state.answers[qid] && state.answers[qid].kind === 'mcq' ? state.answers[qid] : { kind: 'mcq', picked: null, locked: false };
      if (a.locked) return;
      state.answers[qid] = { kind: 'mcq', picked: pick, locked: false };
      render();
    });
  });

  // True/False pick
  document.querySelectorAll('[data-pick-tf]').forEach(function (el) {
    el.addEventListener('click', function () {
      const qid = el.getAttribute('data-qid');
      const pick = el.getAttribute('data-pick-tf');
      const a = state.answers[qid] && state.answers[qid].kind === 'true-false' ? state.answers[qid] : { kind: 'true-false', picked: null, locked: false };
      if (a.locked) return;
      state.answers[qid] = { kind: 'true-false', picked: pick, locked: false };
      render();
    });
  });

  // Gap input
  document.querySelectorAll('[data-gap]').forEach(function (el) {
    el.addEventListener('input', function () {
      const qid = el.getAttribute('data-gap');
      const i = parseInt(el.getAttribute('data-gap-i'), 10);
      const q = findQuestionById(qid);
      const blanks = (q && q.kind === 'gap-fill') ? q.sentence.split('___').length - 1 : 1;
      const a = state.answers[qid] && state.answers[qid].kind === 'gap-fill'
        ? state.answers[qid]
        : { kind: 'gap-fill', vals: new Array(blanks).fill(''), locked: false };
      const vals = a.vals.slice();
      vals[i] = el.value;
      state.answers[qid] = { kind: 'gap-fill', vals: vals, locked: false };
      // Don't re-render on every keystroke — just enable/disable the check button.
      const btn = document.querySelector('[data-check="' + qid + '"]');
      if (btn) btn.disabled = vals.some(function (v) { return !v || !v.trim(); });
    });
  });

  // Check
  document.querySelectorAll('[data-check]').forEach(function (el) {
    el.addEventListener('click', function () {
      const qid = el.getAttribute('data-check');
      const a = state.answers[qid];
      if (!a) return;
      state.answers[qid] = Object.assign({}, a, { locked: true });
      render();
    });
  });

  // Redo
  document.querySelectorAll('[data-redo]').forEach(function (el) {
    el.addEventListener('click', function () {
      const qid = el.getAttribute('data-redo');
      const q = findQuestionById(qid);
      if (!q) { delete state.answers[qid]; render(); return; }
      if (q.kind === 'mcq')        state.answers[qid] = { kind: 'mcq', picked: null, locked: false };
      else if (q.kind === 'true-false') state.answers[qid] = { kind: 'true-false', picked: null, locked: false };
      else if (q.kind === 'gap-fill') {
        const blanks = q.sentence.split('___').length - 1;
        state.answers[qid] = { kind: 'gap-fill', vals: new Array(blanks).fill(''), locked: false };
      }
      render();
    });
  });

  // Transcript toggle
  const tt = document.querySelector('[data-toggle-transcript]');
  if (tt) tt.addEventListener('click', function () { state.transcript = !state.transcript; render(); });
}

function findQuestionById(qid) {
  for (const step of LESSON.steps) {
    const bucket =
      step.kind === 'vocab' ? step.quiz
      : step.kind === 'gist' || step.kind === 'detail' ? step.questions
      : step.kind === 'prediction' ? step.questions
      : step.kind === 'controlled-practice' ? step.activities
      : null;
    if (bucket) for (const q of bucket) if (q.id === qid) return q;
  }
  return null;
}

// ─── keyboard nav ───
window.addEventListener('keydown', function (e) {
  const t = e.target;
  const typing = t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.isContentEditable);
  const done = idx >= LESSON.steps.length;
  if (e.key === 'ArrowRight' && !typing && !done) { e.preventDefault(); go(idx + 1); }
  else if (e.key === 'ArrowLeft' && !typing)      { e.preventDefault(); go(idx - 1); }
  else if (e.key === 'Enter' && !typing && !done) { e.preventDefault(); go(idx + 1); }
});

// ─── audio dock (persistent across steps) ───
function fmtClock(t) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, '0');
  return m + ':' + s;
}

const playSvg  = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 5v14l11-7-11-7z" fill="currentColor"/></svg>';
const pauseSvg = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor"/><rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor"/></svg>';

function mountDock() {
  if (document.getElementById('audio-dock')) return;
  const dock = document.createElement('div');
  dock.id = 'audio-dock';
  dock.className = 'dock';
  dock.setAttribute('aria-hidden', 'true');
  dock.innerHTML =
    '<div class="dock-inner">' +
      '<button type="button" class="dock-play" aria-label="Play audio">' + playSvg + '</button>' +
      '<span class="dock-time">0:00</span>' +
      '<div class="dock-scrub" role="slider" tabindex="0" aria-label="Seek audio position" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0"><div class="bar"></div></div>' +
      '<span class="dock-time end">0:00</span>' +
      '<span class="dock-label">' + esc(LESSON.level + ' · ' + LESSON.title) + '</span>' +
      '<div class="dock-speeds">' +
        '<button type="button" class="speed-pill" data-dock-speed="0.75">0.75×</button>' +
        '<button type="button" class="speed-pill" data-dock-speed="0.85">0.85×</button>' +
        '<button type="button" class="speed-pill active" data-dock-speed="1">1×</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(dock);
}

let audioIO = null;   // IntersectionObserver instance, re-created per audio-slot mount

function wireAudio() {
  // Disconnect any previous observer — a step change recreates the slot.
  if (audioIO) { audioIO.disconnect(); audioIO = null; }

  const audio = document.getElementById('lesson-audio');
  const slot  = document.getElementById('audio-slot');
  const dock  = document.getElementById('audio-dock');
  if (!dock) return;
  if (!audio || !slot) { dock.classList.remove('visible'); dock.setAttribute('aria-hidden', 'true'); return; }

  const playBtn = dock.querySelector('.dock-play');
  const timeNow = dock.querySelector('.dock-time:not(.end)');
  const timeEnd = dock.querySelector('.dock-time.end');
  const scrub   = dock.querySelector('.dock-scrub');
  const bar     = scrub.querySelector('.bar');

  function paintPlayState() {
    const playing = !audio.paused && !audio.ended;
    playBtn.innerHTML = playing ? pauseSvg : playSvg;
    playBtn.setAttribute('aria-label', playing ? 'Pause audio' : 'Play audio');
  }
  function paintTime() {
    const cur = audio.currentTime || 0;
    const dur = isFinite(audio.duration) ? audio.duration : 0;
    timeNow.textContent = fmtClock(cur);
    timeEnd.textContent = fmtClock(dur);
    bar.style.width = (dur > 0 ? Math.min(100, (cur / dur) * 100) : 0) + '%';
    scrub.setAttribute('aria-valuemax', Math.round(dur));
    scrub.setAttribute('aria-valuenow', Math.round(cur));
  }
  function paintSpeed(rate) {
    dock.querySelectorAll('[data-dock-speed]').forEach(function (el) {
      el.classList.toggle('active', parseFloat(el.getAttribute('data-dock-speed')) === rate);
    });
    slot.querySelectorAll('[data-speed]').forEach(function (el) {
      el.classList.toggle('active', parseFloat(el.getAttribute('data-speed')) === rate);
    });
  }

  audio.addEventListener('play',         paintPlayState);
  audio.addEventListener('pause',        paintPlayState);
  audio.addEventListener('ended',        paintPlayState);
  audio.addEventListener('timeupdate',   paintTime);
  audio.addEventListener('loadedmetadata', paintTime);
  audio.addEventListener('durationchange', paintTime);
  audio.addEventListener('ratechange', function () { paintSpeed(audio.playbackRate); });

  playBtn.onclick = function () {
    if (audio.paused) audio.play().catch(function () {});
    else audio.pause();
  };

  function seekFromClientX(clientX) {
    const dur = isFinite(audio.duration) ? audio.duration : 0;
    if (dur <= 0) return;
    const rect = scrub.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * dur;
  }
  scrub.onclick = function (e) { seekFromClientX(e.clientX); };
  scrub.onkeydown = function (e) {
    const dur = isFinite(audio.duration) ? audio.duration : 0;
    if (dur <= 0) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime - 5); }
    if (e.key === 'ArrowRight') { e.preventDefault(); audio.currentTime = Math.min(dur, audio.currentTime + 5); }
  };

  // Speed pills (inline + dock) both set audio.playbackRate;
  // the 'ratechange' listener re-paints both rows.
  slot.querySelectorAll('[data-speed]').forEach(function (el) {
    el.onclick = function () {
      const r = parseFloat(el.getAttribute('data-speed'));
      audio.playbackRate = r;
    };
  });
  dock.querySelectorAll('[data-dock-speed]').forEach(function (el) {
    el.onclick = function () {
      const r = parseFloat(el.getAttribute('data-dock-speed'));
      audio.playbackRate = r;
    };
  });

  paintPlayState();
  paintTime();
  paintSpeed(audio.playbackRate || 1);

  // Dock materialises only once the inline card has scrolled off the top.
  audioIO = new IntersectionObserver(function (entries) {
    const entry = entries[0];
    const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    dock.classList.toggle('visible', show);
    dock.setAttribute('aria-hidden', show ? 'false' : 'true');
  }, { root: null, threshold: 0, rootMargin: '0px' });
  audioIO.observe(slot);
}

// ─── boot ───
mountDock();
render();
`;
