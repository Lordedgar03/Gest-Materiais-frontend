// src/services/api.js
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

// Base URL via .env (Vite) ou valor padrão
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api'

// LocalStorage keys
const TOKEN_KEY = 'token'
const USER_NAME_KEY = 'user_nome'

// Eventos de auth para o UI reagir (logout/forbidden)
export const authEvents = {
  onLogout: (cb) => {
    const handler = (e) => cb(e.detail)
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  },
  emitLogout: (detail) => window.dispatchEvent(new CustomEvent('auth:logout', { detail })),
  onForbidden: (cb) => {
    const handler = () => cb()
    window.addEventListener('auth:forbidden', handler)
    return () => window.removeEventListener('auth:forbidden', handler)
  },
  emitForbidden: () => window.dispatchEvent(new CustomEvent('auth:forbidden')),
}

// Helpers de token
export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const setAuth = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    clearAuth()
  }
}

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_NAME_KEY)
  delete api.defaults.headers.common['Authorization']
}

function isJwtExpired(token) {
  try {
    const { exp } = jwtDecode(token)
    if (!exp) return false
    const now = Math.floor(Date.now() / 1000)
    return exp <= now
  } catch {
    // token inválido/corrompido
    return true
  }
}

function handleAutoLogout(reason) {
  clearAuth()
  authEvents.emitLogout({ reason })
  // Redireciona de forma segura fora de componentes React
  if (location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

// Instância Axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Interceptor de request
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    if (isJwtExpired(token)) {
      handleAutoLogout('expired')
      return Promise.reject(new axios.Cancel('Sessão expirada'))
    }
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  // X-Request-Id para correlação no backend
  try {
    const id = crypto?.randomUUID?.()
    if (id) config.headers['X-Request-Id'] = id
  } catch {}
  return config
})

// Interceptor de response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error)

    const status = error?.response?.status
    if (status === 401) {
      handleAutoLogout('invalid')
    } else if (status === 403) {
      authEvents.emitForbidden()
    }
    return Promise.reject(error)
  }
)

// Helpers HTTP com sanitização de params
function sanitize(obj) {
  if (!obj) return undefined
  const out = {}
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (typeof v === 'string' && v.trim() === '') return
    out[k] = v
  })
  return out
}

export const http = {
  get: (url, params, config) => api.get(url, { params: sanitize(params), ...config }),
  post: (url, body, config) => api.post(url, body, config),
  put: (url, body, config) => api.put(url, body, config),
  patch: (url, body, config) => api.patch(url, body, config),
  delete: (url, config) => api.delete(url, config),
}

export default api
