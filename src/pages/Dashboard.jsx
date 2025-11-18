/* eslint-disable no-unused-vars */
"use client"

import React from "react"
import {
  Menu, RefreshCw, Calendar, TrendingUp, DollarSign, PackageCheck,
  Activity, PieChart, Clock, ChevronRight, ShoppingCart
} from "lucide-react"
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine,
  BarChart, Bar, LineChart, Line, Legend, Cell, PieChart as RePieChart, Pie
} from "recharts"

import { useDashboard } from "../hooks/useDashboard"
import { useRequisicao, statusColors, statusIcons } from "../hooks/useRequisicao"
import useAlmoco from "../hooks/useAlmoco"
import useAlunos from "../hooks/useAlunos"

/* ===== helpers ===== */
const nf = new Intl.NumberFormat("pt-PT")
// Exibe explicitamente "STN 12.345,67" para evitar símbolo local.
const stn = (n) => `STN ${nf.format(Number(n || 0).toFixed ? Number(n || 0).toFixed(2) : Number(n || 0))}`
const fmtDate = (d) => new Date(d).toLocaleDateString("pt-PT")

const CHART_COLORS = {
  entrada: "#10b981",
  saida: "#ef4444",
  estoque: "#6366f1",
  receita: "#0ea5e9",
}
const TONES = {
  indigo: "from-indigo-600 to-violet-600",
  emerald: "from-emerald-600 to-teal-600",
  sky: "from-sky-500 to-blue-600",
  amber: "from-amber-500 to-orange-600",
  pink: "from-pink-500 to-rose-600",
  slate: "from-slate-900 to-slate-700",
}

/* ===== Shell / Topbar ===== */
const Shell = ({ children }) => (
  <div className=" bg-gradient-to-b ">
    {/* container amplo + limite grande em telas 3xl/4xl */}
    <div className="container-linear  p-2">
      {children}
    </div>
  </div>
)

const Topbar = ({ onRefresh }) => (
  <header className="sticky top-0 z-30 p-4 px-4 sm:px-6 rounded-2xl  backdrop-blur bg-white/70 border border-slate-300">
    <div className="flex items-center gap-3 justify-between">
      
        <div>
          <h1 className="text-xl sm:text-2xl 2xl:text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r  text-blue-600 bg-clip-text">
              Dashboard
            </span>
          </h1>
        </div>
      <div className="flex items-center gap-2">
     
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2"
          aria-label="Atualizar dados"
        >
          <RefreshCw className="h-4 w-4" /> Atualizar
        </button>
      </div>
    </div>
  </header>
)

