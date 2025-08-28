'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewGroupPage() {
  const [name, setName] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();

  const createGroup = async () => {
    setInfo(null);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { setInfo('Tu dois être connecté.'); return; }

    const userId = session.session.user.id;
    const { data, error } = await supabase.from('groups').insert({ name, created_by: userId }).select().single();
    if (error) setInfo(`Erreur: ${error.message}`);
    else router.push(`/groups/${data.id}`);
  };

  return (
    <div>
      <h2>Nouveau groupe</h2>
      <input placeholder="Nom du groupe" value={name} onChange={e=>setName(e.target.value)}
             style={{ padding: 8, width: '100%', maxWidth: 420 }}/>
      <div style={{ marginTop: 10 }}>
        <button onClick={createGroup} style={{ padding: '8px 12px' }}>Créer</button>
      </div>
      {info && <p style={{ marginTop: 10 }}>{info}</p>}
    </div>
  );
}
