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

function yearMonthNow() {
  const d = new Date();
  return { ano: d.getFullYear(), mes: d.getMonth() + 1 };
}

function normalizeReportResponse(payload) {
  const body = payload?.data ?? payload ?? {};
  const root = body?.data ?? body;

  const rows =
    (Array.isArray(root?.recibos) && root.recibos) ||
    (Array.isArray(root?.vendas) && root.vendas) ||
    (Array.isArray(root?.rows) && root.rows) ||
    (Array.isArray(root?.items) && root.items) ||
    [];

  const totals = root?.totais ?? root?.totals ?? null;
  const byPay = root?.por_forma_pagamento ?? root?.by_payment ?? null;

  return { root, rows, totals, byPay };
}

function sumFromRows(rows) {
  const emitidos = rows.filter((r) => String(r?.rec_status ?? r?.status ?? "Emitido") !== "Anulado");

  const qtd = emitidos.length;
  const desconto = emitidos.reduce((a, r) => a + Number(r?.rec_desconto ?? r?.desconto ?? 0), 0);
  const total = emitidos.reduce((a, r) => a + Number(r?.rec_total ?? r?.total ?? 0), 0);

  const porForma = {};
  emitidos.forEach((r) => {
    const forma = String(r?.rec_forma_pagamento ?? r?.forma_pagamento ?? "Dinheiro");
    porForma[forma] = (porForma[forma] || 0) + Number(r?.rec_total ?? r?.total ?? 0);
  });

  return { qtd, desconto, total, porForma };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function openHtmlInNewTab(html) {
  const blob = new Blob([html], { type: "text/html; charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

/* ================= Hook principal ================= */
export function useCaixa() {
  const allowed = useRef(canUseCaixa()).current;

  // Estado base
  const [loading, setLoading] = useState(true);
  const [cash, setCash] = useState(null);

  // Relatórios
  const [reportMode, setReportMode] = useState("dia"); // "dia" | "mes"
  const [reportLoading, setReportLoading] = useState(false);

  const [reportDate, setReportDate] = useState(todayYYYYMMDD());
  const [reportForma, setReportForma] = useState("Todos");
  const [reportIncludeItens, setReportIncludeItens] = useState(false);

  const { ano: anoNow, mes: mesNow } = yearMonthNow();
  const [reportAno, setReportAno] = useState(anoNow);
  const [reportMes, setReportMes] = useState(mesNow);

  const [reportRows, setReportRows] = useState([]);
  const [reportTotals, setReportTotals] = useState(null);
  const [reportByPay, setReportByPay] = useState(null);

  // UI
  const [openOpenModal, setOpenOpenModal] = useState(false);
  const [openCloseModal, setOpenCloseModal] = useState(false);
  const [initialBalance, setInitialBalance] = useState("");
  const [toast, setToast] = useState("");

  // Aberto/Fechado
  const isAberto = useMemo(() => {
    if (!cash) return false;
    if (typeof cash.aberto === "boolean") return cash.aberto;
    const status = String(cash.cx_status ?? cash.status ?? "").trim().toLowerCase();
    return status === "aberto";
  }, [cash]);

  // Caixa atual
  const loadCaixa = useCallback(async () => {
    try {
      const r = await api.get("/caixas/aberto");
      setCash(r?.data ?? null);
    } catch (e) {
      if (e?.response?.status === 404) setCash(null);
      else {
        console.error(e);
        setToast("Falha ao consultar o estado do caixa.");
      }
    }
  }, []);

  // ===== Relatório Dia =====
  const loadRelatorioDia = useCallback(async () => {
    setReportLoading(true);
    try {
      const r = await api.get("/caixas/relatorio/dia", {
        params: {
          data: reportDate,
          forma_pagamento: reportForma,
          incluir_itens: reportIncludeItens ? 1 : 0,
        },
      });

      const { rows, totals, byPay } = normalizeReportResponse(r);
      setReportRows(rows);
      setReportTotals(totals);
      setReportByPay(byPay);
    } catch (e) {
      console.error(e);
      setReportRows([]);
      setReportTotals(null);
      setReportByPay(null);
      setToast(e?.response?.data?.message || "Falha ao carregar relatório do dia.");
    } finally {
      setReportLoading(false);
    }
  }, [reportDate, reportForma, reportIncludeItens]);

  // ===== Relatório Mês =====
  const loadRelatorioMes = useCallback(async () => {
    setReportLoading(true);
    try {
      const r = await api.get("/caixas/relatorio/mes", {
        params: {
          ano: reportAno,
          mes: reportMes,
          forma_pagamento: reportForma,
        },
      });

      const { rows, totals, byPay } = normalizeReportResponse(r);
      setReportRows(rows);
      setReportTotals(totals);
      setReportByPay(byPay);
    } catch (e) {
      console.error(e);
      setReportRows([]);
      setReportTotals(null);
      setReportByPay(null);
      setToast(e?.response?.data?.message || "Falha ao carregar relatório do mês.");
    } finally {
      setReportLoading(false);
    }
  }, [reportAno, reportMes, reportForma]);

  // Recarrega quando filtros mudam
  useEffect(() => {
    if (!allowed) return;
    if (reportMode === "dia") loadRelatorioDia();
    else loadRelatorioMes();
  }, [
    allowed,
    reportMode,
    reportDate,
    reportAno,
    reportMes,
    reportForma,
    reportIncludeItens,
    loadRelatorioDia,
    loadRelatorioMes,
  ]);

  // Totais
  const computed = useMemo(() => sumFromRows(reportRows), [reportRows]);

  const resume = useMemo(() => {
    const t = reportTotals;
    if (t && (t.total != null || t.qtd != null || t.count != null)) {
      return {
        qtd: Number(t.qtd ?? t.count ?? computed.qtd),
        desconto: Number(t.desconto ?? 0),
        total: Number(t.total ?? 0),
      };
    }
    return { qtd: computed.qtd, desconto: computed.desconto, total: computed.total };
  }, [reportTotals, computed]);

  const byPay = useMemo(() => {
    if (reportByPay && typeof reportByPay === "object") return reportByPay;
    return computed.porForma;
  }, [reportByPay, computed]);

  // Boot
  const refetchAll = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await loadCaixa();
      if (reportMode === "dia") await loadRelatorioDia();
      else await loadRelatorioMes();
    } finally {
      setLoading(false);
    }
  }, [allowed, loadCaixa, reportMode, loadRelatorioDia, loadRelatorioMes]);

  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  // Auto-refresh
  useEffect(() => {
    if (!allowed) return;

    let t = null;
    if (isAberto) {
      t = setInterval(() => {
        loadCaixa();
        if (reportMode === "dia") loadRelatorioDia();
        else loadRelatorioMes();
      }, 15000);
    }

    const onFocus = () => {
      loadCaixa();
      if (reportMode === "dia") loadRelatorioDia();
      else loadRelatorioMes();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      if (t) clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [allowed, isAberto, loadCaixa, reportMode, loadRelatorioDia, loadRelatorioMes]);

  // ===== Ações do Caixa =====
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
      setToast(e?.response?.data?.message || "Não foi possível abrir o caixa.");
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
      setToast(e?.response?.data?.message || "Não foi possível fechar o caixa.");
    }
  };

  // ======================================================
  // ✅ EXPORTAR (CSV/PDF) + ✅ IMPRIMIR (HTML com TOKEN)
  // ======================================================

  // === DIA CSV ===
  const exportDiaCSV = async () => {
    try {
      const r = await api.get("/caixas/relatorio/dia", {
        params: {
          data: reportDate,
          forma_pagamento: reportForma,
          incluir_itens: reportIncludeItens ? 1 : 0,
          formato: "csv",
        },
        responseType: "blob",
      });
      const type = r?.headers?.["content-type"] || "text/csv";
      const blob = new Blob([r.data], { type });
      downloadBlob(blob, `relatorio_caixa_dia_${reportDate}.csv`);
    } catch (e) {
      console.error(e);
      setToast(e?.response?.data?.message || "Falha ao exportar CSV do dia.");
    }
  };

  // === DIA PDF ===
  const exportDiaPDF = async () => {
    try {
      const r = await api.get("/caixas/relatorio/dia", {
        params: {
          data: reportDate,
          forma_pagamento: reportForma,
          incluir_itens: reportIncludeItens ? 1 : 0,
          formato: "pdf",
        },
        responseType: "blob",
      });
      const type = r?.headers?.["content-type"] || "application/pdf";
      const blob = new Blob([r.data], { type });
      downloadBlob(blob, `relatorio_caixa_dia_${reportDate}.pdf`);
    } catch (e) {
      console.error(e);
      setToast(e?.response?.data?.message || "Falha ao exportar PDF do dia.");
    }
  };

  // === DIA IMPRIMIR (HTML) ===
  // ✅ não usa window.open(url...) porque não leva Authorization
  const printDiaHTML = async () => {
    try {
      const r = await api.get("/caixas/relatorio/dia", {
        params: {
          data: reportDate,
          forma_pagamento: reportForma,
          incluir_itens: reportIncludeItens ? 1 : 0,
          formato: "html",
        },
        responseType: "text",
        headers: { Accept: "text/html" },
      });

      // axios pode devolver string em r.data
      openHtmlInNewTab(typeof r.data === "string" ? r.data : String(r.data ?? ""));
    } catch (e) {
      console.error(e);
      setToast(e?.response?.data?.message || "Falha ao abrir impressão (HTML).");
    }
  };

  // === MÊS CSV ===
  const exportMesCSV = async () => {
    try {
      const r = await api.get("/caixas/relatorio/mes", {
        params: {
          ano: reportAno,
          mes: reportMes,
          forma_pagamento: reportForma,
          formato: "csv",
        },
        responseType: "blob",
      });
      const type = r?.headers?.["content-type"] || "text/csv";
      const blob = new Blob([r.data], { type });
      downloadBlob(blob, `relatorio_caixa_mes_${reportAno}-${String(reportMes).padStart(2, "0")}.csv`);
    } catch (e) {
      console.error(e);
      setToast(e?.response?.data?.message || "Falha ao exportar CSV do mês.");
    }
  };

  // === MÊS PDF ===
  const exportMesPDF = async () => {
    try {
      const r = await api.get("/caixas/relatorio/mes", {
        params: {
          ano: reportAno,
          mes: reportMes,
          forma_pagamento: reportForma,
          formato: "pdf",
        },
        responseType: "blob",
      });
      const type = r?.headers?.["content-type"] || "application/pdf";
      const blob = new Blob([r.data], { type });
      downloadBlob(blob, `relatorio_caixa_mes_${reportAno}-${String(reportMes).padStart(2, "0")}.pdf`);
    } catch (e) {
      console.error(e);
      setToast(e?.response?.data?.message || "Falha ao exportar PDF do mês.");
    }
  };

  const kpis = useMemo(() => {
    return [
      { title: "Saldo inicial", value: fmt(cash?.cx_saldo_inicial || 0), tone: "indigo" },
      { title: "Recibos (emitidos)", value: String(resume.qtd), tone: "blue" },
      { title: "Descontos", value: `- ${fmt(resume.desconto)}`, tone: "amber" },
      { title: "Total (emitido)", value: fmt(resume.total), tone: "emerald" },
    ];
  }, [cash, resume]);

  return {
    allowed,

    loading,
    cash,
    isAberto,

    reportMode,
    setReportMode,
    reportLoading,

    reportDate,
    setReportDate,
    reportAno,
    setReportAno,
    reportMes,
    setReportMes,

    reportForma,
    setReportForma,
    reportIncludeItens,
    setReportIncludeItens,

    reportRows,
    reportTotals,
    byPay,
    resume,
    kpis,

    openOpenModal,
    setOpenOpenModal,
    openCloseModal,
    setOpenCloseModal,
    initialBalance,
    setInitialBalance,
    toast,
    setToast,

    abrirCaixa,
    fecharCaixa,
    refetchAll,

    // ✅ Export / Print
    exportDiaCSV,
    exportDiaPDF,
    printDiaHTML,
    exportMesCSV,
    exportMesPDF,

    fmt,
  };
}

export default useCaixa;
