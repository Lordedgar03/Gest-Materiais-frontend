"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useLogin from "../hooks/useLogin";

// ordem preferida para redirecionamento
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
const ADMIN_FIRST = [
  "dashboard:visualizar",
  "relatorios:visualizar",
  "recibo:visualizar",
];

// mapeia module:action -> path
const CAP_TO_PATH = {
  "dashboard:visualizar": "/dashboard",
  "relatorios:visualizar": "/relatorios",
  "recibo:visualizar": "/relatorios", // ajuste para /recibos se tiver essa rota
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
  // fallback mais seguro: Ajuda (está no baseline)
  return "/ajuda";
}

export default function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const navigate = useNavigate();
  const { login, isLoading, erro } = useLogin();

  const emailInputRef = useRef(null);
  const errorRef = useRef(null);
  const pwdInputId = "login-password-input";

  useEffect(() => { emailInputRef.current?.focus(); }, []);
  useEffect(() => { if (erro) setTimeout(() => errorRef.current?.focus(), 0); }, [erro]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-unused-vars
    const { ok, caps, nome } = await login(email, senha);
    if (ok) {
      setIsAuthenticated?.(true);
      const roles = JSON.parse(localStorage.getItem("roles") || "[]");
      const capsArr = caps || JSON.parse(localStorage.getItem("caps") || "[]");
      const destination = getFirstAllowedPath(capsArr, roles);
      navigate(destination, { replace: true });
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[radial-gradient(1200px_600px_at_20%_-10%,_rgba(108,99,255,0.15),_transparent),radial-gradient(800px_400px_at_90%_-10%,_rgba(79,70,229,0.18),_transparent)]">
      {/* Lado visual */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" aria-hidden="true" />
        <div className="relative text-center text-white px-10">
          <img src="/info11.png" alt="Logótipo" className="mx-auto h-24 w-auto mb-6 opacity-95" />
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Materiais</h1>
          <p className="mt-2 text-sm text-white/80">Controle moderno, seguro e responsivo.</p>
          <div className="mt-8 inline-flex items-center gap-2 text-white/80 text-sm bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
            <ShieldCheck size={16} aria-hidden="true" />
            Segurança de sessão com JWT
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl p-6"
          noValidate
          aria-labelledby="login-title"
        >
          <h2 id="login-title" className="text-2xl font-bold text-gray-900 text-center">Entrar</h2>
          <p className="text-sm text-gray-600 text-center mt-1">Use as suas credenciais</p>

          <div className="sr-only" role="status" aria-live="polite">
            {isLoading ? "A autenticar…" : "Formulário pronto."}
          </div>

          <div className="mt-6 space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
                <input
                  id="login-email"
                  ref={emailInputRef}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  placeholder="email@exemplo.com"
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <label htmlFor={pwdInputId} className="block text-xs font-medium text-gray-700 mb-1">
                Palavra-passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
                <input
                  id={pwdInputId}
                  name="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyUp={(e) => setCapsLockOn(e.getModifierState && e.getModifierState("CapsLock"))}
                  required
                  disabled={isLoading}
                  aria-invalid={!!erro}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 p-1 rounded"
                  aria-label={showPwd ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                  aria-pressed={showPwd}
                  aria-controls={pwdInputId}
                >
                  {showPwd ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              {capsLockOn && <p className="text-[11px] text-amber-600 mt-1">Caps Lock ativado</p>}
            </div>

            {/* Erro */}
            {erro && (
              <div
                ref={errorRef}
                tabIndex={-1}
                className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg p-2"
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
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
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

          <p className="text-[11px] text-gray-500 text-center mt-4">
            Dica: use <kbd className="px-1 py-0.5 border rounded">Ctrl/⌘ K</kbd> para navegar rápido no app
          </p>
        </form>
      </div>
    </div>
  );
}
