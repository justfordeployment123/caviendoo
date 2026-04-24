import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      // CDN (S3-backed, production images)
      { protocol: 'https', hostname: 'media.caviendoo.com' },
      // Local MinIO (development)
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      // Development / fallback sources
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'pixabay.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'commons.wikimedia.org' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
};

export default withNextIntl(nextConfig);
