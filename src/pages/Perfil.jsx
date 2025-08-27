"use client"

import { useEffect, useMemo, useState } from "react"
import {
  User, Mail, Shield, CheckCircle, AlertCircle, LogOut, Copy, Check, Info, KeyRound, Calendar,
  Timer, Eye, X, Download
} from "lucide-react"
import { jwtDecode } from "jwt-decode"

/* ---------- helpers ---------- */
const safeDecode = (token) => {
  try { return jwtDecode(token) } catch { return null }
}
const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("") || "?"

const formatDt = (sec) => {
  if (!sec) return "—"
  try { return new Date(sec * 1000).toLocaleString() } catch { return "—" }
}

const TEMPLATE_LABELS = {
  // personalize aqui conforme seu backend
  manage_category: "Gerir Categorias",
  view_categories: "Ver Categorias",
  create_category: "Criar Categoria",
  edit_category: "Editar Categoria",
  delete_category: "Excluir Categoria",
  manage_type: "Gerir Tipos",
  manage_material: "Gerir Materiais",
  create_requisicao: "Criar Requisição",
  decide_requisicao: "Decidir Requisição",
  reports_export: "Exportar Relatórios",
}

/* ---------- UI bits ---------- */
function Toast({ msg, onClose }) {
  if (!msg) return null
  return (
    <div className="fixed bottom-6 right-6 z-50" role="status" aria-live="polite">
      <div className="flex items-start gap-3 rounded-xl bg-gray-900 text-white px-4 py-3 shadow-xl">
        <CheckCircle className="mt-0.5 text-emerald-400" aria-hidden />
        <div className="text-sm">{msg}</div>
        <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100" aria-label="Fechar notificação">✕</button>
      </div>
    </div>
  )
}

