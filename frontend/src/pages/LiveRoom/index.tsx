import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { roomApi, messageApi, authApi } from '@/services/api'
import { connectSocket, disconnectSocket, joinRoom, leaveRoom, sendMessage, getSocket } from '@/services/socket'

interface Message {
  id: string
  sender: {
    accountId: string
    username: string
    accountType: string
    avatar?: string
  }
  content: string
  type: string
  createdAt: string
}

export default function LiveRoom() {
  const { roomId } = useParams<{ roomId: string }>()
  const [room, setRoom] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)

  const loadRoom = async () => {
    try {
      const res = await roomApi.get(roomId!)
      setRoom(res.data)
    } catch (error) {
      console.error('Failed to load room:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHistoryMessages = async () => {
    if (!roomId) return
    setLoadingMessages(true)
    try {
      const res = await messageApi.getList({
        roomId,
        limit: 50,
      })
      setMessages(res.data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoadingMessages(false)
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

  const handleSend = () => {
    if (!input.trim() || !user || !roomId) return
    
    sendMessage(roomId, input)
    setInput('')
  }

  useEffect(() => {
    if (roomId) {
      loadRoom()
      loadUser()
      loadHistoryMessages()
      
      const socket = connectSocket()
      joinRoom(roomId)
      setConnectionStatus('connecting')

      socket.on('connect', () => {
        setConnectionStatus('connected')
        joinRoom(roomId)
      })

      socket.on('disconnect', () => {
        setConnectionStatus('disconnected')
      })

      socket.on('message', (msg: Message) => {
        setMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      })

      socket.on('viewer_count', (data: { roomId: string; count: number }) => {
        if (data.roomId === roomId) {
          setViewerCount(data.count)
        }
      })

      return () => {
        leaveRoom(roomId)
        disconnectSocket()
      }
    }
  }, [roomId])

  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      isInitialLoad.current = false
      return
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`
    return date.toLocaleDateString('zh-CN')
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <div>正在加载直播间...</div>
      </div>
    )
  }

  return (
    <div className="live-room-page">
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

      <div className="chat-container">
        <div className="chat-main">
          <div className="live-video-area">
            {room?.aiProfile?.isOnline ? (
              <div className="live-content">
                <div className="live-avatar-large">
                  {room?.aiProfile?.avatar ? (
                    <img src={room.aiProfile.avatar} alt={room.aiProfile.name} />
                  ) : (
                    <span className="avatar-placeholder">🎬</span>
                  )}
                </div>
                <div className="live-title">{room?.liveSession?.title || 'AI 正在直播'}</div>
                <div className="live-viewers">
                  <span className="live-badge">LIVE</span>
                  <span className="viewer-count">{viewerCount} 人在线</span>
                </div>
              </div>
            ) : (
              <div className="offline-content">
                <div className="offline-avatar">
                  {room?.aiProfile?.avatar ? (
                    <img src={room.aiProfile.avatar} alt={room.aiProfile.name} />
                  ) : (
                    <span className="avatar-placeholder">😴</span>
                  )}
                </div>
                <div className="offline-text">主播未开播</div>
                <div className="offline-hint">敬请期待下次直播</div>
              </div>
            )}
          </div>
        </div>

        <div className="chat-sidebar">
          <div className="chat-header">
            <div className="ai-profile">
              <div className="ai-avatar">
                {room?.aiProfile?.avatar ? (
                  <img src={room.aiProfile.avatar} alt={room.aiProfile.name} />
                ) : (
                  <span className="avatar-placeholder-sm">🤖</span>
                )}
                {room?.aiProfile?.isOnline && <span className="online-dot"></span>}
              </div>
              <div className="ai-info">
                <h3 className="ai-name">{room?.aiProfile?.name}</h3>
                <p className="ai-bio">{room?.aiProfile?.bio}</p>
              </div>
            </div>
            {room?.aiProfile?.isOnline && (
              <div className="live-status">
                <span className="status-dot"></span>
                <span>{viewerCount} 人在线</span>
              </div>
            )}
          </div>
          
          <div className="connection-status" data-status={connectionStatus}>
            {connectionStatus === 'connecting' && <span>连接中...</span>}
            {connectionStatus === 'connected' && <span>已连接</span>}
            {connectionStatus === 'disconnected' && <span>连接断开，正在重连...</span>}
          </div>
          
          <div className="chat-messages">
            {loadingMessages ? (
              <div className="messages-loading">
                <div className="loading-spinner-sm"></div>
                <span>加载历史消息...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="messages-empty">
                <div>暂无消息</div>
                <div className="empty-hint">发送消息开始聊天吧~</div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.type === 'ai_reply' ? 'message-ai' : ''}`}>
                  <div className="message-header">
                    <span className="message-sender">
                      {msg.sender.username}
                      {msg.type === 'ai_reply' && <span className="ai-badge">AI</span>}
                    </span>
                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                  </div>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            {user ? (
              <>
                <textarea
                  className="chat-input"
                  placeholder="说点什么..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  rows={2}
                />
                <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={handleSend}>
                  发送
                </button>
              </>
            ) : (
              <p style={{ textAlign: 'center', color: '#999' }}>
                <Link to="/login">登录</Link> 后可以发言
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
