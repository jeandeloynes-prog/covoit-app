// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // TEMPORAIRE: n’empêche pas le build si ESLint/Prettier trouvent des erreurs
    ignoreDuringBuilds: true,
  },
  // Tu peux ajouter d’autres options Next ici au besoin
};

export default nextConfig;
