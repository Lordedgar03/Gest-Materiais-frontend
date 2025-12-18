/* eslint-disable no-unused-vars */
"use client";

import React from "react";
import {
  CalendarCheck2, Search, Loader2, Plus, X, Users,
  CheckCircle, Clock, AlertCircle, Filter, Calendar, Trash2,
  DollarSign, CalendarDays, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Rows
} from "lucide-react";
import { Formik, Form, Field } from "formik";
import useMarcacao from "../hooks/useMarcacao";

/* ================= helpers ================= */
const cx = (...xs) => xs.filter(Boolean).join(" ");
const useDebounced = (v, d = 350) => {
  const [val, setVal] = React.useState(v);
  React.useEffect(() => { const t = setTimeout(() => setVal(v), d); return () => clearTimeout(t); }, [v, d]);
  return val;
};

/* ================= componente ================= */
export default function Marcacoes() {
  const {
    date, setDate, list, loading, load, marcar, atualizar, searchAlunos,
    toast, setToast, selectedAluno, setSelectedAluno,
    multiDates, addDate, removeDate
  } = useMarcacao();

  const [query, setQuery] = React.useState("");
  const dq = useDebounced(query, 300);
  const [sug, setSug] = React.useState([]);
  const [tempDate, setTempDate] = React.useState(date);
  const [statusFilter, setStatusFilter] = React.useState("all");

  // densidade e paginação
  const [dense, setDense] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  React.useEffect(() => { load({ data: date }); }, [load, date]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const q = dq.trim();
      if (!q) { setSug([]); return; }
      const s = await searchAlunos({ query: q });
      if (active) setSug((s || []).slice(0, 8));
    })();
    return () => { active = false; };
  }, [dq, searchAlunos]);

  const filteredList = React.useMemo(() => {
    if (statusFilter === "all") return list;
    const key = statusFilter.toLowerCase();
    return list.filter(item =>
      String(item.alm_statusot || item.ala_status || "").toLowerCase() === key
    );
  }, [list, statusFilter]);

  // paginação (reset ao mudar filtro)
  React.useEffect(() => { setPage(1); }, [statusFilter, list.length]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const pageData = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, page, pageSize]);

  const getStatusIcon = (status) => {
    const k = String(status || "").toLowerCase();
    if (k === "pago") return <CheckCircle size={14} className="text-emerald-600" />;
    if (k === "não pago") return <Clock size={14} className="text-amber-600" />;
    return <AlertCircle size={14} className="text-gray-400" />;
  };

  const getStatusColor = (status) => {
    const k = String(status || "").toLowerCase();
    if (k === "pago") return "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-700/40";
    if (k === "não pago") return "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-700/40";
    return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-white/5 dark:text-gray-300 dark:border-white/10";
  };

  return (
    <main className="min-h-screen p-2 space-y-6 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* HEADER */}
      <header className="rounded-2xl border border-gray-300/70 dark:border-white/10 bg-white/80 dark:bg-gray-950/60 backdrop-blur px-5 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 text-white grid place-items-center">
              <CalendarCheck2 size={20} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold">Gestão de Marcações</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pesquise alunos e marque almoços (uma ou várias datas)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-orange-300/70 dark:border-amber-700/30 bg-orange-50/70 dark:bg-amber-900/20 px-4 py-2.5">
              <div className="text-[11px] font-medium text-orange-700 dark:text-amber-300">Data selecionada</div>
              <div className="text-sm font-semibold text-orange-900 dark:text-amber-100 flex items-center gap-2">
                <CalendarDays size={16} />
                {new Date(date).toLocaleDateString("pt-PT")}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only">Alterar Data</span>
              <input
                value={date}
                onChange={(e) => { const v = e.target.value; setDate(v); load({ data: v }); }}
                type="date"
                className="rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-white/10 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                aria-label="Selecionar data"
              />
            </label>
          </div>
        </div>
      </header>

      {/* NOVA MARCAÇÃO */}
      <section className="rounded-2xl border border-gray-300 dark:border-white/10 bg-white/70 dark:bg-gray-950/50 backdrop-blur px-5 py-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="text-orange-600" size={20} /> Nova marcação
        </h2>

        <Formik
          initialValues={{ alunoInput: "", status: "" }}
          onSubmit={async (v, { resetForm }) => {
            const aluno = selectedAluno?.alu_num_processo ?? v.alunoInput?.trim();
            const datas = multiDates.length ? multiDates : [];
            await marcar({ aluno, data: date, status: v.status || undefined, datas });
            resetForm(); setQuery(""); setSug([]); setSelectedAluno(null);
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="space-y-6">
              {/* busca de aluno + status */}
              <div className="grid gap-4 md:grid-cols-[minmax(280px,1fr)_220px]">
                <div className="relative">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Pesquisar aluno</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Field
                      name="alunoInput"
                      placeholder="Nome ou nº de processo…"
                      value={values.alunoInput}
                      onChange={(e) => {
                        setFieldValue("alunoInput", e.target.value);
                        setSelectedAluno(null);
                        setQuery(e.target.value);
                      }}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-white/10 outline-none focus:ring-2 focus:ring-orange-400/60"
                      aria-autocomplete="list"
                      aria-expanded={sug.length > 0}
                    />
                  </div>

                  {/* sugestões */}
                  {sug.length > 0 && values.alunoInput && (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-gray-950 shadow-xl max-h-64 overflow-auto">
                      {sug.map((a) => (
                        <button
                          type="button"
                          key={`${a.alu_id}-${a.alu_num_processo}`}
                          className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-white/5 border-b last:border-0 border-gray-100 dark:border-white/10"
                          onClick={() => {
                            setFieldValue("alunoInput", String(a.alu_num_processo || a.alu_nome));
                            setSelectedAluno(a);
                            setQuery(""); setSug([]);
                          }}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{a.alu_nome}</div>
                          <div className="text-[12px] text-gray-600 dark:text-gray-400 mt-0.5 flex flex-wrap gap-x-4">
                            <span>Proc: <b>{a.alu_num_processo}</b></span>
                            <span>Nº: <b>{a.alu_numero ?? "-"}</b></span>
                            <span>Turma: <b>{a.alu_turma ?? "-"}</b></span>
                            <span>Ano: <b>{a.alu_ano ?? "-"}</b></span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Status do pagamento</label>
                  <Field
                    as="select"
                    name="status"
                    className="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-white/10 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                  >
                    <option value="">Padrão</option>
                    <option value="pago">Pago</option>
                    <option value="não pago">Não pago</option>
                  </Field>
                </div>
              </div>

              {/* cartão aluno selecionado */}
              {selectedAluno && (
                <div className="rounded-2xl border border-orange-300/80 dark:border-amber-700/40 bg-orange-50/70 dark:bg-amber-900/10 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                      <Users size={18} className="text-orange-600" /> Aluno selecionado
                    </h3>
                    <button
                      type="button"
                      onClick={() => { setSelectedAluno(null); setFieldValue("alunoInput", ""); }}
                      className="p-2 rounded-lg hover:bg-orange-100 dark:hover:bg-amber-800/30"
                      aria-label="Limpar aluno"
                    >
                      <X size={16} className="text-orange-600" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
                    <Info label="Nome" value={selectedAluno.alu_nome} />
                    <Info label="Nº Processo" value={selectedAluno.alu_num_processo} />
                    <Info label="Número" value={selectedAluno.alu_numero} />
                    <Info label="Ano" value={selectedAluno.alu_ano} />
                    <Info label="Turma" value={selectedAluno.alu_turma} />
                  </div>
                </div>
              )}

              {/* múltiplas datas */}
              <div className="rounded-2xl border border-gray-300/70 dark:border-white/10 p-5">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Calendar className="text-orange-600" size={18} /> Marcar em várias datas
                </h4>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Adicionar data</label>
                    <input
                      type="date"
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-white/10 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => tempDate && addDate(tempDate)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                    {multiDates.length > 0 && (
                      <button
                        type="button"
                        onClick={() => multiDates.forEach(d => removeDate(d))}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <Trash2 size={16} /> Limpar
                      </button>
                    )}
                  </div>
                </div>

                {multiDates.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Datas selecionadas ({multiDates.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {multiDates.map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-amber-800/30 text-orange-800 dark:text-amber-300 border border-orange-300 dark:border-amber-700 text-xs"
                        >
                          <Calendar size={14} />
                          {new Date(d).toLocaleDateString("pt-PT")}
                          <button
                            type="button"
                            onClick={() => removeDate(d)}
                            className="ml-1 p-0.5 rounded-full hover:bg-orange-300 dark:hover:bg-amber-700/40"
                            aria-label={`Remover ${new Date(d).toLocaleDateString("pt-PT")}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                  {multiDates.length > 0
                    ? `Serão marcados almoços para ${multiDates.length} data(s).`
                    : `Será marcado um almoço para ${new Date(date).toLocaleDateString("pt-PT")}.`}
                </p>
              </div>

              {/* enviar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setDense(d => !d)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-sm"
                  aria-pressed={dense}
                >
                  <Rows size={16} />
                  Densidade: <b>{dense ? "Compacto" : "Conforto"}</b>
                </button>

                <button
                  type="submit"
                  disabled={!values.alunoInput || isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-medium shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CalendarCheck2 size={18} />}
                  {isSubmitting ? "A processar…" : multiDates.length ? `Marcar ${multiDates.length} data(s)` : "Marcar almoço"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </section>

      {/* LISTA DO DIA */}
      <section className="rounded-2xl border border-gray-300 dark:border-white/10 bg-white/70 dark:bg-gray-950/50 overflow-hidden">
        {/* toolbar da lista */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarCheck2 className="text-orange-600" size={20} />
            Marcações — {new Date(date).toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <label className="sr-only" htmlFor="status">Filtrar por status</label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/60"
            >
              <option value="all">Todos</option>
              <option value="pago">Pago</option>
              <option value="não pago">Não pago</option>
            </select>

            {/* seletor page size */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 ml-auto">
              <span>Linhas:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-white/10 px-2 py-1.5"
              >
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="hidden sm:inline">•</span>
              <span>{filteredList.length} registos</span>
            </div>
          </div>
        </div>

        {/* loading / vazio / tabela */}
        {loading ? (
          <div className="p-8 grid gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-11 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse" />)}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-14 text-center">
            <div className="text-gray-500 dark:text-gray-400 space-y-2">
              <CalendarCheck2 size={40} className="mx-auto opacity-60" />
              <p className="font-medium">Nenhuma marcação encontrada</p>
              <p className="text-xs">Ajuste o filtro ou selecione outra data</p>
            </div>
          </div>
        ) : (
          <>
            {/* tabela (>= sm) */}
            <div className="hidden sm:block overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-100 dark:border-white/10">
                  <tr className={cx("text-left text-gray-700 dark:text-gray-300", dense ? "": "")}>
                    <Th dense={dense}>Aluno</Th>
                    <Th dense={dense}>Nº Processo</Th>
                    <Th dense={dense}>Turma</Th>
                    <Th dense={dense}>Ano</Th>
                    <Th dense={dense}>Status</Th>
                    <Th dense={dense} className="text-right">Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((m, i) => (
                    <tr
                      key={m.ala_id ?? i}
                      className={cx(
                        "border-b border-gray-100 dark:border-white/10 hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors",
                        dense ? "": ""
                      )}
                    >
                      <Td dense={dense} className="font-medium text-gray-900 dark:text-white">{m.alu_nome}</Td>
                      <Td dense={dense} className="text-gray-600 dark:text-gray-400">{m.alu_num_processo ?? "-"}</Td>
                      <Td dense={dense}>
                        {m.alu_turma ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/40">
                            {m.alu_turma}
                          </span>
                        ) : "-"}
                      </Td>
                      <Td dense={dense} className="text-gray-600 dark:text-gray-400">{m.alu_ano ?? "-"}</Td>
                      <Td dense={dense}>
                        <span className={cx("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border capitalize", getStatusColor(m.alm_statusot || m.ala_status))}>
                          {getStatusIcon(m.alm_statusot || m.ala_status)}
                          {m.alm_statusot || m.ala_status || "pendente"}
                        </span>
                      </Td>
                      <Td dense={dense} className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => atualizar(m.ala_id, { alm_statusot: "pago" })}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                            title="Marcar como pago"
                            aria-label="Marcar como pago"
                          >
                            <div className="inline-flex items-center gap-1.5"><DollarSign size={12} /> Pago</div>
                          </button>
                          <button
                            onClick={() => atualizar(m.ala_id, { alm_statusot: "não pago" })}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/60"
                            title="Marcar como não pago"
                            aria-label="Marcar como não pago"
                          >
                            <div className="inline-flex items-center gap-1.5"><Clock size={12} /> Não pago</div>
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* cartões (mobile) */}
            <div className="sm:hidden divide-y divide-gray-300 dark:divide-white/10">
              {pageData.map((m, i) => (
                <div key={m.ala_id ?? i} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-medium text-gray-900 dark:text-white">{m.alu_nome}</div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 space-x-3">
                        <span>Proc: <b>{m.alu_num_processo ?? "-"}</b></span>
                        <span>Turma: <b>{m.alu_turma ?? "-"}</b></span>
                        <span>Ano: <b>{m.alu_ano ?? "-"}</b></span>
                      </div>
                    </div>
                    <span className={cx("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border capitalize", getStatusColor(m.alm_statusot || m.ala_status))}>
                      {getStatusIcon(m.alm_statusot || m.ala_status)}
                      {m.alm_statusot || m.ala_status || "pendente"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => atualizar(m.ala_id, { alm_statusot: "pago" })}
                      className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      <div className="inline-flex items-center gap-1.5 justify-center"><DollarSign size={12} /> Pago</div>
                    </button>
                    <button
                      onClick={() => atualizar(m.ala_id, { alm_statusot: "não pago" })}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-xs"
                    >
                      <div className="inline-flex items-center gap-1.5 justify-center"><Clock size={12} /> Não pago</div>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* paginação */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.03]">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Mostrando <b>{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredList.length)}</b> de <b>{filteredList.length}</b>
              </div>

              <div className="flex items-center gap-1">
                <PagerBtn onClick={() => setPage(1)} disabled={page === 1} title="Primeira">
                  <ChevronsLeft size={16} />
                </PagerBtn>
                <PagerBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} title="Anterior">
                  <ChevronLeft size={16} />
                </PagerBtn>

                {/* números (máx 7 visíveis) */}
                <div className="flex items-center gap-1 mx-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let n;
                    if (totalPages <= 7) n = i + 1;
                    else if (page <= 4) n = i + 1;
                    else if (page >= totalPages - 3) n = totalPages - 6 + i;
                    else n = page - 3 + i;

                    return (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={cx(
                          "min-w-[2.2rem] h-9 rounded-lg text-sm font-medium",
                          page === n
                            ? "bg-orange-600 text-white"
                            : "border border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                        )}
                        aria-current={page === n ? "page" : undefined}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>

                <PagerBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} title="Próxima">
                  <ChevronRight size={16} />
                </PagerBtn>
                <PagerBtn onClick={() => setPage(totalPages)} disabled={page === totalPages} title="Última">
                  <ChevronsRight size={16} />
                </PagerBtn>
              </div>
            </div>
          </>
        )}
      </section>

      {/* TOAST */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-lg backdrop-blur bg-emerald-50/90 dark:bg-emerald-900/20 border-emerald-300/60 dark:border-emerald-700/40 text-emerald-900 dark:text-emerald-300"
        >
          <div className="flex items-center gap-3">
            <CheckCircle size={18} />
            <div className="text-sm">{toast}</div>
            <button onClick={() => setToast("")} className="ml-2 rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Fechar">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/* ================= subcomponentes ================= */
function Th({ children, className = "", dense = false }) {
  return (
    <th
      className={cx(
        "px-3 text-left font-medium text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-white/10",
        dense ? "py-2.5 text-[12.5px]" : "py-3.5 text-sm",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "", dense = false }) {
  return (
    <td
      className={cx(
        "px-3 border-b border-gray-100 dark:border-white/10",
        dense ? "py-2.5" : "py-3.5",
        className
      )}
    >
      {children}
    </td>
  );
}

function PagerBtn({ children, onClick, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cx(
        "p-2 rounded-lg transition-colors",
        disabled
          ? "opacity-50 cursor-not-allowed border border-gray-300 dark:border-white/10"
          : "border border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
      )}
    >
      {children}
    </button>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-[11px] text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-900 dark:text-white">{value ?? "-"}</div>
    </div>
  );
}
