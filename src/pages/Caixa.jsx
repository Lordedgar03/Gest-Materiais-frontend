"use client";

import React from "react";
import {
  Banknote, LockOpen, Lock, CalendarDays, Loader2, X, ChevronRight,
  DollarSign, ReceiptText, Info, CheckCircle2, ShieldAlert
} from "lucide-react";
import { useCaixa } from "../hooks/useCaixa";

/* ==================== UI: Modal ==================== */
function Modal({ open, title, onClose, children, footer }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/* ==================== UI: Toast ==================== */
function Toast({ msg, onClose }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex items-start gap-3 rounded-xl bg-gray-900 text-white px-4 py-3 shadow-xl">
        <CheckCircle2 className="mt-0.5 text-emerald-400" />
        <div className="text-sm">{msg}</div>
        <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100" aria-label="Fechar">
          ✕
        </button>
      </div>
    </div>
  );
}

/* ==================== Page ==================== */
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
      <main className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </main>
    );
  }

  // Gate visual — sem permissão
  if (!allowed) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-rose-100 grid place-items-center">
            <ShieldAlert className="text-rose-600" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Sem permissão</h2>
          <p className="text-gray-600 text-sm">
            O seu utilizador não tem acesso ao módulo <b>Vendas</b> (Caixa).
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b space-y-6">
      <header className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-indigo-100 grid place-items-center">
            <Banknote className="text-indigo-600" size={22} aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Caixa</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <CalendarDays size={16} /> {new Date().toLocaleDateString("pt-PT")}
            </p>
          </div>
        </div>
        <div>
          {isAberto ? (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-emerald-800 bg-emerald-100">
              <LockOpen size={16} /> Aberto
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-800 bg-gray-100">
              <Lock size={16} /> Fechado
            </span>
          )}
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Saldo inicial" value={fmt(cash?.cx_saldo_inicial || 0)} />
        <KPI title="Vendas (pagas)" value={resume.qtd} />
        <KPI title="Descontos do dia" value={`- ${fmt(resume.desconto)}`} tone="amber" />
        <KPI title="Recebido hoje" value={fmt(resume.total)} tone="emerald" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 bg-white border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Operações</h2>

          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700 flex items-start gap-3">
            <Info className="mt-0.5 text-gray-500" size={18} />
            <div>
              <p>Abra o caixa para registrar vendas no PDV.</p>
              <p className="text-gray-500">Você pode revisar e fechar o caixa ao final do dia.</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {!isAberto ? (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => {
                  setInitialBalance("");
                  setOpenOpenModal(true);
                }}
              >
                <LockOpen size={18} /> Abrir caixa
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => setOpenCloseModal(true)}
              >
                <Lock size={18} /> Fechar caixa
              </button>
            )}
            <a
              href="/pdv"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-800"
            >
              Ir para PDV <ChevronRight size={16} />
            </a>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl p-5 bg-white border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ReceiptText className="text-indigo-600" /> Vendas de hoje
          </h2>
          {salesToday.length === 0 ? (
            <p className="text-gray-600">Nenhuma venda registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <Th>Cod.</Th>
                    <Th>Hora</Th>
                    <Th>Subtotal</Th>
                    <Th>Desconto</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {salesToday.map((s, idx) => (
                    <tr key={s.ven_id} className={`border-t ${idx % 2 ? "bg-gray-50/50" : ""}`}>
                      <Td>{s.ven_codigo}</Td>
                      <Td>
                        {new Date(s.ven_data).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Td>
                      <Td>{fmt(s.ven_subtotal)}</Td>
                      <Td className="text-amber-700">- {fmt(s.ven_desconto)}</Td>
                      <Td className="font-medium">{fmt(s.ven_total)}</Td>
                      <Td>
                        <Status s={s.ven_status} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Modal: Abrir caixa */}
      <Modal
        open={openOpenModal}
        onClose={() => setOpenOpenModal(false)}
        title={
          <span className="inline-flex items-center gap-2">
            <DollarSign className="text-indigo-600" /> Abrir caixa
          </span>
        }
      >
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Saldo inicial (opcional)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="0,00"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setOpenOpenModal(false)} className="px-4 py-2 rounded-lg border">
            Cancelar
          </button>
          <button onClick={abrirCaixa} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">
            Confirmar
          </button>
        </div>
      </Modal>

      {/* Modal: Fechar caixa */}
      <Modal
        open={openCloseModal}
        onClose={() => setOpenCloseModal(false)}
        title={
          <span className="inline-flex items-center gap-2">
            <Lock className="text-rose-600" /> Fechar caixa
          </span>
        }
      >
        <p className="text-sm text-gray-700 mb-3">
          Revise o resumo antes de confirmar o fechamento.
        </p>
        <ul className="text-sm space-y-1">
          <li>
            Saldo inicial: <b>{fmt(cash?.cx_saldo_inicial || 0)}</b>
          </li>
          <li>
            Recebido hoje: <b>{fmt(resume.total)}</b>
          </li>
          <li className="pt-1 border-t">
            Saldo final estimado:{" "}
            <b>
              {fmt(
                Number(cash?.cx_saldo_inicial || 0) + Number(resume.total || 0),
              )}
            </b>
          </li>
        </ul>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setOpenCloseModal(false)} className="px-4 py-2 rounded-lg border">
            Cancelar
          </button>
          <button onClick={fecharCaixa} className="px-4 py-2 rounded-lg bg-rose-600 text-white">
            Fechar caixa
          </button>
        </div>
      </Modal>

      <Toast msg={toast} onClose={() => setToast("")} />
    </main>
  );
}

/* ==================== Small UI bits ==================== */
function KPI({ title, value, tone = "indigo" }) {
  const color = {
    indigo: "from-indigo-50 to-white ring-indigo-200/60",
    emerald: "from-emerald-50 to-white ring-emerald-200/60",
    amber: "from-amber-50 to-white ring-amber-200/60",
  }[tone];
  return (
    <div className={`rounded-2xl p-4 bg-gradient-to-b ${color} ring-1`}>
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
function Th({ children }) {
  return (
    <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase text-xs">
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
function Status({ s }) {
  const map = {
    Paga: "bg-emerald-100 text-emerald-800",
    Estornada: "bg-amber-100 text-amber-800",
    Cancelada: "bg-rose-100 text-rose-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        map[s] || "bg-gray-100 text-gray-800"
      }`}
    >
      {s}
    </span>
  );
}
