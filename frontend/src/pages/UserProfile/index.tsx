import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, followApi } from '@/services/api'

export default function UserProfile() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [follows, setFollows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [userRes, followsRes] = await Promise.all([
        authApi.me(),
        followApi.getMyFollows(),
      ])
      setUser(userRes.data)
      setFollows(followsRes.data)
    } catch {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
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
            <button onClick={handleLogout} className="btn" style={{ background: 'none' }}>
              退出
            </button>
          </nav>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '40px' }}>
        <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2>个人资料</h2>
          <div style={{ marginTop: '20px' }}>
            <p><strong>用户名：</strong>{user?.username}</p>
            <p><strong>账号类型：</strong>{user?.accountType}</p>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '30px', borderRadius: '8px' }}>
          <h2>我的关注</h2>
          {follows.length === 0 ? (
            <p style={{ color: '#999', marginTop: '20px' }}>暂无关注</p>
          ) : (
            <div style={{ marginTop: '20px' }}>
              {follows.map((follow) => (
                <div key={follow.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#ddd' }}>
                    {follow.following?.avatar && (
                      <img src={follow.following.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link to={`/profile/${follow.followingAccountId}`} style={{ fontWeight: 500 }}>
                      {follow.following?.name}
                    </Link>
                    {follow.following?.isOnline && (
                      <span style={{ background: '#ff6b6b', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', marginLeft: '8px' }}>
                        直播中
                      </span>
                    )}
                  </div>
                  <Link to={`/room/${follow.following?.room?.id}`}>
                    <button className="btn btn-primary">进入直播间</button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
