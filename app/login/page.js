'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('in');
  const [err, setErr] = useState('');
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const sb = getSupabase();
    try {
      if (mode === 'in') {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
      }
      router.push('/desk');
    } catch (ex) {
      setErr(ex.message || 'Could not enter.');
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    await getSupabase().auth.signOut();
    setUser(null);
  }

  return (
    <div className="wrap">
      <header className="top">
        <Link className="mark" href="/">Stillroom</Link>
        <nav>
          <Link href="/">Hall</Link>
        </nav>
      </header>

      <section className="hour">
        <small>Door</small>
        <h1>{user ? 'You are already inside.' : 'Come in quietly.'}</h1>
        <p>Email and a password. Sessions stay on this device.</p>
      </section>

      {user ? (
        <>
          <p className="meta">{user.email}</p>
          <p>
            <Link href="/desk">Go to your desk</Link>
          </p>
          <button className="ghost" onClick={leave}>Leave</button>
        </>
      ) : (
        <form className="stack" onSubmit={submit}>
          <input
            type="email"
            required
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && <div className="err">{err}</div>}
          <button disabled={busy}>{busy ? 'Working…' : mode === 'in' ? 'Enter' : 'Make a key'}</button>
          <button
            type="button"
            className="ghost"
            onClick={() => setMode(mode === 'in' ? 'up' : 'in')}
          >
            {mode === 'in' ? 'Need a key instead' : 'I already have a key'}
          </button>
        </form>
      )}
    </div>
  );
}
