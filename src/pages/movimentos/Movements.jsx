import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useMovimentacoes } from './hooks.movements.js'
import { ArrowLeft, ArrowRight, ClipboardList, Download, Loader2, Search, X } from 'lucide-react'

function classNames(...xs) { return xs.filter(Boolean).join(' ') }
const fmtCurrency = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })
const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-PT') : '—'

export default function Movimentos() {
  const {
    items,
    filteredItems,
    total,
    summary,
    loading,
    error,
    filters,
    setQuery,
    setTipo,
    setDateRange,
    setPrices,
    setQtyRange,
    setSort,
    setLimit,
    nextPage,
    prevPage,
  } = useMovimentacoes(10)

  // debounce da busca
  const [qLocal, setQLocal] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setQuery(qLocal), 350)
    return () => clearTimeout(t)
  }, [qLocal, setQuery])

  // Modal de detalhes
  const [openDetails, setOpenDetails] = useState(false)
  const [current, setCurrent] = useState(null)

  const canGoNext = useMemo(
    () => (filters.page + 1) * filters.pageSize < total,
    [filters.page, filters.pageSize, total]
  )

  function openRow(r) { setCurrent(r); setOpenDetails(true) }

  function exportCSV() {
    const header = 'mov_id,data,material,tipo,tipo_material,quantidade,preco,total,descricao,requisicao\n'
    const body = (filteredItems || []).map((r) => [
      r.mov_id,
      '"' + (r._dateISO || '') + '"',
      '"' + String(r.mov_material_nome ?? '').replaceAll('"', '""') + '"',
      r.mov_tipo,
      '"' + String(r.mov_tipo_nome ?? '').replaceAll('"', '""') + '"',
      r._qty,
      r._price,
      r._total,
      '"' + String(r.mov_descricao ?? '').replaceAll('"', '""') + '"',
      r.mov_fk_requisicao ?? '',
    ].join(',')).join('\n')
    const csv = header + body
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'movimentacoes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative space-y-6">
      {/* BG */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-400/20 to-violet-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-violet-400/20 to-indigo-400/20 blur-3xl" />

      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white/60 shadow backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_120%_-10%,#a78bfa22,transparent_60%),radial-gradient(80%_60%_at_-10%_120%,#6366f122,transparent_60%)]" />
        <div className="relative p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Movimentações</h1>
                <p className="text-sm text-gray-600">Registo de entradas e saídas, com filtros e exportação.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white/70 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <Download className="h-4 w-4" /> Exportar CSV
              </button>
            </div>
          </div>

          {/* Cards resumo */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard title="Entradas" value={fmtCurrency.format(summary.entradas)} hint="Somatório de valores de entrada" />
            <SummaryCard title="Saídas" value={fmtCurrency.format(summary.saidas)} hint="Somatório de valores de saída" />
            <SummaryCard title="Saldo" value={fmtCurrency.format(summary.saldo)} hint="Entradas - Saídas" />
          </div>

          {/* Filtros */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
              <input value={qLocal} onChange={(e) => setQLocal(e.target.value)} placeholder="Procurar..." className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-9 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60" />
            </div>

            <select className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/60" value={filters.tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Tipo (todos)</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>

            <div className="flex items-center gap-2">
              <input type="date" className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm" value={filters.dateFrom} onChange={(e) => setDateRange(e.target.value, filters.dateTo)} />
              <span className="text-gray-400">–</span>
              <input type="date" className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm" value={filters.dateTo} onChange={(e) => setDateRange(filters.dateFrom, e.target.value)} />
            </div><br></br>

            <div className="flex items-center gap-2">
              <input type="number" inputMode="decimal" step="0.01" placeholder="Preço min" className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm" value={filters.priceMin} onChange={(e) => setPrices(e.target.value, filters.priceMax)} />
              <span className="text-gray-400">–</span>
              <input type="number" inputMode="decimal" step="0.01" placeholder="Preço máx" className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm" value={filters.priceMax} onChange={(e) => setPrices(filters.priceMin, e.target.value)} />
            </div>

            <div className="flex items-center gap-2">
              <input type="number" inputMode="numeric" placeholder="Qtd min" className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm" value={filters.qtyMin} onChange={(e) => setQtyRange(e.target.value, filters.qtyMax)} />
              <span className="text-gray-400">–</span>
              <input type="number" inputMode="numeric" placeholder="Qtd máx" className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm" value={filters.qtyMax} onChange={(e) => setQtyRange(filters.qtyMin, e.target.value)} />
            </div>

            
          </div>
        </div>
      </section>

      {/* Tabela */}
      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white/70 shadow backdrop-blur-xl">
        <div className="max-h-[60vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700">
              <tr>
                <Th label="Data" sortKey="date" currentKey={filters.sortKey} order={filters.order} onSort={setSort} />
                <Th label="Material" sortKey="mat_nome" currentKey={filters.sortKey} order={filters.order} onSort={setSort} />
                <Th label="Tipo" />
                <Th label="Qtd" sortKey="mov_quantidade" currentKey={filters.sortKey} order={filters.order} onSort={setSort} />
                <Th label="Preço" sortKey="mov_preco" currentKey={filters.sortKey} order={filters.order} onSort={setSort} />
                <Th label="Total" />
                <Th label="Tipo do material" sortKey="mov_tipo_nome" currentKey={filters.sortKey} order={filters.order} onSort={setSort} />
                <Th label="Descrição" />
                <Th label="Req." />
                <Th label="" right />
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {loading && (
                Array.from({ length: Math.max(3, Number(filters.pageSize) || 10) }).map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse">
                    <td className="px-5 py-3"><div className="h-3 w-24 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-3 w-40 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-6 w-16 rounded-xl bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-3 w-10 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-3 w-16 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-3 w-20 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-3 w-28 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-3 w-48 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-3 w-10 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="ml-auto h-8 w-24 rounded-2xl bg-indigo-100" /></td>
                  </tr>
                ))
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center">
                    <div className="inline-flex flex-col items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                      </div>
                      <p className="text-sm text-gray-600">Sem resultados para os filtros aplicados.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && items.map((r) => (
                <tr key={r.mov_id} className="transition hover:bg-indigo-50/50">
                  <td className="px-5 py-3 text-gray-700">{fmtDate(r._dateISO)}</td>
                  <td className="px-5 py-3 text-gray-900">{r.mov_material_nome || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={classNames(
                      'rounded-full px-3 py-1 text-xs font-medium border',
                      r.mov_tipo === 'entrada' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                    )}>
                      {r.mov_tipo}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{r._qty}</td>
                  <td className="px-5 py-3 text-gray-700">{fmtCurrency.format(r._price)}</td>
                  <td className="px-5 py-3 text-gray-700">{fmtCurrency.format(r._total)}</td>
                  <td className="px-5 py-3 text-gray-700">{r.mov_tipo_nome || '—'}</td>
                  <td className="px-5 py-3 text-gray-700 truncate max-w-[24ch]" title={r.mov_descricao || ''}>{r.mov_descricao || '—'}</td>
                  <td className="px-5 py-3 text-gray-700">{r.mov_fk_requisicao ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openRow(r)} className="rounded-2xl border border-indigo-200 px-3 py-2 text-xs text-gray-700 transition hover:bg-indigo-50">Detalhes</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between border-t border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-3">
          <div className="flex items-center justify-end gap-2 sm:col-span-2 lg:col-span-1">
              <select className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm" value={filters.pageSize} onChange={(e) => setLimit(e.target.value)}>
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}/página</option>
                ))}
              </select>
            </div>
          <div className="text-xs text-indigo-700/80">Total filtrado: {total} · Página: {filters.page + 1}</div>
          <div className="flex items-center gap-2">
            <button onClick={prevPage} disabled={filters.page === 0} className={classNames('inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition', 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50', filters.page === 0 && 'opacity-50 cursor-not-allowed')}>
              <ArrowLeft className="h-3.5 w-3.5" /> Anterior
            </button>
            <button onClick={nextPage} disabled={!canGoNext} className={classNames('inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition', 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50', !canGoNext && 'opacity-50 cursor-not-allowed')}>
              Próximo <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 shadow">{error}</div>}

      {/* Modal Detalhes */}
      <Transition appear show={openDetails} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOpenDetails(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-3xl border border-indigo-100 bg-white/80 p-0 shadow-xl backdrop-blur-xl">
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white">
                    <Dialog.Title className="text-base font-semibold">Detalhes da movimentação</Dialog.Title>
                    <Dialog.Description className="text-xs text-white/80">Visualização completa do registo.</Dialog.Description>
                  </div>

                  <div className="grid gap-3 p-6 sm:grid-cols-2 text-sm">
                    <Field label="ID" value={current?.mov_id} />
                    <Field label="Data" value={fmtDate(current?._dateISO)} />
                    <Field label="Material" value={current?.mov_material_nome} />
                    <Field label="Tipo" value={current?.mov_tipo} />
                    <Field label="Tipo do material" value={current?.mov_tipo_nome} />
                    <Field label="Quantidade" value={current?._qty} />
                    <Field label="Preço" value={fmtCurrency.format(Number(current?._price || 0))} />
                    <Field label="Total" value={fmtCurrency.format(Number(current?._total || 0))} />
                    <Field label="Requisição" value={current?.mov_fk_requisicao ?? '—'} />
                    <div className="sm:col-span-2">
                      <div className="text-[11px] font-medium text-indigo-700">Descrição</div>
                      <div className="rounded-2xl border border-indigo-200 bg-white/80 p-3 text-gray-700">{current?.mov_descricao || '—'}</div>
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                      <button onClick={() => setOpenDetails(false)} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 px-4 py-2 text-sm hover:bg-indigo-50"><X className="h-4 w-4" /> Fechar</button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}

function Th({ label, sortKey, currentKey, order, onSort, right }) {
  const sortable = !!sortKey
  return (
    <th className={classNames('border-b border-indigo-100 px-5 py-3 text-[11px] uppercase tracking-wider', right ? 'text-right' : 'text-left')}>
      {sortable ? (
        <button type="button" onClick={() => onSort && onSort(sortKey)} className="inline-flex items-center gap-1 text-indigo-700/90 hover:text-indigo-900">
          {label}
          {currentKey === sortKey && <span className="ml-1 text-indigo-400">{order === 'ASC' ? '▲' : '▼'}</span>}
        </button>
      ) : (
        label
      )}
    </th>
  )
}

function SummaryCard({ title, value, hint }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white/70 p-4 shadow-sm">
      <div className="text-xs font-medium text-indigo-700">{title}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-gray-500">{hint}</div>}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-indigo-700">{label}</div>
      <div className="rounded-2xl border border-indigo-200 bg-white/80 p-3 text-gray-700">{String(value ?? '—')}</div>
    </div>
  )
}
