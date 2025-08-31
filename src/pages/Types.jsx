"use client"

import React, { useMemo, useState } from "react"
import {
  Shapes, Plus, Edit, Trash2, Save, X, Search, Loader2, EyeOff, Lock,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Info, TriangleAlert
} from "lucide-react"
import { useTypes } from "../hooks/useTypes"

/* ---------- Generic Modal ---------- */
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t border-slate-200">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

/* ---------- Confirm Delete Modal ---------- */
function ConfirmDeleteModal({ open, onClose, onConfirm, itemName, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <TriangleAlert className="h-5 w-5 text-rose-600" />
          Confirmar exclusão
        </span>
      }
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md border text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Excluir
          </button>
        </div>
      }
    >
      <p className="text-sm text-slate-700">
        Tem certeza que deseja excluir <span className="font-semibold">{itemName}</span>? Esta ação não pode ser desfeita.
      </p>
    </Modal>
  )
}

/* ---------- Type Form Modal (Create/Edit) ---------- */
function TypeFormModal({
  open,
  mode = "create",           // "create" | "edit"
  name, onNameChange,
  catId, onCatChange,
  categories,
  onClose, onConfirm, loading
}) {
  const isCreate = mode === "create"
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          {isCreate ? (
            <>
              <Plus className="h-5 w-5 text-violet-600" />
              Novo Tipo
            </>
          ) : (
            <>
              <Edit className="h-5 w-5 text-indigo-600" />
              Editar Tipo
            </>
          )}
        </span>
      }
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border text-slate-700 bg-white hover:bg-slate-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !name.trim() || !catId}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white ${
              isCreate
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            } disabled:opacity-50`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isCreate ? <Plus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isCreate ? "Adicionar" : "Salvar"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome do tipo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ex.: Portáteis"
            autoFocus
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
          <select
            value={catId}
            onChange={(e) => onCatChange(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Pagination (numerada) ---------- */
function Pagination({ currentPage, totalPages, onPage }) {
  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const p = [1]
    const left = Math.max(2, currentPage - 1)
    const right = Math.min(totalPages - 1, currentPage + 1)
    if (left > 2) p.push("…")
    for (let i = left; i <= right; i++) p.push(i)
    if (right < totalPages - 1) p.push("…")
    p.push(totalPages)
    return p
  }, [currentPage, totalPages])

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          disabled={currentPage === 1}
          onClick={() => onPage(Math.max(1, currentPage - 1))}
          className="px-4 py-2 border rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPage(Math.min(totalPages, currentPage + 1))}
          className="px-4 py-2 border rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
        >
          Próxima
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div />
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => onPage(Math.max(1, currentPage - 1))}
            className="px-2 py-2 rounded-l-md border bg-white text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-3 py-2 border bg-white text-sm text-slate-500 select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={`px-3 py-2 border bg-white text-sm ${
                  p === currentPage
                    ? "text-white bg-indigo-600 border-indigo-600"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            disabled={currentPage === totalPages}
            onClick={() => onPage(Math.min(totalPages, currentPage + 1))}
            className="px-2 py-2 rounded-r-md border bg-white text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>
  )
}

