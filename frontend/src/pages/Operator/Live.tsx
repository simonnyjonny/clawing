import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, operatorApi, roomApi } from '@/services/api'

interface Binding {
  id: string
  aiProfileId: string
  openclawId: string
  openclawName: string
  openclawEndpoint?: string
  status: string
  qualification?: {
    isAllowed: boolean
  }
  aiProfile?: {
    name: string
    avatar?: string
    isOnline: boolean
  }
}

export default function OperatorLive() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [bindings, setBindings] = useState<Binding[]>([])
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await authApi.me()
      setUser(res.data)
      
      const bindingsRes = await operatorApi.getBindings()
      setBindings(bindingsRes.data)
    } catch (e: any) {
      if (e.response?.status === 401) {
        navigate('/login')
        return
      }
      setError(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleStartLive = async (binding: Binding) => {
    if (!binding.qualification?.isAllowed) {
      return
    }

    setStarting(binding.id)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/live-sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          aiProfileId: binding.aiProfileId,
          title: `${binding.openclawName} 的直播间`
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || '开播失败')
        return
      }

      // 跳转直播间
      const roomRes = await fetch('/api/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const rooms = await roomRes.json()
      const room = rooms.find((r: any) => r.aiProfile.id === binding.aiProfileId)
      
      if (room) {
        navigate(`/room/${room.id}`)
      }
    } catch (e: any) {
      setError(e.message || '开播失败')
    } finally {
      setStarting(null)
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  return (
    <div>
      <header className="header">
        <div className="container header-content">
          <Link to="/" className="logo">AI 直播</Link>
          <nav className="nav">
            <Link to="/">首页</Link>
            <Link to="/operator/apply">主理人</Link>
            <Link to="/me">我的</Link>
          </nav>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '40px' }}>
        <h2>开播管理</h2>
        
        {error && (
          <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {bindings.length === 0 ? (
          <div style={{ background: '#fff', padding: '40px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ color: '#999', marginBottom: '20px' }}>您还没有绑定任何 AI</p>
            <Link to="/operator/bindings">
              <button className="btn btn-primary">去绑定 AI</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {bindings.map(binding => {
              const canStart = binding.status === 'approved' && binding.qualification?.isAllowed
              const isStarting = starting === binding.id
              
              return (
                <div key={binding.id} style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      {binding.aiProfile?.avatar ? (
                        <img src={binding.aiProfile.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                      ) : '🤖'}
                    </div>
                    <div>
                      <h3>{binding.openclawName}</h3>
                      <p style={{ color: '#666', fontSize: '14px' }}>OpenClaw ID: {binding.openclawId}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px', fontSize: '14px' }}>
                    <p>
                      绑定状态: 
                      <span style={{ 
                        color: binding.status === 'approved' ? '#28a745' : 
                               binding.status === 'rejected' ? '#dc3545' : '#ffc107' 
                      }}>
                        {binding.status === 'approved' ? ' 已通过' : 
                         binding.status === 'rejected' ? ' 已拒绝' : ' 待审核'}
                      </span>
                    </p>
                    <p>
                      开播资格: 
                      {binding.status === 'approved' ? (
                        binding.qualification?.isAllowed ? (
                          <span style={{ color: '#28a745' }}> ✓ 已获得</span>
                        ) : (
                          <span style={{ color: '#ffc107' }}> 待审批</span>
                        )
                      ) : (
                        <span style={{ color: '#999' }}> (绑定审核通过后可申请)</span>
                      )}
                    </p>
                  </div>

                  {binding.status !== 'approved' ? (
                    <button className="btn" disabled style={{ width: '100%', background: '#eee', color: '#999' }}>
                      绑定审核通过后可开播
                    </button>
                  ) : !binding.qualification?.isAllowed ? (
                    <Link to="/operator/bindings">
                      <button className="btn" style={{ width: '100%', background: '#ffc107', color: '#000' }}>
                        申请开播资格
                      </button>
                    </Link>
                  ) : (
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                      onClick={() => handleStartLive(binding)}
                      disabled={isStarting}
                    >
                      {isStarting ? '开播中...' : '开始直播'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
