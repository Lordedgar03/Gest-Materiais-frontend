/* eslint-disable no-unused-vars */
"use client"

import React from "react"
import {
  Users, PackageCheck, Shapes, Layers, RefreshCw, FileText,
  ArrowUpRight, ArrowDownRight, Calendar, Activity, PieChart, AlertCircle, BarChart4
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell, PieChart as RechartPieChart, Pie
} from "recharts"
import { useDashboard } from "../hooks/useDashboard"

// ícones pelo nome (vindo do hook)
const ICONS = { Users, PackageCheck, Shapes, Layers, RefreshCw, FileText }

// estilos por “tone” dos cards
const TONES = {
  blue:    { bg: "bg-gradient-to-br from-blue-500 to-blue-400",   text: "text-blue-900 dark:text-white",   ring: "ring-blue-400",   dot: "bg-blue-500" },
  emerald: { bg: "bg-gradient-to-br from-emerald-500 to-emerald-400", text: "text-emerald-900 dark:text-white", ring: "ring-emerald-400", dot: "bg-emerald-500" },
  amber:   { bg: "bg-gradient-to-br from-amber-500 to-amber-400", text: "text-amber-900 dark:text-white", ring: "ring-amber-400",   dot: "bg-amber-500" },
  pink:    { bg: "bg-gradient-to-br from-pink-500 to-pink-400",   text: "text-pink-900 dark:text-white",   ring: "ring-pink-400",    dot: "bg-pink-500" },
  indigo:  { bg: "bg-gradient-to-br from-indigo-500 to-indigo-400", text: "text-indigo-900 dark:text-white", ring: "ring-indigo-400", dot: "bg-indigo-500" },
  purple:  { bg: "bg-gradient-to-br from-purple-500 to-purple-400", text: "text-purple-900 dark:text-white", ring: "ring-purple-400", dot: "bg-purple-500" },
  violet:  { bg: "bg-gradient-to-br from-violet-500 to-violet-400", text: "text-violet-900 dark:text-white", ring: "ring-violet-400", dot: "bg-violet-500" },
  fuchsia: { bg: "bg-gradient-to-br from-fuchsia-500 to-fuchsia-400", text: "text-fuchsia-900 dark:text-white", ring: "ring-fuchsia-400", dot: "bg-fuchsia-500" },
}

