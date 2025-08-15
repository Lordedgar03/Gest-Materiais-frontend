// src/pages/Requisicoes.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FileText,
  CheckCircle,
  XCircle,
  PlusCircle,
  X,
  AlertCircle,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronRight,
  PackagePlus,
  CornerDownRight,
  Undo2,
  Shield
} from "lucide-react";

const statusColors = {
  Pendente: "bg-yellow-100 text-yellow-800",
  Aprovada: "bg-green-100 text-green-800",
  Rejeitada: "bg-red-100 text-red-800",
  Cancelada: "bg-gray-100 text-gray-700",
  Parcial: "bg-blue-100 text-blue-800",
  "Em Uso": "bg-indigo-100 text-indigo-800",
  Atendida: "bg-emerald-100 text-emerald-800",
  Devolvida: "bg-teal-100 text-teal-800"
};

/** Axios com interceptor para sempre enviar o token atual */
const api = axios.create({
  baseURL: "http://localhost:3000/api"
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      // opcional: redirecionar para login
      console.warn("Sessão expirada ou não autenticado.");
    }
    return Promise.reject(err);
  }
);

function parseJwtSafe(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function Requisicoes() {
  // Dados
  const [requisicoes, setRequisicoes] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // UI
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterMaterial, setFilterMaterial] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form: cabeçalho
  const [formNeededAt, setFormNeededAt] = useState("");
  const [formLocalEntrega, setFormLocalEntrega] = useState("");
  const [formJustificativa, setFormJustificativa] = useState("");
  const [formObservacoes, setFormObservacoes] = useState("");

  // Form: itens
  const [itemMaterial, setItemMaterial] = useState("");
  const [itemQuantidade, setItemQuantidade] = useState(1);
  const [itemDescricao, setItemDescricao] = useState("");
  const [itens, setItens] = useState([]);

  // Auth & Permissões
  const [currentUser, setCurrentUser] = useState({ id: null, nome: null, email: null });
  const [canViewUsers, setCanViewUsers] = useState(false);
  const [allowedCategoryIds, setAllowedCategoryIds] = useState([]); // [cat_id, ...]
  const [hasGlobalManageCategory, setHasGlobalManageCategory] = useState(false); // manage_category sem resource_id

  // Decode JWT e extrai permissões
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const payload = parseJwtSafe(token);
    const uid = payload.id ?? payload.user_id ?? payload.userId ?? null;
    setCurrentUser({ id: uid, nome: payload.nome || payload.name || null, email: payload.email || null });

    // ver usuários (lista nomes)
    const hasUserView =
      Array.isArray(payload.permissoes) &&
      payload.permissoes.some((p) => p.modulo === "utilizador" && p.acao === "visualizar");
    setCanViewUsers(hasUserView);

    // templates → allowedCategoryIds + hasGlobalManageCategory
    const tpls = Array.isArray(payload.templates) ? payload.templates : [];
    const allowed = tpls
      .filter((t) => t.template_code === "manage_category" && t.resource_id != null)
      .map((t) => Number(t.resource_id))
      .filter(Boolean);
    setAllowedCategoryIds(allowed);

    const hasGlobal = tpls.some(
      (t) => t.template_code === "manage_category" && (t.resource_id === null || t.resource_id === undefined)
    );
    setHasGlobalManageCategory(hasGlobal);
  }, []);

  // Fetch
  useEffect(() => {
    if (currentUser.id === null) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id, canViewUsers]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const calls = [
        api.get("/requisicoes", { params: { includeItems: true } }),
        api.get("/materiais"),
        api.get("/tipos")
      ];
      if (canViewUsers) calls.push(api.get("/users"));
      const [reqRes, matRes, tipRes, userRes] = await Promise.all(calls);
      setRequisicoes(reqRes.data || []);
      setMateriais(matRes.data || []);
      setTipos(tipRes.data || []);
      if (canViewUsers) setUsuarios(userRes?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const materialNome = (id) => materiais.find((m) => m.mat_id === id)?.mat_nome || `#${id}`;
  const tipoById = (id) => tipos.find((t) => t.tipo_id === id);
  const categoriaIdDoMaterial = (mat) => {
    const t = tipoById(mat.mat_fk_tipo);
    return t ? Number(t.tipo_fk_categoria) : null;
  };

  // ====== PERMISSÕES NO FRONT ======
  // Pode operar (aprovar/atender/devolver/alterar status) se:
  // - tem acesso global manage_category, OU
  // - allowedCategoryIds contém TODAS as categorias dos itens.
  const canOperateReq = (req) => {
    if (hasGlobalManageCategory) return true;
    if (!allowedCategoryIds || allowedCategoryIds.length === 0) return false;
    if (!Array.isArray(req.itens) || req.itens.length === 0) return false;

    for (const it of req.itens) {
      const mat = materiais.find((m) => m.mat_id === it.rqi_fk_material);
      if (!mat) return false;
      const catId = categoriaIdDoMaterial(mat);
      if (!catId || !allowedCategoryIds.includes(catId)) return false;
    }
    return true;
  };

  // Filtro visual: se não tem categorias e não é global, mostra só as próprias
  const baseList =
    !hasGlobalManageCategory && allowedCategoryIds.length === 0
      ? requisicoes.filter((r) => r.req_fk_user === currentUser.id)
      : requisicoes;

  // Filtros Status + Material
  const filtered = useMemo(() => {
    return baseList.filter((r) => {
      const okStatus = filterStatus === "Todos" || r.req_status === filterStatus;
      const okMaterial =
        filterMaterial === "Todos"
          ? true
          : Array.isArray(r.itens) &&
            r.itens.some((it) => it.rqi_fk_material === parseInt(filterMaterial, 10));
      return okStatus && okMaterial;
    });
  }, [baseList, filterStatus, filterMaterial]);

  // Form itens
  const addItem = () => {
    if (!itemMaterial) {
      setError("Selecione um material para adicionar ao item.");
      return;
    }
    if (!itemQuantidade || Number(itemQuantidade) <= 0) {
      setError("Informe uma quantidade válida (>0).");
      return;
    }
    const novo = {
      rqi_fk_material: parseInt(itemMaterial, 10),
      rqi_quantidade: parseInt(itemQuantidade, 10),
      rqi_descricao: itemDescricao.trim() || null
    };
    setItens((list) => [...list, novo]);
    setItemMaterial("");
    setItemQuantidade(1);
    setItemDescricao("");
    setError(null);
  };
  const removeItem = (idx) => setItens((l) => l.filter((_, i) => i !== idx));

  // Criar
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (itens.length === 0) {
      setError("Adicione pelo menos um item à requisição.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await api.post("/requisicoes", {
        req_fk_user: currentUser.id,
        req_needed_at: formNeededAt || null,
        req_local_entrega: formLocalEntrega.trim() || null,
        req_justificativa: formJustificativa.trim() || null,
        req_observacoes: formObservacoes.trim() || null,
        itens
      });
      setFormNeededAt("");
      setFormLocalEntrega("");
      setFormJustificativa("");
      setFormObservacoes("");
      setItens([]);
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao criar requisição");
    } finally {
      setSubmitting(false);
    }
  };

  // Decidir
  const decidir = async (req_id, tipo) => {
    const motivo =
      tipo !== "Aprovar"
        ? window.prompt(`Informe um motivo para ${tipo.toLowerCase()} (opcional):`, "")
        : "";
    try {
      setLoading(true);
      await api.post(`/requisicoes/${req_id}/decidir`, {
        tipo,
        motivo: motivo?.trim() || null
      });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao registrar decisão");
    } finally {
      setLoading(false);
    }
  };

  // Alterar status (atalho admin)
  const handleStatusUpdate = async (id, status) => {
    try {
      setLoading(true);
      await api.put(`/requisicoes/${id}/status`, { req_status: status });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao atualizar status");
    } finally {
      setLoading(false);
    }
  };

  // Atender
  const atenderItem = async (req, item) => {
    const max = item.rqi_quantidade - item.rqi_qtd_atendida;
    const ans = window.prompt(
      `Atender item #${item.rqi_id} (${materialNome(item.rqi_fk_material)})\nRestante: ${max}. Informe a quantidade (1..${max}):`,
      String(Math.max(1, max))
    );
    if (ans === null) return;
    const q = parseInt(ans, 10);
    if (!q || q <= 0 || q > max) {
      setError("Quantidade inválida para atendimento.");
      return;
    }
    try {
      setLoading(true);
      await api.post(`/requisicoes/${req.req_id}/atender`, {
        itens: [{ rqi_id: item.rqi_id, quantidade: q }]
      });
      fetchAll();
      setExpanded((ex) => ({ ...ex, [req.req_id]: true }));
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao atender item");
    } finally {
      setLoading(false);
    }
  };

  // Devolver
  const devolverItem = async (req, item) => {
    const emUso = item.rqi_qtd_atendida - item.rqi_qtd_devolvida;
    if (emUso <= 0) {
      setError("Nada a devolver neste item.");
      return;
    }
    const ans = window.prompt(
      `Devolver item #${item.rqi_id} (${materialNome(item.rqi_fk_material)})\nEm uso: ${emUso}. Informe a quantidade (1..${emUso}):`,
      String(Math.max(1, emUso))
    );
    if (ans === null) return;
    const q = parseInt(ans, 10);
    if (!q || q <= 0 || q > emUso) {
      setError("Quantidade inválida para devolução.");
      return;
    }
    const cond = window.prompt('Condição ao retornar? ("Boa", "Danificada" ou "Perdida")', "Boa");
    const condOk = ["Boa", "Danificada", "Perdida"].includes(cond || "");
    const obs = window.prompt("Observações da devolução (opcional):", "") || "";

    try {
      setLoading(true);
      await api.post(`/requisicoes/${req.req_id}/devolver`, {
        itens: [
          {
            rqi_id: item.rqi_id,
            quantidade: q,
            condicao: condOk ? cond : undefined,
            obs: obs?.trim() || undefined
          }
        ]
      });
      fetchAll();
      setExpanded((ex) => ({ ...ex, [req.req_id]: true }));
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao devolver item");
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Excluir esta requisição?")) return;
    try {
      setLoading(true);
      await api.delete(`/requisicoes/${id}`);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao excluir requisição");
    } finally {
      setLoading(false);
    }
  };

  // Loading/Erro
  if (loading && filtered.length === 0) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 size={32} className="animate-spin text-[#6C63FF]" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 bg-red-100 text-red-700 rounded flex items-center gap-2">
        <AlertCircle size={20} />
        {error}
      </div>
    );
  }

  const renderActionBtn = (enabled, onClick, title, className, Icon) => (
    <button
      onClick={enabled ? onClick : undefined}
      className={`${enabled ? className : "text-gray-300 cursor-not-allowed"}`}
      title={title}
      disabled={!enabled}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div className="p-6 text-gray-800">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-3xl font-bold text-[#5548D9] flex items-center gap-2">
          <FileText size={28} /> Gestão de Requisições
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded text-white ${
            showForm ? "bg-red-600 hover:bg-red-700" : "bg-[#6C63FF] hover:bg-[#5548D9]"
          }`}
        >
          {showForm ? (
            <>
              <X size={18} /> Cancelar
            </>
          ) : (
            <>
              <PlusCircle size={18} /> Nova Requisição
            </>
          )}
        </button>
      </div>

      {/* Banner de Permissões */}
      <div
        className={`mb-6 rounded p-3 flex items-start gap-3 ${
          hasGlobalManageCategory || allowedCategoryIds.length > 0
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-blue-50 border border-blue-200 text-blue-800"
        }`}
      >
        <Shield className="mt-0.5" />
        <div className="text-sm">
          {hasGlobalManageCategory || allowedCategoryIds.length > 0 ? (
            <>
              <div className="font-semibold">Permissões de Categoria Ativas</div>
              <div>
                Você pode <b>aprovar/cancelar/rejeitar</b> e também <b>atender/devolver</b> apenas
                requisições cujos itens pertençam às suas categorias autorizadas.
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold">Permissões Limitadas</div>
              <div>
                Você <b>pode criar e ver</b> as suas requisições. Aprovação, atendimento e devolução
                não estão disponíveis para o seu perfil.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Formulário (cabeçalho + itens) */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded shadow p-6 mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          <div className="lg:col-span-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <PackagePlus size={18} /> Nova Requisição
            </h2>
          </div>

          <div>
            <label className="block text-sm mb-1">Necessário em</label>
            <input
              type="date"
              value={formNeededAt}
              onChange={(e) => setFormNeededAt(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Local de Entrega</label>
            <input
              type="text"
              value={formLocalEntrega}
              onChange={(e) => setFormLocalEntrega(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Justificativa</label>
            <input
              type="text"
              value={formJustificativa}
              onChange={(e) => setFormJustificativa(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-sm mb-1">Observações</label>
            <input
              type="text"
              value={formObservacoes}
              onChange={(e) => setFormObservacoes(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          {/* Itens */}
          <div className="lg:col-span-3 border-t pt-4">
            <h3 className="font-semibold mb-2">Itens</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={itemMaterial}
                onChange={(e) => setItemMaterial(e.target.value)}
                className="border p-2 rounded w-full"
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
                onChange={(e) => setItemQuantidade(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="Quantidade"
              />

              <input
                type="text"
                value={itemDescricao}
                onChange={(e) => setItemDescricao(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="Observação do item (opcional)"
              />

              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-[#6C63FF] hover:bg-[#5548D9] text-white rounded flex items-center gap-2 justify-center"
              >
                <CornerDownRight size={16} /> Adicionar Item
              </button>
            </div>

            {itens.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-4">Material</th>
                      <th className="py-2 pr-4">Quantidade</th>
                      <th className="py-2 pr-4">Descrição</th>
                      <th className="py-2 pr-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((it, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 pr-4">{materialNome(it.rqi_fk_material)}</td>
                        <td className="py-2 pr-4">{it.rqi_quantidade}</td>
                        <td className="py-2 pr-4">{it.rqi_descricao || "-"}</td>
                        <td className="py-2 pr-4">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-red-600 hover:text-red-800"
                            title="Remover item"
                          >
                            <X />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#6C63FF] hover:bg-[#5548D9] text-white rounded flex items-center gap-2 disabled:opacity-70"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />} Enviar
            </button>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="Todos">Todos</option>
            {[
              "Pendente",
              "Aprovada",
              "Atendida",
              "Em Uso",
              "Parcial",
              "Devolvida",
              "Rejeitada",
              "Cancelada"
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Material (em qualquer item)</label>
          <select
            value={filterMaterial}
            onChange={(e) => setFilterMaterial(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="Todos">Todos</option>
            {materiais.map((m) => (
              <option key={m.mat_id} value={m.mat_id}>
                {m.mat_nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#ECECFF]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium w-10"></th>
              <th className="px-4 py-3 text-left text-xs font-medium">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium">Data</th>
              {canViewUsers && (
                <th className="px-4 py-3 text-left text-xs font-medium">Usuário</th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium">Itens</th>
              <th className="px-4 py-3 text-left text-xs font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length > 0 ? (
              filtered.map((req) => {
                const isOpen = !!expanded[req.req_id];
                const mayOperate = canOperateReq(req);

                return (
                  <React.Fragment key={req.req_id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            setExpanded((ex) => ({ ...ex, [req.req_id]: !ex[req.req_id] }))
                          }
                          className="text-gray-600 hover:text-gray-900"
                          title={isOpen ? "Recolher" : "Expandir"}
                        >
                          {isOpen ? <ChevronDown /> : <ChevronRight />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {req.req_codigo || `#${req.req_id}`}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statusColors[req.req_status] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {req.req_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {req.req_date ? new Date(req.req_date).toLocaleString() : "-"}
                      </td>
                      {canViewUsers && (
                        <td className="px-4 py-3 text-sm">
                          {usuarios.find((u) => u.user_id === req.req_fk_user)?.user_nome ||
                            `#${req.req_fk_user}`}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm">
                        {Array.isArray(req.itens) ? req.itens.length : 0}
                      </td>
                      <td className="px-4 py-3 text-sm flex gap-2">
                        {/* Decisões: só se Pendente */}
                        {renderActionBtn(
                          req.req_status === "Pendente" && mayOperate,
                          () => decidir(req.req_id, "Aprovar"),
                          "Aprovar",
                          "text-green-600 hover:text-green-900",
                          CheckCircle
                        )}
                        {renderActionBtn(
                          req.req_status === "Pendente" && mayOperate,
                          () => decidir(req.req_id, "Rejeitar"),
                          "Rejeitar",
                          "text-red-600 hover:text-red-900",
                          XCircle
                        )}
                        {renderActionBtn(
                          req.req_status === "Pendente" && mayOperate,
                          () => decidir(req.req_id, "Cancelar"),
                          "Cancelar",
                          "text-gray-600 hover:text-gray-900",
                          X
                        )}

                        {/* Atalho admin: Marcar Em Uso (se permitido e não cancelada/rejeitada) */}
                        {renderActionBtn(
                          mayOperate &&
                            req.req_status !== "Cancelada" &&
                            req.req_status !== "Rejeitada",
                          () => handleStatusUpdate(req.req_id, "Em Uso"),
                          "Marcar Em Uso",
                          "text-indigo-600 hover:text-indigo-900",
                          Undo2
                        )}

                        {/* Delete: permitido exibir; backend valida e registra reciclagem */}
                        {renderActionBtn(
                          true,
                          () => handleDelete(req.req_id),
                          "Excluir requisição",
                          "text-gray-600 hover:text-gray-900",
                          Trash2
                        )}
                      </td>
                    </tr>

                    {/* Detalhes */}
                    {isOpen && (
                      <tr className="bg-gray-50">
                        <td colSpan={canViewUsers ? 7 : 6} className="px-6 py-4">
                          {Array.isArray(req.itens) && req.itens.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-left text-gray-600">
                                    <th className="py-2 pr-4">Item</th>
                                    <th className="py-2 pr-4">Material</th>
                                    <th className="py-2 pr-4">Solicitado</th>
                                    <th className="py-2 pr-4">Atendido</th>
                                    <th className="py-2 pr-4">Devolvido</th>
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2 pr-4">Ações</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {req.itens.map((it) => {
                                    const restante = it.rqi_quantidade - it.rqi_qtd_atendida;
                                    const emUso = it.rqi_qtd_atendida - it.rqi_qtd_devolvida;
                                    const canOp = mayOperate;
                                    return (
                                      <tr key={it.rqi_id} className="border-t">
                                        <td className="py-2 pr-4">#{it.rqi_id}</td>
                                        <td className="py-2 pr-4">
                                          {materialNome(it.rqi_fk_material)}
                                          {it.rqi_descricao ? (
                                            <span className="block text-xs text-gray-500">
                                              {it.rqi_descricao}
                                            </span>
                                          ) : null}
                                        </td>
                                        <td className="py-2 pr-4">{it.rqi_quantidade}</td>
                                        <td className="py-2 pr-4">{it.rqi_qtd_atendida}</td>
                                        <td className="py-2 pr-4">{it.rqi_qtd_devolvida}</td>
                                        <td className="py-2 pr-4">
                                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                                            {it.rqi_status}
                                          </span>
                                        </td>
                                        <td className="py-2 pr-4 flex gap-2">
                                          {renderActionBtn(
                                            restante > 0 && canOp,
                                            () => atenderItem(req, it),
                                            "Atender (saída)",
                                            "text-blue-600 hover:text-blue-900",
                                            CheckCircle
                                          )}
                                          {renderActionBtn(
                                            emUso > 0 && canOp,
                                            () => devolverItem(req, it),
                                            "Devolver (entrada)",
                                            "text-teal-600 hover:text-teal-900",
                                            Undo2
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-gray-600">Sem itens.</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={canViewUsers ? 7 : 6} className="p-6 text-center text-gray-500">
                  Nenhuma requisição encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Requisicoes;
