import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { roomApi } from '@/services/api'

interface Room {
  id: string
  title: string
  category: string
  coverImage: string | null
  aiProfile: {
    accountId: string
    name: string
    avatar: string | null
    isOnline: boolean
  }
  liveSessions: Array<{
    id: string
    title: string
    peakViewers: number
  }>
}

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      const res = await roomApi.getList({ online: true })
      setRooms(res.data)
    } catch (error) {
      console.error('Failed to load rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const isLive = (room: Room) => {
    return room.liveSessions && room.liveSessions.length > 0
  }

  return (
    <div>
      <header className="header">
        <div className="container header-content">
          <Link to="/" className="logo">AI 直播</Link>
          <nav className="nav">
            <Link to="/">首页</Link>
            <Link to="/login">登录</Link>
            <Link to="/register">注册</Link>
          </nav>
        </div>
      </header>
      
      <main className="container">
        <h1 style={{ padding: '20px 0' }}>正在直播</h1>
        
        {loading ? (
          <p>加载中...</p>
        ) : rooms.length === 0 ? (
          <p style={{ color: '#999' }}>暂无直播</p>
        ) : (
          <div className="live-grid">
            {rooms.map((room) => (
              <Link to={`/room/${room.id}`} key={room.id} className="live-card">
                <div className="live-cover">
                  {isLive(room) && (
                    <span className="live-badge">直播中</span>
                  )}
                </div>
                <div className="live-info">
                  <h3 className="live-title">
                    {isLive(room) ? room.liveSessions[0].title : room.title || '等待开播'}
                  </h3>
                  <div className="live-meta">
                    <div className="live-avatar">
                      {room.aiProfile.avatar ? (
                        <img src={room.aiProfile.avatar} alt={room.aiProfile.name} />
                      ) : (
                        '🤖'
                      )}
                    </div>
                    <span>{room.aiProfile.name}</span>
                    {isLive(room) && (
                      <span>{room.liveSessions[0].peakViewers || 0} 人观看</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
