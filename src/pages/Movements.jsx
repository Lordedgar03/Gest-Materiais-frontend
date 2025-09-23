"use client"

import React from "react"
import {
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Box,
  Calendar,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Eye,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Download,
  Plus,
} from "lucide-react"
import { useMovements } from "../hooks/useMovements"

/* ---------- Modal Genérico Melhorado ---------- */
function Modal({ open, title, onClose, children, footer, maxWidth = "max-w-2xl" }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div
          className={`relative w-full ${maxWidth} transform rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button
              aria-label="Fechar"
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-4">{children}</div>
          {footer && <div className="border-t border-gray-100 px-6 py-4">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

/* ---------- Cabeçalho de coluna com ordenação melhorado ---------- */
function Th({ children, active, dir, onClick }) {
  return (
    <th
      scope="col"
      onClick={onClick}
      className="group cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
      title="Clique para ordenar"
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <div className="flex flex-col">
          {!active ? (
            <ArrowUpDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          ) : dir === "asc" ? (
            <ArrowUp className="h-4 w-4 text-blue-600" />
          ) : (
            <ArrowDown className="h-4 w-4 text-blue-600" />
          )}
        </div>
      </div>
    </th>
  )
}

/* ---------- Card estatístico melhorado ---------- */
function StatsCard({ title, value, icon: Icon, trend, trendValue, color = "blue" }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 ring-blue-500/20 bg-blue-50",
    green: "from-emerald-500 to-emerald-600 ring-emerald-500/20 bg-emerald-50",
    red: "from-red-500 to-red-600 ring-red-500/20 bg-red-50",
    amber: "from-amber-500 to-amber-600 ring-amber-500/20 bg-amber-50",
  }

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-emerald-600",
    red: "text-red-600",
    amber: "text-amber-600",
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${colorClasses[color]} p-6 ring-1 ${colorClasses[color].split(" ")[2]} shadow-lg transition-all hover:shadow-xl hover:scale-105`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={`rounded-full p-3 ${colorClasses[color]} ring-8 ring-white/50`}>
          <Icon className={`h-8 w-8 ${iconColorClasses[color]}`} />
        </div>
      </div>
      <div
        className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${colorClasses[color].split(" ")[0]} ${colorClasses[color].split(" ")[1]} opacity-20`}
      />
    </div>
  )
}

/* ---------- Badge de status melhorado ---------- */
function StatusBadge({ type, children }) {
  const classes = {
    entrada: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
    saida: "bg-red-100 text-red-800 ring-red-600/20",
    requisicao: "bg-blue-100 text-blue-800 ring-blue-600/20",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${classes[type]}`}
    >
      {children}
    </span>
  )
}

