/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["firebasestorage.googleapis.com", "storage.googleapis.com"],
  },
};

module.exports = nextConfig;
