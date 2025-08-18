import { useCallback, useEffect, useRef, useState } from 'react'
import { getUser, updateUser as apiUpdateUser, deleteUser as apiDeleteUser } from '../../services/usersApi'

export function useUser(userId) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const refresh = useCallback(async () => {
    if (!userId) return { ok: false, message: 'userId inválido' }
    abortRef.current?.abort?.()
    const ctrl = new AbortController(); abortRef.current = ctrl
    setLoading(true); setError(null)
    try {
      const u = await getUser(userId, ctrl.signal)
      setUser(u)
      return { ok: true }
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') return { ok: false, canceled: true }
      const msg = err?.response?.data?.message || err?.message || 'Falha ao carregar utilizador'
      setError(msg); return { ok: false, message: msg }
    } finally { setLoading(false) }
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  const update = useCallback(async (payload) => {
    if (!userId) return { ok: false }
    setSaving(true); setError(null)
    try {
      const res = await apiUpdateUser(userId, payload)
      await refresh(); return { ok: true, data: res }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao atualizar utilizador'
      setError(msg); return { ok: false, message: msg }
    } finally { setSaving(false) }
  }, [userId, refresh])

  const remove = useCallback(async () => {
    if (!userId) return { ok: false }
    setSaving(true); setError(null)
    try {
      const res = await apiDeleteUser(userId)
      setUser(null); return { ok: true, data: res }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao eliminar utilizador'
      setError(msg); return { ok: false, message: msg }
    } finally { setSaving(false) }
  }, [userId])

  return { user, loading, saving, error, refresh, update, remove }
}
