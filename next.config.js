/** @type {import('next').NextConfig} */
const nextConfig = {
  // Passe à true temporairement si tu dois déployer malgré des erreurs TS
  typescript: { ignoreBuildErrors: false },
  // Tu peux aussi forcer le SWC fallback si besoin
  swcMinify: true,
};

module.exports = nextConfig;
