import withPWA from 'next-pwa';

const pwa = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // API routes — NetworkFirst
    {
      urlPattern: /^https?:\/\/.*\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
    // Pages — StaleWhileRevalidate
    {
      urlPattern: /^https?:\/\/.*\/_next\/data\/.*/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'next-data', expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 } },
    },
    // Static assets (_next/static) — CacheFirst
    {
      urlPattern: /^https?:\/\/.*\/_next\/static\/.*/,
      handler: 'CacheFirst',
      options: { cacheName: 'static-assets', expiration: { maxEntries: 256, maxAgeSeconds: 60 * 60 * 24 * 30 } },
    },
    // Images — CacheFirst
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: { cacheName: 'images', expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 30 } },
    },
    // Fonts — CacheFirst
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,
      handler: 'CacheFirst',
      options: { cacheName: 'fonts', expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 365 } },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  serverExternalPackages: ['@prisma/client'],
};

export default pwa(nextConfig);
