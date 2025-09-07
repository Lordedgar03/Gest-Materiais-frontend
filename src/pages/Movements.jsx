/* eslint-disable no-unused-vars */
"use client"

import React from "react"
import {
  RefreshCw, Search, Filter, ChevronDown, ChevronUp, Box, Calendar,
  Clock, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, Eye
} from "lucide-react"
import { useMovements } from "../hooks/useMovements"

/* ---------- Modal Genérico ---------- */
function Modal({ open, title, onClose, children, footer, maxWidth = "max-w-xl" }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-xl border border-gray-200`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              aria-label="Fechar"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              ×
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t border-gray-200">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

/* ---------- Cabeçalho de coluna com ordenação ---------- */
function Th({ children, active, dir, onClick }) {
  return (
    <th
      scope="col"
      onClick={onClick}
      className="p-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase cursor-pointer select-none"
      title="Ordenar"
    >
      <span className="inline-flex items-center">
        {children}
        {!active ? (
          <ArrowUpDown className="ml-1 h-4 w-4 opacity-60" aria-hidden />
        ) : dir === "asc" ? (
          <ArrowUp className="ml-1 h-4 w-4" aria-hidden />
        ) : (
          <ArrowDown className="ml-1 h-4 w-4" aria-hidden />
        )}
      </span>
    </th>
  )
}

/* ---------- Card compacto ---------- */
function Card({ title, value, accent = "indigo" }) {
  const ring = {
    indigo: "ring-indigo-500 from-indigo-500 to-indigo-400/10",
    emerald: "ring-emerald-400 from-emerald-500 to-emerald-400/10",
    rose: "ring-rose-400 from-rose-500 to-rose-400/10",
    amber: "ring-amber-400 from-amber-500 to-amber-400/10",
  }[accent]
  return (
    <div className={`rounded-xl p-4 ring-1 ${ring?.split(" ")[0]} bg-gradient-to-br ${ring?.split(" ").slice(1).join(" ")} backdrop-blur border border-white/10`}>
      <h3 className="text-sm text-gray-700 dark:text-gray-300">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  )
}

export default function Movements() {
  const {
    // dados
    filteredMovements, loading, error,
    // filtros/orden.
    showFilters, searchTerm, setSearchTerm,
    filterType, setFilterType, sortField, sortDirection,
    // derivados + utils
    totals, getMaterialName,
    // ações
    handleSort, toggleFilters, clearFilters, retryFetchMovements,
  } = useMovements()

  // ---------- paginação + filtro de data (client-side) ----------
  const [pageSize, setPageSize] = React.useState(10)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")

  const dateFiltered = React.useMemo(() => {
    return filteredMovements.filter((m) => {
      const d = new Date(m.mov_data)
      if (dateFrom) {
        const from = new Date(dateFrom)
        if (d < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo + "T23:59:59")
        if (d > to) return false
      }
      return true
    })
  }, [filteredMovements, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(dateFiltered.length / pageSize))
  const pageSlice = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return dateFiltered.slice(start, start + pageSize)
  }, [dateFiltered, currentPage, pageSize])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, dateFrom, dateTo, pageSize])

  // ---------- modal de detalhes ----------
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [detail, setDetail] = React.useState(null)
  const openDetail = (mov) => { setDetail(mov); setDetailOpen(true) }
  const closeDetail = () => { setDetailOpen(false); setDetail(null) }

  const renderSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" aria-hidden />
    return sortDirection === "asc"
      ? <ArrowUp className="h-4 w-4 ml-1 text-indigo-600" aria-hidden />
      : <ArrowDown className="h-4 w-4 ml-1 text-indigo-600" aria-hidden />
  }

  return (
    <main className="min-h-screen  space-y-6">
      <header className="rounded-xl p-6 bg-white border border-slate-200">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <RefreshCw className="text-indigo-600" aria-hidden /> Movimentações
        </h1>
      </header>

      {/* Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total de Movimentações" value={dateFiltered.length} accent="indigo" />
        <Card title="Total de Entradas" value={totals.entradas} accent="emerald" />
        <Card title="Total de Saídas" value={totals.saidas} accent="rose" />
        <Card title="Balanço" value={totals.balanco} accent="amber" />
      </section>

      {/* Filtros/busca */}
      <section className="rounded-xl p-4 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <Box className="text-indigo-600" aria-hidden /> Histórico de movimentações
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleFilters}
              className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
              aria-expanded={showFilters}
              aria-controls="filtros-avancados"
            >
              <Filter size={16} aria-hidden />
              Filtros
              {showFilters ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
            </button>

            <div className="relative">
              <Search size={16} className="absolute top-2 left-2 text-gray-400" aria-hidden />
              <label htmlFor="mov-search" className="sr-only">Pesquisar</label>
              <input
                id="mov-search"
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Procurar…"
                className="pl-8 pr-3 py-1.5 border rounded-md focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {showFilters && (
          <div id="filtros-avancados" className="rounded-xl p-6 bg-white border border-slate-200  mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tipo</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              >
                <option value="">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="saida">Saídas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">De</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Até</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-200">Itens/página</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              >
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>

              <button
                onClick={() => { setDateFrom(""); setDateTo(""); clearFilters() }}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Tabela */}
      <section className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-10">
            <RefreshCw size={28} className="animate-spin text-indigo-600" aria-label="Carregando" />
          </div>
        ) : error ? (
          <div className="p-6 text-center" role="alert" aria-live="assertive">
            <AlertCircle size={32} className="mx-auto mb-2 text-red-500" aria-hidden />
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <button
              onClick={retryFetchMovements}
              className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
            >
              Tentar novamente
            </button>
          </div>
        ) : dateFiltered.length === 0 ? (
          <div className="p-8 text-center">
            <Box size={32} className="mx-auto mb-2 text-gray-400" aria-hidden />
            <p className="text-gray-600 dark:text-gray-300">Nenhuma movimentação encontrada.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-gray-50 dark:bg-gray-800/60 p-3 rounded-md mt-3">
              <table className="w-full text-sm">
                <caption className="sr-only">Tabela de movimentações com ordenação, filtros e paginação</caption>
                <thead className="bg-indigo-300/20 ">
                  <tr>
                    <Th onClick={() => handleSort("mov_id")} active={sortField === "mov_id"} dir={sortDirection}>Código</Th>
                    <Th onClick={() => handleSort("material_name")} active={sortField === "material_name"} dir={sortDirection}>Produto</Th>
                    <Th onClick={() => handleSort("mov_tipo")} active={sortField === "mov_tipo"} dir={sortDirection}>Tipo</Th>
                    <Th onClick={() => handleSort("mov_quantidade")} active={sortField === "mov_quantidade"} dir={sortDirection}>Qtd</Th>
                    <th scope="col" className="p-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Descrição</th>
                    <Th onClick={() => handleSort("mov_preco")} active={sortField === "mov_preco"} dir={sortDirection}>Preço (€)</Th>
                    <Th onClick={() => handleSort("mov_data")} active={sortField === "mov_data"} dir={sortDirection}>Data</Th>
                    <th scope="col" className="p-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Requisição</th>
                    <th scope="col" className="p-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {pageSlice.map((mov, idx) => (
                    <tr
                      key={mov.mov_id}
                      className={`${idx % 2 ? "bg-white/60 dark:bg-gray-900/40" : "bg-white/80 dark:bg-gray-900/50"} border-b dark:border-gray-800 hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20`}
                    >
                      <td className="p-2 font-medium">{mov.mov_id}</td>
                      <td className="p-2">{mov.mov_material_nome ?? getMaterialName(mov.mov_fk_material)}</td>
                      <td className="p-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            mov.mov_tipo === "entrada" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {mov.mov_tipo === "entrada" ? "↓ Entrada" : "↑ Saída"}
                        </span>
                      </td>
                      <td className="p-2 font-medium">{mov.mov_quantidade}</td>
                      <td className="p-2 max-w-xs truncate">{mov.mov_descricao || "—"}</td>
                      <td className="p-2">€ {Number(mov.mov_preco).toFixed(2)}</td>
                      <td className="p-2">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1 text-gray-500" aria-hidden />
                          {new Date(mov.mov_data).toLocaleDateString()}
                          <Clock size={14} className="ml-2 mr-1 text-gray-500" aria-hidden />
                          {new Date(mov.mov_data).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="p-2">
                        {mov.mov_fk_requisicao ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            #{mov.mov_fk_requisicao}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => openDetail(mov)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                          title="Ver detalhes"
                        >
                          <Eye size={14} /> Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="bg-gray-50/70 dark:bg-gray-800/60 px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando{" "}
                <span className="font-medium">
                  {dateFiltered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </span>{" "}
                a{" "}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, dateFiltered.length)}
                </span>{" "}
                de <span className="font-medium">{dateFiltered.length}</span> registos
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border rounded disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Modal de detalhes */}
      <Modal
        open={detailOpen}
        onClose={closeDetail}
        title={detail ? `Movimento #${detail.mov_id}` : "Detalhes do movimento"}
      >
        {!detail ? null : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  detail.mov_tipo === "entrada" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}
              >
                {detail.mov_tipo === "entrada" ? "Entrada" : "Saída"}
              </span>
              {detail.mov_fk_requisicao && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  Req #{detail.mov_fk_requisicao}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow label="Produto" value={detail.mov_material_nome ?? getMaterialName(detail.mov_fk_material)} />
              <InfoRow label="Código" value={`#${detail.mov_id}`} />
              <InfoRow label="Quantidade" value={String(detail.mov_quantidade)} />
              <InfoRow label="Preço unitário (€)" value={`€ ${Number(detail.mov_preco).toFixed(2)}`} />
              <InfoRow label="Total (€)" value={`€ ${(Number(detail.mov_preco) * Number(detail.mov_quantidade || 0)).toFixed(2)}`} />
              <InfoRow
                label="Data"
                value={`${new Date(detail.mov_data).toLocaleDateString()} ${new Date(detail.mov_data).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
              />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Descrição</p>
              <p className="text-sm text-gray-800">{detail.mov_descricao || "—"}</p>
            </div>
          </div>
        )}
      </Modal>
    </main>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="p-3 rounded-md bg-gray-50 border border-gray-200">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}
