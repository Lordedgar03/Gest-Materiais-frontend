"use client";

import React from "react";
import {
  Plus,
  XCircle,
  ArrowLeft,
  ArrowRight,
  PackageCheck,
  Trash2,
  Pencil,
  Loader2,
  AlertCircle,
  Search,
  Shield,
  EyeOff,
  Package,
  TrendingDown,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  FilterX,
} from "lucide-react";
import { useMaterials } from "../hooks/useMaterials";

/* ---------- Generic Modal ---------- */
function Modal({ open, title, onClose, children, footer, maxWidth = "max-w-2xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-xl border border-slate-200`}>
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t border-slate-200">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Material Form Modal (Create/Edit) ---------- */
function MaterialFormModal({
  open,
  mode = "create", // "create" | "edit"
  formId = "material-form",
  formData,
  setFormData,
  categories,
  types,
  canManageMaterial,
  onClose,
  onSubmit, // use hook.handleSubmit
  isSubmitting,
  formErrors = {},
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
              Novo material
            </>
          ) : (
            <>
              <Pencil className="h-5 w-5 text-indigo-600" />
              Editar material
            </>
          )}
        </span>
      }
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md border text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isSubmitting}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white ${
              isCreate
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            } disabled:opacity-50`}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isCreate ? (
              <Plus className="h-4 w-4" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            {isCreate ? "Adicionar" : "Salvar"}
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
          <input
            type="text"
            placeholder="Nome do material"
            value={formData.mat_nome || ""}
            onChange={(e) => setFormData({ ...formData, mat_nome: e.target.value })}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${
              formErrors.mat_nome ? "border-rose-500" : "border-slate-300"
            }`}
            required
          />
          {formErrors.mat_nome && (
            <p className="text-rose-600 text-xs mt-1">{formErrors.mat_nome}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
          <select
            value={formData.mat_fk_tipo || ""}
            onChange={(e) => setFormData({ ...formData, mat_fk_tipo: e.target.value })}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${
              formErrors.mat_fk_tipo ? "border-rose-500" : "border-slate-300"
            }`}
            required
          >
            <option value="">Selecione um tipo</option>
            {types.map((t) => (
              <option
                key={t.tipo_id}
                value={t.tipo_id}
                disabled={!canManageMaterial({ mat_fk_tipo: t.tipo_id })}
              >
                {t.tipo_nome} (
                {categories.find((c) => c.cat_id === t.tipo_fk_categoria)?.cat_nome})
              </option>
            ))}
          </select>
          {formErrors.mat_fk_tipo && (
            <p className="text-rose-600 text-xs mt-1">{formErrors.mat_fk_tipo}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Preço (€)</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.mat_preco ?? ""}
            onChange={(e) => setFormData({ ...formData, mat_preco: e.target.value })}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${
              formErrors.mat_preco ? "border-rose-500" : "border-slate-300"
            }`}
          />
          {formErrors.mat_preco && (
            <p className="text-rose-600 text-xs mt-1">{formErrors.mat_preco}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade *</label>
          <input
            type="number"
            placeholder="0"
            value={formData.mat_quantidade_estoque ?? ""}
            onChange={(e) =>
              setFormData({ ...formData, mat_quantidade_estoque: e.target.value })
            }
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${
              formErrors.mat_quantidade_estoque ? "border-rose-500" : "border-slate-300"
            }`}
            required
          />
          {formErrors.mat_quantidade_estoque && (
            <p className="text-rose-600 text-xs mt-1">{formErrors.mat_quantidade_estoque}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estoque mínimo</label>
          <input
            type="number"
            placeholder="3"
            value={formData.mat_estoque_minimo ?? ""}
            onChange={(e) => setFormData({ ...formData, mat_estoque_minimo: e.target.value })}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${
              formErrors.mat_estoque_minimo ? "border-rose-500" : "border-slate-300"
            }`}
          />
          {formErrors.mat_estoque_minimo && (
            <p className="text-rose-600 text-xs mt-1">{formErrors.mat_estoque_minimo}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Localização *</label>
          <input
            type="text"
            placeholder="Localização do armazém"
            value={formData.mat_localizacao || ""}
            onChange={(e) => setFormData({ ...formData, mat_localizacao: e.target.value })}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${
              formErrors.mat_localizacao ? "border-rose-500" : "border-slate-300"
            }`}
            required
          />
          {formErrors.mat_localizacao && (
            <p className="text-rose-600 text-xs mt-1">{formErrors.mat_localizacao}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <textarea
            rows={3}
            placeholder="Descrição do material"
            value={formData.mat_descricao || ""}
            onChange={(e) => setFormData({ ...formData, mat_descricao: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Vendável</label>
          <select
            value={formData.mat_vendavel || "NAO"}
            onChange={(e) => setFormData({ ...formData, mat_vendavel: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="SIM">Sim</option>
            <option value="NAO">Não</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Consumível?</label>
          <select
            value={formData.mat_consumivel || "não"}
            onChange={(e) => setFormData({ ...formData, mat_consumivel: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="não">Não</option>
            <option value="sim">Sim</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Delete Modal (parcial/total) ---------- */
function DeleteModal({
  open,
  onClose,
  onConfirm,
  target,
  mode,
  deleteQty,
  setDeleteQty,
  deleteReason,
  setDeleteReason,
  errors = {},
}) {
  if (!open || !target) return null;
  const estoqueAtual = Number(target.mat_quantidade_estoque) || 0;
  const saldo = Math.max(estoqueAtual - Number(deleteQty || 0), 0);
  const isAll = mode === "all";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          {isAll ? (
            <>
              <XCircle className="h-5 w-5 text-rose-600" /> Apagar tudo — {target.mat_nome}
            </>
          ) : (
            <>
              <Trash2 className="h-5 w-5 text-amber-600" /> Remover unidades — {target.mat_nome}
            </>
          )}
        </span>
      }
      maxWidth="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md border text-slate-700 bg-white hover:bg-slate-50">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white ${
              isAll ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {isAll ? "Apagar tudo" : "Remover unidades"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          Estoque atual: <strong>{estoqueAtual}</strong>
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Quantidade a remover {isAll && "(máx.)"}
          </label>
          <input
            type="number"
            min={1}
            max={estoqueAtual}
            disabled={isAll}
            value={deleteQty}
            onChange={(e) => setDeleteQty(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 ${
              isAll ? "bg-slate-100 cursor-not-allowed" : "focus:ring-amber-500"
            } ${errors.qty ? "border-rose-500" : "border-slate-300"}`}
          />
          {errors.qty && <p className="text-rose-600 text-xs mt-1">{errors.qty}</p>}
          <p className="text-xs text-slate-500 mt-1">
            Saldo ficará: <strong>{saldo}</strong>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Motivo (obrigatório)</label>
          <textarea
            rows={3}
            placeholder={isAll ? "Ex.: Item descontinuado / perda total / inventário" : "Ex.: Danificado / vencido"}
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 ${
              isAll ? "focus:ring-rose-500" : "focus:ring-amber-500"
            } ${errors.reason ? "border-rose-500" : "border-slate-300"}`}
          />
          {errors.reason && <p className="text-rose-600 text-xs mt-1">{errors.reason}</p>}
        </div>

        <div className={`${isAll ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"} p-3 rounded-lg border`}>
          <p className={`${isAll ? "text-rose-700" : "text-amber-700"} text-sm`}>
            {isAll
              ? "Atenção: remove TODO o estoque. Se o saldo chegar a zero, o material será excluído."
              : "Registra uma SAÍDA no histórico com o motivo informado."}
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- small sortable header cell ---------- */
function Th({ label, active, dir, onClick }) {
  return (
    <th
      onClick={onClick}
      className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase cursor-pointer select-none"
      title="Ordenar"
    >
      <span className="inline-flex items-center">
        {label}
        {!active ? (
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 opacity-60" />
        ) : dir === "asc" ? (
          <ChevronUp className="ml-1 h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="ml-1 h-3.5 w-3.5" />
        )}
      </span>
    </th>
  );
}

/* ---------- Page ---------- */
export default function Materials() {
  const {
    // permissões
    isAdmin,
    canView,
    canCreate,
    canManageMaterial,
    allowedCategoryIds,
    allowedTypeIds,

    // dados e estados
    categories,
    types,
    loading,
    error,

    // filtros/paginação
    filterText,
    setFilterText,
    selectedType,
    setSelectedType,
    selectedCategory,
    setSelectedCategory,
    stockFilter,
    setStockFilter,
    consumivelFilter,
    setConsumivelFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    pageMaterials,
    filteredMaterials,

    // form (hook)
    setShowForm,
    formData,
    setFormData,
    formErrors,
    isSubmitting,
    handleSubmit,
    handleEdit,
    resetForm,

    // remoção
    deleteOpen,
    deleteTarget,
    deleteMode,
    deleteQty,
    setDeleteQty,
    deleteReason,
    setDeleteReason,
    deleteErrors,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete,
  } = useMaterials();

  // -------- local UI state (ordenar + form modal) --------
  const [sort, setSort] = React.useState({ key: "mat_nome", dir: "asc" });
  const onSort = (key) => {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };
  const sortedPage = React.useMemo(() => {
    const arr = [...pageMaterials];
    const collator = new Intl.Collator("pt-PT", { numeric: true, sensitivity: "base" });
    const get = (r, k) => {
      if (k === "tipo") return types.find((t) => t.tipo_id === r.mat_fk_tipo)?.tipo_nome ?? "";
      return r[k];
    };
    arr.sort((a, b) => {
      const A = get(a, sort.key);
      const B = get(b, sort.key);
      const isNum = typeof A === "number" || typeof B === "number";
      const cmp = isNum ? Number(A) - Number(B) : collator.compare(String(A ?? ""), String(B ?? ""));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [pageMaterials, sort, types]);

  // modal de form (criar/editar)
  const [formModal, setFormModal] = React.useState({ open: false, mode: "create" }); // "create" | "edit"
  const openCreate = () => {
    resetForm();
    setShowForm(true);
    setFormModal({ open: true, mode: "create" });
  };
  const openEdit = (mat) => {
    handleEdit(mat);
    setShowForm(true);
    setFormModal({ open: true, mode: "edit" });
  };
  const closeForm = () => {
    setShowForm(false);
    resetForm();
    setFormModal({ open: false, mode: "create" });
  };

  // -------- guards --------
  if (!canView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-rose-50 p-6 rounded-xl border border-rose-200 flex items-center gap-3">
          <Shield className="h-6 w-6 text-rose-600" />
          <div>
            <h3 className="font-semibold text-rose-800">Acesso negado</h3>
            <p className="text-rose-700 text-sm">Você não tem permissão para ver materiais.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && filteredMaterials.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <span className="mt-2 text-slate-600">Carregando materiais…</span>
      </div>
    );
  }

  if (error && filteredMaterials.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-rose-600" size={22} />
          <div>
            <h3 className="font-semibold text-rose-800">Erro</h3>
            <p className="text-rose-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // -------- render --------
  return (
    <div className="space-y-6  min-h-screen">
      {/* Header */}
      <div className="rounded-xl p-6 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <PackageCheck className="text-indigo-600" /> Gestão de Materiais
            </h1>
            <p className="text-slate-600 mt-1">
              {isAdmin
                ? "Acesso total a todos os materiais"
                : `Acesso a ${categories.length} categoria(s) e ${types.length} tipo(s)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canCreate && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
              >
                <Plus size={18} />
                Novo material
              </button>
            )}
          </div>
        </div>

        {/* badges de permissão */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!isAdmin ? (
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-2">
              <Shield className="text-indigo-600" size={18} />
              <span className="text-indigo-800 text-sm">
                Acesso a {allowedCategoryIds.length} categoria(s) • {allowedTypeIds.length} tipo(s)
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
              <Shield className="text-emerald-600" size={18} />
              <span className="text-emerald-800 text-sm">Administrador: acesso completo</span>
            </div>
          )}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
            {filteredMaterials.length} material(is) encontrados
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar materiais…"
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat.cat_id} value={cat.cat_id}>
                {cat.cat_nome}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos os tipos</option>
            {types.map((type) => (
              <option key={type.tipo_id} value={type.tipo_id}>
                {type.tipo_nome}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos os estoques</option>
            <option value="low">Estoque baixo</option>
            <option value="normal">Estoque normal</option>
          </select>

          <select
            value={consumivelFilter}
            onChange={(e) => {
              setConsumivelFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos</option>
            <option value="sim">Consumíveis</option>
            <option value="não">Não consumíveis</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setFilterText("");
              setSelectedCategory("");
              setSelectedType("");
              setStockFilter("");
              setConsumivelFilter("");
              setCurrentPage(1);
            }}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
            title="Limpar filtros"
          >
            <FilterX size={16} /> Limpar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center items-center">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : sortedPage.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <Th onClick={() => onSort("mat_id")} active={sort.key === "mat_id"} dir={sort.dir} label="Code" />
                    <Th onClick={() => onSort("mat_nome")} active={sort.key === "mat_nome"} dir={sort.dir} label="Nome" />
                    <Th onClick={() => onSort("mat_preco")} active={sort.key === "mat_preco"} dir={sort.dir} label="Preço" />
                    <Th
                      onClick={() => onSort("mat_quantidade_estoque")}
                      active={sort.key === "mat_quantidade_estoque"}
                      dir={sort.dir}
                      label="Estoque"
                    />
                    <Th
                      onClick={() => onSort("mat_estoque_minimo")}
                      active={sort.key === "mat_estoque_minimo"}
                      dir={sort.dir}
                      label="Mín"
                    />
                    <Th onClick={() => onSort("tipo")} active={sort.key === "tipo"} dir={sort.dir} label="Tipo" />
                    <Th
                      onClick={() => onSort("mat_localizacao")}
                      active={sort.key === "mat_localizacao"}
                      dir={sort.dir}
                      label="Localização"
                    />
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Vendável</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Consumível</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {sortedPage.map((mat) => {
                    const isLowStock =
                      Number(mat.mat_quantidade_estoque) < Number(mat.mat_estoque_minimo);
                    const canManage = canManageMaterial(mat);
                    return (
                      <tr key={mat.mat_id} className={isLowStock ? "bg-rose-50/60" : "hover:bg-slate-50"}>
                        <td className="px-6 py-4 text-sm text-slate-900">{mat.mat_id}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{mat.mat_nome}</div>
                          {mat.mat_descricao && (
                            <div className="text-xs text-slate-500 truncate max-w-xs">{mat.mat_descricao}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">€ {Number(mat.mat_preco).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isLowStock ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isLowStock ? <TrendingDown size={12} className="mr-1" /> : <TrendingUp size={12} className="mr-1" />}
                            {mat.mat_quantidade_estoque}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">{mat.mat_estoque_minimo}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            {types.find((t) => t.tipo_id === mat.mat_fk_tipo)?.tipo_nome || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">{mat.mat_localizacao}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              mat.mat_vendavel === "SIM"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {mat.mat_vendavel === "SIM" ? "Sim" : "Não"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              mat.mat_consumivel === "sim"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {mat.mat_consumivel === "sim" ? "Sim" : "Não"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => openEdit(mat)}
                              disabled={!canManage}
                              className={`p-1.5 rounded ${
                                canManage ? " text-indigo-700 hover:bg-indigo-50" : "text-slate-400 cursor-not-allowed"
                              }`}
                              title="Editar"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => openDeleteModal(mat, "partial")}
                              disabled={!canManage}
                              className={`p-1.5 rounded ${
                                canManage ? "text-amber-700 hover:bg-amber-50" : "text-slate-400 cursor-not-allowed"
                              }`}
                              title="Remover unidades"
                            >
                              Remover
                            </button>
                            <button
                              onClick={() => openDeleteModal(mat, "all")}
                              disabled={!canManage}
                              className={`p-1.5 rounded ${
                                canManage ? "text-rose-700 hover:bg-rose-50" : "text-slate-400 cursor-not-allowed"
                              }`}
                              title="Apagar tudo"
                            >
                              <Trash2 size={16} />
                            </button>
                            {!canManage && <EyeOff size={16} className="text-slate-400" title="Sem permissão" />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-700">
                    Página <span className="font-medium">{currentPage}</span> de{" "}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                  <nav className="inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-2 border rounded-l disabled:opacity-50"
                      title="Anterior"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-2 border rounded-r disabled:opacity-50"
                      title="Próximo"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-10 text-center">
            <Package className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum material encontrado</h3>
            <p className="text-slate-600">
              {filterText || selectedType || selectedCategory || stockFilter || consumivelFilter
                ? "Tente ajustar os filtros de pesquisa."
                : "Comece criando seu primeiro material."}
            </p>
          </div>
        )}
      </div>

      {/* MODAL: Criar/Editar */}
      <MaterialFormModal
        open={formModal.open}
        mode={formModal.mode}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        types={types}
        canManageMaterial={canManageMaterial}
        onClose={closeForm}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        formErrors={formErrors}
      />

      {/* MODAL: Excluir (parcial/total) */}
      <DeleteModal
        open={deleteOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        target={deleteTarget}
        mode={deleteMode}
        deleteQty={deleteQty}
        setDeleteQty={setDeleteQty}
        deleteReason={deleteReason}
        setDeleteReason={setDeleteReason}
        errors={deleteErrors}
      />
    </div>
  );
}
