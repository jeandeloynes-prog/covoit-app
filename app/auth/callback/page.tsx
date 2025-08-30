'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClient();
  const [message, setMessage] = useState('Connexion en cours…');

  useEffect(() => {
    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession();
      if (error) {
        console.error(error);
        setMessage('Lien invalide ou expiré.');
        return;
      }
      const params = new URLSearchParams(window.location.search);
      router.replace(params.get('next') || '/');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ maxWidth: 560, margin: '2rem auto' }}>
      <p>{message}</p>
    </main>
  );
}
