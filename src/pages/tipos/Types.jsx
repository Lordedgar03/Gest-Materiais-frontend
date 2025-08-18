// src/pages/Types.jsx
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  PlusCircle,
  Save,
  X,
  Trash2,
  Pencil,
  Search,
  ArrowLeft,
  ArrowRight,
  Download,
} from 'lucide-react'
import { useTipos } from './useTipos' // ajuste se precisa de caminho relativo

function classNames(...xs) {
  return xs.filter(Boolean).join(' ')
}

export default function Types() {
  const {
    filtered,         // lista vinda do hook já filtrada por q/categoria
    categorias,       // [{cat_id, cat_nome}]
    categoriaMap,     // Map(cat_id -> cat_nome)
    loading,
    saving,
    error,
    filters,          // { q, categoriaId }
    setSearch,        // atualiza q
    setCategoriaFilter,
    add,              // cria tipo
    update,           // atualiza tipo
    remove,           // apaga tipo
  } = useTipos()

  // ----- Estado UI -----
  const [openCreate, setOpenCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCat, setNewCat] = useState('')

  // Edição inline
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingCat, setEditingCat] = useState('')

  // Busca com debounce
  const [qLocal, setQLocal] = useState(filters.q || '')
  useEffect(() => {
    const t = setTimeout(() => setSearch(qLocal), 350)
    return () => clearTimeout(t)
  }, [qLocal, setSearch])

  // Filtro de categoria (já está no hook)
  const onChangeFilterCategory = (e) => {
    const v = e.target.value
    setCategoriaFilter(v === 'all' ? 'all' : Number(v))
  }

  // Ordenação local (por nome)
  const [order, setOrder] = useState('ASC') // ASC | DESC
  const toggleSort = () => setOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'))

  // Paginação local
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(0)
  useEffect(() => setPage(0), [filters.q, filters.categoriaId, pageSize]) // reset ao mudar filtros

  const sorted = useMemo(() => {
    const arr = [...(filtered || [])]
    arr.sort((a, b) => {
      const an = (a?.tipo_nome || '').toLowerCase()
      const bn = (b?.tipo_nome || '').toLowerCase()
      if (an < bn) return order === 'ASC' ? -1 : 1
      if (an > bn) return order === 'ASC' ? 1 : -1
      return 0
    })
    return arr
  }, [filtered, order])

  const start = page * pageSize
  const end = start + pageSize
  const pageRows = sorted.slice(start, end)
  const canGoNext = end < sorted.length

  // ----- Ações -----
  async function onCreate(e) {
    e?.preventDefault()
    if (!newName.trim() || !newCat) return
    const payload = { tipo_nome: newName.trim(), tipo_fk_categoria: Number(newCat) }
    try {
      await add(payload)
      setNewName('')
      setNewCat('')
      setOpenCreate(false)
    } catch (err) {
      alert(err?.response?.data?.message || 'Erro ao criar tipo')
    }
  }

  function onEdit(row) {
    setEditingId(row.tipo_id)
    setEditingName(row.tipo_nome || '')
    setEditingCat(row.tipo_fk_categoria || '')
  }

  function onCancelEdit() {
    setEditingId(null)
    setEditingName('')
    setEditingCat('')
  }

  async function onSaveEdit(e) {
    e.preventDefault()
    if (!editingName.trim() || !editingCat) return
    try {
      await update(editingId, {
        tipo_nome: editingName.trim(),
        tipo_fk_categoria: Number(editingCat),
      })
      onCancelEdit()
    } catch (err) {
      alert(err?.response?.data?.message || 'Erro ao atualizar tipo')
    }
  }

  async function onDelete(row) {
    if (!window.confirm(
      `Eliminar tipo "${row.tipo_nome}"?\n\nEsta ação também remove materiais associados e cria logs (Reciclagem/Movimentações).`
    )) return
    const res = await remove(row.tipo_id)
    if (res?.ok === false && res?.message) alert(res.message)
  }

  function exportCSV() {
    const header = 'tipo_id,tipo_nome,tipo_fk_categoria,categoria_nome\n'
    const body = (sorted || []).map(r => {
      const cid = r.tipo_fk_categoria ?? ''
      const cnome = categoriaMap.get(cid) ?? ''
      const nome = (r.tipo_nome ?? '').replaceAll('"', '""')
      const cn = String(cnome).replaceAll('"', '""')
      return `${r.tipo_id},"${nome}",${cid},"${cn}"`
    }).join('\n')
    const csv = header + body
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tipos.csv'
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
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Tipos</h1>
              <p className="text-sm text-gray-600">Gestão de tipos com busca, filtro por categoria, ordenação e exportação.</p>
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
                <PlusCircle className="h-4 w-4" /> Novo Tipo
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
                <input
                  value={qLocal}
                  onChange={(e) => setQLocal(e.target.value)}
                  placeholder="Procurar tipos..."
                  aria-label="Procurar tipos"
                  className="w-72 rounded-2xl border border-indigo-200 bg-white/80 px-9 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                />
              </div>

              <select
                className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                value={filters.categoriaId === 'all' ? 'all' : String(filters.categoriaId)}
                onChange={onChangeFilterCategory}
                aria-label="Filtrar por categoria"
              >
                <option value="all">Todas as categorias</option>
                {categorias.map((c) => (
                  <option key={c.cat_id} value={c.cat_id}>{c.cat_nome}</option>
                ))}
              </select>

              <select
                className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Itens por página"
              >
                {[5, 10, 20, 50].map(n => (
                  <option key={n} value={n}>{n}/página</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-indigo-700/80">
              Mostrando {pageRows.length} de {sorted.length} registo(s)
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
                <th className="w-24 border-b border-indigo-100 px-5 py-3 text-left text-[11px] uppercase tracking-wider">ID</th>
                <th className="border-b border-indigo-100 px-5 py-3 text-left text-[11px] uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={toggleSort}
                    className="inline-flex items-center gap-1 text-indigo-700/90 hover:text-indigo-900"
                    title="Ordenar por nome"
                  >
                    Nome
                    <span className="ml-1 text-indigo-400">{order === 'ASC' ? '▲' : '▼'}</span>
                  </button>
                </th>
                <th className="border-b border-indigo-100 px-5 py-3 text-left text-[11px] uppercase tracking-wider">Categoria</th>
                <th className="w-44 border-b border-indigo-100 px-5 py-3 text-right text-[11px] uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {loading && (
                Array.from({ length: Math.max(3, Number(pageSize) || 10) }).map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse">
                    <td className="px-5 py-3"><div className="h-3 w-12 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-3 w-48 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="h-3 w-32 rounded bg-indigo-100" /></td>
                    <td className="px-5 py-3"><div className="ml-auto h-8 w-28 rounded-2xl bg-indigo-100" /></td>
                  </tr>
                ))
              )}

              {!loading && pageRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="inline-flex flex-col items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100">
                        <Search className="h-5 w-5 text-indigo-400" />
                      </div>
                      <p className="text-sm text-gray-600">Sem resultados para os filtros aplicados.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && pageRows.map((row) => (
                <tr key={row.tipo_id} className="transition hover:bg-indigo-50/50">
                  <td className="px-5 py-3 text-gray-700">{row.tipo_id}</td>

                  <td className="px-5 py-3">
                    {editingId === row.tipo_id ? (
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
                          disabled={saving}
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
                      <span className="text-gray-900">{row.tipo_nome}</span>
                    )}
                  </td>

                  <td className="px-5 py-3">
                    {editingId === row.tipo_id ? (
                      <select
                        value={editingCat}
                        onChange={(e) => setEditingCat(Number(e.target.value) || '')}
                        className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                        required
                      >
                        <option value="">Selecionar…</option>
                        {categorias.map((c) => (
                          <option key={c.cat_id} value={c.cat_id}>{c.cat_nome}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-900">
                        {categoriaMap.get(row.tipo_fk_categoria) || `#${row.tipo_fk_categoria}`}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {editingId !== row.tipo_id ? (
                        <button
                          onClick={() => onEdit(row)}
                          className="inline-flex items-center gap-1 rounded-2xl border border-indigo-200 px-3 py-2 text-xs text-gray-700 transition hover:bg-indigo-50"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </button>
                      ) : null}
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

        {/* Paginação local */}
        <div className="flex items-center justify-between border-t border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-3">
          <div className="text-xs text-indigo-700/80">
            Página {page + 1} · {pageRows.length} / {sorted.length} itens
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className={classNames(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition',
                'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50',
                page === 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Anterior
            </button>
            <button
              onClick={() => setPage((p) => (canGoNext ? p + 1 : p))}
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
                    <Dialog.Title className="text-base font-semibold">Novo Tipo</Dialog.Title>
                    <Dialog.Description className="text-xs text-white/80">
                      Crie um tipo e associe a uma categoria.
                    </Dialog.Description>
                  </div>

                  <form onSubmit={onCreate} className="space-y-4 p-6">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-indigo-700">Nome do tipo</label>
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                        placeholder="Ex.: Notebook"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-indigo-700">Categoria</label>
                      <select
                        value={newCat}
                        onChange={(e) => setNewCat(e.target.value)}
                        className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                        required
                      >
                        <option value="">Selecionar…</option>
                        {categorias.map((c) => (
                          <option key={c.cat_id} value={c.cat_id}>{c.cat_nome}</option>
                        ))}
                      </select>
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
                        disabled={saving}
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
