/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'olkgawjrtbpytubdzmrm.supabase.co' }
    ],
  },
  transpilePackages: ['three'],
};

export default nextConfig;
