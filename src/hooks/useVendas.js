// src/hooks/useVendas.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";

/* ===== helpers: JWT & permissão ===== */
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/** true se for admin OU possuir manage_sales */
function hasManageSales(decoded) {
  if (!decoded) return false;

  const roles = decoded.roles || [];
  if (decoded.is_admin === true || roles.includes("admin")) return true;

  const rawPerms = []
    .concat(decoded.permissions || [])
    .concat(decoded.perms || [])
    .concat(decoded.scopes || [])
    .concat(decoded.actions || [])
    .concat(decoded.allowed || []);

  const normPerms = new Set(
    rawPerms
      .map((p) => {
        if (typeof p === "string") return p.toLowerCase();
        if (p && typeof p === "object") {
          const cand = p.code || p.name || p.action_code || p.actionCode || p.permission;
          return cand ? String(cand).toLowerCase() : "";
        }
        return "";
      })
      .filter(Boolean)
  );
  if (normPerms.has("manage_sales")) return true;

  const templates = Array.isArray(decoded.templates) ? decoded.templates : [];
  const hasTemplate = templates.some((t) => {
    const cand = t?.template_code || t?.code || t?.name || t?.permission || t?.action_code || t?.actionCode;
    return String(cand || "").toLowerCase() === "manage_sales";
  });

  return hasTemplate;
}

/* ===== hook ===== */
export function useVendas() {
  // Gate
  const decodedRef = useRef(null);
  if (!decodedRef.current && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    decodedRef.current = token ? parseJwt(token) : {};
  }
  const decoded = decodedRef.current || {};
  const allowed = hasManageSales(decoded);

  // listagem / filtros / paginação
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);

  // modais
  const [viewOpen, setViewOpen] = useState(false);
  const [viewSale, setViewSale] = useState(null);

  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");

  // boot
  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  useEffect(() => {
    setPage(1);
  }, [q, status, from, to, perPage]);

  const loadList = async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (status !== "Todos") params.status = status;
      if (from) params.from = from;
      if (to) params.to = to;
      const r = await api.get("/vendas", { params });
      setList(Array.isArray(r.data) ? r.data : r.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  const onApplyFilters = () => loadList();
  const clearFilters = () => {
    setStatus("Todos");
    setFrom("");
    setTo("");
    setQ("");
    loadList();
  };

  const filtered = useMemo(() => list, [list]); // API já filtra
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );

  const fmt = (n) => Number(n || 0).toLocaleString("pt-PT", { style: "currency", currency: "STN" });

  // detalhes / ações
