import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../services/api' // ajuste o caminho se o seu api estiver noutro lugar

export function useMovimentacoes(initialPageSize = 10) {
  const [raw, setRaw] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // filtros
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState('') // '' | 'entrada' | 'saida'
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [qtyMin, setQtyMin] = useState('')
  const [qtyMax, setQtyMax] = useState('')

  const [sortKey, setSortKey] = useState('date') // 'date' | 'mov_id' | 'mov_quantidade' | 'mov_preco' | 'mov_tipo_nome' | 'mat_nome'
  const [order, setOrder] = useState('DESC')     // 'ASC' | 'DESC'

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/movimentacoes')
      setRaw(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao carregar movimentações')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const itemsNormalized = useMemo(() => {
    return (raw || []).map((r) => {
      const dateStr = r.mov_data || r.createdAt || r.criado_em || r.data || null
      const date = dateStr ? new Date(dateStr) : null
      const qty = Number(r.mov_quantidade ?? 0)
      const price = Number(r.mov_preco ?? 0)
      const total = qty * price
      return {
        ...r,
        mov_tipo: String(r.mov_tipo || '').toLowerCase(),
        _dateObj: date,
        _dateISO: date ? date.toISOString() : '',
        _dateKey: date ? date.getTime() : 0,
        _qty: qty,
        _price: price,
        _total: total,
      }
    })
  }, [raw])

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase()
    let data = itemsNormalized.slice()

    if (text) {
      data = data.filter((r) =>
        String(r.mov_material_nome ?? '').toLowerCase().includes(text) ||
        String(r.mov_tipo_nome ?? '').toLowerCase().includes(text) ||
        String(r.mov_descricao ?? '').toLowerCase().includes(text) ||
        String(r.mov_fk_requisicao ?? '').toLowerCase().includes(text)
      )
    }

    if (tipo) data = data.filter((r) => String(r.mov_tipo) === tipo)

    if (dateFrom) {
      const from = new Date(dateFrom + 'T00:00:00')
      data = data.filter((r) => !r._dateObj || r._dateObj >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59.999')
      data = data.filter((r) => !r._dateObj || r._dateObj <= to)
    }

    const pMin = priceMin === '' ? -Infinity : Number(priceMin)
    const pMax = priceMax === '' ? +Infinity : Number(priceMax)
    const qMin = qtyMin === '' ? -Infinity : Number(qtyMin)
    const qMax = qtyMax === '' ? +Infinity : Number(qtyMax)
    data = data.filter((r) => r._price >= pMin && r._price <= pMax)
    data = data.filter((r) => r._qty >= qMin && r._qty <= qMax)

    // ordenação
    data.sort((a, b) => {
      const d = order === 'ASC' ? 1 : -1
      switch (sortKey) {
        case 'date': return (a._dateKey - b._dateKey) * d
        case 'mov_quantidade': return (a._qty - b._qty) * d
        case 'mov_preco': return (a._price - b._price) * d
        case 'mov_tipo_nome':
          return String(a.mov_tipo_nome ?? '').localeCompare(String(b.mov_tipo_nome ?? ''), undefined, { numeric: true }) * d
        case 'mat_nome':
          return String(a.mov_material_nome ?? '').localeCompare(String(b.mov_material_nome ?? ''), undefined, { numeric: true }) * d
        case 'mov_id':
        default:
          return (Number(a.mov_id ?? 0) - Number(b.mov_id ?? 0)) * d
      }
    })

    return data
  }, [itemsNormalized, q, tipo, dateFrom, dateTo, priceMin, priceMax, qtyMin, qtyMax, sortKey, order])

  const total = filtered.length
  const paged = useMemo(() => {
    const start = page * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const summary = useMemo(() => {
    let entradas = 0, saidas = 0
    for (const r of filtered) {
      if (r.mov_tipo === 'entrada') entradas += r._total
      else if (r.mov_tipo === 'saida') saidas += r._total
    }
    return { entradas, saidas, saldo: entradas - saidas }
  }, [filtered])

  // helpers
  const setQuery = (v) => { setQ(v); setPage(0) }
  const setTipoFilter = (v) => { setTipo(v); setPage(0) }
  const setDateRange = (from, to) => { setDateFrom(from); setDateTo(to); setPage(0) }
  const setPrices = (min, max) => { setPriceMin(min); setPriceMax(max); setPage(0) }
  const setQtyRange = (min, max) => { setQtyMin(min); setQtyMax(max); setPage(0) }
  const setSort = (key) => {
    setSortKey((prev) => {
      if (prev === key) { setOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC')); return prev }
      setOrder('ASC'); return key
    })
  }
  const nextPage = () => setPage((p) => ((p + 1) * pageSize < total ? p + 1 : p))
  const prevPage = () => setPage((p) => (p > 0 ? p - 1 : 0))
  const setLimit = (n) => { setPageSize(Number(n) || 10); setPage(0) }

  return {
    items: paged,
    filteredItems: filtered,
    total,
    summary,
    loading,
    error,

    filters: { q, tipo, dateFrom, dateTo, priceMin, priceMax, qtyMin, qtyMax, sortKey, order, page, pageSize },

    setQuery,
    setTipo: setTipoFilter,
    setDateRange,
    setPrices,
    setQtyRange,
    setSort,
    setLimit,
    nextPage,
    prevPage,

    refresh: fetchAll,
  }
}
