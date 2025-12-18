/* eslint-disable no-unused-vars */
"use client";

// src/pages/Almoco.jsx
import React from "react";
import {
  Utensils,
  Soup,
  CalendarDays,
  CalendarRange,
  Settings,
  X,
  FileBarChart,
  Download,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  BadgeEuro,
} from "lucide-react";
import { Formik, Form, Field } from "formik";
import useAlmoco from "../hooks/useAlmoco";

/* =================== helpers =================== */
const nf = new Intl.NumberFormat("pt-PT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const stn = (n) => `STN ${nf.format(Number(n || 0))}`;

const normStatus = (s) =>
  String(s || "")
    .trim()
    .toLowerCase();

const totalPago = (rows) =>
  (rows || []).reduce(
    (s, r) =>
      s +
      (normStatus(r?.ala_status) === "pago" ? Number(r?.ala_valor || 0) : 0),
    0
  );

const totalRegistos = (rows) => (Array.isArray(rows) ? rows.length : 0);

const getStatusIcon = (status) => {
  const s = normStatus(status);
  if (s === "pago")
    return <CheckCircle size={14} aria-hidden className="text-emerald-600" />;
  if (s === "pendente")
    return <Clock size={14} aria-hidden className="text-amber-600" />;
  return <AlertCircle size={14} aria-hidden className="text-slate-400" />;
};

const getStatusPill = (status) => {
  const s = normStatus(status);
  if (s === "pago")
    return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800";
  if (s === "pendente")
    return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800";
  return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-700";
};

const getAnoFromTurma = (t) => {
  const m = String(t || "")
    .trim()
    .match(/(\d{1,2})/);
  return m ? Number(m[1]) : "-";
};

const ordenarTurmas = (a, b) => {
  const an = getAnoFromTurma(a?.turma);
  const bn = getAnoFromTurma(b?.turma);
  if (an === "-" && bn !== "-") return 1;
  if (bn === "-" && an !== "-") return -1;
  if (an !== "-" && bn !== "-" && an !== bn) return an - bn;
  return String(a?.turma || "").localeCompare(String(b?.turma || ""));
};

const safeText = (v) => (v == null ? "" : String(v));

/* =================== export helpers (PDF/Excel) =================== */
async function exportToPdf({ title, subtitle, columns, rows, filename }) {
  // Requer: jspdf + jspdf-autotable
  const [{ default: jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  doc.setFontSize(14);
  doc.text(title || "Relatório", 40, 40);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(subtitle, 40, 58);
    doc.setTextColor(0);
  }

  const head = [columns.map((c) => c.header)];
  const body = rows.map((r) => columns.map((c) => safeText(r?.[c.key])));

  const autoTable = autoTableMod?.default || autoTableMod;
  autoTable(doc, {
    head,
    body,
    startY: 75,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [245, 246, 250], textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [252, 252, 253] },
    margin: { left: 40, right: 40 },
    tableWidth: pageW - 80,
  });

  doc.save(filename || "relatorio.pdf");
}

async function exportToExcel({ sheetName, columns, rows, filename }) {
  // Requer: xlsx
  const XLSX = await import("xlsx");
  const headers = columns.map((c) => c.header);
  const data = rows.map((r) => columns.map((c) => r?.[c.key]));

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || "Relatorio");

  XLSX.writeFile(wb, filename || "relatorio.xlsx");
}

