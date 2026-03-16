import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import OperationDetail from './pages/OperationDetail'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard') // 'dashboard' | 'detail'
  const [selectedOpId, setSelectedOpId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  const navigate = (p, opId = null) => {
    setPage(p)
    setSelectedOpId(opId)
    window.scrollTo(0, 0)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text2)', fontSize: 14 }}>
      Caricamento…
    </div>
  )

  if (!session) return <Login />

  return (
    <>
      {page === 'dashboard' && (
        <Dashboard
          session={session}
          onOpenDetail={(id) => navigate('detail', id)}
        />
      )}
      {page === 'detail' && (
        <OperationDetail
          operationId={selectedOpId}
          session={session}
          onBack={() => navigate('dashboard')}
        />
      )}
    </>
  )
}
