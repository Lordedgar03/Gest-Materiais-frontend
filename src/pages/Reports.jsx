/* eslint-disable no-unused-vars */
// src/pages/Relatorios.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Factory,
  Boxes,
  Filter,
  Calendar,
  Download,
  Printer,
  Loader2,
  BarChart3,
  ListOrdered,
  Layers,
  Building2,
  Tags,
  Search,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileDown,
} from "lucide-react";
import { useRelatorios } from "../hooks/useRelatorios";

/* ===================== helpers ===================== */
const nf = new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (n) => `STN ${nf.format(Number(n || 0))}`;

function exportCSVGrupos({ grupos, criterio }) {
  const head = ["Grupo", "Itens", "Quantidade", "Valor em Estoque (STN)"];
  const rows = [head.join(";")];
  grupos.forEach((g) =>
    rows.push([g.grupo, g.itens, g.quantidade, nf.format(g.valor_estoque)].join(";"))
  );
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `estoque-agrupado-${criterio}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportCSVLista({ rows }) {
  const head = [
    "Material",
    "Local",
    "Tipo",
    "Categoria",
    "Quantidade",
    "Preço",
    "Valor em Estoque (STN)",
  ];
  const lines = [head.join(";")];
  rows.forEach((m) =>
    lines.push(
      [
        m.mat_nome ?? m.nome ?? "-",
        m.mat_localizacao ?? "-",
        m.tipo_nome ?? "-",
        m.categoria_nome ?? "-",
        Number(m.mat_quantidade_estoque || 0),
        nf.format(Number(m.mat_preco || 0)),
        nf.format(Number(m.valor_estoque || 0)),
      ].join(";")
    )
  );
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `materiais-detalhe.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const exportPDF = () => {
  // Usa o diálogo nativo do browser (Imprimir → Guardar como PDF)
  window.print();
};

/* ===================== micro UI ===================== */
const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const Stat = ({ icon, label, value, tone = "indigo" }) => {
  const toneMap = {
    indigo: "from-indigo-500 to-violet-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-600",
    sky: "from-sky-500 to-blue-600",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className={`absolute inset-x-0 -top-24 h-40 bg-gradient-to-br ${toneMap[tone]} opacity-5 blur-2xl`} />
      <div className="p-5">
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800">
            {icon}
          </span>
          <span className="font-medium">{label}</span>
        </div>
        <div className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      </div>
    </div>
  );
};

function PillsMulti({ items = [], value = [], onChange, icon, label, placeholder = "Pesquisar..." }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => {
      const txt = (it?.nome ?? it)?.toString().toLowerCase();
      return txt.includes(s);
    });
  }, [q, items]);

  const toggle = (val) => {
    const v = String(val);
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full h-11 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-left flex items-center justify-between"
      >
        <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          {icon} {label}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{value.length} selecionado(s)</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div className="max-h-64 overflow-auto space-y-2">
            {filtered.length ? (
              filtered.map((it) => {
                const id = String(it?.id ?? it);
                const label = String(it?.nome ?? it);
                const checked = value.includes(id);
                return (
                  <label
                    key={id}
                    className={`flex items-center gap-3 p-2 rounded-lg border text-sm cursor-pointer ${
                      checked
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700 rounded"
                    />
                    <span className={checked ? "text-blue-900 dark:text-blue-200" : "text-gray-700 dark:text-gray-300"}>
                      {label}
                    </span>
                  </label>
                );
              })
            ) : (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">Nada encontrado…</div>
            )}
          </div>
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">{value.length} selecionado(s)</span>
            <button
              onClick={() => setOpen(false)}
              className="h-9 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* CSS chart (barras) */
function Bars({ data = [], max = 1 }) {
  if (!data.length) return null;
  const m = max || Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="grid grid-cols-[140px_1fr_auto] gap-3 items-center">
          <div className="truncate text-sm text-gray-700 dark:text-gray-300">{d.label}</div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
              style={{ width: `${(d.value / m) * 100}%` }}
              title={String(d.value)}
            />
          </div>
          <div className="text-xs tabular-nums text-gray-600 dark:text-gray-400">{d.right}</div>
        </div>
      ))}
    </div>
  );
}

/* Paginação reutilizável */
function Pager({ page, totalPages, onPrev, onNext, className = "" }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Página <b>{page}</b> de <b>{totalPages}</b>
      </p>
      <div className="inline-flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="h-9 w-9 grid place-items-center hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={onNext}
          disabled={page === totalPages}
          className="h-9 w-9 grid place-items-center hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ===================== página ===================== */
export default function Relatorios() {
  const { loading, error, filtros, estoque, fetchEstoqueAgrupado, listaMateriais, vendasMensal } =
    useRelatorios();

  const [criterio, setCriterio] = useState("local"); // local | tipo | categoria
  const [locaisSel, setLocaisSel] = useState([]);
  const [tiposSel, setTiposSel] = useState([]);
  const [catsSel, setCatsSel] = useState([]);
  const [search, setSearch] = useState("");
  const [aba, setAba] = useState("agrupado"); // agrupado | lista | vendas

  // paginação (agrupado)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // lista detalhada + paginação
  const [lista, setLista] = useState([]);
  const [loadLista, setLoadLista] = useState(false);
  const [pageL, setPageL] = useState(1);
  const [pageSizeL, setPageSizeL] = useState(10);

  // vendas
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mensal, setMensal] = useState(null);
  const [loadMensal, setLoadMensal] = useState(false);

  const gruposFiltrados = useMemo(() => {
    const s = search.trim().toLowerCase();
    let rows = estoque.grupos || [];
    if (s) rows = rows.filter((g) => g.grupo?.toLowerCase().includes(s));
    return rows;
  }, [estoque.grupos, search]);

  const totalPages = Math.max(1, Math.ceil(gruposFiltrados.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return gruposFiltrados.slice(start, start + pageSize);
  }, [gruposFiltrados, page, pageSize]);

  const barsData = useMemo(
    () =>
      (estoque.grupos || []).map((g) => ({
        label: g.grupo,
        value: Number(g.valor_estoque || 0),
        right: money(g.valor_estoque || 0),
      })),
    [estoque.grupos]
  );

  const maxBar = useMemo(
    () => Math.max(...barsData.map((b) => b.value), 1),
    [barsData]
  );

  const gerarAgrupado = async () => {
    setPage(1);
    await fetchEstoqueAgrupado({
      groupBy: criterio,
      locais: locaisSel,
      tipos: tiposSel,
      categorias: catsSel,
    });
  };

  const carregarLista = async () => {
    setLoadLista(true);
    try {
      const { rows } = await listaMateriais({
        locais: locaisSel,
        tipos: tiposSel,
        categorias: catsSel,
      });
      setLista(rows);
      setPageL(1);
    } catch {
      setLista([]);
    } finally {
      setLoadLista(false);
    }
  };

  const carregarMensal = async () => {
    setLoadMensal(true);
    try {
      const r = await vendasMensal(Number(ano));
      setMensal(r);
    } finally {
      setLoadMensal(false);
    }
  };

  // paginação lista
  const totalPagesL = Math.max(1, Math.ceil((lista?.length || 0) / pageSizeL));
  const pageRowsL = useMemo(() => {
    const start = (pageL - 1) * pageSizeL;
    return (lista || []).slice(start, start + pageSizeL);
  }, [lista, pageL, pageSizeL]);

  useEffect(() => {
    gerarAgrupado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6 print:p-0">
      {/* Cabeçalho de impressão */}
      <div className="hidden print:block p-6 border-b">
        <h1 className="text-2xl font-semibold">Relatórios & Estoque</h1>
        <p className="text-sm text-gray-600">
          Gerado em {new Date().toLocaleString("pt-PT")}
        </p>
      </div>

      {/* header */}
      <Card className="p-5 md:p-6 mb-6 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white grid place-items-center shadow-lg">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Relatórios & Estoque
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Acompanhe o valor em estoque, materiais e vendas mensais.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportPDF}
              className="h-10 px-4 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-2 text-gray-800 dark:text-gray-200"
              title="Exportar PDF"
            >
              <Printer className="h-4 w-4" />
              Exportar PDF
            </button>

            {aba === "agrupado" && (
              <button
                onClick={() => exportCSVGrupos({ grupos: gruposFiltrados, criterio })}
                className="h-10 px-4 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-2 text-gray-800 dark:text-gray-200"
              >
                <FileDown className="h-4 w-4" />
                Exportar CSV
              </button>
            )}
            {aba === "lista" && (
              <button
                onClick={() => exportCSVLista({ rows: lista })}
                className="h-10 px-4 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-2 text-gray-800 dark:text-gray-200"
              >
                <FileDown className="h-4 w-4" />
                Exportar CSV
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* filtros */}
      <Card className="p-5 md:p-6 mb-6 print:hidden">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filtros
          </h2>

        <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Agrupar por</label>
            <select
              value={criterio}
              onChange={(e) => setCriterio(e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="local">Local</option>
              <option value="tipo">Tipo</option>
              <option value="categoria">Categoria</option>
            </select>

            <label className="text-sm text-gray-600 dark:text-gray-400 ml-2">Por página</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>

            <button
              onClick={gerarAgrupado}
              disabled={loading}
              className="h-10 px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Atualizar
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <PillsMulti
            items={filtros.locais}
            value={locaisSel}
            onChange={setLocaisSel}
            icon={<Building2 className="h-4 w-4 text-blue-600" />}
            label="Locais"
            placeholder="Procurar local..."
          />
          <PillsMulti
            items={filtros.tipos}
            value={tiposSel}
            onChange={setTiposSel}
            icon={<Layers className="h-4 w-4 text-emerald-600" />}
            label="Tipos"
            placeholder="Procurar tipo..."
          />
          <PillsMulti
            items={filtros.categorias}
            value={catsSel}
            onChange={setCatsSel}
            icon={<Tags className="h-4 w-4 text-amber-600" />}
            label="Categorias"
            placeholder="Procurar categoria..."
          />
        </div>
      </Card>

      {/* tabs */}
      <div className="mb-4 print:hidden">
        <div className="inline-flex p-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          {[
            { k: "agrupado", label: "Estoque Agrupado", icon: <Boxes className="h-4 w-4" /> },
            { k: "lista", label: "Lista Detalhada", icon: <ListOrdered className="h-4 w-4" /> },
            { k: "vendas", label: "Vendas por Mês", icon: <Calendar className="h-4 w-4" /> },
          ].map((t) => {
            const active = aba === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setAba(t.k)}
                className={`h-10 px-4 rounded-xl text-sm font-medium inline-flex items-center gap-2 ${
                  active
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* conteúdo */}
      {aba === "agrupado" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Stat
              icon={<Factory className="h-5 w-5 text-indigo-600" />}
              label="Total de Itens"
              value={estoque.total?.itens ?? 0}
              tone="indigo"
            />
            <Stat
              icon={<Layers className="h-5 w-5 text-emerald-600" />}
              label="Quantidade Total"
              value={estoque.total?.quantidade ?? 0}
              tone="emerald"
            />
            <Stat
              icon={<BarChart3 className="h-5 w-5 text-amber-600" />}
              label="Valor em Estoque"
              value={money(estoque.total?.valor_estoque || 0)}
              tone="amber"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* gráfico */}
            <Card className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribuição de Valor</h3>
                <div className="relative print:hidden">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pesquisar grupo..."
                    className="h-10 pl-9 pr-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
              </div>
              {loading ? (
                <div className="py-16 text-center text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  A carregar…
                </div>
              ) : barsData.length ? (
                <Bars data={barsData} max={maxBar} />
              ) : (
                <div className="py-16 text-center text-gray-500 dark:text-gray-400">
                  <AlertCircle className="h-5 w-5 inline mr-2" />
                  Sem dados para este filtro
                </div>
              )}
            </Card>

            {/* tabela agrupada */}
            <Card className="overflow-hidden">
              <div className="px-5 md:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tabela — Agrupado por {estoque.criterio}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {gruposFiltrados.length} grupo(s)
                </p>
              </div>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Grupo</th>
                      <th className="px-6 py-3 text-left font-semibold">Itens</th>
                      <th className="px-6 py-3 text-left font-semibold">Quantidade</th>
                      <th className="px-6 py-3 text-right font-semibold">Valor em Estoque</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {pageRows.map((g) => (
                      <tr key={g.grupo} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <td className="px-6 py-3">{g.grupo}</td>
                        <td className="px-6 py-3">{g.itens}</td>
                        <td className="px-6 py-3">{g.quantidade}</td>
                        <td className="px-6 py-3 text-right font-mono">{money(g.valor_estoque)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-800">
                    <tr className="font-semibold">
                      <td className="px-6 py-3">Totais</td>
                      <td className="px-6 py-3">{estoque.total?.itens ?? 0}</td>
                      <td className="px-6 py-3">{estoque.total?.quantidade ?? 0}</td>
                      <td className="px-6 py-3 text-right font-mono">
                        {money(estoque.total?.valor_estoque || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                  <Pager
                    page={page}
                    totalPages={totalPages}
                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                  />
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {aba === "lista" && (
        <Card className="overflow-hidden">
          <div className="px-5 md:px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Materiais</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Lista detalhada de materiais com valor em estoque.
              </p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <label className="text-sm text-gray-600 dark:text-gray-400">Por página</label>
              <select
                value={pageSizeL}
                onChange={(e) => setPageSizeL(Number(e.target.value))}
                className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>

              <button
                onClick={carregarLista}
                className="h-10 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-2"
              >
                {loadLista ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Carregar
              </button>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Material</th>
                  <th className="px-6 py-3 text-left font-semibold">Local</th>
                  <th className="px-6 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-6 py-3 text-left font-semibold">Categoria</th>
                  <th className="px-6 py-3 text-left font-semibold">Qtd</th>
                  <th className="px-6 py-3 text-left font-semibold">Preço</th>
                  <th className="px-6 py-3 text-right font-semibold">Valor Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {!loadLista && !lista.length ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      Nenhum material carregado. Clique em <b>Carregar</b>.
                    </td>
                  </tr>
                ) : loadLista ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                      A carregar…
                    </td>
                  </tr>
                ) : (
                  pageRowsL.map((m, i) => (
                    <tr key={(m.mat_id ?? m.id ?? i) + "-" + i} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                      <td className="px-6 py-3">{m.mat_nome ?? m.nome ?? "-"}</td>
                      <td className="px-6 py-3">{m.mat_localizacao ?? "-"}</td>
                      <td className="px-6 py-3">{m.tipo_nome ?? "-"}</td>
                      <td className="px-6 py-3">{m.categoria_nome ?? "-"}</td>
                      <td className="px-6 py-3">{Number(m.mat_quantidade_estoque || 0)}</td>
                      <td className="px-6 py-3">{money(m.mat_preco)}</td>
                      <td className="px-6 py-3 text-right font-mono">{money(m.valor_estoque)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {lista.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 print:hidden">
              <Pager
                page={pageL}
                totalPages={totalPagesL}
                onPrev={() => setPageL((p) => Math.max(1, p - 1))}
                onNext={() => setPageL((p) => Math.min(totalPagesL, p + 1))}
              />
            </div>
          )}
        </Card>
      )}

      {aba === "vendas" && (
        <Card className="p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 print:hidden">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vendas por Mês</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resumo financeiro anual</p>
            </div>
            <div className="flex items-end gap-2">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ano</label>
                <input
                  type="number"
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  className="h-10 w-28 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <button
                onClick={carregarMensal}
                className="h-10 px-4 rounded-xl bg-sky-600 text-white hover:bg-sky-700 inline-flex items-center gap-2"
              >
                {loadMensal ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Gerar
              </button>
            </div>
          </div>

          <div className="mt-6">
            {!mensal ? (
              <div className="py-16 text-center text-gray-500 dark:text-gray-400">
                Selecione o ano e clique em <b>Gerar</b>.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Stat
                    icon={<Calendar className="h-5 w-5 text-sky-600" />}
                    label={`Ano ${mensal.ano}`}
                    value={mensal.ano}
                    tone="sky"
                  />
                  <Stat
                    icon={<BarChart3 className="h-5 w-5 text-emerald-600" />}
                    label="Total do Ano"
                    value={money(mensal.totalAno)}
                    tone="emerald"
                  />
                  <Stat
                    icon={<Boxes className="h-5 w-5 text-amber-600" />}
                    label="Meses com Movimento"
                    value={(mensal.meses || []).filter((m) => Number(m.total) > 0).length}
                    tone="amber"
                  />
                </div>
                <Bars
                  data={(mensal.meses || []).map((m) => ({
                    label: new Date(2000, m.mes - 1, 1).toLocaleString("pt-PT", { month: "short" }),
                    value: Number(m.total || 0),
                    right: money(m.total || 0),
                  }))}
                  max={Math.max(...(mensal.meses || []).map((m) => Number(m.total || 0)), 1)}
                />
              </>
            )}
          </div>
        </Card>
      )}

      {/* erros globais */}
      {error && (
        <div className="mt-6 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-amber-800 dark:text-amber-200">
          {error}
        </div>
      )}

      {/* estilo de impressão (PDF) */}
      <style jsx global>{`
        @media print {
          @page { margin: 12mm; }
          body { background: white !important; }
          /* esconder botões/inputs/headers de navegação */
          .print\\:hidden,
          button,
          select,
          input,
          .rounded-2xl.shadow-sm:has(> .print\\:hidden) { display: none !important; }
          /* bordas e sombras minimalistas no PDF */
          .rounded-2xl { border-radius: 0 !important; }
          .shadow-sm { box-shadow: none !important; }
          /* mostrar cabeçalho próprio */
          .print\\:block { display: block !important; }
        }
      `}</style>
    </main>
  );
}
