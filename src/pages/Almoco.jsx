/* eslint-disable no-unused-vars */
"use client";

import React from "react";
import {
  Utensils, Soup, CalendarDays, CalendarRange, Settings, X, FileBarChart,
  FileDown, Printer, PiggyBank, Coins, Loader2, CheckCircle, Clock, AlertCircle,
  ChevronRight, ChevronLeft
} from "lucide-react";
import { Formik, Form, Field } from "formik";
import useAlmoco from "../hooks/useAlmoco";

/* =================== helpers =================== */
const nf = new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const stn = (n) => `STN ${nf.format(Number(n || 0))}`;
const totalPago = (rows) =>
  rows.reduce((s, r) => s + ((r.ala_status || "").toLowerCase() === "pago" ? Number(r.ala_valor || 0) : 0), 0);

const getAnoFromTurma = (t) => {
  const m = String(t || "").trim().match(/(\d{1,2})/);
  return m ? Number(m[1]) : "-";
};
const ordenarTurmas = (a, b) => {
  const an = getAnoFromTurma(a.turma);
  const bn = getAnoFromTurma(b.turma);
  if (an === "-" && bn !== "-") return 1;
  if (bn === "-" && an !== "-") return -1;
  if (an !== "-" && bn !== "-" && an !== bn) return an - bn;
  return String(a.turma || "").localeCompare(String(b.turma || ""));
};

const exportCSV = (rows, meta) => {
  const head = ["Ano", "Turma", "Nº de almoços", "Valor por turma (STN)"];
  const lines = [head.join(";")];
  rows.forEach((r) =>
    lines.push([getAnoFromTurma(r.turma), r.turma || "-", Number(r.qtd || 0), Number(r.total || 0)].join(";"))
  );
  const total = rows.reduce((s, r) => s + Number(r.total || 0), 0);
  lines.push(["", "", "TOTAL", total].join(";"));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `almoco-${meta?.ano || ""}-${String(meta?.mes || "").replace(/\s+/g, "_")}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const getStatusIcon = (status) => {
  switch ((status || "").toLowerCase()) {
    case "pago":
      return <CheckCircle size={14} aria-hidden className="text-green-600" />;
    case "pendente":
      return <Clock size={14} aria-hidden className="text-amber-600" />;
    default:
      return <AlertCircle size={14} aria-hidden className="text-gray-400" />;
  }
};
const getStatusColor = (status) => {
  switch ((status || "").toLowerCase()) {
    case "pago":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
    case "pendente":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
};

/* =================== building blocks =================== */
function Toast({ msg, tone = "success", onClose }) {
  if (!msg) return null;
  const toneStyles = {
    error: "bg-red-600 border-red-700",
    warning: "bg-amber-500 border-amber-600",
    success: "bg-green-600 border-green-700",
    info: "bg-blue-600 border-blue-700",
  };
  React.useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
      <div className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl text-white border ${toneStyles[tone]}`}>
        <div className="flex-1 text-sm whitespace-pre-line">{msg}</div>
        <button type="button" onClick={onClose} className="ml-2 opacity-80 hover:opacity-100 transition-opacity" aria-label="Fechar notificação">
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
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [open]);
  if (!open) return null;

  const maxw = size === "lg" ? "max-w-3xl" : size === "xl" ? "max-w-5xl" : "max-w-lg";
  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={ref}
          tabIndex={-1}
          className={`w-full ${maxw} rounded-2xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-2xl animate-scale-in focus:outline-none`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Fechar modal">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
          {footer && <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

const Stat = ({ title, value, icon }) => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <span className="inline-grid place-items-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700">{icon}</span>
      <div className="text-right">
        <div className="text-xs text-gray-500 dark:text-gray-400">{title}</div>
        <div className="text-lg font-semibold text-gray-900 dark:text-white">{value}</div>
      </div>
    </div>
  </div>
);

function EmptyHint({ icon, title = "Sem dados", subtitle }) {
  return (
    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
      <div className="mb-3">{icon}</div>
      <p className="font-medium">{title}</p>
      {subtitle && <p className="text-sm">{subtitle}</p>}
    </div>
  );
}

function Badge({ children, icon }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 text-sm">
      {icon}
      {children}
    </div>
  );
}

