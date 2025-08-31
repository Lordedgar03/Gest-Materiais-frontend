"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { jwtDecode } from "jwt-decode"
import {
  UserCircle2, Camera, Loader2, Mail, Shield, Lock, CheckCircle2, XCircle, RefreshCw
} from "lucide-react"
import api from "../api"

// Utilitário: lê user_id / nome / roles / templates do token e localStorage
function readSession() {
  const token = localStorage.getItem("token")
  let claims = { user_id: null, user_nome: "Utilizador", roles: [], templates: [] }
  if (token) {
    try {
      const d = jwtDecode(token)
      claims.user_id = d?.user_id ?? null
      claims.user_nome = d?.user_nome ?? localStorage.getItem("user_nome") ?? "Utilizador"
      claims.roles = Array.isArray(d?.roles) ? d.roles : JSON.parse(localStorage.getItem("roles") || "[]")
      claims.templates = Array.isArray(d?.templates) ? d.templates : JSON.parse(localStorage.getItem("templates") || "[]")
    } catch {
      // fallback ao localStorage
      claims.user_nome = localStorage.getItem("user_nome") || "Utilizador"
      try { claims.roles = JSON.parse(localStorage.getItem("roles") || "[]") } catch { /* empty */}
      try { claims.templates = JSON.parse(localStorage.getItem("templates") || "[]") } catch { /* empty */}
    }
  } else {
    claims.user_nome = localStorage.getItem("user_nome") || "Utilizador"
    try { claims.roles = JSON.parse(localStorage.getItem("roles") || "[]") } catch { /* empty */ }
    try { claims.templates = JSON.parse(localStorage.getItem("templates") || "[]") } catch { /* empty */}
  }
  return claims
}

const prettyRole = (roles = []) => {
  if (!Array.isArray(roles)) return "Utilizador"
  if (roles.includes("admin")) return "Administrador"
  if (roles.includes("professor")) return "Professor"
  if (roles.includes("funcionario")) return "Funcionário"
  return roles[0] ? roles[0][0].toUpperCase() + roles[0].slice(1) : "Utilizador"
}