function Modal({ open, title, onClose, children, footer }) {
  const titleId = "modal-" + title
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === "Escape" && onClose?.()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 id={titleId} className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Fechar modal">
              <X size={18} />
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

/* ---------- avatar ---------- */
function Avatar({ name }) {
  return (
    <div
      className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white grid place-items-center text-2xl font-semibold shadow"
      aria-hidden
    >
      {initials(name)}
    </div>
  )
}

/* ---------- badge ---------- */
function RoleBadge({ role }) {
  const styles = {
    admin: "bg-indigo-100 text-indigo-800",
    funcionario: "bg-gray-100 text-gray-800",
    professor: "bg-purple-100 text-purple-800",
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[role] || "bg-gray-100 text-gray-700"}`}>
      <Shield className="h-3.5 w-3.5" /> {role || "—"}
    </span>
  )
}

/* ---------- main page ---------- */
export default function Perfil() {
  const [perfil, setPerfil] = useState({
    nome: "—",
    email: "—",
    tipo: "—",
    roles: [],
    templates: [],
    iat: null,
    exp: null,
  })
  const [erro, setErro] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState("")
  const [tokenModal, setTokenModal] = useState(false)

  useEffect(() => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Sessão não encontrada. Faça login novamente.")
      const d = safeDecode(token)
      if (!d) throw new Error("Token inválido ou corrompido.")
      const emailFallback = localStorage.getItem("user_email") || "—"
      const nome = d.user_nome || d.nome || d.name || "—"
      const email = d.user_email || d.email || emailFallback
      const roles = Array.isArray(d.roles) && d.roles.length ? d.roles : (d.user_tipo ? [d.user_tipo] : [])
      const templates = Array.isArray(d.templates) ? d.templates : []
      setPerfil({
        nome,
        email,
        tipo: roles[0] || "—",
        roles,
        templates,
        iat: d.iat ?? null,
        exp: d.exp ?? null,
        _raw: d,
      })
    } catch (e) {
      setErro(e.message || "Não foi possível ler seu perfil.")
    } finally {
      setLoading(false)
    }
  }, [])

  const sessionState = useMemo(() => {
    if (!perfil.exp) return { expired: false, left: null, pct: null }
    const now = Date.now() / 1000
    const total = perfil.exp - (perfil.iat || perfil.exp - 1)
    const left = Math.max(0, perfil.exp - now)
    const pct = total > 0 ? Math.min(100, Math.max(0, (left / total) * 100)) : null
    return { expired: left <= 0, left, pct }
  }, [perfil.exp, perfil.iat])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(perfil.email || "")
      setToast("Email copiado.")
      setTimeout(() => setToast(""), 1500)
    } catch {
      setToast("Falha ao copiar.")
      setTimeout(() => setToast(""), 1500)
    }
  }

  const downloadTokenJson = () => {
    try {
      const blob = new Blob([JSON.stringify(perfil._raw ?? {}, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "token_payload.json"
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* empty */ }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user_email")
    setToast("Sessão encerrada.")
    setTimeout(() => { window.location.href = "/login" }, 600)
  }

  // agrupar templates por código
  const groupedTemplates = useMemo(() => {
    const arr = Array.isArray(perfil.templates) ? perfil.templates : []
    const norm = arr.map(t => {
      if (typeof t === "string") return { template_code: t }
      return t || {}
    })
    const map = new Map()
    for (const t of norm) {
      const key = t.template_code || "desconhecido"
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
    }
    return Array.from(map.entries()).map(([code, items]) => ({ code, items }))
  }, [perfil.templates])

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <section className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={perfil.nome} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-gray-900">Perfil</h1>
                <button
                  onClick={() => setTokenModal(true)}
                  className="inline-flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 text-sm"
                >
                  <Info className="h-4 w-4" /> Detalhes do token
                </button>
              </div>
              <p className="text-gray-600">Informações da sua conta e permissões</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {perfil.roles?.length ? perfil.roles.map((r, i) => <RoleBadge key={i} role={r} />) : <RoleBadge role={perfil.tipo} />}
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div
            className="rounded-xl p-3 bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2"
            role="alert" aria-live="assertive"
          >
            <AlertCircle aria-hidden /> {erro}
          </div>
        )}

        {/* Conteúdo */}
        {!erro && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* card info */}
            <div className="lg:col-span-2 rounded-2xl p-6 bg-white border border-gray-200 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Informações pessoais</h2>

              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border bg-white">
                    <div className="text-gray-500 text-sm">Nome</div>
                    <div className="font-medium text-gray-900">{perfil.nome}</div>
                  </div>
                  <div className="p-4 rounded-xl border bg-white">
                    <div className="text-gray-500 text-sm flex items-center gap-1">
                      <Mail className="h-4 w-4" aria-hidden /> Email
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 break-all">{perfil.email}</span>
                      <button
                        onClick={copyEmail}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs text-gray-700 hover:bg-gray-50"
                        aria-label="Copiar e-mail"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copiar
                      </button>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border bg-white">
                    <div className="text-gray-500 text-sm">Tipo</div>
                    <div className="font-medium text-gray-900">{perfil.tipo}</div>
                  </div>
                  <div className="p-4 rounded-xl border bg-white">
                    <div className="text-gray-500 text-sm flex items-center gap-1">
                      <KeyRound className="h-4 w-4" aria-hidden /> Sessão
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4" aria-hidden /> Emitido: <b className="ml-1">{formatDt(perfil.iat)}</b>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Timer className="h-4 w-4" aria-hidden /> Expira: <b className="ml-1">{formatDt(perfil.exp)}</b>
                      </div>
                      {perfil.exp && (
                        <div className="mt-2">
                          <div className="h-2 bg-gray-100 rounded-full">
                            <div
                              className={`h-2 rounded-full ${sessionState.expired ? "bg-rose-400" : "bg-emerald-500"}`}
                              style={{ width: `${sessionState.pct ?? 0}%` }}
                              aria-label="Tempo restante da sessão"
                            />
                          </div>
                          <p className={`mt-1 text-xs ${sessionState.expired ? "text-rose-600" : "text-gray-500"}`}>
                            {sessionState.expired ? "Sessão expirada" : "Tempo restante aproximado"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* card perms */}
            <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-600" aria-hidden /> Permissões
              </h2>

              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              ) : perfil.templates?.length ? (
                <div className="space-y-3">
                  {groupedTemplates.map(({ code, items }) => {
                    const label = TEMPLATE_LABELS[code] || code
                    const hasResources = items.some(i => i?.resource_id != null)
                    return (
                      <div key={code} className="rounded-xl border p-3 bg-white">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600" aria-hidden />
                          <span className="text-sm font-medium text-gray-900">{label}</span>
                          <span className="ml-auto text-xs text-gray-500">{items.length} vínculo(s)</span>
                        </div>
                        {hasResources && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {items.filter(i => i?.resource_id != null).map((i, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-800"
                              >
                                recurso #{i.resource_id}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Nenhum template associado.</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTokenModal(true)}
                  className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 inline-flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" /> Ver payload
                </button>
                <button
                  onClick={downloadTokenJson}
                  className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 inline-flex items-center gap-2"
                >
                  <Download className="h-4 w-4" /> Baixar JSON
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Modal token */}
      <Modal
        open={tokenModal}
        onClose={() => setTokenModal(false)}
        title="Detalhes do token (JWT)"
        footer={
          <div className="flex justify-end">
            <button onClick={() => setTokenModal(false)} className="px-4 py-2 rounded-lg border">Fechar</button>
          </div>
        }
      >
        <div className="text-sm text-gray-700">
          <p className="mb-2">
            Estes dados são decodificados do seu token armazenado no navegador. <b>Não</b> incluem a assinatura.
          </p>
          <pre className="overflow-auto text-xs bg-gray-50 border rounded-lg p-3 max-h-80">
{JSON.stringify(perfil._raw ?? {}, null, 2)}
          </pre>
        </div>
      </Modal>

      <Toast msg={toast} onClose={() => setToast("")} />
    </main>
  )
}
