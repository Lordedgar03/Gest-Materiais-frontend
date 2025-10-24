"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, Trash2, Pencil, Loader2, AlertCircle, Search, Shield,
  TrendingDown, TrendingUp, ChevronUp, ChevronDown, ChevronsUpDown,
  ArrowLeft, ArrowRight, X
} from "lucide-react";
import { useMaterials } from "../hooks/useMaterials";

/* =================== helpers =================== */
const money = (n) =>
  Number(n || 0).toLocaleString("pt-PT", { style: "currency", currency: "STN", minimumFractionDigits: 2 });

/* =================== Toast =================== */
function Toast({ kind = "success", title, desc, onClose }) {
  const base = "pointer-events-auto w-full max-w-sm rounded-xl border shadow-lg p-3 backdrop-blur";
  const styles =
    kind === "error"
      ? "bg-rose-50/90 border-rose-200 text-rose-800"
      : "bg-emerald-50/90 border-emerald-200 text-emerald-800";
  return (
    <div role="status" className={`${base} ${styles}`}>
      <div className="flex gap-2">
        {kind === "error" ? <AlertCircle className="mt-0.5" size={18}/> : <TrendingUp className="mt-0.5" size={18}/>}
        <div className="flex-1">
          <p className="text-sm font-semibold">{title}</p>
          {desc && <p className="text-xs opacity-90">{desc}</p>}
        </div>
        <button onClick={onClose} className="text-sm opacity-70 hover:opacity-100">
          <X size={16}/>
        </button>
      </div>
    </div>
  );
}

function Toasts({ items, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[70] space-y-2">
      {items.map(t => (
        <Toast key={t.id} kind={t.kind} title={t.title} desc={t.desc} onClose={() => remove(t.id)} />
      ))}X
    </div>
  );
}

