"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Receipt, Search, Filter, ChevronDown, ChevronUp, Eye, RotateCcw, XCircle, FileSpreadsheet, X } from "lucide-react"

const LS_SALES = "demo_sales"
const fmt = (n) => (Number(n || 0)).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })
const load = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? fb } catch { return fb } }
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Fechar"><X size={18} /></button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

export default function Vendas() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("Todos")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)
  const perPage = 8

  // modais
  const [viewOpen, setViewOpen] = useState(false)
  const [viewSale, setViewSale] = useState(null)
  const [reasonOpen, setReasonOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [actionType, setActionType] = useState(null) // "estorno" | "cancelar"

  useEffect(() => {
    setLoading(true)
    const l = load(LS_SALES, [])
    setList(l)
    setLoading(false)
  }, [])

  const filtered = useMemo(() => {
    return list.filter((v) => {
      if (status !== "Todos" && v.status !== status) return false
      if (q && !`${v.code} ${v.customer}`.toLowerCase().includes(q.toLowerCase())) return false
      if (from && new Date(v.date) < new Date(from)) return false
      if (to && new Date(v.date) > new Date(to + "T23:59:59")) return false
      return true
    })
  }, [list, status, q, from, to])

  const pages = Math.max(1, Math.ceil(filtered.length / perPage))
  const current = filtered.slice((page - 1) * perPage, page * perPage)
  useEffect(() => { setPage(1) }, [q, status, from, to])

  const openView = (sale) => { setViewSale(sale); setViewOpen(true) }
  const openReason = (sale, type) => { setViewSale(sale); setActionType(type); setReason(""); setReasonOpen(true) }

  const applyAction = () => {
    // demo: só muda o status
    const next = list.map((s) => s.id === viewSale.id ? { ...s, status: actionType === "estorno" ? "Estornada" : "Cancelada", reason } : s)
    save(LS_SALES, next)
    setList(next)
    setReasonOpen(false)
    setViewSale(null)
    setActionType(null)
  }

  const exportXlsx = async () => {
    const rows = filtered.map((s) => ({
      Código: s.code,
      Data: new Date(s.date).toLocaleString("pt-PT"),
      Cliente: s.customer,
      Subtotal: s.subtotal,
      Desconto: s.desconto,
      Total: s.total,
      Status: s.status,
      "Pagamento": s.payMethod,
    }))
    try {
      const XLSX = await import("xlsx") // requer xlsx@^0.20.0
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, "Vendas")
      XLSX.writeFile(wb, `vendas_${Date.now()}.xlsx`)
    } catch (err) {
      console.error(err)
      alert("Falha ao exportar. Verifique se xlsx está instalado (xlsx@^0.20.0).")
    }
  }

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
        <button onClick={exportXlsx} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
          <FileSpreadsheet size={18} /> Exportar Excel
        </button>
      </header>

      <section className="rounded-xl p-4 bg-white border border-gray-300">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar por código ou cliente…"
              className="w-full pl-8 pr-3 py-2 border rounded-lg"
              aria-label="Pesquisar vendas"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border"
            aria-expanded={showFilters}
          >
            <Filter size={16} /> Filtros {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                {["Todos", "Paga", "Cancelada", "Estornada"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">De</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Até</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="flex items-end">
              <button onClick={() => { setStatus("Todos"); setFrom(""); setTo(""); setQ("") }} className="w-full px-3 py-2 rounded-lg border">
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
                    <tr key={s.id} className="border-b">
                      <td className="px-3 py-2">{s.code}</td>
                      <td className="px-3 py-2">{new Date(s.date).toLocaleString("pt-PT")}</td>
                      <td className="px-3 py-2">{s.customer}</td>
                      <td className="px-3 py-2">{fmt(s.subtotal)}</td>
                      <td className="px-3 py-2 text-amber-700">- {fmt(s.desconto)}</td>
                      <td className="px-3 py-2 font-medium">{fmt(s.total)}</td>
                      <td className="px-3 py-2">{s.status}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openView(s)} className="px-3 py-1.5 rounded-lg border inline-flex items-center gap-2">
                            <Eye size={16} /> Ver
                          </button>
                          {s.status === "Paga" && (
                            <>
                              <button onClick={() => openReason(s, "estorno")} className="px-3 py-1.5 rounded-lg border inline-flex items-center gap-2">
                                <RotateCcw size={16} /> Estornar
                              </button>
                              <button onClick={() => openReason(s, "cancelar")} className="px-3 py-1.5 rounded-lg border inline-flex items-center gap-2">
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
                Mostrando <b>{(page - 1) * perPage + 1}</b>–<b>{Math.min(page * perPage, filtered.length)}</b> de <b>{filtered.length}</b>
              </p>
              <div className="flex items-center gap-2">
                <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 rounded border disabled:opacity-50">Anterior</button>
                <span className="text-sm">{page} / {pages}</span>
                <button disabled={page === pages} onClick={() => setPage((p) => Math.min(pages, p + 1))} className="px-3 py-1.5 rounded border disabled:opacity-50">Próxima</button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Detalhes */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={`Venda ${viewSale?.code || ""}`}>
        {viewSale && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-600">Cliente</span><div className="font-medium">{viewSale.customer}</div></div>
              <div><span className="text-gray-600">Data</span><div className="font-medium">{new Date(viewSale.date).toLocaleString("pt-PT")}</div></div>
              <div><span className="text-gray-600">Pagamento</span><div className="font-medium">{viewSale.payMethod}</div></div>
              <div><span className="text-gray-600">Status</span><div className="font-medium">{viewSale.status}</div></div>
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
                  {viewSale.items.map((it, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{it.nome}</td>
                      <td className="px-3 py-2">{fmt(it.preco)}</td>
                      <td className="px-3 py-2">{it.qtd}</td>
                      <td className="px-3 py-2">{fmt(it.preco * it.qtd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end text-sm">
              <div className="w-full sm:w-80">
                <div className="flex justify-between"><span>Subtotal</span><b>{fmt(viewSale.subtotal)}</b></div>
                <div className="flex justify-between text-amber-700"><span>Desconto</span><b>- {fmt(viewSale.desconto)}</b></div>
                <div className="flex justify-between border-t pt-2 text-base"><span>Total</span><b>{fmt(viewSale.total)}</b></div>
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
            <button onClick={() => setReasonOpen(false)} className="px-4 py-2 rounded border">Fechar</button>
            <button onClick={applyAction} className="px-4 py-2 rounded bg-rose-600 text-white">
              Confirmar
            </button>
          </div>
        }
      >
        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2" placeholder="Descreva o motivo…" />
      </Modal>
    </main>
  )
}
