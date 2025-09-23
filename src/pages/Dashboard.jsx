/* eslint-disable no-unused-vars */
"use client"

import React from "react"
import {
  Users, PackageCheck, Shapes, Layers, RefreshCw, FileText,
  ArrowUpRight, ArrowDownRight, Calendar, Activity, PieChart, AlertCircle, BarChart4,
  TrendingUp, DollarSign, Package, ShoppingCart
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell, PieChart as RechartPieChart, Pie
} from "recharts"
import { useDashboard } from "../hooks/useDashboard"

// ícones pelo nome (vindo do hook)
const ICONS = { 
  Users, PackageCheck, Shapes, Layers, RefreshCw, FileText, 
  TrendingUp, DollarSign, Package, ShoppingCart 
}

// estilos por "tone" dos cards - modernizados
const TONES = {
  blue: { 
    bg: "bg-gradient-to-br from-blue-500 to-indigo-600", 
    text: "text-white", 
    ring: "ring-blue-400/30", 
    dot: "bg-blue-500",
    accent: "bg-blue-100 dark:bg-blue-900/30"
  },
  emerald: { 
    bg: "bg-gradient-to-br from-emerald-500 to-teal-600", 
    text: "text-white", 
    ring: "ring-emerald-400/30", 
    dot: "bg-emerald-500",
    accent: "bg-emerald-100 dark:bg-emerald-900/30"
  },
  amber: { 
    bg: "bg-gradient-to-br from-amber-500 to-orange-600", 
    text: "text-white", 
    ring: "ring-amber-400/30", 
    dot: "bg-amber-500",
    accent: "bg-amber-100 dark:bg-amber-900/30"
  },
  pink: { 
    bg: "bg-gradient-to-br from-pink-500 to-rose-600", 
    text: "text-white", 
    ring: "ring-pink-400/30", 
    dot: "bg-pink-500",
    accent: "bg-pink-100 dark:bg-pink-900/30"
  },
  indigo: { 
    bg: "bg-gradient-to-br from-indigo-500 to-purple-600", 
    text: "text-white", 
    ring: "ring-indigo-400/30", 
    dot: "bg-indigo-500",
    accent: "bg-indigo-100 dark:bg-indigo-900/30"
  },
  purple: { 
    bg: "bg-gradient-to-br from-purple-500 to-violet-600", 
    text: "text-white", 
    ring: "ring-purple-400/30", 
    dot: "bg-purple-500",
    accent: "bg-purple-100 dark:bg-purple-900/30"
  },
  violet: { 
    bg: "bg-gradient-to-br from-violet-500 to-fuchsia-600", 
    text: "text-white", 
    ring: "ring-violet-400/30", 
    dot: "bg-violet-500",
    accent: "bg-violet-100 dark:bg-violet-900/30"
  },
  fuchsia: { 
    bg: "bg-gradient-to-br from-fuchsia-500 to-pink-600", 
    text: "text-white", 
    ring: "ring-fuchsia-400/30", 
    dot: "bg-fuchsia-500",
    accent: "bg-fuchsia-100 dark:bg-fuchsia-900/30"
  },
}

