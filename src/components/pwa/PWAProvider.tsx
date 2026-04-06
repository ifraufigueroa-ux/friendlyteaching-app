// FriendlyTeaching.cl — PWA Provider
// Client component that registers the service worker and renders the install prompt.
'use client';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import InstallPrompt from './InstallPrompt';

export default function PWAProvider() {
  useServiceWorker();
  return <InstallPrompt />;
}
