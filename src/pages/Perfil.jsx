/* eslint-disable no-unused-vars */
// src/pages/Perfil.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import {
  Camera,
  Loader2,
  Mail,
  Shield,
  Lock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import api from "../api";

/* =================== sessão =================== */
function readSession() {
  const token = localStorage.getItem("token");
  let claims = { user_id: null, user_nome: "Utilizador", roles: [], templates: [] };
  if (token) {
    try {
      const d = jwtDecode(token);
      claims.user_id = d?.user_id ?? null;
      claims.user_nome = d?.user_nome ?? localStorage.getItem("user_nome") ?? "Utilizador";
      claims.roles = Array.isArray(d?.roles) ? d.roles : JSON.parse(localStorage.getItem("roles") || "[]");
      claims.templates = Array.isArray(d?.templates) ? d.templates : JSON.parse(localStorage.getItem("templates") || "[]");
    } catch {
      claims.user_nome = localStorage.getItem("user_nome") || "Utilizador";
      try { claims.roles = JSON.parse(localStorage.getItem("roles") || "[]"); } catch {}
      try { claims.templates = JSON.parse(localStorage.getItem("templates") || "[]"); } catch {}
    }
  } else {
    claims.user_nome = localStorage.getItem("user_nome") || "Utilizador";
    try { claims.roles = JSON.parse(localStorage.getItem("roles") || "[]"); } catch {}
    try { claims.templates = JSON.parse(localStorage.getItem("templates") || "[]"); } catch {}
  }
  return claims;
}

const prettyRole = (roles = []) => {
  if (!Array.isArray(roles)) return "Utilizador";
  if (roles.includes("admin")) return "Administrador";
  if (roles.includes("professor")) return "Professor";
  if (roles.includes("funcionario")) return "Funcionário";
  return roles[0] ? roles[0][0].toUpperCase() + roles[0].slice(1) : "Utilizador";
};

