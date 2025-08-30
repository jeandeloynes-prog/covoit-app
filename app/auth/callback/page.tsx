'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // même import que ta home

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      // 1) Nouveau flux: ?code=...
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        // nettoie l’URL
        url.searchParams.delete('code');
        window.history.replaceState({}, '', url.toString());
        if (error) console.error('exchangeCodeForSession:', error);
        router.replace('/'); // vers ta page d’accueil ou protégée
        return;
      }

      // 2) Flux hash (ton lien actuel): #access_token=...&refresh_token=...
      if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) console.error('setSession:', error);
          // enlève le hash et redirige
          window.history.replaceState({}, '', '/');
          router.replace('/');
          return;
        }
      }

      // Aucun code/token -> retour simple
      router.replace('/');
    };

    run();
  }, [router]);

  return <p>Connexion en cours…</p>;
}