export default function Movements() {
  const {
    filteredMovements,
    loading,
    error,
    showFilters,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    sortField,
    sortDirection,
    totals,
    getMaterialName,
    handleSort,
    toggleFilters,
    clearFilters,
    retryFetchMovements,
  } = useMovements()

  // ---------- Estados locais ----------
  const [pageSize, setPageSize] = React.useState(10)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [detail, setDetail] = React.useState(null)

  // ---------- Filtros e paginação ----------
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

  const openDetail = (mov) => {
    setDetail(mov)
    setDetailOpen(true)
  }
  const closeDetail = () => {
    setDetailOpen(false)
    setDetail(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header melhorado */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                Movimentações
              </h1>
              <p className="mt-2 text-lg text-gray-600">Gerencie e monitore todas as movimentações de estoque</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" />
                Exportar
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" />
                Nova Movimentação
              </button>
            </div>
          </div>
        </div>

        {/* Cards de estatísticas melhorados */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total de Movimentações"
            value={dateFiltered.length.toLocaleString()}
            icon={BarChart3}
            color="blue"
          />
          <StatsCard
            title="Total de Entradas"
            value={totals.entradas.toLocaleString()}
            icon={TrendingUp}
            trend="up"
            trendValue="+12%"
            color="green"
          />
          <StatsCard
            title="Total de Saídas"
            value={totals.saidas.toLocaleString()}
            icon={TrendingDown}
            trend="down"
            trendValue="-8%"
            color="red"
          />
          <StatsCard title="Balanço" value={totals.balanco.toLocaleString()} icon={Activity} color="amber" />
        </div>

        {/* Seção de filtros melhorada */}
        <div className="mb-8 rounded-2xl bg-white shadow-lg ring-1 ring-gray-200">
          <div className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2">
                  <Box className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Histórico de Movimentações</h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar movimentações..."
                    className="w-full rounded-xl border-0 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600 sm:w-64"
                  />
                </div>

                <button
                  onClick={toggleFilters}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-100 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-6 rounded-xl bg-gray-50 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full rounded-lg border-0 bg-white py-2 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Todos os tipos</option>
                      <option value="entrada">Entradas</option>
                      <option value="saida">Saídas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data inicial</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-lg border-0 bg-white py-2 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data final</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full rounded-lg border-0 bg-white py-2 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Itens por página</label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="w-full rounded-lg border-0 bg-white py-2 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600"
                    >
                      {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setDateFrom("")
                        setDateTo("")
                        clearFilters()
                      }}
                      className="w-full rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
                    >
                      Limpar filtros
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabela melhorada */}
        <div className="rounded-2xl bg-white shadow-lg ring-1 ring-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-lg font-medium text-gray-900">Carregando movimentações...</p>
              <p className="text-sm text-gray-500">Por favor, aguarde</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-red-100 p-3 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</p>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <button
                onClick={retryFetchMovements}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
            </div>
          ) : dateFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-gray-100 p-3 mb-4">
                <Box className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">Nenhuma movimentação encontrada</p>
              <p className="text-sm text-gray-500">Tente ajustar os filtros ou adicionar novas movimentações</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <Th onClick={() => handleSort("mov_id")} active={sortField === "mov_id"} dir={sortDirection}>
                        Código
                      </Th>
                      <Th
                        onClick={() => handleSort("material_name")}
                        active={sortField === "material_name"}
                        dir={sortDirection}
                      >
                        Produto
                      </Th>
                      <Th onClick={() => handleSort("mov_tipo")} active={sortField === "mov_tipo"} dir={sortDirection}>
                        Tipo
                      </Th>
                      <Th
                        onClick={() => handleSort("mov_quantidade")}
                        active={sortField === "mov_quantidade"}
                        dir={sortDirection}
                      >
                        Quantidade
                      </Th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Descrição
                      </th>
                      <Th
                        onClick={() => handleSort("mov_preco")}
                        active={sortField === "mov_preco"}
                        dir={sortDirection}
                      >
                        Preço (€)
                      </Th>
                      <Th onClick={() => handleSort("mov_data")} active={sortField === "mov_data"} dir={sortDirection}>
                        Data
                      </Th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Requisição
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {pageSlice.map((mov, idx) => (
                      <tr key={mov.mov_id} className="hover:bg-blue-50 transition-colors">
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">#{mov.mov_id}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="font-medium">
                            {mov.mov_material_nome ?? getMaterialName(mov.mov_fk_material)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                          <StatusBadge type={mov.mov_tipo}>
                            {mov.mov_tipo === "entrada" ? (
                              <>
                                <TrendingUp className="mr-1 h-3 w-3" />
                                Entrada
                              </>
                            ) : (
                              <>
                                <TrendingDown className="mr-1 h-3 w-3" />
                                Saída
                              </>
                            )}
                          </StatusBadge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                          {mov.mov_quantidade.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          <div className="max-w-xs truncate">{mov.mov_descricao || "—"}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                          € {Number(mov.mov_preco).toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4" />
                              {new Date(mov.mov_data).toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-xs">
                              <Clock className="mr-1 h-3 w-3" />
                              {new Date(mov.mov_data).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                          {mov.mov_fk_requisicao ? (
                            <StatusBadge type="requisicao">#{mov.mov_fk_requisicao}</StatusBadge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm">
                          <button
                            onClick={() => openDetail(mov)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            Ver detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação melhorada */}
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{" "}
                      <span className="font-medium">
                        {dateFiltered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                      </span>{" "}
                      a <span className="font-medium">{Math.min(currentPage * pageSize, dateFiltered.length)}</span> de{" "}
                      <span className="font-medium">{dateFiltered.length}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-lg shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-lg px-3 py-2 text-sm font-medium text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 bg-white">
                        {currentPage} de {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-lg px-3 py-2 text-sm font-medium text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
                      >
                        Próxima
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal de detalhes melhorado */}
        <Modal
          open={detailOpen}
          onClose={closeDetail}
          title={detail ? `Detalhes da Movimentação #${detail.mov_id}` : "Detalhes da movimentação"}
          maxWidth="max-w-3xl"
        >
          {detail && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge type={detail.mov_tipo}>
                  {detail.mov_tipo === "entrada" ? (
                    <>
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Entrada
                    </>
                  ) : (
                    <>
                      <TrendingDown className="mr-1 h-3 w-3" />
                      Saída
                    </>
                  )}
                </StatusBadge>
                {detail.mov_fk_requisicao && (
                  <StatusBadge type="requisicao">Requisição #{detail.mov_fk_requisicao}</StatusBadge>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <InfoCard label="Produto" value={detail.mov_material_nome ?? getMaterialName(detail.mov_fk_material)} />
                <InfoCard label="Código da Movimentação" value={`#${detail.mov_id}`} />
                <InfoCard label="Quantidade" value={detail.mov_quantidade.toLocaleString()} />
                <InfoCard label="Preço Unitário" value={`€ ${Number(detail.mov_preco).toFixed(2)}`} />
                <InfoCard
                  label="Valor Total"
                  value={`€ ${(Number(detail.mov_preco) * Number(detail.mov_quantidade || 0)).toFixed(2)}`}
                />
                <InfoCard
                  label="Data e Hora"
                  value={`${new Date(detail.mov_data).toLocaleDateString()} às ${new Date(detail.mov_data).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                />
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Descrição</h4>
                <p className="text-sm text-gray-700">{detail.mov_descricao || "Nenhuma descrição fornecida"}</p>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-4 ring-1 ring-gray-200">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  )
}
