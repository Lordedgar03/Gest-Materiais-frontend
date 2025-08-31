"use client";

import React from "react";
import { useVendas } from "../hooks/useVendas";
import {
  Receipt, Search, Filter, ChevronDown, ChevronUp, Eye, RotateCcw, XCircle,
  FileSpreadsheet, X, ShieldAlert
} from "lucide-react";

/* ================= UI: Modal ================= */
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/* ================= Página ================= */
export default function Vendas() {
  const {
    allowed, loading, filtered, current,
    // filtros
    showFilters, setShowFilters, q, setQ, status, setStatus, from, setFrom, to, setTo,
    // paginação
    page, setPage, perPage, setPerPage, pages,
    // ações
    onApplyFilters, clearFilters, fmt,
    // detalhes / ações
    viewOpen, setViewOpen, viewSale, openView,
    reasonOpen, setReasonOpen, reason, setReason, actionType, openReason, applyAction,
    // export
    exportXlsx,
  } = useVendas();

  /* --------- Gate visual --------- */
  if (!allowed) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-rose-100 grid place-items-center">
            <ShieldAlert className="text-rose-600" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Sem permissão</h2>
          <p className="text-gray-600 text-sm">
            O seu utilizador não tem acesso ao módulo <b>Vendas</b>.
          </p>
        </div>
      </main>
    );
  }

  /* --------- Página normal --------- */
  return (
    <main className="min-h-screen space-y-6">
      <header className="rounded-xl p-6 bg-white border border-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="text-indigo-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historico de Vendas</h1>
            <p className="text-gray-600">Histórico de vendas com filtros e exportação</p>
          </div>
        </div>
        <button
          onClick={exportXlsx}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <FileSpreadsheet size={18} /> Exportar Excel
        </button>
      </header>

      <section className="rounded-xl p-4 bg-white border border-gray-300">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar por código ou cliente…"
              className="w-full pl-8 pr-3 py-2 border rounded-lg"
              aria-label="Pesquisar vendas"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border"
              aria-expanded={showFilters}
            >
              <Filter size={16} /> Filtros {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button onClick={onApplyFilters} className="px-3 py-2 rounded-lg bg-indigo-600 text-white">
              Aplicar
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                {["Todos", "Paga", "Cancelada", "Estornada"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">De</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Até</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Itens/página</label>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
              >
                {[8, 16, 32, 64].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button onClick={clearFilters} className="w-full px-3 py-2 rounded-lg border">
                Limpar filtros
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white border border-gray-300 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-600">Nenhuma venda encontrada.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-indigo-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Código</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Data</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Cliente</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Subtotal</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Desconto</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Total</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {current.map((s) => (
                    <tr key={s.ven_id} className="border-b">
                      <td className="px-3 py-2">{s.ven_codigo}</td>
                      <td className="px-3 py-2">{new Date(s.ven_data).toLocaleString("pt-PT")}</td>
                      <td className="px-3 py-2">{s.ven_cliente_nome}</td>
                      <td className="px-3 py-2">{fmt(s.ven_subtotal)}</td>
                      <td className="px-3 py-2 text-amber-700">- {fmt(s.ven_desconto)}</td>
                      <td className="px-3 py-2 font-medium">{fmt(s.ven_total)}</td>
                      <td className="px-3 py-2">{s.ven_status}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openView(s)} className="px-3 py-1.5 rounded-lg border inline-flex items-center gap-2">
                            <Eye size={16} /> Ver
                          </button>
                          {s.ven_status === "Paga" && (
                            <>
                              <button
                                onClick={() => openReason(s, "estorno")}
                                className="px-3 py-1.5 rounded-lg border inline-flex items-center gap-2"
                              >
                                <RotateCcw size={16} /> Estornar
                              </button>
                              <button
                                onClick={() => openReason(s, "cancelar")}
                                className="px-3 py-1.5 rounded-lg border inline-flex items-center gap-2"
                              >
                                <XCircle size={16} /> Cancelar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* paginação simples */}
            <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Mostrando <b>{(page - 1) * perPage + 1}</b>–<b>{Math.min(page * perPage, filtered.length)}</b> de{" "}
                <b>{filtered.length}</b>
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded border disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm">
                  {page} / {pages}
                </span>
                <button
                  disabled={page === pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="px-3 py-1.5 rounded border disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Detalhes */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={`Venda ${viewSale?.ven_codigo || ""}`}>
        {viewSale && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Cliente</span>
                <div className="font-medium">{viewSale.ven_cliente_nome}</div>
              </div>
              <div>
                <span className="text-gray-600">Data</span>
                <div className="font-medium">{new Date(viewSale.ven_data).toLocaleString("pt-PT")}</div>
              </div>
              <div>
                <span className="text-gray-600">Status</span>
                <div className="font-medium">{viewSale.ven_status}</div>
              </div>
            </div>

            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Produto</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Preço</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Qtd</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewSale.itens || viewSale.vendaItens || []).map((it, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{it.nome || it.vni_material_nome || it.material_nome}</td>
                      <td className="px-3 py-2">{fmt(it.vni_preco_unit ?? it.preco_unit ?? it.preco)}</td>
                      <td className="px-3 py-2">{it.vni_qtd ?? it.qtd}</td>
                      <td className="px-3 py-2">
                        {fmt((it.vni_preco_unit ?? it.preco_unit ?? it.preco) * (it.vni_qtd ?? it.qtd))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end text-sm">
              <div className="w-full sm:w-80">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <b>{fmt(viewSale.ven_subtotal)}</b>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Desconto</span>
                  <b>- {fmt(viewSale.ven_desconto)}</b>
                </div>
                <div className="flex justify-between border-t pt-2 text-base">
                  <span>Total</span>
                  <b>{fmt(viewSale.ven_total)}</b>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Motivo (estorno/cancelar) */}
      <Modal
        open={reasonOpen}
        onClose={() => setReasonOpen(false)}
        title={actionType === "estorno" ? "Estornar venda" : "Cancelar venda"}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setReasonOpen(false)} className="px-4 py-2 rounded border">
              Fechar
            </button>
            <button onClick={applyAction} className="px-4 py-2 rounded bg-rose-600 text-white">
              Confirmar
            </button>
          </div>
        }
      >
        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Descreva o motivo…"
        />
      </Modal>
    </main>
  );
}
