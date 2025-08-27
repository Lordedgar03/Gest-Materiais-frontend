// src/hooks/useMovements.js
import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api' // ajuste o caminho se seu api.js estiver em outro lugar

export function useMovements() {
  // Data
  const [materials, setMaterials] = useState([])
  const [movements, setMovements] = useState([])
  const [approvedRequisitions, setApprovedRequisitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtros e ordenação
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [sortField, setSortField] = useState('mov_data')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)

  /** ========= MÉTODOS (rotas / URLs) ========= **/
  const fetchMaterials = useCallback(async () => {
    const res = await api.get('/materiais')
    return res.data?.data ?? res.data ?? []
  }, [])

  const fetchMovements = useCallback(async () => {
    const res = await api.get('/movimentacoes')
    return res.data?.data ?? res.data ?? []
  }, [])

  const fetchRequisitions = useCallback(async () => {
    const res = await api.get('/requisicoes')
    const all = res.data?.data ?? res.data ?? []
    return all.filter(r => r.req_status === 'Aprovada')
  }, [])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [mats, movs, reqs] = await Promise.all([
        fetchMaterials(),
        fetchMovements(),
        fetchRequisitions()
      ])
      setMaterials(mats)
      setMovements(movs)
      setApprovedRequisitions(reqs)
    } catch (e) {
      console.error(e)
      setError('Falha ao carregar dados. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [fetchMaterials, fetchMovements, fetchRequisitions])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  /** ========= LÓGICA (filtros/ordenação/derivados) ========= **/
  const getMaterialName = useCallback((id) => {
    const m = materials.find(x => x.mat_id === id)
    return m ? m.mat_nome : '—'
  }, [materials])

  const filteredMovements = useMemo(() => {
    let data = [...movements]

    // busca
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      data = data.filter(mov => {
        const matName = (mov.mov_material_nome ?? getMaterialName(mov.mov_fk_material)).toLowerCase()
        const desc = mov.mov_descricao?.toLowerCase() ?? ''
        return (
          matName.includes(s) ||
          desc.includes(s) ||
          String(mov.mov_id).includes(s)
        )
      })
    }

    // tipo
    if (filterType) {
      data = data.filter(mov => mov.mov_tipo === filterType)
    }

    // ordenação
    data.sort((a, b) => {
      if (sortField === 'material_name') {
        const aN = (a.mov_material_nome ?? getMaterialName(a.mov_fk_material)).toLowerCase()
        const bN = (b.mov_material_nome ?? getMaterialName(b.mov_fk_material)).toLowerCase()
        return sortDirection === 'asc' ? aN.localeCompare(bN) : bN.localeCompare(aN)
      }

      if (sortField === 'mov_data') {
        const aD = new Date(a[sortField])
        const bD = new Date(b[sortField])
        return sortDirection === 'asc' ? aD - bD : bD - aD
      }

      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return data
  }, [movements, searchTerm, filterType, sortField, sortDirection, getMaterialName])

  const totals = useMemo(() => {
    const entradas = filteredMovements
      .filter(m => m.mov_tipo === 'entrada')
      .reduce((acc, m) => acc + Number(m.mov_quantidade || 0), 0)

    const saidas = filteredMovements
      .filter(m => m.mov_tipo === 'saida')
      .reduce((acc, m) => acc + Number(m.mov_quantidade || 0), 0)

    return { entradas, saidas, balanco: entradas - saidas }
  }, [filteredMovements])

  // Actions expostas para a UI
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField])

  const toggleFilters = useCallback(() => setShowFilters(v => !v), [])
  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setFilterType('')
    setSortField('mov_data')
    setSortDirection('desc')
  }, [])

  const retryFetchMovements = useCallback(async () => {
    try {
      setLoading(true)
      const movs = await fetchMovements()
      setMovements(movs)
    } catch {
      setError('Falha ao carregar movimentações.')
    } finally {
      setLoading(false)
    }
  }, [fetchMovements])

  return {
    // dados
    materials,
    movements,
    approvedRequisitions,
    filteredMovements,
    loading,
    error,

    // exibição
    showFilters,
    searchTerm, setSearchTerm,
    filterType, setFilterType,
    sortField, sortDirection,
    getMaterialName,

    // derivados
    totals,

    // ações
    handleSort,
    toggleFilters,
    clearFilters,
    fetchAllData,
    retryFetchMovements,
  }
}
