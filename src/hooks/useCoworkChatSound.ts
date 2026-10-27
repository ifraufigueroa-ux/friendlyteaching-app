// FriendlyTeaching.cl — useCoworkChatSound
// Suena un chime corto cada vez que llega un mensaje nuevo al chat COWORK
// escrito por otra persona (nunca por uno mismo). Pensado para montarse
// globalmente desde el Sidebar, así el aviso llega aun si el profe está
// en otra sección del dashboard.
//
// Diseño:
//   - El sonido se genera inline con WebAudio (dos osciladores senoidales
//     con un decay corto) → no necesitamos subir un archivo a /public ni
//     tocar la CSP.
//   - Los navegadores bloquean audio hasta que haya un gesto del usuario:
//     primamos el AudioContext en el primer click/keydown.
//   - En el primer snapshot NO suena: fijamos un baseline con la fecha
//     del mensaje más nuevo para no gatillar con el historial.
//   - Si el tab está en segundo plano, además hace blink del title para
//     que el aviso sea visible aun con pestaña inactiva.
//   - El usuario puede silenciar con localStorage `cowork_chat_sound_muted`.

'use client';
import { useEffect, useRef, useState } from 'react';
import {
  collection, query, orderBy, limit as fbLimit, onSnapshot,
  Timestamp,
  type QuerySnapshot, type DocumentData,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';

const MUTE_KEY = 'cowork_chat_sound_muted';
const TITLE_BLINK_MS = 1200;
const TITLE_BLINK_COUNT = 6;
const DEBUG = typeof window !== 'undefined' && localStorage.getItem('cowork_debug') === '1';

type AudioCtxCtor = typeof AudioContext;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & { webkitAudioContext?: AudioCtxCtor };
  const Ctor = window.AudioContext || w.webkitAudioContext;
  if (!Ctor) return null;
  try { return new Ctor(); } catch { return null; }
}

// Chime de dos notas: C5 → E5 (3ra mayor ascendente, lectura "ding-dong"
// alegre y breve, ~380ms total). Volumen bajo para no sobresaltar.
function playChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  master.connect(ctx.destination);

  function tone(freq: number, start: number, dur: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(1, now + start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
    osc.connect(g).connect(master);
    osc.start(now + start);
    osc.stop(now + start + dur + 0.02);
  }
  tone(880, 0.00, 0.18);  // A5
  tone(1174.66, 0.12, 0.26); // D6
}

function isMuted(): boolean {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
}

// `enabledUid` actúa de enable-gate (truthy = activar). El uid real para
// filtrar mensajes propios lo resolvemos con onAuthStateChanged (bug de
// hidratación — ver memoria [[authstore-hydration-bug]]).
export function useCoworkChatSound(enabledUid: string) {
  const ctxRef = useRef<AudioContext | null>(null);
  const baselineRef = useRef<number | null>(null);
  const titleRef = useRef<{ original: string; timer: number | null; count: number }>({
    original: '', timer: null, count: 0,
  });

  const [authUid, setAuthUid] = useState<string>(() => auth.currentUser?.uid ?? '');
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setAuthUid(u?.uid ?? ''));
  }, []);
  const currentUid = enabledUid ? (authUid || enabledUid) : '';

  // Prime AudioContext en el primer gesto. Los navegadores exigen un user
  // gesture antes de permitir audio; una vez que el ctx está en estado
  // "running", los pings subsiguientes funcionan incluso sin gesto nuevo.
  useEffect(() => {
    if (!currentUid) return;
    function prime() {
      if (ctxRef.current) return;
      const ctx = getAudioCtx();
      if (ctx) {
        ctxRef.current = ctx;
        // Un ctx recien creado tras gesto queda en 'running' en Chrome;
        // en Safari conviene resume() explicito.
        ctx.resume?.().catch(() => {});
      }
    }
    const opts = { once: true, passive: true } as const;
    window.addEventListener('click', prime, opts);
    window.addEventListener('keydown', prime, opts);
    window.addEventListener('touchstart', prime, opts);
    return () => {
      window.removeEventListener('click', prime);
      window.removeEventListener('keydown', prime);
      window.removeEventListener('touchstart', prime);
    };
  }, [currentUid]);

  // Blink del document.title cuando el tab no esta visible: alterna entre
  // el titulo original y "💬 Nuevo mensaje — ...". Se corta cuando el
  // usuario vuelve a la pestana.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible' && titleRef.current.timer != null) {
        window.clearInterval(titleRef.current.timer);
        titleRef.current.timer = null;
        titleRef.current.count = 0;
        if (titleRef.current.original) document.title = titleRef.current.original;
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  function blinkTitle(authorName: string) {
    if (typeof document === 'undefined') return;
    if (document.visibilityState === 'visible') return;
    const state = titleRef.current;
    if (!state.original) state.original = document.title;
    if (state.timer != null) {
      window.clearInterval(state.timer);
      state.timer = null;
    }
    state.count = 0;
    const alt = `💬 ${authorName || 'Nuevo mensaje'} — Co-Work`;
    state.timer = window.setInterval(() => {
      state.count += 1;
      document.title = state.count % 2 === 1 ? alt : state.original;
      if (state.count >= TITLE_BLINK_COUNT * 2) {
        window.clearInterval(state.timer!);
        state.timer = null;
        document.title = state.original;
      }
    }, TITLE_BLINK_MS / 2);
  }

  useEffect(() => {
    if (!currentUid) return;
    if (DEBUG) console.log('[cowork-sound] subscribe', { uid: currentUid });

    const q = query(
      collection(db, 'coworkMessages'),
      orderBy('createdAt', 'desc'),
      fbLimit(1),
    );

    const handle = (snap: QuerySnapshot<DocumentData>) => {
      const docSnap = snap.docs[0];
      if (!docSnap) return;
      const data = docSnap.data() as {
        authorId?: string;
        authorName?: string;
        createdAt?: Timestamp;
      };
      const t = data.createdAt?.toMillis?.() ?? 0;
      if (!t) return;

      // Baseline: la primera emisión fija el "ya conocido" y no suena.
      if (baselineRef.current == null) {
        baselineRef.current = t;
        if (DEBUG) console.log('[cowork-sound] baseline set', { t });
        return;
      }

      if (t <= baselineRef.current) return;    // no es más nuevo
      baselineRef.current = t;
      if (data.authorId === currentUid) return; // mio: silencio
      if (isMuted()) return;

      if (DEBUG) console.log('[cowork-sound] chime for new msg', { from: data.authorName, t });
      const ctx = ctxRef.current;
      if (ctx && ctx.state !== 'suspended') {
        try { playChime(ctx); } catch (e) { console.error('[cowork-sound] playChime failed', e); }
      } else if (DEBUG) {
        console.log('[cowork-sound] no audio ctx — user hasnt interacted yet', { ctx: !!ctx, state: ctx?.state });
      }
      blinkTitle(data.authorName || '');
    };

    const unsub = onSnapshot(q, handle, (err: Error) => {
      console.error('[cowork-sound] firestore error', err);
    });
    return () => {
      unsub();
      if (titleRef.current.timer != null) {
        window.clearInterval(titleRef.current.timer);
        titleRef.current.timer = null;
        if (titleRef.current.original) document.title = titleRef.current.original;
      }
    };
  }, [currentUid]);
}

// Helpers para una futura UI de preferencia (mute/unmute).
export function setCoworkChatSoundMuted(muted: boolean) {
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* ignore */ }
}
export function isCoworkChatSoundMuted(): boolean {
  return isMuted();
}
