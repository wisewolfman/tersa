import type { NextConfig } from 'next';

// Derive Supabase storage hostname from env so we don't hardcode project ID
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname: string | undefined;
try {
  if (supabaseUrl) {
    supabaseHostname = new URL(supabaseUrl).hostname;
  }
} catch {}

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Supabase storage (prod)
      ...(supabaseHostname
        ? [{ protocol: 'https' as const, hostname: supabaseHostname }]
        : []),
      // Supabase storage (local dev)
      { protocol: 'http' as const, hostname: '127.0.0.1' },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  // biome-ignore lint/suspicious/useAwait: "rewrites is async"
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ];
  },
};

export default nextConfig;
