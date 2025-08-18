import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  PlusCircle,
  Save,
  X,
  Trash2,
  Pencil,
  Loader2,
  Search,
  ArrowLeft,
  ArrowRight,
  Download,
} from 'lucide-react'
import { useCategorias } from './useCategorias'

function classNames(...xs) {
  return xs.filter(Boolean).join(' ')
}

export default function Categorias() {
  const {
    items,
    loading,
    error,
    filters,
    setQuery,
    setLimit,
    nextPage,
    prevPage,
    setSort,
    createCategoria,
    updateCategoria,
    removeCategoria,
  } = useCategorias()

  // Drawer/modal de criação
  const [openCreate, setOpenCreate] = useState(false)
  const [newName, setNewName] = useState('')

  // Edição inline
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  // Busca com debounce
  const [qLocal, setQLocal] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setQuery(qLocal), 350)
    return () => clearTimeout(t)
  }, [qLocal, setQuery])

  const canGoNext = useMemo(() => items.length >= filters.limit, [items.length, filters.limit])

  async function onCreate(e) {
    e?.preventDefault()
    if (!newName.trim()) return
    const res = await createCategoria(newName.trim())
    if (res.ok) {
      setNewName('')
      setOpenCreate(false)
    } else {
      // Pode trocar por toast
      alert(res.message)
    }
  }

  function onEdit(row) {
    setEditingId(row.cat_id)
    setEditingName(row.cat_nome)
  }

  function onCancelEdit() {
    setEditingId(null)
    setEditingName('')
  }

  async function onSaveEdit(e) {
    e.preventDefault()
    if (!editingName.trim()) return
    const res = await updateCategoria(editingId, editingName.trim())
    if (res.ok) onCancelEdit()
    else alert(res.message)
  }

  async function onDelete(row) {
    if (!window.confirm(`Eliminar categoria "${row.cat_nome}"?`)) return
    const res = await removeCategoria(row.cat_id)
    if (!res.ok) alert(res.message)
  }

  function exportCSV() {
    const header = 'cat_id,cat_nome\n'
    const body = items.map(r => `${r.cat_id},"${(r.cat_nome ?? '').replaceAll('"', '""')}"`).join('\n')
    const csv = header + body
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'categorias.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative space-y-6">
      {/* BG moderno com blobs/gradiente */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-400/20 to-violet-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-violet-400/20 to-indigo-400/20 blur-3xl" />

      {/* Header + Filtros */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white/60 shadow backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_120%_-10%,#a78bfa22,transparent_60%),radial-gradient(80%_60%_at_-10%_120%,#6366f122,transparent_60%)]" />

        <div className="relative p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Categorias</h1>
              <p className="text-sm text-gray-600">Gestão de categorias com busca, ordenação e exportação.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white/70 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <Download className="h-4 w-4" /> Exportar CSV
              </button>
              <button
                onClick={() => setOpenCreate(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <PlusCircle className="h-4 w-4" /> Nova Categoria
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
                <input
                  value={qLocal}
                  onChange={(e) => setQLocal(e.target.value)}
                  placeholder="Procurar categorias..."
                  aria-label="Procurar categorias"
                  className="w-72 rounded-2xl border border-indigo-200 bg-white/80 px-9 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                />
              </div>

              <select
                className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                value={filters.limit}
                onChange={(e) => setLimit(e.target.value)}
                aria-label="Itens por página"
              >
                {[5, 10, 20, 50].map(n => (
                  <option key={n} value={n}>{n}/página</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-indigo-700/80">Mostrando {items.length} registo(s)</div>
          </div>
        </div>
      </section>

      {/* Tabela */}
      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white/70 shadow backdrop-blur-xl">
        <div className="max-h-[60vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700">
              <tr>
                <th className="w-24 border-b border-indigo-100 px-5 py-3 text-left text-[11px] uppercase tracking-wider">ID</th>
                <th
                  className="border-b border-indigo-100 px-5 py-3 text-left text-[11px] uppercase tracking-wider"
                >
                  <button
                    type="button"
                    onClick={() => setSort('cat_nome')}
                    className="inline-flex items-center gap-1 text-indigo-700/90 hover:text-indigo-900"
                    title="Ordenar por nome"
                  >
                    Nome
                    <span className="ml-1 text-indigo-400">{filters.order === 'ASC' ? '▲' : '▼'}</span>
                  </button>
                </th>
                <th className="w-44 border-b border-indigo-100 px-5 py-3 text-right text-[11px] uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {loading && (
                Array.from({ length: Math.max(3, Number(filters.limit) || 10) }).map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse">
                    <td className="px-5 py-3">
                      <div className="h-3 w-12 rounded bg-indigo-100" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-3 w-48 rounded bg-indigo-100" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="ml-auto h-8 w-28 rounded-2xl bg-indigo-100" />
                    </td>
                  </tr>
                ))
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-16 text-center">
                    <div className="inline-flex flex-col items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100">
                        <Search className="h-5 w-5 text-indigo-400" />
                      </div>
                      <p className="text-sm text-gray-600">Sem resultados para os filtros aplicados.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && items.map((row) => (
                <tr key={row.cat_id} className="transition hover:bg-indigo-50/50">
                  <td className="px-5 py-3 text-gray-700">{row.cat_id}</td>
                  <td className="px-5 py-3">
                    {editingId === row.cat_id ? (
                      <form onSubmit={onSaveEdit} className="flex items-center gap-2">
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full max-w-sm rounded-2xl border border-indigo-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-xs font-medium text-white hover:from-indigo-700 hover:to-violet-700"
                          title="Guardar"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={onCancelEdit}
                          className="inline-flex items-center gap-1 rounded-2xl border border-indigo-200 px-3 py-2 text-xs hover:bg-indigo-50"
                          title="Cancelar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    ) : (
                      <span className="text-gray-900">{row.cat_nome}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {editingId !== row.cat_id && (
                        <button
                          onClick={() => onEdit(row)}
                          className="inline-flex items-center gap-1 rounded-2xl border border-indigo-200 px-3 py-2 text-xs text-gray-700 transition hover:bg-indigo-50"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(row)}
                        className="inline-flex items-center gap-1 rounded-2xl border border-red-200 px-3 py-2 text-xs text-red-600 transition hover:bg-red-50"
                        title="Apagar"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Apagar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between border-t border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-3">
          <div className="text-xs text-indigo-700/80">Offset: {filters.offset} · Limite: {filters.limit}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={filters.offset === 0}
              className={classNames(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition',
                'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50',
                filters.offset === 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Anterior
            </button>
            <button
              onClick={nextPage}
              disabled={!canGoNext}
              className={classNames(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition',
                'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50',
                !canGoNext && 'opacity-50 cursor-not-allowed'
              )}
            >
              Próximo <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Alerta de erro */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 shadow">{error}</div>
      )}

      {/* Modal de criação */}
      <Transition appear show={openCreate} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOpenCreate(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg overflow-hidden rounded-3xl border border-indigo-100 bg-white/80 p-0 shadow-xl backdrop-blur-xl">
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white">
                    <Dialog.Title className="text-base font-semibold">Nova Categoria</Dialog.Title>
                    <Dialog.Description className="text-xs text-white/80">Crie uma categoria para organizar seus materiais.</Dialog.Description>
                  </div>

                  <form onSubmit={onCreate} className="space-y-4 p-6">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-indigo-700">Nome da categoria</label>
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                        placeholder="Ex.: Informática"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setOpenCreate(false)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 px-4 py-2 text-sm hover:bg-indigo-50"
                      >
                        <X className="h-4 w-4" /> Cancelar
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
                      >
                        <Save className="h-4 w-4" /> Guardar
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}
