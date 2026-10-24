import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces, Cinzel, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import PWAProvider from '@/components/pwa/PWAProvider';

// Platform-wide type system — Fraunces (serif display, variable) for
// headings and feature titles, Inter (geometric humanist sans) for UI
// and body copy. Fraunces's `SOFT` axis gives the serif the warmer,
// less academic look that fits FriendlyTeaching's palette.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'opsz'],
  // Variable font: omit `weight` so every weight on the 100–900 axis is
  // available (next/font forbids `weight` + `axes` together).
  variable: '--font-fraunces',
  display: 'swap',
});

// FriendlyTales theme fonts — Cinzel for titles/headers, Plus Jakarta Sans
// for body/inputs. Loaded here so <html> exposes the CSS variables and the
// `.theme-friendly-tales` scope in globals.css can consume them.
const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-cinzel',
  display: 'swap',
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://friendlyteaching.cl'),
  title: 'FriendlyTeaching.cl — Academia de Inglés Online',
  description: 'Aprende inglés de forma amigable y efectiva con clases personalizadas.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FriendlyTeaching',
  },
  openGraph: {
    title: 'FriendlyTeaching.cl',
    description: 'Aprende inglés de forma amigable y efectiva',
    url: 'https://friendlyteaching.cl',
    siteName: 'FriendlyTeaching.cl',
    images: [
      {
        url: 'https://friendlyteachingcl.vercel.app/logo-friendlyteaching.jpg',
        width: 800,
        height: 800,
        alt: 'FriendlyTeaching.cl',
      },
    ],
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'FriendlyTeaching.cl',
    description: 'Aprende inglés de forma amigable y efectiva',
    images: ['https://friendlyteachingcl.vercel.app/logo-friendlyteaching.jpg'],
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
    <html lang="es-CL" className={`${inter.variable} ${fraunces.variable} ${cinzel.variable} ${jakarta.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <PWAProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