const openView = async (sale) => {
  // 1) busca a venda com itens
  const r = await api.get(`/vendas/${sale.ven_id}`);
  const data = r.data || sale;

  /* ---------- (A) Resolver NOME DO CLIENTE ---------- */
  // tenta achar um nome já presente
  let clienteNome =
    data.ven_cliente_nome ||
    data.cliente_nome ||
    data.cliente?.nome ||
    data.cliente?.cli_nome ||
    null;

  // tenta achar um id do cliente em algum campo comum
  const clienteId =
    data.ven_fk_cliente ??
    data.cliente_id ??
    data.ven_cliente_id ??
    data.cliente?.cli_id ??
    null;

  // se não houver nome mas houver id, busca na API de clientes
  if (!clienteNome && clienteId) {
    try {
      const cr = await api.get(`/clientes/${clienteId}`);
      const c = cr?.data || {};
      clienteNome =
        c.cli_nome ||
        c.nome ||
        c.full_name ||
        c.displayName ||
        `Cliente #${clienteId}`;
    } catch (_) {
      clienteNome = `Cliente #${clienteId}`;
    }
  }

  /* ---------- (B) Resolver NOMES DOS ITENS ---------- */
  const itens = Array.isArray(data.itens) ? data.itens : (data.vendaItens || []);
  const missing = [...new Set(
    itens
      .filter(it =>
        !(it.vni_material_nome || it.material_nome || it.nome || it.mat_nome) &&
        (it.vni_fk_material || it.mat_id || it.material_id)
      )
      .map(it => Number(it.vni_fk_material || it.mat_id || it.material_id))
  )].filter(Boolean);

  const nameMap = new Map();
  if (missing.length) {
    await Promise.all(missing.map(async (id) => {
      try {
        const mr = await api.get(`/materiais/${id}`);
        const m = mr?.data || {};
        if (m.mat_nome) nameMap.set(id, m.mat_nome);
      } catch (_) { /* ignora */ }
    }));
  }

  const itensComNome = itens.map(it => {
    const id = Number(it.vni_fk_material || it.mat_id || it.material_id);
    const resolvedName =
      it.vni_material_nome || it.material_nome || it.nome || it.mat_nome || nameMap.get(id) || null;
    return { ...it, vni_material_nome: resolvedName, _mat_id: id };
  });

  // 2) aplica no estado e abre modal
  setViewSale({
    ...data,
    ven_cliente_nome: clienteNome || data.ven_cliente_nome || null,
    _cliente_id: clienteId || null,
    itens: itensComNome
  });
  setViewOpen(true);
};

  const openCancel = (sale) => {
    setViewSale(sale);
    setReason("");
    setReasonOpen(true);
  };

  const applyCancel = async () => {
    if (!viewSale) return;
    await api.post(`/vendas/${viewSale.ven_id}/cancelar`, { motivo: reason || null });
    setReasonOpen(false);
    setViewSale(null);
    await loadList();
  };

  // recibo
  const gerarRecibo = async (sale) => {
    try {
      await api.post(`/vendas/${sale.ven_id}/recibo`);
    } catch {
      // se o serviço exigir gerar+retornar id, ignoramos
    }
  };

  const abrirReciboPdf = async (sale) => {
    try {
      // gera o PDF (caso ainda não exista)
      await api.post(`/vendas/${sale.ven_id}/recibo/pdf`);
      // abre o endpoint público de visualização
      // (o service mapeou GET /recibos/:id/pdf — se o ID do recibo == ven_id, mantenha;
      // se for diferente, ajuste conforme o serviço retornar)
      const url = `${location.origin}/api/recibos/${sale.ven_id}/pdf`;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      alert("Não foi possível gerar/abrir o PDF do recibo.");
    }
  };

  // exportação
  const exportXlsx = async () => {
    const rows = filtered.map((s) => ({
      Código: s.ven_codigo,
      Data: new Date(s.ven_data).toLocaleString("pt-PT"),
      Cliente: s.ven_cliente_nome,
      Subtotal: Number(s.ven_subtotal || 0),
      Desconto: Number(s.ven_desconto || 0),
      Total: Number(s.ven_total || 0),
      Status: s.ven_status,
    }));
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Vendas");
      XLSX.writeFile(wb, `vendas_${Date.now()}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("Falha ao exportar. Verifique se o pacote 'xlsx' está instalado.");
    }
  };

  return {
    // gate
    allowed,
    // carregamento
    loading,
    // dados
    list,
    filtered,
    current,
    // filtros
    showFilters,
    setShowFilters,
    q,
    setQ,
    status,
    setStatus,
    from,
    setFrom,
    to,
    setTo,
    // paginação
    page,
    setPage,
    perPage,
    setPerPage,
    pages,
    // fetch
    loadList,
    onApplyFilters,
    clearFilters,
    // utils
    fmt,
    // detalhes / ações
    viewOpen,
    setViewOpen,
    viewSale,
    setViewSale,
    openView,
    reasonOpen,
    setReasonOpen,
    reason,
    setReason,
    openCancel,
    applyCancel,
    // recibos
    gerarRecibo,
    abrirReciboPdf,
    // export
    exportXlsx,
  };
}

export default useVendas;
