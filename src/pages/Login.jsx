"use client"

import { useState } from "react"
import { Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"
import useLogin from "../hooks/useLogin"

function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [caps, setCaps] = useState(false)
  const navigate = useNavigate()
  const { login, isLoading, erro } = useLogin()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { ok } = await login(email, senha)
    if (ok) {
      setIsAuthenticated?.(true)
      navigate("/dashboard", { replace: true })
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[radial-gradient(1200px_600px_at_20%_-10%,_rgba(108,99,255,0.15),_transparent),radial-gradient(800px_400px_at_90%_-10%,_rgba(79,70,229,0.18),_transparent)]">
      {/* Lado visual */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative text-center text-white px-10">
          <img src="/info11.png" alt="Logo" className="mx-auto h-24 w-auto mb-6 opacity-95" />
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Materiais</h1>
          <p className="mt-2 text-sm text-white/80">Controle moderno, seguro e responsivo.</p>
          <div className="mt-8 inline-flex items-center gap-2 text-white/80 text-sm bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
            <ShieldCheck size={16} />
            Segurança de sessão com JWT
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl p-6"
          autoComplete="off"
        >
          <h2 className="text-2xl font-bold text-gray-900 text-center">Entrar</h2>
          <p className="text-sm text-gray-600 text-center mt-1">Use as suas credenciais</p>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  placeholder="email@exemplo.com"
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Palavra-passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyUp={(e) => setCaps(e.getModifierState && e.getModifierState("CapsLock"))}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                  aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {caps && <p className="text-[11px] text-amber-600 mt-1">Caps Lock ativado</p>}
            </div>

            {erro && (
              <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-2">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Processando…
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
  )
}

export default Login
