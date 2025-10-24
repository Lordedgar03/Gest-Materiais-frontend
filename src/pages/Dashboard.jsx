/* eslint-disable no-unused-vars */
// src/pages/Dashboard.jsx
"use client";

import React, { useMemo } from "react";
import {
  RefreshCw, Users, PackageCheck, Layers, Shapes, FileText, TrendingUp, AlertTriangle, Tag, MapPin,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  LineChart, Line, AreaChart, Area, PieChart, Pie,
} from "recharts";
import { useDashboard } from "../hooks/useDashboard";

/* -------------------------- UI helpers -------------------------- */
const CardIcon = ({ tone, children }) => {
  const toneMap = {
    blue:    "from-blue-500 to-indigo-600",
    emerald: "from-emerald-500 to-teal-600",
    amber:   "from-amber-500 to-orange-600",
    pink:    "from-pink-500 to-rose-600",
    indigo:  "from-indigo-500 to-violet-600",
    violet:  "from-violet-500 to-fuchsia-600",
    purple:  "from-purple-500 to-indigo-600",
    fuchsia: "from-fuchsia-500 to-pink-600",
  };
  return (
    <span className={`inline-grid place-items-center h-10 w-10 rounded-xl text-white bg-gradient-to-br ${toneMap[tone] || toneMap.blue} shadow`} aria-hidden>
      {children}
    </span>
  );
};

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-gray-200/60 dark:bg-gray-800/60 ${className}`} />
);

const Section = ({ title, subtitle, children, right }) => (
  <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/70 shadow-sm">
    <header className="flex items-center justify-between gap-4 px-5 md:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {subtitle ? (
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </header>
    <div className="p-5 md:p-6">{children}</div>
  </section>
);

const number = (n) => new Intl.NumberFormat("pt-PT").format(Number(n || 0));
const money = (n) => `STN ${Number(n || 0).toFixed(2)}`;

const Badge = ({ tone = "gray", children }) => {
  const map = {
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700",
    green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    red: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${map[tone] || map.gray}`}>
      {children}
    </span>
  );
};

