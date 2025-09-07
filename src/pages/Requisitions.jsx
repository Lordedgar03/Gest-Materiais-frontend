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
} from "lucide-react";
import { useRequisicao, statusColors } from "../hooks/useRequisicao";

/* ===== Util ===== */
function parseDateSafe(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

/* ===== Modal Genérico ===== */
function Modal({ open, title, onClose, children, footer, maxWidth = "max-w-4xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full ${maxWidth} rounded-2xl bg-white shadow-2xl border border-gray-200`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 focus-visible:ring-2 ring-indigo-400"
              aria-label="Fechar modal"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

function StatusChip({ status }) {
  const cls = statusColors[status] || "bg-gray-200 text-gray-800";
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`} aria-label={`Status: ${status}`}>
      {status}
    </span>
  );
}

/* ===== Card ===== */
function ReqCard({
  req,
  currentUser,
  materialNome,
  canOperateReq,
  canDecideReq,
  isAprovadorDaRequisicao,
  openView,
  openDecision,
  openAtender,
  openDevolver,
  openDelete,
}) {
  const codigo = req.req_codigo ?? req.codigo ?? `#${req.req_id ?? "?"}`;
  const itensCount = Array.isArray(req.itens) ? req.itens.length : 0;

  const mayOperate = canOperateReq(req);
  const mayDecide = canDecideReq(req);

  const status = String(req.req_status || "").trim();
  const isRejectedOrCanceled = status === "Rejeitada" || status === "Cancelada";

  // regras de estado para ações
  const statusAllowsApproveFlow = status === "Pendente";
  const statusAllowsServe = ["Aprovada", "Parcial", "Em Uso"].includes(status);
  const statusAllowsReturn = ["Em Uso", "Parcial", "Atendida"].includes(status);

  // dono (pode excluir a própria pendente, se quiser manter a regra)
  const ownerId = Number(req.req_fk_user ?? req.user_id ?? 0);
  const isOwner = ownerId && Number(ownerId) === Number(currentUser.id);

  const firstItem = Array.isArray(req.itens) && req.itens.length ? req.itens[0] : null;

  let restante = 0;
  let emUso = 0;

  if (firstItem) {
    restante = Number(firstItem.rqi_quantidade || 0) - Number(firstItem.rqi_qtd_atendida || 0);
    emUso = Number(firstItem.rqi_qtd_atendida || 0) - Number(firstItem.rqi_qtd_devolvida || 0);
  }

  // Botões (visibilidade final)
  const canApprove = !isRejectedOrCanceled && statusAllowsApproveFlow && mayDecide;
  const canReject = !isRejectedOrCanceled && statusAllowsApproveFlow && mayDecide;
  const canCancel = !isRejectedOrCanceled && statusAllowsApproveFlow && mayDecide;

  const canAtender = !isRejectedOrCanceled && statusAllowsServe && restante > 0 && mayOperate;
  const canDevolver = !isRejectedOrCanceled && statusAllowsReturn && emUso > 0 && isAprovadorDaRequisicao(req);

  const canDeleteBtn = isOwner || mayDecide;

  const actions = [
    {
      key: "view",
      label: "Ver",
      icon: Eye,
      onClick: () => openView(req),
      style: "border-blue-300 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-400",
      show: true,
    },
    {
      key: "approve",
      label: "Aprovar",
      icon: CheckCircle,
      onClick: () => openDecision(req, "Aprovar"),
      style: "border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-400",
      show: canApprove,
    },
    {
      key: "reject",
      label: "Rejeitar",
      icon: XCircle,
      onClick: () => openDecision(req, "Rejeitar"),
      style: "border-rose-300 bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-400",
      show: canReject,
    },
    {
      key: "cancel",
      label: "Cancelar",
      icon: X,
      onClick: () => openDecision(req, "Cancelar"),
      style: "border-amber-300 bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-400",
      show: canCancel,
    },
    {
      key: "serve1",
      label: "Atender item",
      icon: CheckCircle,
      onClick: () => openAtender(req, firstItem),
      style: "border-indigo-300 bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-400",
      show: canAtender && !!firstItem,
    },
    {
      key: "return1",
      label: "Devolver item",
      icon: Undo2,
      onClick: () => openDevolver(req, firstItem),
      style: "border-teal-300 bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-400",
      show: canDevolver && !!firstItem,
    },
    {
      key: "delete",
      label: "Excluir",
      icon: Trash2,
      onClick: () => openDelete(req.req_id),
      style: "border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus-visible:ring-gray-400",
      show: canDeleteBtn,
    },
  ].filter(a => a.show);

  // mobile: “Ver” + Mais
  const primaryMobile = actions[0];
  const restMobile = actions.slice(1);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <article className="h-full rounded-lg bg-white shadow-sm border border-gray-300 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-br from-indigo-50 to-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">{codigo}</div>
            <div className="mt-1">
              <StatusChip status={status} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Itens</div>
            <div className="text-base font-semibold text-gray-900">{itensCount}</div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {firstItem ? (
          <div className="rounded-lg border bg-gray-50 p-3">
            <div className="text-sm font-medium text-gray-900 line-clamp-1">
              {materialNome(firstItem.rqi_fk_material)}
            </div>
            <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
              <span>Solicitado <b>{firstItem.rqi_quantidade}</b></span>
              <span>Atendido <b>{firstItem.rqi_qtd_atendida || 0}</b></span>
              <span>Devolvido <b>{firstItem.rqi_qtd_devolvida || 0}</b></span>
              {canAtender && <span className="text-indigo-700">Restante <b>{restante}</b></span>}
              {canDevolver && <span className="text-teal-700">Em uso <b>{emUso}</b></span>}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-600">
            Sem itens nesta requisição.
          </div>
        )}
      </div>

      {/* Ações */}
      {actions.length > 0 && (
        <div className="p-4 border-t bg-white">
          {/* Desktop/Tablet */}
          <div className="hidden sm:grid grid-cols-2 gap-2 md:grid-cols-4">
            {actions.map(a => {
              const Icon = a.icon;
              return (
                <button
                  key={a.key}
                  onClick={a.onClick}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md border font-medium focus-visible:ring-2 ring-offset-1 transition-colors ${a.style}`}
                  title={a.label}
                >
                  <Icon size={14} aria-hidden /> {a.label}
                </button>
              );
            })}
          </div>

          {/* Mobile */}
          <div className="flex sm:hidden gap-2">
            {primaryMobile && (
              <button
                onClick={primaryMobile.onClick}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md border font-semibold focus-visible:ring-2 ring-offset-1 ${primaryMobile.style}`}
              >
                <primaryMobile.icon size={14} aria-hidden /> {primaryMobile.label}
              </button>
            )}
            {restMobile.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setMoreOpen(o => !o)}
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md border bg-white hover:bg-gray-50 focus-visible:ring-2 ring-offset-1 ring-gray-400"
                  title="Mais ações"
                >
                  <MoreHorizontal size={16} aria-hidden />
                  <span>Mais</span>
                  <ChevronDown size={14} aria-hidden className={`${moreOpen ? "rotate-180" : ""} transition-transform`} />
                </button>
                {moreOpen && (
                  <div role="menu" className="absolute right-0 mt-2 min-w-[12rem] rounded-lg border bg-white shadow-lg z-10 p-2">
                    {restMobile.map(a => {
                      const Icon = a.icon;
                      return (
                        <button
                          key={a.key}
                          onClick={() => {
                            a.onClick();
                            setMoreOpen(false);
                          }}
                          role="menuitem"
                          className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50"
                        >
                          <Icon size={14} aria-hidden />
                          <span className="text-sm">{a.label}</span>
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

export default function Requisicao() {
  const {
    // identidade/perms
    currentUser,
    isAprovadorDaRequisicao,
    // dados
    materiais,
    filtered,
    // ui base
    loading,
    submitting,
    error,
    setError,
    showForm,
    setShowForm,
    // filtros
    filterStatus,
    setFilterStatus,
    filterMaterial,
    setFilterMaterial,
    // form (nova req.)
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
    // ações/modais
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
    // regras
    canOperateReq,
    canDecideReq,
    // helper
    materialNome,
  } = useRequisicao();

  // busca livre
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return filtered;
    return filtered.filter(req => {
      const code = (req.req_codigo ?? req.codigo ?? `#${req.req_id ?? ""}`).toString().toLowerCase();
      const matchCode = code.includes(term);
      const matchItem =
        Array.isArray(req.itens) &&
        req.itens.some(it => (materialNome(it.rqi_fk_material) || "").toLowerCase().includes(term));
      return matchCode || matchItem;
    });
  }, [filtered, q, materialNome]);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewReq, setViewReq] = useState(null);

  if (loading && list.length === 0) {
    return (
      <div className="h-[100svh] grid place-items-center bg-gradient-to-b from-gray-50 to-white">
        <div className="flex flex-col items-center gap-2 text-gray-700">
          <svg className="animate-spin h-6 w-6 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z" />
          </svg>
          Carregando…
        </div>
      </div>
    );
  }

  return (
    <main className="h-[100svh] bg-gradient-to-b from-gray-50 to-white">
      <div className="h-full flex flex-col">
        {/* TOPO FIXO */}
        <div className="sticky top-0 z-30 bg-white/95 rounded-lg backdrop-blur border-b shadow-sm">
          <div className="mx-auto">
            {/* Header */}
            <header className="px-4 sm:px-6 py-4 sm:py-5 rounded-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-indigo-100 shrink-0">
                    <FileText className="text-indigo-700" size={22} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Requisições</h1>
                    <p className="text-xs sm:text-sm text-gray-600">Crie, acompanhe e atue nas requisições de materiais.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-white bg-indigo-700 hover:bg-indigo-800 focus-visible:ring-2 ring-offset-2 ring-indigo-400 shrink-0"
                  aria-label="Abrir formulário de nova requisição"
                >
                  <PlusCircle size={18} aria-hidden /> <span className="hidden sm:inline">Nova requisição</span>
                  <span className="sm:hidden">Novo</span>
                </button>
              </div>
            </header>

            {/* Erro */}
            {error && (
              <div role="alert" aria-live="assertive" className="border-y bg-rose-50 border-rose-200 text-rose-800">
                <div className="px-4 sm:px-6 py-3 flex items-center gap-2">
                  <AlertCircle aria-hidden /> {String(error)}
                  <button className="ml-auto underline decoration-rose-500 hover:text-rose-900" onClick={() => setError(null)}>
                    Fechar
                  </button>
                </div>
              </div>
            )}

            {/* Filtros */}
            <section className="px-4 sm:px-6 py-3 sm:py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                {/* Busca */}
                <div className="md:col-span-2">
                  <label htmlFor="busca-req" className="block text-sm text-gray-700 mb-1">
                    Pesquisar (código ou material)
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden />
                    <input
                      id="busca-req"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Ex.: #1024, cabo HDMI, álcool…"
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus-visible:ring-2 ring-indigo-400"
                      aria-label="Pesquisar requisições por código ou material"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus-visible:ring-2 ring-indigo-400"
                    aria-label="Filtrar por status"
                  >
                    <option value="Todos">Todos</option>
                    {["Pendente","Aprovada","Atendida","Em Uso","Parcial","Devolvida","Rejeitada","Cancelada"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Material */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Material (em qualquer item)</label>
                  <select
                    value={filterMaterial}
                    onChange={(e) => setFilterMaterial(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus-visible:ring-2 ring-indigo-400"
                    aria-label="Filtrar por material"
                  >
                    <option value="Todos">Todos</option>
                    {materiais.map(m => (
                      <option key={m.mat_id} value={m.mat_id}>{m.mat_nome}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Lista */}
        <section role="region" aria-label="Lista de requisições" className="flex-1 overflow-auto">
          <div className="mx-auto p-4 sm:p-6">
            <div className="grid [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] gap-4 sm:gap-5">
              {list.length ? (
                list.map(req => (
                  <ReqCard
                    key={req.req_id}
                    req={req}
                    currentUser={currentUser}
                    materialNome={materialNome}
                    canOperateReq={canOperateReq}
                    canDecideReq={canDecideReq}
                    isAprovadorDaRequisicao={isAprovadorDaRequisicao}
                    openView={(r) => { setViewReq(r); setViewOpen(true); }}
                    openDecision={openDecision}
                    openAtender={openAtender}
                    openDevolver={openDevolver}
                    openDelete={openDelete}
                  />
                ))
              ) : (
                <div className="col-span-full p-10 text-center rounded-2xl bg-white border border-gray-300">
                  <p className="text-gray-700">Nenhuma requisição encontrada.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ========= MODAIS ========= */}

      {/* Nova requisição */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nova requisição"
        maxWidth="max-w-4xl"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button
              form="form-req"
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg flex items-center gap-2 disabled:opacity-70 focus-visible:ring-2 ring-offset-2 ring-indigo-400"
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z" />
                </svg>
              )}
              Enviar
            </button>
          </div>
        }
      >
        <form id="form-req" onSubmit={submitRequisicao} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Necessário em</label>
              <input
                type="date"
                value={formNeededAt}
                onChange={(e) => setFormNeededAt(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Local de entrega</label>
              <input
                type="text"
                value={formLocalEntrega}
                onChange={(e) => setFormLocalEntrega(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Justificativa</label>
              <input
                type="text"
                value={formJustificativa}
                onChange={(e) => setFormJustificativa(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm mb-1">Observações</label>
              <input
                type="text"
                value={formObservacoes}
                onChange={(e) => setFormObservacoes(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="pt-3 border-t space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-gray-900">
              <PackagePlus size={16} /> Itens
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select value={itemMaterial} onChange={(e) => setItemMaterial(e.target.value)} className="border rounded-lg px-3 py-2">
                <option value="">Selecione um material</option>
                {materiais.map((m) => (
                  <option key={m.mat_id} value={m.mat_id}>{m.mat_nome}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={itemQuantidade}
                onChange={(e) => setItemQuantidade(e.target.value)}
                className="border rounded-lg px-3 py-2"
                placeholder="Quantidade"
              />
              <input
                type="text"
                value={itemDescricao}
                onChange={(e) => setItemDescricao(e.target.value)}
                className="border rounded-lg px-3 py-2"
                placeholder="Observação (opcional)"
              />
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg flex items-center justify-center gap-2 focus-visible:ring-2 ring-offset-2 ring-indigo-400"
              >
                <PackagePlus size={16} /> Adicionar item
              </button>
            </div>

            {itens.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                      <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-600 uppercase">Material</th>
                      <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-600 uppercase">Qtd</th>
                      <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((it, idx) => (
                      <tr key={it.rqi_id ?? idx} className="border-t">
                        <td className="py-2 pr-4">#{it.rqi_id ?? idx + 1}</td>
                        <td className="py-2 pr-4">
                          {materialNome(it.rqi_fk_material)}
                          {it.rqi_descricao ? <span className="block text-xs text-gray-500">{it.rqi_descricao}</span> : null}
                        </td>
                        <td className="py-2 pr-4">{it.rqi_quantidade}</td>
                        <td className="py-2 pr-4">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="px-2 py-1 border rounded text-rose-700 border-rose-300 hover:bg-rose-50 focus-visible:ring-2 ring-rose-400"
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
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button
              onClick={() => {
                const motivo = document.getElementById("motivo-dec")?.value || "";
                confirmDecision({ motivo });
              }}
              className="px-4 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 focus-visible:ring-2 ring-offset-2 ring-indigo-400"
            >
              Confirmar
            </button>
          </div>
        }
      >
        <label className="block text-sm mb-1" htmlFor="motivo-dec">Motivo (opcional)</label>
        <textarea id="motivo-dec" rows={3} className="w-full border rounded-lg px-3 py-2" placeholder="Observações..." />
      </Modal>

      {/* Atender item */}
      <Modal
        open={uiModal.open && uiModal.kind === "atender"}
        onClose={closeModal}
        title="Atender item"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button
              onClick={() => {
                const quantidade = Number(document.getElementById("qtd-atender")?.value || 0);
                confirmAtender({ quantidade });
              }}
              className="px-4 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 focus-visible:ring-2 ring-offset-2 ring-indigo-400"
            >
              Confirmar
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600 mb-2">Restante: <b>{uiModal.payload?.restante ?? 0}</b></p>
        <label className="block text-sm mb-1" htmlFor="qtd-atender">Quantidade a atender</label>
        <input
          id="qtd-atender"
          type="number"
          min={1}
          max={uiModal.payload?.restante ?? 1}
          defaultValue={uiModal.payload?.restante ?? 1}
          className="w-full border rounded-lg px-3 py-2"
        />
      </Modal>

      {/* Devolver item */}
      <Modal
        open={uiModal.open && uiModal.kind === "devolver"}
        onClose={closeModal}
        title="Aprovar devolução"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button
              onClick={() => {
                const quantidade = Number(document.getElementById("qtd-dev")?.value || 0);
                const condicao = document.getElementById("cond-dev")?.value || "Boa";
                const obs = document.getElementById("obs-dev")?.value || "";
                confirmDevolver({ quantidade, condicao, obs });
              }}
              className="px-4 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 focus-visible:ring-2 ring-offset-2 ring-indigo-400"
            >
              Confirmar
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600 mb-2">Em uso: <b>{uiModal.payload?.emUso ?? 0}</b></p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1" htmlFor="qtd-dev">Quantidade</label>
            <input
              id="qtd-dev"
              type="number"
              min={1}
              max={uiModal.payload?.emUso ?? 1}
              defaultValue={uiModal.payload?.emUso ?? 1}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="cond-dev">Condição</label>
            <select id="cond-dev" defaultValue="Boa" className="w-full border rounded-lg px-3 py-2">
              <option>Boa</option>
              <option>Danificada</option>
              <option>Perdida</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm mb-1" htmlFor="obs-dev">Observações</label>
            <textarea id="obs-dev" rows={3} className="w-full border rounded-lg px-3 py-2" placeholder="Opcional..." />
          </div>
        </div>
      </Modal>

      {/* Excluir */}
      <Modal
        open={uiModal.open && uiModal.kind === "delete"}
        onClose={closeModal}
        title="Excluir requisição"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button onClick={confirmDelete} className="px-4 py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 focus-visible:ring-2 ring-offset-2 ring-rose-400">
              Excluir
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-700">Tem certeza que deseja excluir esta requisição? Esta ação não poderá ser desfeita.</p>
      </Modal>

      {/* Ver detalhes */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={`Detalhes — ${viewReq?.req_codigo ?? viewReq?.codigo ?? `#${viewReq?.req_id ?? ""}`}`}
        maxWidth="max-w-4xl"
      >
        {viewReq ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Código</div>
                <div className="font-medium">{viewReq.req_codigo ?? viewReq.codigo ?? `#${viewReq.req_id}`}</div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <div className="mt-0.5"><StatusChip status={viewReq.req_status} /></div>
              </div>
              <div>
                <div className="text-gray-500">Criada em</div>
                <div className="font-medium">
                  {
                    // tenta várias chaves comuns do backend
                    parseDateSafe(
                      viewReq.req_created_at ||
                      viewReq.createdAt ||
                      viewReq.req_data ||
                      (viewReq.req_date && !viewReq.req_needed_at ? viewReq.req_date : null)
                    )
                  }
                </div>
              </div>
              <div>
                <div className="text-gray-500">Necessário em</div>
                <div className="font-medium">
                  {parseDateSafe(viewReq.req_needed_at || viewReq.req_neededAt || null)}
                </div>
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Item</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Material</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Solicitado</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Atendido</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Devolvido</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewReq.itens ?? []).map((it, i) => (
                    <tr key={it.rqi_id ?? i} className="border-t">
                      <td className="px-3 py-2">#{it.rqi_id ?? i + 1}</td>
                      <td className="px-3 py-2">{materialNome(it.rqi_fk_material)}</td>
                      <td className="px-3 py-2">{it.rqi_quantidade}</td>
                      <td className="px-3 py-2">{it.rqi_qtd_atendida || 0}</td>
                      <td className="px-3 py-2">{it.rqi_qtd_devolvida || 0}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">{it.rqi_status || "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(viewReq.req_justificativa || viewReq.req_observacoes || viewReq.req_local_entrega) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Local de entrega</div>
                  <div className="font-medium">{viewReq.req_local_entrega || "—"}</div>
                </div>
                <div className="md:col-span-1">
                  <div className="text-gray-500">Justificativa</div>
                  <div className="font-medium">{viewReq.req_justificativa || "—"}</div>
                </div>
                <div className="md:col-span-1">
                  <div className="text-gray-500">Observações</div>
                  <div className="font-medium">{viewReq.req_observacoes || "—"}</div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </main>
  );
}
