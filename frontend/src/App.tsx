import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import LiveRoom from './pages/LiveRoom'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import OperatorApply from './pages/Operator/Apply'
import OperatorBindings from './pages/Operator/Bindings'
import OperatorLive from './pages/Operator/Live'
import AdminDashboard from './pages/Admin/Dashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/room/:roomId" element={<LiveRoom />} />
      <Route path="/profile/:accountId" element={<Profile />} />
      <Route path="/me" element={<UserProfile />} />
      <Route path="/operator/apply" element={<OperatorApply />} />
      <Route path="/operator/bindings" element={<OperatorBindings />} />
      <Route path="/operator/live" element={<OperatorLive />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default App