/* ----------------------------- Page ----------------------------- */
export default function Dashboard() {
  const {
    loading, error, lastUpdated,
    users, materials, types, categories, movements, sales,
    metrics, chartData, cards, COLORS,
    refresh,
  } = useDashboard();

  // ------- helpers de lookup -------
  const tipoById = useMemo(() => {
    const m = new Map();
    (types || []).forEach((t) => m.set(Number(t.tipo_id ?? t.id), t));
    return m;
  }, [types]);

  const catById = useMemo(() => {
    const m = new Map();
    (categories || []).forEach((c) => m.set(Number(c.cat_id ?? c.categoria_id ?? c.id), c));
    return m;
  }, [categories]);

  // ------- dados para gráficos -------
  const { movementData, categoryData, salesByDay } = chartData;

  const stackedMoves = (movementData || []).map((d) => ({
    date: d.date,
    Entrada: d.entrada || d.Entrada || 0,
    Saida: d.saida || d.Saida || 0,
  }));

  const topCategorias = (categoryData || []).slice(0, 6);

  const pieCategorias = (categoryData || []).slice(0, 6).map((c, i) => ({
    name: c.name,
    value: c.value,
    fill: COLORS[i % COLORS.length],
  }));

  // ------- tabelas com mais colunas -------
  const lowStock = useMemo(() => {
    const rows = (materials || []).map((m) => {
      const tipo = tipoById.get(Number(m.mat_fk_tipo ?? m.tipo_id));
      const catId = Number(tipo?.tipo_fk_categoria ?? tipo?.categoria_id);
      const cat = catById.get(catId);
      const qtd = Number(m.mat_quantidade_estoque || 0);
      const min = Number(m.mat_estoque_minimo || 0);
      const preco = Number(m.mat_preco || 0);
      const valor = qtd * preco;
      return {
        id: m.mat_id ?? m.id,
        codigo: m.mat_codigo ?? m.codigo ?? "-",
        nome: m.mat_nome ?? m.nome ?? "—",
        tipo: tipo?.tipo_nome ?? "Sem tipo",
        categoria: cat?.cat_nome ?? cat?.categoria_nome ?? "Sem categoria",
        local: m.mat_localizacao ?? m.localizacao ?? "—",
        quantidade: qtd,
        minimo: min,
        valor,
        status: qtd < min ? "baixo" : "ok",
      };
    });
    // ordenar por status e depois por delta (quantidade - minimo)
    rows.sort((a, b) => {
      if (a.status !== b.status) return a.status === "baixo" ? -1 : 1;
      return (a.quantidade - a.minimo) - (b.quantidade - b.minimo);
    });
    return rows.slice(0, 12);
  }, [materials, tipoById, catById]);

  const recentMoves = useMemo(() => {
    const rows = (movements || []).map((mv) => {
      const d = new Date(mv.mov_data);
      const material = (materials || []).find((x) => Number(x.mat_id ?? x.id) === Number(mv.mov_fk_material ?? mv.material_id));
      return {
        id: mv.mov_id ?? mv.id,
        data: Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-PT"),
        tipo: mv.mov_tipo,
        material: material?.mat_nome ?? material?.nome ?? "—",
        quantidade: Number(mv.mov_quantidade || 0),
        utilizador: mv.mov_user ?? mv.user_name ?? mv.usuario ?? "—",
        observacao: mv.mov_observacao ?? mv.observacao ?? "",
      };
    });
    rows.sort((a, b) => (a.id < b.id ? 1 : -1));
    return rows.slice(0, 12);
  }, [movements, materials]);

  const recentSales = useMemo(() => {
    const rows = (sales || []).map((v) => {
      const dt = v.ven_data || v.ven_date || v.data || v.created_at || v.updated_at;
      const d = new Date(dt);
      return {
        id: v.ven_id ?? v.id ?? "—",
        data: Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-PT"),
        cliente: v.cliente_nome ?? v.cliente ?? "—",
        itens: Array.isArray(v.itens) ? v.itens.length : (v.items_count ?? v.qtd_itens ?? 0),
        total: Number(v.ven_total ?? v.total ?? 0),
        estado: v.status ?? v.estado ?? "—",
      };
    });
    rows.sort((a, b) => (a.id < b.id ? 1 : -1));
    return rows.slice(0, 12);
  }, [sales]);

  // --------- header right actions ----------
  const HeaderRight = (
    <div className="flex items-center gap-3">
      {lastUpdated && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Atualizado:{" "}
          <b className="text-gray-800 dark:text-gray-200">
            {new Date(lastUpdated).toLocaleString("pt-PT")}
          </b>
        </span>
      )}
      <button
        onClick={refresh}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        title="Atualizar"
      >
        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        <span className="hidden sm:inline">Atualizar</span>
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      {/* Header */}
      <header className="mb-5 md:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Visão geral de utilizadores, materiais, movimentações e vendas
          </p>
        </div>
        {HeaderRight}
      </header>

      {/* Alerta de erro */}
      {error && (
        <div className="mb-5 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 px-4 py-3 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 mb-5 md:mb-6">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[108px]" />)
          : cards.map((c, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/70 shadow-sm hover:shadow-md transition-all"
              >
                <div className="absolute -top-24 right-0 h-40 w-40 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"
                  style={{
                    background:
                      c.tone === "blue"    ? "radial-gradient(circle, #60A5FA, transparent)" :
                      c.tone === "emerald" ? "radial-gradient(circle, #34D399, transparent)" :
                      c.tone === "amber"   ? "radial-gradient(circle, #F59E0B, transparent)" :
                      c.tone === "pink"    ? "radial-gradient(circle, #F472B6, transparent)" :
                      c.tone === "indigo"  ? "radial-gradient(circle, #818CF8, transparent)" :
                      c.tone === "violet"  ? "radial-gradient(circle, #A78BFA, transparent)" :
                      c.tone === "purple"  ? "radial-gradient(circle, #A78BFA, transparent)" :
                      "radial-gradient(circle, #F0ABFC, transparent)",
                  }}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{c.label}</p>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {c.value}
                      </div>
                      {c.secondaryValue && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          {c.secondaryValue}
                        </div>
                      )}
                    </div>
                    <CardIcon tone={c.tone}>
                      {iconForCard(c.iconName)}
                    </CardIcon>
                  </div>
                  {typeof c.trend === "number" && (
                    <div className="mt-3 text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full
                                    bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                      <TrendingUp size={14} className={c.trend < 0 ? "rotate-180" : ""} />
                      {c.trend >= 0 ? "+" : "-"}{Math.abs(c.trend)}
                    </div>
                  )}
                </div>
              </div>
            ))}
      </section>

      {/* Grids de gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6 mb-6">
        {/* Coluna 1: Movimentações por dia (comparação) */}
        <div className="xl:col-span-2">
          <Section
            title="Movimentações por tipo"
            subtitle="Entradas x Saídas (últimos 10 dias)"
          >
            {loading ? (
              <Skeleton className="h-72" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stackedMoves}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {/* Cores distintas e radius 300 */}
                    <Bar
                      dataKey="Entrada"
                      name="Entrada"
                      fill="#4F46E5"           // indigo-600
                      stroke="#1F2937"
                      strokeOpacity={0.2}
                      radius={[300, 300, 0, 0]}
                    />
                    <Bar
                      dataKey="Saida"
                      name="Saída"
                      fill="#10B981"           // emerald-500
                      stroke="#1F2937"
                      strokeOpacity={0.2}
                      radius={[300, 300, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>
        </div>

        {/* Coluna 2: Distribuição (pizza) */}
        <div className="xl:col-span-1">
          <Section
            title="Participação por categoria"
            subtitle="Top 6 categorias por número de materiais"
          >
            {loading ? (
              <Skeleton className="h-72" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie
                      data={pieCategorias}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={96}
                      stroke="#111827"
                      strokeOpacity={0.15}
                    >
                      {pieCategorias.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Mais gráficos + Tabelas com MAIS COLUNAS */}
      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-5 md:gap-6">
        {/* Top categorias (barras coloridas + radius 300) */}
        <div className="2xl:col-span-1">
          <Section
            title="Top categorias (por materiais)"
            subtitle="6 maiores categorias por contagem"
          >
            {loading ? (
              <Skeleton className="h-72" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCategorias}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      name="Materiais"
                      radius={[300, 300, 0, 0]}
                      stroke="#111827"
                      strokeOpacity={0.2}
                    >
                      {topCategorias.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>
        </div>

        {/* Vendas por dia (área + linha) */}
        <div className="2xl:col-span-2">
          <Section
            title="Vendas por dia"
            subtitle="Últimos 10 registos diários"
          >
            {loading ? (
              <Skeleton className="h-72" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesByDay}>
                    <defs>
                      <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="receita"
                      name="Receita"
                      stroke="#8B5CF6"     // violet-500
                      fill="url(#gradReceita)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="vendas"
                      name="Vendas"
                      stroke="#06B6D4"     // cyan-500
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Tabelas detalhadas — MAIS COLUNAS */}
      <div className="mt-6 grid grid-cols-1 2xl:grid-cols-3 gap-5 md:gap-6">
        {/* Materiais / Estoque */}
        <div className="2xl:col-span-2">
          <Section
            title="Materiais — Estoque"
            subtitle="Detalhes de localização, tipo, categoria e status"
            right={<Badge tone="amber"><Tag size={12}/> {materials.length} itens</Badge>}
          >
            {loading ? (
              <Skeleton className="h-80" />
            ) : (
              <div className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-[880px] w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-800">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Material</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Categoria</th>
                      <th className="px-4 py-3">Localização</th>
                      <th className="px-4 py-3 text-right">Qtd</th>
                      <th className="px-4 py-3 text-right">Mín.</th>
                      <th className="px-4 py-3 text-right">Valor</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {lowStock.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-200">{r.codigo}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{r.nome}</td>
                        <td className="px-4 py-3">{r.tipo}</td>
                        <td className="px-4 py-3">{r.categoria}</td>
                        <td className="px-4 py-3 inline-flex items-center gap-1"><MapPin size={14} className="text-gray-400" />{r.local}</td>
                        <td className="px-4 py-3 text-right">{number(r.quantidade)}</td>
                        <td className="px-4 py-3 text-right">{number(r.minimo)}</td>
                        <td className="px-4 py-3 text-right font-mono">{money(r.valor)}</td>
                        <td className="px-4 py-3">
                          {r.status === "baixo"
                            ? <Badge tone="red">Estoque baixo</Badge>
                            : <Badge tone="green">OK</Badge>}
                        </td>
                      </tr>
                    ))}
                    {lowStock.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-gray-600 dark:text-gray-400">
                          Sem materiais para exibir.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        {/* Movimentações Recentes */}
        <div className="2xl:col-span-1">
          <Section
            title="Movimentações recentes"
            subtitle="Últimos registos"
            right={<Badge tone="blue"><RefreshCw size={12}/> {movements.length}</Badge>}
          >
            {loading ? (
              <Skeleton className="h-80" />
            ) : (
              <div className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-[760px] w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-800">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Material</th>
                      <th className="px-4 py-3 text-right">Quantidade</th>
                      <th className="px-4 py-3">Utilizador</th>
                      <th className="px-4 py-3">Observação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {recentMoves.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-3 whitespace-nowrap">{r.data}</td>
                        <td className="px-4 py-3">
                          {r.tipo === "entrada" ? <Badge tone="green">Entrada</Badge> : <Badge tone="amber">Saída</Badge>}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.material}</td>
                        <td className="px-4 py-3 text-right">{number(r.quantidade)}</td>
                        <td className="px-4 py-3">{r.utilizador}</td>
                        <td className="px-4 py-3">{r.observacao || "—"}</td>
                      </tr>
                    ))}
                    {recentMoves.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-gray-600 dark:text-gray-400">
                          Sem movimentações recentes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Vendas recentes — tabela ampla */}
      <div className="mt-6">
        <Section
          title="Vendas recentes"
          subtitle="Últimos registos de vendas com mais colunas"
          right={<Badge tone="purple"><FileText size={12}/> {sales.length}</Badge>}
        >
          {loading ? (
            <Skeleton className="h-80" />
          ) : (
            <div className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="min-w-[860px] w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-800">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3 text-right">Itens</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {recentSales.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-mono">{v.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{v.data}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{v.cliente}</td>
                      <td className="px-4 py-3 text-right">{number(v.itens)}</td>
                      <td className="px-4 py-3 text-right font-mono">{money(v.total)}</td>
                      <td className="px-4 py-3">
                        <Badge tone="gray">{v.estado}</Badge>
                      </td>
                    </tr>
                  ))}
                  {recentSales.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-600 dark:text-gray-400">
                        Nenhuma venda encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </main>
  );
}

/* --------------------------- Icons map --------------------------- */
function iconForCard(name) {
  switch (name) {
    case "Users":        return <Users size={20} />;
    case "PackageCheck": return <PackageCheck size={20} />;
    case "Layers":       return <Layers size={20} />;
    case "Shapes":       return <Shapes size={20} />;
    case "RefreshCw":    return <RefreshCw size={20} />;
    case "FileText":     return <FileText size={20} />;
    default:             return <FileText size={20} />;
  }
}
