'use client';
import { supabase } from "../../../lib/supabaseClient";
import { useEffect, useState } from 'react';

type Message = { id: number; content: string; created_at: string; user_id: string };

export default function GroupDetail({ params }: { params: { id: string } }) {
  const groupId = params.id;
  const [groupName, setGroupName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    supabase.from('groups').select('name').eq('id', groupId).single().then(({ data }) => setGroupName(data?.name ?? 'Groupe'));
    const load = async () => {
      const { data } = await supabase.from('messages')
        .select('*').eq('group_id', groupId).order('created_at', { ascending: true });
      setMessages(data || []);
    };
    load();

    const channel = supabase.channel(`messages-${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as any])
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId]);

  const send = async () => {
    if (!text.trim()) return;
    const { error } = await supabase.from('messages').insert({ group_id: groupId, content: text });
    if (!error) setText('');
  };

  return (
    <div>
      <h2>{groupName}</h2>
      <div style={{ border: '1px solid #eee', borderRadius: 6, padding: 10, minHeight: 200, maxHeight: 360, overflowY: 'auto' }}>
        {messages.map(m => (
          <div key={m.id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f1f1' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{new Date(m.created_at).toLocaleString('fr-BE')}</div>
            <div>{m.content}</div>
          </div>
        ))}
        {!messages.length && <div style={{ color: '#666' }}>Aucun message pour le moment.</div>}
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Écrire un message…"
               style={{ flex: 1, padding: 8 }} />
        <button onClick={send} style={{ padding: '8px 12px' }}>Envoyer</button>
      </div>
    </div>
  );
}