/* ---------- Page ---------- */
export default function TypesPage() {
  const {
    // permissões
    isAdmin, allowedCategoryIds, canView, canManageType,
    // dados
    allCategories, categoryOptions, current,
    // estado para criação/edição (do hook)
    newName, setNewName, newCatId, setNewCatId,
    tempName, setTempName, tempCatId, setTempCatId,
    // loadings
    loading, addLoading, saveLoading, deleteLoading,
    // busca/paginação
    searchTerm, setSearchTerm, currentPage, setCurrentPage, totalPages, typesPerPage,
    // ações do hook
    addType, startEdit, cancelEdit, saveEdit, deleteType,
  } = useTypes()

  // UI local
  const [expanded, setExpanded] = useState(() => new Set())
  const [formState, setFormState] = useState({ open: false, mode: "create" }) // "create" | "edit"
  const [openDelete, setOpenDelete] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  if (!canView) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 flex items-center gap-4">
          <Lock className="h-6 w-6 text-rose-600" aria-hidden />
          <div>
            <h3 className="text-lg font-semibold text-rose-800">Acesso negado</h3>
            <p className="text-rose-700">Você não tem permissão para visualizar tipos.</p>
          </div>
        </div>
      </main>
    )
  }

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  // abrir modal de criação
  const openCreate = () => {
    setNewName("")
    if (!newCatId && categoryOptions.length) setNewCatId(categoryOptions[0].id)
    setFormState({ open: true, mode: "create" })
  }

  // abrir modal de edição
  const openEdit = (t) => {
    startEdit(t) // prepara tempName/tempCatId no hook
    setFormState({ open: true, mode: "edit" })
  }

  // fechar modal de form
  const closeForm = () => {
    if (formState.mode === "edit") cancelEdit()
    setFormState({ open: false, mode: "create" })
  }

  // submeter form (create/edit)
  const submitForm = async () => {
    try {
      if (formState.mode === "create") {
        await addType() // o hook já lê newName/newCatId
      } else {
        await saveEdit() // o hook usa tempName/tempCatId
      }
      closeForm()
    } catch (err) {
      console.error("Falha ao salvar o tipo:", err)
    }
  }

  // excluir
  const askDelete = (t) => {
    setDeleteTarget(t)
    setOpenDelete(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteType(deleteTarget.id)
      setOpenDelete(false)
      setDeleteTarget(null)
    } catch (err) {
      console.error("Falha ao excluir o tipo:", err)
    }
  }

  return (
    <main className="min-h-screen space-y-6">
      {/* Header */}
      <header className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shapes className="h-8 w-8 text-indigo-600" aria-hidden />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gerenciar Tipos</h1>
            <p className="text-slate-600 mt-1">
              {isAdmin
                ? "Você pode ver todos os tipos."
                : `Acesso a ${allowedCategoryIds.length} categoria${allowedCategoryIds.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-md text-white px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
          >
            <Plus size={16} /> Novo Tipo
          </button>
        </div>
      </header>

      {/* Busca */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <label className="sr-only" htmlFor="buscar-tipos">Pesquisar tipos</label>
          <input
            id="buscar-tipos"
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            placeholder="Pesquisar tipos ou categorias…"
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </section>

      {/* Tabela */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200  overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-label="Carregando tipos" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-indigo-100">
                  <tr>
                    <th className="px-4 py-3 w-12" />
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {current.map((t, idx) => {
                    const seq = (currentPage - 1) * typesPerPage + idx + 1
                    const isOpen = expanded.has(t.id)
                    const catName = (allCategories.find((c) => c.id === t.catId)?.name) || "—"
                    const canManage = canManageType(t.catId)

                    return (
                      <React.Fragment key={t.id}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleExpand(t.id)}
                              className="p-1.5 rounded-md hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-600"
                              aria-expanded={isOpen}
                              aria-label={isOpen ? "Recolher" : "Expandir"}
                            >
                              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm">{seq}</td>
                          <td className="px-6 py-4 text-sm">{t.name}</td>
                          <td className="px-6 py-4 text-sm">{catName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <div className="inline-flex items-center">
                              <button
                                onClick={() => openEdit(t)}
                                disabled={!canManage}
                                className="p-2 text-indigo-700 hover:bg-indigo-50 rounded-lg disabled:opacity-50"
                                title="Editar" aria-label="Editar"
                              >
                                <Edit className="h-4 w-4" aria-hidden />
                              </button>
                              <button
                                onClick={() => askDelete(t)}
                                disabled={!canManage || deleteLoading === t.id}
                                className="p-2 text-rose-700 hover:bg-rose-50 rounded-lg disabled:opacity-50"
                                title="Excluir" aria-label="Excluir"
                              >
                                {deleteLoading === t.id
                                  ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                  : <Trash2 className="h-4 w-4" aria-hidden />
                                }
                              </button>
                              {!canManage && (
                                <EyeOff className="h-4 w-4 text-slate-400 ml-1" aria-hidden title="Sem permissão" />
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* linha filha (detalhes) */}
                        {isOpen && (
                          <tr className="bg-slate-50">
                            <td />
                            <td colSpan={4} className="px-6 py-4">
                              <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <div className="flex items-center gap-2 text-slate-700 mb-3">
                                  <Info size={16} className="text-indigo-600" />
                                  <span className="text-sm font-medium">Detalhes</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                                    <p className="text-slate-500">ID</p>
                                    <p className="font-semibold text-slate-900">{t.id}</p>
                                  </div>
                                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                                    <p className="text-slate-500">Tipo</p>
                                    <p className="font-semibold text-slate-900">{t.name}</p>
                                  </div>
                                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                                    <p className="text-slate-500">Categoria</p>
                                    <p className="font-semibold text-slate-900">{catName}</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPage={(p) => setCurrentPage(p)}
              />
            )}
          </>
        )}
      </section>

      {/* MODAL: Criar/Editar */}
      <TypeFormModal
        open={formState.open}
        mode={formState.mode}
        name={formState.mode === "create" ? newName : tempName}
        onNameChange={formState.mode === "create" ? setNewName : setTempName}
        catId={formState.mode === "create" ? newCatId : tempCatId}
        onCatChange={formState.mode === "create" ? setNewCatId : setTempCatId}
        categories={categoryOptions}
        onClose={closeForm}
        onConfirm={submitForm}
        loading={formState.mode === "create" ? addLoading : saveLoading}
      />

      {/* MODAL: Excluir */}
      <ConfirmDeleteModal
        open={openDelete}
        onClose={() => { setOpenDelete(false); setDeleteTarget(null) }}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.name || ""}
        loading={deleteLoading === deleteTarget?.id}
      />
    </main>
  )
}
