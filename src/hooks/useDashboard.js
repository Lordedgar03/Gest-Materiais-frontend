import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import api from "../api"

export function useDashboard() {
  // -------------------- state --------------------
  const [users, setUsers] = useState([])
  const [materials, setMaterials] = useState([])
  const [types, setTypes] = useState([])
  const [categories, setCategories] = useState([])
  const [movements, setMovements] = useState([])
  const [sales, setSales] = useState([]) // <— NOVO
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // -------------------- fetch --------------------
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersRes, materialsRes, typesRes, categoriesRes, movementsRes, salesRes] = await Promise.all([
        api.get("/users"),
        api.get("/materiais"),
        api.get("/tipos"),
        api.get("/categorias"),
        api.get("/movimentacoes"),
        api.get("/vendas"), 
      ])

      const mats = Array.isArray(materialsRes?.data) ? materialsRes.data : (materialsRes?.data?.data || [])
      const movs = Array.isArray(movementsRes?.data) ? movementsRes.data : (movementsRes?.data?.data || [])
      const vnds = Array.isArray(salesRes?.data) ? salesRes.data : (salesRes?.data?.data || [])

      setUsers(Array.isArray(usersRes?.data) ? usersRes.data : (usersRes?.data?.data || []))
      setMaterials(mats)
      setTypes(Array.isArray(typesRes?.data) ? typesRes.data : (typesRes?.data?.data || []))
      setCategories(Array.isArray(categoriesRes?.data) ? categoriesRes.data : (categoriesRes?.data?.data || []))
      setMovements(movs)
      setSales(vnds) // <— NOVO
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Erro ao buscar dados do dashboard:", err)
      setError("Falha ao carregar dados. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }, [])

  // evitar duplo fetch no StrictMode (dev)
  const didFetchRef = useRef(false)
  useEffect(() => {
    if (import.meta.env.MODE !== "production") {
      if (didFetchRef.current) return
      didFetchRef.current = true
    }
    fetchAllData()
  }, [fetchAllData])

  const refresh = useCallback(() => {
    fetchAllData()
  }, [fetchAllData])

  // -------------------- métricas --------------------
  const metrics = useMemo(() => {
    if (loading) return {}
    const today = new Date()
    const last7 = new Date(today)
    last7.setDate(today.getDate() - 7)

    const recent = movements.filter((m) => {
      const d = new Date(m.mov_data)
      return !Number.isNaN(d.getTime()) && d >= last7
    })

    const totalEntradas = recent
      .filter((m) => m.mov_tipo === "entrada")
      .reduce((s, m) => s + Number(m.mov_quantidade || 0), 0)

    const totalSaidas = recent
      .filter((m) => m.mov_tipo === "saida")
      .reduce((s, m) => s + Number(m.mov_quantidade || 0), 0)

    const inventoryTrend = totalEntradas - totalSaidas

    const totalVendasMov = movements
      .filter((m) => m.mov_tipo === "saida" && (m.mov_motivo === "venda" || m.mov_motivo === "Venda"))
      .reduce((s, m) => s + Number(m.mov_valor || 0), 0)

    // Vendas (coleção /vendas)
    const sales7d = sales.filter((v) => {
      const dt = v.ven_data || v.ven_date || v.data || v.created_at || v.updated_at
      const d = new Date(dt)
      return !Number.isNaN(d.getTime()) && d >= last7
    })
    const receita7d = sales7d.reduce((s, v) => s + Number(v.ven_total ?? v.total ?? 0), 0)
    const numVendas7d = sales7d.length

    const receitaTotal = sales.reduce((s, v) => s + Number(v.ven_total ?? v.total ?? 0), 0)
    const numVendas = sales.length

    const lowStockMaterials = materials.filter(
      (m) => Number(m.mat_quantidade_estoque) < Number(m.mat_estoque_minimo)
    ).length

    return {
      totalEntradas,
      totalSaidas,
      inventoryTrend,
      totalVendasMov,
      lowStockMaterials,
      receita7d,
      numVendas7d,
      receitaTotal,
      numVendas,
    }
  }, [loading, movements, materials, sales])

  // -------------------- dados para gráficos --------------------
  const chartData = useMemo(() => {
    if (loading) return { movementData: [], categoryData: [], salesByDay: [] }

    // Movimentações por dia
    const byDate = new Map()
    movements.forEach((mov) => {
      const d = new Date(mov.mov_data)
      if (Number.isNaN(d.getTime())) return
      const key = d.toISOString().slice(0, 10) // yyyy-mm-dd
      const slot = byDate.get(key) || { date: key, entrada: 0, saida: 0 }
      if (mov.mov_tipo === "entrada") slot.entrada += Number(mov.mov_quantidade || 0)
      if (mov.mov_tipo === "saida") slot.saida += Number(mov.mov_quantidade || 0)
      byDate.set(key, slot)
    })
    const movementData = Array.from(byDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10)
      .map((x) => ({
        ...x,
        date: new Date(x.date + "T00:00:00").toLocaleDateString("pt-PT"),
        total: (x.entrada || 0) - (x.saida || 0),
      }))

    // Distribuição por categoria
    const categoryMap = new Map()
    categories.forEach((c) => {
      categoryMap.set(Number(c.cat_id), { name: c.cat_nome, value: 0 })
    })
    materials.forEach((m) => {
      const t = types.find((tt) => Number(tt.tipo_id) === Number(m.mat_fk_tipo))
      const catId = Number(t?.tipo_fk_categoria)
      if (categoryMap.has(catId)) {
        categoryMap.get(catId).value += 1
      }
    })
    const totalMats = materials.length || 1
    const categoryData = Array.from(categoryMap.values())
      .map((c) => ({ ...c, percentage: Math.round((c.value / totalMats) * 100) }))
      .sort((a, b) => b.value - a.value)

    // Vendas por dia (para gráfico futuro)
    const bySaleDate = new Map()
    sales.forEach((v) => {
      const dt = v.ven_data || v.ven_date || v.data || v.created_at || v.updated_at
      const d = new Date(dt)
      if (Number.isNaN(d.getTime())) return
      const key = d.toISOString().slice(0, 10)
      const slot = bySaleDate.get(key) || { date: key, vendas: 0, receita: 0 }
      slot.vendas += 1
      slot.receita += Number(v.ven_total ?? v.total ?? 0)
      bySaleDate.set(key, slot)
    })
    const salesByDay = Array.from(bySaleDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10)
      .map((x) => ({ ...x, date: new Date(x.date + "T00:00:00").toLocaleDateString("pt-PT") }))

    return { movementData, categoryData, salesByDay }
  }, [loading, movements, materials, types, categories, sales])

  // -------------------- cards --------------------
  const cards = useMemo(() => {
    if (loading) return []
    return [
      { label: "Utilizadores", value: users.length, tone: "blue", iconName: "Users" },
      {
        label: "Materiais",
        value: materials.length,
        secondaryValue: metrics.lowStockMaterials > 0 ? `${metrics.lowStockMaterials} em baixa` : null,
        tone: "emerald",
        iconName: "PackageCheck",
      },
      { label: "Tipos", value: types.length, tone: "amber", iconName: "Layers" },
      { label: "Categorias", value: categories.length, tone: "pink", iconName: "Shapes" },
      {
        label: "Movimentações",
        value: movements.length,
        trend: metrics.inventoryTrend,
        tone: "indigo",
        iconName: "RefreshCw",
      },
      {
        label: "Vendas (7d)",
        value: metrics.numVendas7d ?? 0,
        tone: "violet",
        iconName: "FileText",
      },
      {
        label: "Receita (7d)",
        value: `€ ${Number(metrics.receita7d || 0).toFixed(2)}`,
        tone: "purple",
        iconName: "FileText",
      },
      {
        label: "Receita Total",
        value: `€ ${Number(metrics.receitaTotal || 0).toFixed(2)}`,
        tone: "fuchsia",
        iconName: "FileText",
      },
    ]
  }, [loading, users.length, materials.length, types.length, categories.length, movements.length, metrics])

  // paleta para o gráfico de pizza
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00C49F", "#FFBB28", "#FF8042"]

  return {
    // estado base
    loading,
    error,
    lastUpdated,

    // dados
    users,
    materials,
    types,
    categories,
    movements,
    sales,

    // derivados
    metrics,
    chartData,
    cards,
    COLORS,

    // ações
    refresh,
  }
}