function StatCard({ icon: IconCmp = Users, label, value, secondaryValue, trend, tone = "blue" }) {
  const t = TONES[tone] || TONES.blue
  return (
    <div className={`rounded-xl p-3 ring-1 ${t.ring} ${t.bg} backdrop-blur-sm border border-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-lg bg-white/60 dark:bg-white/5 border border-white/20 flex items-center justify-center`}>
            <IconCmp size={16} className={`${t.text}`} />
          </div>
          <p className={`text-xs font-medium ${t.text}`}>{label}</p>
        </div>
      </div>
      <div className="mt-1">
        <h3 className={`text-xl font-bold ${t.text}`}>{value ?? "—"}</h3>
        {secondaryValue && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{secondaryValue}</p>}
      </div>
      {typeof trend === "number" && (
        <div className="mt-1">
          {trend > 0 ? (
            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <ArrowUpRight size={14} className="mr-1" /> +{trend}
            </span>
          ) : trend < 0 ? (
            <span className="inline-flex items-center text-rose-600 dark:text-rose-400 text-xs font-medium">
              <ArrowDownRight size={14} className="mr-1" /> {trend}
            </span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 text-xs">0</span>
          )}
        </div>
      )}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
        <div className="h-7 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="h-80 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse lg:col-span-2" />
        <div className="h-80 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
      <div className="p-4">
        <div className="h-40 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
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
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Erro ao carregar dados
          </h3>
          <p className="text-sm text-red-900 dark:text-red-200 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-900"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
          Dashboard
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date().toLocaleDateString("pt-PT")}
          </span>
          <button
            onClick={refresh}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-900"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </button>
        </div>
      </div>

      {/* content */}
      <div className="flex-grow p-4">
        {/* cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* movement chart */}
          <div className="lg:col-span-2 rounded-xl bg-white/80 dark:bg-gray-900/70 backdrop-blur border border-gray-300 dark:border-white/10 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-indigo-600" />
                Movimentações
              </h2>
              <div className="flex items-center space-x-3">
                <span className="flex items-center text-xs text-gray-900 dark:text-gray-300">
                  <div className="h-3 w-3 rounded-full mr-1 bg-emerald-400" /> Entradas
                </span>
                <span className="flex items-center text-xs text-gray-900 dark:text-gray-300">
                  <div className="h-3 w-3 rounded-full mr-1 bg-rose-400" /> Saídas
                </span>
              </div>
            </div>

            {chartData.movementData?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.movementData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceff1" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={{ stroke: "#e5e7eb" }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={{ stroke: "#e5e7eb" }} />
                  <Tooltip
                    formatter={formatTooltip}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid rgba(229,231,235,1)",
                      borderRadius: 8,
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)",
                    }}
                  />
                  <ReferenceLine y={0} stroke="#e5e7eb" />
                  <Area type="monotone" dataKey="entrada" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorEntrada)" activeDot={{ r: 6 }} />
                  <Area type="monotone" dataKey="saida" stroke="#fb7185" strokeWidth={2} fillOpacity={1} fill="url(#colorSaida)" activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-gray-500 dark:text-gray-300">Sem dados de movimentação</p>
              </div>
            )}
          </div>

          {/* category pie */}
          <div className="rounded-xl bg-white/80 dark:bg-gray-900/70 backdrop-blur border border-gray-300 dark:border-white/10 p-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-indigo-600" />
              Materiais por Categoria
            </h2>

            {chartData.categoryData?.length ? (
              <div className="h-[300px] flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <RechartPieChart>
                    <Pie
                      data={chartData.categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => ` ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.categoryData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid rgba(229,231,235,1)",
                        borderRadius: 8,
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)",
                      }}
                    />
                  </RechartPieChart>
                </ResponsiveContainer>

                <div className="flex flex-wrap justify-center mt-2 gap-2">
                  {chartData.categoryData.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center">
                      <div
                        className="h-3 w-3 rounded-full mr-1"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-xs text-gray-900 dark:text-gray-300">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-gray-500 dark:text-gray-300">Sem categorias disponíveis</p>
              </div>
            )}
          </div>
        </div>

        {/* recent stats */}
        <div className="mt-4 rounded-xl bg-white/80 dark:bg-gray-900/70 backdrop-blur border border-gray-300 dark:border-white/10 p-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <BarChart4 className="h-5 w-5 mr-2 text-indigo-600" />
            Estatísticas Recentes (Últimos 7 dias)
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl p-4 ring-1 ring-blue-400/20 bg-gradient-to-br from-blue-500/10 to-blue-400/10">
              <h3 className="text-sm text-blue-900 dark:text-blue-300 font-medium mb-2">Entradas</h3>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{metrics.totalEntradas ?? "—"}</p>
              <p className="text-xs text-blue-600 dark:text-blue-300/80 mt-1">Total</p>
            </div>

            <div className="rounded-xl p-4 ring-1 ring-rose-400/20 bg-gradient-to-br from-rose-500/10 to-rose-400/10">
              <h3 className="text-sm text-rose-900 dark:text-rose-300 font-medium mb-2">Saídas</h3>
              <p className="text-2xl font-bold text-rose-800 dark:text-rose-200">{metrics.totalSaidas ?? "—"}</p>
              <p className="text-xs text-rose-600 dark:text-rose-300/80 mt-1">Total</p>
            </div>

            <div className="rounded-xl p-4 ring-1 ring-amber-400/20 bg-gradient-to-br from-amber-500/10 to-amber-400/10">
              <h3 className="text-sm text-amber-900 dark:text-amber-300 font-medium mb-2">Balanço</h3>
              <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">{metrics.inventoryTrend ?? "—"}</p>
              <p className="text-xs text-amber-600 dark:text-amber-300/80 mt-1">Diferença entrada/saída</p>
            </div>

            <div className="rounded-xl p-4 ring-1 ring-purple-400/20 bg-gradient-to-br from-purple-500/10 to-purple-400/10">
              <h3 className="text-sm text-purple-900 dark:text-purple-300 font-medium mb-2">Receita (7d)</h3>
              <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                € {Number(metrics.receita7d || 0).toFixed(2)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-300/80 mt-1">
                {metrics.numVendas7d ?? 0} vendas
              </p>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}
