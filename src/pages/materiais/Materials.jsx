import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useMateriais } from './hooks.materiais'
import { useTipos } from '../tipos/useTipos'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ClipboardList,
  Download,
  Loader2,
  Package,
  Pencil,
  PlusCircle,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'

function classNames(...xs) { return xs.filter(Boolean).join(' ') }
const fmtCurrency = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })

export default function MateriaisBonito() {
  // ---- Tipos e mapa id->nome
  const { tipos, fetchAll: fetchTiposAll } = useTipos()
  const tipoMap = useMemo(() => new Map((tipos || []).map(t => [Number(t.tipo_id), String(t.tipo_nome)])), [tipos])

  // ---- Materiais
  const {
    items,
    filtered,
    loading,
    saving,
    error,
    filters,
    fetchMateriais,
    create,
    update,
    removeUnits,
    adjustStock,
    setSearch,
    setTipoFilter,
    setVendavel,
    setStatus,
    setEstoque,
  } = useMateriais({ tipoMap })

  // Busca com debounce
  const [qLocal, setQLocal] = useState('')
  useEffect(() => { const t = setTimeout(() => setSearch(qLocal), 350); return () => clearTimeout(t) }, [qLocal, setSearch])

  // Ordenação local
  const [sortKey, setSortKey] = useState('mat_nome')
  const [order, setOrder] = useState('ASC')
  const onSort = (key) => { if (sortKey === key) setOrder(p => (p === 'ASC' ? 'DESC' : 'ASC')); else { setSortKey(key); setOrder('ASC') } }
  const sorted = useMemo(() => {
    const arr = [...filtered]
    const dir = order === 'ASC' ? 1 : -1
    arr.sort((a,b) => {
      const va = keyVal(a, sortKey)
      const vb = keyVal(b, sortKey)
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
    return arr
  }, [filtered, sortKey, order])

  // Modais
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm())

  const [openRemove, setOpenRemove] = useState(false)
  const [rmPayload, setRmPayload] = useState({ id: null, nome: '', quantidade: 1, descricao: 'Baixa de estoque' })

  const [openAdjust, setOpenAdjust] = useState(false)
  const [adjPayload, setAdjPayload] = useState({ id: null, nome: '', delta: 1 })

  useEffect(() => { fetchTiposAll?.(); fetchMateriais() }, [])

  // Resumos (cards)
  const resumo = useMemo(() => {
    const total = filtered.length
    const vendSim = filtered.filter(m => m.mat_vendavel === 'SIM').length
    const baixo = filtered.filter(m => m.lowStock && !m.isZero).length
    const zerado = filtered.filter(m => m.isZero).length
    const valorTotal = filtered.reduce((acc,m) => acc + Number(m.mat_preco || 0) * Number(m.mat_quantidade_estoque || 0), 0)
    return { total, vendSim, baixo, zerado, valorTotal }
  }, [filtered])

  // Helpers de formulário
  function openCreate() { setEditing(null); setForm(emptyForm()); setOpenForm(true) }
  function openEdit(m) {
    setEditing(m)
    setForm({ ...m })
    setOpenForm(true)
  }
  async function submitForm(e) {
    e?.preventDefault?.()
    const payload = sanitizePayload(form)
    if (editing) {
      const id = editing.mat_id
      const { mat_id, ...toSend } = payload
      const res = await update(id, toSend)
      if (res?.ok) setOpenForm(false)
    } else {
      const res = await create(payload)
      if (res?.ok) setOpenForm(false)
    }
  }

  function openRemoveUnits(m) {
    setRmPayload({ id: m.mat_id, nome: m.mat_nome, quantidade: 1, descricao: 'Baixa de estoque' })
    setOpenRemove(true)
  }
  async function confirmRemove() { if (!rmPayload.id) return; const r = await removeUnits(rmPayload); if (r?.ok) setOpenRemove(false) }

  function openAdjustStock(m, initialDelta = 1) { setAdjPayload({ id: m.mat_id, nome: m.mat_nome, delta: Math.max(1, Math.abs(initialDelta)) }); setOpenAdjust(true) }
  async function confirmAdjust() { if (!adjPayload.id || !adjPayload.delta) return; await adjustStock(adjPayload.id, Number(adjPayload.delta)); setOpenAdjust(false) }

  function exportCSV() {
    const header = 'id;nome;tipo;preco;estoque;minimo;localizacao;vendavel;status\n'
    const body = sorted.map(r => [
      r.mat_id,
      csvSafe(r.mat_nome),
      csvSafe(tipoMap.get(Number(r.mat_fk_tipo)) || ''),
      String(r.mat_preco).replace('.', ','),
      r.mat_quantidade_estoque,
      r.mat_estoque_minimo,
      csvSafe(r.mat_localizacao),
      r.mat_vendavel,
      r.mat_status,
    ].join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + header + body], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'materiais.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const canPaginate = false // (hook atual não pagina) – manter para evolução futura

  return (
    <div className="relative space-y-6">
      {/* BG decorativo */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-400/20 to-violet-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-violet-400/20 to-indigo-400/20 blur-3xl" />

      {/* Header / Toolbar */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white/60 shadow backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_120%_-10%,#a78bfa22,transparent_60%),radial-gradient(80%_60%_at_-10%_120%,#6366f122,transparent_60%)]" />
        <div className="relative p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Materiais</h1>
                <p className="text-sm text-gray-600">Gestão de catálogo e stock com filtros, ações e exportação.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white/70 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <Download className="h-4 w-4" /> Exportar CSV
              </button>
              <button onClick={() => { fetchTiposAll?.(); fetchMateriais() }} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white/70 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60">
                <RefreshCw className={classNames('h-4 w-4', loading && 'animate-spin')} /> Atualizar
              </button>
              <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-3 py-2 text-sm font-medium text-white shadow transition hover:opacity-95">
                <PlusCircle className="h-4 w-4" /> Novo material
              </button>
            </div>
          </div>

          {/* Cards de resumo */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard title="Itens filtrados" value={resumo.total} hint="Quantidade de registos" />
            <SummaryCard title="Vendáveis" value={resumo.vendSim} hint="Com venda habilitada" />
            <SummaryCard title="Estoque baixo" value={resumo.baixo} hint="≤ mínimo e > 0" />
            <SummaryCard title="Zerados" value={resumo.zerado} hint="Sem stock" />
          </div>

          {/* Filtros */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
              <input value={qLocal} onChange={(e) => setQLocal(e.target.value)} placeholder="Procurar por nome..." className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-9 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60" />
            </div>
            <select className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/60" value={filters.tipoId} onChange={(e) => setTipoFilter(e.target.value)}>
              <option value="all">Tipo (todos)</option>
              {(tipos || []).map(t => (<option key={t.tipo_id} value={t.tipo_id}>{t.tipo_nome}</option>))}
            </select>
            <select className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/60" value={filters.vendavel} onChange={(e) => setVendavel(e.target.value)}>
              <option value="all">Vendável (todos)</option>
              <option value="SIM">SIM</option>
              <option value="NAO">NÃO</option>
            </select>
            <select className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/60" value={filters.status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Status (todos)</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
            <select className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/60" value={filters.estoque} onChange={(e) => setEstoque(e.target.value)}>
              <option value="all">Estoque (todos)</option>
              <option value="baixo">Abaixo do mínimo</option>
              <option value="zerado">Zerado</option>
            </select>
          </div>
        </div>
      </section>

      {/* Tabela */}
      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white/70 shadow backdrop-blur-xl">
        <div className="max-h-[60vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700">
              <tr>
                <Th label="ID" sortKey="mat_id" currentKey={sortKey} order={order} onSort={onSort} />
                <Th label="Nome" sortKey="mat_nome" currentKey={sortKey} order={order} onSort={onSort} />
                <Th label="Tipo" sortKey="tipo" currentKey={sortKey} order={order} onSort={onSort} />
                <Th label="Preço" right sortKey="mat_preco" currentKey={sortKey} order={order} onSort={onSort} />
                <Th label="Estoque" right sortKey="mat_quantidade_estoque" currentKey={sortKey} order={order} onSort={onSort} />
                <Th label="Mín." right sortKey="mat_estoque_minimo" currentKey={sortKey} order={order} onSort={onSort} />
                <Th label="Localização" />
                <Th label="Vendável" />
                <Th label="Status" />
                <Th label="" right />
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {loading && (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse">
                    <td className="px-5 py-3"><div className="h-3 w-10 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-3 w-48 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-6 w-24 rounded-xl bg-indigo-100" /></td>
                    <td className="px-5 py-3 text-right"><div className="ml-auto h-3 w-16 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3 text-right"><div className="ml-auto h-3 w-10 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3 text-right"><div className="ml-auto h-3 w-10 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-3 w-24 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-6 w-20 rounded-xl bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-6 w-20 rounded-xl bg-indigo-100" /></td>
                    <td className="px-5 py-3 text-right"><div className="ml-auto h-8 w-28 rounded-2xl bg-indigo-100" /></td>
                  </tr>
                ))
              )}

              {!loading && sorted.length === 0 && (
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

              {!loading && sorted.map((m) => (
                <tr key={m.mat_id} className="transition hover:bg-indigo-50/50">
                  <td className="px-5 py-3 text-gray-700">#{m.mat_id}</td>
                  <td className="px-5 py-3 text-gray-900">{m.mat_nome}</td>
                  <td className="px-5 py-3">{tipoMap.get(Number(m.mat_fk_tipo)) || '—'}</td>
                  <td className="px-5 py-3 text-right">{fmtCurrency.format(Number(m.mat_preco || 0))}</td>
                  <td className={classNames('px-5 py-3 text-right', m.isZero && 'text-red-600 font-semibold')}>{m.mat_quantidade_estoque}</td>
                  <td className={classNames('px-5 py-3 text-right', m.lowStock && !m.isZero && 'text-amber-600')}>{m.mat_estoque_minimo}</td>
                  <td className="px-5 py-3 text-gray-700">{m.mat_localizacao || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={classNames('rounded-full px-3 py-1 text-xs font-medium border', m.mat_vendavel === 'SIM' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200')}>
                      {m.mat_vendavel}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={classNames('rounded-full px-3 py-1 text-xs font-medium border', m.mat_status === 'ativo' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-600 border-gray-200')}>
                      {m.mat_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button title="Saída" onClick={() => openAdjustStock(m, 1) && setAdjPayload(p => ({...p, delta: -Math.abs(p.delta)}))} className="p-1 rounded-lg border hover:bg-indigo-50">
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button title="Entrada" onClick={() => openAdjustStock(m, 1)} className="p-1 rounded-lg border hover:bg-indigo-50">
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button title="Editar" onClick={() => openEdit(m)} className="p-1 rounded-lg border hover:bg-indigo-50">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button title="Remover unidades" onClick={() => openRemoveUnits(m)} className="p-1 rounded-lg border hover:bg-indigo-50 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação (placeholder para futura integração) */}
        {canPaginate && (
          <div className="flex items-center justify-between border-t border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-3">
            <div />
            <div className="text-xs text-indigo-700/80">Página 1</div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50">
                <ArrowLeft className="h-3.5 w-3.5" /> Anterior
              </button>
              <button className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50">
                Próximo <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 shadow">{String(error)}</div>}

      {/* Modal Form (Criar/Editar) */}
      <Transition appear show={openForm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOpenForm(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-3xl border border-indigo-100 bg-white/80 shadow-xl backdrop-blur-xl">
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white">
                    <Dialog.Title className="text-base font-semibold">{editing ? 'Editar material' : 'Novo material'}</Dialog.Title>
                    <Dialog.Description className="text-xs text-white/80">Preencha os campos obrigatórios para guardar.</Dialog.Description>
                  </div>

                  <form onSubmit={submitForm} className="grid gap-3 p-6 sm:grid-cols-2 text-sm">
                    <Field label="Nome">
                      <input required className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={form.mat_nome} onChange={e => setForm(p => ({...p, mat_nome: e.target.value}))} />
                    </Field>
                    <Field label="Tipo">
                      <select required className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={form.mat_fk_tipo ?? ''} onChange={e => setForm(p => ({...p, mat_fk_tipo: Number(e.target.value)}))}>
                        <option value="">Selecione...</option>
                        {(tipos || []).map(t => (<option key={t.tipo_id} value={t.tipo_id}>{t.tipo_nome}</option>))}
                      </select>
                    </Field>
                    <Field label="Preço">
                      <input required type="number" min="0" step="0.01" className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={form.mat_preco} onChange={e => setForm(p => ({...p, mat_preco: Number(e.target.value)}))} />
                    </Field>
                    <Field label="Localização">
                      <input required className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={form.mat_localizacao} onChange={e => setForm(p => ({...p, mat_localizacao: e.target.value}))} />
                    </Field>
                    <Field label="Estoque inicial">
                      <input type="number" min="0" step="1" className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={form.mat_quantidade_estoque} onChange={e => setForm(p => ({...p, mat_quantidade_estoque: Number(e.target.value)}))} />
                    </Field>
                    <Field label="Estoque mínimo">
                      <input required type="number" min="0" step="1" className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={form.mat_estoque_minimo} onChange={e => setForm(p => ({...p, mat_estoque_minimo: Number(e.target.value)}))} />
                    </Field>
                    <Field label="Vendável">
                      <select className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={form.mat_vendavel} onChange={e => setForm(p => ({...p, mat_vendavel: e.target.value}))}>
                        <option value="SIM">SIM</option>
                        <option value="NAO">NÃO</option>
                      </select>
                    </Field>
                    <Field label="Status">
                      <select className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={form.mat_status} onChange={e => setForm(p => ({...p, mat_status: e.target.value}))}>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </Field>
                    <div className="sm:col-span-2">
                      <div className="text-[11px] font-medium text-indigo-700">Descrição</div>
                      <textarea className="mt-1 w-full rounded-2xl border border-indigo-200 bg-white/80 p-3" rows={3} value={form.mat_descricao} onChange={e => setForm(p => ({...p, mat_descricao: e.target.value}))} />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setOpenForm(false)} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 px-4 py-2 text-sm hover:bg-indigo-50"><X className="h-4 w-4" /> Cancelar</button>
                      <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow disabled:opacity-60"><Save className="h-4 w-4" /> {editing ? 'Guardar alterações' : 'Criar material'}</button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal Remover unidades */}
      <Transition appear show={openRemove} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOpenRemove(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="w-full max-w-lg overflow-hidden rounded-3xl border border-indigo-100 bg-white/80 shadow-xl backdrop-blur-xl">
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white">
                    <Dialog.Title className="text-base font-semibold">Remover unidades</Dialog.Title>
                    <Dialog.Description className="text-xs text-white/80">Informe a quantidade e o motivo</Dialog.Description>
                  </div>
                  <div className="grid gap-3 p-6 text-sm">
                    <div>
                      <div className="text-[11px] font-medium text-indigo-700">Material</div>
                      <div className="rounded-2xl border border-indigo-200 bg-white/80 p-3">{rmPayload.nome}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Quantidade">
                        <input type="number" min={1} step={1} className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={rmPayload.quantidade} onChange={e => setRmPayload(p => ({...p, quantidade: Math.max(1, Number(e.target.value||1))}))} />
                      </Field>
                      <Field label="Motivo / descrição">
                        <input className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={rmPayload.descricao} onChange={e => setRmPayload(p => ({...p, descricao: e.target.value}))} />
                      </Field>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button onClick={() => setOpenRemove(false)} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 px-4 py-2 text-sm hover:bg-indigo-50"><X className="h-4 w-4" /> Cancelar</button>
                      <button onClick={confirmRemove} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow disabled:opacity-60"><Trash2 className="h-4 w-4" /> Remover</button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal Ajustar stock */}
      <Transition appear show={openAdjust} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOpenAdjust(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="w-full max-w-lg overflow-hidden rounded-3xl border border-indigo-100 bg-white/80 shadow-xl backdrop-blur-xl">
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white">
                    <Dialog.Title className="text-base font-semibold">Ajustar stock</Dialog.Title>
                    <Dialog.Description className="text-xs text-white/80">Use valores positivos para entrada e negativos para saída</Dialog.Description>
                  </div>
                  <div className="grid gap-3 p-6 text-sm">
                    <div>
                      <div className="text-[11px] font-medium text-indigo-700">Material</div>
                      <div className="rounded-2xl border border-indigo-200 bg-white/80 p-3">{adjPayload.nome}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={() => setAdjPayload(p => ({...p, delta: Math.max(1, Math.abs(Number(p.delta||1))) * -1}))} className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm hover:bg-indigo-50 inline-flex items-center justify-center gap-2">
                        <ArrowDown className="h-4 w-4" /> Saída
                      </button>
                      <input type="number" step={1} className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm text-center" value={adjPayload.delta} onChange={e => setAdjPayload(p => ({...p, delta: Number(e.target.value||0)}))} />
                      <button onClick={() => setAdjPayload(p => ({...p, delta: Math.max(1, Math.abs(Number(p.delta||1)))}))} className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm hover:bg-indigo-50 inline-flex items-center justify-center gap-2">
                        <ArrowUp className="h-4 w-4" /> Entrada
                      </button>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button onClick={() => setOpenAdjust(false)} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 px-4 py-2 text-sm hover:bg-indigo-50"><X className="h-4 w-4" /> Cancelar</button>
                      <button onClick={confirmAdjust} disabled={saving || !adjPayload.delta} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow disabled:opacity-60"><Save className="h-4 w-4" /> Aplicar</button>
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
      <div className="mt-1 text-xl font-semibold text-gray-900">{typeof value === 'number' ? value : String(value)}</div>
      {hint && <div className="mt-1 text-[11px] text-gray-500">{hint}</div>}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-indigo-700">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function keyVal(obj, key) {
  switch (key) {
    case 'mat_id': return Number(obj.mat_id)
    case 'mat_nome': return obj.mat_nome ?? ''
    case 'tipo': return obj.tipo_nome ?? ''
    case 'mat_preco': return Number(obj.mat_preco || 0)
    case 'mat_quantidade_estoque': return Number(obj.mat_quantidade_estoque || 0)
    case 'mat_estoque_minimo': return Number(obj.mat_estoque_minimo || 0)
    default: return ''
  }
}

function emptyForm() {
  return {
    mat_nome: '',
    mat_descricao: '',
    mat_preco: 0,
    mat_quantidade_estoque: 0,
    mat_estoque_minimo: 0,
    mat_fk_tipo: '',
    mat_localizacao: '',
    mat_vendavel: 'SIM',
    mat_status: 'ativo',
  }
}

function sanitizePayload(p) {
  return {
    mat_nome: String(p.mat_nome || ''),
    mat_descricao: String(p.mat_descricao || ''),
    mat_preco: Number(p.mat_preco || 0),
    mat_quantidade_estoque: Number(p.mat_quantidade_estoque || 0),
    mat_estoque_minimo: Number(p.mat_estoque_minimo || 0),
    mat_fk_tipo: Number(p.mat_fk_tipo),
    mat_localizacao: String(p.mat_localizacao || ''),
    mat_vendavel: p.mat_vendavel === 'NAO' ? 'NAO' : 'SIM',
    mat_status: p.mat_status === 'inativo' ? 'inativo' : 'ativo',
  }
}

function csvSafe(s) {
  const v = String(s ?? '')
  if (v.includes(';') || v.includes('\n') || v.includes('"')) return '"' + v.replaceAll('"', '""') + '"'
  return v
}