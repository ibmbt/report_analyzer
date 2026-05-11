/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    appIsrStatus: false, // This hides the new Next.js "N" route widget
    buildActivity: false, // This hides the compiling widget
  },
};

export default nextConfig;