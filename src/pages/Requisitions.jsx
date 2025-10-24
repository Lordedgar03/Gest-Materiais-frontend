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
  Filter,
  Info,
} from "lucide-react";
import { useRequisicao } from "../hooks/useRequisicao";

/* ===== Helpers ===== */
const parseDateSafe = (dt) => {
  if (!dt) return "—";
  const d = new Date(dt);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

/* ===== Modal ===== */
function Modal({ open, title, onClose, children, footer, maxWidth = "max-w-5xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full ${maxWidth} rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700`}>
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-2 ring-indigo-500"
              aria-label="Fechar modal"
            >
              <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          <div className="p-5">{children}</div>
          {footer && <div className="p-5 border-t border-gray-200 dark:border-gray-700">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/* ===== Badges com alto contraste ===== */
function StatusChip({ status }) {
  const styles = {
    Pendente: "bg-amber-100 text-amber-900 ring-1 ring-amber-300",
    Aprovada: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300",
    Rejeitada: "bg-red-100 text-red-900 ring-1 ring-red-300",
    Cancelada: "bg-gray-200 text-gray-900 ring-1 ring-gray-300",
    Parcial: "bg-sky-100 text-sky-900 ring-1 ring-sky-300",
    "Em Uso": "bg-indigo-100 text-indigo-900 ring-1 ring-indigo-300",
    Atendida: "bg-green-100 text-green-900 ring-1 ring-green-300",
    Devolvida: "bg-cyan-100 text-cyan-900 ring-1 ring-cyan-300",
  };
  const cls =
    styles[status] || "bg-gray-100 text-gray-900 ring-1 ring-gray-300";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${cls}`}>
      {status}
    </span>
  );
}

/* ===== Card de requisição (com totais) ===== */
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
  isVendavel,
}) {
  const codigo = req.req_codigo ?? req.codigo ?? `#${req.req_id ?? "?"}`;
  const itensArr = Array.isArray(req.itens) ? req.itens : [];
  const itensCount = itensArr.length;

  // Totais por requisição (📌 pedido do cliente: “mostrar as quantidades do produto”)
  const { totalSolicitado, totalAtendido, totalDevolvido, totalEmUso } = useMemo(() => {
    let s = 0, a = 0, d = 0;
    for (const it of itensArr) {
      s += Number(it.rqi_quantidade || 0);
      a += Number(it.rqi_qtd_atendida || 0);
      d += Number(it.rqi_qtd_devolvida || 0);
    }
    return { totalSolicitado: s, totalAtendido: a, totalDevolvido: d, totalEmUso: Math.max(0, a - d) };
  }, [itensArr]);

  const status = String(req.req_status || "").trim();
  const isRejectedOrCanceled = status === "Rejeitada" || status === "Cancelada";
  const mayDecide = canDecideReq(req);

  // Ações (alto contraste)
  const actions = [
    {
      key: "view",
      label: "Ver",
      icon: Eye,
      onClick: () => openView(req),
      cls: "bg-indigo-600 hover:bg-indigo-700 text-white",
      show: true,
    },
    {
      key: "approve",
      label: "Aprovar",
      icon: CheckCircle,
      onClick: () => openDecision(req, "Aprovar"),
      cls: "bg-emerald-600 hover:bg-emerald-700 text-white",
      show: isAdmin && status === "Pendente" && mayDecide && !isRejectedOrCanceled,
    },
    {
      key: "reject",
      label: "Rejeitar",
      icon: XCircle,
      onClick: () => openDecision(req, "Rejeitar"),
      cls: "bg-rose-600 hover:bg-rose-700 text-white",
      show: isAdmin && status === "Pendente" && mayDecide && !isRejectedOrCanceled,
    },
    {
      key: "cancel",
      label: "Cancelar",
      icon: X,
      onClick: () => openDecision(req, "Cancelar"),
      cls: "bg-amber-600 hover:bg-amber-700 text-white",
      show: status === "Pendente" && mayDecide && !isRejectedOrCanceled,
    },
    {
      key: "delete",
      label: "Excluir",
      icon: Trash2,
      onClick: () => openDelete(req.req_id),
      cls: "bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ring-1 ring-gray-300 dark:ring-gray-600",
      show: mayDecide || Number(req.req_fk_user) === Number(currentUser.id),
    },
  ].filter((a) => a.show);

  // Mobile menu
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryMobile = actions[0];
  const restMobile = actions.slice(1);

  return (
    <article className="group h-full rounded-2xl bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
      <header className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <FileText className="h-4 w-4" />
              <span className="font-semibold truncate">{codigo}</span>
            </div>
            <div className="mt-2">
              <StatusChip status={status} />
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <User className="h-4 w-4" />
              <span className="truncate">
                {solicitanteNome(req) ||
                  (solicitanteId(req) ? `Usuário #${solicitanteId(req)}` : "—")}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 text-xs text-gray-600 dark:text-gray-300">
              <Package className="h-4 w-4" />
              <span>Itens</span>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{itensCount}</div>
          </div>
        </div>
      </header>

      {/* Totais com alto contraste */}
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-blue-100 text-blue-900 ring-1 ring-blue-300 p-3 text-center">
            <div className="text-xs font-medium">Solicitado</div>
            <div className="text-lg font-extrabold">{totalSolicitado}</div>
          </div>
          <div className="rounded-lg bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300 p-3 text-center">
            <div className="text-xs font-medium">Atendido</div>
            <div className="text-lg font-extrabold">{totalAtendido}</div>
          </div>
          <div className="rounded-lg bg-indigo-100 text-indigo-900 ring-1 ring-indigo-300 p-3 text-center">
            <div className="text-xs font-medium">Em uso</div>
            <div className="text-lg font-extrabold">{totalEmUso}</div>
          </div>
          <div className="rounded-lg bg-purple-100 text-purple-900 ring-1 ring-purple-300 p-3 text-center">
            <div className="text-xs font-medium">Devolvido</div>
            <div className="text-lg font-extrabold">{totalDevolvido}</div>
          </div>
        </div>

        {/* Resumo do primeiro item (sempre mostra as quantidades do produto em destaque) */}
        {itensArr.length > 0 ? (
          <div className="mt-5 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-900 ring-1 ring-blue-300">
                <Package className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {materialNome(itensArr[0].rqi_fk_material)}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                  <div className="text-center rounded-lg bg-blue-50 text-blue-900 ring-1 ring-blue-200 p-2">
                    <div className="text-base font-bold">{itensArr[0].rqi_quantidade}</div>
                    <div>Solicitado</div>
                  </div>
                  <div className="text-center rounded-lg bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 p-2">
                    <div className="text-base font-bold">{itensArr[0].rqi_qtd_atendida || 0}</div>
                    <div>Atendido</div>
                  </div>
                  <div className="text-center rounded-lg bg-purple-50 text-purple-900 ring-1 ring-purple-200 p-2">
                    <div className="text-base font-bold">{itensArr[0].rqi_qtd_devolvida || 0}</div>
                    <div>Devolvido</div>
                  </div>
                </div>
                {itensArr.length > 1 && (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <Info className="h-3.5 w-3.5" />
                    <span>+ {itensArr.length - 1} item(ns) nesta requisição</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-gray-600 dark:text-gray-300">
            Nenhum item na requisição.
          </div>
        )}
      </div>

      {/* Ações */}
      {actions.length > 0 && (
        <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {/* Desktop */}
          <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.key}
                  onClick={a.onClick}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg focus-visible:ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ${a.cls}`}
                >
                  <Icon className="h-4 w-4" />
                  {a.label}
                </button>
              );
            })}
          </div>

          {/* Mobile */}
          <div className="sm:hidden flex gap-2">
            {primaryMobile && (
              <button
                onClick={primaryMobile.onClick}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg ${primaryMobile.cls}`}
              >
                <primaryMobile.icon className="h-4 w-4" />
                {primaryMobile.label}
              </button>
            )}
            {restMobile.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setMoreOpen((o) => !o)}
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ring-1 ring-gray-300 dark:ring-gray-600"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  Mais
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
                </button>
                {moreOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 min-w-[12rem] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl z-10 p-2"
                  >
                    {restMobile.map((a) => {
                      const Icon = a.icon;
                      return (
                        <button
                          key={a.key}
                          onClick={() => {
                            a.onClick();
                            setMoreOpen(false);
                          }}
                          role="menuitem"
                          className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100"
                        >
                          <Icon className="h-4 w-4" />
                          {a.label}
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

/* ===== Página ===== */
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
    isVendavel,
  } = useRequisicao();

  const [q, setQ] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [viewReq, setViewReq] = useState(null);

  const list = useMemo(() => {
    const byIdDesc = (a, b) => {
      const ida = Number(a.req_id ?? 0);
      const idb = Number(b.req_id ?? 0);
      if (idb !== ida) return idb - ida;
      const da = new Date(a.createdAt || a.req_date || 0).getTime();
      const db = new Date(b.createdAt || b.req_date || 0).getTime();
      return db - da;
    };
    const term = q.trim().toLowerCase();
    if (!term) return [...filtered].sort(byIdDesc);
    return filtered
      .filter((req) => {
        const code = (req.req_codigo ?? req.codigo ?? `#${req.req_id ?? ""}`).toString().toLowerCase();
        const matchCode = code.includes(term);
        const matchItem =
          Array.isArray(req.itens) &&
          req.itens.some((it) => (materialNome(it.rqi_fk_material) || "").toLowerCase().includes(term));
        return matchCode || matchItem;
      })
      .sort(byIdDesc);
  }, [filtered, q, materialNome]);

  if (loading && list.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
          <div className="w-6 h-6 border-2 border-indigo-300 dark:border-indigo-700 border-t-transparent rounded-full animate-spin" />
          <p className="font-medium">Carregando requisições…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen  dark:bg-gray-950">
      {/* Topbar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 border-b  dark:border-gray-800 backdrop-blur">
        <div className="mx-auto p-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-3 rounded-xl bg-indigo-600">
                <FileText className="text-white h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Requisições</h1>
                <p className="text-gray-600 dark:text-gray-300">Acompanhe e gerencie as requisições de materiais</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-bold"
            >
              <PlusCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Nova Requisição</span>
              <span className="sm:hidden">Nova</span>
            </button>
          </div>

          {error && (
            <div role="alert" className="mt-4 rounded-lg bg-red-50 text-red-900 ring-1 ring-red-300 p-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{String(error)}</p>
                </div>
                <button
                  className="px-3 py-1 text-sm font-semibold text-red-800 hover:bg-red-100 rounded-md"
                  onClick={() => setError(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          )}

          {/* Filtros */}
          <section className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5">
              <label htmlFor="busca-req" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Pesquisar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} aria-hidden />
                <input
                  id="busca-req"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Código, material ou descrição…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 items-center gap-2">
              
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Todos">Todos</option>
                {["Pendente","Aprovada","Atendida","Em Uso","Parcial","Devolvida","Rejeitada","Cancelada"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-4">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 items-center gap-2">
 
                Material
              </label>
              <select
                value={filterMaterial}
                onChange={(e) => setFilterMaterial(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Todos">Todos os materiais</option>
                {materiais.map((m) => (
                  <option key={m.mat_id} value={m.mat_id}>{m.mat_nome}</option>
                ))}
              </select>
            </div>
          </section>
        </div>
      </div>

      {/* Lista */}
      <section role="region" aria-label="Lista de requisições" className="px-5 py-6">
        {list.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {list.map((req) => (
              <ReqCard
                key={req.req_id}
                req={req}
                currentUser={currentUser}
                materialNome={materialNome}
                canOperateReq={canOperateReq}
                canDecideReq={canDecideReq}
                openView={(r) => {
                  setViewReq(r);
                  setViewOpen(true);
                }}
                openDecision={openDecision}
                openAtender={openAtender}
                openDevolver={openDevolver}
                openDelete={openDelete}
                solicitanteNome={solicitanteNome}
                solicitanteId={solicitanteId}
                isAdmin={isAdmin}
                isConsumivel={isConsumivel}
                isVendavel={isVendavel}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 p-10">
              <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhuma requisição encontrada</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Ajuste os filtros ou crie uma nova requisição.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-bold"
              >
                <PlusCircle className="h-5 w-5" />
                Criar requisição
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ===== MODAIS ===== */}

      {/* Nova requisição */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nova Requisição"
        footer={
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-white rounded-lg font-semibold">
              Cancelar
            </button>
            <button
              form="form-req"
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-extrabold disabled:opacity-70"
            >
              {submitting && <span className="mr-2 inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Criar Requisição
            </button>
          </div>
        }
      >
        <form id="form-req" onSubmit={submitRequisicao} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Necessário em</label>
              <input
                type="date"
                value={formNeededAt}
                onChange={(e) => setFormNeededAt(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Local de entrega</label>
              <input
                type="text"
                value={formLocalEntrega}
                onChange={(e) => setFormLocalEntrega(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: Sala 101, Depósito A…"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Justificativa</label>
              <input
                type="text"
                value={formJustificativa}
                onChange={(e) => setFormJustificativa(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                placeholder="Motivo da requisição…"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Observações</label>
              <textarea
                value={formObservacoes}
                onChange={(e) => setFormObservacoes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                placeholder="Informações adicionais…"
              />
            </div>
          </div>

          {/* Itens */}
          <div className="pt-5 border-t border-gray-200 dark:border-gray-800 space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <PackagePlus className="h-5 w-5" /> Itens da Requisição
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <select
                value={itemMaterial}
                onChange={(e) => setItemMaterial(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione um material</option>
                {materiais.map((m) => (
                  <option key={m.mat_id} value={m.mat_id}>
                    {m.mat_nome}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={itemQuantidade}
                onChange={(e) => setItemQuantidade(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                placeholder="Quantidade"
              />
              <input
                type="text"
                value={itemDescricao}
                onChange={(e) => setItemDescricao(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                placeholder="Observação (opcional)"
              />
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-extrabold"
              >
                <PackagePlus className="h-4 w-4 inline -mt-0.5 mr-1" />
                Adicionar
              </button>
            </div>

            {itens.length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">#</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Material</th>
                        <th className="px-5 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Qtd</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                      {itens.map((it, idx) => (
                        <tr key={it.rqi_id ?? idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">#{idx + 1}</td>
                          <td className="px-5 py-3">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {materialNome(it.rqi_fk_material)}
                            </div>
                            {it.rqi_descricao && (
                              <div className="text-xs text-gray-600 dark:text-gray-300">{it.rqi_descricao}</div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-sm font-extrabold text-gray-900 dark:text-gray-100 text-right">
                            {it.rqi_quantidade}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="px-3 py-1.5 text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50"
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
        title={`Registrar decisão — ${uiModal.payload?.tipo ?? ""}`}
        footer={
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button onClick={closeModal} className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold">
              Cancelar
            </button>
            <button
              onClick={() => {
                const motivo = document.getElementById("motivo-dec")?.value || "";
                confirmDecision({ motivo });
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-extrabold"
            >
              Confirmar
            </button>
          </div>
        }
      >
        <label htmlFor="motivo-dec" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
          Motivo (opcional)
        </label>
        <textarea
          id="motivo-dec"
          rows={4}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
          placeholder="Descreva o motivo da decisão…"
        />
      </Modal>

      {/* Atender */}
      <Modal
        open={uiModal.open && uiModal.kind === "atender"}
        onClose={closeModal}
        title="Atender item"
        footer={
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button onClick={closeModal} className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold">
              Cancelar
            </button>
            <button
              onClick={() => {
                const quantidade = Number(document.getElementById("qtd-atender")?.value || 0);
                confirmAtender({ quantidade });
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-extrabold"
            >
              Confirmar
            </button>
          </div>
        }
      >
        <div className="rounded-lg bg-blue-50 text-blue-900 ring-1 ring-blue-300 p-3 mb-4">
          Restante para atender: <b>{uiModal.payload?.restante ?? 0}</b>
        </div>
        <label htmlFor="qtd-atender" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
          Quantidade
        </label>
        <input
          id="qtd-atender"
          type="number"
          min={1}
          max={uiModal.payload?.restante ?? 1}
          defaultValue={uiModal.payload?.restante ?? 1}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
        />
      </Modal>

      {/* Devolver */}
      <Modal
        open={uiModal.open && uiModal.kind === "devolver"}
        onClose={closeModal}
        title="Aprovar devolução"
        footer={
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button onClick={closeModal} className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold">
              Cancelar
            </button>
            <button
              onClick={() => {
                const quantidade = Number(document.getElementById("qtd-dev")?.value || 0);
                const condicao = document.getElementById("cond-dev")?.value || "Boa";
                const obs = document.getElementById("obs-dev")?.value || "";
                confirmDevolver({ quantidade, condicao, obs });
              }}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-extrabold"
            >
              Confirmar
            </button>
          </div>
        }
      >
        <div className="rounded-lg bg-cyan-50 text-cyan-900 ring-1 ring-cyan-300 p-3 mb-4">
          Em uso: <b>{uiModal.payload?.emUso ?? 0}</b>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="qtd-dev" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              Quantidade a devolver
            </label>
            <input
              id="qtd-dev"
              type="number"
              min={1}
              max={uiModal.payload?.emUso ?? 1}
              defaultValue={uiModal.payload?.emUso ?? 1}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="cond-dev" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              Condição
            </label>
            <select
              id="cond-dev"
              defaultValue="Boa"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Boa">Boa</option>
              <option value="Danificada">Danificada</option>
              <option value="Perdida">Perdida</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="obs-dev" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              Observações
            </label>
            <textarea
              id="obs-dev"
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              placeholder="Descreva o estado do item…"
            />
          </div>
        </div>
      </Modal>

      {/* Excluir */}
      <Modal
        open={uiModal.open && uiModal.kind === "delete"}
        onClose={closeModal}
        title="Excluir requisição"
        footer={
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button onClick={closeModal} className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold">
              Cancelar
            </button>
            <button onClick={confirmDelete} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-extrabold">
              Excluir
            </button>
          </div>
        }
      >
        <div className="rounded-lg bg-rose-50 text-rose-900 ring-1 ring-rose-300 p-3 mb-3">
          <AlertCircle className="h-4 w-4 inline -mt-1 mr-2" />
          Esta ação não poderá ser desfeita.
        </div>
        <p className="text-gray-800 dark:text-gray-200">
          Tem certeza que deseja excluir esta requisição?
        </p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-5 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div>
                <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">Código</div>
                <div className="font-extrabold text-gray-900 dark:text-white">
                  {viewReq.req_codigo ?? viewReq.codigo ?? `#${viewReq.req_id}`}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">Status</div>
                <StatusChip status={viewReq.req_status} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">Criada em</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {parseDateSafe(viewReq.createdAt || viewReq.req_created_at || viewReq.req_date)}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">Necessário em</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {parseDateSafe(viewReq.req_needed_at || viewReq.req_neededAt)}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">Solicitante</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {solicitanteNome(viewReq) || (solicitanteId(viewReq) ? `Usuário #${solicitanteId(viewReq)}` : "—")}
                </div>
              </div>
            </div>

            {/* Tabela de itens com colunas numéricas alinhadas à direita */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Item</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Material</th>
                      <th className="px-5 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Solicitado</th>
                      <th className="px-5 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Atendido</th>
                      <th className="px-5 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Devolvido</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Status</th>
                      <th className="px-5 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    {(viewReq.itens ?? []).map((it, i) => {
                      const solicitado = Number(it.rqi_quantidade || 0);
                      const atendido = Number(it.rqi_qtd_atendida || 0);
                      const devolvido = Number(it.rqi_qtd_devolvida || 0);
                      const restante = Math.max(0, solicitado - atendido);
                      const emUso = Math.max(0, atendido - devolvido);
                      const reqStatus = String(viewReq.req_status || "");

                      const canServe = ["Aprovada", "Parcial", "Em Uso"].includes(reqStatus) && restante > 0 && canOperateReq(viewReq, it);
                      const canReturn =
                        ["Em Uso", "Parcial", "Atendida"].includes(reqStatus) &&
                        emUso > 0 &&
                        canOperateReq(viewReq, it) &&
                        !isConsumivel?.(it.rqi_fk_material) &&
                        !isVendavel?.(it.rqi_fk_material);

                      return (
                        <tr key={it.rqi_id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">#{it.rqi_id ?? i + 1}</td>
                          <td className="px-5 py-3">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{materialNome(it.rqi_fk_material)}</div>
                            {it.rqi_descricao && <div className="text-xs text-gray-600 dark:text-gray-300">{it.rqi_descricao}</div>}
                          </td>
                          <td className="px-5 py-3 text-sm font-extrabold text-gray-900 dark:text-gray-100 text-right">{solicitado}</td>
                          <td className="px-5 py-3 text-sm font-extrabold text-emerald-800 dark:text-emerald-300 text-right">{atendido}</td>
                          <td className="px-5 py-3 text-sm font-extrabold text-purple-800 dark:text-purple-300 text-right">{devolvido}</td>
                          <td className="px-5 py-3">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 ring-1 ring-gray-300 dark:ring-gray-700">
                              {it.rqi_status || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex justify-end gap-2">
                              {canServe && (
                                <button
                                  onClick={() => {
                                    setViewOpen(false);
                                    setTimeout(() => openAtender(viewReq, it), 0);
                                  }}
                                  className="px-3 py-1.5 text-xs font-bold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white"
                                  title={`Atender (restante ${restante})`}
                                >
                                  Atender
                                </button>
                              )}
                              {canReturn && (
                                <button
                                  onClick={() => openDevolver(viewReq, it)}
                                  className="px-3 py-1.5 text-xs font-bold rounded-md bg-cyan-600 hover:bg-cyan-700 text-white"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div>
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">Local de entrega</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{viewReq.req_local_entrega || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">Justificativa</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{viewReq.req_justificativa || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">Observações</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{viewReq.req_observacoes || "—"}</div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </main>
  );
}