function DataTable({ title, rows, loading }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        {typeof title === "string" ? (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        ) : (
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{title}</div>
        )}
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr className="text-left text-gray-700 dark:text-gray-300">
              <th className="px-4 md:px-6 py-3 md:py-4 font-semibold">Aluno</th>
              <th className="px-4 md:px-6 py-3 md:py-4 font-semibold">Nº Processo</th>
              <th className="px-4 md:px-6 py-3 md:py-4 font-semibold">Turma</th>
              <th className="px-4 md:px-6 py-3 md:py-4 font-semibold">Status</th>
              <th className="px-4 md:px-6 py-3 md:py-4 font-semibold text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center">
                  <span className="inline-flex items-center gap-3 text-gray-500 dark:text-gray-400">
                    <Loader2 size={20} className="animate-spin" /> A carregar dados...
                  </span>
                </td>
              </tr>
            ) : rows?.length ? (
              rows.map((r) => (
                <tr key={r.ala_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-gray-900 dark:text-white">{r.alu_nome}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-gray-600 dark:text-gray-400">{r.alu_num_processo || "-"}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    {r.alu_turma ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {r.alu_turma}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(r.ala_status)}`}>
                      {getStatusIcon(r.ala_status)}
                      {r.ala_status || "pendente"}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right font-mono text-gray-900 dark:text-white">{stn(r.ala_valor)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12">
                  <EmptyHint icon={<CalendarRange size={48} className="mx-auto opacity-50" />} title="Sem registos" subtitle="Não há dados para o período atual." />
                </td>
              </tr>
            )}
          </tbody>

          {rows?.length > 0 && (
            <tfoot className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
              <tr className="font-semibold text-gray-900 dark:text-white">
                <td className="px-6 py-4" colSpan={3}>Total Pago</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
                    <CheckCircle size={12} /> Pago
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono">{stn(totalPago(rows))}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

/* =================== NOVA INTERFACE =================== */
export default function Almoco() {
  const {
    allowed, loadingBoot,
    precoPadrao, precoHoje, atualizarPreco, updatingPreco,
    relHoje, loadingHoje,
    relData, loadingData, loadPorData,
    relIntervalo, loadingIntervalo, loadIntervalo,
    relMensal, loadingMensal, loadMensal,
    listaHoje, loadingListaHoje, listaData, loadingListaData, loadListaPorData,
    toast, setToast, tone, today,
  } = useAlmoco();

  const [openPreco, setOpenPreco] = React.useState(false);
  const [section, setSection] = React.useState("hoje"); // hoje | por-data | intervalo | mensal
  const [navOpen, setNavOpen] = React.useState(true);

  // boot dos dados mensais
  React.useEffect(() => {
    const now = new Date();
    loadMensal?.(now.getFullYear(), now.toLocaleString("pt-PT", { month: "long" }));
  }, [loadMensal]);

  const linhasMensal = React.useMemo(
    () => (Array.isArray(relMensal?.porTurma) ? [...relMensal.porTurma].sort(ordenarTurmas) : []),
    [relMensal]
  );
  const totalMensal = React.useMemo(
    () => Number(relMensal?.totalGeral?.total_arrecadado || 0),
    [relMensal]
  );

  /* ============= estados de carregamento/perm ============= */
  if (loadingBoot) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">A carregar módulo Almoço...</p>
        </div>
      </main>
    );
  }
  if (!allowed) {
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 grid place-items-center">
            <X className="text-red-600 dark:text-red-400" size={24} />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Acesso Restrito</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Não tem permissão para aceder ao módulo Almoço.</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            type="button"
          >
            Voltar
          </button>
        </div>
      </main>
    );
  }

  /* =================== HEADER NOVO =================== */
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <header className="sticky rounded-2xl top-0 z-30 border border-gray-300 dark:border-gray-800/80 backdrop-blur supports-backdrop-blur:bg-white/70 dark:supports-backdrop-blur:bg-gray-900/70 bg-white/90 dark:bg-gray-900/90">
        <div className=" mx-auto p-2 md:p-2">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNavOpen((v) => !v)}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 md:hidden"
                aria-label={navOpen ? "Esconder navegação" : "Mostrar navegação"}
              >
                {navOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white grid place-items-center shadow">
                <Utensils size={18} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Almoços</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date().toLocaleDateString("pt-PT", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2">
                <span className="text-xs text-indigo-700 dark:text-indigo-300">Preço hoje</span>
                <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">{stn(precoHoje)}</span>
              </div>
              <button
                type="button"
                onClick={() => setOpenPreco(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                <Settings size={18} /> Definir Preço
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ======== LAYOUT NOVO: sidebar + conteúdo ======== */}
      <div className=" mx-auto p-2 md:px-4 py-4 grid lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className={`lg:col-span-3 transition-all ${navOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0 md:opacity-100 md:max-h-[1200px]"} md:max-h-none overflow-hidden md:overflow-visible`}>
          <div className="space-y-6">
            {/* Resumo rápido */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Resumo rápido</h3>
              <div className="grid grid-cols-2 gap-3">
                <Stat title="Preço padrão" value={stn(precoPadrao)} icon={<PiggyBank size={16} className="text-amber-600" />} />
                <Stat title="Total hoje" value={loadingHoje ? "..." : stn(relHoje?.totais?.total_arrecadado || 0)} icon={<Coins size={16} className="text-emerald-600" />} />
                <Stat title="Almoços hoje" value={loadingHoje ? "..." : (relHoje?.totais?.total_almocos || 0)} icon={<Soup size={16} className="text-indigo-600" />} />
                <Stat title="Mês atual" value={stn(totalMensal)} icon={<FileBarChart size={16} className="text-sky-600" />} />
              </div>
            </div>

            {/* Ações rápidas */}
            <div className="rounded-2xl border border-gray-300 dark:text-white  bg-white dark:bg-blue-800 p-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 px-2">Ações</h2>
             
            

            {/* Navegação (vertical) */}
            <nav className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2">
              {[
                { key: "hoje", label: "Hoje", icon: <CalendarDays size={16} /> },
                { key: "por-data", label: "Por Data", icon: <CalendarRange size={16} /> },
                { key: "intervalo", label: "Intervalo", icon: <FileBarChart size={16} /> },
                { key: "mensal", label: "Mensal", icon: <Coins size={16} /> },
              ].map((i) => {
                const active = i.key === section;
                return (
                  <button
                    key={i.key}
                    type="button"
                    onClick={() => setSection(i.key)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                      active
                        ? "bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white"
                        : "text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {i.icon}
                    <span className="text-sm font-medium">{i.label}</span>
                  </button>
                );
              })}
            </nav>
            </div>
          </div>
        </aside>

        {/* Conteúdo */}
        <section className="lg:col-span-9 space-y-6">
          {/* HOJE */}
          {section === "hoje" && (
            <>
              <div className="rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Almoços de Hoje</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lista de marcações do dia e totais</p>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Registos: <b>{listaHoje.length}</b>
                  </div>
                </div>
              </div>

              <DataTable
                title="Detalhes de Hoje"
                rows={listaHoje}
                loading={loadingListaHoje}
              />
            </>
          )}

          {/* POR DATA */}
          {section === "por-data" && (
            <>
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarRange className="text-emerald-600" />
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Relatório por Data</h2>
                  </div>
                </div>

                <div className="mt-4">
                  <Formik
                    initialValues={{ d: today() }}
                    onSubmit={(v) => {
                      if (!v?.d) return;
                      loadPorData(v.d);
                      loadListaPorData(v.d);
                    }}
                  >
                    {({ submitForm }) => (
                      <Form className="flex flex-col sm:flex-row items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selecionar data</label>
                          <Field
                            name="d"
                            type="date"
                            className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            onChange={(e) => {
                              e.target.form.dispatchEvent(new Event("change", { bubbles: true }));
                              setTimeout(submitForm, 80);
                            }}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loadingData || loadingListaData}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50"
                        >
                          {loadingData || loadingListaData ? <Loader2 size={18} className="animate-spin" /> : "Gerar"}
                        </button>
                      </Form>
                    )}
                  </Formik>

                  {relData && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge icon={<CalendarDays size={16} className="text-emerald-600" />}>Data: <b>{relData.date}</b></Badge>
                      <Badge icon={<Soup size={16} className="text-emerald-600" />}>Almoços: <b>{relData.total_almocos}</b></Badge>
                      <Badge icon={<Coins size={16} className="text-emerald-600" />}>Arrecadado: <b>{stn(relData.total_arrecadado)}</b></Badge>
                    </div>
                  )}
                </div>
              </div>

              <DataTable title="Detalhes da Data" rows={listaData} loading={loadingListaData} />
            </>
          )}

          {/* INTERVALO */}
          {section === "intervalo" && (
            <>
              <div className="rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/10 p-4">
                <div className="flex items-center gap-2">
                  <FileBarChart className="text-sky-600" />
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Relatório por Intervalo</h2>
                </div>

                <div className="mt-4">
                  <Formik initialValues={{ ini: today(), fim: today() }} onSubmit={(v) => loadIntervalo(v.ini, v.fim)}>
                    {({ isSubmitting }) => (
                      <Form className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data inicial</label>
                          <Field
                            name="ini"
                            type="date"
                            className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data final</label>
                          <Field
                            name="fim"
                            type="date"
                            className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loadingIntervalo || isSubmitting}
                          className="h-[44px] px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium disabled:opacity-50"
                        >
                          {loadingIntervalo ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Gerar"}
                        </button>
                      </Form>
                    )}
                  </Formik>

                  <div className="mt-4">
                    {relIntervalo ? (
                      <div className="flex flex-wrap gap-2">
                        <Badge icon={<CalendarRange size={16} className="text-sky-600" />}>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Período</span>
                          <span className="font-semibold text-gray-900 dark:text-white ml-2">{relIntervalo.inicio} → {relIntervalo.fim}</span>
                        </Badge>
                        <Badge icon={<Soup size={16} className="text-sky-600" />}>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total almoços</span>
                          <span className="font-semibold text-gray-900 dark:text-white ml-2">{relIntervalo.total_almocos}</span>
                        </Badge>
                        <Badge icon={<Coins size={16} className="text-sky-600" />}>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total arrecadado</span>
                          <span className="font-semibold text-gray-900 dark:text-white ml-2">
                            {stn(relIntervalo.total_arrecadado ?? relIntervalo.total ?? relIntervalo.total_almocado)}
                          </span>
                        </Badge>
                      </div>
                    ) : (
                      <EmptyHint icon={<FileBarChart size={48} className="mx-auto opacity-50" />} title="Selecione um intervalo" subtitle="Defina as datas para ver os totais." />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MENSAL */}
          {section === "mensal" && (
            <>
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-900/10 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="text-amber-600" />
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Relatório Mensal</h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => relMensal && window.print()}
                      disabled={!relMensal}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 print:hidden"
                      title="Imprimir relatório"
                    >
                      <Printer size={16} />
                      <span className="hidden sm:inline">Imprimir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => relMensal && exportCSV(linhasMensal, { ano: relMensal.ano, mes: relMensal.mes })}
                      disabled={!relMensal}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      <FileDown size={16} />
                      <span className="hidden sm:inline">Exportar CSV</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <Formik
                    initialValues={{ ano: new Date().getFullYear(), mes: new Date().toLocaleString("pt-PT", { month: "long" }) }}
                    onSubmit={(v) => loadMensal(v.ano, v.mes)}
                  >
                    {({ isSubmitting }) => (
                      <Form className="grid gap-3 md:grid-cols-[160px_200px_auto] items-end">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ano</label>
                          <Field
                            name="ano"
                            type="number"
                            className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mês</label>
                          <Field
                            as="select"
                            name="mes"
                            className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          >
                            {[
                              "janeiro","fevereiro","março","abril","maio","junho",
                              "julho","agosto","setembro","outubro","novembro","dezembro"
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
                          className="h-[44px] px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium disabled:opacity-50"
                        >
                          {loadingMensal ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Gerar"}
                        </button>
                      </Form>
                    )}
                  </Formik>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                {relMensal ? (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Almoços de {relMensal.mes} de {relMensal.ano}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Resumo financeiro por turma</p>
                    </div>

                    <div className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr className="text-left text-gray-700 dark:text-gray-300">
                            <th className="px-6 py-4 font-semibold w-24">Ano</th>
                            <th className="px-6 py-4 font-semibold">Turma</th>
                            <th className="px-6 py-4 font-semibold">Nº de Almoços</th>
                            <th className="px-6 py-4 font-semibold text-right">Valor por Turma</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {linhasMensal.length ? (
                            linhasMensal.map((r, idx) => (
                              <tr key={(r.turma || "-") + idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{getAnoFromTurma(r.turma)}</td>
                                <td className="px-6 py-4">
                                  {r.turma ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                      {r.turma}
                                    </span>
                                  ) : "-"}
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{Number(r.qtd || 0)}</td>
                                <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-white">{stn(r.total || 0)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-6 py-12">
                                <EmptyHint title="Sem dados" subtitle="Não existem almoços registados para este mês." />
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {linhasMensal.length > 0 && (
                          <tfoot className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                            <tr className="font-semibold text-gray-900 dark:text-white">
                              <td className="px-6 py-4" colSpan={3}>Valor total do mês</td>
                              <td className="px-6 py-4 text-right font-mono">{stn(totalMensal)}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </>
                ) : (
                  <EmptyHint icon={<Coins size={48} className="mx-auto opacity-50" />} title="Selecione o ano e o mês" />
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Modal de Preço */}
      <Modal open={openPreco} onClose={() => setOpenPreco(false)} title="Definir Preço do Almoço" size="md">
        <Formik
          enableReinitialize
          initialValues={{ preco: Number(precoPadrao || 0).toFixed(2), aplicarHoje: true }}
          onSubmit={async (v, { setSubmitting }) => {
            await atualizarPreco(Number(v.preco || 0), { aplicarHoje: !!v.aplicarHoje });
            setSubmitting(false);
            setOpenPreco(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preço padrão (STN)</label>
                <Field
                  name="preco"
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Preço atual para hoje: <b>{stn(precoHoje)}</b>
                </p>
              </div>

              <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <Field type="checkbox" name="aplicarHoje" className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Aplicar também para hoje</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Atualiza imediatamente o preço para os almoços de hoje</div>
                </div>
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setOpenPreco(false)}
                  className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || updatingPreco}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50"
                >
                  {isSubmitting || updatingPreco ? <Loader2 size={18} className="animate-spin" /> : <Settings size={18} />}
                  Guardar Preço
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>

      <Toast msg={toast} tone={tone} onClose={() => setToast("")} />

      {/* Estilos utilitários e impressão */}
      <style>{`
        .btn-soft { 
          display:flex; align-items:center; gap:.5rem; 
          padding:.6rem .8rem; border-radius: .75rem;
          border: 1px solid var(--tw-color-gray-200);
        }
        .dark .btn-soft { border-color: rgb(55 65 81); }
        .btn-soft:hover { background: rgb(249 250 251); }
        .dark .btn-soft:hover { background: rgb(55 65 81 / .6); }
        @media print {
          @page { margin: 14mm; }
          body { background: white !important; }
          header, .print\\:hidden, button { display: none !important; }
          .rounded-2xl { border-radius: 0 !important; }
          .shadow-sm { box-shadow: none !important; }
        }
      `}</style>
    </main>
  );
}
