// src/hooks/useRequisicao.js
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import api from "../api";

/* -------- UI helpers -------- */
export const statusColors = {
  Pendente: "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-800 border-yellow-200",
  Aprovada: "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200",
  Rejeitada: "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-200",
  Cancelada: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200",
  Parcial: "bg-gradient-to-r from-blue-50 to-sky-50 text-blue-800 border-blue-200",
  "Em Uso": "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-800 border-indigo-200",
  Atendida: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 border-emerald-200",
  Devolvida: "bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-800 border-teal-200",
};
export const statusIcons = {
  Pendente: "⏳",
  Aprovada: "✅",
  Rejeitada: "❌",
  Cancelada: "⚪",
  Parcial: "🔵",
  "Em Uso": "🟣",
  Atendida: "💚",
  Devolvida: "🔄",
};

/* -------- utils -------- */
const pickArray = (res) =>
  Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];

function parseJwtSafe(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

const asNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export function useRequisicao() {
  /* ===== Auth / templates / permissões ===== */
  const decodedRef = useRef(null);
  if (!decodedRef.current && typeof window !== "undefined") {
    const t = localStorage.getItem("token");
    decodedRef.current = t ? parseJwtSafe(t) : {};
  }
  const decoded = decodedRef.current || {};

  const currentUser = {
    id: decoded.id ?? decoded.user_id ?? decoded.userId ?? null,
    nome: decoded.user_nome ?? decoded.nome ?? decoded.name ?? null,
    email: decoded.email ?? null,
  };

  const rolesLS = useMemo(() => JSON.parse(localStorage.getItem("roles") || "[]"), []);
  const capsLS = useMemo(() => new Set(JSON.parse(localStorage.getItem("caps") || "[]")), []);
  const isAdmin = rolesLS.includes("admin");
  // module "usuario" como no TEMPLATE_TO_CAPS do useLogin
  const canViewUsers = isAdmin || capsLS.has("usuario:visualizar");

  const templates = Array.isArray(decoded.templates) ? decoded.templates : [];

  const allowedCategoryIds = templates
    .filter((t) => t.template_code === "manage_category" && t.resource_id != null && t.resource_id !== "")
    .map((t) => Number(t.resource_id))
    .filter((id) => Number.isFinite(id));

  const hasGlobalManageCategory = templates.some(
    (t) => t.template_code === "manage_category" && (t.resource_id == null || t.resource_id === "")
  );
  const hasManageCategory = hasGlobalManageCategory || allowedCategoryIds.length > 0;

  const hasManageSales =
    templates.some((t) => t.template_code === "manage_sales") ||
    (Array.isArray(decoded.permissoes) &&
      decoded.permissoes.some((p) => {
        const code =
          typeof p === "string"
            ? p
            : p?.acao || p?.code || p?.permissao || p?.action_code || p?.actionCode;
        return String(code || "") === "manage_sales";
      }));

  // espelho do canEdit (modulo=requisicoes, acao=editar) usado no backend ao atender
  const hasReqEdit =
    Array.isArray(decoded.permissoes) &&
    decoded.permissoes.some((p) => {
      if (!p || typeof p !== "object") return false;
      const modulo = p.modulo || p.module || p.mod || "";
      const acao = p.acao || p.action || p.permissao || p.code || "";
      return String(modulo) === "requisicoes" && String(acao) === "editar";
    });

  /* ===== Estado ===== */
  const [requisicoes, setRequisicoes] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [decisoes, setDecisoes] = useState([]);

  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterMaterial, setFilterMaterial] = useState("Todos");
  const [expanded, setExpanded] = useState({});

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // modal
  const [uiModal, setUiModal] = useState({ open: false, kind: null, payload: null });
  const closeModal = () => setUiModal({ open: false, kind: null, payload: null });

  // form (criação)
  const [formNeededAt, setFormNeededAt] = useState("");
  const [formLocalEntrega, setFormLocalEntrega] = useState("");
  const [formJustificativa, setFormJustificativa] = useState("");
  const [formObservacoes, setFormObservacoes] = useState("");
  const [itemMaterial, setItemMaterial] = useState("");
  const [itemQuantidade, setItemQuantidade] = useState(1);
  const [itemDescricao, setItemDescricao] = useState("");
  const [itens, setItens] = useState([]);

  /* ===== helpers ===== */
  const tipoById = (id) => tipos.find((t) => Number(t.tipo_id) === Number(id));
  const materialById = (id) => materiais.find((m) => Number(m.mat_id) === Number(id));
  const materialNome = (id) => materialById(id)?.mat_nome ?? `#${id}`;

  const categoriaIdDoMaterial = (mat) => {
    if (!mat) return null;
    const fkTipo = Number(mat.mat_fk_tipo ?? mat.tipo_id ?? 0);
    const t = tipoById(fkTipo);
    return t ? Number(t.tipo_fk_categoria) : null;
  };

  const isConsumivel = (matId) => {
    const m = materialById(Number(matId));
    const flag = String(m?.mat_consumivel ?? m?.consumivel ?? "").toLowerCase().trim();
    return flag === "sim" || flag === "true" || flag === "1";
  };

  const isVendavel = (matId) => {
    const m = materialById(Number(matId));
    const flag = String(m?.mat_vendavel ?? m?.vendavel ?? "").toUpperCase().trim();
    return flag === "SIM" || flag === "TRUE" || flag === "1";
  };

  const userById = (id) =>
    usuarios.find((u) => Number(u.id ?? u.user_id) === Number(id));

  const solicitanteId = (req) =>
    Number(req?.req_fk_user ?? req?.user_id ?? req?.req_user_id ?? req?.req_fk_utilizador ?? 0);

  const solicitanteNome = (req) => {
    if (!req) return null;
    // backend já preenche req_user_nome no list()
    if (req.req_user_nome) return req.req_user_nome;

    const direto =
      req?.user?.nome ||
      req?.user?.name ||
      req?.usuario?.nome ||
      req?.usuario?.name ||
      req?.req_user_nome ||
      req?.req_user_name ||
      null;

    if (direto) return direto;
    const id = solicitanteId(req);
    const u = id ? userById(id) : null;
    return u?.nome || u?.name || null;
  };

  const _reqItems = (req) => (Array.isArray(req?.itens) ? req.itens : []);

  // === helpers de permissão alinhados com backend ===

  // pode atender ESTE item?
  const canAttendItem = (req, item) => {
    if (!item) return false;
    const mat = materialById(item.rqi_fk_material);
    if (!mat) return false;

    const vendavel = isVendavel(mat.mat_id ?? item.rqi_fk_material);
    if (vendavel) {
      // vendável -> precisa manage_sales
      return !!hasManageSales;
    }

    // não vendável -> manage_category (global/categoria) ou requisicoes:editar
    if (hasGlobalManageCategory) return true;
    const catId = categoriaIdDoMaterial(mat);
    if (catId && allowedCategoryIds.includes(Number(catId))) return true;
    if (hasReqEdit) return true;

    return false;
  };

  // pode devolver ESTE item?
  const canReturnItem = (req, item) => {
    if (!item) return false;
    const mat = materialById(item.rqi_fk_material);
    if (!mat) return false;

    // backend: vendável e consumível não podem ser devolvidos
    if (isVendavel(mat.mat_id ?? item.rqi_fk_material)) return false;
    if (isConsumivel(mat.mat_id ?? item.rqi_fk_material)) return false;

    if (hasGlobalManageCategory) return true;
    const catId = categoriaIdDoMaterial(mat);
    if (catId && allowedCategoryIds.includes(Number(catId))) return true;

    return false;
  };

  // pode decidir (Aprovar/Rejeitar/Cancelar) esta requisição?
  const canDecideReq = (req) => {
    if (!req) return false;
    const items = _reqItems(req);
    if (!items.length) return false;

    if (hasGlobalManageCategory) return true;
    if (!allowedCategoryIds.length) return false;

    // backend exige manage_category para TODAS as categorias da requisição
    for (const it of items) {
      const mat = materialById(it.rqi_fk_material);
      if (!mat) return false;
      const catId = categoriaIdDoMaterial(mat);
      if (!catId || !allowedCategoryIds.includes(Number(catId))) {
        return false;
      }
    }
    return true;
  };

  // visão agregada: tem alguma operação possível (atender/devolver) nesta requisição?
  const canOperateReq = (req, item) => {
    if (item) {
      return canAttendItem(req, item) || canReturnItem(req, item);
    }
    const items = _reqItems(req);
    return items.some((it) => canAttendItem(req, it) || canReturnItem(req, it));
  };

  const aprovadorPorReq = useMemo(() => {
    const map = new Map();
    for (const d of decisoes) {
      if (d.dec_tipo === "Aprovar" && d.dec_fk_requisicao != null) {
        map.set(Number(d.dec_fk_requisicao), Number(d.dec_fk_user));
      }
    }
    return map;
  }, [decisoes]);

  const isAprovadorDaRequisicao = (req) => {
    const aprovador = aprovadorPorReq.get(Number(req.req_id));
    return aprovador != null && Number(aprovador) === Number(currentUser.id);
  };

  /* ===== Fetch ===== */

  const normalizeReq = (r) => {
    // backend já devolve plain objects (raw: true), mas mantemos normalização defensiva
    const rr = r?.toJSON ? r.toJSON() : r?.dataValues ? r.dataValues : r || {};
    const items = Array.isArray(rr.itens)
      ? rr.itens.map((it) => (it?.toJSON ? it.toJSON() : it?.dataValues ?? it))
      : [];
    const decs = Array.isArray(rr.decisoes)
      ? rr.decisoes.map((d) => (d?.toJSON ? d.toJSON() : d?.dataValues ?? d))
      : [];
    return { ...rr, itens: items, decisoes: decs };
  };

  const refetchRequisicoes = useCallback(async () => {
    const rr = await api.get("/requisicoes", {
      params: { includeItems: true, includeDecisions: true },
    });
    const list = pickArray(rr).map(normalizeReq);
    setRequisicoes(list);
    setDecisoes(list.flatMap((x) => x.decisoes || []));
    return list;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (currentUser.id == null) return;
      setLoading(true);
      setError(null);
      try {
        const [reqRes, matRes, tipoRes, usrRes] = await Promise.all([
          api.get("/requisicoes", { params: { includeItems: true, includeDecisions: true } }),
          api.get("/materiais"),
          api.get("/tipos"),
          canViewUsers ? api.get("/users") : Promise.resolve({ data: [] }),
        ]);
        const reqs = pickArray(reqRes).map(normalizeReq);
        const mats = pickArray(matRes);
        const tps = pickArray(tipoRes);
        const usrs = pickArray(usrRes);

        if (!alive) return;
        setRequisicoes(reqs);
        setMateriais(mats);
        setTipos(tps);
        setUsuarios(canViewUsers ? usrs : []);
        setDecisoes(reqs.flatMap((r) => r.decisoes || []));
      } catch (e) {
        console.error("fetchAll error:", e);
        if (alive) setError(e?.response?.data?.message || e.message || "Erro ao carregar dados.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===== Criação ===== */
  const addItem = () => {
    const q = asNum(itemQuantidade, -1);
    if (!itemMaterial) return setError("Selecione um material.");
    if (!Number.isFinite(q) || q <= 0) return setError("Informe uma quantidade válida (>0).");
    setItens((l) => [
      ...l,
      {
        rqi_fk_material: Number(itemMaterial),
        rqi_quantidade: q,
        rqi_descricao: itemDescricao.trim() || null,
      },
    ]);
    setItemMaterial("");
    setItemQuantidade(1);
    setItemDescricao("");
    setError(null);
  };

  const removeItem = (idx) => setItens((l) => l.filter((_, i) => i !== idx));

  const submitRequisicao = async (e) => {
    e?.preventDefault?.();
    if (!itens.length) return setError("Adicione pelo menos um item.");
    try {
      setSubmitting(true);
      setError(null);
      await api.post("/requisicoes", {
        req_fk_user: currentUser.id,
        req_needed_at: formNeededAt || null,
        req_local_entrega: formLocalEntrega.trim() || null,
        req_justificativa: formJustificativa.trim() || null,
        req_observacoes: formObservacoes.trim() || null,
        itens,
      });
      setFormNeededAt("");
      setFormLocalEntrega("");
      setFormJustificativa("");
      setFormObservacoes("");
      setItens([]);
      setShowForm(false);
      await refetchRequisicoes();
    } catch (err) {
      console.error("create error:", err);
      setError(err?.response?.data?.message || err.message || "Erro ao criar requisição.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ===== Modais (aberturas) ===== */
  const openDecision = (req, tipo) => {
    if (!req) return;
    const st = String(req.req_status || "");
    // regra de negócio: só Pendente pode receber decisão
    if (st !== "Pendente") {
      setError("Apenas requisições Pendentes podem receber decisão.");
      return;
    }
    if (!canDecideReq(req)) {
      setError("Sem permissão para decidir esta requisição.");
      return;
    }
    setUiModal({ open: true, kind: "decisao", payload: { reqId: req.req_id, tipo } });
  };

  const openAtender = (req, item) => {
    const st = String(req.req_status || "");
    const restante = asNum(item?.rqi_quantidade) - asNum(item?.rqi_qtd_atendida);
    if (!["Aprovada", "Parcial", "Em Uso"].includes(st)) {
      setError("Esta requisição não pode ser atendida neste estado.");
      return;
    }
    if (restante <= 0) {
      setError("Não há quantidade restante para atender.");
      return;
    }
    if (!canAttendItem(req, item)) {
      setError("Sem permissão para atender este item.");
      return;
    }
    setUiModal({
      open: true,
      kind: "atender",
      payload: { reqId: req.req_id, itemId: item.rqi_id, restante },
    });
  };

  const openDevolver = (req, item) => {
    const st = String(req.req_status || "");
    const emUso = asNum(item?.rqi_qtd_atendida) - asNum(item?.rqi_qtd_devolvida);
    if (!["Em Uso", "Parcial", "Atendida"].includes(st)) {
      setError("Devolução não permitida neste estado.");
      return;
    }
    if (emUso <= 0) {
      setError("Nada a devolver.");
      return;
    }
    if (isVendavel(item?.rqi_fk_material)) {
      setError("Material vendável não pode ser devolvido.");
      return;
    }
    if (isConsumivel(item?.rqi_fk_material)) {
      setError("Material consumível não aceita devolução.");
      return;
    }
    if (!canReturnItem(req, item)) {
      setError("Sem permissão para aprovar a devolução.");
      return;
    }
    setUiModal({
      open: true,
      kind: "devolver",
      payload: { reqId: req.req_id, itemId: item.rqi_id, emUso },
    });
  };

  const openDelete = (reqId) => setUiModal({ open: true, kind: "delete", payload: { reqId } });

  /* ===== Confirmações (chamam backend) ===== */
  const confirmDecision = async ({ motivo = "" }) => {
    const { reqId, tipo } = uiModal.payload || {};
    if (!reqId || !tipo) return;
    try {
      setLoading(true);
      await api.post(`/requisicoes/${reqId}/decidir`, { tipo, motivo: motivo?.trim() || null });
      await refetchRequisicoes();
      closeModal();
    } catch (err) {
      console.error("decidir error:", err);
      setError(err?.response?.data?.message || err.message || "Erro ao registrar decisão.");
    } finally {
      setLoading(false);
    }
  };

  const confirmAtender = async ({ quantidade }) => {
    const { reqId, itemId, restante } = uiModal.payload || {};
    const q = asNum(quantidade, -1);
    if (!reqId || !itemId) return;
    if (!Number.isFinite(q) || q <= 0 || q > asNum(restante)) {
      setError("Quantidade inválida.");
      return;
    }
    try {
      setLoading(true);
      await api.post(`/requisicoes/${reqId}/atender`, { itens: [{ rqi_id: itemId, quantidade: q }] });
      await refetchRequisicoes();
      setExpanded((ex) => ({ ...ex, [reqId]: true }));
      closeModal();
    } catch (err) {
      console.error("atender error:", err);
      setError(err?.response?.data?.message || err.message || "Erro ao atender item.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDevolver = async ({ quantidade, condicao = "Boa", obs = "" }) => {
    const { reqId, itemId, emUso } = uiModal.payload || {};
    const q = asNum(quantidade, -1);
    if (!reqId || !itemId) return;
    if (!Number.isFinite(q) || q <= 0 || q > asNum(emUso)) {
      setError("Quantidade inválida.");
      return;
    }
    const condOk = ["Boa", "Danificada", "Perdida"].includes(condicao);
    try {
      setLoading(true);
      await api.post(`/requisicoes/${reqId}/devolver`, {
        itens: [
          {
            rqi_id: itemId,
            quantidade: q,
            condicao: condOk ? condicao : undefined,
            obs: obs?.trim() || undefined,
          },
        ],
      });
      await refetchRequisicoes();
      setExpanded((ex) => ({ ...ex, [reqId]: true }));
      closeModal();
    } catch (err) {
      console.error("devolver error:", err);
      setError(err?.response?.data?.message || err.message || "Erro ao devolver item.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    const { reqId } = uiModal.payload || {};
    if (!reqId) return;
    try {
      setLoading(true);
      await api.delete(`/requisicoes/${reqId}`);
      await refetchRequisicoes();
      closeModal();
    } catch (err) {
      console.error("delete error:", err);
      setError(err?.response?.data?.message || err.message || "Erro ao excluir.");
    } finally {
      setLoading(false);
    }
  };

  /* ===== Listas derivadas =====
     Quem define o escopo de requisições que o utilizador pode ver é o backend.
     Aqui só aplicamos filtros de UI (status e material) + ordenação.
  ================================= */
  const filtered = useMemo(() => {
    const sortDesc = (a, b) => {
      const idA = asNum(a.req_id);
      const idB = asNum(b.req_id);
      if (idA !== idB) return idB - idA;
      const da = new Date(a.createdAt || a.req_date || 0).getTime();
      const db = new Date(b.createdAt || b.req_date || 0).getTime();
      return db - da;
    };

    return requisicoes
      .filter((r) => {
        const okStatus = filterStatus === "Todos" || r.req_status === filterStatus;
        const okMaterial =
          filterMaterial === "Todos"
            ? true
            : Array.isArray(r.itens) &&
              r.itens.some((it) => asNum(it.rqi_fk_material) === asNum(filterMaterial));
        return okStatus && okMaterial;
      })
      .sort(sortDesc);
  }, [requisicoes, filterStatus, filterMaterial]);

  return {
    // identidade/perms
    currentUser,
    canViewUsers,
    isAdmin,
    allowedCategoryIds,
    hasGlobalManageCategory,
    hasManageCategory,

    // dados
    requisicoes,
    materiais,
    tipos,
    usuarios,
    filtered,
    decisoes,

    // ui
    loading,
    submitting,
    error,
    setError,
    showForm,
    setShowForm,
    expanded,
    setExpanded,

    // filtros
    filterStatus,
    setFilterStatus,
    filterMaterial,
    setFilterMaterial,

    // form criação
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

    // helpers
    materialNome,
    solicitanteNome,
    solicitanteId,
    isConsumivel,
    isVendavel,

    // modal + ações
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
    isAprovadorDaRequisicao,

    // fetch util
    refetchRequisicoes,
  };
}
