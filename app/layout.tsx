import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

export const metadata: Metadata = {
  title: 'gymslop',
  description: 'Tu tracker de gym, comidas y bienestar.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'gymslop',
  },
  icons: {
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
      { url: '/icons/icon-152x152.png',     sizes: '152x152' },
    ],
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Blocking script — applies saved theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('gymtracker-theme');if(t&&['minimal','light','neon'].includes(t)){document.documentElement.classList.add('theme-'+t);}else{document.documentElement.classList.add('theme-minimal');}}catch(e){document.documentElement.classList.add('theme-minimal');}})();`,
          }}
        />
      </head>
      <body className="bg-dark-bg text-slate-200 antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <InstallPrompt />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0d1117',
                color: '#e2e8f0',
                border: '1px solid #1e2d3d',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
              },
              success: {
                iconTheme: { primary: '#39ff14', secondary: '#0d1117' },
              },
              error: {
                iconTheme: { primary: '#ff2d78', secondary: '#0d1117' },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
