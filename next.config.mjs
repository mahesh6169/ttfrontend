/** @type {import('next').NextConfig} */
const nextConfig = {
  // E2E builds set NEXT_DIST_DIR=.next-e2e so the test production build never overwrites the dev
  // server's .next. Unset (normal dev/prod) this falls back to Next's default ".next".
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
  