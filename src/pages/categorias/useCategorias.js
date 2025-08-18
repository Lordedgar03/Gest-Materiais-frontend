// src/hooks/categorias/useCategorias.js
import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../services/api'

export function useCategorias(
  initialFilters = { q: '', limit: 10, offset: 0, sort: 'cat_nome', order: 'ASC' },
  opts = { autoFetch: true } // ← novo opcional
) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(initialFilters)
  const [total, setTotal] = useState(0)
  const abortRef = useRef(null)

  const normalize = (rows) =>
    (Array.isArray(rows) ? rows : []).map(r => ({
      cat_id: r?.cat_id ?? r?.categoria_id ?? r?.id,
      cat_nome: r?.cat_nome ?? r?.categoria_nome ?? r?.nome ?? '',
    }))

  const safeRows = (data, headers) => {
    const rows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
    const t = Number(data?.total ?? headers?.['x-total-count'] ?? rows.length) || rows.length
    return { rows, total: t }
  }

  const fetchCategorias = useCallback(async (override = {}) => {
    abortRef.current?.abort?.()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true); setError(null)
    try {
      const params = { ...filters, ...override }
      const res = await api.get('/categorias', { params, signal: controller.signal })
      const { rows, total: t } = safeRows(res.data, res.headers)
      setItems(normalize(rows))
      setTotal(t)

      if (Object.keys(override).length) {
        setFilters(prev => ({ ...prev, ...override }))
      }
      return { ok: true }
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') return { ok: false, canceled: true }
      const msg = err?.response?.data?.message || err.message || 'Erro ao carregar categorias'
      setError(msg)
      return { ok: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (!opts?.autoFetch) return
    fetchCategorias()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.limit, filters.offset, filters.sort, filters.order, opts?.autoFetch])

  const withSaving = async (fn) => {
    setSaving(true); setError(null)
    try { return await fn() }
    catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Erro'
      setError(msg)
      return { ok: false, message: msg }
    } finally { setSaving(false) }
  }

  const createCategoria = (cat_nome) =>
    withSaving(async () => {
      const res = await api.post('/categorias', { cat_nome })
      await fetchCategorias({ offset: 0 })
      return { ok: true, data: res?.data }
    })

  const updateCategoria = (id, cat_nome) =>
    withSaving(async () => {
      const res = await api.put(`/categorias/${id}`, { cat_nome })
      await fetchCategorias()
      return { ok: true, data: res?.data }
    })

  const removeCategoria = (id) =>
    withSaving(async () => {
      await api.delete(`/categorias/${id}`)
      if (items.length === 1 && filters.offset > 0) {
        await fetchCategorias({ offset: Math.max(0, filters.offset - filters.limit) })
      } else {
        await fetchCategorias()
      }
      return { ok: true }
    })

  const setQuery = (q) => setFilters(prev => ({ ...prev, q, offset: 0 }))
  const setLimit = (limit) => setFilters(prev => ({ ...prev, limit: Number(limit) || 10, offset: 0 }))
  const nextPage = () => setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))
  const prevPage = () => setFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))
  const setSort = (sortKey) => setFilters(prev => ({ ...prev, sort: sortKey, order: prev.order === 'ASC' ? 'DESC' : 'ASC' }))

  return {
    items, loading, saving, error, total, filters,
    setFilters, setQuery, setLimit, nextPage, prevPage, setSort,
    fetchCategorias, createCategoria, updateCategoria, removeCategoria,
  }
}