/* =================== Modal Genérico =================== */
function Modal({ open, title, children, footer, onClose, maxWidth = "max-w-2xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full ${maxWidth} rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-2xl`}>
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Fechar">×</button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t border-slate-200">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/* =================== Form (Criar/Editar) =================== */
function MaterialFormModal({
  open, mode, formId="material-form",
  formData, setFormData, categories, types, canManageMaterial,
  onClose, onSubmit, submitting, errors = {}
}) {
  const isCreate = mode === "create";
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          {isCreate ? <Plus className="text-violet-600" size={18}/> : <Pencil className="text-indigo-600" size={18}/>}
          {isCreate ? "Novo material" : "Editar material"}
        </span>
      }
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md border text-slate-700 bg-white hover:bg-slate-50" disabled={submitting}>
            Cancelar
          </button>
          <button
            type="submit" form={formId} disabled={submitting}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white ${
              isCreate ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : isCreate ? <Plus size={16}/> : <Pencil size={16}/>}
            {isCreate ? "Adicionar" : "Salvar"}
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
          <input
            value={formData.mat_nome || ""} onChange={e=>setFormData({...formData, mat_nome: e.target.value})}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.mat_nome ? "border-rose-500" : "border-slate-300"}`}
            placeholder="Nome do material" required
          />
          {errors.mat_nome && <p className="text-rose-600 text-xs mt-1">{errors.mat_nome}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
          <select
            value={formData.mat_fk_tipo || ""}
            onChange={e=>setFormData({...formData, mat_fk_tipo: e.target.value})}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.mat_fk_tipo ? "border-rose-500" : "border-slate-300"}`}
            required
          >
            <option value="">Selecione…</option>
            {types.map(t=>(
              <option key={t.tipo_id} value={t.tipo_id} disabled={!canManageMaterial({ mat_fk_tipo: t.tipo_id })}>
                {t.tipo_nome} ({categories.find(c=>c.cat_id===t.tipo_fk_categoria)?.cat_nome})
              </option>
            ))}
          </select>
          {errors.mat_fk_tipo && <p className="text-rose-600 text-xs mt-1">{errors.mat_fk_tipo}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Preço</label>
          <input
            type="number" step="0.01" placeholder="0.00"
            value={formData.mat_preco ?? ""} onChange={e=>setFormData({...formData, mat_preco: e.target.value})}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.mat_preco ? "border-rose-500" : "border-slate-300"}`}
          />
          {errors.mat_preco && <p className="text-rose-600 text-xs mt-1">{errors.mat_preco}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade *</label>
          <input
            type="number" placeholder="0"
            value={formData.mat_quantidade_estoque ?? ""} onChange={e=>setFormData({...formData, mat_quantidade_estoque: e.target.value})}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.mat_quantidade_estoque ? "border-rose-500" : "border-slate-300"}`}
            required
          />
          {errors.mat_quantidade_estoque && <p className="text-rose-600 text-xs mt-1">{errors.mat_quantidade_estoque}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estoque mínimo</label>
          <input
            type="number" placeholder="3"
            value={formData.mat_estoque_minimo ?? ""} onChange={e=>setFormData({...formData, mat_estoque_minimo: e.target.value})}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.mat_estoque_minimo ? "border-rose-500" : "border-slate-300"}`}
          />
          {errors.mat_estoque_minimo && <p className="text-rose-600 text-xs mt-1">{errors.mat_estoque_minimo}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Localização *</label>
          <input
            value={formData.mat_localizacao || ""} onChange={e=>setFormData({...formData, mat_localizacao: e.target.value})}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.mat_localizacao ? "border-rose-500" : "border-slate-300"}`}
            placeholder="Ex.: Armazém A, Prateleira 3" required
          />
          {errors.mat_localizacao && <p className="text-rose-600 text-xs mt-1">{errors.mat_localizacao}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <textarea
            rows={3} value={formData.mat_descricao || ""} onChange={e=>setFormData({...formData, mat_descricao: e.target.value})}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            placeholder="Notas e especificações"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Vendável</label>
          <select
            value={formData.mat_vendavel || "NAO"} onChange={e=>setFormData({...formData, mat_vendavel: e.target.value})}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="SIM">Sim</option>
            <option value="NAO">Não</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Consumível?</label>
          <select
            value={formData.mat_consumivel || "não"} onChange={e=>setFormData({...formData, mat_consumivel: e.target.value})}
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

/* =================== Modal Remoção =================== */
function DeleteModal({
  open, onClose, onConfirm,
  target, mode, qty, setQty, reason, setReason, errors = {}
}) {
  if (!open || !target) return null;
  const estoqueAtual = Number(target.mat_quantidade_estoque) || 0;
  const isAll = mode === "all";
  const saldo = Math.max(estoqueAtual - Number(qty || 0), 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-lg"
      title={<span className="inline-flex items-center gap-2">{isAll ? "Apagar tudo" : "Remover unidades"} — {target.mat_nome}</span>}
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md border text-slate-700 bg-white hover:bg-slate-50">Cancelar</button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white ${isAll ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"}`}
          >
            {isAll ? "Apagar tudo" : "Remover"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-700">Em stock: <strong>{estoqueAtual}</strong></p>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade {isAll && "(máx.)"}</label>
          <input
            type="number" min={1} max={estoqueAtual} disabled={isAll}
            value={qty} onChange={(e)=>setQty(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 ${isAll ? "bg-slate-100 cursor-not-allowed" : "focus:ring-amber-500"} ${errors.qty ? "border-rose-500" : "border-slate-300"}`}
          />
          {errors.qty && <p className="text-rose-600 text-xs mt-1">{errors.qty}</p>}
          <p className="text-xs text-slate-500 mt-1">Saldo ficará: <strong>{saldo}</strong></p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Motivo (obrigatório)</label>
          <textarea
            rows={3} value={reason} onChange={(e)=>setReason(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 ${isAll ? "focus:ring-rose-500" : "focus:ring-amber-500"} ${errors.reason ? "border-rose-500" : "border-slate-300"}`}
            placeholder={isAll ? "Ex.: descontinuado / inventário" : "Ex.: danificado / vencido"}
          />
          {errors.reason && <p className="text-rose-600 text-xs mt-1">{errors.reason}</p>}
        </div>
      </div>
    </Modal>
  );
}

/* =================== Th com ordenação =================== */
function Th({ label, active, dir, onClick }) {
  return (
    <th
      onClick={onClick}
      className="px-4 md:px-6 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase cursor-pointer select-none tracking-wide"
      title="Ordenar"
    >
      <span className="inline-flex items-center">
        {label}
        {!active ? <ChevronsUpDown className="ml-1 h-3.5 w-3.5 opacity-60"/> : dir === "asc" ? <ChevronUp className="ml-1 h-3.5 w-3.5"/> : <ChevronDown className="ml-1 h-3.5 w-3.5"/>}
      </span>
    </th>
  );
}

/* =================== Paginação =================== */
function Pagination({ page, pages, onChange }) {
  // cria janela [page-1, page, page+1] com elipses
  const windowPages = useMemo(() => {
    if (pages <= 7) return Array.from({length: pages}, (_,i)=>i+1);
    const set = new Set([1, pages, page, page-1, page+1]);
    const arr = [...set].filter(p=>p>=1 && p<=pages).sort((a,b)=>a-b);
    const out = [];
    for (let i=0;i<arr.length;i++){
      out.push(arr[i]);
      if (i < arr.length-1 && arr[i+1] - arr[i] > 1) out.push("…");
    }
    return out;
  }, [page, pages]);

  return (
    <nav className="inline-flex items-center gap-1" aria-label="Paginação">
      <button
        onClick={()=>onChange(Math.max(1, page-1))}
        disabled={page===1}
        className="px-2 py-2 border rounded-md disabled:opacity-50"
        title="Anterior"
      >
        <ArrowLeft size={16}/>
      </button>
      {windowPages.map((p,i)=>
        p === "…"
          ? <span key={`gap-${i}`} className="px-2 text-slate-500">…</span>
          : <button
              key={p}
              onClick={()=>onChange(p)}
              className={`min-w-[36px] px-2 py-2 border rounded-md text-sm ${
                p===page ? "bg-indigo-600 border-indigo-600 text-white" : "hover:bg-slate-50"
              }`}
              aria-current={p===page ? "page" : undefined}
            >{p}</button>
      )}
      <button
        onClick={()=>onChange(Math.min(pages, page+1))}
        disabled={page===pages}
        className="px-2 py-2 border rounded-md disabled:opacity-50"
        title="Próximo"
      >
        <ArrowRight size={16}/>
      </button>
    </nav>
  );
}

/* =================== Página =================== */
export default function Materials() {
  const {
    // permissões
    isAdmin, canView, canCreate, canManageMaterial,
    allowedCategoryIds, allowedTypeIds,

    // dados/estado
    categories, types, loading, error,

    // filtros/paginação
    filterText, setFilterText,
    selectedType, setSelectedType,
    selectedCategory, setSelectedCategory,
    stockFilter, setStockFilter,
    consumivelFilter, setConsumivelFilter,
    currentPage, setCurrentPage,
    totalPages, pageMaterials, filteredMaterials,

    // form
    setShowForm, formData, setFormData, formErrors, isSubmitting,
    handleSubmit, handleEdit, resetForm,

    // remoção
    deleteOpen, deleteTarget, deleteMode, deleteQty, setDeleteQty,
    deleteReason, setDeleteReason, deleteErrors, openDeleteModal,
    closeDeleteModal, handleConfirmDelete,
  } = useMaterials();

  /* -------- toasts -------- */
  const [toasts, setToasts] = useState([]);
  const pushToast = (kind, title, desc) =>
    setToasts(ts => [...ts, { id: Math.random().toString(36).slice(2), kind, title, desc }]);
  const closeToast = (id) => setToasts(ts => ts.filter(t => t.id !== id));
  useEffect(() => {
    if (error) pushToast("error", "Ocorreu um erro", error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  /* -------- ordenação (apenas na página corrente) -------- */
  const [sort, setSort] = useState({ key: "mat_nome", dir: "asc" });
  const onSort = (key) =>
    setSort(s => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  const sortedPage = useMemo(() => {
    const arr = [...pageMaterials];
    const col = new Intl.Collator("pt-PT", { numeric: true, sensitivity: "base" });
    const get = (r, k) => (k === "tipo" ? (types.find(t => t.tipo_id === r.mat_fk_tipo)?.tipo_nome ?? "") : r[k]);
    arr.sort((a,b)=>{
      const A = get(a, sort.key), B = get(b, sort.key);
      const num = (typeof A === "number") || (typeof B === "number");
      const cmp = num ? Number(A) - Number(B) : col.compare(String(A ?? ""), String(B ?? ""));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [pageMaterials, sort, types]);

  /* -------- modal form -------- */
  const [formModal, setFormModal] = useState({ open:false, mode:"create" });
  const openCreate = () => { resetForm(); setShowForm(true); setFormModal({ open:true, mode:"create" }); };
  const openEdit = (m) => { handleEdit(m); setShowForm(true); setFormModal({ open:true, mode:"edit" }); };
  const closeForm = () => { setShowForm(false); resetForm(); setFormModal({ open:false, mode:"create" }); };

  // wrap submit para toasts
  const onSubmitForm = async (e) => {
    e?.preventDefault?.();
    await handleSubmit(e);
    // supondo sucesso (o hook mostra erro via state se falhar)
    pushToast("success", formModal.mode === "create" ? "Material criado" : "Material atualizado");
    closeForm();
  };

  // wrap delete para toasts
  const onConfirmDelete = async () => {
    await handleConfirmDelete();
    pushToast("success", deleteMode === "all" ? "Material removido" : "Unidades removidas");
  };

  /* -------- guard rails -------- */
  if (!canView) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-rose-50 p-6 rounded-xl border border-rose-200 flex items-center gap-3">
          <Shield className="h-6 w-6 text-rose-600"/>
          <div>
            <h3 className="font-semibold text-rose-800">Acesso negado</h3>
            <p className="text-rose-700 text-sm">Não tem permissão para ver materiais.</p>
          </div>
        </div>
      </div>
    );
  }

  /* -------- número seq. em vez do ID --------
     calculamos o índice global pelo start atual do slice dentro do array filtrado
  ------------------------------------------------ */
  const startIndex = filteredMaterials.indexOf(pageMaterials[0] ?? null);

  /* -------- layout -------- */
  return (
    <div className="space-y-6 min-h-screen">
      <Toasts items={toasts} remove={closeToast}/>

      {/* Header */}
      <div className="rounded-2xl p-6 bg-white/80 backdrop-blur border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Gestão de Materiais</h1>
            <p className="text-slate-600 mt-1">
              {isAdmin ? "Acesso total." : `Acesso a ${categories.length} categoria(s) e ${types.length} tipo(s).`}
            </p>
          </div>
          {canCreate && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            >
              <Plus size={18}/> Novo material
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!isAdmin ? (
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-sm text-indigo-800">
              Acesso a {allowedCategoryIds.length} categoria(s) • {allowedTypeIds.length} tipo(s)
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
              Administrador: acesso completo
            </div>
          )}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
            {filteredMaterials.length} material(is) encontrados
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl p-4 bg-white/80 backdrop-blur border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input
              value={filterText} onChange={e=>{ setFilterText(e.target.value); setCurrentPage(1); }}
              placeholder="Pesquisar materiais…" aria-label="Pesquisar materiais"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedCategory} onChange={e=>{ setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            aria-label="Filtrar por categoria"
          >
            <option value="">Todas as categorias</option>
            {categories.map(c=><option key={c.cat_id} value={c.cat_id}>{c.cat_nome}</option>)}
          </select>

          <select
            value={selectedType} onChange={e=>{ setSelectedType(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            aria-label="Filtrar por tipo"
          >
            <option value="">Todos os tipos</option>
            {types.map(t=><option key={t.tipo_id} value={t.tipo_id}>{t.tipo_nome}</option>)}
          </select>

          <select
            value={stockFilter} onChange={e=>{ setStockFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            aria-label="Filtrar por stock"
          >
            <option value="">Todos os estoques</option>
            <option value="low">Estoque baixo</option>
            <option value="normal">Estoque normal</option>
          </select>

          <select
            value={consumivelFilter} onChange={e=>{ setConsumivelFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            aria-label="Filtrar por consumível"
          >
            <option value="">Todos</option>
            <option value="sim">Consumíveis</option>
            <option value="não">Não consumíveis</option>
          </select>

          <button
            onClick={()=>{
              setFilterText(""); setSelectedCategory(""); setSelectedType("");
              setStockFilter(""); setConsumivelFilter(""); setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* Tabela responsiva */}
      <div className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200 overflow-hidden shadow-sm">
        {loading && filteredMaterials.length === 0 ? (
          <div className="p-10 flex justify-center items-center">
            <Loader2 size={24} className="animate-spin text-indigo-600"/>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="mx-auto text-slate-400 mb-4" size={42}/>
            <h3 className="text-lg font-semibold text-slate-900">Nada encontrado</h3>
            <p className="text-slate-600 mt-1">Ajuste os filtros ou adicione um novo material.</p>
            {canCreate && (
              <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700">
                <Plus size={16}/> Novo material
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <Th label="Nº" active={false} dir="asc" onClick={()=>{}}/>
                    <Th label="Nome" active={sort.key==="mat_nome"} dir={sort.dir} onClick={()=>onSort("mat_nome")}/>
                    <Th label="Preço" active={sort.key==="mat_preco"} dir={sort.dir} onClick={()=>onSort("mat_preco")}/>
                    <Th label="Stock" active={sort.key==="mat_quantidade_estoque"} dir={sort.dir} onClick={()=>onSort("mat_quantidade_estoque")}/>
                    <Th label="Mín" active={sort.key==="mat_estoque_minimo"} dir={sort.dir} onClick={()=>onSort("mat_estoque_minimo")}/>
                    <Th label="Tipo" active={sort.key==="tipo"} dir={sort.dir} onClick={()=>onSort("tipo")}/>
                    <Th label="Localização" active={sort.key==="mat_localizacao"} dir={sort.dir} onClick={()=>onSort("mat_localizacao")}/>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase">Vendável</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase">Consumível</th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold text-slate-600 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {sortedPage.map((m, idx) => {
                    const seq = (startIndex >= 0 ? startIndex : (currentPage-1)*sortedPage.length) + idx + 1;
                    const low = Number(m.mat_quantidade_estoque) < Number(m.mat_estoque_minimo);
                    const can = canManageMaterial(m);
                    const tipo = types.find(t=>t.tipo_id===m.mat_fk_tipo)?.tipo_nome || "-";
                    return (
                      <tr key={m.mat_id} className={low ? "bg-rose-50/50" : "hover:bg-slate-50"}>
                        <td className="px-4 md:px-6 py-4 text-sm text-slate-900">{seq}</td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="font-medium text-slate-900">{m.mat_nome}</div>
                          {!!m.mat_descricao && <div className="text-xs text-slate-500 truncate max-w-xs">{m.mat_descricao}</div>}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm">{money(m.mat_preco)}</td>
                        <td className="px-4 md:px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${low ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {low ? <TrendingDown size={12} className="mr-1"/> : <TrendingUp size={12} className="mr-1"/>}
                            {m.mat_quantidade_estoque}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm">{m.mat_estoque_minimo}</td>
                        <td className="px-4 md:px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">{tipo}</span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm">{m.mat_localizacao}</td>
                        <td className="px-4 md:px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${m.mat_vendavel==="SIM" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}`}>
                            {m.mat_vendavel==="SIM" ? "Sim" : "Não"}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${m.mat_consumivel==="sim" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"}`}>
                            {m.mat_consumivel==="sim" ? "Sim" : "Não"}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={()=>openEdit(m)} disabled={!can}
                              className={`px-2 py-1 rounded ${can ? "text-indigo-700 hover:bg-indigo-50" : "text-slate-400 cursor-not-allowed"}`}
                              title="Editar"
                            >
                              <Pencil size={16}/>
                            </button>
                            <button
                              onClick={()=>openDeleteModal(m, "partial")} disabled={!can}
                              className={`px-2 py-1 rounded ${can ? "text-amber-700 hover:bg-amber-50" : "text-slate-400 cursor-not-allowed"}`}
                              title="Remover unidades"
                            >
                              Remover
                            </button>
                            <button
                              onClick={()=>openDeleteModal(m, "all")} disabled={!can}
                              className={`px-2 py-1 rounded ${can ? "text-rose-700 hover:bg-rose-50" : "text-slate-400 cursor-not-allowed"}`}
                              title="Apagar tudo"
                            >
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile (cards compactos) */}
            <div className="md:hidden grid gap-3 p-3">
              {sortedPage.map((m, idx) => {
                const seq = (startIndex >= 0 ? startIndex : (currentPage-1)*sortedPage.length) + idx + 1;
                const low = Number(m.mat_quantidade_estoque) < Number(m.mat_estoque_minimo);
                const can = canManageMaterial(m);
                const tipo = types.find(t=>t.tipo_id===m.mat_fk_tipo)?.tipo_nome || "-";
                return (
                  <div key={m.mat_id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{seq}</span>
                      <div className="inline-flex items-center gap-1">
                        <button onClick={()=>openEdit(m)} disabled={!can} className={`p-2 rounded ${can ? "text-indigo-700 hover:bg-indigo-50" : "text-slate-400"}`} aria-label="Editar">
                          <Pencil size={16}/>
                        </button>
                        <button onClick={()=>openDeleteModal(m, "partial")} disabled={!can} className={`p-2 rounded ${can ? "text-amber-700 hover:bg-amber-50" : "text-slate-400"}`} aria-label="Remover unidades">
                          Remover
                        </button>
                        <button onClick={()=>openDeleteModal(m, "all")} disabled={!can} className={`p-2 rounded ${can ? "text-rose-700 hover:bg-rose-50" : "text-slate-400"}`} aria-label="Apagar tudo">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                    <div className="mt-1">
                      <div className="text-base font-semibold text-slate-900">{m.mat_nome}</div>
                      {!!m.mat_descricao && <div className="text-xs text-slate-600">{m.mat_descricao}</div>}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-500">Tipo</div><div className="text-slate-900">{tipo}</div>
                      <div className="text-slate-500">Preço</div><div className="text-slate-900">{money(m.mat_preco)}</div>
                      <div className="text-slate-500">Local</div><div className="text-slate-900">{m.mat_localizacao}</div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${low ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {low ? <TrendingDown size={12} className="mr-1"/> : <TrendingUp size={12} className="mr-1"/>}
                        {m.mat_quantidade_estoque} (min {m.mat_estoque_minimo})
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${m.mat_vendavel==="SIM" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}`}>
                        {m.mat_vendavel==="SIM" ? "Vendável" : "Não vendável"}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${m.mat_consumivel==="sim" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"}`}>
                        {m.mat_consumivel==="sim" ? "Consumível" : "Não consumível"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                <p className="hidden md:block text-sm text-slate-700">
                  Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
                </p>
                <Pagination page={currentPage} pages={totalPages} onChange={setCurrentPage}/>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modais */}
      <MaterialFormModal
        open={formModal.open}
        mode={formModal.mode}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        types={types}
        canManageMaterial={canManageMaterial}
        onClose={closeForm}
        onSubmit={onSubmitForm}
        submitting={isSubmitting}
        errors={formErrors}
      />

      <DeleteModal
        open={deleteOpen}
        onClose={closeDeleteModal}
        onConfirm={onConfirmDelete}
        target={deleteTarget}
        mode={deleteMode}
        qty={deleteQty}
        setQty={setDeleteQty}
        reason={deleteReason}
        setReason={setDeleteReason}
        errors={deleteErrors}
      />
    </div>
  );
}
