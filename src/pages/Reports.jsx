
"use client"

import React, { useMemo, useState, useCallback } from "react"
import {
  FileDown, Filter, Search, Loader2, AlertCircle,
  Calendar, ChevronLeft, ChevronRight, Layers, Shapes, Package
} from "lucide-react"

// hooks do projeto
import { useMovements } from "../hooks/useMovements"
import { useMaterials } from "../hooks/useMaterials"
import { useTypes } from "../hooks/useTypes"
import { useCategories } from "../hooks/useCategories"

// xlsx ^0.20.0 (ESM)
import * as XLSX from "xlsx"

export default function Reports() {
  const { filteredMovements, loading, error } = useMovements() // lista base já normalizada no hook
  const { categories } = useCategories()
  const { types } = useTypes()
  const { materials } = useMaterials?.() || useMaterials?.call?.(null) || { materials: [] } // compat defensiva

  // ----------------------- filtros
  const [q, setQ] = useState("")
  const [movType, setMovType] = useState("") // "", "entrada", "saida"
  const [catId, setCatId] = useState("")     // category id
  const [typeId, setTypeId] = useState("")   // type id
  const [matId, setMatId] = useState("")     // material id
  const [dateFrom, setDateFrom] = useState("") // ISO yyyy-mm-dd
  const [dateTo, setDateTo] = useState("")

  // ----------------------- paginação
  const [page, setPage] = useState(1)
  const perPage = 12

  // ----------------------- helpers (memoizados e usados como deps)
  const typeById = useCallback(
    (id) => types.find(t => Number(t.tipo_id) === Number(id)) || null,
    [types]
  )
  const catById = useCallback(
    (id) => categories.find(c => Number(c.cat_id) === Number(id)) || null,
    [categories]
  )
  const materialById = useCallback(
    (id) => materials.find(m => Number(m.mat_id) === Number(id)) || null,
    [materials]
  )
  const matName = useCallback(
    (id) => materialById(id)?.mat_nome ?? `#${id}`,
    [materialById]
  )
  const typeNameFromMat = useCallback(
    (mat) => typeById(mat?.mat_fk_tipo)?.tipo_nome ?? "—",
    [typeById]
  )
  const catNameFromMat = useCallback(
    (mat) => {
      const t = typeById(mat?.mat_fk_tipo)
      return t ? (catById(t.tipo_fk_categoria)?.cat_nome ?? "—") : "—"
    },
    [typeById, catById]
  )

  // ----------------------- dados filtrados
  const data = useMemo(() => {
    const term = q.trim().toLowerCase()
    const fromTs = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : null
    const toTs   = dateTo   ? new Date(dateTo   + "T23:59:59").getTime() : null

    const rows = (filteredMovements || []).map((m) => {
      const mat = materialById(m.mov_fk_material)
      return {
        id: m.mov_id,
        tipo: m.mov_tipo, // entrada/saida
        quantidade: Number(m.mov_quantidade ?? 0),
        preco: Number(m.mov_preco ?? 0),
        data: m.mov_data ? new Date(m.mov_data) : null,
        material_id: m.mov_fk_material,
        material: mat?.mat_nome ?? m.mov_material_nome ?? `#${m.mov_fk_material}`,
        tipo_nome: typeNameFromMat(mat),
        categoria_nome: catNameFromMat(mat),
        requisicao: m.mov_fk_requisicao ?? null,
      }
    })

    let filtered = rows.filter(r => {
      if (movType && r.tipo !== movType) return false
      if (matId && Number(r.material_id) !== Number(matId)) return false

      if (typeId) {
        const m = materialById(r.material_id)
        if (!m || Number(m.mat_fk_tipo) !== Number(typeId)) return false
      }
      if (catId) {
        const m = materialById(r.material_id)
        const t = m ? typeById(m.mat_fk_tipo) : null
        if (!t || Number(t.tipo_fk_categoria) !== Number(catId)) return false
      }

      if (fromTs && (!r.data || r.data.getTime() < fromTs)) return false
      if (toTs   && (!r.data || r.data.getTime() > toTs))   return false

      if (term) {
        const hay =
          `${r.material} ${r.tipo} ${r.tipo_nome} ${r.categoria_nome} ${r.id} ${r.requisicao ?? ""}`
            .toLowerCase()
        if (!hay.includes(term)) return false
      }

      return true
    })

    // ordena por data desc depois id desc
    filtered.sort((a, b) => {
      const ad = a.data ? a.data.getTime() : 0
      const bd = b.data ? b.data.getTime() : 0
      if (bd !== ad) return bd - ad
      return (b.id ?? 0) - (a.id ?? 0)
    })

    return filtered
  }, [filteredMovements, q, movType, catId, typeId, matId, dateFrom, dateTo, materialById, typeById, typeNameFromMat, catNameFromMat])

  // paginação calculada a partir de `data`
  const totalPages = Math.max(1, Math.ceil(data.length / perPage))
  const current = useMemo(() => {
    const start = (page - 1) * perPage
    return data.slice(start, start + perPage)
  }, [data, page])

  // ----------------------- resumo
  const summary = useMemo(() => {
    let entradasQtd = 0, saidasQtd = 0, entradas = 0, saidas = 0
    const porCategoria = new Map() // cat -> { entradas, saidas }
    const porTipo = new Map()      // tipo -> { entradas, saidas }

    for (const r of data) {
      const total = r.preco * r.quantidade
      if (r.tipo === "entrada") { entradasQtd += r.quantidade; entradas += total }
      else                      { saidasQtd   += r.quantidade; saidas   += total }

      const catKey = r.categoria_nome || "—"
      const tKey   = r.tipo_nome || "—"
      const catAgg = porCategoria.get(catKey) || { entradas: 0, saidas: 0 }
      const tAgg   = porTipo.get(tKey) || { entradas: 0, saidas: 0 }
      if (r.tipo === "entrada") { catAgg.entradas += r.quantidade; tAgg.entradas += r.quantidade }
      else                      { catAgg.saidas   += r.quantidade; tAgg.saidas   += r.quantidade }
      porCategoria.set(catKey, catAgg)
      porTipo.set(tKey, tAgg)
    }

    return {
      entradasQtd, saidasQtd, entradas, saidas,
      porCategoria: Array.from(porCategoria, ([k, v]) => ({ categoria: k, ...v })),
      porTipo: Array.from(porTipo, ([k, v]) => ({ tipo: k, ...v })),
    }
  }, [data])

  // ----------------------- exportação
  const [exporting, setExporting] = useState(false)
  const handleExportExcel = async () => {
    try {
      setExporting(true)

      const rows = data.map(r => ({
        Código: r.id,
        Tipo: r.tipo === "entrada" ? "Entrada" : "Saída",
        Quantidade: r.quantidade,
        "Preço (€)": Number(r.preco).toFixed(2),
        "Total (€)": Number(r.preco * r.quantidade).toFixed(2),
        Data: r.data ? r.data.toLocaleString() : "—",
        Material: r.material,
        TipoNome: r.tipo_nome,
        Categoria: r.categoria_nome,
        Requisição: r.requisicao ?? "—",
      }))

      const resumo1 = [
        { Métrica: "Entradas (Qtd.)", Valor: summary.entradasQtd },
        { Métrica: "Saídas (Qtd.)",   Valor: summary.saidasQtd },
        { Métrica: "Entradas (€)",    Valor: summary.entradas.toFixed(2) },
        { Métrica: "Saídas (€)",      Valor: summary.saidas.toFixed(2) },
        { Métrica: "Balanço (€)",     Valor: (summary.entradas - summary.saidas).toFixed(2) },
      ]
      const resumoCat = summary.porCategoria.map(r => ({
        Categoria: r.categoria, "Entradas (Qtd.)": r.entradas, "Saídas (Qtd.)": r.saidas
      }))
      const resumoTipo = summary.porTipo.map(r => ({
        Tipo: r.tipo, "Entradas (Qtd.)": r.entradas, "Saídas (Qtd.)": r.saidas
      }))

      const wb = XLSX.utils.book_new()
      const wsData = XLSX.utils.json_to_sheet(rows)
      const wsResumo = XLSX.utils.json_to_sheet(resumo1)
      const wsCat = XLSX.utils.json_to_sheet(resumoCat)
      const wsTipo = XLSX.utils.json_to_sheet(resumoTipo)

      XLSX.utils.book_append_sheet(wb, wsData, "Movimentos")
      XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo")
      XLSX.utils.book_append_sheet(wb, wsCat, "Por Categoria")
      XLSX.utils.book_append_sheet(wb, wsTipo, "Por Tipo")

      XLSX.writeFile(wb, `relatorio_movimentos_${new Date().toISOString().slice(0,10)}.xlsx`, {
        compression: true
      })
    } catch (err) {
      console.error(err)
      alert("Falha ao exportar. Verifique o console para detalhes.")
    } finally {
      setExporting(false)
    }
  }

  // ----------------------- render
  return (
    <main className="min-h-screen dark:bg-gray-950 space-y-6" aria-labelledby="reports-title">
      <header className="rounded-xl bg-white backdrop-blur border border-gray-300 p-6 dark:border-white/10 flex items-center justify-between">
        <h1 id="reports-title" className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Relatórios de Movimentações
        </h1>
        <button
          onClick={handleExportExcel}
          disabled={exporting || loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
          aria-label="Exportar resultados filtrados para Excel"
        >
          {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />}
          Exportar Excel
        </button>
      </header>

      {/* filtros */}
      <section className="rounded-xl p-4 bg-white/80 dark:bg-gray-900/70 backdrop-blur border border-gray-100 dark:border-white/10" aria-labelledby="filters-title">
        <h2 id="filters-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {/* busca livre */}
          <div className="md:col-span-2">
            <label htmlFor="f-q" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Buscar (material, categoria, tipo, código…)
            </label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
              <input
                id="f-q"
                value={q}
                onChange={e => { setQ(e.target.value); setPage(1) }}
                placeholder="Ex.: cabo, entrada, #101"
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                aria-describedby="f-q-hint"
              />
            </div>
            <p id="f-q-hint" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Pesquisa em vários campos do movimento.
            </p>
          </div>

          {/* tipo de movimento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Tipo</label>
            <select
              value={movType}
              onChange={e => { setMovType(e.target.value); setPage(1) }}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
          </div>

          {/* categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200  items-center gap-1">
           Categoria
            </label>
            <select
              value={catId}
              onChange={e => { setCatId(e.target.value); setTypeId(""); setPage(1) }}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="">Todas</option>
              {categories.map(c => <option key={c.cat_id} value={c.cat_id}>{c.cat_nome}</option>)}
            </select>
          </div>

          {/* tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200  items-center gap-1">
              Tipo
            </label>
            <select
              value={typeId}
              onChange={e => { setTypeId(e.target.value); setPage(1) }}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="">Todos</option>
              {types
                .filter(t => !catId || Number(t.tipo_fk_categoria) === Number(catId))
                .map(t => <option key={t.tipo_id} value={t.tipo_id}>{t.tipo_nome}</option>)}
            </select>
          </div>

          {/* material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200  items-center gap-1">
               Material
            </label>
            <select
              value={matId}
              onChange={e => { setMatId(e.target.value); setPage(1) }}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="">Todos</option>
              {materials
                .filter(m => !typeId || Number(m.mat_fk_tipo) === Number(typeId))
                .map(m => <option key={m.mat_id} value={m.mat_id}>{m.mat_nome}</option>)}
            </select>
          </div>

          {/* data */}
          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200  items-center gap-1">
                De
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(1) }}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Até</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(1) }}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2" aria-live="polite">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {data.length} movimentaç{data.length === 1 ? "ão" : "ões"} encontradas
          </span>
          {(dateFrom || dateTo || movType || catId || typeId || matId || q) && (
            <button
              type="button"
              onClick={() => { setQ(""); setMovType(""); setCatId(""); setTypeId(""); setMatId(""); setDateFrom(""); setDateTo(""); setPage(1) }}
              className="text-sm underline text-indigo-700"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      {/* tabela */}
      <section className="rounded-xl bg-white/80 dark:bg-gray-900/70 border border-gray-100 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="p-6 text-center" role="alert" aria-live="assertive">
            <AlertCircle className="mx-auto mb-2 text-red-500" />
            <p className="text-red-600 dark:text-red-300">{String(error)}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-700 dark:text-gray-300">Nenhum resultado para os filtros atuais.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <caption className="sr-only">
                  Tabela de movimentos filtrados com paginação
                </caption>
                <thead className="bg-gray-50/70 dark:bg-gray-800/60">
                  <tr>
                    <Th> Código </Th>
                    <Th> Data </Th>
                    <Th> Tipo </Th>
                    <Th> Material </Th>
                    <Th> Tipo (Material) </Th>
                    <Th> Categoria </Th>
                    <Th className="text-right"> Qtd </Th>
                    <Th className="text-right"> Preço (€) </Th>
                    <Th className="text-right"> Total (€) </Th>
                    <Th> Requisição </Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {current.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                      <Td>{r.id}</Td>
                      <Td>{r.data ? r.data.toLocaleString() : "—"}</Td>
                      <Td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.tipo === "entrada" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                          {r.tipo === "entrada" ? "Entrada" : "Saída"}
                        </span>
                      </Td>
                      <Td title={matName(r.material_id)}>{r.material}</Td>
                      <Td>{r.tipo_nome}</Td>
                      <Td>{r.categoria_nome}</Td>
                      <Td className="text-right">{r.quantidade}</Td>
                      <Td className="text-right">{r.preco.toFixed(2)}</Td>
                      <Td className="text-right">{(r.preco * r.quantidade).toFixed(2)}</Td>
                      <Td>{r.requisicao ? `#${r.requisicao}` : "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* paginação */}
            {totalPages > 1 && (
              <nav className="bg-gray-50/70 dark:bg-gray-800/60 px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800" aria-label="Paginação de resultados">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-3 py-1 border rounded disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Página <b>{page}</b> de <b>{totalPages}</b>
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1 border rounded disabled:opacity-50"
                >
                  Próxima <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      {/* resumo rápido */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Resumo">
        <KPI label="Entradas (Qtd.)" value={summary.entradasQtd} />
        <KPI label="Saídas (Qtd.)" value={summary.saidasQtd} />
        <KPI label="Entradas (€)" value={summary.entradas.toFixed(2)} />
        <KPI label="Saídas (€)" value={summary.saidas.toFixed(2)} />
      </section>
    </main>
  )
}

/* ======= helpers de UI ======= */

function Th({ children, className = "" }) {
  return (
    <th scope="col" className={`px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase ${className}`}>
      {children}
    </th>
  )
}
function Td({ children, className = "" }) {
  return (
    <td className={`px-4 py-2 text-sm text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </td>
  )
}
function KPI({ label, value }) {
  return (
    <div className="rounded-xl p-4 bg-white/80 dark:bg-gray-900/70 border border-gray-100 dark:border-white/10">
      <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  )
}