/* ===== Cards ===== */
const KpiCard = ({
  title, value, subtitle, tone = "indigo", icon: Icon = TrendingUp,
  sparkData = [], dataKey = "v", ariaHint,
}) => (
  <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden group focus-within:ring-2 focus-within:ring-indigo-600" aria-label={`${title}: ${value}`}>
    <div className={`p-4 sm:p-5 bg-gradient-to-br ${TONES[tone]} text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs/5 opacity-90">{subtitle}</p>
          <h3 className="text-lg 2xl:text-xl font-semibold">{title}</h3>
        </div>
        <div className="p-2 rounded-xl bg-white/20">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {ariaHint && <p className="sr-only">{ariaHint}</p>}
    </div>
    <div className="p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div className="text-2xl sm:text-3xl 2xl:text-2xl font-bold tracking-tight">{value}</div>
        {sparkData?.length ? (
          <div className="h-12 w-40 md:w-52 2xl:w-64" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey={dataKey} stroke="#6366f1" strokeWidth={2} fill={`url(#spark-${title})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </div>
  </article>
)

/* ===== Subcomponentes de chart ===== */
function ComposedMovInventory({ data }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="entrada" name="Entradas" stackId="a" fill={CHART_COLORS.entrada} />
        <Bar yAxisId="left" dataKey="saida" name="Saídas" stackId="a" fill={CHART_COLORS.saida} />
        <Line yAxisId="right" type="monotone" dataKey="estoque" name="Estoque" stroke={CHART_COLORS.estoque} strokeWidth={3} dot={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}
const EmptyState = ({ message }) => (
  <div className="h-[300px] 2xl:h-[360px] flex items-center justify-center text-slate-500">{message}</div>
)

/* ===== Página ===== */
export default function OperationsCockpit() {
  // Inventário/Vendas
  const {
    loading, error, lastUpdated,
    chartData = { movementData: [], categoryData: [], salesByDay: [] },
    materials = [], movements = [],
    COLORS = [],
    refresh,
  } = useDashboard()

  // Requisições
  const { requisicoes = [], canDecideReq } = useRequisicao()

  // Almoço
  const { precoHoje, relHoje, relMensal, loadMensal, loadingMensal } = useAlmoco()

  // Alunos (se precisar futuramente)
  useAlunos()

  /* ===== Derivados ===== */
  const mov30 = React.useMemo(() => chartData.movementData.slice(-30), [chartData.movementData])
  const sales30 = React.useMemo(() => chartData.salesByDay?.slice(-30) ?? [], [chartData.salesByDay])

  const inventorySeries = React.useMemo(() => {
    let acc = 0
    return mov30.map((d) => {
      acc += (d.entrada || 0) - (d.saida || 0)
      return { date: d.date, estoque: acc, entrada: d.entrada || 0, saida: d.saida || 0 }
    })
  }, [mov30])

  const vendasSpark = React.useMemo(() => sales30.map(d => ({ d: d.date, v: d.vendas || 0 })), [sales30])
  const receitaSpark = React.useMemo(() => sales30.map(d => ({ d: d.date, v: Number(d.receita || 0) })), [sales30])
  const saldoSpark = React.useMemo(() => mov30.map(d => ({ d: d.date, v: (d.entrada || 0) - (d.saida || 0) })), [mov30])

  const lowStock = React.useMemo(() => {
    return materials
      .filter(m => Number(m.mat_quantidade_estoque) < Number(m.mat_estoque_minimo))
      .sort((a, b) => Number(a.mat_quantidade_estoque) - Number(b.mat_quantidade_estoque))
      .slice(0, 8)
  }, [materials])

  const reqsPendentes = React.useMemo(() => requisicoes.filter(r => String(r.req_status) === "Pendente" && canDecideReq(r)), [requisicoes, canDecideReq])

  const statusCounts = React.useMemo(() => {
    const map = new Map()
    requisicoes.forEach(r => {
      const s = String(r.req_status || "Desconhecido")
      map.set(s, (map.get(s) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [requisicoes])

  React.useEffect(() => {
    const now = new Date()
    loadMensal?.(now.getFullYear(), now.getMonth() + 1)
  }, [loadMensal])

  const almocoSerie = React.useMemo(() => {
    const dias = relMensal?.dias || []
    return dias.map(d => ({
      date: d.data || "",
      almocos: Number(d.total_almocos || 0),
      receita: Number(d.total_arrecadado || 0),
    }))
  }, [relMensal])

  /* ===== Loading/Erro ===== */
  if (loading) {
    return (
      <Shell>
        <Topbar onRefresh={refresh} />
        <div className="py-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4 3xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 2xl:h-48 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
          <div className="h-[360px] 2xl:h-[460px] rounded-2xl bg-slate-100 animate-pulse lg:col-span-2" />
          <div className="h-[360px] 2xl:h-[460px] rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <Topbar onRefresh={refresh} />
        <div className="py-24 flex flex-col items-center">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 max-w-md text-center">
            <h3 className="mt-1 font-semibold text-rose-700">Falha ao carregar</h3>
            <p className="text-sm text-rose-700/80 mt-1">{error}</p>
            <button
              onClick={refresh}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-red-600 focus-visible:ring-2"
            >
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
          </div>
        </div>
      </Shell>
    )
  }

  /* ===== Página ===== */
  return (
    <Shell>
      <Topbar onRefresh={refresh} />

      {/* KPIs principais */}
      <div className="py-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-6 3xl:grid-cols-6">
        <KpiCard
          title="Vendas (30d)"
          subtitle="Quantidade de vendas"
          value={nf.format(sales30.reduce((s, d) => s + (d.vendas || 0), 0))}
          icon={ShoppingCart}
          tone="indigo"
          sparkData={vendasSpark}
        />
        <KpiCard
          title="Receita (30d)"
          subtitle="Total faturado"
          value={stn(sales30.reduce((s, d) => s + Number(d.receita || 0), 0))}
          icon={DollarSign}
          tone="emerald"
          sparkData={receitaSpark}
        />
        <KpiCard
          title="Saldo (30d)"
          subtitle="Entradas - Saídas"
          value={nf.format(saldoSpark.reduce((s, d) => s + Number(d.v || 0), 0))}
          icon={TrendingUp}
          tone="sky"
          sparkData={saldoSpark}
        />
        <KpiCard
          title="Baixo Estoque"
          subtitle="Itens abaixo do mínimo"
          value={nf.format(lowStock.length)}
          icon={PackageCheck}
          tone="amber"
        />
        <KpiCard
          title="Req. por Responder"
          value={nf.format(reqsPendentes.length)}
          icon={Clock}
          tone="pink"
        />
        <KpiCard
          title="Almoço Hoje"
          subtitle={`Preço: ${stn(precoHoje || 0)}`}
          value={`${nf.format(relHoje?.totais?.total_almocos || 0)} • ${stn(relHoje?.totais?.total_arrecadado || 0)}`}
          icon={DollarSign}
          tone="slate"
        />
      </div>

      {/* Seção de gráficos principais */}
      <div className="grid grid-cols-1  gap-6">
  
        {/* Receita diária (30d) */}
        <section aria-labelledby="receita-dia" className="space-y-3 ">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <DollarSign className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="receita-dia" className="text-lg sm:text-xl 2xl:text-2xl font-bold">Receita Diária</h2>
              <p className="text-sm text-slate-600">Tendência de faturamento nos últimos 30 dias</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-white p-4">
            {sales30.length ? (
              <div className="h-[340px] md:h-[380px] 2xl:h-[460px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sales30}>
                    <defs>
                      <linearGradient id="g-receita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.receita} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={CHART_COLORS.receita} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(v) => [stn(v), "Receita"]} />
                    <ReferenceLine y={0} stroke="#94a3b8" />
                    <Area type="monotone" dataKey="receita" stroke={CHART_COLORS.receita} strokeWidth={3} fill="url(#g-receita)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyState message="Sem dados de receita." />}
          </div>
        </section>
     
      </div>
         {/* Movimentações + Estoque */}
        <section aria-labelledby="mix-estoque" className="space-y-3 ">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="mix-estoque" className="text-lg sm:text-xl 2xl:text-2xl font-bold">Fluxo de Movimentações & Estoque</h2>
              <p className="text-sm text-slate-600">Entradas/saídas por dia e curva acumulada de estoque</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-white p-4">
            {inventorySeries.length ? (
              <div className="h-[340px] md:h-[380px] 2xl:h-[460px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedMovInventory data={inventorySeries} />
                </ResponsiveContainer>
              </div>
            ) : <EmptyState message="Sem dados de movimentações." />}
            {/* Tabela sr-only */}
            <div className="sr-only">
              <table>
                <caption>Entradas, saídas e estoque acumulado por dia</caption>
                <thead><tr><th>Data</th><th>Entradas</th><th>Saídas</th><th>Estoque</th></tr></thead>
                <tbody>
                  {inventorySeries.map((r, i) => (
                    <tr key={i}><td>{r.date}</td><td>{r.entrada}</td><td>{r.saida}</td><td>{r.estoque}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      {/* Requisições: status + baixo estoque + timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Pizza de status de requisições */}
        <section aria-labelledby="req-status" className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <PieChart className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="req-status" className="text-lg sm:text-xl 2xl:text-2xl font-bold">Requisições por Status</h2>
              <p className="text-sm text-slate-600">Distribuição atual</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-white p-4">
            {statusCounts.length ? (
              <div className="h-[340px] md:h-[380px] 2xl:h-[460px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={70} outerRadius={115} paddingAngle={3} dataKey="value">
                      {statusCounts.map((s, i) => (
                        <Cell key={i} fill={pickStatusColor(s.name)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n, p) => [v, p?.payload?.name]} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyState message="Sem requisições para agrupar." />}
            <div className="mt-3 flex flex-wrap gap-2">
              {statusCounts.map((s, i) => (
                <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs ${statusColors[s.name] || "bg-slate-50 text-slate-700 border-slate-300"}`}>
                  <span aria-hidden="true">{statusIcons[s.name] || "•"}</span> {s.name}: <strong>{s.value}</strong>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Baixo estoque */}
        <section aria-labelledby="baixo-estoque" className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <PackageCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="baixo-estoque" className="text-lg sm:text-xl 2xl:text-2xl font-bold">Materiais com Baixo Estoque</h2>
              <p className="text-sm text-slate-600">Priorize o reabastecimento</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-white">
            {lowStock.length ? (
              <ul role="list" className="divide-y divide-slate-200">
                {lowStock.map((m, i) => (
                  <li key={i} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{m.mat_nome || `Material #${m.mat_id}`}</p>
                      <p className="text-xs text-slate-600">
                        Estoque: <strong>{nf.format(Number(m.mat_quantidade_estoque) || 0)}</strong> • Mín.:{" "}
                        <strong>{nf.format(Number(m.mat_estoque_minimo) || 0)}</strong>
                      </p>
                    </div>
                    <button className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200">
                      Detalhes <ChevronRight className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : <EmptyState message="Sem itens abaixo do mínimo." />}
          </div>
        </section>

        {/* Timeline movimentações */}
        <section aria-labelledby="timeline" className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="timeline" className="text-lg sm:text-xl 2xl:text-2xl font-bold">Últimas Movimentações</h2>
              <p className="text-sm text-slate-600">Entradas e saídas recentes</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-white p-4">
            {movements?.length ? (
              <ol className="relative border-s-l border-slate-300 pl-6 space-y-5 max-h-[460px] 2xl:max-h-[560px] overflow-auto">
                {movements.slice(-14).reverse().map((mv, i) => {
                  const tipo = mv.mov_tipo === "entrada" ? "Entrada" : "Saída"
                  const corDot = mv.mov_tipo === "entrada" ? "bg-emerald-500" : "bg-rose-500"
                  return (
                    <li key={i}>
                      <span className={`absolute -left-1.5 h-3 w-3 rounded-full ${corDot}`}></span>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{tipo} • {mv.mov_motivo || "Mov."}</p>
                          <p className="text-xs text-slate-600">
                            Qtd: <strong>{nf.format(Number(mv.mov_quantidade || 0))}</strong>
                            {mv.mov_valor ? <> • Valor: <strong>{stn(Number(mv.mov_valor || 0))}</strong></> : null}
                          </p>
                        </div>
                        <time className="text-xs text-slate-600">{fmtDate(mv.mov_data)}</time>
                      </div>
                    </li>
                  )
                })}
              </ol>
            ) : <EmptyState message="Sem movimentações recentes." />}
          </div>
        </section>
      </div>

      {/* Resumos textuais */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-8">
        <article className="rounded-2xl border border-slate-300 bg-white p-5">
          <h3 className="text-base 2xl:text-lg font-semibold">Resumo de Inventário</h3>
          <p className="mt-2 text-sm 2xl:text-base text-slate-700">
            Nos últimos <strong>30 dias</strong>, houve <strong>{nf.format(mov30.reduce((s,d)=>s+(d.entrada||0),0))}</strong> entradas e{" "}
            <strong>{nf.format(mov30.reduce((s,d)=>s+(d.saida||0),0))}</strong> saídas. O saldo acumulado é{" "}
            <strong>{nf.format(saldoSpark.reduce((s,d)=>s+Number(d.v||0),0))}</strong>.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-300 bg-white p-5">
          <h3 className="text-base 2xl:text-lg font-semibold">Resumo de Requisições</h3>
          <p className="mt-2 text-sm 2xl:text-base text-slate-700">
            Existem <strong>{nf.format(reqsPendentes.length)}</strong> requisições <strong>pendentes</strong> sob sua responsabilidade.
            A distribuição por status está no gráfico ao lado. Priorize as pendentes para manter o fluxo operacional.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-300 bg-white p-5">
          <h3 className="text-base 2xl:text-lg font-semibold">Resumo de Almoço</h3>
          <p className="mt-2 text-sm 2xl:text-base text-slate-700">
            Hoje foram marcados <strong>{nf.format(relHoje?.totais?.total_almocos || 0)}</strong> almoços, totalizando{" "}
            <strong>{stn(relHoje?.totais?.total_arrecadado || 0)}</strong> (preço unitário {stn(precoHoje || 0)}).
          </p>
          <div className="mt-3">
            <h4 className="text-sm 2xl:text-base font-medium">Mensal (tendência)</h4>
            <div className="mt-2 h-28 2xl:h-36">
              {almocoSerie?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={almocoSerie}>
                    <defs>
                      <linearGradient id="g-almoco" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip formatter={(v, n) => n === "almocos" ? [nf.format(Number(v)), "Almoços"] : [stn(Number(v)), "Receita"]} />
                    <Area type="monotone" dataKey="almocos" stroke="#0ea5e9" fill="url(#g-almoco)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  {loadingMensal ? "Carregando..." : "Sem dados mensais."}
                </div>
              )}
            </div>
          </div>
        </article>
      </section>

      <footer className="py-8 text-xs 2xl:text-sm text-slate-500">
        Última atualização: {lastUpdated ? new Date(lastUpdated).toLocaleString("pt-PT") : "—"}
      </footer>
    </Shell>
  )
}

/* ===== util para cores da pizza de status ===== */
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
  }
  return map[name] || "#6366f1"
}
