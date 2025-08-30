'use client';

import { useState } from 'react';

type Props = {
  onSent?: (email: string) => void;
  disabled?: boolean;
};

export default function MagicLinkForm({ onSent, disabled }: Props) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // TODO: remplace par ton endpoint (ex: /api/auth/magic-link)
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed to send magic link');
      setOk(true);
      onSent?.(email);
    } catch (err: any) {
      setError(err.message ?? 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <label className="grid gap-1">
        <span className="text-sm">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-3 py-2"
          placeholder="you@example.com"
        />
      </label>

      <button
        type="submit"
        disabled={submitting || disabled}
        className="bg-black text-white rounded px-3 py-2 disabled:opacity-60"
      >
        {submitting ? 'Envoi…' : 'Envoyer le lien magique'}
      </button>

      {ok && <p className="text-green-600 text-sm">Vérifie ta boîte mail.</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}
