"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";

/* ================= helpers: JWT & permissão ================= */
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/** true se for admin OU possuir manage_sales (em permissions/perms/scopes OU em templates) */
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
      .filter(Boolean),
  );
  if (normPerms.has("manage_sales")) return true;

  const templates = Array.isArray(decoded.templates) ? decoded.templates : [];
  const hasTemplate = templates.some((t) => {
    const cand = t?.template_code || t?.code || t?.name || t?.permission || t?.action_code || t?.actionCode;
    return String(cand || "").toLowerCase() === "manage_sales";
  });

  return hasTemplate;
}

/* ================= Hook ================= */
export function useVendas() {
  // --------- GATE de permissões ----------
  const decodedRef = useRef(null);
  if (!decodedRef.current && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    decodedRef.current = token ? parseJwt(token) : {};
  }
  const decoded = decodedRef.current || {};
  const allowed = hasManageSales(decoded);

  // --------- estados de listagem / filtros / paginação ----------
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);

  // --------- modais ----------
  const [viewOpen, setViewOpen] = useState(false);
  const [viewSale, setViewSale] = useState(null);

  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState(null); // "estorno" | "cancelar"

  // --------- carga inicial ----------
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

  const filtered = useMemo(() => list, [list]); // API já traz filtrado
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage],
  );

  const fmt = (n) => Number(n || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });

  // --------- detalhes / ações ----------
  const openView = async (sale) => {
    const r = await api.get(`/vendas/${sale.ven_id}`);
    setViewSale(r.data || sale);
    setViewOpen(true);
  };

  const openReason = (sale, type) => {
    setViewSale(sale);
    setActionType(type);
    setReason("");
    setReasonOpen(true);
  };

  const applyAction = async () => {
    if (!viewSale) return;
    if (actionType === "estorno") {
      await api.post(`/vendas/${viewSale.ven_id}/estornar`, { motivo: reason || null });
    } else {
      await api.post(`/vendas/${viewSale.ven_id}/cancelar`, { motivo: reason || null });
    }
    setReasonOpen(false);
    setViewSale(null);
    setActionType(null);
    await loadList();
  };

  // --------- exportação ----------
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
      alert("Falha ao exportar. Verifique se xlsx está instalado.");
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
    // ações de fetch
    loadList,
    onApplyFilters,
    clearFilters,
    // utils
    fmt,
    // detalhes / ações de venda
    viewOpen,
    setViewOpen,
    viewSale,
    setViewSale,
    openView,
    reasonOpen,
    setReasonOpen,
    reason,
    setReason,
    actionType,
    openReason,
    applyAction,
    // exportação
    exportXlsx,
  };
}

export default useVendas;
