import { useState } from 'react'
import { supabase } from '../lib/supabase'

const s = {
  wrap: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '1rem', background: 'var(--bg3)',
  },
  card: {
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 360,
    boxShadow: 'var(--shadow)',
  },
  logo: { fontSize: 28, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 4 },
  sub: { fontSize: 14, color: 'var(--text2)', marginBottom: '1.5rem' },
  field: { marginBottom: 12 },
  label: { display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 4 },
  btn: {
    width: '100%', padding: '10px', background: 'var(--text)',
    color: 'var(--bg)', border: 'none', borderRadius: 8,
    fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 8,
  },
  msg: { fontSize: 13, marginTop: 12, textAlign: 'center' },
  toggle: {
    background: 'none', border: 'none', color: 'var(--blue)',
    fontSize: 13, cursor: 'pointer', padding: 0, marginTop: 16,
    display: 'block', width: '100%', textAlign: 'center',
  },
  err: { fontSize: 13, color: 'var(--red)', marginTop: 8, textAlign: 'center' },
}

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const handle = async () => {
    setErr(''); setMsg(''); setLoading(true)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } },
      })
      if (error) setErr(error.message)
      else setMsg('Controlla la tua email per confermare la registrazione.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErr('Email o password errata.')
    }
    setLoading(false)
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>📋</div>
        <div style={s.title}>IT Ops Growth Tracker</div>
        <div style={s.sub}>{mode === 'login' ? 'Accedi al tuo account' : 'Crea un nuovo account'}</div>

        {mode === 'signup' && (
          <div style={s.field}>
            <label style={s.label}>Il tuo nome</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Es. Marco Rossi" />
          </div>
        )}
        <div style={s.field}>
          <label style={s.label}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@azienda.it"
            onKeyDown={e => e.key === 'Enter' && handle()} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handle()} />
        </div>

        {err && <div style={s.err}>{err}</div>}
        {msg && <div style={{ ...s.msg, color: 'var(--green)' }}>{msg}</div>}

        <button style={s.btn} onClick={handle} disabled={loading}>
          {loading ? 'Caricamento…' : mode === 'login' ? 'Accedi' : 'Registrati'}
        </button>

        <button style={s.toggle} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); setMsg('') }}>
          {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
        </button>
      </div>
    </div>
  )
}
