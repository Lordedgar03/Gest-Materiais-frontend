"use client";

import React from "react";
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
} from "lucide-react";
import { useMovements } from "../hooks/useMovements";

/* ---------- Modal Genérico ---------- */
function Modal({ open, title, onClose, children, footer, maxWidth = "max-w-3xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full ${maxWidth} rounded-2xl bg-white shadow-2xl ring-1 ring-black/5`}>
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-4">{children}</div>
          {footer && <div className="border-t border-gray-100 px-6 py-4">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Cabeçalho Ordenável ---------- */
function Th({ children, active, dir, onClick }) {
  return (
    <th
      scope="col"
      onClick={onClick}
      title="Clique para ordenar"
      className="group cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hover:bg-gray-50 hover:text-gray-800"
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {!active ? (
          <ArrowUpDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
        ) : dir === "asc" ? (
          <ArrowUp className="h-4 w-4 text-blue-600" />
        ) : (
          <ArrowDown className="h-4 w-4 text-blue-600" />
        )}
      </span>
    </th>
  );
}

/* ---------- Cards de Estatísticas ---------- */
function Stat({ title, value, Icon, tone = "blue", trend, trendValue }) {
  const tones = {
    blue: { bg: "bg-blue-50", ring: "ring-blue-500/20", icon: "text-blue-600" },
    green: { bg: "bg-emerald-50", ring: "ring-emerald-500/20", icon: "text-emerald-600" },
    red: { bg: "bg-red-50", ring: "ring-red-500/20", icon: "text-red-600" },
    amber: { bg: "bg-amber-50", ring: "ring-amber-500/20", icon: "text-amber-600" },
  };
  const t = tones[tone] ?? tones.blue;

  return (
    <div className={`rounded-2xl ${t.bg} p-5 ring-1 ${t.ring} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm ${trend === "up" ? "text-emerald-700" : "text-red-700"}`}>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`rounded-xl bg-white p-3 shadow-inner ${t.ring}`}>
          <Icon className={`h-7 w-7 ${t.icon}`} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Badges ---------- */
function StatusBadge({ type, children }) {
  const map = {
    entrada: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
    saida: "bg-red-100 text-red-800 ring-red-600/20",
    requisicao: "bg-blue-100 text-blue-800 ring-blue-600/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${map[type]}`}>
      {children}
    </span>
  );
}

/* ---------- InfoCard ---------- */
function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-4 ring-1 ring-gray-200">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

/* ================================================================== */

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
  } = useMovements();

  // Estado local
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detail, setDetail] = React.useState(null);

  // Filtro de datas e paginação
  const dateFiltered = React.useMemo(() => {
    return filteredMovements.filter((m) => {
      const d = new Date(m.mov_data);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [filteredMovements, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(dateFiltered.length / pageSize));
  const pageSlice = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return dateFiltered.slice(start, start + pageSize);
  }, [dateFiltered, currentPage, pageSize]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, dateFrom, dateTo, pageSize]);

  const openDetail = (mov) => {
    setDetail(mov);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setDetail(null);
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 dark:text-white">
                <span className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
                  <Activity className="h-7 w-7 text-white" />
                </span>
                Movimentações
              </h1>
              <p className="mt-2 text-gray-600">Acompanhe entradas e saídas do stock em tempo real.</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Stat title="Movimentações" value={dateFiltered.length.toLocaleString()} Icon={BarChart3} tone="blue" />
          <Stat title="Entradas" value={totals.entradas.toLocaleString()} Icon={TrendingUp} tone="green" trend="up" trendValue="+12%" />
          <Stat title="Saídas" value={totals.saidas.toLocaleString()} Icon={TrendingDown} tone="red" trend="down" trendValue="-8%" />
          <Stat title="Balanço" value={totals.balanco.toLocaleString()} Icon={Activity} tone="amber" />
        </div>

        {/* Filtros */}
        <div className="mb-8 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2">
                  <Box className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Histórico de Movimentações</h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar por produto, descrição ou código…"
                    className="w-64 rounded-xl border-0 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <button
                  onClick={toggleFilters}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-100"
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
                    <label className="mb-2 block text-sm font-medium text-gray-700">Tipo</label>
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
                    <label className="mb-2 block text-sm font-medium text-gray-700">Data inicial</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-lg border-0 bg-white py-2 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Data final</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full rounded-lg border-0 bg-white py-2 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Itens por página</label>
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
                        setDateFrom("");
                        setDateTo("");
                        clearFilters();
                      }}
                      className="w-full rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                    >
                      Limpar filtros
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabela / Cards */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="h-10 w-10 animate-spin text-blue-600 mb-3" />
              <p className="text-gray-900 font-medium">Carregando movimentações…</p>
              <p className="text-sm text-gray-500">Por favor, aguarde</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-red-100 p-3 mb-3">
                <AlertCircle className="h-7 w-7 text-red-600" />
              </div>
              <p className="text-gray-900 font-medium mb-1">Erro ao carregar dados</p>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <button
                onClick={retryFetchMovements}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
            </div>
          ) : dateFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-gray-100 p-3 mb-3">
                <Box className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-gray-900 font-medium mb-1">Nenhuma movimentação</p>
              <p className="text-sm text-gray-500">Ajuste filtros ou adicione novos registos.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <Th onClick={() => handleSort("mov_id")} active={sortField === "mov_id"} dir={sortDirection}>
                        Código
                      </Th>
                      <Th onClick={() => handleSort("material_name")} active={sortField === "material_name"} dir={sortDirection}>
                        Produto
                      </Th>
                      <Th onClick={() => handleSort("mov_tipo")} active={sortField === "mov_tipo"} dir={sortDirection}>
                        Tipo
                      </Th>
                      <Th onClick={() => handleSort("mov_quantidade")} active={sortField === "mov_quantidade"} dir={sortDirection}>
                        Quantidade
                      </Th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Descrição</th>
                      <Th onClick={() => handleSort("mov_preco")} active={sortField === "mov_preco"} dir={sortDirection}>
                        Preço (STN)
                      </Th>
                      <Th onClick={() => handleSort("mov_data")} active={sortField === "mov_data"} dir={sortDirection}>
                        Data
                      </Th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Requisição</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {pageSlice.map((mov) => {
                      const matName = mov.mov_material_nome ?? mov.mat_nome ?? getMaterialName(mov.mov_fk_material);
                      return (
                        <tr key={mov.mov_id} className="hover:bg-blue-50/40">
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">#{mov.mov_id}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{matName}</td>
                          <td className="px-4 py-4 text-sm">
                            <StatusBadge type={mov.mov_tipo}>
                              {mov.mov_tipo === "entrada" ? (
                                <>
                                  <TrendingUp className="mr-1 h-3 w-3" /> Entrada
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="mr-1 h-3 w-3" /> Saída
                                </>
                              )}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {Number(mov.mov_quantidade || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            <div className="max-w-xs truncate">{mov.mov_descricao || "—"}</div>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            STN {Number(mov.mov_preco || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            <div className="flex items-center gap-5">
                              <span className="inline-flex items-center">
                                <Calendar className="mr-1 h-4 w-4" />
                                {new Date(mov.mov_data).toLocaleDateString()}
                              </span>
                              <span className="inline-flex items-center text-xs">
                                <Clock className="mr-1 h-3 w-3" />
                                {new Date(mov.mov_data).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {mov.mov_fk_requisicao ? (
                              <StatusBadge type="requisicao">#{mov.mov_fk_requisicao}</StatusBadge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => openDetail(mov)}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                            >
                              <Eye className="h-3 w-3" />
                              Ver detalhes
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {pageSlice.map((mov) => {
                  const matName = mov.mov_material_nome ?? mov.mat_nome ?? getMaterialName(mov.mov_fk_material);
                  return (
                    <div key={mov.mov_id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{matName}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <StatusBadge type={mov.mov_tipo}>
                              {mov.mov_tipo === "entrada" ? (
                                <>
                                  <TrendingUp className="mr-1 h-3 w-3" /> Entrada
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="mr-1 h-3 w-3" /> Saída
                                </>
                              )}
                            </StatusBadge>
                            {mov.mov_fk_requisicao && (
                              <StatusBadge type="requisicao">Req. #{mov.mov_fk_requisicao}</StatusBadge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">#{mov.mov_id}</div>
                          <div className="mt-1 text-sm font-medium text-gray-900">
                            {Number(mov.mov_quantidade || 0).toLocaleString()} un
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div className="text-gray-500">Preço</div>
                        <div className="text-gray-900">STN {Number(mov.mov_preco || 0).toFixed(2)}</div>
                        <div className="text-gray-500">Data</div>
                        <div className="text-gray-900">
                          {new Date(mov.mov_data).toLocaleDateString()}{" "}
                          <span className="text-xs text-gray-500">
                            {new Date(mov.mov_data).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      {mov.mov_descricao && (
                        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{mov.mov_descricao}</div>
                      )}
                      <div className="mt-3 text-right">
                        <button
                          onClick={() => openDetail(mov)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <Eye className="h-3 w-3" />
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="hidden sm:block text-sm text-gray-700">
                  Mostrando{" "}
                  <span className="font-medium">
                    {dateFiltered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  a{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, dateFiltered.length)}
                  </span>{" "}
                  de <span className="font-medium">{dateFiltered.length}</span> resultados
                </div>
                <div className="flex flex-1 justify-between sm:justify-end gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="hidden sm:inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Detalhes */}
        <Modal
          open={detailOpen}
          onClose={closeDetail}
          title={detail ? `Detalhes da Movimentação #${detail.mov_id}` : "Detalhes"}
        >
          {detail && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge type={detail.mov_tipo}>
                  {detail.mov_tipo === "entrada" ? (
                    <>
                      <TrendingUp className="mr-1 h-3 w-3" /> Entrada
                    </>
                  ) : (
                    <>
                      <TrendingDown className="mr-1 h-3 w-3" /> Saída
                    </>
                  )}
                </StatusBadge>
                {detail.mov_fk_requisicao && (
                  <StatusBadge type="requisicao">Requisição #{detail.mov_fk_requisicao}</StatusBadge>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoCard
                  label="Produto"
                  value={detail.mov_material_nome ?? detail.mat_nome ?? getMaterialName(detail.mov_fk_material)}
                />
                <InfoCard label="Código" value={`#${detail.mov_id}`} />
                <InfoCard label="Quantidade" value={Number(detail.mov_quantidade || 0).toLocaleString()} />
                <InfoCard label="Preço Unitário" value={`STN ${Number(detail.mov_preco || 0).toFixed(2)}`} />
                <InfoCard
                  label="Valor Total"
                  value={`STN ${(Number(detail.mov_preco || 0) * Number(detail.mov_quantidade || 0)).toFixed(2)}`}
                />
                <InfoCard
                  label="Data e Hora"
                  value={`${new Date(detail.mov_data).toLocaleDateString()} • ${new Date(detail.mov_data).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                />
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Descrição</h4>
                <p className="text-sm text-gray-700">{detail.mov_descricao || "—"}</p>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
