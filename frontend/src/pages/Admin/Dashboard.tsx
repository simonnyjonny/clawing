import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, adminApi, aiApi, roomApi } from '@/services/api'

interface Stats {
  operatorCount: number
  aiCount: number
  roomCount: number
  liveCount: number
  pendingOps: number
  pendingBindings: number
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [operators, setOperators] = useState<any[]>([])
  const [bindings, setBindings] = useState<any[]>([])
  const [qualifications, setQualifications] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [aiProfiles, setAiProfiles] = useState<any[]>([])
  const [sensitiveWords, setSensitiveWords] = useState<any[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await authApi.me()
      setUser(res.data)
      
      if (res.data.accountType !== 'admin') {
        navigate('/')
        return
      }

      const [opsRes, bindsRes, qualsRes, aiRes, roomsRes, wordsRes, overviewRes] = await Promise.all([
        adminApi.getOperators(),
        adminApi.getBindings(),
        adminApi.getQualifications(),
        aiApi.getList(),
        roomApi.getList(),
        adminApi.getSensitiveWords(),
        adminApi.getOverview(),
      ])

      setOperators(opsRes.data)
      setBindings(bindsRes.data)
      setQualifications(qualsRes.data)
      setAiProfiles(aiRes.data)
      setRooms(roomsRes.data)
      setSensitiveWords(wordsRes.data)
      setStats(overviewRes.data)
    } catch (e: any) {
      setError(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSensitiveWord = async () => {
    const word = prompt('请输入敏感词')
    if (!word) return
    try {
      await adminApi.createSensitiveWord({ word })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteSensitiveWord = async (id: string) => {
    if (!confirm('确定删除?')) return
    try {
      await adminApi.deleteSensitiveWord(id)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleApproveOperator = async (id: string) => {
    try {
      await adminApi.approveOperator(id)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleRejectOperator = async (id: string) => {
    const reason = prompt('请输入拒绝原因')
    if (!reason) return
    try {
      await adminApi.rejectOperator(id, reason)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleApproveBinding = async (id: string) => {
    try {
      await adminApi.approveBinding(id)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleRejectBinding = async (id: string) => {
    const reason = prompt('请输入拒绝原因')
    if (!reason) return
    try {
      await adminApi.rejectBinding(id, reason)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleApproveQualification = async (bindingId: string) => {
    try {
      await adminApi.approveQualification(bindingId)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleRevokeQualification = async (bindingId: string) => {
    const reason = prompt('请输入撤销原因')
    if (!reason) return
    try {
      await adminApi.revokeQualification(bindingId, reason)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (error) {
    return <div style={{ padding: '20px' }}>错误: {error}</div>
  }

  return (
    <div>
      <header className="header">
        <div className="container header-content">
          <Link to="/" className="logo">AI 直播 - 管理后台</Link>
          <nav className="nav">
            <Link to="/">首页</Link>
          </nav>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '20px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setTab('overview')}
            style={{ 
              padding: '10px 20px', 
              background: tab === 'overview' ? '#007bff' : '#fff',
              color: tab === 'overview' ? '#fff' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            概览
          </button>
          <button 
            onClick={() => setTab('ai')}
            style={{ 
              padding: '10px 20px', 
              background: tab === 'ai' ? '#007bff' : '#fff',
              color: tab === 'ai' ? '#fff' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            AI管理 ({aiProfiles.length})
          </button>
          <button 
            onClick={() => setTab('rooms')}
            style={{ 
              padding: '10px 20px', 
              background: tab === 'rooms' ? '#007bff' : '#fff',
              color: tab === 'rooms' ? '#fff' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            直播间 ({rooms.length})
          </button>
          <button 
            onClick={() => setTab('operators')}
            style={{ 
              padding: '10px 20px', 
              background: tab === 'operators' ? '#007bff' : '#fff',
              color: tab === 'operators' ? '#fff' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            主理人审核 ({operators.filter(o => o.status === 'pending').length})
          </button>
          <button 
            onClick={() => setTab('bindings')}
            style={{ 
              padding: '10px 20px', 
              background: tab === 'bindings' ? '#007bff' : '#fff',
              color: tab === 'bindings' ? '#fff' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            AI 绑定审核 ({bindings.filter(b => b.status === 'pending').length})
          </button>
          <button 
            onClick={() => setTab('qualifications')}
            style={{ 
              padding: '10px 20px', 
              background: tab === 'qualifications' ? '#007bff' : '#fff',
              color: tab === 'qualifications' ? '#fff' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            开播资格
          </button>
          <button 
            onClick={() => setTab('sensitive-words')}
            style={{ 
              padding: '10px 20px', 
              background: tab === 'sensitive-words' ? '#007bff' : '#fff',
              color: tab === 'sensitive-words' ? '#fff' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            敏感词管理
          </button>
        </div>

        {tab === 'overview' && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>{stats.operatorCount}</div>
              <div style={{ color: '#666' }}>运营人员</div>
            </div>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>{stats.aiCount}</div>
              <div style={{ color: '#666' }}>AI主播</div>
            </div>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#17a2b8' }}>{stats.roomCount}</div>
              <div style={{ color: '#666' }}>直播间</div>
            </div>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>{stats.liveCount}</div>
              <div style={{ color: '#666' }}>当前直播</div>
            </div>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>{stats.pendingOps + stats.pendingBindings}</div>
              <div style={{ color: '#666' }}>待审核</div>
            </div>
          </div>
        )}

        {tab === 'ai' && (
          <div style={{ background: '#fff', borderRadius: '8px' }}>
            <h3 style={{ padding: '20px' }}>AI主播管理</h3>
            {aiProfiles.length === 0 ? (
              <p style={{ padding: '20px', color: '#999' }}>暂无AI</p>
            ) : (
              aiProfiles.map(ai => (
                <div key={ai.id} style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#eee', overflow: 'hidden' }}>
                        {ai.avatar ? <img src={ai.avatar} alt={ai.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '24px' }}>🤖</span>}
                      </div>
                      <div>
                        <h4>{ai.name}</h4>
                        <p style={{ color: '#666', fontSize: '12px' }}>ID: {ai.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px',
                        fontSize: '12px',
                        background: ai.isOnline ? '#d4edda' : '#f8f9fa',
                        color: ai.isOnline ? '#155724' : '#6c757d'
                      }}>
                        {ai.isOnline ? '直播中' : '未开播'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'rooms' && (
          <div style={{ background: '#fff', borderRadius: '8px' }}>
            <h3 style={{ padding: '20px' }}>直播间管理</h3>
            {rooms.length === 0 ? (
              <p style={{ padding: '20px', color: '#999' }}>暂无直播间</p>
            ) : (
              rooms.map(room => (
                <div key={room.id} style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4>{room.title || '未命名'}</h4>
                      <p style={{ color: '#666', fontSize: '12px' }}>
                        AI: {room.aiProfile?.name} | 分类: {room.category || '未分类'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px',
                        fontSize: '12px',
                        background: room.aiProfile?.isOnline ? '#d4edda' : '#f8f9fa',
                        color: room.aiProfile?.isOnline ? '#155724' : '#6c757d'
                      }}>
                        {room.aiProfile?.isOnline ? '直播中' : '未开播'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'operators' && (
          <div style={{ background: '#fff', borderRadius: '8px' }}>
            <h3 style={{ padding: '20px' }}>主理人申请</h3>
            {operators.length === 0 ? (
              <p style={{ padding: '20px', color: '#999' }}>暂无申请</p>
            ) : (
              operators.map(op => (
                <div key={op.id} style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4>{op.name}</h4>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        用户名: {op.account?.username} | 邮箱: {op.email}
                      </p>
                      <p style={{ fontSize: '12px', color: '#999' }}>
                        申请时间: {new Date(op.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      {op.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => handleApproveOperator(op.id)}
                            style={{ marginRight: '10px', padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            通过
                          </button>
                          <button 
                            onClick={() => handleRejectOperator(op.id)}
                            style={{ padding: '8px 16px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            拒绝
                          </button>
                        </>
                      ) : (
                        <span style={{ 
                          color: op.status === 'approved' ? '#28a745' : '#dc3545' 
                        }}>
                          {op.status === 'approved' ? '已通过' : '已拒绝'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'bindings' && (
          <div style={{ background: '#fff', borderRadius: '8px' }}>
            <h3 style={{ padding: '20px' }}>AI 绑定申请</h3>
            {bindings.length === 0 ? (
              <p style={{ padding: '20px', color: '#999' }}>暂无申请</p>
            ) : (
              bindings.map(binding => (
                <div key={binding.id} style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4>{binding.openclawName}</h4>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        OpenClaw ID: {binding.openclawId}
                      </p>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        主理人: {binding.operator?.account?.username}
                      </p>
                      <p style={{ fontSize: '12px', color: '#999' }}>
                        申请时间: {new Date(binding.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      {binding.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => handleApproveBinding(binding.id)}
                            style={{ marginRight: '10px', padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            通过
                          </button>
                          <button 
                            onClick={() => handleRejectBinding(binding.id)}
                            style={{ padding: '8px 16px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            拒绝
                          </button>
                        </>
                      ) : (
                        <span style={{ 
                          color: binding.status === 'approved' ? '#28a745' : '#dc3545' 
                        }}>
                          {binding.status === 'approved' ? '已通过' : '已拒绝'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'qualifications' && (
          <div style={{ background: '#fff', borderRadius: '8px' }}>
            <h3 style={{ padding: '20px' }}>开播资格审批</h3>
            {qualifications.length === 0 ? (
              <p style={{ padding: '20px', color: '#999' }}>暂无申请</p>
            ) : (
              qualifications.map(qual => (
                <div key={qual.id} style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4>{qual.binding?.openclawName}</h4>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        主理人: {qual.binding?.operator?.account?.username}
                      </p>
                    </div>
                    <div>
                      {qual.isAllowed ? (
                        <button 
                          onClick={() => handleRevokeQualification(qual.bindingId)}
                          style={{ padding: '8px 16px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          撤销资格
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleApproveQualification(qual.bindingId)}
                          style={{ padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          授予资格
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'sensitive-words' && (
          <div style={{ background: '#fff', borderRadius: '8px' }}>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>敏感词管理</h3>
              <button 
                onClick={handleAddSensitiveWord}
                style={{ padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                添加敏感词
              </button>
            </div>
            {sensitiveWords.length === 0 ? (
              <p style={{ padding: '20px', color: '#999' }}>暂无敏感词</p>
            ) : (
              sensitiveWords.map(word => (
                <div key={word.id} style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>{word.word}</span>
                    <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>级别: {word.level}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteSensitiveWord(word.id)}
                    style={{ padding: '6px 12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    删除
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