export default function Perfil() {
  const { user_id, user_nome, roles, templates } = useMemo(readSession, [])
  const [nome, setNome] = useState(user_nome || "")
  const [email, setEmail] = useState("")
  const [avatar, setAvatar] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [reloading, setReloading] = useState(false)

  const fileInputRef = useRef(null)
  const isAdmin = Array.isArray(roles) && roles.includes("admin")

  // carrega dados completos atuais
  useEffect(() => {
    let active = true
    const fetchMe = async () => {
      if (!user_id) { setLoading(false); setError("Sessão inválida."); return }
      setError("")
      try {
        const { data } = await api.get(`/users/${user_id}`)
        // backend retorna { ...user, templates: [...] }
        if (!active) return
        setNome(data?.user_nome || user_nome || "")
        setEmail(data?.user_email || "")
        setAvatar(data?.avatar_url || "")
      } catch (e) {
        if (!active) return
        setError(e?.response?.data?.message || e?.message || "Falha ao carregar perfil.")
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchMe()
    return () => { active = false }
  }, [user_id, user_nome])

  const handleAvatarPick = () => fileInputRef.current?.click()

  const handleAvatarUpload = async (ev) => {
    const file = ev.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Selecione um ficheiro de imagem.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Imagem até 5MB.")
      return
    }
    setError("")
    setSuccess("")
    setUploading(true)
    try {
      // Se o teu backend não tiver /upload-avatar, podes remover esta parte
      const fd = new FormData()
      fd.append("file", file)
      const { data } = await api.post("/upload-avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      if (!data?.url) throw new Error("Resposta inválida do upload.")
      setAvatar(data.url)
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Falha ao enviar imagem.")
    } finally {
      setUploading(false)
      ev.target.value = ""
    }
  }

  const resetForm = () => {
    setReloading(true)
    setError("")
    setSuccess("")
    // recarrega do servidor
    api.get(`/users/${user_id}`)
      .then(({ data }) => {
        setNome(data?.user_nome || user_nome || "")
        setEmail(data?.user_email || "")
        setAvatar(data?.avatar_url || "")
        setNewPwd("")
        setConfirmPwd("")
      })
      .catch((e) => setError(e?.response?.data?.message || e?.message || "Falha ao recarregar dados."))
      .finally(() => setReloading(false))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (newPwd && newPwd.length < 6) {
      setError("A nova palavra-passe deve ter pelo menos 6 caracteres.")
      return
    }
    if (newPwd && newPwd !== confirmPwd) {
      setError("Confirmação de palavra-passe não coincide.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        user_nome: nome?.trim() || undefined,
        user_email: email?.trim() || undefined,
        avatar_url: avatar || undefined,
        ...(newPwd ? { user_senha: newPwd } : {})
      }
      await api.put(`/users/${user_id}`, payload) // permitido para o próprio utilizador
      // atualiza nome local e notifica o app (Header, Sidebar…)
      if (payload.user_nome) {
        localStorage.setItem("user_nome", payload.user_nome)
        window.dispatchEvent(new Event("auth:changed"))
      }
      setNewPwd("")
      setConfirmPwd("")
      setSuccess("Perfil atualizado com sucesso.")
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Não foi possível atualizar o perfil.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950">
      <div className=" mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meu Perfil</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Atualize as suas informações pessoais e credenciais</p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start">
          {/* Cartão Avatar / Tipo */}
          <section className="rounded-xl bg-white/90 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Foto do perfil"
                    className="h-28 w-28 rounded-full object-cover border-2 border-white shadow"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-2xl font-semibold border-2 border-white shadow">
                    {(nome || "U").split(" ").map(p => p[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAvatarPick}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 border-2 border-white shadow disabled:opacity-60"
                  title="Alterar foto"
                  aria-label="Alterar foto do perfil"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div className="mt-4">
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{nome || "Utilizador"}</div>
                <div className="mt-1 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Shield className="h-4 w-4" />
                  <span>{prettyRole(roles)}</span>
                </div>
              </div>

              {/* Permissões (resumo) */}
              <div className="mt-4 w-full">
                <div className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Permissões (resumo)</div>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(templates) ? templates : []).slice(0, 6).map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] text-gray-700 dark:text-gray-200">
                      {t?.template_code || "—"}
                    </span>
                  ))}
                  {Array.isArray(templates) && templates.length === 0 && (
                    <span className="text-xs text-gray-500">Sem registos</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Formulário */}
          <section className="rounded-xl bg-white/90 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 p-5">
            {loading ? (
              <div className="py-16 flex items-center justify-center text-gray-600 dark:text-gray-300">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> A carregar…
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6" aria-describedby="perfil-status">
                {/* Mensagens */}
                <div id="perfil-status" className="sr-only" aria-live="polite">
                  {saving ? "A guardar alterações…" : (success || error ? "Alterações processadas." : "Pronto.")}
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <XCircle className="h-5 w-5 mt-0.5" />
                    <div>{error}</div>
                  </div>
                )}
                {success && (
                  <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <CheckCircle2 className="h-5 w-5 mt-0.5" />
                    <div>{success}</div>
                  </div>
                )}

                {/* Identificação */}
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Informações pessoais</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Estas informações identificam a sua conta.</p>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nome</label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e)=>setNome(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Seu nome"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e)=>setEmail(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Segurança */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Segurança</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Defina uma nova palavra-passe (opcional).</p>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nova palavra-passe</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
                        <input
                          type="password"
                          value={newPwd}
                          onChange={(e)=>setNewPwd(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Deixe em branco para manter"
                          minLength={6}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Confirmar palavra-passe</label>
                      <input
                        type="password"
                        value={confirmPwd}
                        onChange={(e)=>setConfirmPwd(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Repita a nova palavra-passe"
                        minLength={6}
                      />
                      {!!newPwd && !!confirmPwd && newPwd !== confirmPwd && (
                        <p className="text-[11px] text-red-600 mt-1">As palavras-passe não coincidem.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Guardar alterações
                  </button>
                  <button
                    type="button"
                    disabled={reloading || loading}
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-60"
                  >
                    <RefreshCw className={`h-4 w-4 ${reloading ? "animate-spin" : ""}`} />
                    Recarregar
                  </button>
                </div>

                {/* Info admin somente leitura */}
                <div className="pt-4 text-xs text-gray-500 dark:text-gray-400">
                  Tipo de utilizador: <strong className="text-gray-700 dark:text-gray-300">{prettyRole(roles)}</strong>
                  {isAdmin && <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">admin</span>}
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
