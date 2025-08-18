import axios from 'axios'
import api from './api' // seu axios autenticado (baseURL: '/api', interceptors, etc.)

// Cria um cliente "root" (sem /api) para o endpoint de login
function makeRootClient() {
  // tenta deduzir a base do root a partir do api.defaults.baseURL
  const base = api?.defaults?.baseURL || ''
  const rootBase = base.replace(/\/?api\/?$/, '') || '/'
  return axios.create({ baseURL: rootBase })
}
const root = makeRootClient()

// ------- Helpers de Auth Header -------
export function setAuthToken(token) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
export function clearAuthToken() {
  delete api.defaults.headers.common['Authorization']
}
export function getAuthToken() {
  return api.defaults.headers.common['Authorization']?.replace(/^Bearer\s+/, '') || null
}

// ------- Normalizadores -------
export function normalizeUser(u = {}) {
  return {
    user_id: Number(u.user_id ?? u.id),
    user_nome: u.user_nome || '',
    user_email: u.user_email || '',
    user_status: u.user_status || 'ativo',
    user_tipo: u.user_tipo ?? null, // primeira role no listUsers
    // opcionalmente traga roles quando vierem no objeto
    roles: Array.isArray(u.roles) ? u.roles.map(r => (typeof r === 'string' ? r : (r.role_name || r))) : [],
    templates: Array.isArray(u.templates) ? u.templates : [],
  }
}

export function normalizeTemplate(t = {}) {
  return {
    template_code: t.template_code,
    resource_type: t.resource_type ?? null,
    resource_id: t.resource_id ?? null,
  }
}

// ------- API Calls -------
export async function loginUser({ user_email, user_senha }) {
  const { data } = await root.post('/users/login', { user_email, user_senha })
  // data: { message, token, roles, templates }
  return data
}

export async function logoutUser() {
  const { data } = await api.post('/users/logout')
  return data
}

export async function listUsers(signal) {
  const res = await api.get('/users', { signal })
  const arr = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : [])
  return arr.map(normalizeUser)
}

export async function getUser(id, signal) {
  const { data } = await api.get(`/users/${id}`, { signal })
  return normalizeUser(data)
}

/** body: { user_nome, user_email, user_senha, roles?: string[], templates?: {template_code, resource_type?, resource_id?}[] } */
export async function createUser(body) {
  const payload = {
    user_nome: String(body.user_nome || ''),
    user_email: String(body.user_email || ''),
    user_senha: String(body.user_senha || ''),
    ...(Array.isArray(body.roles) ? { roles: body.roles } : {}),
    ...(Array.isArray(body.templates) ? { templates: body.templates.map(normalizeTemplate) } : {}),
  }
  const { data } = await api.post('/users', payload)
  return data // { message }
}

/** body: campos opcionais; se tiver manage_users, pode roles/templates/status/tipo */
export async function updateUser(id, body) {
  const payload = { ...body }
  if (payload.templates) payload.templates = payload.templates.map(normalizeTemplate)
  const { data } = await api.put(`/users/${id}`, payload)
  return data // { message }
}

export async function deleteUser(id) {
  const { data } = await api.delete(`/users/${id}`)
  return data // { message }
}

export async function updateProfile(body) {
  const payload = {}
  if (body.user_nome) payload.user_nome = body.user_nome
  if (body.user_email) payload.user_email = body.user_email
  if (body.user_senha) payload.user_senha = body.user_senha
  const { data } = await api.put('/profile', payload)
  return data // { message }
}

export async function listRecycleUsers(signal) {
  const { data } = await api.get('/users/recycle', { signal })
  return data
}
