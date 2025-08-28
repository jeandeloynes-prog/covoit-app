'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

type Group = { id: string; name: string; created_at: string };

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
      setGroups(data || []);
      setLoading(false);
    };
    load();

    const channel = supabase.channel('groups-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'groups' }, () => {
        supabase.from('groups').select('*').order('created_at', { ascending: false }).then(({ data }) => setGroups(data || []));
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div>
      <h2>Mes groupes</h2>
      <a href="/groups/new">+ Créer un groupe</a>
      {loading ? <p>Chargement…</p> : (
        groups.length ? (
          <ul>
            {groups.map(g => (
              <li key={g.id} style={{ margin: '8px 0' }}>
                <a href={`/groups/${g.id}`}>{g.name}</a>
              </li>
            ))}
          </ul>
        ) : <p>Aucun groupe pour l’instant.</p>
      )}
    </div>
  );
}
