'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      const redirectTo =
        (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin) +
        '/auth/callback';

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;
      setStatus('sent');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message ?? 'Une erreur est survenue.');
      setStatus('error');
    }
  };

  return (
    <main style={{ maxWidth: 560, margin: '2rem auto' }}>
      <h1>Covoit École</h1>
      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 24 }}>
        <h2>Se connecter</h2>
        <p>Entre ton e‑mail, tu recevras un lien magique.</p>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <input
            type="email"
            placeholder="ton.email@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }}
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            style={{ padding: '10px 14px', borderRadius: 6, background: '#5b21b6', color: 'white' }}
          >
            {status === 'sending' ? 'Envoi…' : 'Recevoir le lien'}
          </button>
        </form>
        {status === 'sent' && <p style={{ marginTop: 12 }}>Email envoyé. Ouvre le lien dans le même navigateur.</p>}
        {status === 'error' && <p style={{ marginTop: 12, color: 'crimson' }}>{errorMsg}</p>}
      </section>
    </main>
  );
}
