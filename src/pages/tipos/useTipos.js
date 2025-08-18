// src/hooks/useTipos.js
import { useCallback, useEffect, useMemo, useState } from "react"
import api from "../../services/api"
import { useCategorias } from "../categorias/useCategorias"

export function useTipos() {
  // Categorias (autoFetch por padrão no hook)
  const {
    items: categorias,
    loading: catLoading,
    fetchCategorias,
  } = useCategorias({ q: "", limit: 1000, offset: 0, sort: "cat_nome", order: "ASC" })

  // Tipos
  const [tipos, setTipos] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [filters, setFilters] = useState({
    q: "",
    categoriaId: "all",
  })

  // --- Normalização robusta de Tipos ---
  const normalizeTipo = useCallback((r) => ({
    tipo_id: Number(r?.tipo_id ?? r?.id),
    tipo_nome: String(r?.tipo_nome ?? r?.nome ?? ""),
    tipo_fk_categoria: Number(
      r?.tipo_fk_categoria ?? r?.cat_id ?? r?.categoria_id ?? r?.categoria ?? NaN
    ),
  }), [])

  // --- Mapa de categorias id->nome (com tolerância) ---
  const categoriaMap = useMemo(() => {
    const m = new Map()
    ;(categorias || []).forEach(c => {
      const id = Number(c?.cat_id ?? c?.categoria_id ?? c?.id)
      const nome = String(c?.cat_nome ?? c?.categoria_nome ?? c?.nome ?? `#${id}`)
      if (!Number.isNaN(id)) m.set(id, nome)
    })
    return m
  }, [categorias])

  // --- Carregar Tipos ---
  const fetchTipos = useCallback(async (params = undefined) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/tipos", { params })
      const data = res?.data
      const rows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
      setTipos(rows.map(normalizeTipo))
      return { ok: true }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Falha ao carregar tipos"
      setError(msg)
      return { ok: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [normalizeTipo])

  // Montagem: basta carregar tipos (categorias já auto-fetch)
  useEffect(() => {
    fetchTipos()
  }, [fetchTipos])

  // --- Filtro em memória ---
  const filtered = useMemo(() => {
    const q = (filters.q || "").trim().toLowerCase()
    const catId = filters.categoriaId
    return (tipos || []).filter(t => {
      const byQ = !q || t.tipo_nome.toLowerCase().includes(q)
      const byCat = catId === "all" || Number(t.tipo_fk_categoria) === Number(catId)
      return byQ && byCat
    })
  }, [tipos, filters])

  // (Opcional) já devolve com o nome de categoria resolvido
  const filteredWithCategoria = useMemo(() => {
    return filtered.map(t => ({
      ...t,
      categoria_nome: categoriaMap.get(Number(t.tipo_fk_categoria)) ?? "—"
    }))
  }, [filtered, categoriaMap])

  // --- CRUD ---
  const add = useCallback(async ({ tipo_nome, tipo_fk_categoria }) => {
    setSaving(true)
    setError(null)
    try {
      const res = await api.post("/tipos", {
        tipo_nome,
        tipo_fk_categoria: Number(tipo_fk_categoria),
      })
      const raw = res?.data?.data ?? res?.data
      const item = normalizeTipo(raw)
      setTipos(prev => [item, ...prev])
      return item
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Erro ao criar tipo"
      setError(msg)
      throw err
    } finally {
      setSaving(false)
    }
  }, [normalizeTipo])

  const update = useCallback(async (id, payload) => {
    setSaving(true)
    setError(null)
    try {
      const res = await api.put(`/tipos/${id}`, payload)
      const updated = normalizeTipo(res?.data?.data ?? res?.data)
      setTipos(prev => prev.map(t =>
        Number(t?.tipo_id) === Number(id) ? updated : t
      ))
      return updated
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Erro ao atualizar tipo"
      setError(msg)
      throw err
    } finally {
      setSaving(false)
    }
  }, [normalizeTipo])

  const remove = useCallback(async (id) => {
    setSaving(true)
    setError(null)
    try {
      await api.delete(`/tipos/${id}`)
      setTipos(prev => prev.filter(t => Number(t?.tipo_id) !== Number(id)))
      return { ok: true }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Erro ao eliminar tipo"
      setError(msg)
      return { ok: false, message: msg }
    } finally {
      setSaving(false)
    }
  }, [])

  // --- Setters de filtros ---
  const setSearch = (q) => setFilters(prev => ({ ...prev, q }))
  const setCategoriaFilter = (categoriaId) => setFilters(prev => ({ ...prev, categoriaId }))

  // --- Utilitários públicos ---
  const fetchAll = () => Promise.all([fetchCategorias?.(), fetchTipos()])

  return {
    // dados
    tipos,
    categorias,
    categoriaMap,
    filtered: filteredWithCategoria,

    // estados
    loading: loading || catLoading,
    saving,
    error,
    filters,

    // ações
    fetchAll,
    add,
    update,
    remove,
    setSearch,
    setCategoriaFilter,
    setFilters,
  }
}
