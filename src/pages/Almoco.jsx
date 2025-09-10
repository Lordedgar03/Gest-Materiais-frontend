/* eslint-disable no-unused-vars */
"use client";

import React from "react";
import {
  Utensils,
  Sparkles,
  CalendarDays,
  Settings,
  Loader2,
  CheckCircle2,
  X,
  Printer,
  FileDown,
} from "lucide-react";
import { Formik, Form, Field } from "formik";
import useAlmoco from "../hooks/useAlmoco";

/* ========== UI bits ========== */
function Modal({ open, title, onClose, children, footer }) {
  React.useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button aria-label="Fechar" onClick={onClose} className="p-2 rounded hover:bg-gray-100">
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
function Toast({ msg, tone = "ok", onClose }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`flex items-start gap-3 rounded-xl ${
          tone === "error" ? "bg-rose-600" : "bg-gray-900"
        } text-white px-4 py-3 shadow-xl`}
      >
        <CheckCircle2 className="mt-0.5 text-emerald-300" />
        <div className="text-sm whitespace-pre-line">{msg}</div>
        <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100" aria-label="Fechar">
          ✕
        </button>
      </div>
    </div>
  );
}
const KPI = ({ title, value, emoji }) => (
  <div className="rounded-2xl p-4 bg-gradient-to-b from-indigo-50 to-white ring-1 ring-indigo-200/60">
    <div className="text-sm text-gray-600 flex items-center gap-2">
      <span className="text-lg" aria-hidden>
        {emoji}
      </span>
      {title}
    </div>
    <div className="text-2xl md:text-3xl font-semibold text-gray-900">{value}</div>
  </div>
);
/* badges/mini stats */
const Badge = ({ children, tone = "indigo" }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
      tone === "teal"
        ? "bg-teal-50 text-teal-700 ring-teal-200/60"
        : tone === "rose"
        ? "bg-rose-50 text-rose-700 ring-rose-200/60"
        : "bg-indigo-50 text-indigo-700 ring-indigo-200/60"
    }`}
  >
    {children}
  </span>
);

/* ========== helpers ========== */
const totalArrecadado = (rows) =>
  rows.reduce((s, r) => s + (r.ala_status === "Pago" ? Number(r.ala_valor || 0) : 0), 0);

/* extrai o “ano” da string da turma (ex.: "9A", "9º A", "11 CSE" → 9/11; senão "-") */
const getAnoFromTurma = (t) => {
  const s = String(t || "").trim();
  const m = s.match(/(\d{1,2})/);
  return m ? Number(m[1]) : "-";
};
/* ordenação Ano -> Turma */
const ordenarTurmas = (a, b) => {
  const an = getAnoFromTurma(a.turma);
  const bn = getAnoFromTurma(b.turma);
  if (an === "-" && bn !== "-") return 1;
  if (bn === "-" && an !== "-") return -1;
  if (an !== "-" && bn !== "-" && an !== bn) return an - bn;
  return String(a.turma || "").localeCompare(String(b.turma || ""));
};
/* CSV mensal (cliente) */
const exportCSV = (rows, meta) => {
  const head = ["Ano", "Turma", "Nº de almoços", "Valor por turma"];
  const lines = [head.join(";")];
  rows.forEach((r) =>
    lines.push([getAnoFromTurma(r.turma), r.turma || "-", Number(r.qtd || 0), Number(r.total || 0)].join(";")),
  );
  const total = rows.reduce((s, r) => s + Number(r.total || 0), 0);
  lines.push(["", "", "TOTAL", total].join(";"));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-almoco-${meta?.ano || ""}-${String(meta?.mes || "").replace(/\s+/g, "_")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/* ========== Página ========== */
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

    money,
    today,
  } = useAlmoco();

  const [openPreco, setOpenPreco] = React.useState(false);

  const linhasMensal = React.useMemo(
    () => (Array.isArray(relMensal?.porTurma) ? [...relMensal.porTurma].sort(ordenarTurmas) : []),
    [relMensal],
  );
  const totalMensal = React.useMemo(
    () => Number(relMensal?.totalGeral?.total_arrecadado || 0),
    [relMensal],
  );

  if (loadingBoot) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </main>
    );
  }
  if (!allowed) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-rose-100 grid place-items-center">
            <X className="text-rose-600" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Sem permissão</h2>
          <p className="text-gray-600 text-sm">Solicite acesso ao módulo Almoço.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-25 via-white to-white space-y-6 p-3 md:p-6">
      {/* HEADER */}
      <header className="rounded-2xl p-5 md:p-6 bg-white border shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-indigo-100 grid place-items-center">
            <Utensils className="text-indigo-600" size={22} aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Almoço Escolar <span className="inline-block align-middle">🍽️</span>
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <CalendarDays size={16} /> {new Date().toLocaleDateString("pt-PT")}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpenPreco(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm md:text-base"
        >
          <Settings size={18} /> Definir preço
        </button>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPI title="Almoços hoje" value={loadingHoje ? "…" : relHoje?.totais?.total_almocos || 0} emoji="🍛" />
        <KPI
          title="Arrecadado hoje"
          value={loadingHoje ? "…" : money(relHoje?.totais?.total_arrecadado || 0)}
          emoji="💰"
        />
        <KPI title="Preço" value={`${money(precoPadrao)}`} emoji="🏷️" />
      </section>

      {/* LISTA DE HOJE */}
      <section className="rounded-2xl p-5 bg-white border shadow-sm">
        <h2 className="text-lg md:text-xl font-semibold mb-3">Almoços de hoje</h2>
        <div className="overflow-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Aluno</th>
                <th className="px-3 py-2 text-left">Nº processo</th>
                <th className="px-3 py-2 text-left">Turma</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {loadingListaHoje ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                    Carregando…
                  </td>
                </tr>
              ) : listaHoje.length ? (
                listaHoje.map((r) => (
                  <tr key={r.ala_id} className="border-t">
                    <td className="px-3 py-2">{r.alu_nome}</td>
                    <td className="px-3 py-2">{r.alu_num_processo || "-"}</td>
                    <td className="px-3 py-2">{r.alu_turma || "-"}</td>
                    <td className="px-3 py-2">{r.ala_status}</td>
                    <td className="px-3 py-2 text-right">{money(r.ala_valor)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Sem marcações hoje.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr className="border-t font-medium">
                <td className="px-3 py-2" colSpan={3}>
                  Total
                </td>
                <td className="px-3 py-2">Pago</td>
                <td className="px-3 py-2 text-right">{money(totalArrecadado(listaHoje))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* RELATÓRIO + LISTA POR DATA */}
      <section className="rounded-2xl p-5 bg-white border shadow-sm space-y-4">
        <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
          <Sparkles className="text-indigo-600" /> Relatórios por data
        </h2>

        <Formik
          initialValues={{ d: today() }}
          onSubmit={(v) => {
            if (!v?.d) return;
            loadPorData(v.d);
            loadListaPorData(v.d);
          }}
        >
          {() => (
            <Form className="flex flex-wrap items-end gap-2">
              <label className="text-sm">
                Data
                <Field name="d" type="date" className="block border rounded-xl px-3 py-2 mt-1" />
              </label>
              <button type="submit" className="px-3 py-2 rounded-xl border hover:bg-gray-50">
                {loadingData || loadingListaData ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar"}
              </button>
              {relData && (
                <div className="ml-auto rounded-xl bg-indigo-50 px-3 py-2 ring-1 ring-indigo-200/60 text-sm">
                  Data: <b>{relData.date}</b> • Almoços: <b>{relData.total_almocos}</b> • Arrecadado:{" "}
                  <b>{money(relData.total_arrecadado)}</b>
                </div>
              )}
            </Form>
          )}
        </Formik>

        <div className="overflow-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Aluno</th>
                <th className="px-3 py-2 text-left">Nº processo</th>
                <th className="px-3 py-2 text-left">Turma</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {loadingListaData ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                    Carregando…
                  </td>
                </tr>
              ) : listaData.length ? (
                listaData.map((r) => (
                  <tr key={r.ala_id} className="border-t">
                    <td className="px-3 py-2">{r.alu_nome}</td>
                    <td className="px-3 py-2">{r.alu_num_processo || "-"}</td>
                    <td className="px-3 py-2">{r.alu_turma || "-"}</td>
                    <td className="px-3 py-2">{r.ala_status}</td>
                    <td className="px-3 py-2 text-right">{money(r.ala_valor)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Selecione uma data para visualizar as marcações.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr className="border-t font-medium">
                <td className="px-3 py-2" colSpan={3}>
                  Total
                </td>
                <td className="px-3 py-2">Pago</td>
                <td className="px-3 py-2 text-right">{money(totalArrecadado(listaData))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* OUTROS RELATÓRIOS (INTERVALO + MENSAL COMPLETO) */}
      <section className="rounded-2xl p-5 bg-white border shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base md:text-lg font-semibold">Outros relatórios</h3>
          <Badge>Sumários e Mensal detalhado</Badge>
        </div>

        {/* INTERVALO */}
        <div className="rounded-xl ring-1 ring-indigo-200/60 bg-indigo-25/50 p-3 md:p-4">
          <Formik initialValues={{ ini: today(), fim: today() }} onSubmit={(v) => loadIntervalo(v.ini, v.fim)}>
            {() => (
              <Form className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end">
                <label className="text-sm">
                  Início
                  <Field name="ini" type="date" className="block w-full border rounded-xl px-3 py-2 mt-1" />
                </label>
                <label className="text-sm">
                  Fim
                  <Field name="fim" type="date" className="block w-full border rounded-xl px-3 py-2 mt-1" />
                </label>
                <button
                  type="submit"
                  className="h-[38px] mt-6 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loadingIntervalo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar"}
                </button>
              </Form>
            )}
          </Formik>

          <div className="mt-3">
            {relIntervalo ? (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-xl bg-white ring-1 ring-indigo-200/60 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="teal">Período: {relIntervalo.inicio} → {relIntervalo.fim}</Badge>
                  <Badge tone="teal">Almoços: {relIntervalo.total_almocos}</Badge>
                  <Badge tone="teal">Arrecadado: {money(relIntervalo.total_arrecadado)}</Badge>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 px-1">Selecione um intervalo e clique em <b>Gerar</b>.</div>
            )}
          </div>
        </div>

        {/* MENSAL COMPLETO (estilo Access) */}
        <div className="rounded-xl ring-1 ring-pink-200/60 bg-pink-25/50 p-3 md:p-4">
          <Formik
            initialValues={{ ano: new Date().getFullYear(), mes: new Date().toLocaleString("pt-PT", { month: "long" }) }}
            onSubmit={(v) => loadMensal(v.ano, v.mes)}
          >
            {() => (
              <Form className="grid gap-3 md:grid-cols-[180px_220px_auto_auto] items-end">
                <label className="text-sm">
                  Ano
                  <Field name="ano" type="number" className="block w-full border rounded-xl px-3 py-2 mt-1" />
                </label>
                <label className="text-sm">
                  Mês
                  <Field as="select" name="mes" className="block w-full border rounded-xl px-3 py-2 mt-1">
                    {[
                      "janeiro","fevereiro","março","abril","maio","junho",
                      "julho","agosto","setembro","outubro","novembro","dezembro",
                    ].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Field>
                </label>
                <button
                  type="submit"
                  className="h-[38px] mt-6 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {loadingMensal ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar"}
                </button>
                <div className="flex gap-2 justify-end mt-6">
                  <button
                    type="button"
                    className="h-[38px] px-3 rounded-xl border hover:bg-gray-50"
                    onClick={() => relMensal && window.print()}
                    disabled={!relMensal}
                    title="Imprimir"
                  >
                    <span className="inline-flex items-center gap-2"><Printer size={16}/> Imprimir</span>
                  </button>
                  <button
                    type="button"
                    className="h-[38px] px-3 rounded-xl border hover:bg-gray-50"
                    onClick={() =>
                      relMensal && exportCSV(linhasMensal, { ano: relMensal.ano, mes: relMensal.mes })
                    }
                    disabled={!relMensal}
                    title="Exportar CSV"
                  >
                    <span className="inline-flex items-center gap-2"><FileDown size={16}/> CSV</span>
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          {/* Tabela estilo Access */}
          <div className="mt-3">
            {relMensal ? (
              <div className="rounded-2xl bg-white ring-1 ring-pink-200/60 p-4">
                <div className="mb-3">
                  <h4 className="text-base font-semibold text-gray-900">
                    Almoços de {relMensal.mes} / {relMensal.ano}
                  </h4>
                  <p className="text-sm text-gray-600">Resumo por turma</p>
                </div>

                <div className="overflow-auto rounded-xl border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left w-24">Ano</th>
                        <th className="px-3 py-2 text-left">Turma</th>
                        <th className="px-3 py-2 text-left">Nº de almoços</th>
                        <th className="px-3 py-2 text-right">Valor por turma</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhasMensal.length ? (
                        linhasMensal.map((r, idx) => (
                          <tr key={(r.turma || "-") + idx} className="border-t">
                            <td className="px-3 py-2">{getAnoFromTurma(r.turma)}</td>
                            <td className="px-3 py-2">{r.turma || "-"}</td>
                            <td className="px-3 py-2">{Number(r.qtd || 0)}</td>
                            <td className="px-3 py-2 text-right">{money(r.total || 0)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                            Sem pagamentos no período.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr className="border-t font-medium">
                        <td className="px-3 py-3" colSpan={3}>
                          Valor Total do mês
                        </td>
                        <td className="px-3 py-3 text-right">{money(totalMensal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 px-1">Escolha ano e mês e clique em <b>Gerar</b>.</div>
            )}
          </div>
        </div>
      </section>

      {/* MODAL PREÇO */}
      <Modal open={openPreco} onClose={() => setOpenPreco(false)} title="Preço do almoço">
        <Formik
          enableReinitialize
          initialValues={{ preco: Number(precoPadrao || 0).toFixed(2), aplicarHoje: true }}
          onSubmit={async (v) => {
            await atualizarPreco(Number(v.preco || 0), { aplicarHoje: !!v.aplicarHoje });
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Preço padrão (EUR)</label>
                <Field
                  name="preco"
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border rounded-xl px-3 py-2 mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Preço atual hoje: <b>{money(precoHoje)}</b>
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Field type="checkbox" name="aplicarHoje" className="h-4 w-4" />
                Aplicar também para hoje
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || updatingPreco}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isSubmitting || updatingPreco ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
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

      {/* estilos de impressão (aplica no relatório mensal) */}
      <style jsx global>{`
        @media print {
          @page { margin: 14mm; }
          body { background: white !important; }
          header, .print\\:hidden { display: none !important; }
        }
      `}</style>
    </main>
  );
}
