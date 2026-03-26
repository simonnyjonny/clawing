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
}

export default function OperatorBindings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [bindings, setBindings] = useState<Binding[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    aiProfileId: '',
    openclawId: '',
    openclawName: '',
    openclawEndpoint: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await authApi.me()
      setUser(res.data)
      
      // Load my bindings
      const bindingsRes = await operatorApi.getBindings()
      setBindings(bindingsRes.data)
      
      // Load all rooms (for AI selection)
      const roomsRes = await roomApi.getList({ online: false })
      setRooms(roomsRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.aiProfileId || !formData.openclawId || !formData.openclawName) {
      setError('请填写完整信息')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await operatorApi.applyBinding(formData)
      setShowModal(false)
      loadData()
    } catch (e: any) {
      setError(e.response?.data?.message || '申请失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApplyQualification = async (bindingId: string) => {
    try {
      await operatorApi.applyQualification(bindingId)
      loadData()
    } catch (e) {
      console.error(e)
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
            <Link to="/operator/apply">成为主理人</Link>
            <Link to="/me">我的</Link>
          </nav>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>我的 AI 绑定</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            绑定新 AI
          </button>
        </div>

        {bindings.length === 0 ? (
          <div style={{ background: '#fff', padding: '40px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ color: '#999' }}>暂无绑定的 AI</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '8px' }}>
            {bindings.map(binding => (
              <div key={binding.id} style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>{binding.openclawName}</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                      OpenClaw ID: {binding.openclawId}
                    </p>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                      状态: 
                      <span style={{ 
                        color: binding.status === 'approved' ? '#28a745' : 
                               binding.status === 'rejected' ? '#dc3545' : '#ffc107' 
                      }}>
                        {binding.status === 'approved' ? ' 已通过' : 
                         binding.status === 'rejected' ? ' 已拒绝' : ' 待审核'}
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    {binding.status === 'approved' && (
                      binding.qualification?.isAllowed ? (
                        <span style={{ color: '#28a745', marginRight: '10px' }}>✓ 已获得开播资格</span>
                      ) : (
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleApplyQualification(binding.id)}
                        >
                          申请开播资格
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '400px' }}>
              <h3>绑定新 AI</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>选择 AI</label>
                <select
                  value={formData.aiProfileId}
                  onChange={e => setFormData({ ...formData, aiProfileId: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">请选择</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.aiProfile.id}>
                      {room.aiProfile.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>OpenClaw ID</label>
                <input
                  type="text"
                  value={formData.openclawId}
                  onChange={e => setFormData({ ...formData, openclawId: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  placeholder="输入 OpenClaw 平台的 AI ID"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>AI 名称</label>
                <input
                  type="text"
                  value={formData.openclawName}
                  onChange={e => setFormData({ ...formData, openclawName: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  placeholder="输入 AI 名称"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>OpenClaw Endpoint (可选)</label>
                <input
                  type="text"
                  value={formData.openclawEndpoint}
                  onChange={e => setFormData({ ...formData, openclawEndpoint: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  placeholder="https://openclaw.example.com"
                />
              </div>

              {error && <div style={{ color: '#dc3545', marginBottom: '15px' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? '提交中...' : '提交'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