/* =================== página =================== */
export default function Perfil() {
  const session = useMemo(readSession, []);
  const [nome, setNome] = useState(session.user_nome || "");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [roles, setRoles] = useState(session.roles || []);
  const [templates, setTemplates] = useState(session.templates || []);

  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloading, setReloading] = useState(false);

  const fileInputRef = useRef(null);
  const isAdmin = Array.isArray(roles) && roles.includes("admin");

  const applyNewToken = (token) => {
    if (!token) return;
    localStorage.setItem("token", token);
    try {
      const d = jwtDecode(token);
      if (d?.user_nome) {
        localStorage.setItem("user_nome", d.user_nome);
        setNome(d.user_nome);
      }
      if (Array.isArray(d?.roles)) {
        localStorage.setItem("roles", JSON.stringify(d.roles));
        setRoles(d.roles);
      }
      if (Array.isArray(d?.templates)) {
        localStorage.setItem("templates", JSON.stringify(d.templates));
        setTemplates(d.templates);
      }
      window.dispatchEvent(new Event("auth:changed"));
    } catch {
      // ok
    }
  };

  /* carregar perfil */
  useEffect(() => {
    let active = true;
    const fetchMe = async () => {
      setError("");
      try {
        const { data } = await api.get("/profile");
        if (!active) return;
        setNome(data?.user_nome || session.user_nome || "");
        setEmail(data?.user_email || "");
        setAvatar(data?.avatar_url || "");
        if (Array.isArray(data?.roles)) setRoles(data.roles);
        if (Array.isArray(data?.templates)) setTemplates(data.templates);
      } catch (e) {
        if (!active) return;
        setError(e?.response?.data?.message || e?.message || "Falha ao carregar perfil.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchMe();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* avatar */
  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarUpload = async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecione um ficheiro de imagem.");
      ev.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Imagem até 5MB.");
      ev.target.value = "";
      return;
    }
    setError("");
    setSuccess("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload-avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!data?.url) throw new Error("Resposta inválida do upload.");
      setAvatar(data.url);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Falha ao enviar imagem.");
    } finally {
      setUploading(false);
      ev.target.value = "";
    }
  };

  const removeAvatar = () => {
    setAvatar("");
  };

  const resetForm = () => {
    setReloading(true);
    setError("");
    setSuccess("");
    api
      .get("/profile")
      .then(({ data }) => {
        setNome(data?.user_nome || session.user_nome || "");
        setEmail(data?.user_email || "");
        setAvatar(data?.avatar_url || "");
        if (Array.isArray(data?.roles)) setRoles(data.roles);
        if (Array.isArray(data?.templates)) setTemplates(data.templates);
        setNewPwd("");
        setConfirmPwd("");
      })
      .catch((e) =>
        setError(e?.response?.data?.message || e?.message || "Falha ao recarregar dados.")
      )
      .finally(() => setReloading(false));
  };

  /* submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPwd && newPwd.length < 6) {
      setError("A nova palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPwd && newPwd !== confirmPwd) {
      setError("Confirmação de palavra-passe não coincide.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_nome: nome?.trim() || undefined,
        user_email: email?.trim() || undefined,
        avatar_url: avatar || undefined,
        ...(newPwd ? { user_senha: newPwd } : {}),
      };
      const { data } = await api.put("/profile", payload);
      if (data?.token) applyNewToken(data.token);

      if (payload.user_nome) {
        localStorage.setItem("user_nome", payload.user_nome);
        window.dispatchEvent(new Event("auth:changed"));
      }
      setNewPwd("");
      setConfirmPwd("");
      setSuccess("Perfil atualizado com sucesso.");
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Não foi possível atualizar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  /* skeleton simples */
  const Skeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-10 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-10 rounded bg-gray-200 dark:bg-gray-800" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-10 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-10 rounded bg-gray-200 dark:bg-gray-800" />
      </div>
      <div className="h-10 w-56 rounded bg-gray-200 dark:bg-gray-800" />
    </div>
  );

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Cabeçalho */}
      <header className="mx-auto  px-4 pt-4 pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-white shadow">
              <UserIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Atualize as suas informações pessoais e credenciais
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={reloading || loading}
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${reloading ? "animate-spin" : ""}`} />
              Recarregar
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="mx-auto px-4 pb-4">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Cartão avatar/roles */}
          <aside className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 backdrop-blur p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Foto do perfil"
                    className="h-28 w-28 rounded-full object-cover ring-2 ring-white dark:ring-gray-900 shadow"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-2xl font-semibold ring-2 ring-white dark:ring-gray-900 shadow">
                    {(nome || "U")
                      .split(" ")
                      .filter(Boolean)
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}

                {/* ações avatar */}
                <div className="absolute -bottom-2 right-0 flex gap-1">
                  <button
                    type="button"
                    onClick={handleAvatarPick}
                    disabled={uploading}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-white dark:ring-gray-900 shadow disabled:opacity-60"
                    title="Alterar foto"
                    aria-label="Alterar foto do perfil"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </button>
                  {avatar && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 ring-2 ring-white dark:ring-gray-900 shadow"
                      title="Remover foto"
                      aria-label="Remover foto do perfil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div className="mt-4">
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {nome || "Utilizador"}
                </div>
                <div className="mt-1 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Shield className="h-4 w-4" />
                  <span>{prettyRole(roles)}</span>
                  {isAdmin && (
                    <span className="ml-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-0.5 text-xs">
                      admin
                    </span>
                  )}
                </div>
              </div>

              {/* Permissões (resumo) */}
              <div className="mt-5 w-full">
                <div className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Permissões (resumo)
                </div>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(templates) ? templates : []).slice(0, 8).map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] text-gray-700 dark:text-gray-200"
                    >
                      {t?.template_code || "—"}
                    </span>
                  ))}
                  {Array.isArray(templates) && templates.length === 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Sem registos</span>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Formulário */}
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 backdrop-blur p-6">
            {loading ? (
              <Skeleton />
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6" aria-describedby="perfil-status">
                {/* status aria-live */}
                <div id="perfil-status" className="sr-only" aria-live="polite">
                  {saving ? "A guardar alterações…" : success ? "Perfil atualizado." : error ? "Ocorreu um erro." : "Pronto."}
                </div>

                {/* alerts */}
                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
                    <XCircle className="h-5 w-5 mt-0.5" />
                    <div>{error}</div>
                  </div>
                )}
                {success && (
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="h-5 w-5 mt-0.5" />
                    <div>{success}</div>
                  </div>
                )}

                {/* identificação */}
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Informações pessoais
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Estas informações identificam a sua conta.
                  </p>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="inp-nome" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Nome
                      </label>
                      <input
                        id="inp-nome"
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Seu nome"
                      />
                    </div>
                    <div>
                      <label htmlFor="inp-email" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
                        <input
                          id="inp-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* segurança */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Segurança</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Defina uma nova palavra-passe (opcional).</p>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="inp-npwd" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Nova palavra-passe
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
                        <input
                          id="inp-npwd"
                          type="password"
                          value={newPwd}
                          onChange={(e) => setNewPwd(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Deixe em branco para manter"
                          minLength={6}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="inp-cpwd" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Confirmar palavra-passe
                      </label>
                      <input
                        id="inp-cpwd"
                        type="password"
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
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

                {/* ações */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Guardar alterações
                  </button>
                  <button
                    type="button"
                    disabled={reloading || loading}
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 disabled:opacity-60"
                  >
                    <RefreshCw className={`h-4 w-4 ${reloading ? "animate-spin" : ""}`} />
                    Recarregar
                  </button>
                </div>

                {/* info do papel */}
                <div className="pt-2 text-xs text-gray-500 dark:text-gray-400">
                  Tipo de utilizador:{" "}
                  <strong className="text-gray-700 dark:text-gray-300">{prettyRole(roles)}</strong>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
