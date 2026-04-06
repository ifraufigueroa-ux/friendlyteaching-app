// FriendlyTeaching.cl — PWA Install Prompt
// Shows a banner inviting the user to install the app on their device.
'use client';
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already dismissed recently
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
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('ft-pwa-dismissed', String(Date.now()));
  }

  // Don't render if: no prompt available, already dismissed, or already installed
  if (!deferredPrompt || dismissed || installed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-40 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-xl border border-[#C8A8DC]/30 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F0E5FF] flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📲</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#5A3D7A]">Instalar FriendlyTeaching</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Accede más rápido desde tu pantalla de inicio. Funciona sin conexión.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
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
      </div>
    </div>
  );
}
