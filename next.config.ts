import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Optimize images
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Environment variables that should be available on client side
  // (Only non-sensitive variables)
  env: {
    // Add any public env vars here if needed
  },
  
  // Output configuration for Vercel
  output: 'standalone',
  
  // Experimental features
  experimental: {
    // Enable if needed
  },
};

export default nextConfig;
