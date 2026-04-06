import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import PWAProvider from '@/components/pwa/PWAProvider';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FriendlyTeaching.cl — Academia de Inglés Online',
  description: 'Aprende inglés de forma amigable y efectiva con clases personalizadas.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FriendlyTeaching',
  },
};

export const viewport: Viewport = {
  themeColor: '#C8A8DC',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL" className={nunito.variable}>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <PWAProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
