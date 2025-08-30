'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState<string>('Connexion en cours…');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const run = async () => {
      const code = new URLSearchParams(window.location.search).get('code');

      if (!code) {
        setMessage('Code de connexion manquant ou lien invalide.');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error(error);
        setMessage('Lien invalide ou expiré.');
        return;
      }

      // Succès: redirige vers la page protégée (à adapter)
      router.replace('/');
    };

    run();
  }, [router, supabase]);

  return <p>{message}</p>;
}
