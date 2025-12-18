/* eslint-disable no-unused-vars */
"use client";

import React from "react";
import {
  Users, Plus, Upload, Search, Loader2, X, Download, Pencil,
  Power, PowerOff, Filter, ChevronLeft, ChevronRight, ChevronsLeft,
  ChevronsRight, Eye, EyeOff, SunMedium, MoonStar, SortAsc, SortDesc, Check
} from "lucide-react";
import { Formik, Form, Field } from "formik";
import useAlunos from "../hooks/useAlunos";
import api from "../api";

/* ===== helpers ===== */
const cx = (...xs) => xs.filter(Boolean).join(" ");
const useDebounced = (v, d = 400) => {
  const [val, setVal] = React.useState(v);
  React.useEffect(() => { const t = setTimeout(() => setVal(v), d); return () => clearTimeout(t); }, [v, d]);
  return val;
};

/* ===== theme (dark) ===== */
function useTheme() {
  const [dark, setDark] = React.useState(() => typeof window !== "undefined"
    ? document.documentElement.classList.contains("dark") : true);
  React.useEffect(() => {
    const stored = localStorage.getItem("theme") || "dark";
    const isDark = stored === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
  }, []);
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  };
  return { dark, toggle };
}

/* ===== modal minimal ===== */
function Modal({ open, title, onClose, children, footer, size = "md" }) {
  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={cx(
            "w-full rounded-2xl bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-white/10 shadow-2xl",
            sizes[size] || sizes.md
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400/60 hover:bg-gray-50 dark:hover:bg-white/5" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
          {footer && <div className="px-5 py-4 border-t border-gray-100 dark:border-white/10">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/* ===== CSV utils rápidos ===== */
const sep = (t) => (t.split("\n")[0]?.includes(";") ? ";" : ",");
const norm = (h) =>
  String(h || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "_");
const alias = {
  alu_nome: ["alu_nome", "nome", "aluno", "name"],
  alu_num_processo: ["alu_num_processo", "num_processo", "processo", "process_number"],
  alu_numero: ["alu_numero", "numero", "number"],
  alu_turma: ["alu_turma", "turma", "class", "classe"],
  alu_ano: ["alu_ano", "ano", "year"],
  alu_status: ["alu_status", "status", "estado", "state"],
};
const mapHead = (h) => {
  const nh = norm(h);
  for (const [k, list] of Object.entries(alias)) if (list.includes(nh)) return k;
  return nh;
};
const toAluno = (o) => {
  const a = {
    alu_nome: o.alu_nome?.trim() || "",
    alu_num_processo: o.alu_num_processo ? Number(o.alu_num_processo) : null,
    alu_numero: o.alu_numero === "" ? null : o.alu_numero ?? null,
    alu_turma: o.alu_turma?.trim() || null,
    alu_ano: o.alu_ano ? Number(o.alu_ano) : null,
    alu_status: (o.alu_status || "ativo").toString().toLowerCase().includes("inativ") ? "inativo" : "ativo",
  };
  if (!a.alu_nome || !a.alu_num_processo || !a.alu_ano) return null;
  return a;
};
const chunk = (arr, n = 200) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
const exportCSV = (rows) => {
  const head = "alu_id;alu_nome;alu_num_processo;alu_numero;alu_turma;alu_ano;alu_status";
  const body = rows
    .map((r) => [
      r.alu_id ?? r.id ?? "",
      r.alu_nome ?? "",
      r.alu_num_processo ?? "",
      r.alu_numero ?? "",
      r.alu_turma ?? "",
      r.alu_ano ?? "",
      r.alu_status ?? "",
    ].join(";"))
    .join("\n");
  const blob = new Blob([head + "\n" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `alunos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/* ====================================================================== */

export default function Alunos() {
  const {
    loading, list, filters, setFilters, load, create, update, setStatus,
    toast, setToast, error, sort, setSortBy, cols, setCols, density, setDensity
  } = useAlunos();

  const { dark, toggle } = useTheme();

  /* estado UI */
  const [openNew, setOpenNew] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [openImport, setOpenImport] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);

  /* busca rápida acessível */
  const [q, setQ] = React.useState("");
  const dq = useDebounced(q, 450);
  React.useEffect(() => {
    const next = { ...filters, nome: dq, num_processo: "" };
    setFilters(next); setPage(1); load(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);

  /* paginação minimal */
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const pageData = React.useMemo(() => {
    const i = (page - 1) * pageSize;
    return list.slice(i, i + pageSize);
  }, [list, page, pageSize]);
  React.useEffect(() => { if (page > totalPages) setPage(1); }, [page, totalPages]);

  /* seleção simples (para export) */
  const [sel, setSel] = React.useState(new Set());
  const pageIds = React.useMemo(() => pageData.map((a) => a.alu_id || a.id || `${a.alu_num_processo}-${a.alu_turma}`), [pageData]);
  const allPage = pageIds.length > 0 && pageIds.every((id) => sel.has(id));
  const toggleRow = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  React.useEffect(() => { load(); }, [load]);

  /* Import */
  const [fileName, setFileName] = React.useState("");
  const [rowsParsed, setRowsParsed] = React.useState([]);
  const [preview, setPreview] = React.useState([]);
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState(null);

  const handleFile = async (file) => {
    setImportResult(null);
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      const s = sep(text);
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) { setToast({ type: "error", message: "CSV vazio." }); return; }
      const headers = lines[0].split(s).map(mapHead);
      const data = []; const ignored = [];
      for (let i = 1; i < lines.length; i++) {
        const o = {}; const cols = lines[i].split(s);
        headers.forEach((h, k) => (o[h] = cols[k] ?? ""));
        const a = toAluno(o); if (a) data.push(a); else ignored.push(i + 1);
      }
      setRowsParsed(data);
      setPreview(data.slice(0, 8));
      if (ignored.length) setToast({ type: "warning", message: `${ignored.length} linhas ignoradas.` });
    } catch { setToast({ type: "error", message: "Falha ao ler CSV." }); }
  };

  const startImport = async () => {
    if (!rowsParsed.length) { setToast({ type: "error", message: "Selecione um CSV válido." }); return; }
    setImporting(true); setImportResult(null);
    let created = 0, updatedCt = 0, ignored = 0, errors = 0;
    try {
      for (const pack of chunk(rowsParsed, 200)) {
        try {
          const r = await api.post("/alunos/bulk", { items: pack });
          const rs = r?.data?.results || r?.data || [];
          rs.forEach((x) => {
            if (x?.status === "created" || x?.created) created++;
            else if (x?.status === "updated" || x?.updated) updatedCt++;
            else ignored++;
          });
        } catch {
          for (const it of pack) {
            try { await api.post("/alunos", it); created++; }
            catch (ex) {
              if (String(ex?.response?.status) === "409") {
                try { await api.put(`/alunos/by-numero-proc/${it.alu_num_processo}`, it); updatedCt++; }
                catch { ignored++; }
              } else errors++;
            }
          }
        }
      }
      setImportResult({ created, updated: updatedCt, ignored, errors });
      await load();
      setToast({ type: "success", message: `Importado: +${created} • ${updatedCt} upd • ${ignored} ign • ${errors} err` });
    } catch { setToast({ type: "error", message: "Erro durante importação." }); }
    finally { setImporting(false); }
  };

  const clearFilters = () => { setFilters({}); setQ(""); setPage(1); load({}); };

  /* medidas acessíveis/limpas */
  const rowPad = density === "compact" ? "py-2.5" : "py-3.5";
  const cell = "px-3 " + rowPad;

  return (
    <main className="min-h-screen p-2 space-y-6 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* header minimal */}
      <header className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-gray-950/60 backdrop-blur px-5 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-indigo-600 text-white grid place-items-center">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold">Alunos</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{list.length} registados</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="q"
                className="pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-indigo-400/60 min-w-[260px]"
                placeholder="Pesquisar por nome…"
                aria-label="Pesquisar alunos por nome"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <button
              onClick={() => setOpenImport(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <Upload size={18} /> Importar
            </button>
            <button
              onClick={() => setOpenNew(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 text-white dark:bg-white dark:text-gray-900 hover:opacity-90"
            >
              <Plus size={18} /> Novo
            </button>
          
          </div>
        </div>
      </header>

      {/* filtros/ações minimal */}
      <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-gray-950/50 backdrop-blur px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="text-gray-500" size={18} />
            <h1 className="text-sm font-medium">Filtros</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              {showFilters ? <EyeOff size={16} /> : <Eye size={16} />}
              <span className="text-sm">{showFilters ? "Ocultar" : "Mostrar"}</span>
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Limpar
            </button>
            <button
              onClick={() => exportCSV(list)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <Download size={16} /> Exportar
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4">
            <Formik enableReinitialize initialValues={filters} onSubmit={(v) => { setFilters(v); setPage(1); load(v); }}>
              {({ isSubmitting }) => (
                <Form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                  <FieldBox name="nome" label="Nome" />
                  <FieldBox name="num_processo" label="Nº Processo" type="number" />
                  <FieldBox name="numero" label="Número" />
                  <FieldBox name="turma" label="Turma" />
                  <FieldBox name="ano" label="Ano" type="number" />
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Status</label>
                    <Field
                      as="select"
                      name="status"
                      className="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                    >
                      <option value="">Todos</option>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </Field>
                  </div>

                  <div className="md:col-span-2 lg:col-span-6 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 dark:text-gray-400">Por página</label>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 text-sm"
                      >
                        {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Total: <b>{list.length}</b></span>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 disabled:opacity-60"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={16} />}
                      Aplicar
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}
      </section>

      {/* tabela minimal moderna */}
      <section className="rounded-2xl border border-gray-300 dark:border-white/10 bg-white/70 dark:bg-gray-950/50 overflow-hidden">
        {loading ? (
          <div className="p-8 grid gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-11 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="rounded-2xl border border-gray-200 shadow-sm sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b  dark:border-white/10">
                  <tr className="text-gray-700 dark:text-gray-300">
                    <th className={cx(cell, "w-10")}>
                      <input
                        type="checkbox"
                        aria-label="Selecionar página"
                        className="h-4 w-4 accent-indigo-600"
                        checked={allPage}
                        onChange={(e) => setSel(e.target.checked ? new Set([...sel, ...pageIds]) : new Set([...sel].filter((id) => !pageIds.includes(id))))}
                      />
                    </th>

                    <ThSort label="Aluno" onClick={() => setSortBy("alu_nome")} active={sort.by === "alu_nome"} dir={sort.dir} />
                    <ThSort label="Nº Processo" onClick={() => setSortBy("alu_num_processo")} active={sort.by === "alu_num_processo"} dir={sort.dir} />
                    <ThSort label="Número" onClick={() => setSortBy("alu_numero")} active={sort.by === "alu_numero"} dir={sort.dir} extra="hidden sm:table-cell" />
                    <ThSort label="Turma" onClick={() => setSortBy("alu_turma")} active={sort.by === "alu_turma"} dir={sort.dir} />
                    <ThSort label="Ano" onClick={() => setSortBy("alu_ano")} active={sort.by === "alu_ano"} dir={sort.dir} extra="hidden md:table-cell" />
                    <th className={cx(cell, "text-left font-medium text-gray-600 dark:text-gray-400")}>Status</th>
                    <th className={cx(cell, "text-right font-medium text-gray-600 dark:text-gray-400")}>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {pageData.length ? pageData.map((a) => {
                    const id = a.alu_id || a.id || `${a.alu_num_processo}-${a.alu_turma}`;
                    const inactive = String(a.alu_status || "").toLowerCase() === "inativo";
                    const isSel = sel.has(id);
                    return (
                      <tr
                        key={id}
                        className={cx(
                          "border-b border-gray-100 dark:border-white/10 hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors",
                          isSel && "bg-indigo-50/50 dark:bg-indigo-400/5"
                        )}
                      >
                        <td className={cell}>
                          <input
                            type="checkbox"
                            aria-label="Selecionar linha"
                            className="h-4 w-4 accent-indigo-600"
                            checked={isSel}
                            onChange={() => toggleRow(id)}
                          />
                        </td>

                        <td className={cx(cell, "min-w-[220px]")}>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-gray-100 dark:bg-white/5 grid place-items-center">
                              <Users size={14} className="text-gray-500" />
                            </div>
                            <div className="truncate">
                              <div className="font-medium text-gray-900 dark:text-white truncate">{a.alu_nome}</div>
                              <div className="text-xs text-gray-500 sm:hidden">
                                Proc <b>{a.alu_num_processo}</b> • Nº <b>{a.alu_numero ?? "-"}</b>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className={cx(cell, "font-mono text-gray-700 dark:text-gray-300")}>{a.alu_num_processo}</td>
                        <td className={cx(cell, "text-gray-600 dark:text-gray-400 hidden sm:table-cell")}>{a.alu_numero ?? "-"}</td>
                        <td className={cell}>
                          {a.alu_turma ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">
                              <Check size={12} /> {a.alu_turma}
                            </span>
                          ) : <span className="text-gray-500">-</span>}
                        </td>
                        <td className={cx(cell, "hidden md:table-cell text-gray-600 dark:text-gray-400")}>{a.alu_ano}</td>
                        <td className={cell}>
                          <span
                            className={cx(
                              "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                              inactive
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                            )}
                          >
                            <span className={cx("h-2 w-2 rounded-full", inactive ? "bg-rose-500" : "bg-emerald-500")} />
                            {inactive ? "Inativo" : "Ativo"}
                          </span>
                        </td>
                        <td className={cx(cell, "text-right")}>
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setEditing(a)}
                              className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                              title="Editar"
                              aria-label="Editar aluno"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setStatus(id, inactive ? "ativo" : "inativo")}
                              className={cx(
                                "px-2.5 py-1.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/60",
                                inactive ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                              )}
                              title={inactive ? "Ativar" : "Desativar"}
                              aria-label={inactive ? "Ativar aluno" : "Desativar aluno"}
                            >
                              {inactive ? <Power size={16} /> : <PowerOff size={16} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center">
                        <div className="text-gray-500 dark:text-gray-400 space-y-2">
                          <Users className="h-10 w-10 mx-auto opacity-60" />
                          <p className="font-medium">Nenhum aluno encontrado</p>
                          <p className="text-xs">Ajuste os filtros ou adicione novos alunos</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* paginação minimal */}
            {pageData.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-white/70 dark:bg-gray-950/50">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Mostrando <b>{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, list.length)}</b> de <b>{list.length}</b>
                </div>
                <div className="flex items-center gap-2">
                  <Pager title="Primeira" disabled={page === 1} onClick={() => setPage(1)}><ChevronsLeft size={16} /></Pager>
                  <Pager title="Anterior" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={16} /></Pager>
                  <Pager title="Próxima" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={16} /></Pager>
                  <Pager title="Última" disabled={page === totalPages} onClick={() => setPage(totalPages)}><ChevronsRight size={16} /></Pager>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Novo */}
      <Modal
        open={openNew}
        onClose={() => setOpenNew(false)}
        title="Novo aluno"
        footer={(
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Campos marcados com * são obrigatórios.
          </div>
        )}
      >
        <Formik
          initialValues={{ alu_nome: "", alu_num_processo: "", alu_numero: "", alu_turma: "", alu_ano: new Date().getFullYear(), alu_status: "ativo" }}
          onSubmit={async (v, { resetForm, setSubmitting }) => {
            try {
              await create({
                alu_nome: v.alu_nome.trim(),
                alu_num_processo: Number(v.alu_num_processo),
                alu_numero: v.alu_numero ? Number(v.alu_numero) : null,
                alu_turma: v.alu_turma.trim() || null,
                alu_ano: Number(v.alu_ano),
                alu_status: v.alu_status,
              });
              resetForm(); setOpenNew(false);
            } finally { setSubmitting(false); }
          }}
        >
          {({ isSubmitting, values }) => (
            <Form className="space-y-3">
              <FieldBox name="alu_nome" label="Nome completo *" required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FieldBox name="alu_num_processo" label="Nº Processo *" type="number" required />
                <FieldBox name="alu_numero" label="Número" type="number" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FieldBox name="alu_turma" label="Turma" />
                <FieldBox name="alu_ano" label="Ano letivo *" type="number" required />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Status</label>
                <Field as="select" name="alu_status" className="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/60">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </Field>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpenNew(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-900">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !values.alu_nome || !values.alu_num_processo || !values.alu_ano}
                  className="px-4 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Editar */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar aluno">
        {editing && (
          <Formik
            enableReinitialize
            initialValues={{
              alu_nome: editing.alu_nome || "",
              alu_num_processo: editing.alu_num_processo || "",
              alu_numero: editing.alu_numero || "",
              alu_turma: editing.alu_turma || "",
              alu_ano: editing.alu_ano || "",
              alu_status: editing.alu_status || "ativo",
            }}
            onSubmit={async (v, { setSubmitting }) => {
              try {
                await update(editing.alu_id || editing.id, {
                  alu_nome: v.alu_nome.trim(),
                  alu_num_processo: Number(v.alu_num_processo),
                  alu_numero: v.alu_numero ? Number(v.alu_numero) : null,
                  alu_turma: v.alu_turma.trim() || null,
                  alu_ano: Number(v.alu_ano),
                  alu_status: v.alu_status,
                });
                setEditing(null);
              } finally { setSubmitting(false); }
            }}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-3">
                <FieldBox name="alu_nome" label="Nome completo *" required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldBox name="alu_num_processo" label="Nº Processo *" type="number" required />
                  <FieldBox name="alu_numero" label="Número" type="number" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldBox name="alu_turma" label="Turma" />
                  <FieldBox name="alu_ano" label="Ano letivo *" type="number" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Status</label>
                  <Field as="select" name="alu_status" className="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/60">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </Field>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-900">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !values.alu_nome || !values.alu_num_processo || !values.alu_ano}
                    className="px-4 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 disabled:opacity-60"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </Modal>

      {/* Import CSV */}
      <Modal open={openImport} onClose={() => setOpenImport(false)} title="Importar CSV" size="lg"
        footer={<div className="text-xs text-gray-500 dark:text-gray-400">Cabeçalhos aceites: alu_nome; alu_num_processo; alu_numero; alu_turma; alu_ano; alu_status</div>}
      >
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f && (f.type === "text/csv" || f.name.endsWith(".csv"))) handleFile(f);
              else setToast({ type: "error", message: "Selecione um CSV." });
            }}
            className="rounded-xl border border-dashed border-gray-300 dark:border-white/10 px-5 py-7 text-center hover:border-gray-400 dark:hover:border-white/20"
          >
            <Upload className="mx-auto text-gray-400" size={20} />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Arraste o CSV aqui ou</p>
            <label className="inline-flex mt-3 items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
              <Upload size={16} /> Procurar CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
            {fileName && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">Ficheiro: {fileName} • {rowsParsed.length} linhas</p>}
          </div>

          {preview.length > 0 && (
            <div className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
              <div className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-white/10">
                Pré-visualização ({preview.length} de {rowsParsed.length})
              </div>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-white/5">
                    <tr>
                      {["Nome", "Processo", "Nº", "Turma", "Ano", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-white/10">
                        <td className="px-3 py-2">{r.alu_nome}</td>
                        <td className="px-3 py-2 font-mono">{r.alu_num_processo}</td>
                        <td className="px-3 py-2">{r.alu_numero ?? "-"}</td>
                        <td className="px-3 py-2">{r.alu_turma ?? "-"}</td>
                        <td className="px-3 py-2">{r.alu_ano}</td>
                        <td className="px-3 py-2">{r.alu_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {importResult && (
                <>Resultado: <b>+{importResult.created}</b> criados • <b>{importResult.updated}</b> atualizados • <b>{importResult.ignored}</b> ignorados • <b>{importResult.errors}</b> erros</>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setOpenImport(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-900">
                Fechar
              </button>
              <button
                disabled={!rowsParsed.length || importing}
                onClick={startImport}
                className="px-4 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 disabled:opacity-60"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar"}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* toast minimal */}
      {toast && (
        <div
          role="status"
          className={cx(
            "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-lg backdrop-blur",
            toast.type === "error"
              ? "bg-rose-50/90 dark:bg-rose-900/20 border-rose-200/60 dark:border-rose-700/40 text-rose-900 dark:text-rose-200"
              : toast.type === "warning"
              ? "bg-amber-50/90 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-700/40 text-amber-900 dark:text-amber-200"
              : "bg-emerald-50/90 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-700/40 text-emerald-900 dark:text-emerald-200"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="text-sm">{toast.message}</div>
            <button onClick={() => setToast(null)} className="ml-2 rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Fechar">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/* ===== subcomponentes ===== */
function FieldBox({ name, label, type = "text", required }) {
  return (
    <div>
      <label htmlFor={name} className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>
      <Field
        id={name}
        name={name}
        type={type}
        className="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
      />
    </div>
  );
}

function ThSort({ label, active, dir, onClick, extra = "" }) {
  return (
    <th className={cx("px-3 py-3.5 text-left font-medium text-gray-600 dark:text-gray-400 select-none", extra)}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-400/60 rounded"
        aria-pressed={active}
        aria-label={`Ordenar por ${label}`}
      >
        {label}
        {active ? (dir === "asc" ? <SortAsc size={14} /> : <SortDesc size={14} />) : null}
      </button>
    </th>
  );
}

function Pager({ children, onClick, disabled, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
