// src/pages/Vendas.jsx
"use client";

import { useEffect } from "react";
import { useVendas } from "../hooks/useVendas";

export default function VendasPage() {
  const {
    allowed,
    loading,
    filtered,
    current,
    showFilters,
    setShowFilters,
    q,
    setQ,
    status,
    setStatus,
    from,
    setFrom,
    to,
    setTo,
    page,
    setPage,
    perPage,
    setPerPage,
    pages,
    loadList,
    onApplyFilters,
    clearFilters,
    fmt,
    viewOpen,
    setViewOpen,
    viewSale,
    openView,
    reasonOpen,
    setReasonOpen,
    reason,
    setReason,
    actionType,
    openReason,
    applyAction,
    exportXlsx,
  } = useVendas();

  useEffect(() => {
    if (allowed) loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  if (!allowed) {
    return (
      <div className="p-6">
        <div className="max-w-xl mx-auto border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          Não tens permissão para visualizar as vendas.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-indigo-700">Vendas</h1>
          <p className="text-sm text-gray-700">
            Lista de vendas com filtros avançados, detalhe e exportação.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportXlsx}
            className="px-3 py-1.5 text-xs rounded-lg border border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition"
          >
            Exportar Excel
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            Limpar filtros
          </button>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            {showFilters ? "Esconder filtros" : "Mostrar filtros"}
          </button>
        </div>
      </header>

      {/* Filtros */}
      {showFilters && (
        <section className="border border-indigo-100 bg-indigo-50/60 rounded-xl px-4 py-3 space-y-3 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Pesquisa geral
              </label>
              <input
                type="text"
                className="w-full text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Código, cliente..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Status
              </label>
              <select
                className="w-full text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Todos</option>
                <option>Paga</option>
                <option>Pendente</option>
                <option>Cancelada</option>
                <option>Estornada</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                De (data)
              </label>
              <input
                type="date"
                className="w-full text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Até (data)
              </label>
              <input
                type="date"
                className="w-full text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <span className="text-gray-700">Por página:</span>
                <select
                  className="border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                >
                  <option value={8}>8</option>
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                </select>
              </label>

              <span className="text-gray-700">{filtered.length} registos</span>
            </div>

            <button
              type="button"
              onClick={onApplyFilters}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              Aplicar filtros
            </button>
          </div>
        </section>
      )}

      {/* Tabela */}
      <section className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Vendas ({filtered.length})
          </span>
          {loading && (
            <span className="text-xs text-gray-400">A carregar…</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-indigo-50 border-b border-indigo-100">
              <tr className="text-[13px] text-indigo-900">
                <th className="px-3 py-2 text-left font-semibold">Código</th>
                <th className="px-3 py-2 text-left font-semibold">Data</th>
                <th className="px-3 py-2 text-left font-semibold">Cliente</th>
                <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
                <th className="px-3 py-2 text-right font-semibold">Desconto</th>
                <th className="px-3 py-2 text-right font-semibold">Total</th>
                <th className="px-3 py-2 text-center font-semibold">Status</th>
                <th className="px-3 py-2 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!loading && current.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-gray-700 text-xs"
                  >
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              )}

              {current.map((s) => {
                const date = s.ven_data
                  ? new Date(s.ven_data).toLocaleString("pt-PT")
                  : "-";

                const statusColor =
                  s.ven_status === "Paga"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : s.ven_status === "Cancelada" ||
                      s.ven_status === "Estornada"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200";

                return (
                  <tr
                    key={s.ven_id}
                    className="border-b last:border-0 hover:bg-gray-50/70"
                  >
                    <td className="px-3 py-2 align-middle">{s.ven_codigo}</td>
                    <td className="px-3 py-2 align-middle text-gray-600">
                      {date}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {s.ven_cliente_nome || "Cliente"}
                    </td>
                    <td className="px-3 py-2 align-middle text-right">
                      {fmt(s.ven_subtotal)}
                    </td>
                    <td className="px-3 py-2 align-middle text-right text-amber-700">
                      {fmt(s.ven_desconto)}
                    </td>
                    <td className="px-3 py-2 align-middle text-right font-medium text-indigo-700">
                      {fmt(s.ven_total)}
                    </td>
                    <td className="px-3 py-2 align-middle text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-[12px] font-medium ${statusColor}`}
                      >
                        {s.ven_status}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openView(s)}
                          className="px-2 py-1 text-[13px] border rounded-lg text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                        >
                          Detalhes
                        </button>

                        {s.ven_status === "Paga" && (
                          <>
                            <button
                              type="button"
                              onClick={() => openReason(s, "estorno")}
                              className="px-2 py-1 text-[13px] border rounded-lg text-amber-700 border-amber-200 hover:bg-amber-50"
                            >
                              Estornar
                            </button>
                            <button
                              type="button"
                              onClick={() => openReason(s, "cancelar")}
                              className="px-2 py-1 text-[13px] border rounded-lg text-red-700 border-red-200 hover:bg-red-50"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 text-xs bg-gray-50 border-t">
            <span className="text-gray-700">
              Página {page} de {pages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-100"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page === pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-2 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-100"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Modal Detalhes */}
      {viewOpen && viewSale && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-3 p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-sm font-semibold text-indigo-700">
                Detalhes da venda {viewSale.ven_codigo}
              </h2>
              <button
                type="button"
                onClick={() => setViewOpen(false)}
                className="text-xs text-gray-700 hover:text-gray-700"
              >
                Fechar
              </button>
            </div>

            <div className="text-xs space-y-1">
              <p>
                <span className="font-medium text-gray-700">Cliente: </span>
                {viewSale.ven_cliente_nome || "Cliente"}
              </p>
              <p>
                <span className="font-medium text-gray-700">Data: </span>
                {viewSale.ven_data
                  ? new Date(viewSale.ven_data).toLocaleString("pt-PT")
                  : "-"}
              </p>
              <p>
                <span className="font-medium text-gray-700">Status: </span>
                {viewSale.ven_status}
              </p>
            </div>

            <div className="border-t pt-2 text-xs space-y-1">
              <p>
                <span className="font-medium text-gray-700">Subtotal: </span>
                {fmt(viewSale.ven_subtotal)}
              </p>
              <p>
                <span className="font-medium text-gray-700">Desconto: </span>
                {fmt(viewSale.ven_desconto)}
              </p>
              <p>
                <span className="font-medium text-gray-700">Total: </span>
                {fmt(viewSale.ven_total)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Motivo (estorno / cancelar) */}
      {reasonOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-3 p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-sm font-semibold text-red-700">
                {actionType === "estorno" ? "Estornar venda" : "Cancelar venda"}
              </h2>
              <button
                type="button"
                onClick={() => setReasonOpen(false)}
                className="text-xs text-gray-700 hover:text-gray-700"
              >
                Fechar
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Indica um motivo (opcional) para esta operação.
            </p>

            <textarea
              rows={3}
              className="w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: erro de lançamento, cliente desistiu..."
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setReasonOpen(false)}
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={applyAction}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
