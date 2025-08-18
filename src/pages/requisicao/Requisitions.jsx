import React, { Fragment, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useParams } from 'react-router-dom' // opcional — se usar react-router
import { useRequisicao } from './useRequisicoes' // ajuste o caminho
import { ArrowDown, ArrowUp, CheckCircle2, ClipboardList, Download, Loader2, ShieldX, ThumbsDown, X } from 'lucide-react'

const fmtDateTime = (d) => d ? new Date(d).toLocaleString('pt-PT') : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-PT') : '—'

export default function RequisicaoPage({ id: idProp }) {
  const params = useParams?.() || {}
  const reqId = Number(idProp ?? params.id)
  const { requisicao, loading, saving, error, metrics, refresh, setStatus, decidir, atender, devolver, remove } = useRequisicao(reqId)

  // Modais de ações por item
  const [openAtender, setOpenAtender] = useState(false)
  const [openDevolver, setOpenDevolver] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [qty, setQty] = useState(1)
  const [condicao, setCondicao] = useState('Boa')
  const [obs, setObs] = useState('')

  const statusPill = useMemo(() => pill(requisicao?.req_status), [requisicao?.req_status])

  function openAtenderItem(it) {
    setCurrentItem(it)
    setQty(Math.max(1, Math.min(it.rqi_quantidade - it.rqi_qtd_atendida, 999999)))
    setOpenAtender(true)
  }
  async function confirmAtender() {
    if (!currentItem) return
    await atender([{ rqi_id: currentItem.rqi_id, quantidade: Number(qty) }])
    setOpenAtender(false)
  }

  function openDevolverItem(it) {
    setCurrentItem(it)
    const emUso = (it.rqi_qtd_atendida || 0) - (it.rqi_qtd_devolvida || 0)
    setQty(Math.max(1, Math.min(emUso, 999999)))
    setCondicao('Boa'); setObs('')
    setOpenDevolver(true)
  }
  async function confirmDevolver() {
    if (!currentItem) return
    await devolver([{ rqi_id: currentItem.rqi_id, quantidade: Number(qty), condicao, obs }])
    setOpenDevolver(false)
  }

  function exportCSV() {
    const header = 'item_id;material_id;descricao;qt_solicitada;qt_atendida;qt_devolvida;em_uso\n'
    const lines = (requisicao?.itens || []).map(it => [
      it.rqi_id, it.rqi_fk_material, csv(it.rqi_descricao), it.rqi_quantidade, it.rqi_qtd_atendida, it.rqi_qtd_devolvida, (it.rqi_qtd_atendida - it.rqi_qtd_devolvida)
    ].join(';'))
    const blob = new Blob(['\uFEFF' + header + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${requisicao?.req_codigo || 'requisicao'}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="relative space-y-6">
      {/* BG decorativo */}
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
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Requisição {requisicao?.req_codigo ? `#${requisicao.req_codigo}` : ''}</h1>
                <p className="text-sm text-gray-600">Status atual: <span className={statusPill.className}>{statusPill.label}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white/70 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50">
                <Download className="h-4 w-4" /> Exportar CSV
              </button>
              <button onClick={() => refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white/70 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar'}
              </button>
            </div>
          </div>

          {/* Resumo */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Summary title="Itens" value={metrics.totalItens} />
            <Summary title="Qt. solicitada" value={metrics.totalQtd} />
            <Summary title="Atendida" value={metrics.atendida} />
            <Summary title="Devolvida" value={metrics.devolvida} />
            <Summary title="Em uso" value={metrics.emUso} />
          </div>

          {/* Cabeçalho */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <Field label="Criada em" value={fmtDateTime(requisicao?.req_date)} />
            <Field label="Necessária para" value={fmtDate(requisicao?.req_needed_at)} />
            <Field label="Local de entrega" value={requisicao?.req_local_entrega || '—'} />
            <Field label="Aprovado por" value={requisicao?.req_approved_by ?? '—'} />
            <Field className="lg:col-span-2" label="Justificativa" value={requisicao?.req_justificativa || '—'} />
            <Field className="lg:col-span-2" label="Observações" value={requisicao?.req_observacoes || '—'} />
          </div>

          {/* Ações de decisão */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={() => decidir('Aprovar')} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-3 py-2 text-sm font-medium text-white shadow disabled:opacity-60"><CheckCircle2 className="h-4 w-4" /> Aprovar</button>
            <button onClick={() => decidir('Rejeitar')} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-sm font-medium text-white shadow disabled:opacity-60"><ThumbsDown className="h-4 w-4" /> Rejeitar</button>
            <button onClick={() => decidir('Cancelar')} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow disabled:opacity-60"><ShieldX className="h-4 w-4" /> Cancelar</button>
          </div>
        </div>
      </section>

      {/* Itens */}
      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white/70 shadow backdrop-blur-xl">
        <div className="max-h-[55vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700">
              <tr>
                <Th>Item</Th>
                <Th>Material</Th>
                <Th>Descrição</Th>
                <Th right>Qt. Solic.</Th>
                <Th right>Qt. Atend.</Th>
                <Th right>Qt. Devol.</Th>
                <Th right>Em uso</Th>
                <Th right>Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {loading && (
                <tr><td colSpan={8} className="px-5 py-6 text-center text-gray-500">Carregando...</td></tr>
              )}

              {!loading && (requisicao?.itens || []).length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-500">Sem itens.</td></tr>
              )}

              {(requisicao?.itens || []).map(it => {
                const emUso = (it.rqi_qtd_atendida || 0) - (it.rqi_qtd_devolvida || 0)
                const restante = (it.rqi_quantidade || 0) - (it.rqi_qtd_atendida || 0)
                return (
                  <tr key={it.rqi_id} className="transition hover:bg-indigo-50/50">
                    <td className="px-5 py-3">#{it.rqi_id}</td>
                    <td className="px-5 py-3">#{it.rqi_fk_material}</td>
                    <td className="px-5 py-3 max-w-[40ch] truncate" title={it.rqi_descricao}>{it.rqi_descricao || '—'}</td>
                    <td className="px-5 py-3 text-right">{it.rqi_quantidade}</td>
                    <td className="px-5 py-3 text-right">{it.rqi_qtd_atendida}</td>
                    <td className="px-5 py-3 text-right">{it.rqi_qtd_devolvida}</td>
                    <td className="px-5 py-3 text-right">{emUso}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button disabled={restante <= 0 || saving} onClick={() => openAtenderItem(it)} className="rounded-2xl border border-indigo-200 bg-white px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-50 inline-flex items-center gap-1 disabled:opacity-50"><ArrowUp className="h-3.5 w-3.5" /> Atender</button>
                        <button disabled={emUso <= 0 || saving} onClick={() => openDevolverItem(it)} className="rounded-2xl border border-indigo-200 bg-white px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-50 inline-flex items-center gap-1 disabled:opacity-50"><ArrowDown className="h-3.5 w-3.5" /> Devolver</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Linha do tempo de decisões */}
      <section className="rounded-3xl border border-indigo-100 bg-white/70 p-5 shadow backdrop-blur-xl">
        <h3 className="text-sm font-semibold text-gray-900">Decisões</h3>
        <ul className="mt-3 space-y-2">
          {(requisicao?.decisoes || []).map((d) => (
            <li key={d.dec_id} className="rounded-2xl border border-indigo-100 bg-white/70 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-indigo-700">{d.dec_tipo}</span>
                <span className="text-xs text-gray-500">{fmtDateTime(d.dec_data)}</span>
              </div>
              {d.dec_motivo && <div className="mt-1 text-gray-700">{d.dec_motivo}</div>}
            </li>
          ))}
          {(requisicao?.decisoes || []).length === 0 && (
            <li className="text-sm text-gray-500">Sem decisões ainda.</li>
          )}
        </ul>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 shadow">{String(error)}</div>}

      {/* Modal Atender */}
      <Transition appear show={openAtender} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOpenAtender(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-3xl border border-indigo-100 bg-white/80 p-0 shadow-xl backdrop-blur-xl">
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white">
                    <Dialog.Title className="text-base font-semibold">Atender item</Dialog.Title>
                    <Dialog.Description className="text-xs text-white/80">Informe a quantidade a atender</Dialog.Description>
                  </div>
                  <div className="grid gap-3 p-6 text-sm">
                    <div>
                      <div className="text-[11px] font-medium text-indigo-700">Item</div>
                      <div className="rounded-2xl border border-indigo-200 bg-white/80 p-3">#{currentItem?.rqi_id}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-indigo-700">Quantidade</div>
                      <input type="number" min={1} step={1} value={qty} onChange={e => setQty(Number(e.target.value || 1))} className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setOpenAtender(false)} className="rounded-2xl border border-indigo-200 px-4 py-2 text-sm hover:bg-indigo-50 inline-flex items-center gap-2"><X className="h-4 w-4" /> Cancelar</button>
                      <button onClick={confirmAtender} disabled={saving || !qty} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow disabled:opacity-60">Confirmar</button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal Devolver */}
      <Transition appear show={openDevolver} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOpenDevolver(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-3xl border border-indigo-100 bg-white/80 p-0 shadow-xl backdrop-blur-xl">
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white">
                    <Dialog.Title className="text-base font-semibold">Devolver item</Dialog.Title>
                    <Dialog.Description className="text-xs text-white/80">Informe a quantidade e condição de devolução</Dialog.Description>
                  </div>
                  <div className="grid gap-3 p-6 text-sm">
                    <div>
                      <div className="text-[11px] font-medium text-indigo-700">Item</div>
                      <div className="rounded-2xl border border-indigo-200 bg-white/80 p-3">#{currentItem?.rqi_id}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-indigo-700">Quantidade</div>
                      <input type="number" min={1} step={1} value={qty} onChange={e => setQty(Number(e.target.value || 1))} className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" />
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-indigo-700">Condição</div>
                      <select value={condicao} onChange={e => setCondicao(e.target.value)} className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2">
                        <option value="Boa">Boa</option>
                        <option value="Danificada">Danificada</option>
                        <option value="Perdida">Perdida</option>
                      </select>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-indigo-700">Observações</div>
                      <input value={obs} onChange={e => setObs(e.target.value)} className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setOpenDevolver(false)} className="rounded-2xl border border-indigo-200 px-4 py-2 text-sm hover:bg-indigo-50 inline-flex items-center gap-2"><X className="h-4 w-4" /> Cancelar</button>
                      <button onClick={confirmDevolver} disabled={saving || !qty} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow disabled:opacity-60">Confirmar</button>
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

function Summary({ title, value }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white/70 p-4 shadow-sm">
      <div className="text-xs font-medium text-indigo-700">{title}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900">{value}</div>
    </div>
  )
}

function Field({ label, value, className = '' }) {
  return (
    <div className={className}>
      <div className="text-[11px] font-medium text-indigo-700">{label}</div>
      <div className="mt-1 rounded-2xl border border-indigo-200 bg-white/80 p-3 text-gray-700">{String(value ?? '—')}</div>
    </div>
  )
}

function Th({ children, right }) {
  return (
    <th className={"border-b border-indigo-100 px-5 py-3 text-[11px] uppercase tracking-wider " + (right ? 'text-right' : 'text-left')}>{children}</th>
  )
}

function pill(status) {
  const base = 'rounded-full px-3 py-1 text-xs font-medium border'
  switch (status) {
    case 'Pendente': return { className: `${base} bg-amber-50 text-amber-700 border-amber-200`, label: 'Pendente' }
    case 'Aprovada': return { className: `${base} bg-emerald-50 text-emerald-700 border-emerald-200`, label: 'Aprovada' }
    case 'Atendida': return { className: `${base} bg-indigo-50 text-indigo-700 border-indigo-200`, label: 'Atendida' }
    case 'Em Uso':   return { className: `${base} bg-blue-50 text-blue-700 border-blue-200`, label: 'Em Uso' }
    case 'Parcial':  return { className: `${base} bg-violet-50 text-violet-700 border-violet-200`, label: 'Parcial' }
    case 'Devolvida':return { className: `${base} bg-slate-50 text-slate-700 border-slate-200`, label: 'Devolvida' }
    case 'Rejeitada':return { className: `${base} bg-rose-50 text-rose-700 border-rose-200`, label: 'Rejeitada' }
    case 'Cancelada':return { className: `${base} bg-gray-50 text-gray-600 border-gray-200`, label: 'Cancelada' }
    default:         return { className: `${base} bg-white text-gray-700 border-gray-200`, label: String(status || '—') }
  }
}

function csv(s) { const v = String(s ?? ''); return (v.includes(';')||v.includes('\n')||v.includes('"')) ? '"'+v.replaceAll('"','""')+'"' : v }
