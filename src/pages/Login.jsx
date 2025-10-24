"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useLogin from "../hooks/useLogin";

/* ==================== Rotas por capacidade ==================== */
const COMMON_ORDER = [
  "venda:visualizar",
  "materiais:visualizar",
  "requisicoes:visualizar",
  "movimentacoes:visualizar",
  "categorias:visualizar",
  "tipos:visualizar",
  "utilizador:visualizar",
  "ajuda:visualizar",
];
const ADMIN_FIRST = ["dashboard:visualizar", "relatorios:visualizar", "recibo:visualizar"];

const CAP_TO_PATH = {
  "dashboard:visualizar": "/dashboard",
  "relatorios:visualizar": "/relatorios",
  "recibo:visualizar": "/relatorios", // ajuste para /recibos caso exista
  "venda:visualizar": "/vendas",
  "materiais:visualizar": "/materiais",
  "requisicoes:visualizar": "/requisicoes",
  "movimentacoes:visualizar": "/movimentos",
  "categorias:visualizar": "/categorias",
  "tipos:visualizar": "/tipos",
  "utilizador:visualizar": "/utilizadores",
  "ajuda:visualizar": "/ajuda",
};

function getFirstAllowedPath(caps = [], roles = []) {
  const set = new Set(caps);
  const order = roles.includes("admin") ? [...ADMIN_FIRST, ...COMMON_ORDER] : COMMON_ORDER;
  for (const cap of order) {
    if (set.has(cap)) return CAP_TO_PATH[cap];
  }
  return "/ajuda"; // fallback seguro
}

/* ==================== Componente ==================== */
export default function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const { login, isLoading, erro } = useLogin();
  const navigate = useNavigate();

  const emailInputRef = useRef(null);
  const errorRef = useRef(null);
  const pwdInputId = "login-password-input";

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (erro) {
      // move o foco para a mensagem de erro (a11y)
      setTimeout(() => errorRef.current?.focus(), 0);
    }
  }, [erro]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { ok, caps } = await login(email, senha);
    if (!ok) return;

    setIsAuthenticated?.(true);
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");
    const capsArr = caps || JSON.parse(localStorage.getItem("caps") || "[]");
    const destination = getFirstAllowedPath(capsArr, roles);
    navigate(destination, { replace: true });
  };

  return (
    <main
      className="
        min-h-screen w-full
        bg-[radial-gradient(1200px_600px_at_0%_-10%,rgba(99,102,241,0.16),transparent),radial-gradient(900px_450px_at_100%_0%,rgba(59,130,246,0.12),transparent)]
        dark:bg-[radial-gradient(1200px_600px_at_0%_-10%,rgba(99,102,241,0.22),transparent),radial-gradient(900px_450px_at_100%_0%,rgba(59,130,246,0.18),transparent)]
        grid lg:grid-cols-2
      "
    >
      {/* Painel visual / branding */}
      <section
        className="
          relative hidden lg:flex items-center justify-center overflow-hidden
          bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800
        "
        aria-hidden="true"
      >
        {/* Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="size-full bg-[url('/grid.svg')] bg-center" />
        </div>

        {/* Glow */}
        <div className="absolute -top-24 -left-24 size-[500px] rounded-full blur-3xl bg-indigo-600/20" />
        <div className="absolute -bottom-24 -right-24 size-[500px] rounded-full blur-3xl bg-blue-500/20" />

        {/* Conteúdo */}
        <div className="relative text-center text-white px-12 max-w-lg">
          <img
            src="/info11.png"
            alt="Logótipo"
            className="mx-auto h-20 w-auto mb-6 opacity-95 select-none"
          />
          <h1 className="text-3xl font-semibold tracking-tight">Gestão de Materiais</h1>
          <p className="mt-2 text-sm text-white/75">
            Plataforma rápida, segura e responsiva para o seu dia a dia.
          </p>

          <div className="mt-8 inline-flex items-center gap-2 text-white/85 text-sm bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
            <ShieldCheck size={16} aria-hidden="true" />
            Sessão protegida por JWT
          </div>
        </div>
      </section>

      {/* Painel de autenticação */}
      <section className="flex items-center justify-center p-2 sm:p-2">
        <div
          className="
            w-full max-w-sm
            rounded-2xl border border-slate-200/70 bg-white/80 shadow-xl backdrop-blur
            dark:border-slate-800 dark:bg-slate-900/70
          "
          role="region"
          aria-label="Formulário de autenticação"
        >
          <header className="px-6 pt-6">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <KeyRound size={20} aria-hidden="true" />
            </div>
            <h2 id="login-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Entrar
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Use as suas credenciais para aceder ao sistema.
            </p>

            {/* status para leitores de ecrã */}
            <p className="sr-only" role="status" aria-live="polite">
              {isLoading ? "A autenticar…" : "Formulário pronto."}
            </p>
          </header>

          <form onSubmit={handleSubmit} noValidate className="p-6 pt-4">
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                    aria-hidden="true"
                  />
                  <input
                    id="login-email"
                    ref={emailInputRef}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    placeholder="email@exemplo.com"
                    className="
                      w-full rounded-lg border border-slate-300 bg-white/80 pl-10 pr-3 py-2.5
                      text-slate-900 placeholder:text-slate-400
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                      dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100
                    "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    aria-invalid={!!erro}
                  />
                </div>
              </div>

              {/* Palavra-passe */}
              <div>
                <label
                  htmlFor={pwdInputId}
                  className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Palavra-passe
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                    aria-hidden="true"
                  />
                  <input
                    id={pwdInputId}
                    name="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="
                      w-full rounded-lg border border-slate-300 bg-white/80 pl-10 pr-10 py-2.5
                      text-slate-900 placeholder:text-slate-400
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                      dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100
                    "
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    onKeyUp={(e) =>
                      setCapsLockOn(e.getModifierState && e.getModifierState("CapsLock"))
                    }
                    required
                    disabled={isLoading}
                    aria-invalid={!!erro}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="
                      absolute right-2 top-1/2 -translate-y-1/2 rounded p-1
                      text-slate-600 hover:text-slate-800
                      dark:text-slate-300 dark:hover:text-slate-100
                      focus:outline-none focus:ring-2 focus:ring-indigo-500
                    "
                    aria-label={showPwd ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                    aria-pressed={showPwd}
                    aria-controls={pwdInputId}
                  >
                    {showPwd ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>

                {capsLockOn && (
                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">Caps Lock ativado</p>
                )}
              </div>

              {/* Erro */}
              {erro && (
                <div
                  ref={errorRef}
                  tabIndex={-1}
                  className="
                    rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700
                    dark:border-red-800/60 dark:bg-red-900/40 dark:text-red-200
                  "
                  role="alert"
                  aria-live="assertive"
                >
                  {erro}
                </div>
              )}

              {/* Botão */}
              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className={`
                  inline-flex w-full items-center justify-center gap-2 rounded-lg
                  bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm
                  transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
                  ${isLoading ? "opacity-80 cursor-not-allowed" : ""}
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                    A autenticar…
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </div>

            {/* Dicas / acessos rápidos */}
            <p className="mt-4 text-center text-[11px] text-slate-500 dark:text-slate-400">
              Dica: use{" "}
              <kbd className="rounded border border-slate-300 px-1 py-0.5 text-slate-700 dark:border-slate-600 dark:text-slate-200">
                Ctrl/⌘ K
              </kbd>{" "}
              para pesquisar e navegar mais rápido.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
