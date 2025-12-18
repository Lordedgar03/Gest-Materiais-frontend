/* eslint-disable no-unused-vars */
"use client";

import React from "react";
import {
  RefreshCw,
  CalendarDays,
  TrendingUp,
  DollarSign,
  PackageCheck,
  Activity,
  PieChart as PieIcon,
  Clock,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Search,
  Filter,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Line,
  Legend,
  Cell,
  PieChart as RePieChart,
  Pie,
} from "recharts";

import { useDashboard } from "../hooks/useDashboard";
import {
  useRequisicao,
  statusColors,
  statusIcons,
} from "../hooks/useRequisicao";
import useAlmoco from "../hooks/useAlmoco";
import useAlunos from "../hooks/useAlunos";

/* =================== helpers =================== */
const nf = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("pt-PT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const stn = (n) => `STN ${nf2.format(Number(n || 0))}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("pt-PT") : "—");

const CHART_COLORS = {
  receita: "#0ea5e9",
  entrada: "#10b981",
  saida: "#ef4444",
  estoque: "#6366f1",
};

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

/* =================== pagination hook =================== */
function usePagination(items, pageSize = 8) {
  const [page, setPage] = React.useState(1);

  const total = items?.length || 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pages);

  React.useEffect(() => {
    // se o tamanho mudar e a página ficar inválida, corrige
    if (safePage !== page) setPage(safePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages]);

  const slice = React.useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return (items || []).slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    page: safePage,
    pages,
    total,
    pageSize,
    slice,
    canPrev: safePage > 1,
    canNext: safePage < pages,
    prev: () => setPage((p) => Math.max(1, p - 1)),
    next: () => setPage((p) => p + 1),
    setPage,
  };
}

/* =================== UI blocks =================== */
const Shell = ({ children }) => (
  <div className="min-h-screen  dark:bg-slate-950">
    <div className="mx-auto max-w-[1400px] px-3 md:px-6 py-2">{children}</div>
  </div>
);

const Topbar = ({ onRefresh, lastUpdated }) => (
  <header className="sticky top-0 z-30 -mx-3 md:-mx-6  dark:bg-slate-950/60 backdrop-blur dark:border-slate-800">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-indigo-600 dark:text-white">
          Dashboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Última atualização:{" "}
          {lastUpdated ? new Date(lastUpdated).toLocaleString("pt-PT") : "—"}
        </p>
      </div>

      <button
        onClick={onRefresh}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-indigo-600 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-medium"
      >
        <RefreshCw className="h-4 w-4" />
        Atualizar
      </button>
    </div>
  </header>
);

const Card = ({ title, icon: Icon, right, children, className }) => (
  <section
    className={cn(
      "rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 backdrop-blur shadow-sm",
      className
    )}
  >
    <div className="px-4 md:px-2 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {Icon ? (
          <span className="h-9 w-9 rounded-2xl bg-slate-100 dark:bg-indigo-600 border border-slate-200 dark:border-slate-800 grid place-items-center">
            <Icon size={16} className="text-slate-700 dark:text-slate-200" />
          </span>
        ) : null}
        <h2 className="font-semibold text-slate-900 dark:text-white truncate">
          {title}
        </h2>
      </div>
      {right}
    </div>
    <div className="p-4 md:p-6">{children}</div>
  </section>
);

const Kpi = ({ title, value, subtitle, icon: Icon }) => (
  <article className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 backdrop-blur p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {title}
        </p>
        <p className="mt-1 text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
      <span className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-indigo-600 border border-slate-200 dark:border-slate-800 grid place-items-center shrink-0">
        <Icon size={18} className="text-slate-700 dark:text-slate-200" />
      </span>
    </div>
  </article>
);

const EmptyState = ({ message }) => (
  <div className="h-[280px] flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
    {message}
  </div>
);

