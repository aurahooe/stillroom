'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

export default function Home() {
  const [hour, setHour] = useState(null);
  const [notes, setNotes] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    (async () => {
      const { data: hours } = await sb
        .from('sr_hours')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      setHour(hours?.[0] || null);

      const { data: publicNotes } = await sb
        .from('sr_notes')
        .select('id, title, body, created_at, author_id, sr_profiles(handle, display_name)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(36);
      setNotes(publicNotes || []);
    })();

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="wrap">
      <header className="top">
        <Link className="mark" href="/">Stillroom</Link>
        <nav>
          {user ? (
            <>
              <Link href="/desk">Desk</Link>
              <Link href="/login">Account</Link>
            </>
          ) : (
            <Link href="/login">Enter</Link>
          )}
        </nav>
      </header>

      <section className="hour">
        <small>This hour</small>
        <h1>{hour?.headline || 'The room is still warming.'}</h1>
        <p>{hour?.blurb || 'Public notes land here. Private ones stay at your desk.'}</p>
      </section>

      {notes.length === 0 ? (
        <p className="empty">No public notes yet. Sit down and write one.</p>
      ) : (
        <div className="grid">
          {notes.map((n, i) => (
            <article className="note" key={n.id} style={{ animationDelay: `${i * 40}ms` }}>
              <h3>{n.title || 'Untitled slip'}</h3>
              <p>{n.body}</p>
              <div className="meta">
                {(n.sr_profiles?.display_name || n.sr_profiles?.handle || 'someone')} ·{' '}
                {new Date(n.created_at).toLocaleString()}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
