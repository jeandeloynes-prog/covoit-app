'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthBootstrap() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const run = async () => {
      // 1) PKCE ?code=...
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        url.searchParams.delete('code');
        window.history.replaceState({}, '', url.toString());
        if (error) console.error('exchangeCodeForSession:', error);
        // si on est sur /auth/callback, renvoie vers la home
        if (pathname.startsWith('/auth')) router.replace('/');
        return;
      }

      // 2) Hash tokens #access_token=...&refresh_token=...
      if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) console.error('setSession:', error);
          // nettoie l’URL (retire le hash)
          window.history.replaceState({}, '', window.location.pathname + window.location.search);
          if (pathname.startsWith('/auth')) router.replace('/');
        }
      }
    };
    run();
  }, [pathname, router]);

  return null;
}
