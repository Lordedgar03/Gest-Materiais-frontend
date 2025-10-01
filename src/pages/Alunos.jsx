/* eslint-disable no-unused-vars */
'use client'

import React from 'react'
import {
  Users, PlusCircle, Upload, Search, Loader2, X, FileDown, Pencil, 
  Power, PowerOff, Filter, Download, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Eye, EyeOff
} from 'lucide-react'
import { Formik, Form, Field } from 'formik'
import useAlunos from '../hooks/useAlunos'
import api from '../api'

/* ---------- helpers (JS puro) ---------- */
function clsx(...xs) {
  return xs.filter(Boolean).join(' ')
}

function useDebouncedValue(value, delay = 400) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

/* ---------- Modal ---------- */
function Modal({ open, title, onClose, children, footer, size = "md" }) {
  const sizes = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl"
  }

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
        aria-hidden 
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div 
          className={`w-full ${sizes[size]} rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl animate-scale-in`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button 
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={onClose}
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

/* ---------- CSV utils (JS puro) ---------- */
const detectSep = (text) => (text.split('\n')[0]?.includes(';') ? ';' : ',')
const normalizeHeader = (h) =>
  String(h || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '_')

const headerAliases = {
  alu_nome: ['alu_nome', 'nome', 'aluno', 'aluno_nome', 'name', 'student_name'],
  alu_num_processo: ['alu_num_processo', 'num_processo', 'n_processo', 'numero_processo', 'processo', 'process_number'],
  alu_numero: ['alu_numero', 'numero', 'n_aluno', 'n', 'number', 'student_number'],
  alu_turma: ['alu_turma', 'turma', 'classe', 'class', 'group'],
  alu_ano: ['alu_ano', 'ano', 'ano_letivo', 'ano_lectivo', 'year', 'school_year'],
  alu_status: ['alu_status', 'status', 'estado', 'situacao', 'situação', 'state'],
}
const headerMap = (rawHeader) => {
  const h = normalizeHeader(rawHeader)
  for (const [canonical, aliases] of Object.entries(headerAliases)) {
    if (aliases.includes(h)) return canonical
  }
  return h
}
const toAluno = (rowObj) => {
  const o = {
    alu_nome: rowObj.alu_nome?.trim() || '',
    alu_num_processo: rowObj.alu_num_processo ? Number(rowObj.alu_num_processo) : null,
    alu_numero: rowObj.alu_numero ?? null,
    alu_turma: rowObj.alu_turma?.trim() || null,
    alu_ano: rowObj.alu_ano ? Number(rowObj.alu_ano) : null,
    alu_status: (rowObj.alu_status || 'ativo').toString().toLowerCase().includes('inativ') ? 'inativo' : 'ativo',
  }
  if (o.alu_numero === '') o.alu_numero = null
  if (!o.alu_nome || !o.alu_num_processo || !o.alu_ano) return null
  return o
}
function chunk(arr, size = 200) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/* ---------- export CSV ---------- */
function exportListCSV(rows) {
  const head = ['alu_id', 'alu_nome', 'alu_num_processo', 'alu_numero', 'alu_turma', 'alu_ano', 'alu_status']
  const lines = [head.join(';')]
  rows.forEach((r) =>
    lines.push([
      r.alu_id ?? r.id ?? '',
      r.alu_nome ?? '',
      r.alu_num_processo ?? '',
      r.alu_numero ?? '',
      r.alu_turma ?? '',
      r.alu_ano ?? '',
      r.alu_status ?? '',
    ].join(';'))
  )
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `alunos-export-${new Date().toISOString().slice(0,10)}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ===================================================================== */

export default function Alunos() {
  const { loading, list, filters, setFilters, load, create, update, setStatus, toast, setToast } = useAlunos()

  const [openNew, setOpenNew] = React.useState(false)
  const [editing, setEditing] = React.useState(null)
  const [showFilters, setShowFilters] = React.useState(false)

  // Import
  const [openImport, setOpenImport] = React.useState(false)
  const [fileName, setFileName] = React.useState('')
  const [rowsParsed, setRowsParsed] = React.useState([])
  const [preview, setPreview] = React.useState([])
  const [importing, setImporting] = React.useState(false)
  const [importResult, setImportResult] = React.useState(null)

  // Busca rápida
  const [quick, setQuick] = React.useState('')
  const debouncedQuick = useDebouncedValue(quick, 500)

  // paginação
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize))
  const pageData = React.useMemo(() => {
    const start = (page - 1) * pageSize
    return list.slice(start, start + pageSize)
  }, [list, page, pageSize])

  React.useEffect(() => { load() }, [load])
  React.useEffect(() => { if (page > totalPages) setPage(1) }, [totalPages, page])

  // quick search aplica em nome/num_processo
  React.useEffect(() => {
    if (debouncedQuick === '' && (filters?.nome || filters?.num_processo)) return
    const next = { ...filters, nome: debouncedQuick, num_processo: '' }
    setFilters(next)
    setPage(1)
    load(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuick])

  /* leitura CSV */
  const handleFile = async (file) => {
    setImportResult(null)
    if (!file) return
    setFileName(file.name)
    
    try {
      const text = await file.text()
      const sep = detectSep(text)
      const lines = text.split(/\r?\n/).filter(l => l.trim().length)
      if (lines.length < 2) { 
        setToast({ message: 'Arquivo vazio ou sem dados.', type: 'error' })
        return 
      }
      
      const headers = lines[0].split(sep).map(headerMap)
      const data = []
      const errors = []
      
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep)
        const obj = {}; headers.forEach((h, idx) => (obj[h] = cols[idx] ?? ''))
        const aluno = toAluno(obj)
        if (aluno) {
          data.push(aluno)
        } else {
          errors.push(`Linha ${i + 1}: Dados insuficientes`)
        }
      }
      
      setRowsParsed(data)
      setPreview(data.slice(0, 10))
      
      if (errors.length > 0) {
        setToast({ 
          message: `${errors.length} linhas ignoradas por dados incompletos`, 
          type: 'warning' 
        })
      }
    } catch (error) {
      setToast({ message: 'Erro ao processar arquivo', type: 'error' })
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type === 'text/csv') {
      await handleFile(file)
    } else {
      setToast({ message: 'Por favor, selecione um arquivo CSV', type: 'error' })
    }
  }

  const downloadTemplate = () => {
    const headers = 'alu_nome;alu_num_processo;alu_numero;alu_turma;alu_ano;alu_status'
    const sample = [
      'João Silva;12345;12;9A;9;ativo',
      'Maria Santos;12346;;9B;9;ativo',
      'Pedro Costa;12347;15;9C;9;inativo'
    ].join('\n')
    const blob = new Blob([headers + '\n' + sample], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'modelo_alunos.csv'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setToast({ message: 'Modelo CSV baixado', type: 'success' })
  }

  const startImport = async () => {
    if (!rowsParsed.length) { 
      setToast({ message: 'Escolha um CSV válido antes de importar.', type: 'error' })
      return 
    }
    
    setImporting(true); 
    setImportResult(null)
    let created = 0, updated = 0, ignored = 0, errors = 0
    
    try {
      const packs = chunk(rowsParsed, 200)
      for (const pack of packs) {
        try {
          const r = await api.post('/alunos/bulk', { items: pack })
          const rs = r?.data?.results || r?.data || []
          rs.forEach((x) => {
            if (x?.status === 'created' || x?.created) created++
            else if (x?.status === 'updated' || x?.updated) updated++
            else ignored++
          })
        } catch (e) {
          for (const it of pack) {
            try { 
              await api.post('/alunos', it); 
              created++ 
            } catch (ex) {
              if (String(ex?.response?.status) === '409') {
                try { 
                  await api.put(`/alunos/by-numero-proc/${it.alu_num_processo}`, it); 
                  updated++ 
                } catch { 
                  ignored++ 
                }
              } else { 
                errors++ 
              }
            }
          }
        }
      }
      
      setImportResult({ created, updated, ignored, errors })
      await load()
      setToast({ 
        message: `Importação concluída: +${created} criados • ${updated} atualizados • ${ignored} ignorados • ${errors} erros`,
        type: 'success'
      })
    } catch (error) {
      setToast({ message: 'Erro durante a importação', type: 'error' })
    } finally {
      setImporting(false)
    }
  }

  const clearFilters = () => {
    setFilters({})
    setQuick('')
    load({})
  }

  return (
    <main className="min-h-screen p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* HEADER / TOOLBAR */}
      <header className="rounded-2xl p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 grid place-items-center text-blue-600 dark:text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Gestão de Alunos</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {list.length} alunos registados • Gerencie, filtre e importe via CSV
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                aria-label="Busca rápida por nome"
                className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[280px] transition-all"
                placeholder="Buscar aluno por nome..."
                value={quick}
                onChange={(e) => setQuick(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setOpenImport(true)} 
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Upload size={18} /> Importar
              </button>
              <button 
                onClick={() => setOpenNew(true)} 
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all"
              >
                <PlusCircle size={18} /> Novo Aluno
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* FILTROS */}
      <section className="rounded-2xl p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter size={20} />
            Filtros e Ações
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {showFilters ? <EyeOff size={16} /> : <Eye size={16} />}
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Limpar
            </button>
          </div>
        </div>

        {showFilters && (
          <Formik enableReinitialize initialValues={filters} onSubmit={(v) => { setFilters(v); setPage(1); load(v) }}>
            {({ isSubmitting }) => (
              <Form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Nome</label>
                  <Field 
                    name="nome" 
                    placeholder="Filtrar por nome..."
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Nº Processo</label>
                  <Field 
                    name="num_processo" 
                    type="number" 
                    placeholder="Nº processo"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Número</label>
                  <Field 
                    name="numero" 
                    placeholder="Número do aluno"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Turma</label>
                  <Field 
                    name="turma" 
                    placeholder="Turma"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Ano</label>
                  <Field 
                    name="ano" 
                    type="number" 
                    placeholder="Ano letivo"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</label>
                  <Field 
                    as="select" 
                    name="status" 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos os status</option>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </Field>
                </div>

                <div className="md:col-span-2 lg:col-span-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Registos por página:</span>
                      <select 
                        value={pageSize} 
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
                      >
                        {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total: <b>{list.length}</b> registos
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => exportListCSV(list)}
                    >
                      <Download size={16} /> Exportar CSV
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                      Aplicar Filtros
                    </button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </section>

      {/* LISTA */}
      <section className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
        {loading ? (
          <div className="grid place-items-center p-16">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-600 dark:text-gray-400">A carregar alunos...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl">
              <div className="min-w-full h-[60vh] md:h-[70vh] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr className="text-gray-700 dark:text-gray-300">
                      <th className="px-4 py-3 text-left font-semibold w-[30%]">Aluno</th>
                      <th className="px-4 py-3 text-left font-semibold w-[14%]">Nº Processo</th>
                      <th className="px-4 py-3 text-left font-semibold w-[10%] hidden sm:table-cell">Número</th>
                      <th className="px-4 py-3 text-left font-semibold w-[14%]">Turma</th>
                      <th className="px-4 py-3 text-left font-semibold w-[10%] hidden md:table-cell">Ano</th>
                      <th className="px-4 py-3 text-left font-semibold w-[12%]">Status</th>
                      <th className="px-4 py-3 text-right font-semibold w-[10%]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {pageData.length ? pageData.map((a) => {
                      const id = a.alu_id || a.id || `${a.alu_num_processo}-${a.alu_turma}`
                      const inativo = String(a.alu_status || '').toLowerCase() === 'inativo'
                      return (
                        <tr 
                          key={id} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {a.alu_nome}
                            </div>
                            <div className="text-xs text-gray-500 sm:hidden mt-1">
                              Proc: <b>{a.alu_num_processo}</b> • Nº: <b>{a.alu_numero ?? '-'}</b>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">
                            {a.alu_num_processo}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-gray-600 dark:text-gray-400">
                            {a.alu_numero ?? '-'}
                          </td>
                          <td className="px-4 py-3">
                            {a.alu_turma ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {a.alu_turma}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-gray-600 dark:text-gray-400">
                            {a.alu_ano}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={clsx(
                                'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
                                inativo 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              )}
                            >
                              <span 
                                className={clsx(
                                  'h-2 w-2 rounded-full',
                                  inativo ? 'bg-red-500' : 'bg-green-500'
                                )} 
                              />
                              {inativo ? 'Inativo' : 'Ativo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => setEditing(a)}
                                title="Editar aluno"
                              >
                                <Pencil size={14} />
                                <span className="hidden lg:inline text-xs">Editar</span>
                              </button>
                              <button
                                className={clsx(
                                  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white text-xs transition-colors',
                                  inativo 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : 'bg-red-600 hover:bg-red-700'
                                )}
                                onClick={() => setStatus(id, inativo ? 'ativo' : 'inativo')}
                                title={inativo ? 'Ativar aluno' : 'Desativar aluno'}
                              >
                                {inativo ? <Power size={14} /> : <PowerOff size={14} />}
                                <span className="hidden lg:inline">
                                  {inativo ? 'Ativar' : 'Desativar'}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    }) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center">
                          <div className="text-gray-500 dark:text-gray-400 space-y-2">
                            <Users className="h-12 w-12 mx-auto opacity-50" />
                            <p className="font-medium">Nenhum aluno encontrado</p>
                            <p className="text-sm">Tente ajustar os filtros ou adicionar novos alunos</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginação */}
            {pageData.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando <b>{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, list.length)}</b> de <b>{list.length}</b> registos
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    title="Primeira página"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    title="Página anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={clsx(
                            'min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-colors',
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          )}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    title="Próxima página"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    title="Última página"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* MODAL NOVO ALUNO */}
      <Modal open={openNew} onClose={() => setOpenNew(false)} title="Adicionar Novo Aluno">
        <Formik
          initialValues={{ 
            alu_nome: '', 
            alu_num_processo: '', 
            alu_numero: '', 
            alu_turma: '', 
            alu_ano: new Date().getFullYear(), 
            alu_status: 'ativo' 
          }}
          onSubmit={async (v, { resetForm, setSubmitting }) => {
            try {
              await create({
                alu_nome: v.alu_nome.trim(),
                alu_num_processo: Number(v.alu_num_processo),
                alu_numero: v.alu_numero ? Number(v.alu_numero) : null,
                alu_turma: v.alu_turma.trim() || null,
                alu_ano: Number(v.alu_ano),
                alu_status: v.alu_status
              })
              resetForm()
              setOpenNew(false)
            } catch (error) {
              // Error handling is done in the hook
            } finally {
              setSubmitting(false)
            }
          }}
        >
          {({ isSubmitting, values }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Nome Completo *
                </label>
                <Field 
                  name="alu_nome" 
                  placeholder="Ex: João Silva Santos"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Nº Processo *
                  </label>
                  <Field 
                    name="alu_num_processo" 
                    type="number" 
                    placeholder="Ex: 12345"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Número (opcional)
                  </label>
                  <Field 
                    name="alu_numero" 
                    type="number"
                    placeholder="Ex: 12"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Turma (opcional)
                  </label>
                  <Field 
                    name="alu_turma" 
                    placeholder="Ex: 9A"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Ano Letivo *
                  </label>
                  <Field 
                    name="alu_ano" 
                    type="number"
                    placeholder="Ex: 2024"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <Field as="select" name="alu_status" 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </Field>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setOpenNew(false)}
                  className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !values.alu_nome || !values.alu_num_processo || !values.alu_ano}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Adicionar Aluno'
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* MODAL EDITAR ALUNO */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar Aluno">
        {editing && (
          <Formik
            enableReinitialize
            initialValues={{
              alu_nome: editing.alu_nome || '',
              alu_num_processo: editing.alu_num_processo || '',
              alu_numero: editing.alu_numero || '',
              alu_turma: editing.alu_turma || '',
              alu_ano: editing.alu_ano || '',
              alu_status: editing.alu_status || 'ativo',
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
                })
                setEditing(null)
              } catch (error) {
                // Error handling is done in the hook
              } finally {
                setSubmitting(false)
              }
            }}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Nome Completo *
                  </label>
                  <Field 
                    name="alu_nome" 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Nº Processo *
                    </label>
                    <Field 
                      name="alu_num_processo" 
                      type="number" 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Número (opcional)
                    </label>
                    <Field 
                      name="alu_numero" 
                      type="number"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Turma (opcional)
                    </label>
                    <Field 
                      name="alu_turma" 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Ano Letivo *
                    </label>
                    <Field 
                      name="alu_ano" 
                      type="number"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <Field as="select" name="alu_status" 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </Field>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !values.alu_nome || !values.alu_num_processo || !values.alu_ano}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Guardar Alterações'
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </Modal>

      {/* MODAL IMPORTAR CSV */}
      <Modal open={openImport} onClose={() => setOpenImport(false)} title="Importar Alunos via CSV" size="lg">
        <div className="space-y-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              Importe uma lista de alunos através de um ficheiro CSV. O sistema deteta automaticamente 
              o formato e mapeia os cabeçalhos.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Formato Suportado:
              </h4>
              <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                alu_nome;alu_num_processo;alu_numero;alu_turma;alu_ano;alu_status
              </code>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Também aceita: <i>nome, num_processo, numero, turma, ano, status</i> e equivalentes em inglês
              </p>
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              e.currentTarget.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20')
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.currentTarget.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20')
            }}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center transition-all hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10"
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Arraste o ficheiro CSV para aqui
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-4">ou</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 cursor-pointer transition-colors">
                <Upload size={18} /> Procurar CSV
                <input 
                  type="file" 
                  accept=".csv,text/csv" 
                  className="hidden" 
                  onChange={(e) => handleFile(e.target.files?.[0])} 
                />
              </label>
              <button 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                onClick={downloadTemplate}
              >
                <FileDown size={18} /> Descarregar Modelo
              </button>
            </div>
            {fileName && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-300">
                  <b>Ficheiro selecionado:</b> {fileName}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {rowsParsed.length} registos detetados
                </p>
              </div>
            )}
          </div>

          {preview.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Pré-visualização ({preview.length} de {rowsParsed.length} registos)
                </h4>
              </div>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white dark:bg-gray-900 sticky top-0">
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Processo
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nº
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Turma
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ano
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {preview.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-3 py-2 text-sm">{r.alu_nome}</td>
                        <td className="px-3 py-2 text-sm font-mono">{r.alu_num_processo}</td>
                        <td className="px-3 py-2 text-sm">{r.alu_numero ?? '-'}</td>
                        <td className="px-3 py-2 text-sm">{r.alu_turma ?? '-'}</td>
                        <td className="px-3 py-2 text-sm">{r.alu_ano}</td>
                        <td className="px-3 py-2 text-sm">
                          <span className={clsx(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                            r.alu_status === 'inativo'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          )}>
                            {r.alu_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importResult && (
            <div className={clsx(
              'rounded-xl p-4 border',
              importResult.errors > 0 
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            )}>
              <h4 className="font-medium mb-2">Resultado da Importação:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{importResult.created}</div>
                  <div className="text-gray-600 dark:text-gray-400">Criados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{importResult.updated}</div>
                  <div className="text-gray-600 dark:text-gray-400">Atualizados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{importResult.ignored}</div>
                  <div className="text-gray-600 dark:text-gray-400">Ignorados</div>
                </div>
                <div className="text-center">
                  <div className={clsx(
                    'text-2xl font-bold',
                    importResult.errors > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                  )}>
                    {importResult.errors}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Erros</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {rowsParsed.length > 0 && (
                <span>
                  Pronto para importar <b>{rowsParsed.length}</b> registos
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setOpenImport(false)
                  setFileName('')
                  setRowsParsed([])
                  setPreview([])
                  setImportResult(null)
                }}
                className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={!rowsParsed.length || importing}
                onClick={startImport}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {importing ? 'A Importar...' : 'Iniciar Importação'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      {toast && (
        <div
          role="status"
          className={clsx(
            'fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-lg border transform animate-slide-in-right',
            toast.type === 'error' 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              : toast.type === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex-1">
              {toast.message}
            </div>
            <button 
              onClick={() => setToast(null)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Fechar notificação"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </main>
  )
}