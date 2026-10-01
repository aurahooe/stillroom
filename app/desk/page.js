'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

export default function Desk() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [err, setErr] = useState('');

  async function load(sb, uid) {
    const { data } = await sb
      .from('sr_notes')
      .select('*')
      .eq('author_id', uid)
      .order('created_at', { ascending: false });
    setNotes(data || []);
  }

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace('/login');
        return;
      }
      setUser(data.user);
      await load(sb, data.user.id);
      setReady(true);
    });
  }, [router]);

  async function save(e) {
    e.preventDefault();
    setErr('');
    const sb = getSupabase();
    const { error } = await sb.from('sr_notes').insert({
      author_id: user.id,
      title: title.trim(),
      body: body.trim(),
      is_public: isPublic,
    });
    if (error) {
      setErr(error.message);
      return;
    }
    setTitle('');
    setBody('');
    setIsPublic(false);
    await load(sb, user.id);
  }

  async function togglePublic(note) {
    const sb = getSupabase();
    await sb.from('sr_notes').update({ is_public: !note.is_public }).eq('id', note.id);
    await load(sb, user.id);
  }

  async function remove(note) {
    const sb = getSupabase();
    await sb.from('sr_notes').delete().eq('id', note.id);
    await load(sb, user.id);
  }

  if (!ready) return <div className="wrap"><p className="empty">Opening the desk…</p></div>;

  return (
    <div className="wrap">
      <header className="top">
        <Link className="mark" href="/">Stillroom</Link>
        <nav>
          <Link href="/">Hall</Link>
          <Link href="/login">Account</Link>
        </nav>
      </header>

      <section className="hour">
        <small>Your desk</small>
        <h1>Write it down. Keep it, or put it in the hall.</h1>
        <p>Public slips appear on the front table. Private ones stay here.</p>
      </section>

      <form className="stack" onSubmit={save} style={{ marginBottom: 36 }}>
        <input placeholder="title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea required placeholder="the note itself" value={body} onChange={(e) => setBody(e.target.value)} />
        <label className="chk">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Mark as public
        </label>
        {err && <div className="err">{err}</div>}
        <button>Save slip</button>
      </form>

      {notes.length === 0 ? (
        <p className="empty">The blotter is empty.</p>
      ) : (
        <div className="grid">
          {notes.map((n) => (
            <article className="note" key={n.id}>
              <h3>{n.title || 'Untitled slip'}</h3>
              <p>{n.body}</p>
              <div className="meta">{n.is_public ? 'public' : 'private'}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="ghost" type="button" onClick={() => togglePublic(n)}>
                  {n.is_public ? 'Keep private' : 'Make public'}
                </button>
                <button className="ghost" type="button" onClick={() => remove(n)}>
                  Burn
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
