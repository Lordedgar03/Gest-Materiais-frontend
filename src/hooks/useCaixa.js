// src/hooks/useCaixa.js
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../api";

/* ================= Helpers ================= */
export const fmt = (n) =>
  Number(n || 0).toLocaleString("pt-PT", { style: "currency", currency: "STN" });

function parseJwtUnsafe(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json || "{}");
  } catch {
    return {};
  }
}

function canUseCaixa() {
  try {
    const caps = JSON.parse(localStorage.getItem("caps") || "[]");
    const set = new Set(caps);
    if (set.has("venda:visualizar") || set.has("venda:gerir") || set.has("caixa:gerir")) return true;

    const token = localStorage.getItem("token");
    if (!token) return false;
    const payload = parseJwtUnsafe(token);

    const roles = Array.isArray(payload?.roles) ? payload.roles : [];
    if (payload?.is_admin === true || roles.includes("admin")) return true;

    const templates = Array.isArray(payload?.templates) ? payload.templates : [];
    return templates.some((t) => {
      const code = String(t?.template_code || t?.code || "").toLowerCase();
      return code === "manage_sales" || code === "manage_cash";
    });
  } catch {
    return false;
  }
}

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ================= Hook principal ================= */
export function useCaixa() {
  const allowed = useRef(canUseCaixa()).current;

  // Estado base
  const [loading, setLoading] = useState(true);
  const [cash, setCash] = useState(null);           // objeto do caixa aberto (ou null)
  const [salesToday, setSalesToday] = useState([]); // vendas de hoje
  const [resume, setResume] = useState({ qtd: 0, desconto: 0, total: 0 });

  // UI
  const [openOpenModal, setOpenOpenModal] = useState(false);
  const [openCloseModal, setOpenCloseModal] = useState(false);
  const [initialBalance, setInitialBalance] = useState("");
  const [toast, setToast] = useState("");

  // Normalização: aceita "aberto" (bool), "cx_status"/"status" = "Aberto"
  const isAberto = useMemo(() => {
    if (!cash) return false;
    if (typeof cash.aberto === "boolean") return cash.aberto;
    const status = String(cash.cx_status ?? cash.status ?? "").trim().toLowerCase();
    return status === "aberto";
  }, [cash]);

  // Carrega caixa atual (usa /caixas/aberto — compatível com o teu ApiGateway)
  const loadCaixa = useCallback(async () => {
    try {
      const r = await api.get("/caixas/aberto");
      setCash(r?.data ?? null);
    } catch (e) {
      // 404 significa "não há caixa aberto" -> cash = null
      if (e?.response?.status === 404) setCash(null);
      else {
        console.error(e);
        setToast("Falha ao consultar o estado do caixa.");
      }
    }
  }, []);

  // Vendas do dia (para resumo e tabela)
  const loadSalesToday = useCallback(async () => {
    try {
      const day = todayYYYYMMDD();
      const r = await api.get("/vendas", { params: { from: day, to: day } });
      const list = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
      setSalesToday(list);
    } catch (e) {
      console.error(e);
      setSalesToday([]);
    }
  }, []);

  // KPIs baseados nas vendas
  useEffect(() => {
    const paid = salesToday.filter((s) => String(s.ven_status) === "Paga");
    const qtd = paid.length;
    const desconto = paid.reduce((a, s) => a + Number(s.ven_desconto || 0), 0);
    const total = paid.reduce((a, s) => a + Number(s.ven_total || 0), 0);
    setResume({ qtd, desconto, total });
  }, [salesToday]);

  // Refetch conjunto
  const refetchAll = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await Promise.all([loadCaixa(), loadSalesToday()]);
    } finally {
      setLoading(false);
    }
  }, [allowed, loadCaixa, loadSalesToday]);

  // Boot
  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  // Auto-refresh:
  // - a cada 15s se estiver aberto
  // - ao voltar foco à janela
  useEffect(() => {
    if (!allowed) return;

    let t = null;
    if (isAberto) {
      t = setInterval(() => {
        loadCaixa();
        loadSalesToday();
      }, 15000);
    }
    const onFocus = () => {
      loadCaixa();
      loadSalesToday();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      if (t) clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [allowed, isAberto, loadCaixa, loadSalesToday]);

  // Ações
  const abrirCaixa = async () => {
    try {
      const payload = {};
      const n = Number(initialBalance);
      if (Number.isFinite(n) && n >= 0) payload.saldo_inicial = n;
      await api.post("/caixas/abrir", payload);
      setToast("Caixa aberto.");
      setOpenOpenModal(false);
      setInitialBalance("");
      await refetchAll();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || "Não foi possível abrir o caixa.";
      setToast(msg);
    }
  };

  const fecharCaixa = async () => {
    try {
      await api.post("/caixas/fechar");
      setToast("Caixa fechado.");
      setOpenCloseModal(false);
      await refetchAll();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || "Não foi possível fechar o caixa.";
      setToast(msg);
    }
  };

  const kpis = useMemo(() => {
    return [
      { title: "Saldo inicial", value: fmt(cash?.cx_saldo_inicial || 0), tone: "indigo" },
      { title: "Vendas (pagas)", value: String(resume.qtd), tone: "blue" },
      { title: "Descontos do dia", value: `- ${fmt(resume.desconto)}`, tone: "amber" },
      { title: "Recebido hoje", value: fmt(resume.total), tone: "emerald" },
    ];
  }, [cash, resume]);

  return {
    // gate
    allowed,
    // estado
    loading,
    cash,
    isAberto,
    salesToday,
    resume,
    kpis,
    // UI
    openOpenModal,
    setOpenOpenModal,
    openCloseModal,
    setOpenCloseModal,
    initialBalance,
    setInitialBalance,
    toast,
    setToast,
    // ações
    abrirCaixa,
    fecharCaixa,
    // utils
    fmt,
    // expose refetch (útil se quiser puxar manualmente em outras telas)
    refetchAll,
  };
}

export default useCaixa;
