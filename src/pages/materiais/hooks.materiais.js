// src/hooks/useMateriais.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '../../services/api' // ajuste se o teu caminho for diferente

/**
 * Normaliza um registro vindo do backend para chaves consistentes.
 */
const normalizeMaterial = (r = {}) => ({
  mat_id: Number(r?.mat_id ?? r?.id),
  mat_nome: String(r?.mat_nome ?? r?.nome ?? ''),
  mat_descricao: r?.mat_descricao ?? r?.descricao ?? '',
  mat_preco: Number(r?.mat_preco ?? 0),
  mat_quantidade_estoque: Number(r?.mat_quantidade_estoque ?? r?.quantidade ?? 0),
  mat_estoque_minimo: Number(r?.mat_estoque_minimo ?? r?.estoque_minimo ?? 0),
  mat_fk_tipo: Number(r?.mat_fk_tipo ?? r?.tipo_id ?? r?.fk_tipo ?? NaN),
  mat_localizacao: String(r?.mat_localizacao ?? r?.localizacao ?? ''),
  mat_vendavel: String(r?.mat_vendavel ?? r?.vendavel ?? 'SIM'), // "SIM" | "NAO"
  mat_status: String(r?.mat_status ?? r?.status ?? 'ativo'),     // "ativo" | "inativo"
})

/**
 * Hook para CRUD de Materiais com filtros em memória.
 *
 * @param {{ tipoMap?: Map<number,string> }} opts
 *        tipoMap opcional (id->nome) para resolver nome do tipo no cliente.
 */
