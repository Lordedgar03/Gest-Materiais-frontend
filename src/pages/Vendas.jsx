"use client";

import React, { useEffect, useRef } from "react";
import { useVendas } from "../hooks/useVendas";
import {
  Receipt, Search, Filter, ChevronDown, ChevronUp, Eye,
  FileSpreadsheet, X, ShieldAlert, XCircle
} from "lucide-react";

/* ===== A11y helpers ===== */
function useFocusTrap(active) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const node = ref.current;
    const focusable = node.querySelectorAll(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const onKey = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    node.addEventListener("keydown", onKey);
    first?.focus();
    return () => node.removeEventListener("keydown", onKey);
  }, [active]);
  return ref;
}

/* ================= UI: Status badge ================= */
function StatusBadge({ value }) {
  const map = {
    Aberta: "bg-amber-100 text-amber-900 border-amber-300",
    Paga: "bg-emerald-100 text-emerald-900 border-emerald-300",
    Cancelada: "bg-gray-200 text-gray-900 border-gray-400",
    Estornada: "bg-rose-100 text-rose-900 border-rose-300",
  };
  const cls = map[value] || "bg-slate-100 text-slate-900 border-slate-300";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`} aria-label={`Status: ${value}`}>
      {value}
    </span>
  );
}

/* ================= UI: Modal ================= */
function Modal({ open, title, onClose, children, footer, initialFocusId }) {
  const trapRef = useFocusTrap(open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="modal-title" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div ref={trapRef} className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-300 dark:border-gray-600 focus:outline-none">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-600">
            <h3 id="modal-title" className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-2 ring-indigo-500" aria-label="Fechar modal" id={initialFocusId}>
              <X size={18} className="text-gray-600 dark:text-gray-300" aria-hidden />
            </button>
          </div>
          <div className="p-5">{children}</div>
          {footer && <div className="p-5 border-t border-gray-200 dark:border-gray-600">{footer}</div>}
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
    reasonOpen, setReasonOpen, reason, setReason,
    openCancel, applyCancel,
    // export
    exportXlsx,
  } = useVendas();

  if (!allowed) {
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900/20">
        <div className="max-w-md w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-6 text-center shadow-lg">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/40 grid place-items-center">
            <ShieldAlert className="text-rose-700 dark:text-rose-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Sem permissão</h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm">O seu utilizador não tem acesso ao módulo <b>Vendas</b>.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen space-y-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <header className="rounded-2xl p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md">
              <Receipt className="text-white" size={24} aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Histórico de Vendas</h1>
              <p className="text-gray-700 dark:text-gray-300">Filtros, exportação e acessibilidade aprimorada</p>
            </div>
          </div>

          {/* contador de vendas (lista filtrada) */}
          <div className="hidden sm:flex items-center gap-3 text-sm">
            <span className="px-3 py-1 rounded-full border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <b>{filtered.length}</b> vendas
            </span>
            <button
              onClick={exportXlsx}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold focus-visible:ring-2 ring-offset-2 ring-emerald-500"
              aria-label="Exportar vendas em Excel"
            >
              <FileSpreadsheet size={18} aria-hidden /> Exportar Excel
            </button>
          </div>
        </div>
      </header>

      {/* filtros */}
      <section className="rounded-2xl p-5 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 backdrop-blur-xl shadow">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <label htmlFor="busca-vendas" className="sr-only">Pesquisar vendas</label>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
            <input
              id="busca-vendas"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Código, cliente…"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-visible:ring-2 ring-indigo-500"
              aria-expanded={showFilters}
              aria-controls="filtros-vendas"
            >
              <Filter size={16} aria-hidden /> Filtros {showFilters ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
            </button>
            <button onClick={onApplyFilters} className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold focus-visible:ring-2 ring-indigo-500">
              Aplicar
            </button>
          </div>
        </div>

        {showFilters && (
          <div id="filtros-vendas" className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
                {["Todos", "Aberta", "Paga", "Cancelada", "Estornada"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">De</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Até</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Itens/página</label>
              <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
                {[8, 16, 32, 64].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={clearFilters} className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-visible:ring-2 ring-indigo-500">
                Limpar filtros
              </button>
            </div>
          </div>
        )}
      </section>

      {/* tabela */}
      <section className="rounded-2xl bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-xl shadow" role="region" aria-label="Tabela de vendas">
        {loading ? (
          <div className="p-8 text-center text-gray-800 dark:text-gray-200" aria-live="polite">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-800 dark:text-gray-200" aria-live="polite">Nenhuma venda encontrada.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-200 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left font-bold text-slate-900 dark:text-slate-100">Código</th>
                    <th scope="col" className="px-3 py-2 text-left font-bold text-slate-900 dark:text-slate-100">Data</th>
                    <th scope="col" className="px-3 py-2 text-left font-bold text-slate-900 dark:text-slate-100">Cliente</th>
                    <th scope="col" className="px-3 py-2 text-left font-bold text-slate-900 dark:text-slate-100">Itens</th>
                    <th scope="col" className="px-3 py-2 text-left font-bold text-slate-900 dark:text-slate-100">Subtotal</th>
                    <th scope="col" className="px-3 py-2 text-left font-bold text-slate-900 dark:text-slate-100">Desconto</th>
                    <th scope="col" className="px-3 py-2 text-left font-bold text-slate-900 dark:text-slate-100">Total</th>
                    <th scope="col" className="px-3 py-2 text-left font-bold text-slate-900 dark:text-slate-100">Status</th>
                    <th scope="col" className="px-3 py-2 text-right font-bold text-slate-900 dark:text-slate-100">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800">
                  {current.map((s) => (
                    <tr key={s.ven_id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{s.ven_codigo}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{new Date(s.ven_data).toLocaleString("pt-PT")}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{s.ven_cliente_nome}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{typeof s.itens_qtd === "number" ? s.itens_qtd : "—"}</td>
                      <td className="px-3 py-2">{fmt(s.ven_subtotal)}</td>
                      <td className="px-3 py-2 text-amber-800 dark:text-amber-300">- {fmt(s.ven_desconto)}</td>
                      <td className="px-3 py-2 font-semibold">{fmt(s.ven_total)}</td>
                      <td className="px-3 py-2"><StatusBadge value={s.ven_status} /></td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openView(s)}
                            className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white inline-flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600 focus-visible:ring-2 ring-indigo-500"
                            aria-label={`Ver venda ${s.ven_codigo}`}
                          >
                            <Eye size={16} aria-hidden /> Ver
                          </button>

                          {/* UM ÚNICO BOTÃO para cancelar/estornar (o backend decide pelo status) */}
                          {(s.ven_status === "Aberta" || s.ven_status === "Paga") && (
                            <button
                              onClick={() => openCancel(s)}
                              className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white inline-flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600 focus-visible:ring-2 ring-rose-500"
                              aria-label={`Cancelar/Estornar venda ${s.ven_codigo}`}
                            >
                              <XCircle size={16} aria-hidden /> Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* paginação */}
            <div className="bg-white/90 dark:bg-gray-800/90 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-800 dark:text-gray-200">
                Mostrando <b>{(page - 1) * perPage + 1}</b>–<b>{Math.min(page * perPage, filtered.length)}</b> de <b>{filtered.length}</b>
              </p>
              <div className="flex items-center gap-2">
                <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 disabled:opacity-50 focus-visible:ring-2 ring-indigo-500">
                  Anterior
                </button>
                <span className="text-sm text-gray-800 dark:text-gray-200" aria-live="polite">
                  {page} / {pages}
                </span>
                <button disabled={page === pages} onClick={() => setPage((p) => Math.min(pages, p + 1))} className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 disabled:opacity-50 focus-visible:ring-2 ring-indigo-500">
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Detalhes */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={`Venda ${viewSale?.ven_codigo || ""}`}
        initialFocusId="close-view"
        footer={
          <div className="flex justify-end">
            <button id="close-view" onClick={() => setViewOpen(false)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-visible:ring-2 ring-indigo-500">
              Fechar
            </button>
          </div>
        }
      >
        {viewSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-300">Cliente</div>
                <div className="font-semibold">{viewSale.ven_cliente_nome}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-300">Data</div>
                <div className="font-semibold">{new Date(viewSale.ven_data).toLocaleString("pt-PT")}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-300">Status</div>
                <div className="font-semibold"><StatusBadge value={viewSale.ven_status} /></div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left font-bold">Produto</th>
                    <th scope="col" className="px-3 py-2 text-left font-bold">Preço</th>
                    <th scope="col" className="px-3 py-2 text-left font-bold">Qtd</th>
                    <th scope="col" className="px-3 py-2 text-left font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewSale.itens || viewSale.vendaItens || []).map((it, i) => (
                    <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-3 py-2">
                        {/* agora garantimos nome vindo do backend como `vni_material_nome` */}
                        {it.vni_material_nome || it.material_nome || it.nome || `#${it.vni_fk_material}`}
                      </td>
                      <td className="px-3 py-2">{fmt(it.vni_preco_unit ?? it.preco_unit ?? it.preco)}</td>
                      <td className="px-3 py-2 font-semibold">{it.vni_qtd ?? it.qtd}</td>
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
                <div className="flex justify-between text-amber-800 dark:text-amber-300">
                  <span>Desconto</span>
                  <b>- {fmt(viewSale.ven_desconto)}</b>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 text-base">
                  <span>Total</span>
                  <b>{fmt(viewSale.ven_total)}</b>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Motivo (cancelar/estornar) */}
      <Modal
        open={reasonOpen}
        onClose={() => setReasonOpen(false)}
        title="Cancelar/Estornar venda"
        initialFocusId="close-reason"
        footer={
          <div className="flex justify-end gap-2">
            <button id="close-reason" onClick={() => setReasonOpen(false)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-visible:ring-2 ring-indigo-500">
              Fechar
            </button>
            <button onClick={applyCancel} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold focus-visible:ring-2 ring-rose-500">
              Confirmar
            </button>
          </div>
        }
      >
        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1" htmlFor="motivo-txt">Motivo</label>
        <textarea
          id="motivo-txt"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
          placeholder="Descreva o motivo…"
        />
      </Modal>
    </main>
  );
}
