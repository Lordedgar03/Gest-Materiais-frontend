// src/pages/Caixa.jsx
import React from "react";
import {
  Banknote,
  LockOpen,
  Lock,
  CalendarDays,
  X,
  ChevronRight,
  DollarSign,
  ReceiptText,
  Info,
  CheckCircle2,
  ShieldAlert,
  Clock4,
  TrendingUp,
  Percent,
  ArrowRightCircle,
  CreditCard,
  AlertCircle,
  Download,
  Printer,
  RefreshCw,
  Filter,
  FileText,
} from "lucide-react";

import { useCaixa } from "../hooks/useCaixa";
import api from "../api";

/* ============== A11y helper ============== */
function useEscapeClose(active, cb) {
  React.useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === "Escape" && cb && cb();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, cb]);
}

/* ============== Modal (JSX) ============== */
function Modal({ open, title, onClose, children, footer }) {
  useEscapeClose(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200/70 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============== Toast (JSX) ============== */
function Toast({ msg, onClose }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex items-start gap-3 rounded-xl bg-gray-900 text-white px-4 py-3 shadow-2xl ring-1 ring-white/10">
        <CheckCircle2 className="mt-0.5 text-emerald-400 shrink-0" />
        <div className="text-sm">{msg}</div>
        <button
          onClick={onClose}
          className="ml-2 opacity-80 hover:opacity-100"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const PAGAMENTOS = [
  "Todos",
  "Dinheiro",
  "Multibanco",
  "Transferencia",
  "Cartão",
  "MB Way",
];

function getRowStatus(r) {
  return String(r?.rec_status ?? r?.status ?? "Emitido");
}

function getRowUserName(r) {
  return (
    r?.user_nome ||
    r?.usuario_nome ||
    r?.utilizador_nome ||
    r?.rec_user_nome ||
    r?.ven_user_nome ||
    r?.nome_utilizador ||
    r?.userName ||
    r?.username ||
    "-"
  );
}

// abre PDF recebendo blob (para manter token)
function openBlobPdf(blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

/* ============== Página: Caixa ============== */
export default function Caixa() {
  const {
    allowed,
    cash,
    loading,
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
    byPay,
    resume,

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

    // ✅ do hook novo
    exportDiaCSV,
    exportDiaPDF,
    printDiaHTML,
    exportMesCSV,
    exportMesPDF,

    fmt,
  } = useCaixa();

  // ✅ PDF do recibo por linha (tenta 2 rotas comuns)
  const openReciboPdf = React.useCallback(
    async (row) => {
      try {
        const status = getRowStatus(row);
        if (status === "Anulado") return;

        const recId = row?.rec_id ?? row?.id ?? null;
        const venId =
          row?.rec_fk_venda ??
          row?.ven_id ??
          row?.venda_id ??
          row?.fk_venda ??
          null;

        // 1) tenta por recibo
        if (recId) {
          try {
            const r1 = await api.get(`/recibos/${recId}/pdf`, {
              responseType: "blob",
            });
            const blob1 = new Blob([r1.data], {
              type: r1?.headers?.["content-type"] || "application/pdf",
            });
            openBlobPdf(blob1);
            return;
          } catch (_) {
            // segue p/ fallback
          }
        }

        // 2) fallback por venda
        if (venId) {
          const r2 = await api.get(`/vendas/${venId}/recibo/pdf`, {
            responseType: "blob",
          });
          const blob2 = new Blob([r2.data], {
            type: r2?.headers?.["content-type"] || "application/pdf",
          });
          openBlobPdf(blob2);
          return;
        }

        setToast(
          "Não foi possível abrir PDF: falta rec_id/ven_id no relatório."
        );
      } catch (e) {
        console.error(e);
        setToast(e?.response?.data?.message || "Falha ao abrir PDF do recibo.");
      }
    },
    [setToast]
  );

  if (loading) {
    return (
      <main className="min-h-screen p-2 bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50 dark:from-gray-950 dark:via-indigo-950/30 dark:to-blue-950/20">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-24 rounded-2xl bg-white/70 dark:bg-gray-900/50 border border-gray-200/70 dark:border-gray-800 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-white/70 dark:bg-gray-900/50 border border-gray-200/70 dark:border-gray-800 animate-pulse"
              />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-white/70 dark:bg-gray-900/50 border border-gray-200/70 dark:border-gray-800 animate-pulse" />
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-linear-to-br from-slate-50 to-indigo-50 dark:from-gray-950 dark:to-indigo-950/30">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 p-6 text-center shadow-xl backdrop-blur">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 grid place-items-center">
            <ShieldAlert className="text-rose-700 dark:text-rose-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Sem permissão
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            O seu utilizador não tem acesso ao módulo <b>Vendas (Caixa)</b>.
          </p>
        </div>
      </main>
    );
  }

  const saldoInicial = Number(cash?.cx_saldo_inicial || 0);
  const totalPeriodo = Number(resume?.total || 0);
  const estimadoFinal = saldoInicial + totalPeriodo;

  return (
    <main className="min-h-screen p-2 bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50 dark:from-gray-950 dark:via-indigo-950/30 dark:to-blue-950/20">
      <div className=" mx-auto space-y-6">
        {/* Header */}
        <header className="sticky top-4 z-10">
          <div className="rounded-2xl px-5 py-4 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/70 dark:border-gray-800 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-indigo-600 grid place-items-center shadow">
                  <Banknote className="text-white" size={22} aria-hidden />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    Caixa
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2 text-sm">
                    <CalendarDays size={16} />{" "}
                    {new Date().toLocaleDateString("pt-PT")}
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Clock4 size={14} />{" "}
                      {new Date().toLocaleTimeString("pt-PT")}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusPill aberto={isAberto} />

                {!isAberto ? (
                  <button
                    onClick={() => {
                      setInitialBalance("");
                      setOpenOpenModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    <LockOpen size={18} /> Abrir
                  </button>
                ) : (
                  <button
                    onClick={() => setOpenCloseModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                  >
                    <Lock size={18} /> Fechar
                  </button>
                )}
                <a
                  href="/pdv"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Ir para Atendimentos <ChevronRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI
            title="Saldo inicial"
            value={fmt(saldoInicial)}
            subtitle="definido na abertura"
            icon={<DollarSign />}
            tone="indigo"
          />
          <KPI
            title="Recibos (emitidos)"
            value={resume?.qtd ?? 0}
            subtitle={reportMode === "dia" ? "no dia" : "no mês"}
            icon={<TrendingUp />}
            tone="blue"
          />
          <KPI
            title="Descontos"
            value={`- ${fmt(resume?.desconto || 0)}`}
            subtitle="no período"
            icon={<Percent />}
            tone="amber"
          />
          <KPI
            title="Total (emitido)"
            value={fmt(totalPeriodo)}
            subtitle="no período"
            icon={<CreditCard />}
            tone="emerald"
          />
        </section>

        {/* Painéis */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Operações e resumo */}
          <div className="rounded-2xl p-5 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/70 dark:border-gray-800 shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Operações
            </h2>

            <div className="rounded-xl bg-linear-to-br from-indigo-600 to-indigo-600 border border-indigo-700 p-3 text-sm text-white flex items-start gap-3">
              <Info className="mt-0.5 shrink-0" size={18} />
              <div>
                <p>
                  Relatórios vêm de <b>tb_recibos</b>. Recibos
                  estornados/cancelados devem ficar <b>Anulado</b>.
                </p>
                <p>Filtra por pagamento e exporta CSV/PDF quando precisares.</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {!isAberto ? (
                <button
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  onClick={() => {
                    setInitialBalance("");
                    setOpenOpenModal(true);
                  }}
                >
                  <LockOpen size={18} /> Abrir caixa
                </button>
              ) : (
                <button
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                  onClick={() => setOpenCloseModal(true)}
                >
                  <Lock size={18} /> Fechar caixa
                </button>
              )}
              <a
                href="/pdv"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Ir para Atendimento <ArrowRightCircle size={18} />
              </a>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Resumo rápido
              </h3>
              <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-200">
                <li className="flex items-center justify-between">
                  <span>Saldo inicial</span>
                  <b>{fmt(saldoInicial)}</b>
                </li>
                <li className="flex items-center justify-between">
                  <span>Total emitido</span>
                  <b>{fmt(totalPeriodo)}</b>
                </li>
                <li className="flex items-center justify-between text-amber-700 dark:text-amber-300">
                  <span>Descontos</span>
                  <b>- {fmt(resume?.desconto || 0)}</b>
                </li>
                <li className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <span>Saldo final estimado</span>
                  <b>{fmt(estimadoFinal)}</b>
                </li>
              </ul>

              <div className="mt-4">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Filter size={14} /> Por forma de pagamento
                </div>
                <div className="space-y-1 text-sm">
                  {Object.keys(byPay || {}).length === 0 ? (
                    <div className="text-xs text-gray-500">Sem dados.</div>
                  ) : (
                    Object.entries(byPay).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex items-center justify-between"
                      >
                        <span>{k}</span>
                        <b>{fmt(v)}</b>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Relatório */}
          <div className="lg:col-span-2 rounded-2xl p-5 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/70 dark:border-gray-800 shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ReceiptText className="text-indigo-600" /> Relatório de recibos
              </h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={refetchAll}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                >
                  <RefreshCw size={16} /> Atualizar
                </button>

                {reportMode === "dia" ? (
                  <>
                    <button
                      onClick={exportDiaCSV}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                    >
                      <Download size={16} /> CSV
                    </button>
                    <button
                      onClick={exportDiaPDF}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                    >
                      <FileText size={16} /> PDF
                    </button>
                    <button
                      onClick={printDiaHTML}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-sm"
                    >
                      <Printer size={16} /> Imprimir
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={exportMesCSV}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                    >
                      <Download size={16} /> CSV
                    </button>
                    <button
                      onClick={exportMesPDF}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                    >
                      <FileText size={16} /> PDF
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setReportMode("dia")}
                  className={`flex-1 px-3 py-2 text-sm ${
                    reportMode === "dia"
                      ? "bg-indigo-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  Dia
                </button>
                <button
                  onClick={() => setReportMode("mes")}
                  className={`flex-1 px-3 py-2 text-sm ${
                    reportMode === "mes"
                      ? "bg-indigo-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  Mês
                </button>
              </div>

              {reportMode === "dia" ? (
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              ) : (
                <>
                  <input
                    type="number"
                    min="2000"
                    value={reportAno}
                    onChange={(e) => setReportAno(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    placeholder="Ano"
                  />
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={reportMes}
                    onChange={(e) => setReportMes(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    placeholder="Mês"
                  />
                </>
              )}

              <select
                value={reportForma}
                onChange={(e) => setReportForma(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                {PAGAMENTOS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              {reportMode === "dia" ? (
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 md:col-span-4">
                  <input
                    type="checkbox"
                    checked={reportIncludeItens}
                    onChange={(e) => setReportIncludeItens(e.target.checked)}
                  />
                  Incluir itens (mais pesado)
                </label>
              ) : null}
            </div>

            {reportLoading ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-sm text-gray-600 dark:text-gray-300">
                Carregando relatório...
              </div>
            ) : reportRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <AlertCircle className="text-gray-400" />
                Sem recibos para o filtro selecionado.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/60">
                    <tr>
                      <Th>Ref.</Th>
                      <Th>Hora</Th>
                      <Th>Cliente</Th>
                      <Th>Utilizador</Th>
                      <Th>Pagamento</Th>
                      <Th className="text-right">Total</Th>
                      <Th className="text-right">Pago</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Ações</Th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900">
                    {reportRows.map((r, idx) => {
                      const ref = r?.rec_ref ?? r?.ref ?? r?.ven_codigo ?? "-";
                      const dt =
                        r?.data ??
                        r?.rec_data ??
                        r?.createdAt ??
                        r?.ven_data ??
                        null;
                      const hora = dt
                        ? new Date(dt).toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-";
                      const cliente =
                        r?.rec_cliente_nome ?? r?.cliente_nome ?? "-";
                      const userNome = getRowUserName(r);
                      const forma =
                        r?.rec_forma_pagamento ?? r?.forma_pagamento ?? "-";
                      const total = Number(r?.rec_total ?? r?.total ?? 0);
                      const pago = Number(
                        r?.rec_valor_pago ?? r?.valor_pago ?? 0
                      );
                      const status = getRowStatus(r);

                      const canPrint = status !== "Anulado";

                      return (
                        <tr
                          key={r?.rec_id ?? `${ref}-${idx}`}
                          className={`border-t border-gray-200 dark:border-gray-800 ${
                            idx % 2 ? "bg-gray-50/50 dark:bg-gray-900/40" : ""
                          }`}
                        >
                          <Td className="font-medium">{ref}</Td>
                          <Td>{hora}</Td>
                          <Td className="max-w-55 truncate">{cliente}</Td>
                          <Td className="max-w-50 truncate">{userNome}</Td>
                          <Td>{forma}</Td>
                          <Td className="text-right font-semibold">
                            {fmt(total)}
                          </Td>
                          <Td className="text-right">{fmt(pago)}</Td>
                          <Td>
                            <StatusBadge value={status} />
                          </Td>
                          <Td className="text-right">
                            <button
                              onClick={() => openReciboPdf(r)}
                              disabled={!canPrint}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border
                                ${
                                  canPrint
                                    ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                                    : "bg-gray-100 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed"
                                }`}
                              title={
                                status === "Anulado"
                                  ? "Recibo anulado"
                                  : "Abrir PDF"
                              }
                            >
                              <FileText size={14} /> PDF
                            </button>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Modais */}
        <Modal
          open={openOpenModal}
          onClose={() => setOpenOpenModal(false)}
          title={
            <span className="inline-flex items-center gap-2">
              <DollarSign className="text-indigo-600" /> Abrir caixa
            </span>
          }
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpenOpenModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={abrirCaixa}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Confirmar
              </button>
            </div>
          }
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Saldo inicial (opcional)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="0,00"
            autoFocus
          />
        </Modal>

        <Modal
          open={openCloseModal}
          onClose={() => setOpenCloseModal(false)}
          title={
            <span className="inline-flex items-center gap-2">
              <Lock className="text-rose-600" /> Fechar caixa
            </span>
          }
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpenCloseModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={fecharCaixa}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Fechar caixa
              </button>
            </div>
          }
        >
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Revise o resumo antes de confirmar o fechamento.
          </p>
          <ul className="text-sm space-y-1">
            <li className="flex items-center justify-between">
              <span>Saldo inicial</span>
              <b>{fmt(saldoInicial)}</b>
            </li>
            <li className="flex items-center justify-between">
              <span>Total emitido (período)</span>
              <b>{fmt(totalPeriodo)}</b>
            </li>
            <li className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
              <span>Saldo final estimado</span>
              <b>{fmt(estimadoFinal)}</b>
            </li>
          </ul>
        </Modal>

        <Toast msg={toast} onClose={() => setToast("")} />
      </div>
    </main>
  );
}

/* ============== Bits pequenos (JSX) ============== */
function StatusPill({ aberto }) {
  return aberto ? (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-emerald-900 bg-emerald-100 border border-emerald-200">
      <LockOpen size={16} /> Aberto
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-900 bg-gray-100 border border-gray-200">
      <Lock size={16} /> Fechado
    </span>
  );
}

function KPI({ title, value, subtitle, icon, tone = "indigo" }) {
  const rings = {
    indigo:
      "ring-indigo-200/60 from-white to-indigo-50/70 dark:from-gray-900 dark:to-indigo-950/30",
    blue: "ring-blue-200/60 from-white to-blue-50/70 dark:from-gray-900 dark:to-blue-950/30",
    amber:
      "ring-amber-200/60 from-white to-amber-50/70 dark:from-gray-900 dark:to-amber-950/20",
    emerald:
      "ring-emerald-200/60 from-white to-emerald-50/70 dark:from-gray-900 dark:to-emerald-950/20",
  };
  const ring = rings[tone] || rings.indigo;

  return (
    <div className={`rounded-2xl p-4 bg-linear-to-b ${ring} ring-1`}>
      <div className="flex items-start justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-300">{title}</div>
        {icon && (
          <div className="h-8 w-8 rounded-xl bg-black/5 dark:bg-white/5 grid place-items-center">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
        {value}
      </div>
      {subtitle && (
        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {subtitle}
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th
      className={`px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`px-3 py-2 text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </td>
  );
}

function StatusBadge({ value }) {
  const v = String(value || "");
  const map = {
    Emitido: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Anulado: "bg-rose-100 text-rose-800 border-rose-200",
  };
  const cls = map[v] || "bg-gray-100 text-gray-800 border-gray-200";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}
    >
      {v || "-"}
    </span>
  );
}