const Pager = ({ page, pages, total, onPrev, onNext, canPrev, canNext }) => (
  <div className="flex items-center justify-between gap-2 pt-3">
    <div className="text-xs text-slate-500 dark:text-slate-400">
      {total} itens • Página{" "}
      <b className="text-slate-900 dark:text-white">{page}</b> / {pages}
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-indigo-600 disabled:opacity-50"
      >
        <ChevronLeft size={16} /> Prev
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-indigo-600 disabled:opacity-50"
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

/* =================== charts =================== */
function ComposedMovInventory({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="entrada"
          name="Entradas"
          stackId="a"
          fill={CHART_COLORS.entrada}
        />
        <Bar
          yAxisId="left"
          dataKey="saida"
          name="Saídas"
          stackId="a"
          fill={CHART_COLORS.saida}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="estoque"
          name="Estoque"
          stroke={CHART_COLORS.estoque}
          strokeWidth={3}
          dot={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function pickStatusColor(name) {
  const map = {
    Pendente: "#f59e0b",
    Aprovada: "#10b981",
    Rejeitada: "#ef4444",
    Cancelada: "#94a3b8",
    Parcial: "#38bdf8",
    "Em Uso": "#8b5cf6",
    Atendida: "#059669",
    Devolvida: "#14b8a6",
  };
  return map[name] || "#6366f1";
}

/* =================== page =================== */
export default function Dashboard() {
  const {
    loading,
    error,
    lastUpdated,
    chartData = { movementData: [], categoryData: [], salesByDay: [] },
    materials = [],
    movements = [],
    refresh,
  } = useDashboard();

  const { requisicoes = [], canDecideReq } = useRequisicao();
  const { precoHoje, relHoje, relMensal, loadMensal, loadingMensal } =
    useAlmoco();
  useAlunos(); // mantém caso uses algum side-effect

  // Tabs (para ficar mais limpo no mobile)
  const [tab, setTab] = React.useState("visao"); // visao | operacao
  const [qLowStock, setQLowStock] = React.useState("");
  const [qMoves, setQMoves] = React.useState("");
  const [qReq, setQReq] = React.useState("");

  /* ===== Derivados ===== */
  const mov30 = React.useMemo(
    () => chartData.movementData.slice(-30),
    [chartData.movementData]
  );
  const sales30 = React.useMemo(
    () => chartData.salesByDay?.slice(-30) ?? [],
    [chartData.salesByDay]
  );

  const inventorySeries = React.useMemo(() => {
    let acc = 0;
    return mov30.map((d) => {
      acc += (d.entrada || 0) - (d.saida || 0);
      return {
        date: d.date,
        estoque: acc,
        entrada: d.entrada || 0,
        saida: d.saida || 0,
      };
    });
  }, [mov30]);

  const lowStockAll = React.useMemo(() => {
    const base = materials
      .filter(
        (m) => Number(m.mat_quantidade_estoque) < Number(m.mat_estoque_minimo)
      )
      .sort(
        (a, b) =>
          Number(a.mat_quantidade_estoque) - Number(b.mat_quantidade_estoque)
      );

    const q = String(qLowStock || "")
      .trim()
      .toLowerCase();
    if (!q) return base;
    return base.filter((m) =>
      String(m.mat_nome || "")
        .toLowerCase()
        .includes(q)
    );
  }, [materials, qLowStock]);

  const movementsAll = React.useMemo(() => {
    const base = (movements || []).slice().reverse(); // recentes primeiro
    const q = String(qMoves || "")
      .trim()
      .toLowerCase();
    if (!q) return base;
    return base.filter((mv) => {
      const tipo = String(mv.mov_tipo || "").toLowerCase();
      const motivo = String(mv.mov_motivo || "").toLowerCase();
      return tipo.includes(q) || motivo.includes(q);
    });
  }, [movements, qMoves]);

  const reqsPendentesAll = React.useMemo(() => {
    const base = requisicoes.filter(
      (r) => String(r.req_status) === "Pendente" && canDecideReq(r)
    );
    const q = String(qReq || "")
      .trim()
      .toLowerCase();
    if (!q) return base;
    return base.filter((r) => {
      const s = String(r.req_status || "").toLowerCase();
      const id = String(r.req_id || r.id || "").toLowerCase();
      const desc = String(r.req_descricao || r.descricao || "").toLowerCase();
      return s.includes(q) || id.includes(q) || desc.includes(q);
    });
  }, [requisicoes, canDecideReq, qReq]);

  const statusCounts = React.useMemo(() => {
    const map = new Map();
    requisicoes.forEach((r) => {
      const s = String(r.req_status || "Desconhecido");
      map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [requisicoes]);

  React.useEffect(() => {
    const now = new Date();
    // no teu código antigo tu passavas mes como número: now.getMonth()+1
    // aqui mantenho o mesmo padrão:
    loadMensal?.(now.getFullYear(), now.getMonth() + 1);
  }, [loadMensal]);

  const almocoSerie = React.useMemo(() => {
    const dias = relMensal?.dias || [];
    return dias.map((d) => ({
      date: d.data || "",
      almocos: Number(d.total_almocos || 0),
      receita: Number(d.total_arrecadado || 0),
    }));
  }, [relMensal]);

  /* ===== Paginações ===== */
  const lowStockPg = usePagination(lowStockAll, 8);
  const movesPg = usePagination(movementsAll, 10);
  const reqPg = usePagination(reqsPendentesAll, 8);

  /* ===== KPIs ===== */
  const vendas30 = sales30.reduce((s, d) => s + (d.vendas || 0), 0);
  const receita30 = sales30.reduce((s, d) => s + Number(d.receita || 0), 0);
  const saldo30 = mov30.reduce(
    (s, d) => s + ((d.entrada || 0) - (d.saida || 0)),
    0
  );
  // ✅ classes padrão para botões
  const BTN_PRIMARY =
    "inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed";

  const BTN_OUTLINE =
    "inline-flex items-center gap-1 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed";

  /* ===== Loading/Erro ===== */
  if (loading) {
    return (
      <Shell>
        <Topbar onRefresh={refresh} lastUpdated={lastUpdated} />
        <div className="grid gap-4 mt-5 sm:grid-cols-2 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-3xl bg-slate-100 dark:bg-indigo-600/50 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="h-[360px] rounded-3xl bg-slate-100 dark:bg-indigo-600/50 animate-pulse lg:col-span-2" />
          <div className="h-[360px] rounded-3xl bg-slate-100 dark:bg-indigo-600/50 animate-pulse" />
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <Topbar onRefresh={refresh} lastUpdated={lastUpdated} />
        <div className="py-4 flex flex-col items-center">
          <div className="p-2 rounded-3xl bg-white dark:bg-slate-950 border border-rose-200 dark:border-rose-900 max-w-md text-center">
            <h3 className="font-semibold text-rose-700 dark:text-rose-300">
              Falha ao carregar
            </h3>
            <p className="text-sm text-rose-700/80 dark:text-rose-200/80 mt-1">
              {error}
            </p>
            <button
              onClick={refresh}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-medium"
            >
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Topbar onRefresh={refresh} lastUpdated={lastUpdated} />

      {/* Tabs (melhor no mobile) */}
      <div className="mt-4 flex items-center gap-2">
        {[
          { k: "visao", label: "Visão Geral", icon: Layers },
          { k: "operacao", label: "Operação", icon: Activity },
        ].map((t) => {
          const ActiveIcon = t.icon;
          const active = tab === t.k;
          return (
            <button
              key={t.k}
              type="button"
              onClick={() => setTab(t.k)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-600 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                  : "bg-white/70 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-indigo-600"
              )}
            >
              <ActiveIcon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* KPIs */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi
          title="Vendas (30d)"
          subtitle="Quantidade"
          value={nf.format(vendas30)}
          icon={ShoppingCart}
        />
        <Kpi
          title="Receita (30d)"
          subtitle="Total faturado"
          value={stn(receita30)}
          icon={DollarSign}
        />
        <Kpi
          title="Saldo (30d)"
          subtitle="Entradas - Saídas"
          value={nf2.format(saldo30)}
          icon={TrendingUp}
        />
        <Kpi
          title="Baixo estoque"
          subtitle="Abaixo do mínimo"
          value={nf.format(lowStockAll.length)}
          icon={PackageCheck}
        />
        <Kpi
          title="Req. pendentes"
          subtitle="Por responder"
          value={nf.format(reqsPendentesAll.length)}
          icon={Clock}
        />
        <Kpi
          title="Almoço hoje"
          subtitle={`Preço: ${stn(precoHoje || 0)}`}
          value={`${nf.format(relHoje?.totais?.total_almocos || 0)} • ${stn(
            relHoje?.totais?.total_arrecadado || 0
          )}`}
          icon={CalendarDays}
        />
      </div>

      {/* Visão Geral */}
      {tab === "visao" && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Receita diária */}
          <Card
            className="lg:col-span-2"
            title="Receita diária (últimos 30 dias)"
            icon={DollarSign}
            right={
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Fonte: vendas
              </span>
            }
          >
            {sales30.length ? (
              <div className="h-[320px] md:h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sales30}>
                    <defs>
                      <linearGradient
                        id="g-receita"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={CHART_COLORS.receita}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_COLORS.receita}
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [stn(v), "Receita"]} />
                    <ReferenceLine y={0} stroke="#94a3b8" />
                    <Area
                      type="monotone"
                      dataKey="receita"
                      stroke={CHART_COLORS.receita}
                      strokeWidth={3}
                      fill="url(#g-receita)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Sem dados de receita." />
            )}
          </Card>

          {/* Status de requisições */}
          <Card title="Requisições por status" icon={PieIcon}>
            {statusCounts.length ? (
              <>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={statusCounts}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusCounts.map((s, i) => (
                          <Cell key={i} fill={pickStatusColor(s.name)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n, p) => [v, p?.payload?.name]} />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {statusCounts.map((s, i) => (
                    <span
                      key={i}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-xl border text-xs",
                        statusColors?.[s.name] ||
                          "bg-slate-50 text-slate-700 border-slate-200 dark:bg-indigo-600/40 dark:text-slate-200 dark:border-slate-800"
                      )}
                    >
                      <span aria-hidden="true">
                        {statusIcons?.[s.name] || "•"}
                      </span>{" "}
                      {s.name}: <b>{s.value}</b>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState message="Sem requisições para agrupar." />
            )}
          </Card>

          {/* Estoque + Movimentações */}
          <Card
            className="lg:col-span-3"
            title="Fluxo de movimentações & estoque (30 dias)"
            icon={Activity}
            right={
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Entradas / Saídas + curva
              </span>
            }
          >
            {inventorySeries.length ? (
              <div className="h-[340px] md:h-[420px]">
                <ComposedMovInventory data={inventorySeries} />
              </div>
            ) : (
              <EmptyState message="Sem dados de movimentações." />
            )}
          </Card>
        </div>
      )}

      {/* Operação */}
      {tab === "operacao" && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Baixo Estoque (PAGINADO) */}
          <Card
            title="Materiais com baixo estoque"
            icon={PackageCheck}
            right={
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={qLowStock}
                  onChange={(e) => {
                    setQLowStock(e.target.value);
                    lowStockPg.setPage(1);
                  }}
                  placeholder="Pesquisar material..."
                  className="pl-9 pr-3 py-2 w-[220px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            }
          >
            {lowStockAll.length ? (
              <>
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {lowStockPg.slice.map((m, i) => (
                    <li
                      key={m.mat_id ?? i}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {m.mat_nome || `Material #${m.mat_id}`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Estoque:{" "}
                          <b className="text-slate-900 dark:text-white">
                            {nf.format(Number(m.mat_quantidade_estoque) || 0)}
                          </b>{" "}
                          • Mín.:{" "}
                          <b className="text-slate-900 dark:text-white">
                            {nf.format(Number(m.mat_estoque_minimo) || 0)}
                          </b>
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-2xl text-xs border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200">
                        Prioridade
                      </span>
                    </li>
                  ))}
                </ul>

                <Pager
                  page={lowStockPg.page}
                  pages={lowStockPg.pages}
                  total={lowStockPg.total}
                  canPrev={lowStockPg.canPrev}
                  canNext={lowStockPg.canNext}
                  onPrev={lowStockPg.prev}
                  onNext={lowStockPg.next}
                />
              </>
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Sem itens abaixo do mínimo.
              </div>
            )}
          </Card>

          {/* Requisições pendentes (PAGINADO) */}
          <Card
            title="Requisições pendentes (minhas)"
            icon={Clock}
            right={
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={qReq}
                  onChange={(e) => {
                    setQReq(e.target.value);
                    reqPg.setPage(1);
                  }}
                  placeholder="Pesquisar requisição..."
                  className="pl-9 pr-3 py-2 w-[220px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            }
          >
            {reqsPendentesAll.length ? (
              <>
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {reqPg.slice.map((r, i) => (
                    <li
                      key={r.req_id ?? r.id ?? i}
                      className="py-3 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {r.req_descricao ||
                            r.descricao ||
                            `Requisição #${r.req_id || r.id || i + 1}`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Status:{" "}
                          <b className="text-slate-900 dark:text-white">
                            {r.req_status}
                          </b>
                          {r.req_data ? (
                            <>
                              {" "}
                              • Data:{" "}
                              <b className="text-slate-900 dark:text-white">
                                {fmtDate(r.req_data)}
                              </b>
                            </>
                          ) : null}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl border text-xs bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800">
                        {statusIcons?.Pendente || "•"} Pendente
                      </span>
                    </li>
                  ))}
                </ul>

                <Pager
                  page={reqPg.page}
                  pages={reqPg.pages}
                  total={reqPg.total}
                  canPrev={reqPg.canPrev}
                  canNext={reqPg.canNext}
                  onPrev={reqPg.prev}
                  onNext={reqPg.next}
                />
              </>
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Sem requisições pendentes sob tua responsabilidade.
              </div>
            )}
          </Card>

          {/* Movimentações (PAGINADO) */}
          <Card
            title="Últimas movimentações"
            icon={Activity}
            right={
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={qMoves}
                  onChange={(e) => {
                    setQMoves(e.target.value);
                    movesPg.setPage(1);
                  }}
                  placeholder="Pesquisar motivo/tipo..."
                  className="pl-9 pr-3 py-2 w-[220px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            }
          >
            {movementsAll.length ? (
              <>
                <ol className="space-y-3">
                  {movesPg.slice.map((mv, i) => {
                    const tipo =
                      String(mv.mov_tipo || "").toLowerCase() === "entrada"
                        ? "Entrada"
                        : "Saída";
                    const pill =
                      tipo === "Entrada"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800"
                        : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-800";
                    return (
                      <li
                        key={mv.mov_id ?? i}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/30 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {mv.mov_motivo || "Movimentação"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Qtd:{" "}
                              <b className="text-slate-900 dark:text-white">
                                {nf.format(Number(mv.mov_quantidade || 0))}
                              </b>
                              {mv.mov_valor ? (
                                <>
                                  {" "}
                                  • Valor:{" "}
                                  <b className="text-slate-900 dark:text-white">
                                    {stn(Number(mv.mov_valor || 0))}
                                  </b>
                                </>
                              ) : null}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-1 rounded-xl border text-xs",
                                pill
                              )}
                            >
                              {tipo}
                            </span>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {fmtDate(mv.mov_data)}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <Pager
                  page={movesPg.page}
                  pages={movesPg.pages}
                  total={movesPg.total}
                  canPrev={movesPg.canPrev}
                  canNext={movesPg.canNext}
                  onPrev={movesPg.prev}
                  onNext={movesPg.next}
                />
              </>
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Sem movimentações recentes.
              </div>
            )}
          </Card>

          {/* Almoço (mini tendência) */}
          <Card
            className="lg:col-span-3"
            title="Almoço (tendência mensal)"
            icon={CalendarDays}
            right={
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Preço hoje: {stn(precoHoje || 0)}
              </span>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hoje
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {nf.format(relHoje?.totais?.total_almocos || 0)} almoços
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">
                    Total: <b>{stn(relHoje?.totais?.total_arrecadado || 0)}</b>
                  </p>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Evolução
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {loadingMensal
                          ? "A carregar..."
                          : almocoSerie?.length
                          ? "Dias do mês"
                          : "Sem dados"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 h-40 md:h-44">
                    {almocoSerie?.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={almocoSerie}>
                          <defs>
                            <linearGradient
                              id="g-almoco"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#0ea5e9"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#0ea5e9"
                                stopOpacity={0.05}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <Tooltip
                            formatter={(v, n) =>
                              n === "almocos"
                                ? [nf.format(Number(v)), "Almoços"]
                                : [stn(Number(v)), "Receita"]
                            }
                          />
                          <Area
                            type="monotone"
                            dataKey="almocos"
                            stroke="#0ea5e9"
                            fill="url(#g-almoco)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full grid place-items-center text-sm text-slate-500 dark:text-slate-400">
                        {loadingMensal ? "A carregar..." : "Sem dados mensais."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

    </Shell>
  );
}
