import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import OperationDetail from './pages/OperationDetail'

export default function App() {
  const [userName, setUserName] = useState(localStorage.getItem('itops_name') || '')
  const [page, setPage] = useState('dashboard')
  const [selectedOpId, setSelectedOpId] = useState(null)

  const navigate = (p, opId = null) => {
    setPage(p)
    setSelectedOpId(opId)
    window.scrollTo(0, 0)
  }

  if (!userName) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg3)', padding: '1rem' }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 360 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>IT Ops Growth Tracker</div>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: '1.5rem' }}>Inserisci il tuo nome per continuare</div>
        <input
          type="text"
          placeholder="Es. Marco, Laura..."
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              const name = e.target.value.trim()
              localStorage.setItem('itops_name', name)
              setUserName(name)
            }
          }}
        />
        <button
          style={{ width: '100%', padding: '10px', background: 'var(--text)', color: 'var(--bg)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 10 }}
          onClick={e => {
            const input = e.target.previousSibling
            if (input.value.trim()) {
              const name = input.value.trim()
              localStorage.setItem('itops_na
