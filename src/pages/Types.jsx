"use client";

import React, { useMemo, useState } from "react";
import {
  Shapes,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Loader2,
  EyeOff,
  Lock,
  ChevronLeft,
  ChevronRight,
  Info,
  TriangleAlert,
} from "lucide-react";
import { useTypes } from "../hooks/useTypes";

/* ===================== Modal genérico ===================== */
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white backdrop-blur border border-slate-200 shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

/* ===================== Modal de confirmação ===================== */
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
        Tem certeza que deseja excluir{" "}
        <span className="font-semibold">{itemName}</span>? Esta ação não pode ser desfeita.
      </p>
    </Modal>
  );
}

/* ===================== Modal do Form (Criar/Editar) ===================== */
function TypeFormModal({
  open,
  mode = "create",
  name,
  onNameChange,
  catId,
  onCatChange,
  categories,
  onClose,
  onConfirm,
  loading,
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
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isCreate ? (
              <Plus className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
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
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}

/* ===================== Componente de Paginação ===================== */
function Pagination({ currentPage, totalPages, onPage }) {
  const range = useMemo(() => {
    // janela pequena com elipses: 1 … (p-1) p (p+1) … N
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const res = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);
    if (left > 2) res.push("…");
    for (let i = left; i <= right; i++) res.push(i);
    if (right < totalPages - 1) res.push("…");
    res.push(totalPages);
    return res;
  }, [currentPage, totalPages]);

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white">
      <div className="text-xs text-slate-500">
        Página <span className="font-semibold">{currentPage}</span> de{" "}
        <span className="font-semibold">{totalPages}</span>
      </div>
      <div className="inline-flex items-center gap-1">
        <button
          onClick={() => canPrev && onPage(currentPage - 1)}
          disabled={!canPrev}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {range.map((p, i) =>
          p === "…" ? (
            <span key={`${p}-${i}`} className="px-2 text-slate-400 select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`min-w-[36px] px-3 py-1.5 rounded-md text-sm ${
                p === currentPage
                  ? "bg-indigo-600 text-white"
                  : "border bg-white text-slate-700 hover:bg-slate-50"
              }`}
              aria-current={p === currentPage ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => canNext && onPage(currentPage + 1)}
          disabled={!canNext}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
          aria-label="Próxima página"
        >
          <span className="hidden sm:inline">Seguinte</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ===================== Página ===================== */
export default function TypesPage() {
  const {
    // permissões
    isAdmin,
    allowedCategoryIds,
    canView,
    canManageType,
    // dados
    allCategories,
    categoryOptions,
    current,
    // estado criação/edição
    newName,
    setNewName,
    newCatId,
    setNewCatId,
    tempName,
    setTempName,
    tempCatId,
    setTempCatId,
    // loadings
    loading,
    addLoading,
    saveLoading,
    deleteLoading,
    // filtro/paginação
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    typesPerPage,
    // ações
    addType,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteType,
  } = useTypes();

  const [formState, setFormState] = useState({ open: false, mode: "create" });
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (!canView) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-5 py-4 flex items-start gap-3 max-w-lg">
          <Lock className="h-5 w-5 mt-0.5 text-rose-600" aria-hidden />
          <div>
            <h3 className="text-base font-semibold text-rose-800">Acesso negado</h3>
            <p className="text-sm text-rose-700">
              Não tem permissão para visualizar os tipos.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // abrir modal de criação
  const openCreate = () => {
    setNewName("");
    if (!newCatId && categoryOptions.length) setNewCatId(categoryOptions[0].id);
    setFormState({ open: true, mode: "create" });
  };

  // abrir modal de edição
  const openEdit = (t) => {
    startEdit(t);
    setFormState({ open: true, mode: "edit" });
  };

  const closeForm = () => {
    if (formState.mode === "edit") cancelEdit();
    setFormState({ open: false, mode: "create" });
  };

  const submitForm = async () => {
    try {
      if (formState.mode === "create") {
        await addType();
      } else {
        await saveEdit();
      }
      closeForm();
    } catch (err) {
      console.error("Falha ao salvar o tipo:", err);
    }
  };

  const askDelete = (t) => {
    setDeleteTarget(t);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteType(deleteTarget.id);
      setOpenDelete(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Falha ao excluir o tipo:", err);
    }
  };

  const EmptyState = (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 grid place-items-center mb-3">
        <Info size={20} />
      </div>
      <h3 className="text-slate-900 font-semibold">Sem resultados</h3>
      <p className="text-slate-600 text-sm mt-1">
        Tente um termo diferente, ou crie um novo tipo.
      </p>
      <button
        onClick={openCreate}
        className="mt-4 inline-flex items-center gap-2 rounded-md text-white px-4 py-2 bg-indigo-600 hover:bg-indigo-700"
      >
        <Plus size={16} />
        Novo Tipo
      </button>
    </div>
  );

  return (
    <main className="min-h-screen space-y-6">
      {/* Cabeçalho */}
      <header className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 grid place-items-center">
              <Shapes className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Tipos</h1>
              <p className="text-slate-600 text-sm mt-0.5">
                {isAdmin
                  ? "Pode ver e gerir todos os tipos."
                  : `Acesso a ${allowedCategoryIds.length} categoria${
                      allowedCategoryIds.length !== 1 ? "s" : ""
                    }.`}
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
        </div>
      </header>

      {/* Filtros */}
      <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <label className="sr-only" htmlFor="buscar-tipos">
            Pesquisar tipos
          </label>
          <input
            id="buscar-tipos"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Pesquisar tipos ou categorias…"
            className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </section>

      {/* Lista */}
      <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-label="A carregar" />
          </div>
        ) : current.length === 0 ? (
          EmptyState
        ) : (
          <>
            {/* Tabela desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-indigo-50/70">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Nº
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {current.map((t, idx) => {
                    const seq = (currentPage - 1) * typesPerPage + idx + 1;
                    const catName = allCategories.find((c) => c.id === t.catId)?.name || "—";
                    const canManage = canManageType(t.catId);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-700">{seq}</td>
                        <td className="px-6 py-4 text-sm text-slate-900">{t.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{catName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center">
                            <button
                              onClick={() => openEdit(t)}
                              disabled={!canManage}
                              className="p-2 text-indigo-700 hover:bg-indigo-50 rounded-lg disabled:opacity-50"
                              title="Editar"
                              aria-label="Editar"
                            >
                              <Edit className="h-4 w-4" aria-hidden />
                            </button>
                            <button
                              onClick={() => askDelete(t)}
                              disabled={!canManage || deleteLoading === t.id}
                              className="p-2 text-rose-700 hover:bg-rose-50 rounded-lg disabled:opacity-50"
                              title="Excluir"
                              aria-label="Excluir"
                            >
                              {deleteLoading === t.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              ) : (
                                <Trash2 className="h-4 w-4" aria-hidden />
                              )}
                            </button>
                            {!canManage && (
                              <EyeOff
                                className="h-4 w-4 text-slate-400 ml-1"
                                aria-hidden
                                title="Sem permissão"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards mobile */}
            <div className="grid gap-3 p-3 md:hidden">
              {current.map((t, idx) => {
                const seq = (currentPage - 1) * typesPerPage + idx + 1;
                const catName = allCategories.find((c) => c.id === t.catId)?.name || "—";
                const canManage = canManageType(t.catId);

                return (
                  <div
                    key={t.id}
                    className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">#{seq}</div>
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          disabled={!canManage}
                          className="p-2 text-indigo-700 hover:bg-indigo-50 rounded-lg disabled:opacity-50"
                          title="Editar"
                          aria-label="Editar"
                        >
                          <Edit className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          onClick={() => askDelete(t)}
                          disabled={!canManage || deleteLoading === t.id}
                          className="p-2 text-rose-700 hover:bg-rose-50 rounded-lg disabled:opacity-50"
                          title="Excluir"
                          aria-label="Excluir"
                        >
                          {deleteLoading === t.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            <Trash2 className="h-4 w-4" aria-hidden />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mt-1">
                      <div className="text-base font-semibold text-slate-900">{t.name}</div>
                      <div className="text-sm text-slate-600">{catName}</div>
                    </div>
                    {!canManage && (
                      <div className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                        <EyeOff size={14} />
                        Sem permissão para gerir
                      </div>
                    )}
                  </div>
                );
              })}
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

      {/* Modal Criar/Editar */}
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

      {/* Modal Excluir */}
      <ConfirmDeleteModal
        open={openDelete}
        onClose={() => {
          setOpenDelete(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.name || ""}
        loading={deleteLoading === deleteTarget?.id}
      />
    </main>
  );
}
