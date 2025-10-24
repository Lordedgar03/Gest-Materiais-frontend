// src/pages/Caixa.jsx
"use client";

import React from "react";
import {
  Banknote, LockOpen, Lock, CalendarDays, X, ChevronRight,
  DollarSign, ReceiptText, Info, CheckCircle2, ShieldAlert, Clock4, TrendingUp,
  Percent, ArrowRightCircle, CreditCard, AlertCircle
} from "lucide-react";
import { useCaixa } from "../hooks/useCaixa";

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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200/70 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t border-gray-200 dark:border-gray-700">{footer}</div>}
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
        <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100" aria-label="Fechar">
          ✕
        </button>
      </div>
    </div>
  );
}

/* ============== Página: Caixa ============== */
export default function Caixa() {
  const {
    allowed,
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
    abrirCaixa,
    fecharCaixa,
    fmt,
  } = useCaixa();

  if (loading) {
    return (
      <main className="min-h-screen p-2 bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 dark:from-gray-950 dark:via-indigo-950/30 dark:to-blue-950/20">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-24 rounded-2xl bg-white/70 dark:bg-gray-900/50 border border-gray-200/70 dark:border-gray-800 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/70 dark:bg-gray-900/50 border border-gray-200/70 dark:border-gray-800 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="h-72 rounded-2xl bg-white/70 dark:bg-gray-900/50 border border-gray-200/70 dark:border-gray-800 animate-pulse" />
            <div className="h-72 rounded-2xl bg-white/70 dark:bg-gray-900/50 border border-gray-200/70 dark:border-gray-800 animate-pulse lg:col-span-2" />
          </div>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-950 dark:to-indigo-950/30">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 p-6 text-center shadow-xl backdrop-blur">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 grid place-items-center">
            <ShieldAlert className="text-rose-700 dark:text-rose-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Sem permissão</h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            O seu utilizador não tem acesso ao módulo <b>Vendas (Caixa)</b>.
          </p>
        </div>
      </main>
    );
  }

  const saldoInicial = Number(cash?.cx_saldo_inicial || 0);
  const recebidoHoje = Number(resume?.total || 0);
  const estimadoFinal = saldoInicial + recebidoHoje;

  return (
    <main className="min-h-screen p-2 bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 dark:from-gray-950 dark:via-indigo-950/30 dark:to-blue-950/20">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <header className="sticky top-4 z-10">
          <div className="rounded-2xl px-5 py-4 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/70 dark:border-gray-800 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-indigo-600 grid place-items-center shadow">
                  <Banknote className="text-white" size={22} aria-hidden />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Caixa</h1>
                  <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2 text-sm">
                    <CalendarDays size={16} /> {new Date().toLocaleDateString("pt-PT")}
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Clock4 size={14} /> {new Date().toLocaleTimeString("pt-PT")}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusPill aberto={isAberto} />

                {!isAberto ? (
                  <button
                    onClick={() => { setInitialBalance(""); setOpenOpenModal(true); }}
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
          <KPI title="Saldo inicial" value={fmt(saldoInicial)} subtitle="definido na abertura" icon={<DollarSign />} tone="indigo" />
          <KPI title="Vendas (pagas)" value={resume?.qtd ?? 0} subtitle="contagem do dia" icon={<TrendingUp />} tone="blue" />
          <KPI title="Descontos" value={`- ${fmt(resume?.desconto || 0)}`} subtitle="aplicados hoje" icon={<Percent />} tone="amber" />
          <KPI title="Recebido hoje" value={fmt(recebidoHoje)} subtitle="entradas no caixa" icon={<CreditCard />} tone="emerald" />
        </section>

        {/* Painéis */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Operações e resumo */}
          <div className="rounded-2xl p-5 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/70 dark:border-gray-800 shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Operações</h2>

            <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-600 dark:from-indigo-600 dark:to-indigo-600 border border-indigo-700 p-3 text-sm text-white flex items-start gap-3">
              <Info className="mt-0.5 shrink-0" size={18} />
              <div>
                <p>Abra o caixa para registrar vendas e acompanhe os totais do dia em tempo real.</p>
                <p>Feche o caixa ao final do expediente para consolidar o saldo.</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {!isAberto ? (
                <button
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  onClick={() => { setInitialBalance(""); setOpenOpenModal(true); }}
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
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Resumo rápido</h3>
              <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-200">
                <li className="flex items-center justify-between">
                  <span>Saldo inicial</span><b>{fmt(saldoInicial)}</b>
                </li>
                <li className="flex items-center justify-between">
                  <span>Recebido hoje</span><b>{fmt(recebidoHoje)}</b>
                </li>
                <li className="flex items-center justify-between text-amber-700 dark:text-amber-300">
                  <span>Descontos</span><b>- {fmt(resume?.desconto || 0)}</b>
                </li>
                <li className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <span>Saldo final estimado</span><b>{fmt(estimadoFinal)}</b>
                </li>
              </ul>
            </div>
          </div>

          {/* Vendas de hoje */}
          <div className="lg:col-span-2 rounded-2xl p-5 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/70 dark:border-gray-800 shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ReceiptText className="text-indigo-600" /> Vendas de hoje
              </h2>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {salesToday.length} registro{salesToday.length === 1 ? "" : "s"}
              </span>
            </div>

            {salesToday.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <AlertCircle className="text-gray-400" />
                Nenhuma venda registrada ainda.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/60">
                    <tr>
                      <Th>Cod.</Th>
                      <Th>Hora</Th>
                      <Th className="text-right">Subtotal</Th>
                      <Th className="text-right">Desconto</Th>
                      <Th className="text-right">Total</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900">
                    {salesToday.map((s, idx) => (
                      <tr key={s.ven_id} className={`border-t border-gray-200 dark:border-gray-800 ${idx % 2 ? "bg-gray-50/50 dark:bg-gray-900/40" : ""}`}>
                        <Td className="font-medium">{s.ven_codigo}</Td>
                        <Td>{new Date(s.ven_data).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</Td>
                        <Td className="text-right">{fmt(s.ven_subtotal)}</Td>
                        <Td className="text-right text-amber-700 dark:text-amber-300">- {fmt(s.ven_desconto)}</Td>
                        <Td className="text-right font-semibold">{fmt(s.ven_total)}</Td>
                        <Td><StatusBadge value={s.ven_status} /></Td>
                      </tr>
                    ))}
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
          title={<span className="inline-flex items-center gap-2"><DollarSign className="text-indigo-600" /> Abrir caixa</span>}
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpenOpenModal(false)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                Cancelar
              </button>
              <button onClick={abrirCaixa} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
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
          title={<span className="inline-flex items-center gap-2"><Lock className="text-rose-600" /> Fechar caixa</span>}
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpenCloseModal(false)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                Cancelar
              </button>
              <button onClick={fecharCaixa} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold">
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
              <span>Saldo inicial</span><b>{fmt(saldoInicial)}</b>
            </li>
            <li className="flex items-center justify-between">
              <span>Recebido hoje</span><b>{fmt(recebidoHoje)}</b>
            </li>
            <li className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
              <span>Saldo final estimado</span><b>{fmt(estimadoFinal)}</b>
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
    indigo: "ring-indigo-200/60 from-white to-indigo-50/70 dark:from-gray-900 dark:to-indigo-950/30",
    blue: "ring-blue-200/60 from-white to-blue-50/70 dark:from-gray-900 dark:to-blue-950/30",
    amber: "ring-amber-200/60 from-white to-amber-50/70 dark:from-gray-900 dark:to-amber-950/20",
    emerald: "ring-emerald-200/60 from-white to-emerald-50/70 dark:from-gray-900 dark:to-emerald-950/20",
  };
  const ring = rings[tone] || rings.indigo;

  return (
    <div className={`rounded-2xl p-4 bg-gradient-to-b ${ring} ring-1`}>
      <div className="flex items-start justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-300">{title}</div>
        {icon && <div className="h-8 w-8 rounded-xl bg-black/5 dark:bg-white/5 grid place-items-center">{icon}</div>}
      </div>
      <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
      {subtitle && <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>}
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-3 py-2 text-gray-900 dark:text-gray-100 ${className}`}>{children}</td>;
}

function StatusBadge({ value }) {
  const map = {
    Paga: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Estornada: "bg-amber-100 text-amber-800 border-amber-200",
    Cancelada: "bg-rose-100 text-rose-800 border-rose-200",
  };
  const cls = map[value] || "bg-gray-100 text-gray-800 border-gray-200";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {value}
    </span>
  );
}