function StatCard({ icon: IconCmp = Users, label, value, secondaryValue, trend, tone = "blue" }) {
  const t = TONES[tone] || TONES.blue
  return (
    <div className={`group relative overflow-hidden rounded-2xl ${t.bg} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/20`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
            <IconCmp size={20} className={`${t.text}`} />
          </div>
          {typeof trend === "number" && (
            <div className="flex items-center">
              {trend > 0 ? (
                <div className="flex items-center text-white/90 text-sm font-medium bg-white/20 rounded-full px-2 py-1">
                  <ArrowUpRight size={14} className="mr-1" /> +{trend}
                </div>
              ) : trend < 0 ? (
                <div className="flex items-center text-white/90 text-sm font-medium bg-white/20 rounded-full px-2 py-1">
                  <ArrowDownRight size={14} className="mr-1" /> {trend}
                </div>
              ) : (
                <span className="text-white/70 text-sm">0</span>
              )}
            </div>
          )}
        </div>
        
        <div>
          <p className={`text-sm font-medium ${t.text} opacity-90 mb-2`}>{label}</p>
          <h3 className={`text-2xl font-bold ${t.text} mb-1`}>{value ?? "—"}</h3>
          {secondaryValue && (
            <p className="text-sm text-white/80 bg-white/10 rounded-full px-2 py-1 inline-block">
              {secondaryValue}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, icon: Icon, children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-xl ${className}`}>
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <Icon className="h-5 w-5 text-white" />
          </div>
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/20">
      <div className="p-8">
        {/* Header skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
        
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
        
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="h-96 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse lg:col-span-2" />
          <div className="h-96 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
        
        {/* Stats skeleton */}
        <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const {
    loading, error, lastUpdated,
    metrics = {}, chartData = { movementData: [], categoryData: [] },
    cards = [], COLORS = [],
    refresh,
  } = useDashboard()

  const formatTooltip = (value, name) => {
    const nameMap = { entrada: "Entradas", saida: "Saídas", total: "Balanço" }
    return [value, nameMap[name] || name]
  }

  if (loading) return <Skeleton />

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/20 p-8">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-red-200 dark:border-red-800/50 rounded-2xl p-8 max-w-md shadow-xl">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl mb-6 mx-auto">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
            Erro ao carregar dados
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">{error}</p>
          <button
            onClick={refresh}
            className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/20">
      <div className="p-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Dashboard Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Visão geral do sistema em tempo real</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString("pt-PT", { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <RefreshCw className="h-4 w-4" /> Atualizar
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6">
            {cards.map((card, idx) => {
              const Icon = ICONS[card.iconName] || Users
              return (
                <StatCard
                  key={`${card.label}-${idx}`}
                  icon={Icon}
                  label={card.label}
                  value={card.value}
                  secondaryValue={card.secondaryValue}
                  trend={card.trend}
                  tone={card.tone}
                />
              )
            })}
          </div>
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Movement Chart */}
          <ChartCard title="Movimentações Recentes" icon={Activity} className="lg:col-span-2">
            <div className="flex items-center justify-end space-x-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Entradas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500 shadow-sm" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Saídas</span>
              </div>
            </div>

            {chartData.movementData?.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData.movementData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: "#6b7280", fontSize: 12 }} 
                    tickLine={{ stroke: "#d1d5db" }}
                    axisLine={{ stroke: "#d1d5db" }}
                  />
                  <YAxis 
                    tick={{ fill: "#6b7280", fontSize: 12 }} 
                    tickLine={{ stroke: "#d1d5db" }}
                    axisLine={{ stroke: "#d1d5db" }}
                  />
                  <Tooltip
                    formatter={formatTooltip}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid rgba(229,231,235,0.8)",
                      borderRadius: 12,
                      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
                      backdropFilter: "blur(8px)"
                    }}
                  />
                  <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="2 2" />
                  <Area 
                    type="monotone" 
                    dataKey="entrada" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorEntrada)" 
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="saida" 
                    stroke="#f43f5e" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorSaida)" 
                    activeDot={{ r: 6, stroke: '#f43f5e', strokeWidth: 2, fill: '#fff' }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                <Activity className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Sem dados de movimentação</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Os dados aparecerão aqui quando houver movimentações</p>
              </div>
            )}
          </ChartCard>

          {/* Category Distribution */}
          <ChartCard title="Distribuição por Categoria" icon={PieChart}>
            {chartData.categoryData?.length ? (
              <div className="h-80 flex flex-col">
                <ResponsiveContainer width="100%" height="75%">
                  <RechartPieChart>
                    <Pie
                      data={chartData.categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={40}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartData.categoryData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid rgba(229,231,235,0.8)",
                        borderRadius: 12,
                        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                        backdropFilter: "blur(8px)"
                      }}
                    />
                  </RechartPieChart>
                </ResponsiveContainer>

                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {chartData.categoryData.slice(0, 4).map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-full px-3 py-1">
                      <div
                        className="h-3 w-3 rounded-full shadow-sm"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                <PieChart className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Sem categorias disponíveis</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Configure categorias para ver a distribuição</p>
              </div>
            )}
          </ChartCard>
        </section>

        {/* Recent Statistics */}
        <ChartCard title="Estatísticas dos Últimos 7 Dias" icon={BarChart4}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                  <ArrowUpRight className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 rounded-full px-2 py-1">
                  +7 dias
                </span>
              </div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Entradas</h3>
              <p className="text-3xl font-bold text-blue-800 dark:text-blue-200 mb-1">{metrics.totalEntradas ?? "—"}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Total de itens</p>
            </div>

            <div className="group p-6 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 border border-rose-200/50 dark:border-rose-800/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg">
                  <ArrowDownRight className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 rounded-full px-2 py-1">
                  +7 dias
                </span>
              </div>
              <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-300 mb-2">Saídas</h3>
              <p className="text-3xl font-bold text-rose-800 dark:text-rose-200 mb-1">{metrics.totalSaidas ?? "—"}</p>
              <p className="text-xs text-rose-600 dark:text-rose-400">Total de itens</p>
            </div>

            <div className="group p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 rounded-full px-2 py-1">
                  Balanço
                </span>
              </div>
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">Saldo</h3>
              <p className="text-3xl font-bold text-amber-800 dark:text-amber-200 mb-1">{metrics.inventoryTrend ?? "—"}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Diferença E/S</p>
            </div>

            <div className="group p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200/50 dark:border-purple-800/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 rounded-full px-2 py-1">
                  {metrics.numVendas7d ?? 0} vendas
                </span>
              </div>
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">Receita (7d)</h3>
              <p className="text-3xl font-bold text-purple-800 dark:text-purple-200 mb-1">
                €{Number(metrics.receita7d || 0).toFixed(2)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">Últimos 7 dias</p>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}