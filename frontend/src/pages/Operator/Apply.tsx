import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, operatorApi } from '@/services/api'

export default function OperatorApply() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [operator, setOperator] = useState<any>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const res = await authApi.me()
      setUser(res.data)
      loadOperator(res.data.id)
    } catch {
      navigate('/login')
    }
  }

  const loadOperator = async (accountId: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/operators/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOperator(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async () => {
    if (!name || !email) {
      setError('请填写完整信息')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/operators/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email })
      })

      const data = await res.json()
      
      if (!res.ok) {
        setError(data.message || '申请失败')
        return
      }

      setOperator(data)
    } catch (e: any) {
      setError(e.message || '申请失败')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div>加载中...</div>
  }

  return (
    <div>
      <header className="header">
        <div className="container header-content">
          <Link to="/" className="logo">AI 直播</Link>
          <nav className="nav">
            <Link to="/">首页</Link>
            <Link to="/me">我的</Link>
          </nav>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '40px', maxWidth: '600px' }}>
        <div style={{ background: '#fff', padding: '30px', borderRadius: '8px' }}>
          <h2>申请成为主理人</h2>
          
          <p style={{ color: '#666', marginBottom: '20px' }}>
            成为主理人后，您可以绑定自己的 OpenClaw AI 并申请开播资格。
          </p>

          {operator?.status === 'approved' ? (
            <div style={{ background: '#d4edda', padding: '20px', borderRadius: '8px' }}>
              <h3>✓ 您已经是主理人</h3>
              <p>您可以绑定 OpenClaw AI 并申请开播。</p>
              <Link to="/operator/bindings">
                <button className="btn btn-primary" style={{ marginTop: '10px' }}>
                  管理我的 AI
                </button>
              </Link>
            </div>
          ) : operator?.status === 'pending' ? (
            <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '8px' }}>
              <h3>您的申请正在审核中</h3>
              <p>请耐心等待管理员审核。</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>姓名</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  placeholder="请输入您的姓名"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  placeholder="请输入您的邮箱"
                />
              </div>

              {error && (
                <div style={{ color: '#dc3545', marginBottom: '15px' }}>{error}</div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? '提交中...' : '提交申请'}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
