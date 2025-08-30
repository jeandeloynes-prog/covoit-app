'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [session, setSession] = useState<any>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let unsub: { subscription: { unsubscribe: () => void } } | null = null;

    const bootstrap = async () => {
      // 1) Nouveau flux Supabase: ?code=... (PKCE)
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        // Nettoie l'URL quoi qu'il arrive (évite de rerun sans fin)
        url.searchParams.delete('code');
        window.history.replaceState({}, '', url.toString());
        if (error) console.error('exchangeCodeForSession error:', error);
      } else if (window.location.hash) {
        // 2) Ancien flux: tokens dans le hash
        const params = new URLSearchParams(window.location.hash.slice(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) console.error('setSession error:', error);
          // retire le hash
          window.history.replaceState({}, '', window.location.pathname + window.location.search);
        }
      }

      // 3) Récupère la session courante et écoute les changements
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
      unsub = sub;
    };

    bootstrap();
    return () => unsub?.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    setInfo('Envoi du lien magique…');
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (typeof window !== 'undefined' ? window.location.origin : '');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // Redirige explicitement vers /auth/callback (utile pour la solution B)
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });
    if (error) setInfo(`Erreur: ${error.message}`);
    else setInfo('Vérifie ta boîte e‑mail et reviens ici une fois connecté.');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return (
      <div>
        <h2>Se connecter</h2>
        <p>Entre ton e‑mail, tu recevras un lien magique.</p>
        <input
          placeholder="ton.email@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 8, width: '100%', maxWidth: 360 }}
        />
        <div style={{ marginTop: 10 }}>
          <button onClick={signIn} style={{ padding: '8px 12px' }}>
            Recevoir le lien
          </button>
        </div>
        {info && <p style={{ marginTop: 10 }}>{info}</p>}
      </div>
    );
  }

  return (
    <div>
      <p>Connecté: {session.user.email}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <a
          href="/groups"
          style={{
            padding: '8px 12px',
            background: '#111',
            color: 'white',
            borderRadius: 6,
            textDecoration: 'none',
          }}
        >
          Voir mes groupes
        </a>
        <button onClick={signOut} style={{ padding: '8px 12px' }}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
