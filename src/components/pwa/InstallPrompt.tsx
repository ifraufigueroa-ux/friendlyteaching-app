// FriendlyTeaching.cl — PWA Install Prompt
//
// Two tracks:
// - Chrome (Android + desktop): catches the `beforeinstallprompt`
//   event and lets the user hit "Instalar" which fires the native
//   add-to-home-screen flow.
// - iOS Safari: never fires that event. If we detect iOS + a
//   browsing context (not already running as a standalone PWA), we
//   render a step-by-step guide instead because manual add-to-home
//   is the only path Apple offers.
//
// Either prompt is dismissable for 7 days (localStorage).

'use client';
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Mode = 'chrome' | 'ios' | null;

function detectMode(): Mode {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return null;
  // Already installed? Chrome / Android exposes standalone via
  // matchMedia; iOS via navigator.standalone.
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return null;
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  if (isIOS && isSafari) return 'ios';
  return 'chrome';
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [mode, setMode] = useState<Mode>(null);

  useEffect(() => {
    const m = detectMode();
    setMode(m);

    // Respect a recent dismiss on either track.
    const lastDismissed = localStorage.getItem('ft-pwa-dismissed');
    if (lastDismissed) {
      const daysSince = (Date.now() - Number(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setDismissed(true);
        return;
      }
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function handleAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('ft-pwa-dismissed', String(Date.now()));
  }

  if (dismissed || installed) return null;

  // Chrome / Android / desktop — show only when the native event fired.
  if (mode === 'chrome' && deferredPrompt) {
    return (
      <PromptShell onDismiss={handleDismiss} title="Instalar FriendlyTeaching">
        <p className="text-xs text-gray-500 mt-0.5">
          Accede más rápido desde tu pantalla de inicio. Funciona sin conexión.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Ahora no
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2 bg-gradient-to-r from-[#C8A8DC] to-[#9B7CB8] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all"
          >
            Instalar
          </button>
        </div>
      </PromptShell>
    );
  }

  // iOS Safari — no native prompt exists. Show a 3-step manual guide.
  if (mode === 'ios') {
    return (
      <PromptShell onDismiss={handleDismiss} title="Instalar en iPhone / iPad">
        <ol className="text-xs text-gray-600 mt-1 space-y-1 list-decimal pl-4">
          <li>Tocá el botón <span className="font-bold">Compartir</span> abajo (el ícono <span className="inline-block">⬆︎</span>).</li>
          <li>Seleccioná <span className="font-bold">"Añadir a pantalla de inicio"</span>.</li>
          <li>Tocá <span className="font-bold">Añadir</span> arriba a la derecha.</li>
        </ol>
        <button
          onClick={handleDismiss}
          className="w-full mt-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Entendido
        </button>
      </PromptShell>
    );
  }

  return null;
}

function PromptShell({
  onDismiss, title, children,
}: {
  onDismiss: () => void;
  title:     string;
  children:  React.ReactNode;
}) {
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-40 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-xl border border-[#C8A8DC]/30 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F0E5FF] flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📲</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#5A3D7A]">{title}</p>
            {children}
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
