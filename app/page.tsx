'use client';
import { supabase } from "./lib/supabaseClient";
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [session, setSession] = useState<any>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    setInfo('Envoi du lien magique…');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) setInfo(`Erreur: ${error.message}`);
    else setInfo('Vérifie ta boîte e‑mail et reviens ici une fois connecté.');
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  if (!session) {
    return (
      <div>
        <h2>Se connecter</h2>
        <p>Entre ton e‑mail, tu recevras un lien magique.</p>
        <input placeholder="ton.email@exemple.com" value={email} onChange={e=>setEmail(e.target.value)}
               style={{ padding: 8, width: '100%', maxWidth: 360 }}/>
        <div style={{ marginTop: 10 }}>
          <button onClick={signIn} style={{ padding: '8px 12px' }}>Recevoir le lien</button>
        </div>
        {info && <p style={{ marginTop: 10 }}>{info}</p>}
      </div>
    );
  }

  return (
    <div>
      <p>Connecté: {session.user.email}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <a href="/groups" style={{ padding: '8px 12px', background: '#111', color: 'white', borderRadius: 6, textDecoration: 'none' }}>
          Voir mes groupes
        </a>
        <button onClick={signOut} style={{ padding: '8px 12px' }}>Se déconnecter</button>
      </div>
    </div>
  );
}
