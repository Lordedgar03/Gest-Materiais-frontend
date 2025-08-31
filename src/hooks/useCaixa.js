"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";

/* ==================== Helpers ==================== */
const fmt = (n) =>
  Number(n || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });

const todayLocal = (tz = "Africa/Sao_Tome") =>
  new Date().toLocaleString("sv-SE", { timeZone: tz }).slice(0, 10);

// JWT + permissão (mesmo padrão do PDV/Vendas)
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}
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
    const cand =
      t?.template_code || t?.code || t?.name || t?.permission || t?.action_code || t?.actionCode;
    return String(cand || "").toLowerCase() === "manage_sales";
  });

  return hasTemplate;
}

/* ==================== Hook ==================== */
export function useCaixa() {
  /** Gate de permissão */
  const decodedRef = useRef(null);
  if (!decodedRef.current && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    decodedRef.current = token ? parseJwt(token) : {};
  }
  const allowed = hasManageSales(decodedRef.current || {});

  // Estado
  const [cash, setCash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openOpenModal, setOpenOpenModal] = useState(false);
  const [openCloseModal, setOpenCloseModal] = useState(false);
  const [initialBalance, setInitialBalance] = useState("");
  const [toast, setToast] = useState("");
  const [salesToday, setSalesToday] = useState([]);

  const isAberto = cash?.cx_status === "Aberto";

  // API
  const loadHoje = async () => {
    const r = await api.get("/caixas/aberto"); // pode devolver null
    setCash(r.data || null);
  };

  const loadSalesHoje = async () => {
    const dia = todayLocal();
    const r = await api.get("/vendas", { params: { from: dia, to: dia } });
    const data = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
    setSalesToday(data);
  };

  // Boot
  useEffect(() => {
    (async () => {
      if (!allowed) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        await Promise.all([loadHoje(), loadSalesHoje()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed]);

  // Resumo do dia
  const resume = useMemo(() => {
    const pagas = salesToday.filter((s) => s.ven_status === "Paga");
    const totalBruto = pagas.reduce((a, s) => a + Number(s.ven_subtotal || 0), 0);
    const desconto = pagas.reduce((a, s) => a + Number(s.ven_desconto || 0), 0);
    const total = pagas.reduce((a, s) => a + Number(s.ven_total || 0), 0);
    return { qtd: pagas.length, totalBruto, desconto, total };
  }, [salesToday]);

  // Ações
  const abrirCaixa = async () => {
    await api.post("/caixas/abrir", { saldo_inicial: Number(initialBalance || 0) });
    setOpenOpenModal(false);
    setInitialBalance("");
    await loadHoje();
    setToast("Caixa aberto com sucesso.");
    setTimeout(() => setToast(""), 1800);
  };

  const fecharCaixa = async () => {
    await api.post("/caixas/fechar");
    setOpenCloseModal(false);
    await Promise.all([loadHoje(), loadSalesHoje()]);
    setToast("Caixa fechado.");
    setTimeout(() => setToast(""), 1800);
  };

  return {
    // gate
    allowed,
    // estado
    cash,
    loading,
    isAberto,
    openOpenModal,
    setOpenOpenModal,
    openCloseModal,
    setOpenCloseModal,
    initialBalance,
    setInitialBalance,
    toast,
    setToast,
    salesToday,
    resume,
    // ações
    abrirCaixa,
    fecharCaixa,
    // utils
    fmt,
  };
}

export default useCaixa;
