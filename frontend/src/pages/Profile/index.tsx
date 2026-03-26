import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { aiApi, followApi, authApi } from '@/services/api'

export default function Profile() {
  const { accountId } = useParams<{ accountId: string }>()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followingId, setFollowingId] = useState<string | null>(null)
  const [followingLoading, setFollowingLoading] = useState(false)

  useEffect(() => {
    if (accountId) {
      loadProfile()
      loadUser()
    }
  }, [accountId])

  const loadProfile = async () => {
    try {
      const res = await aiApi.getProfile(accountId!)
      setProfile(res.data)
      setIsFollowing(res.data.isFollowing || false)
      
      if (res.data.isFollowing) {
        const followsRes = await followApi.getMyFollows()
        const follow = followsRes.data.find((f: any) => f.followingAccountId === accountId)
        if (follow) {
          setFollowingId(follow.id)
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUser = async () => {
    try {
      const res = await authApi.me()
      setUser(res.data)
    } catch {
      // Not logged in
    }
  }

  const handleFollow = async () => {
    if (!user || followingLoading) return
    
    setFollowingLoading(true)
    try {
      if (isFollowing) {
        if (followingId) {
          await followApi.unfollow(followingId)
        }
        setIsFollowing(false)
        setFollowingId(null)
      } else {
        const res = await followApi.follow(accountId!)
        setFollowingId(res.data.id)
        setIsFollowing(true)
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失败')
    } finally {
      setFollowingLoading(false)
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (!profile) {
    return <div>用户不存在</div>
  }

  return (
    <div>
      <header className="header">
        <div className="container header-content">
          <Link to="/" className="logo">AI 直播</Link>
          <nav className="nav">
            <Link to="/">首页</Link>
            {user ? (
              <Link to="/me">我的</Link>
            ) : (
              <Link to="/login">登录</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '40px' }}>
        <div style={{ background: '#fff', padding: '30px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', gap: '30px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
              {profile.avatar ? <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : '🤖'}
            </div>
            
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>{profile.name}</h1>
              
              {profile.isOnline && (
                <span style={{ background: '#ff6b6b', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', marginBottom: '15px', display: 'inline-block' }}>
                  🔴 直播中
                </span>
              )}
              
              <p style={{ color: '#666', marginBottom: '20px' }}>{profile.bio}</p>
              
              {profile.tags && profile.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  {profile.tags.map((tag: string) => (
                    <span key={tag} style={{ background: '#f0f0f0', padding: '4px 12px', borderRadius: '4px', fontSize: '12px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '20px', color: '#999', marginBottom: '20px' }}>
                <span>{profile.followerCount || 0} 粉丝</span>
              </div>

              {user && user.accountType === 'human' && (
                <button 
                  className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={handleFollow}
                  disabled={followingLoading}
                >
                  {followingLoading ? '处理中...' : isFollowing ? '已关注' : '关注'}
                </button>
              )}

              {profile.currentRoomId && (
                <Link to={`/room/${profile.currentRoomId}`}>
                  <button className="btn btn-primary" style={{ marginLeft: '10px' }}>
                    进入直播间
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
