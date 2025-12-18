"use client";

import React, { useMemo, useState } from "react";
import {
  FileText,
  PlusCircle,
  AlertCircle,
  Search,
  PackagePlus,
  CheckCircle,
  XCircle,
  Trash2,
  Undo2,
  X,
  Eye,
  MoreHorizontal,
  ChevronDown,
  Clock,
  User,
  Package,
  TrendingUp,
  Filter,
} from "lucide-react";
import { useRequisicao, statusColors } from "../hooks/useRequisicao";

function parseDateSafe(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function Modal({ open, title, onClose, children, footer, maxWidth = "max-w-4xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full ${maxWidth} rounded-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-gray-600/50`}>
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-600/50">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-2 ring-indigo-500 transition-colors"
              aria-label="Fechar modal"
            >
              <X size={20} aria-hidden className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <div className="p-6">{children}</div>
          {footer && <div className="p-6 border-t border-gray-200/50 dark:border-gray-600/50">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

function StatusChip({ status }) {
  const baseColors = {
    Pendente: "bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-800/80 dark:to-amber-800/80 text-yellow-800 dark:text-yellow-100 border-yellow-200 dark:border-yellow-600/50",
    Aprovada: "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-800/80 dark:to-emerald-800/80 text-green-800 dark:text-green-100 border-green-200 dark:border-green-600/50",
    Rejeitada: "bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-800/80 dark:to-rose-800/80 text-red-800 dark:text-red-100 border-red-200 dark:border-red-600/50",
    Cancelada: "bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-700/80 dark:to-slate-700/80 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-500/50",
    Parcial: "bg-gradient-to-r from-blue-100 to-sky-100 dark:from-blue-800/80 dark:to-sky-800/80 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-600/50",
    "Em Uso": "bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-800/80 dark:to-purple-800/80 text-indigo-800 dark:text-indigo-100 border-indigo-200 dark:border-indigo-600/50",
    Atendida: "bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-800/80 dark:to-teal-800/80 text-emerald-800 dark:text-emerald-100 border-emerald-200 dark:border-emerald-600/50",
    Devolvida: "bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-800/80 dark:to-cyan-800/80 text-teal-800 dark:text-teal-100 border-teal-200 dark:border-teal-600/50",
  };
  
  const cls = baseColors[status] || "bg-gray-100 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-500/50";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cls} shadow-sm`} aria-label={`Status: ${status}`}>
      {status}
    </span>
  );
}

function ReqCard({
  req,
  currentUser,
  materialNome,
  canOperateReq,
  canDecideReq,
  openView,
  openDecision,
  openAtender,
  openDevolver,
  openDelete,
  solicitanteNome,
  solicitanteId,
  isAdmin,
  isConsumivel,
}) {
  const codigo = req.req_codigo ?? req.codigo ?? `#${req.req_id ?? "?"}`;
  const itensCount = Array.isArray(req.itens) ? req.itens.length : 0;

  const mayOperate = canOperateReq(req);
  const mayDecide = canDecideReq(req);

  const status = String(req.req_status || "").trim();
  const isRejectedOrCanceled = status === "Rejeitada" || status === "Cancelada";

  const statusAllowsApproveFlow = status === "Pendente";
  const statusAllowsServe = ["Aprovada", "Parcial", "Em Uso"].includes(status);
  const statusAllowsReturn = ["Em Uso", "Parcial", "Atendida"].includes(status);

  const ownerId = Number(req.req_fk_user ?? req.user_id ?? 0);
  const isOwner = ownerId && Number(ownerId) === Number(currentUser.id);

  const firstItem = Array.isArray(req.itens) && req.itens.length ? req.itens[0] : null;

  let restante = 0;
  let emUso = 0;
  if (firstItem) {
    restante = Number(firstItem.rqi_quantidade || 0) - Number(firstItem.rqi_qtd_atendida || 0);
    emUso = Number(firstItem.rqi_qtd_atendida || 0) - Number(firstItem.rqi_qtd_devolvida || 0);
  }

  const canApprove = isAdmin && !isRejectedOrCanceled && statusAllowsApproveFlow && mayDecide;
  const canReject  = isAdmin && !isRejectedOrCanceled && statusAllowsApproveFlow && mayDecide;
  const canCancel  = !isRejectedOrCanceled && statusAllowsApproveFlow && mayDecide;

  const canAtender  = !isRejectedOrCanceled && statusAllowsServe  && restante > 0 && mayOperate;

  // Fix: Check if isConsumivel is a function before calling it
  const firstIsConsumivel = !!(firstItem && typeof isConsumivel === 'function' && isConsumivel(firstItem.rqi_fk_material));
  const canDevolver = !isRejectedOrCanceled && statusAllowsReturn && emUso > 0 && mayOperate && !!firstItem && !firstIsConsumivel;

  const canDeleteBtn = isOwner || mayDecide;

  const actions = [
    { key: "view", label: "Ver", icon: Eye, onClick: () => openView(req),
      style: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg", show: true },
    { key: "approve", label: "Aprovar", icon: CheckCircle, onClick: () => openDecision(req, "Aprovar"),
      style: "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg", show: canApprove },
    { key: "reject", label: "Rejeitar", icon: XCircle, onClick: () => openDecision(req, "Rejeitar"),
      style: "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-lg", show: canReject },
    { key: "cancel", label: "Cancelar", icon: X, onClick: () => openDecision(req, "Cancelar"),
      style: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg", show: canCancel },
    { key: "serve1", label: "Atender", icon: CheckCircle, onClick: () => openAtender(req, firstItem),
      style: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg", show: canAtender && !!firstItem },
    { key: "return1", label: "Devolver", icon: Undo2, onClick: () => openDevolver(req, firstItem),
      style: "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg", show: canDevolver && !!firstItem },
    { key: "delete", label: "Excluir", icon: Trash2, onClick: () => openDelete(req.req_id),
      style: "bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 shadow-sm", show: canDeleteBtn },
  ].filter((a) => a.show);

  const primaryMobile = actions[0];
  const restMobile = actions.slice(1);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <article className="group h-full rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg hover:shadow-xl border border-white/20 dark:border-gray-600/50 overflow-hidden transition-all duration-300 hover:-translate-y-1">
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/30 dark:to-purple-900/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-800/60">
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
              </div>
              <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">{codigo}</span>
            </div>
            <StatusChip status={status} />
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <User className="h-4 w-4" />
              <span className="truncate">
                {solicitanteNome(req) || (solicitanteId(req) ? `Usuário #${solicitanteId(req)}` : "—")}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <Package className="h-3 w-3" />
              <span>Itens</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{itensCount}</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {firstItem ? (
          <div className="rounded-xl border border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-700/50 dark:to-gray-800/50 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800/60 shrink-0">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                  {materialNome(firstItem.rqi_fk_material)}
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/40">
                    <div className="font-semibold text-blue-900 dark:text-blue-200">{firstItem.rqi_quantidade}</div>
                    <div className="text-blue-600 dark:text-blue-300">Solicitado</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/40">
                    <div className="font-semibold text-green-900 dark:text-green-200">{firstItem.rqi_qtd_atendida || 0}</div>
                    <div className="text-green-600 dark:text-green-300">Atendido</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-purple-50 dark:bg-purple-900/40">
                    <div className="font-semibold text-purple-900 dark:text-purple-200">{firstItem.rqi_qtd_devolvida || 0}</div>
                    <div className="text-purple-600 dark:text-purple-300">Devolvido</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-700/50 dark:to-gray-800/50 p-4 text-center">
            <Package className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300">Sem itens nesta requisição</p>
          </div>
        )}
      </div>

      {actions.length > 0 && (
        <div className="p-6 border-t border-gray-200/50 dark:border-gray-600/50 bg-gray-50/50 dark:bg-gray-700/50">
          <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.key}
                  onClick={a.onClick}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 ring-offset-2 ${a.style}`}
                  title={a.label}
                >
                  <Icon size={14} aria-hidden /> 
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex sm:hidden gap-2">
            {primaryMobile && (
              <button
                onClick={primaryMobile.onClick}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 ${primaryMobile.style}`}
              >
                <primaryMobile.icon size={14} aria-hidden /> {primaryMobile.label}
              </button>
            )}
            {restMobile.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setMoreOpen((o) => !o)}
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 transition-all duration-200"
                  title="Mais ações"
                >
                  <MoreHorizontal size={16} aria-hidden />
                  <span>Mais</span>
                  <ChevronDown size={14} aria-hidden className={`${moreOpen ? "rotate-180" : ""} transition-transform`} />
                </button>
                {moreOpen && (
                  <div role="menu" className="absolute right-0 mt-2 min-w-[12rem] rounded-xl border border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-700/95 backdrop-blur-xl shadow-xl z-10 p-2">
                    {restMobile.map((a) => {
                      const Icon = a.icon;
                      return (
                        <button
                          key={a.key}
                          onClick={() => { a.onClick(); setMoreOpen(false); }}
                          role="menuitem"
                          className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium text-gray-900 dark:text-white"
                        >
                          <Icon size={16} aria-hidden />
                          <span>{a.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default function Requisitions() {
  const {
    currentUser,
    materiais,
    filtered,
    loading,
    submitting,
    error,
    setError,
    showForm,
    setShowForm,
    filterStatus,
    setFilterStatus,
    filterMaterial,
    setFilterMaterial,
    formNeededAt,
    setFormNeededAt,
    formLocalEntrega,
    setFormLocalEntrega,
    formJustificativa,
    setFormJustificativa,
    formObservacoes,
    setFormObservacoes,
    itemMaterial,
    setItemMaterial,
    itemQuantidade,
    setItemQuantidade,
    itemDescricao,
    setItemDescricao,
    itens,
    addItem,
    removeItem,
    submitRequisicao,
    uiModal,
    closeModal,
    openDecision,
    confirmDecision,
    openAtender,
    confirmAtender,
    openDevolver,
    confirmDevolver,
    openDelete,
    confirmDelete,
    canOperateReq,
    canDecideReq,
    materialNome,
    solicitanteNome,
    solicitanteId,
    isAdmin,
    isConsumivel,
  } = useRequisicao();

  const [q, setQ] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [viewReq, setViewReq] = useState(null);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return filtered;
    return filtered.filter((req) => {
      const code = (req.req_codigo ?? req.codigo ?? `#${req.req_id ?? ""}`).toString().toLowerCase();
      const matchCode = code.includes(term);
      const matchItem =
        Array.isArray(req.itens) &&
        req.itens.some((it) => (materialNome(it.rqi_fk_material) || "").toLowerCase().includes(term));
      return matchCode || matchItem;
    });
  }, [filtered, q, materialNome]);

  if (loading && list.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-700 dark:text-gray-200">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-indigo-700"></div>
            <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-lg font-medium">Carregando requisições...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-white/20 dark:border-gray-600/50 shadow-lg">
          <div className="mx-auto">
            <header className="px-6 py-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                    <FileText className="text-white h-6 w-6" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      Requisições
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      Gerencie e acompanhe todas as requisições de materiais
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 font-semibold"
                >
                  <PlusCircle size={20} aria-hidden /> 
                  <span className="hidden sm:inline">Nova Requisição</span>
                  <span className="sm:hidden">Nova</span>
                </button>
              </div>
            </header>

            {error && (
              <div role="alert" className="mx-6 mb-6 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border border-red-200 dark:border-red-700/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-800/60">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-red-800 dark:text-red-200 font-medium">{String(error)}</p>
                  </div>
                  <button 
                    className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/60 rounded-lg transition-colors" 
                    onClick={() => setError(null)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}

            {/* Filters */}
            <section className="px-6 pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5">
                  <label htmlFor="busca-req" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Pesquisar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} aria-hidden />
                    <input
                      id="busca-req"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Código, material ou descrição..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                  >
                    <option value="Todos">Todos os status</option>
                    {["Pendente","Aprovada","Atendida","Em Uso","Parcial","Devolvida","Rejeitada","Cancelada"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Material
                  </label>
                  <select
                    value={filterMaterial}
                    onChange={(e) => setFilterMaterial(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                  >
                    <option value="Todos">Todos os materiais</option>
                    {materiais.map((m) => (
                      <option key={m.mat_id} value={m.mat_id}>{m.mat_nome}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Content */}
        <section role="region" aria-label="Lista de requisições" className="flex-1 overflow-auto">
          <div className="mx-auto p-6">
            {list.length ? (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <TrendingUp className="h-4 w-4" />
                    <span>{list.length} requisição{list.length !== 1 ? 'ões' : ''} encontrada{list.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {list.map((req) => (
                    <ReqCard
                      key={req.req_id}
                      req={req}
                      currentUser={currentUser}
                      materialNome={materialNome}
                      canOperateReq={canOperateReq}
                      canDecideReq={canDecideReq}
                      openView={(r) => { setViewReq(r); setViewOpen(true); }}
                      openDecision={openDecision}
                      openAtender={openAtender}
                      openDevolver={openDevolver}
                      openDelete={openDelete}
                      solicitanteNome={solicitanteNome}
                      solicitanteId={solicitanteId}
                      isAdmin={isAdmin}
                      isConsumivel={isConsumivel}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-600/50 shadow-lg p-12 max-w-md mx-auto">
                  <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-700 inline-block mb-6">
                    <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Nenhuma requisição encontrada
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Não há requisições que correspondam aos filtros aplicados.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 font-semibold"
                  >
                    <PlusCircle size={18} />
                    Criar primeira requisição
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* MODAIS */}

      {/* Nova requisição */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nova Requisição"
        maxWidth="max-w-5xl"
        footer={
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button 
              onClick={() => setShowForm(false)} 
              className="px-6 py-3 border border-gray-300 dark:border-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              form="form-req"
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 font-semibold shadow-lg transition-all duration-200"
            >
              {submitting && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Criar Requisição
            </button>
          </div>
        }
      >
        <form id="form-req" onSubmit={submitRequisicao} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Necessário em
              </label>
              <input 
                type="date" 
                value={formNeededAt} 
                onChange={(e) => setFormNeededAt(e.target.value)} 
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Local de entrega</label>
              <input 
                type="text" 
                value={formLocalEntrega} 
                onChange={(e) => setFormLocalEntrega(e.target.value)} 
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                placeholder="Ex: Sala 101, Depósito A..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Justificativa</label>
              <input 
                type="text" 
                value={formJustificativa} 
                onChange={(e) => setFormJustificativa(e.target.value)} 
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                placeholder="Motivo da requisição..."
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Observações</label>
              <textarea 
                value={formObservacoes} 
                onChange={(e) => setFormObservacoes(e.target.value)} 
                rows={3}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                placeholder="Informações adicionais..."
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200/50 dark:border-gray-600/50 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <PackagePlus size={20} /> Itens da Requisição
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl">
              <select 
                value={itemMaterial} 
                onChange={(e) => setItemMaterial(e.target.value)} 
                className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">Selecione um material</option>
                {materiais.map((m) => (
                  <option key={m.mat_id} value={m.mat_id}>{m.mat_nome}</option>
                ))}
              </select>
              <input 
                type="number" 
                min="1" 
                value={itemQuantidade} 
                onChange={(e) => setItemQuantidade(Number(e.target.value))} 
                className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200" 
                placeholder="Quantidade" 
              />
              <input 
                type="text" 
                value={itemDescricao} 
                onChange={(e) => setItemDescricao(e.target.value)} 
                className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200" 
                placeholder="Observação (opcional)" 
              />
              <button 
                type="button" 
                onClick={addItem} 
                className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg transition-all duration-200"
              >
                <PackagePlus size={16} /> Adicionar
              </button>
            </div>

            {itens.length > 0 && (
              <div className="rounded-xl border border-gray-200/50 dark:border-gray-600/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Material</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Qtd</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/50 dark:divide-gray-600/50 bg-white dark:bg-gray-800">
                      {itens.map((it, idx) => (
                        <tr key={it.rqi_id ?? idx} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">#{idx + 1}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{materialNome(it.rqi_fk_material)}</div>
                            {it.rqi_descricao && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{it.rqi_descricao}</div>}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{it.rqi_quantidade}</td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/50 transition-colors"
                              aria-label={`Remover item ${idx + 1}`}
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Decisão */}
      <Modal
        open={uiModal.open && uiModal.kind === "decisao"}
        onClose={closeModal}
        title={`Registrar Decisão — ${uiModal.payload?.tipo ?? ""}`}
        footer={
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button 
              onClick={closeModal} 
              className="px-6 py-3 border border-gray-300 dark:border-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const motivo = document.getElementById("motivo-dec")?.value || "";
                confirmDecision({ motivo });
              }}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg transition-all duration-200"
            >
              Confirmar Decisão
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200" htmlFor="motivo-dec">
            Motivo da decisão (opcional)
          </label>
          <textarea 
            id="motivo-dec" 
            rows={4} 
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200" 
            placeholder="Descreva o motivo da sua decisão..."
          />
        </div>
      </Modal>

      {/* Atender item */}
      <Modal
        open={uiModal.open && uiModal.kind === "atender"}
        onClose={closeModal}
        title="Atender Item da Requisição"
        footer={
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button 
              onClick={closeModal} 
              className="px-6 py-3 border border-gray-300 dark:border-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const quantidade = Number(document.getElementById("qtd-atender")?.value || 0);
                confirmAtender({ quantidade });
              }}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg transition-all duration-200"
            >
              Confirmar Atendimento
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700/50">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-semibold">Quantidade restante para atender:</span> {uiModal.payload?.restante ?? 0}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2" htmlFor="qtd-atender">
              Quantidade a atender
            </label>
            <input 
              id="qtd-atender" 
              type="number" 
              min={1} 
              max={uiModal.payload?.restante ?? 1} 
              defaultValue={uiModal.payload?.restante ?? 1} 
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200" 
            />
          </div>
        </div>
      </Modal>

      {/* Devolver item */}
      <Modal
        open={uiModal.open && uiModal.kind === "devolver"}
        onClose={closeModal}
        title="Aprovar Devolução de Item"
        footer={
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button 
              onClick={closeModal} 
              className="px-6 py-3 border border-gray-300 dark:border-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const quantidade = Number(document.getElementById("qtd-dev")?.value || 0);
                const condicao = document.getElementById("cond-dev")?.value || "Boa";
                const obs = document.getElementById("obs-dev")?.value || "";
                confirmDevolver({ quantidade, condicao, obs });
              }}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 font-semibold shadow-lg transition-all duration-200"
            >
              Confirmar Devolução
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-teal-50 dark:bg-teal-900/30 rounded-xl border border-teal-200 dark:border-teal-700/50">
            <p className="text-sm text-teal-800 dark:text-teal-200">
              <span className="font-semibold">Quantidade em uso:</span> {uiModal.payload?.emUso ?? 0}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2" htmlFor="qtd-dev">
                Quantidade a devolver
              </label>
              <input 
                id="qtd-dev" 
                type="number" 
                min={1} 
                max={uiModal.payload?.emUso ?? 1} 
                defaultValue={uiModal.payload?.emUso ?? 1} 
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2" htmlFor="cond-dev">
                Condição do item
              </label>
              <select 
                id="cond-dev" 
                defaultValue="Boa" 
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="Boa">Boa condição</option>
                <option value="Danificada">Danificada</option>
                <option value="Perdida">Perdida</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2" htmlFor="obs-dev">
                Observações sobre a devolução
              </label>
              <textarea 
                id="obs-dev" 
                rows={3} 
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200" 
                placeholder="Descreva o estado do item ou outras observações..."
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Excluir */}
      <Modal
        open={uiModal.open && uiModal.kind === "delete"}
        onClose={closeModal}
        title="Excluir Requisição"
        footer={
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button 
              onClick={closeModal} 
              className="px-6 py-3 border border-gray-300 dark:border-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              onClick={confirmDelete} 
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 font-semibold shadow-lg transition-all duration-200"
            >
              Excluir Requisição
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-700/50">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-300 shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-200">Atenção!</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Esta ação não poderá ser desfeita. Todos os dados relacionados a esta requisição serão permanentemente removidos.
                </p>
              </div>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-200">
            Tem certeza que deseja excluir esta requisição?
          </p>
        </div>
      </Modal>

      {/* Detalhes */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={`Detalhes da Requisição — ${viewReq?.req_codigo ?? viewReq?.codigo ?? `#${viewReq?.req_id ?? ""}`}`}
        maxWidth="max-w-6xl"
      >
        {viewReq ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-6 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl">
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Código</div>
                <div className="font-bold text-gray-900 dark:text-white">{viewReq.req_codigo ?? viewReq.codigo ?? `#${viewReq.req_id}`}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</div>
                <StatusChip status={viewReq.req_status} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Criada em</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {parseDateSafe(viewReq.createdAt || viewReq.req_created_at || viewReq.req_date)}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Necessário em</div>
                <div className="font-medium text-gray-900 dark:text-white">{parseDateSafe(viewReq.req_needed_at || viewReq.req_neededAt)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Solicitante</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {solicitanteNome(viewReq) || (solicitanteId(viewReq) ? `Usuário #${solicitanteId(viewReq)}` : "—")}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200/50 dark:border-gray-600/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Material</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Solicitado</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Atendido</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Devolvido</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50 dark:divide-gray-600/50 bg-white dark:bg-gray-800">
                    {(viewReq.itens ?? []).map((it, i) => {
                      const solicitado = Number(it.rqi_quantidade || 0);
                      const atendido  = Number(it.rqi_qtd_atendida || 0);
                      const devolvido = Number(it.rqi_qtd_devolvida || 0);
                      const restante  = Math.max(0, solicitado - atendido);
                      const emUso     = Math.max(0, atendido - devolvido);

                      const reqStatus = String(viewReq.req_status || "");
                      const canServe  = ["Aprovada","Parcial","Em Uso"].includes(reqStatus) && restante > 0 && canOperateReq(viewReq);
                      const canReturn = ["Em Uso","Parcial","Atendida"].includes(reqStatus) && emUso > 0 && canOperateReq(viewReq) && !(typeof isConsumivel === 'function' && isConsumivel(it.rqi_fk_material));

                      return (
                        <tr key={it.rqi_id ?? i} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">#{it.rqi_id ?? i + 1}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900 dark:text-white">{materialNome(it.rqi_fk_material)}</div>
                            {it.rqi_descricao && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{it.rqi_descricao}</div>}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{solicitado}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-700 dark:text-green-300">{atendido}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-purple-700 dark:text-purple-300">{devolvido}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              {it.rqi_status || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              {canServe && (
                                <button
                                  onClick={() => {
                                    setViewOpen(false);
                                    setTimeout(() => openAtender(viewReq, it), 0);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                                  title={`Atender (restante ${restante})`}
                                >
                                  Atender
                                </button>
                              )}
                              {canReturn && (
                                <button
                                  onClick={() => openDevolver(viewReq, it)}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 transition-all duration-200"
                                  title={`Devolver (em uso ${emUso})`}
                                >
                                  Devolver
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {(viewReq.req_justificativa || viewReq.req_observacoes || viewReq.req_local_entrega) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Local de entrega</div>
                  <div className="font-medium text-gray-900 dark:text-white">{viewReq.req_local_entrega || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Justificativa</div>
                  <div className="font-medium text-gray-900 dark:text-white">{viewReq.req_justificativa || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Observações</div>
                  <div className="font-medium text-gray-900 dark:text-white">{viewReq.req_observacoes || "—"}</div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </main>
  );
}