export function useMateriais(opts = {}) {
  const { tipoMap } = opts

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [filters, setFilters] = useState({
    q: '',                // busca por nome
    tipoId: 'all',        // "all" | number
    vendavel: 'all',      // "all" | "SIM" | "NAO"
    status: 'all',        // "all" | "ativo" | "inativo" (list do backend já retorna "ativo")
    estoque: 'all',       // "all" | "baixo" (<= minimo) | "zerado"
  })

  const abortRef = useRef(null)

  // ---- READ (GET /materiais)
  const fetchMateriais = useCallback(async () => {
    abortRef.current?.abort?.()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true); setError(null)
    try {
      const res = await api.get('/materiais', { signal: controller.signal })
      // Pode vir como array ou { data: [...] }
      const raw = Array.isArray(res?.data?.data) ? res.data.data
                : (Array.isArray(res?.data) ? res.data : [])
      setItems(raw.map(normalizeMaterial))
      return { ok: true }
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') return { ok: false, canceled: true }
      const msg = err?.response?.data?.message || err?.message || 'Falha ao carregar materiais'
      setError(msg)
      return { ok: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMateriais() }, [fetchMateriais])

  // ---- CREATE (POST /materiais)
  const create = useCallback(async (payload) => {
    setSaving(true); setError(null)
    try {
      // backend espera campos: ver service (mat_nome, mat_preco, mat_fk_tipo, etc.)
      const res = await api.post('/materiais', payload)
      const raw = res?.data?.data ?? res?.data // service retorna o próprio registro
      const novo = normalizeMaterial(raw)
      setItems(prev => [novo, ...prev])
      return { ok: true, data: novo }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao criar material'
      setError(msg)
      return { ok: false, message: msg }
    } finally {
      setSaving(false)
    }
  }, [])

  // ---- UPDATE (PUT /materiais/:id)
  const update = useCallback(async (id, payload) => {
    setSaving(true); setError(null)
    try {
      const res = await api.put(`/materiais/${id}`, payload)
      const updated = normalizeMaterial(res?.data?.data ?? res?.data)
      setItems(prev => prev.map(m => Number(m.mat_id) === Number(id) ? updated : m))
      return { ok: true, data: updated }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao atualizar material'
      setError(msg)
      return { ok: false, message: msg }
    } finally {
      setSaving(false)
    }
  }, [])

  /**
   * DELETE (DELETE /materiais/:id) — o teu backend exige corpo { quantidade, descricao }.
   * Aqui expomos como removeUnits para evitar confusão com "apagar" absoluto.
   * - Se após a remoção o estoque zerar, o registro some (backend dá destroy).
   * - Caso contrário, só decrementa estoque na lista local.
   */
  const removeUnits = useCallback(async ({ id, quantidade, descricao }) => {
    setSaving(true); setError(null)
    try {
      await api.delete(`/materiais/${id}`, {
        data: { quantidade: Number(quantidade), descricao: String(descricao || '').trim() },
      })
      // Reflete no estado local sem refetch: atualiza ou remove
      setItems(prev => {
        const curr = prev.find(m => Number(m.mat_id) === Number(id))
        if (!curr) return prev
        const newQty = Math.max(0, Number(curr.mat_quantidade_estoque) - Number(quantidade))
        if (newQty === 0) {
          return prev.filter(m => Number(m.mat_id) !== Number(id))
        }
        return prev.map(m =>
          Number(m.mat_id) === Number(id)
            ? { ...m, mat_quantidade_estoque: newQty }
            : m
        )
      })
      return { ok: true }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao remover unidades'
      setError(msg)
      return { ok: false, message: msg }
    } finally {
      setSaving(false)
    }
  }, [])

  /**
   * Conveniência: ajusta o estoque via UPDATE (gera log no backend com dif).
   * delta pode ser positivo (entrada) ou negativo (saída).
   */
  const adjustStock = useCallback(async (id, delta) => {
    const curr = items.find(m => Number(m.mat_id) === Number(id))
    if (!curr) return { ok: false, message: 'Material não encontrado no estado' }
    const novo = Math.max(0, Number(curr.mat_quantidade_estoque) + Number(delta))
    return update(id, { mat_quantidade_estoque: novo })
  }, [items, update])

  // ---- Filtros em memória + enriquecimento com tipo_nome e flags
  const filtered = useMemo(() => {
    const q = (filters.q || '').trim().toLowerCase()
    const tipoId = filters.tipoId
    const vendavel = filters.vendavel
    const status = filters.status
    const estoque = filters.estoque

    return items
      .map(m => {
        const tipo_nome = tipoMap?.get(Number(m.mat_fk_tipo))
        const lowStock = Number(m.mat_quantidade_estoque) <= Number(m.mat_estoque_minimo)
        const isZero = Number(m.mat_quantidade_estoque) === 0
        return { ...m, tipo_nome, lowStock, isZero }
      })
      .filter(m => {
        const byQ = !q || m.mat_nome.toLowerCase().includes(q)
        const byTipo = tipoId === 'all' || Number(m.mat_fk_tipo) === Number(tipoId)
        const byVend = vendavel === 'all' || m.mat_vendavel === vendavel
        const byStatus = status === 'all' || m.mat_status === status
        const byStock =
          estoque === 'all' ||
          (estoque === 'baixo' && m.lowStock) ||
          (estoque === 'zerado' && m.isZero)
        return byQ && byTipo && byVend && byStatus && byStock
      })
  }, [items, filters, tipoMap])

  // ---- Setters de filtro
  const setSearch = (q) => setFilters(prev => ({ ...prev, q }))
  const setTipoFilter = (tipoId) => setFilters(prev => ({ ...prev, tipoId }))
  const setVendavel = (v) => setFilters(prev => ({ ...prev, vendavel: v }))
  const setStatus = (s) => setFilters(prev => ({ ...prev, status: s }))
  const setEstoque = (e) => setFilters(prev => ({ ...prev, estoque: e }))

  // ---- Helpers
  const refresh = () => fetchMateriais()

  return {
    // dados
    items,
    filtered,

    // estados
    loading,
    saving,
    error,
    filters,

    // ações
    fetchMateriais: refresh,
    create,
    update,
    removeUnits, // DELETE com { quantidade, descricao }
    adjustStock, // PUT com novo valor calculado
    setSearch,
    setTipoFilter,
    setVendavel,
    setStatus,
    setEstoque,
    setFilters,
  }
}