/* =================== UI blocks =================== */
function Toast({ msg, tone = "success", onClose }) {
  if (!msg) return null;

  const toneStyles = {
    error: "bg-rose-600 border-rose-700",
    warning: "bg-amber-500 border-amber-600",
    success: "bg-emerald-600 border-emerald-700",
    info: "bg-indigo-600 border-indigo-700",
  };

  const normalizedTone =
    tone === "error"
      ? "error"
      : tone === "warning"
      ? "warning"
      : tone === "info"
      ? "info"
      : "success";

  React.useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[80] animate-slide-in-right">
      <div
        className={`flex items-start gap-3 rounded-2xl px-4 py-3 shadow-2xl text-white border ${toneStyles[normalizedTone]}`}
      >
        <div className="flex-1 text-sm whitespace-pre-line">{msg}</div>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 opacity-80 hover:opacity-100 transition-opacity"
          aria-label="Fechar notificação"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children, footer, size = "md" }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    ref.current?.focus?.();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  const maxw =
    size === "lg" ? "max-w-4xl" : size === "xl" ? "max-w-6xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={ref}
          tabIndex={-1}
          className={`w-full ${maxw} rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl focus:outline-none`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              aria-label="Fechar modal"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
          {footer && (
            <div className="p-5 border-t border-slate-200 dark:border-slate-800">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon, hint }) => (
  <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 backdrop-blur p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="inline-grid place-items-center h-11 w-11 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {icon}
      </div>
      <div className="text-right">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {title}
        </div>
        <div className="text-xl font-semibold text-slate-900 dark:text-white">
          {value}
        </div>
        {hint ? (
          <div className="text-[16px] text-slate-500 dark:text-slate-400 mt-0.5">
            {hint}
          </div>
        ) : null}
      </div>
    </div>
  </div>
);

function Segmented({ value, onChange, items }) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 p-1">
      {items.map((it) => {
        const active = it.key === value;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
              active
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            {it.icon}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function DataTable({ rows, loading, filterText }) {
  const filtered = React.useMemo(() => {
    const q = String(filterText || "")
      .trim()
      .toLowerCase();
    if (!q) return rows || [];
    return (rows || []).filter((r) => {
      const a = safeText(r?.alu_nome).toLowerCase();
      const p = safeText(r?.alu_num_processo).toLowerCase();
      const t = safeText(r?.alu_turma).toLowerCase();
      const s = safeText(r?.ala_status).toLowerCase();
      return a.includes(q) || p.includes(q) || t.includes(q) || s.includes(q);
    });
  }, [rows, filterText]);

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 backdrop-blur overflow-hidden shadow-sm">
      <div className="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Registos: <b>{filtered.length}</b>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Total pago:{" "}
          <b className="text-slate-900 dark:text-white">
            {stn(totalPago(filtered))}
          </b>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr className="text-left text-slate-700 dark:text-slate-200">
              <th className="px-4 md:px-6 py-3 font-semibold">Aluno</th>
              <th className="px-4 md:px-6 py-3 font-semibold">Nº Processo</th>
              <th className="px-4 md:px-6 py-3 font-semibold">Turma</th>
              <th className="px-4 md:px-6 py-3 font-semibold">Status</th>
              <th className="px-4 md:px-6 py-3 font-semibold text-right">
                Valor
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center">
                  <span className="inline-flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Loader2 size={18} className="animate-spin" /> A carregar...
                  </span>
                </td>
              </tr>
            ) : filtered.length ? (
              filtered.map((r) => (
                <tr
                  key={r?.ala_id ?? `${r?.alu_num_processo}-${r?.alu_nome}`}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                >
                  <td className="px-4 md:px-6 py-3 font-medium text-slate-900 dark:text-white">
                    {r?.alu_nome}
                  </td>
                  <td className="px-4 md:px-6 py-3 text-slate-600 dark:text-slate-300">
                    {r?.alu_num_processo || "-"}
                  </td>
                  <td className="px-4 md:px-6 py-3">
                    {r?.alu_turma ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-200 dark:border-indigo-800">
                        {r?.alu_turma}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-3">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusPill(
                        r?.ala_status
                      )}`}
                    >
                      {getStatusIcon(r?.ala_status)}
                      {r?.ala_status || "pendente"}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3 text-right font-mono text-slate-900 dark:text-white">
                    {stn(r?.ala_valor)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  Sem registos para este período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =================== page =================== */
export default function Almoco() {
  const {
    allowed,
    loadingBoot,
    precoPadrao,
    precoHoje,
    atualizarPreco,
    updatingPreco,

    relHoje,
    loadingHoje,

    relData,
    loadingData,
    loadPorData,

    relIntervalo,
    loadingIntervalo,
    loadIntervalo,

    relMensal,
    loadingMensal,
    loadMensal,

    listaHoje,
    loadingListaHoje,

    listaData,
    loadingListaData,
    loadListaPorData,

    toast,
    setToast,
    tone,
    today,
  } = useAlmoco();

  const [openPreco, setOpenPreco] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(true);

  const [section, setSection] = React.useState("hoje"); // hoje | por-data | intervalo | mensal

  // filtros locais (só UI)
  const [tableQuery, setTableQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState(""); // "" | pago | pendente

  // estados de seleção para export
  const [selDate, setSelDate] = React.useState(today?.() || "");
  const [selIni, setSelIni] = React.useState(today?.() || "");
  const [selFim, setSelFim] = React.useState(today?.() || "");
  const [selAno, setSelAno] = React.useState(new Date().getFullYear());
  const [selMes, setSelMes] = React.useState(
    new Date().toLocaleString("pt-PT", { month: "long" })
  );

  const [exporting, setExporting] = React.useState(false);

  // boot mensal (só uma vez)
  React.useEffect(() => {
    const now = new Date();
    loadMensal?.(
      now.getFullYear(),
      now.toLocaleString("pt-PT", { month: "long" })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // linhas do mensal
  const linhasMensal = React.useMemo(() => {
    const arr = Array.isArray(relMensal?.porTurma)
      ? [...relMensal.porTurma]
      : [];
    return arr.sort(ordenarTurmas);
  }, [relMensal]);

  const totalMensal = React.useMemo(
    () => Number(relMensal?.totalGeral?.total_arrecadado || 0),
    [relMensal]
  );

  // linhas tabelas (com filtros simples)
  const applyRowFilters = React.useCallback(
    (rows) => {
      const q = String(tableQuery || "")
        .trim()
        .toLowerCase();
      const sf = String(statusFilter || "")
        .trim()
        .toLowerCase();

      return (rows || []).filter((r) => {
        const okStatus = !sf || normStatus(r?.ala_status) === sf;
        if (!okStatus) return false;
        if (!q) return true;

        const a = safeText(r?.alu_nome).toLowerCase();
        const p = safeText(r?.alu_num_processo).toLowerCase();
        const t = safeText(r?.alu_turma).toLowerCase();
        const s = safeText(r?.ala_status).toLowerCase();

        return a.includes(q) || p.includes(q) || t.includes(q) || s.includes(q);
      });
    },
    [tableQuery, statusFilter]
  );

  const rowsHoje = React.useMemo(
    () => applyRowFilters(listaHoje),
    [listaHoje, applyRowFilters]
  );
  const rowsData = React.useMemo(
    () => applyRowFilters(listaData),
    [listaData, applyRowFilters]
  );

  const headerSubtitle = React.useMemo(() => {
    const base = `Preço hoje: ${stn(precoHoje)} • Preço padrão: ${stn(
      precoPadrao
    )}`;
    if (section === "hoje") return `${base} • Data: ${today?.()}`;
    if (section === "por-data") return `${base} • Data: ${selDate || "-"}`;
    if (section === "intervalo")
      return `${base} • Período: ${selIni || "-"} → ${selFim || "-"}`;
    if (section === "mensal")
      return `${base} • Mês: ${selMes || "-"} / ${selAno || "-"}`;
    return base;
  }, [
    section,
    precoHoje,
    precoPadrao,
    today,
    selDate,
    selIni,
    selFim,
    selMes,
    selAno,
  ]);

  const exportContext = React.useMemo(() => {
    if (section === "mensal") {
      const cols = [
        { header: "Ano", key: "ano" },
        { header: "Turma", key: "turma" },
        { header: "Nº de almoços", key: "qtd" },
        { header: "Valor (STN)", key: "total" },
      ];
      const rows = (linhasMensal || []).map((r) => ({
        ano: getAnoFromTurma(r?.turma),
        turma: r?.turma || "-",
        qtd: Number(r?.qtd || 0),
        total: Number(r?.total || 0),
      }));
      const sub = `Mensal • ${safeText(relMensal?.mes)} ${safeText(
        relMensal?.ano
      )} • Total: ${stn(totalMensal)}`;
      return {
        title: `Relatório de Almoços (Mensal)`,
        subtitle: sub,
        columns: cols,
        rows,
        excelName: `almoco-mensal-${safeText(relMensal?.ano)}-${safeText(
          relMensal?.mes
        ).replace(/\s+/g, "_")}.xlsx`,
        pdfName: `almoco-mensal-${safeText(relMensal?.ano)}-${safeText(
          relMensal?.mes
        ).replace(/\s+/g, "_")}.pdf`,
        sheet: "Mensal",
      };
    }

    const cols = [
      { header: "Aluno", key: "aluno" },
      { header: "Nº Processo", key: "processo" },
      { header: "Turma", key: "turma" },
      { header: "Status", key: "status" },
      { header: "Valor (STN)", key: "valor" },
    ];

    const raw =
      section === "por-data" ? rowsData : section === "hoje" ? rowsHoje : []; // intervalo não tem lista detalhada no seu hook atual

    const rows = (raw || []).map((r) => ({
      aluno: r?.alu_nome || "-",
      processo: r?.alu_num_processo || "-",
      turma: r?.alu_turma || "-",
      status: r?.ala_status || "pendente",
      valor: Number(r?.ala_valor || 0),
    }));

    let label = "Hoje";
    let key = today?.() || "hoje";
    if (section === "por-data") {
      label = "Por Data";
      key = selDate || "data";
    } else if (section === "intervalo") {
      label = "Intervalo";
      key = `${selIni || "ini"}_${selFim || "fim"}`;
    }

    return {
      title: `Relatório de Almoços (${label})`,
      subtitle: headerSubtitle,
      columns: cols,
      rows,
      excelName: `almoco-${section}-${String(key).replace(
        /[^\w-]+/g,
        "_"
      )}.xlsx`,
      pdfName: `almoco-${section}-${String(key).replace(/[^\w-]+/g, "_")}.pdf`,
      sheet: label,
    };
  }, [
    section,
    rowsHoje,
    rowsData,
    linhasMensal,
    relMensal,
    totalMensal,
    today,
    selDate,
    selIni,
    selFim,
    headerSubtitle,
  ]);

  const onExportPdf = async () => {
    try {
      setExporting(true);
      await exportToPdf({
        title: exportContext.title,
        subtitle: exportContext.subtitle,
        columns: exportContext.columns,
        rows: exportContext.rows,
        filename: exportContext.pdfName,
      });
    } catch (e) {
      console.error(e);
      setToast(
        "Export PDF falhou. Confirma se tens 'jspdf' e 'jspdf-autotable' instalados."
      );
    } finally {
      setExporting(false);
    }
  };

  const onExportExcel = async () => {
    try {
      setExporting(true);
      await exportToExcel({
        sheetName: exportContext.sheet,
        columns: exportContext.columns,
        rows: exportContext.rows,
        filename: exportContext.excelName,
      });
    } catch (e) {
      console.error(e);
      setToast("Export Excel falhou. Confirma se tens 'xlsx' instalado.");
    } finally {
      setExporting(false);
    }
  };

  /* =================== loading / perm =================== */
  if (loadingBoot) {
    return (
      <main className="min-h-[70vh] grid place-items-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-600 dark:text-slate-300">
            A carregar módulo Almoço…
          </p>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-[70vh] grid place-items-center p-4 dark:bg-slate-950">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-20 w-16 rounded-2xl bg-rose-100 dark:bg-rose-900/20 grid place-items-center border border-rose-200 dark:border-rose-800">
            <X className="text-rose-600 dark:text-rose-300" size={22} />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
            Acesso Restrito
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-5">
            Não tem permissão para aceder ao módulo Almoço.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            type="button"
          >
            Voltar
          </button>
        </div>
      </main>
    );
  }

  /* =================== layout =================== */
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur">
        <div className="mx-auto p-3 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNavOpen((v) => !v)}
                className="p-2 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 md:hidden"
                aria-label={
                  navOpen ? "Esconder navegação" : "Mostrar navegação"
                }
              >
                {navOpen ? (
                  <ChevronLeft size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>

              <div className="h-11 w-11 rounded-3xl bg-indigo-600 dark:bg-white text-white dark:text-slate-900 grid place-items-center shadow-sm">
                <Utensils size={18} />
              </div>

              <div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-indigo-600 dark:text-white">
                  Almoços
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {headerSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExportPdf}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-red-500 dark:bg-slate-950/40 hover:bg-red-100 dark:hover:bg-slate-900 text-white dark:text-slate-200 disabled:opacity-50"
                title="Exportar PDF"
              >
                {exporting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                <span className="hidden sm:inline">PDF</span>
              </button>

              <button
                type="button"
                onClick={onExportExcel}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-green-500 dark:bg-slate-950/40 hover:bg-green-100 dark:hover:bg-slate-900 text-white dark:text-slate-200 disabled:opacity-50"
                title="Exportar Excel"
              >
                {exporting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                <span className="hidden sm:inline">Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setOpenPreco(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                <Settings size={16} />{" "}
                <span className="hidden sm:inline">Preço</span>
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <Segmented
              value={section}
              onChange={(k) => {
                setSection(k);
                setTableQuery("");
                setStatusFilter("");
              }}
              items={[
                {
                  key: "hoje",
                  label: "Hoje",
                  icon: <CalendarDays size={16} />,
                },
                {
                  key: "por-data",
                  label: "Por data",
                  icon: <CalendarRange size={16} />,
                },
                {
                  key: "intervalo",
                  label: "Intervalo",
                  icon: <FileBarChart size={16} />,
                },
                {
                  key: "mensal",
                  label: "Mensal",
                  icon: <BadgeEuro size={16} />,
                },
              ]}
            />

            {(section === "hoje" || section === "por-data") && (
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={tableQuery}
                    onChange={(e) => setTableQuery(e.target.value)}
                    placeholder="Pesquisar aluno, processo, turma…"
                    className="w-full sm:w-[320px] pl-9 pr-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="inline-flex items-center gap-2">
                  <Filter
                    size={16}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white"
                  >
                    <option value="">Todos</option>
                    <option value="pago">Pago</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto p-3 md:px-6 py-6 grid lg:grid-cols-12 gap-6">
        {/* Sidebar (stats) */}
        <aside
          className={`lg:col-span-4 transition-all ${
            navOpen
              ? "max-h-[2000px] opacity-100"
              : "max-h-0 opacity-0 lg:opacity-100 lg:max-h-[2000px]"
          } overflow-hidden lg:overflow-visible`}
        >
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 backdrop-blur p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Resumo rápido
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  title="Preço padrão"
                  value={stn(precoPadrao)}
                  icon={<BadgeEuro size={16} className="text-amber-600" />}
                />
                <StatCard
                  title="Preço hoje"
                  value={stn(precoHoje)}
                  icon={<Soup size={16} className="text-indigo-600" />}
                />
                <StatCard
                  title="Arrecadado hoje"
                  value={
                    loadingHoje
                      ? "…"
                      : stn(relHoje?.totais?.total_arrecadado || 0)
                  }
                  icon={<FileBarChart size={16} className="text-emerald-600" />}
                />
                <StatCard
                  title="Almoços hoje"
                  value={
                    loadingHoje ? "…" : relHoje?.totais?.total_almocos || 0
                  }
                  icon={
                    <Utensils
                      size={16}
                      className="text-slate-700 dark:text-slate-200"
                    />
                  }
                />
              </div>
            </div>

            {section === "mensal" && (
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 backdrop-blur p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  Mensal selecionado
                </h3>
                <div className="text-sm text-slate-700 dark:text-slate-200">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      Ano
                    </span>
                    <b>{safeText(relMensal?.ano || selAno)}</b>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      Mês
                    </span>
                    <b>{safeText(relMensal?.mes || selMes)}</b>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      Total
                    </span>
                    <b>{stn(totalMensal)}</b>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Content */}
        <section className="lg:col-span-8 space-y-5">
          {/* HOJE */}
          {section === "hoje" && (
            <>
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 backdrop-blur p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Hoje
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Lista do dia ({today?.()}), com filtros e totais.
                    </p>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Registos: <b>{totalRegistos(rowsHoje)}</b>
                  </div>
                </div>
              </div>

              <DataTable
                rows={listaHoje}
                loading={loadingListaHoje}
                filterText={tableQuery}
              />
            </>
          )}

          {/* POR DATA */}
          {section === "por-data" && (
            <>
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 backdrop-blur p-4 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Por data
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Seleciona a data e vê resumo + lista.
                    </p>
                  </div>

                  <Formik
                    enableReinitialize
                    initialValues={{ d: selDate || today?.() }}
                    onSubmit={(v) => {
                      if (!v?.d) return;
                      setSelDate(v.d);
                      loadPorData(v.d);
                      loadListaPorData(v.d);
                    }}
                  >
                    {({ submitForm, setFieldValue }) => (
                      <Form className="flex items-end gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Data
                          </label>
                          <Field
                            name="d"
                            type="date"
                            className="block w-[180px] border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white"
                            onChange={(e) => {
                              setFieldValue("d", e.target.value);
                              submitForm();
                            }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loadingData || loadingListaData}
                          className="h-[40px] px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-medium disabled:opacity-50"
                        >
                          {loadingData || loadingListaData ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            "Gerar"
                          )}
                        </button>
                      </Form>
                    )}
                  </Formik>
                </div>

                {relData && (
                  <div className="mt-4 grid sm:grid-cols-3 gap-3">
                    <StatCard
                      title="Data"
                      value={safeText(relData?.date)}
                      icon={
                        <CalendarDays size={16} className="text-indigo-600" />
                      }
                    />
                    <StatCard
                      title="Total almoços"
                      value={Number(relData?.total_almocos || 0)}
                      icon={<Soup size={16} className="text-amber-600" />}
                    />
                    <StatCard
                      title="Total arrecadado"
                      value={stn(relData?.total_arrecadado || 0)}
                      icon={
                        <FileBarChart size={16} className="text-emerald-600" />
                      }
                    />
                  </div>
                )}
              </div>

              <DataTable
                rows={listaData}
                loading={loadingListaData}
                filterText={tableQuery}
              />
            </>
          )}

          {/* INTERVALO */}
          {section === "intervalo" && (
            <>
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 backdrop-blur p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <FileBarChart className="text-indigo-600" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Intervalo
                  </h2>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Mostra totais para um intervalo (o teu hook atual não traz
                  lista detalhada aqui).
                </p>

                <div className="mt-4">
                  <Formik
                    enableReinitialize
                    initialValues={{
                      ini: selIni || today?.(),
                      fim: selFim || today?.(),
                    }}
                    onSubmit={(v) => {
                      setSelIni(v.ini);
                      setSelFim(v.fim);
                      loadIntervalo(v.ini, v.fim);
                    }}
                  >
                    {({ isSubmitting }) => (
                      <Form className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Data inicial
                          </label>
                          <Field
                            name="ini"
                            type="date"
                            className="block w-full border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Data final
                          </label>
                          <Field
                            name="fim"
                            type="date"
                            className="block w-full border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loadingIntervalo || isSubmitting}
                          className="h-[40px] px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-medium disabled:opacity-50"
                        >
                          {loadingIntervalo ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            "Gerar"
                          )}
                        </button>
                      </Form>
                    )}
                  </Formik>

                  <div className="mt-4 grid sm:grid-cols-3 gap-3">
                    <StatCard
                      title="Período"
                      value={
                        relIntervalo
                          ? `${safeText(relIntervalo?.inicio)} → ${safeText(
                              relIntervalo?.fim
                            )}`
                          : "—"
                      }
                      icon={
                        <CalendarRange size={16} className="text-indigo-600" />
                      }
                    />
                    <StatCard
                      title="Total almoços"
                      value={
                        relIntervalo
                          ? Number(relIntervalo?.total_almocos || 0)
                          : "—"
                      }
                      icon={<Soup size={16} className="text-amber-600" />}
                    />
                    <StatCard
                      title="Total arrecadado"
                      value={
                        relIntervalo
                          ? stn(
                              relIntervalo?.total_arrecadado ??
                                relIntervalo?.total ??
                                relIntervalo?.total_almocado ??
                                0
                            )
                          : "—"
                      }
                      icon={
                        <FileBarChart size={16} className="text-emerald-600" />
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MENSAL */}
          {section === "mensal" && (
            <>
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 backdrop-blur p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Mensal
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Resumo por turma e total do mês.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Formik
                    enableReinitialize
                    initialValues={{ ano: selAno, mes: selMes }}
                    onSubmit={(v) => {
                      setSelAno(v.ano);
                      setSelMes(v.mes);
                      loadMensal(v.ano, v.mes);
                    }}
                  >
                    {({ isSubmitting }) => (
                      <Form className="grid gap-3 md:grid-cols-[160px_240px_auto] items-end">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Ano
                          </label>
                          <Field
                            name="ano"
                            type="number"
                            className="block w-full border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Mês
                          </label>
                          <Field
                            as="select"
                            name="mes"
                            className="block w-full border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white"
                          >
                            {[
                              "janeiro",
                              "fevereiro",
                              "março",
                              "abril",
                              "maio",
                              "junho",
                              "julho",
                              "agosto",
                              "setembro",
                              "outubro",
                              "novembro",
                              "dezembro",
                            ].map((m) => (
                              <option key={m} value={m}>
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                              </option>
                            ))}
                          </Field>
                        </div>

                        <button
                          type="submit"
                          disabled={loadingMensal || isSubmitting}
                          className="h-[40px] px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-medium disabled:opacity-50"
                        >
                          {loadingMensal ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            "Gerar"
                          )}
                        </button>
                      </Form>
                    )}
                  </Formik>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 backdrop-blur overflow-hidden shadow-sm">
                <div className="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {relMensal
                        ? `Almoços de ${relMensal.mes} de ${relMensal.ano}`
                        : "Sem dados"}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Total do mês:{" "}
                      <b className="text-slate-900 dark:text-white">
                        {stn(totalMensal)}
                      </b>
                    </p>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Turmas: <b>{linhasMensal.length}</b>
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr className="text-left text-slate-700 dark:text-slate-200">
                        <th className="px-4 md:px-6 py-3 font-semibold w-20">
                          Ano
                        </th>
                        <th className="px-4 md:px-6 py-3 font-semibold">
                          Turma
                        </th>
                        <th className="px-4 md:px-6 py-3 font-semibold">
                          Nº de almoços
                        </th>
                        <th className="px-4 md:px-6 py-3 font-semibold text-right">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loadingMensal ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center">
                            <span className="inline-flex items-center gap-3 text-slate-500 dark:text-slate-400">
                              <Loader2 size={18} className="animate-spin" /> A
                              carregar…
                            </span>
                          </td>
                        </tr>
                      ) : linhasMensal.length ? (
                        linhasMensal.map((r, idx) => (
                          <tr
                            key={(r?.turma || "-") + idx}
                            className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                          >
                            <td className="px-4 md:px-6 py-3 font-medium text-slate-900 dark:text-white">
                              {getAnoFromTurma(r?.turma)}
                            </td>
                            <td className="px-4 md:px-6 py-3">
                              {r?.turma ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-200 dark:border-indigo-800">
                                  {r?.turma}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-4 md:px-6 py-3 text-slate-700 dark:text-slate-200">
                              {Number(r?.qtd || 0)}
                            </td>
                            <td className="px-4 md:px-6 py-3 text-right font-mono text-slate-900 dark:text-white">
                              {stn(r?.total || 0)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                          >
                            Não existem dados para este mês.
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {linhasMensal.length > 0 && (
                      <tfoot className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                        <tr className="font-semibold text-slate-900 dark:text-white">
                          <td className="px-4 md:px-6 py-4" colSpan={3}>
                            Total do mês
                          </td>
                          <td className="px-4 md:px-6 py-4 text-right font-mono">
                            {stn(totalMensal)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Modal de Preço */}
      <Modal
        open={openPreco}
        onClose={() => setOpenPreco(false)}
        title="Definir preço do almoço"
        size="md"
      >
        <Formik
          enableReinitialize
          initialValues={{
            preco: Number(precoPadrao || 0).toFixed(2),
            aplicarHoje: true,
          }}
          onSubmit={async (v, { setSubmitting }) => {
            await atualizarPreco(Number(v.preco || 0), {
              aplicarNoDia: !!v.aplicarHoje,
            });
            setSubmitting(false);
            setOpenPreco(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Preço padrão (STN)
                </label>
                <Field
                  name="preco"
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Preço atual para hoje:{" "}
                  <b className="text-slate-900 dark:text-white">
                    {stn(precoHoje)}
                  </b>
                </p>
              </div>

              <label className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                <Field
                  type="checkbox"
                  name="aplicarHoje"
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Aplicar também para hoje
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Atualiza imediatamente o preço para os almoços de hoje
                  </div>
                </div>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenPreco(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || updatingPreco}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50"
                >
                  {isSubmitting || updatingPreco ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Settings size={16} />
                  )}
                  Guardar
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>

      <Toast msg={toast} tone={tone} onClose={() => setToast("")} />
    </main>
  );
}
