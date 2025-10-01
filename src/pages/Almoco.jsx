/* eslint-disable no-unused-vars */
"use client"

import React from "react"
import {
  Utensils, Soup, CalendarDays, CalendarRange, Settings, Cog, Loader2, X,
  FileBarChart, FileDown, Printer, PiggyBank, Coins, Users, Download, RefreshCcw,
  TrendingUp, Filter, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle
} from "lucide-react"
import { Formik, Form, Field } from "formik"
import useAlmoco from "../hooks/useAlmoco"

/* =================== helpers =================== */
const nf = new Intl.NumberFormat("pt-PT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const stn = (n) => `STN ${nf.format(Number(n || 0))}`

const totalPago = (rows) =>
  rows.reduce((s, r) => s + (r.ala_status === "Pago" ? Number(r.ala_valor || 0) : 0), 0)

const getAnoFromTurma = (t) => {
  const m = String(t || "").trim().match(/(\d{1,2})/)
  return m ? Number(m[1]) : "-"
}

const ordenarTurmas = (a, b) => {
  const an = getAnoFromTurma(a.turma)
  const bn = getAnoFromTurma(b.turma)
  if (an === "-" && bn !== "-") return 1
  if (bn === "-" && an !== "-") return -1
  if (an !== "-" && bn !== "-" && an !== bn) return an - bn
  return String(a.turma || "").localeCompare(String(b.turma || ""))
}

const exportCSV = (rows, meta) => {
  const head = ["Ano", "Turma", "Nº de almoços", "Valor por turma (STN)"]
  const lines = [head.join(";")]
  rows.forEach(r => lines.push([
    getAnoFromTurma(r.turma), 
    r.turma || "-", 
    Number(r.qtd || 0), 
    Number(r.total || 0)
  ].join(";")))
  const total = rows.reduce((s, r) => s + Number(r.total || 0), 0)
  lines.push(["", "", "TOTAL", total].join(";"))
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `almoco-${meta?.ano || ""}-${String(meta?.mes || "").replace(/\s+/g, "_")}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'pago':
      return <CheckCircle size={14} className="text-green-600" />
    case 'pendente':
      return <Clock size={14} className="text-amber-600" />
    default:
      return <AlertCircle size={14} className="text-gray-400" />
  }
}

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pago':
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
    case 'pendente':
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
  }
}

/* =================== micro-components =================== */
function Toast({ msg, tone = "success", onClose }) {
  if (!msg) return null

  const toneStyles = {
    error: "bg-red-600 border-red-700",
    warning: "bg-amber-500 border-amber-600",
    success: "bg-green-600 border-green-700",
    info: "bg-blue-600 border-blue-700"
  }

  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
      <div className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl text-white border ${toneStyles[tone]}`}>
        <div className="flex-1 flex items-center gap-2">
          {tone === "success" && <CheckCircle size={18} className="opacity-90" />}
          {tone === "error" && <AlertCircle size={18} className="opacity-90" />}
          {tone === "warning" && <Clock size={18} className="opacity-90" />}
          <div className="text-sm whitespace-pre-line">{msg}</div>
        </div>
        <button 
          onClick={onClose} 
          className="ml-2 opacity-80 hover:opacity-100 transition-opacity"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function Modal({ open, title, onClose, children, footer, size = "md" }) {
  const modalRef = React.useRef(null)

  React.useEffect(() => {
    if (!open) return
    
    const handleKeyDown = (e) => e.key === "Escape" && onClose?.()
    document.addEventListener("keydown", handleKeyDown)
    
    // Focus management
    if (modalRef.current) {
      modalRef.current.focus()
    }

    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div 
          ref={modalRef}
          tabIndex={-1}
          className={`w-full max-w-${size === "lg" ? "3xl" : "lg"} rounded-2xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-2xl animate-scale-in focus:outline-none`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Fechar modal"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
          {footer && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Stat = ({ title, value, icon, tone = "indigo", loading = false, trend }) => {
  const toneMap = {
    indigo: "from-indigo-500 to-violet-600",
    teal: "from-teal-500 to-emerald-600",
    amber: "from-amber-500 to-orange-600",
    sky: "from-sky-500 to-blue-600",
    green: "from-green-500 to-emerald-600"
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all">
      <div className={`absolute inset-x-0 -top-24 h-40 bg-gradient-to-br ${toneMap[tone]} opacity-5 blur-2xl`} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm font-medium">
            <span className="inline-grid place-items-center p-2 rounded-xl bg-gray-100 dark:bg-gray-700">
              {icon}
            </span>
            {title}
          </div>
          {trend && (
            <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              trend > 0 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 size={20} className="animate-spin text-gray-400" />
              <span className="text-gray-400">...</span>
            </div>
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  )
}

/* =================== Tabs com slider =================== */
function Tabs({ value, onChange, items }) {
  const barRef = React.useRef(null)
  const listRef = React.useRef(null)

  React.useEffect(() => {
    const i = items.findIndex((t) => t.key === value)
    if (i < 0 || !listRef.current || !barRef.current) return
    const btn = listRef.current.querySelectorAll("button")[i]
    if (!btn) return
    const { offsetLeft, offsetWidth } = btn
    barRef.current.style.transform = `translateX(${offsetLeft}px)`
    barRef.current.style.width = `${offsetWidth}px`
  }, [value, items])

  const onKeyDown = (e) => {
    const idx = items.findIndex((t) => t.key === value)
    if (idx < 0) return
    if (e.key === "ArrowRight") onChange(items[(idx + 1) % items.length].key)
    if (e.key === "ArrowLeft") onChange(items[(idx - 1 + items.length) % items.length].key)
  }

  return (
    <div className="relative">
      <div
        role="tablist"
        aria-label="Secções do módulo Almoço"
        className="relative flex flex-wrap gap-2 rounded-2xl p-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        ref={listRef}
        onKeyDown={onKeyDown}
      >
        <span
          ref={barRef}
          aria-hidden="true"
          className="absolute top-1 h-[42px] rounded-xl bg-white dark:bg-gray-700 shadow-sm ring-1 ring-gray-200 dark:ring-gray-600 transition-all duration-300"
          style={{ width: 0, transform: "translateX(0px)" }}
        />
        {items.map((t) => {
          const active = t.key === value
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${t.key}`}
              id={`tab-${t.key}`}
              onClick={() => onChange(t.key)}
              className={`relative z-[1] px-4 sm:px-5 h-10 rounded-xl text-sm font-medium transition-all ${
                active 
                  ? "text-gray-900 dark:text-white" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                {t.icon}
                {t.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* =================== Página =================== */
export default function Almoco() {
  const {
    allowed, loadingBoot,
    precoPadrao, precoHoje, atualizarPreco, updatingPreco,
    relHoje, loadingHoje,
    relData, loadingData, loadPorData,
    relIntervalo, loadingIntervalo, loadIntervalo,
    relMensal, loadingMensal, loadMensal,
    listaHoje, loadingListaHoje, listaData, loadingListaData, loadListaPorData,
    toast, setToast, tone, today,
  } = useAlmoco()

  const [openPreco, setOpenPreco] = React.useState(false)
  const [tab, setTab] = React.useState("hoje")
  const [expandedFilters, setExpandedFilters] = React.useState({
    hoje: false,
    porData: false,
    intervalo: false,
    mensal: false
  })

  const linhasMensal = React.useMemo(
    () => (Array.isArray(relMensal?.porTurma) ? [...relMensal.porTurma].sort(ordenarTurmas) : []),
    [relMensal]
  )
  
  const totalMensal = React.useMemo(
    () => Number(relMensal?.totalGeral?.total_arrecadado || 0),
    [relMensal]
  )

  React.useEffect(() => {
    const now = new Date()
    loadMensal?.(now.getFullYear(), now.toLocaleString("pt-PT", { month: "long" }))
  }, [loadMensal])

  const toggleFilters = (tabKey) => {
    setExpandedFilters(prev => ({
      ...prev,
      [tabKey]: !prev[tabKey]
    }))
  }

  if (loadingBoot) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">A carregar módulo Almoço...</p>
        </div>
      </main>
    )
  }

  if (!allowed) {
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 grid place-items-center">
            <X className="text-red-600 dark:text-red-400" size={24} />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Acesso Restrito</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Não tem permissão para aceder ao módulo Almoço.</p>
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            Voltar
          </button>
        </div>
      </main>
    )
  }

  const tabs = [
    { 
      key: "hoje",      
      label: "Hoje",       
      icon: <CalendarDays size={18} className="text-indigo-600" /> 
    },
    { 
      key: "por-data",  
      label: "Por Data",   
      icon: <CalendarRange size={18} className="text-emerald-600" /> 
    },
    { 
      key: "intervalo", 
      label: "Intervalo",  
      icon: <FileBarChart size={18} className="text-sky-600" /> 
    },
    { 
      key: "mensal",    
      label: "Mensal",     
      icon: <Coins size={18} className="text-amber-600" /> 
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      {/* Header */}
      <header className="rounded-2xl p-6 md:p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white grid place-items-center shadow-lg">
              <Utensils size={26} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Gestão de Almoços
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                <CalendarDays size={18} />
                {new Date().toLocaleDateString("pt-PT", { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3">
              <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Preço Atual</div>
              <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{stn(precoHoje)}</div>
            </div>
            <button
              onClick={() => setOpenPreco(true)}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              <Settings size={20} />
              Definir Preço
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <Tabs value={tab} onChange={setTab} items={tabs} />
      </div>

      {/* Main Content Panel */}
      <section
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="rounded-2xl p-6 md:p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        {/* HOJE */}
        {tab === "hoje" && (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Stat 
                title="Almoços Hoje" 
                value={loadingHoje ? "..." : (relHoje?.totais?.total_almocos || 0)} 
                icon={<Soup size={20} className="text-indigo-600" />} 
                tone="indigo"
                loading={loadingHoje}
              />
              <Stat 
                title="Total Arrecadado" 
                value={loadingHoje ? "..." : stn(relHoje?.totais?.total_arrecadado || 0)} 
                icon={<Coins size={20} className="text-emerald-600" />} 
                tone="teal"
                loading={loadingHoje}
              />
              <Stat 
                title="Preço Padrão" 
                value={stn(precoPadrao)} 
                icon={<PiggyBank size={20} className="text-amber-600" />} 
                tone="amber"
              />
            </div>

            {/* Today's List */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                    Almoços de Hoje
                  </h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total: <span className="font-semibold">{listaHoje.length}</span> registos
                  </div>
                </div>
              </div>
              
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr className="text-gray-700 dark:text-gray-300 text-left">
                      <th className="px-6 py-4 font-semibold">Aluno</th>
                      <th className="px-6 py-4 font-semibold">Nº Processo</th>
                      <th className="px-6 py-4 font-semibold">Turma</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loadingListaHoje ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                            <Loader2 size={20} className="animate-spin" />
                            A carregar almoços de hoje...
                          </div>
                        </td>
                      </tr>
                    ) : listaHoje.length ? (
                      listaHoje.map((r) => (
                        <tr key={r.ala_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            {r.alu_nome}
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                            {r.alu_num_processo || "-"}
                          </td>
                          <td className="px-6 py-4">
                            {r.alu_turma ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {r.alu_turma}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(r.ala_status)}`}>
                              {getStatusIcon(r.ala_status)}
                              {r.ala_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-white">
                            {stn(r.ala_valor)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="text-gray-500 dark:text-gray-400 space-y-2">
                            <Soup size={48} className="mx-auto opacity-50" />
                            <p className="font-medium">Sem marcações para hoje</p>
                            <p className="text-sm">Não existem almoços marcados para o dia de hoje.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {listaHoje.length > 0 && (
                    <tfoot className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                      <tr className="font-semibold text-gray-900 dark:text-white">
                        <td className="px-6 py-4" colSpan={3}>Total Pago</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
                            <CheckCircle size={12} />
                            Pago
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {stn(totalPago(listaHoje))}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* POR DATA */}
        {tab === "por-data" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                <CalendarRange className="text-emerald-600" />
                Relatório por Data
              </h2>
            </div>

            {/* Date Filter */}
            <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-gray-800 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-6">
              <Formik
                initialValues={{ d: today() }}
                onSubmit={(v) => { 
                  if (!v?.d) return
                  loadPorData(v.d)
                  loadListaPorData(v.d) 
                }}
              >
                {({ submitForm }) => (
                  <Form className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selecionar Data
                      </label>
                      <Field 
                        name="d" 
                        type="date" 
                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                        onChange={(e) => {
                          e.target.form.dispatchEvent(new Event('change', { bubbles: true }))
                          setTimeout(submitForm, 100)
                        }}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loadingData || loadingListaData}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50 transition-colors"
                    >
                      {loadingData || loadingListaData ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        "Gerar Relatório"
                      )}
                    </button>
                  </Form>
                )}
              </Formik>

              {relData && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-700 border border-emerald-200 dark:border-emerald-800 text-sm">
                    <CalendarDays size={16} className="text-emerald-600" />
                    Data: <b>{relData.date}</b>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-700 border border-emerald-200 dark:border-emerald-800 text-sm">
                    <Soup size={16} className="text-emerald-600" />
                    Almoços: <b>{relData.total_almocos}</b>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-700 border border-emerald-200 dark:border-emerald-800 text-sm">
                    <Coins size={16} className="text-emerald-600" />
                    Arrecadado: <b>{stn(relData.total_arrecadado)}</b>
                  </div>
                </div>
              )}
            </div>

            {/* Data List */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Detalhes da Data Selecionada
                </h3>
              </div>
              
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr className="text-gray-700 dark:text-gray-300 text-left">
                      <th className="px-6 py-4 font-semibold">Aluno</th>
                      <th className="px-6 py-4 font-semibold">Nº Processo</th>
                      <th className="px-6 py-4 font-semibold">Turma</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loadingListaData ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                            <Loader2 size={20} className="animate-spin" />
                            A carregar dados da data selecionada...
                          </div>
                        </td>
                      </tr>
                    ) : listaData.length ? (
                      listaData.map((r) => (
                        <tr key={r.ala_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            {r.alu_nome}
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                            {r.alu_num_processo || "-"}
                          </td>
                          <td className="px-6 py-4">
                            {r.alu_turma ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {r.alu_turma}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(r.ala_status)}`}>
                              {getStatusIcon(r.ala_status)}
                              {r.ala_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-white">
                            {stn(r.ala_valor)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="text-gray-500 dark:text-gray-400 space-y-2">
                            <CalendarRange size={48} className="mx-auto opacity-50" />
                            <p className="font-medium">Nenhum dado encontrado</p>
                            <p className="text-sm">Selecione uma data para visualizar os almoços.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {listaData.length > 0 && (
                    <tfoot className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                      <tr className="font-semibold text-gray-900 dark:text-white">
                        <td className="px-6 py-4" colSpan={3}>Total Pago</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
                            <CheckCircle size={12} />
                            Pago
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {stn(totalPago(listaData))}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* INTERVALO */}
        {tab === "intervalo" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                <FileBarChart className="text-sky-600" />
                Relatório por Intervalo
              </h2>
            </div>

            <div className="bg-gradient-to-br from-sky-50 to-white dark:from-sky-900/10 dark:to-gray-800 rounded-2xl border border-sky-200 dark:border-sky-800 p-6">
              <Formik 
                initialValues={{ ini: today(), fim: today() }} 
                onSubmit={(v) => loadIntervalo(v.ini, v.fim)}
              >
                {() => (
                  <Form className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data Inicial
                      </label>
                      <Field 
                        name="ini" 
                        type="date" 
                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data Final
                      </label>
                      <Field 
                        name="fim" 
                        type="date" 
                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loadingIntervalo}
                      className="h-[50px] px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium disabled:opacity-50 transition-colors"
                    >
                      {loadingIntervalo ? (
                        <Loader2 size={20} className="animate-spin mx-auto" />
                      ) : (
                        "Gerar Relatório"
                      )}
                    </button>
                  </Form>
                )}
              </Formik>

              <div className="mt-4">
                {relIntervalo ? (
                  <div className="flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border border-sky-200 dark:border-sky-800">
                      <CalendarRange size={18} className="text-sky-600" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Período</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {relIntervalo.inicio} → {relIntervalo.fim}
                        </div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border border-sky-200 dark:border-sky-800">
                      <Soup size={18} className="text-sky-600" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Almoços</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {relIntervalo.total_almocos}
                        </div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border border-sky-200 dark:border-sky-800">
                      <Coins size={18} className="text-sky-600" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Arrecadado</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {stn(relIntervalo.total_almocado || relIntervalo.total || relIntervalo.total_arrecadado)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <FileBarChart size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Selecione um intervalo de datas para gerar o relatório</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MENSAL */}
        {tab === "mensal" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                <Coins className="text-amber-600" />
                Relatório Mensal
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => relMensal && window.print()}
                  disabled={!relMensal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  title="Imprimir relatório"
                >
                  <Printer size={18} />
                  <span className="hidden sm:inline">Imprimir</span>
                </button>
                <button
                  onClick={() => relMensal && exportCSV(linhasMensal, { ano: relMensal.ano, mes: relMensal.mes })}
                  disabled={!relMensal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  title="Exportar para CSV"
                >
                  <FileDown size={18} />
                  <span className="hidden sm:inline">Exportar CSV</span>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-gray-800 rounded-2xl border border-amber-200 dark:border-amber-800 p-6">
              <Formik
                initialValues={{ 
                  ano: new Date().getFullYear(), 
                  mes: new Date().toLocaleString("pt-PT", { month: "long" }) 
                }}
                onSubmit={(v) => loadMensal(v.ano, v.mes)}
              >
                {() => (
                  <Form className="grid gap-4 md:grid-cols-[180px_220px_auto] items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ano
                      </label>
                      <Field 
                        name="ano" 
                        type="number" 
                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Mês
                      </label>
                      <Field 
                        as="select" 
                        name="mes" 
                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                      >
                        {[
                          "janeiro", "fevereiro", "março", "abril", "maio", "junho",
                          "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
                        ].map((m) => (
                          <option key={m} value={m}>
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                          </option>
                        ))}
                      </Field>
                    </div>
                    <button 
                      type="submit" 
                      disabled={loadingMensal}
                      className="h-[50px] px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium disabled:opacity-50 transition-colors"
                    >
                      {loadingMensal ? (
                        <Loader2 size={20} className="animate-spin mx-auto" />
                      ) : (
                        "Gerar Relatório"
                      )}
                    </button>
                  </Form>
                )}
              </Formik>

              <div className="mt-6">
                {relMensal ? (
                  <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Almoços de {relMensal.mes} de {relMensal.ano}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Resumo financeiro por turma
                      </p>
                    </div>
                    
                    <div className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr className="text-gray-700 dark:text-gray-300 text-left">
                            <th className="px-6 py-4 font-semibold w-24">Ano</th>
                            <th className="px-6 py-4 font-semibold">Turma</th>
                            <th className="px-6 py-4 font-semibold">Nº de Almoços</th>
                            <th className="px-6 py-4 font-semibold text-right">Valor por Turma</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {linhasMensal.length ? (
                            linhasMensal.map((r, idx) => (
                              <tr key={(r.turma || "-") + idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                  {getAnoFromTurma(r.turma)}
                                </td>
                                <td className="px-6 py-4">
                                  {r.turma ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                      {r.turma}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                  {Number(r.qtd || 0)}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-white">
                                  {stn(r.total || 0)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center">
                                <div className="text-gray-500 dark:text-gray-400 space-y-2">
                                  <Coins size={48} className="mx-auto opacity-50" />
                                  <p className="font-medium">Sem dados para o período selecionado</p>
                                  <p className="text-sm">Não existem almoços registados para este mês.</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {linhasMensal.length > 0 && (
                          <tfoot className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                            <tr className="font-semibold text-gray-900 dark:text-white">
                              <td className="px-6 py-4" colSpan={3}>Valor Total do Mês</td>
                              <td className="px-6 py-4 text-right font-mono">
                                {stn(totalMensal)}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Coins size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Selecione o ano e mês para gerar o relatório mensal</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Modal de Preço */}
      <Modal 
        open={openPreco} 
        onClose={() => setOpenPreco(false)} 
        title="Definir Preço do Almoço"
      >
        <Formik
          enableReinitialize
          initialValues={{ 
            preco: Number(precoPadrao || 0).toFixed(2), 
            aplicarHoje: true 
          }}
          onSubmit={async (v, { setSubmitting }) => {
            await atualizarPreco(Number(v.preco || 0), { aplicarHoje: !!v.aplicarHoje })
            setSubmitting(false)
            setOpenPreco(false)
          }}
        >
          {({ isSubmitting, values }) => (
            <Form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preço Padrão (STN)
                </label>
                <Field 
                  name="preco" 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  required
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Preço atual para hoje: <b>{stn(precoHoje)}</b>
                </p>
              </div>
              
              <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <Field 
                  type="checkbox" 
                  name="aplicarHoje" 
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Aplicar também para hoje
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Atualiza imediatamente o preço para os almoços de hoje
                  </div>
                </div>
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setOpenPreco(false)}
                  className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || updatingPreco}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50 transition-colors"
                >
                  {(isSubmitting || updatingPreco) ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Settings size={18} />
                  )}
                  Guardar Preço
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>

      <Toast msg={toast} tone={tone} onClose={() => setToast("")} />

      {/* Estilos de impressão */}
      <style jsx global>{`
        @media print {
          @page { margin: 14mm; }
          body { background: white !important; }
          header, .print\\:hidden, button { display: none !important; }
          .rounded-2xl { border-radius: 0 !important; }
          .shadow-sm { box-shadow: none !important; }
        }
      `}</style>
    </main>
  )
}