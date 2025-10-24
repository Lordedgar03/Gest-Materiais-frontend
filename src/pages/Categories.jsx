"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  FolderPlus, Edit, Trash2, Save, X, Search, Shield, Loader2, Plus,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertCircle,
  CheckCircle, Folder, Lock, Info, TriangleAlert, MoreHorizontal
} from "lucide-react";
import { useCategories } from "../hooks/useCategories";

/* -------------------- Helpers -------------------- */
function useDebouncedValue(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

/* -------------------- UI Primitives -------------------- */
function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`} >
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle, icon: Icon, right }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border-b border-slate-200">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="p-2 rounded-lg bg-violet-100">
            <Icon className="h-6 w-6 text-violet-600" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function Toolbar({ left, right }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
      {left}
      {right}
    </div>
  );
}

function Input({ leadingIcon: Leading, ...props }) {
  return (
    <div className="relative">
      {Leading && (
        <Leading className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      )}
      <input
        {...props}
        className={`w-full rounded-lg border border-slate-300 bg-white px-9 py-2 text-sm outline-none 
        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400`}
      />
    </div>
  );
}

/* -------------------- Generic Modal -------------------- */
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
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
  );
}

/* -------------------- Form Modal (Create/Edit) -------------------- */
function CategoryFormModal({
  open,
  mode = "create", // "create" | "edit"
  value,
  onChange,
  onClose,
  onConfirm,
  loading
}) {
  const isCreate = mode === "create";
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
  );
}

/* -------------------- Confirm Delete Modal -------------------- */
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
  );
}

/* -------------------- Pagination -------------------- */
function Pagination({ currentPage, totalPages, onPage }) {
  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const p = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);
    if (left > 2) p.push("…");
    for (let i = left; i <= right; i++) p.push(i);
    if (right < totalPages - 1) p.push("…");
    p.push(totalPages);
    return p;
  }, [currentPage, totalPages]);

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6 rounded-b-xl">
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
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginação">
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
  );
}

/* -------------------- Row (compacta, com detalhe expansível) -------------------- */
function CategoryRow({
  cat,
  seq,
  isOpen,
  toggleOpen,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  deleteLoading,
  isAdmin,
  allowedCategoryIds
}) {
  const slug = cat.name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-");

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors">
       
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
          <div className="inline-flex items-center gap-1">
            {canEdit && (
              <button
                onClick={() => onEdit(cat)}
                className="text-indigo-700 hover:text-indigo-900 p-2 rounded-md hover:bg-indigo-50"
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(cat)}
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

 
    </>
  );
}

/* -------------------- Page -------------------- */
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
  } = useCategories();

  const [formState, setFormState] = useState({ open: false, mode: "create" }); // "create" | "edit"
  const [expanded, setExpanded] = useState(() => new Set());
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    // quando o valor debounced muda, aplicamos a paginação para 1
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const openCreate = () => {
    setNewName("");
    setFormState({ open: true, mode: "create" });
  };

  const openEdit = (cat) => {
    startEdit(cat);
    setFormState({ open: true, mode: "edit" });
  };

  const closeForm = () => {
    if (formState.mode === "edit") cancelEdit();
    setFormState({ open: false, mode: "create" });
  };

  const submitForm = async () => {
    try {
      if (formState.mode === "create") {
        if (!newName.trim()) return;
        await addCategory(newName);
      } else {
        if (!tempName.trim()) return;
        await saveEdit();
      }
      closeForm();
    } catch (err) {
      console.error("Falha ao submeter formulário de categoria:", err);
    }
  };

  const askDelete = (cat) => {
    setDeleteTarget(cat);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      setOpenDelete(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Falha ao deletar categoria:", err);
    }
  };

  if (!canViewCategories) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-xl w-full">
          <CardHeader
            title="Acesso negado"
            subtitle="Você não tem permissão para visualizar categorias."
            icon={Lock}
          />
          <div className="p-6">
            <div className="flex items-center gap-3 text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">Fale com um administrador para solicitar acesso.</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      {/* Header */}
      <Card>
        <CardHeader
          title="Gerenciamento de Categorias"
          subtitle={
            isAdmin
              ? "Gerencie todas as categorias do sistema."
              : `Você tem acesso a ${allowedCategoryIds.length} categoria${allowedCategoryIds.length !== 1 ? "s" : ""}.`
          }
          icon={Folder}
          right={
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
          }
        />
        <Toolbar
          left={
            <div className="w-full sm:w-96">
              <Input
                leadingIcon={Search}
                placeholder="Pesquisar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          }
          right={
            <div className="text-sm text-slate-600 px-2">
              {filteredCategories.length} resultado{filteredCategories.length !== 1 ? "s" : ""}
            </div>
          }
        />
      </Card>

      {/* Lista */}
      <Card>
        <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Lista de Categorias</h3>
            <p className="text-sm text-slate-600 mt-1">
              Registos organizados por ordem de criação.
            </p>
          </div>

          {!isAdmin && allowedCategoryIds.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
              <AlertCircle className="h-4 w-4" />
              Acesso limitado
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-14">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              {filteredCategories.length > 0 ? (
                <>
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16">Nº</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nome da Categoria</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {currentCategories.map((cat, index) => {
                        const seq = (currentPage - 1) * categoriesPerPage + index + 1;
                        const isOpen = expanded.has(cat.id);
                        return (
                          <CategoryRow
                            key={cat.id}
                            cat={cat}
                            seq={seq}
                            isOpen={isOpen}
                            toggleOpen={toggleExpand}
                            canEdit={canEditCategory}
                            canDelete={canDeleteCategory}
                            onEdit={openEdit}
                            onDelete={askDelete}
                            deleteLoading={deleteLoading}
                            isAdmin={isAdmin}
                            allowedCategoryIds={allowedCategoryIds}
                          />
                        );
                      })}
                    </tbody>
                  </table>

                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPage={(p) => setCurrentPage(p)}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-14">
                  <Folder className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-900">
                    {searchTerm ? "Nenhuma categoria encontrada" : "Nenhuma categoria disponível"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {searchTerm
                      ? "Tente ajustar o termo de pesquisa."
                      : isAdmin
                        ? "Comece criando uma nova categoria."
                        : "Você não tem acesso a nenhuma categoria."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

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
        onClose={() => { setOpenDelete(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.name || ""}
        loading={deleteLoading === deleteTarget?.id}
      />
    </div>
  );
}
