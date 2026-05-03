/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "planyourskin.myshopify.com" },
      { protocol: "https", hostname: "www.planyourskin.com" },
      { protocol: "https", hostname: "planyourskin.com" },
    ],
  },
};
export default nextConfig;
