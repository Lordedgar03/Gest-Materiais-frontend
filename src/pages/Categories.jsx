"use client"

import React, { useMemo, useState } from "react"
import {
  FolderPlus, Edit, Trash2, Save, X, Search, Shield, Loader2, Plus,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertCircle,
  CheckCircle, Folder, Lock, Info, TriangleAlert
} from "lucide-react"
import { useCategories } from "../hooks/useCategories"

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

/* ---------- Form Modal (Create/Edit) ---------- */
function CategoryFormModal({
  open,
  mode = "create", // "create" | "edit"
  value,
  onChange,
  onClose,
  onConfirm,
  loading
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
              <FolderPlus className="h-5 w-5 text-violet-600" />
              Nova Categoria
            </>
          ) : (
            <>
              <Edit className="h-5 w-5 text-indigo-600" />
              Editar Categoria
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
            disabled={loading || !value.trim()}
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
      <label className="block text-sm font-medium text-slate-700 mb-1">Nome da categoria</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Ex.: Informática"
        autoFocus
        required
      />
    </Modal>
  )
}

/* ---------- Danger / Confirm Delete Modal ---------- */
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

/* ---------- Pagination ---------- */
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
export default function CategoriesPage() {
  const {
    // perms / header
    isAdmin, allowedCategoryIds,
    canViewCategories, canCreateCategory, canEditCategory, canDeleteCategory,

    // dados/estado (do hook)
    newName, setNewName,
    tempName, setTempName,
    loading, deleteLoading, saveLoading, addLoading,

    // filtro/paginação
    searchTerm, setSearchTerm,
    currentPage, setCurrentPage,
    categoriesPerPage, totalPages,
    filteredCategories, currentCategories,

    // ações (do hook)
    startEdit, cancelEdit, saveEdit,
    addCategory, deleteCategory,
  } = useCategories()

  const [formState, setFormState] = useState({ open: false, mode: "create" }) // "create" | "edit"
  const [expanded, setExpanded] = useState(() => new Set())
  const [openDelete, setOpenDelete] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const openCreate = () => {
    setNewName("")
    setFormState({ open: true, mode: "create" })
  }

  const openEdit = (cat) => {
    startEdit(cat)
    setFormState({ open: true, mode: "edit" })
  }

  const closeForm = () => {
    if (formState.mode === "edit") cancelEdit()
    setFormState({ open: false, mode: "create" })
  }

  const submitForm = async () => {
    try {
      if (formState.mode === "create") {
        if (!newName.trim()) return
        await addCategory(newName)
      } else {
        if (!tempName.trim()) return
        await saveEdit()
      }
      closeForm()
    } catch (err) {
      console.error("Falha ao submeter formulário de categoria:", err)
    }
  }

  const askDelete = (cat) => {
    setDeleteTarget(cat)
    setOpenDelete(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCategory(deleteTarget.id)
      setOpenDelete(false)
      setDeleteTarget(null)
    } catch (err) {
      console.error("Falha ao deletar categoria:", err)
    }
  }

  if (!canViewCategories) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto p-6">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 flex items-center gap-4">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Lock className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-rose-800">Acesso Negado</h3>
              <p className="text-rose-700 mt-1">Você não tem permissão para visualizar categorias.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen mx-auto">
      <div className="container-linear  space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <Folder className="h-8 w-8 text-violet-600" />
                </div>
                Gerenciamento de Categorias
              </h1>
              <p className="text-slate-600 mt-2">
                {isAdmin
                  ? "Gerencie todas as categorias do sistema"
                  : `Você tem acesso a ${allowedCategoryIds.length} categoria${allowedCategoryIds.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  Administrador
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  {allowedCategoryIds.length} Categoria{allowedCategoryIds.length !== 1 ? "s" : ""}
                </div>
              )}

              {canCreateCategory && (
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-md text-white px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                >
                  <Plus size={16} /> Nova Categoria
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              placeholder="Pesquisar categorias..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Lista de Categorias</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {filteredCategories.length} categoria{filteredCategories.length !== 1 ? "s" : ""} encontrada
                  {filteredCategories.length !== 1 ? "s" : ""}
                </p>
              </div>

              {!isAdmin && allowedCategoryIds.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                  <AlertCircle className="h-4 w-4" />
                  Acesso limitado
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-12"></th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nome da Categoria</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {currentCategories.map((cat, index) => {
                      const seq = (currentPage - 1) * categoriesPerPage + index + 1
                      const isOpen = expanded.has(cat.id)
                      const slug = cat.name
                        .toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9\s-]/g, "")
                        .trim().replace(/\s+/g, "-")

                      return (
                        <React.Fragment key={cat.id}>
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <button
                                onClick={() => toggleExpand(cat.id)}
                                className="p-1.5 rounded-md hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-600"
                                aria-expanded={isOpen}
                                aria-label={isOpen ? "Recolher" : "Expandir"}
                              >
                                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                                {seq}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <Folder className="h-5 w-5 text-violet-500" />
                                <span className="text-sm font-medium text-slate-900">{cat.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                {canEditCategory && (
                                  <button
                                    onClick={() => openEdit(cat)}
                                    className="text-indigo-700 hover:text-indigo-900 p-2 rounded-md hover:bg-indigo-50"
                                    title="Editar"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                )}
                                {canDeleteCategory && (
                                  <button
                                    onClick={() => askDelete(cat)}
                                    disabled={deleteLoading === cat.id}
                                    className="text-rose-700 hover:text-rose-900 p-2 rounded-md hover:bg-rose-50 disabled:opacity-50"
                                    title="Excluir"
                                  >
                                    {deleteLoading === cat.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* linha filha (detalhes) — sem ações duplicadas */}
                          {isOpen && (
                            <tr className="bg-slate-50">
                              <td />
                              <td colSpan={3} className="px-6 py-4">
                                <div className="rounded-lg border border-slate-200 bg-white p-4">
                                  <div className="flex items-center gap-2 text-slate-700 mb-3">
                                    <Info size={16} className="text-indigo-600" />
                                    <span className="text-sm font-medium">Detalhes da Categoria</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                    <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                                      <p className="text-slate-500">ID</p>
                                      <p className="font-semibold text-slate-900">{cat.id}</p>
                                    </div>
                                    <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                                      <p className="text-slate-500">Slug</p>
                                      <p className="font-semibold text-slate-900">{slug || "—"}</p>
                                    </div>
                                    <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                                      <p className="text-slate-500">Acesso</p>
                                      <p className="font-semibold text-slate-900">
                                        {isAdmin || allowedCategoryIds.includes(cat.id) ? "Concedido" : "Limitado"}
                                      </p>
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

                {/* Paginação */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPage={(p) => setCurrentPage(p)}
                  />
                )}

                {/* Vazio */}
                {filteredCategories.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <Folder className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">
                      {searchTerm ? "Nenhuma categoria encontrada" : "Nenhuma categoria disponível"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {searchTerm
                        ? "Tente ajustar os termos de busca."
                        : isAdmin
                          ? "Comece criando uma nova categoria."
                          : "Você não tem acesso a nenhuma categoria."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL (Create/Edit) */}
      <CategoryFormModal
        open={formState.open}
        mode={formState.mode}
        value={formState.mode === "create" ? newName : tempName}
        onChange={formState.mode === "create" ? setNewName : setTempName}
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
    </div>
  )
}
