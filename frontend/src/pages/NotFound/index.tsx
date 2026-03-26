import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <h1 style={{ fontSize: '60px', marginBottom: '20px' }}>404</h1>
      <p style={{ fontSize: '18px', color: '#999', marginBottom: '30px' }}>页面不存在</p>
      <Link to="/">
        <button className="btn btn-primary">返回首页</button>
      </Link>
    </div>
  )
}
