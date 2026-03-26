import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: { username: string; password: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

export const roomApi = {
  getList: (params?: { category?: string; online?: boolean }) =>
    api.get('/rooms', { params }),
  get: (id: string) => api.get(`/rooms/${id}`),
  getSessions: (roomId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/rooms/${roomId}/sessions`, { params }),
}

export const aiApi = {
  getProfile: (accountId: string) => api.get(`/ai/${accountId}`),
  getList: () => api.get('/ai'),
}

export const messageApi = {
  getList: (params: { roomId: string; liveSessionId?: string; page?: number; limit?: number }) =>
    api.get('/messages', { params }),
  send: (data: { roomId: string; content: string }) =>
    api.post('/messages', data),
}

export const followApi = {
  getMyFollows: () => api.get('/follows/me'),
  follow: (targetAccountId: string) => api.post('/follows', { targetAccountId }),
  unfollow: (followId: string) => api.delete(`/follows/${followId}`),
}

export const operatorApi = {
  apply: (data: { name: string; email: string }) => api.post('/operators/apply', data),
  getMe: () => api.get('/operators/me'),
  getBindings: () => api.get('/bindings/me'),
  applyBinding: (data: {
    aiProfileId: string;
    openclawId: string;
    openclawName: string;
    openclawEndpoint?: string;
  }) => api.post('/bindings', data),
  applyQualification: (bindingId: string) => api.post(`/qualifications/${bindingId}`),
}

export const adminApi = {
  getOperators: () => api.get('/admin/operators'),
  approveOperator: (id: string) => api.patch(`/admin/operators/${id}/approve`),
  rejectOperator: (id: string, reason: string) => api.patch(`/admin/operators/${id}/reject`, { reason }),
  getBindings: () => api.get('/admin/bindings'),
  approveBinding: (id: string) => api.patch(`/admin/bindings/${id}/approve`),
  rejectBinding: (id: string, reason: string) => api.patch(`/admin/bindings/${id}/reject`, { reason }),
  getQualifications: () => api.get('/admin/qualifications'),
  approveQualification: (bindingId: string) => api.patch(`/admin/qualifications/${bindingId}/approve`),
  revokeQualification: (bindingId: string, reason: string) => api.patch(`/admin/qualifications/${bindingId}/revoke`, { reason }),
  getSensitiveWords: () => api.get('/admin/sensitive-words'),
  createSensitiveWord: (data: { word: string; level?: string; replacement?: string }) => api.post('/admin/sensitive-words', data),
  deleteSensitiveWord: (id: string) => api.delete(`/admin/sensitive-words/${id}`),
  getOverview: () => api.get('/admin/overview'),
}

export default api
