// api/diag/env.js
module.exports = async function handler(req, res) {
  const pick = (k) => Boolean(process.env[k]);
  const urlHost = (env) => {
    const v = process.env[env];
    if (!v) return null;
    try {
      return new URL(v).host;
    } catch {
      return v.slice(0, 32);
    }
  };

  res.status(200).json({
    supabase: {
      NEXT_PUBLIC_SUPABASE_URL_present: pick("NEXT_PUBLIC_SUPABASE_URL"),
      NEXT_PUBLIC_SUPABASE_URL_host: urlHost("NEXT_PUBLIC_SUPABASE_URL"),
      NEXT_PUBLIC_SUPABASE_ANON_KEY_present: pick("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    },
    site: {
      NEXT_PUBLIC_SITE_URL_present: pick("NEXT_PUBLIC_SITE_URL"),
      NEXT_PUBLIC_SITE_URL_host: urlHost("NEXT_PUBLIC_SITE_URL")
    },
    bridge: {
      MAMMOUTH_API_URL_present: pick("MAMMOUTH_API_URL"),
      MAMMOUTH_API_URL_host: urlHost("MAMMOUTH_API_URL"),
      MAMMOUTH_API_KEY_present: pick("MAMMOUTH_API_KEY"),
      GITHUB_TOKEN_present: pick("GITHUB_TOKEN"),
      BRIDGE_SECRET_present: pick("BRIDGE_SECRET"),
      DEFAULT_BASE: process.env.DEFAULT_BASE || "main"
    },
    node: process.version
  });
};
