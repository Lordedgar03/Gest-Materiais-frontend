"use client"

import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  HelpCircle,
  LogOut,
  User,
  UserCircle2,
  Search,
  Moon,
  Sun,
  Command,
} from "lucide-react"
import api from "../api"

const commands = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Categorias", path: "/categorias" },
  { label: "Tipos", path: "/tipos" },
  { label: "Materiais", path: "/materiais" },
  { label: "Movimentações", path: "/movimentos" },
  { label: "Requisições", path: "/requisicoes" },
  { label: "Relatórios", path: "/relatorios" },
  { label: "Utilizadores", path: "/utilizadores" },
  { label: "Reciclagem", path: "/materials-recycle" }, // corrigido
  { label: "Vendas", path: "/vendas" },
  { label: "Caixa", path: "/caixa" },
  { label: "Atendimento", path: "/pdv" },
  { label: "Ajuda", path: "/ajuda" },
  { label: "Perfil", path: "/perfil" },
]

// --- helpers de apresentação ---
const roleLabel = (roles = []) => {
  if (!Array.isArray(roles)) return "Utilizador"
  if (roles.includes("admin")) return "Administrador"
  if (roles.includes("professor")) return "Professor"
  if (roles.includes("funcionario")) return "Funcionário"
  // fallback: primeira role com capitalização simples
  const r = roles[0]
  return r ? r.charAt(0).toUpperCase() + r.slice(1) : "Utilizador"
}

function RoleBadge({ roles }) {
  const label = roleLabel(roles)
  const isAdmin = Array.isArray(roles) && roles.includes("admin")
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium
        ${isAdmin ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700"}`}
      title={`Tipo: ${label}`}
    >
      {label}
    </span>
  )
}

function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showCmd, setShowCmd] = useState(false)
  const [query, setQuery] = useState("")
  const [userName, setUserName] = useState("Utilizador")
  const [roles, setRoles] = useState([])
  const userMenuRef = useRef(null)
  const navigate = useNavigate()

  // lê sessão do localStorage
  const readSession = () => {
    const nome = localStorage.getItem("user_nome") || "Utilizador"
    let r = []
    try { r = JSON.parse(localStorage.getItem("roles") || "[]") } catch { /* empty */ }
    setUserName(nome)
    setRoles(Array.isArray(r) ? r : [])
  }

  useEffect(() => {
    readSession()
    const onAuth = () => readSession()
    window.addEventListener("auth:changed", onAuth)
    window.addEventListener("storage", onAuth)
    return () => {
      window.removeEventListener("auth:changed", onAuth)
      window.removeEventListener("storage", onAuth)
    }
  }, [])

  // theme toggle (persistente)
  const [theme] = useState(() => localStorage.getItem("theme") || "light")
  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") root.classList.add("dark")
    else root.classList.remove("dark")
    localStorage.setItem("theme", theme)
  }, [theme])

  const handleLogout = async () => {
    try {
      await api.post("/users/logout").catch(() => {})
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user_nome")
      localStorage.removeItem("roles")
      localStorage.removeItem("templates")
      localStorage.removeItem("caps")
      localStorage.removeItem("lastLoginAt")
      window.dispatchEvent(new Event("auth:changed"))
      navigate("/login", { replace: true })
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!userMenuRef.current?.contains(e.target)) setShowUserMenu(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Command palette (Ctrl/Cmd + K)
  useEffect(() => {
    const onKey = (e) => {
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k"
      if (isCmdK) {
        e.preventDefault()
        setShowCmd((v) => !v)
      }
      if (showCmd && e.key === "Escape") setShowCmd(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [showCmd])

  const filtered = commands
    .filter(c => c.label.toLowerCase().includes((query || "").toLowerCase()))
    .slice(0, 8)

  return (
    <>
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="text-xl md:text-2xl font-bold text-[#5548D9]">
          Gestão de Materiais
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Search (atalho abre palette) */}
          <button
            onClick={() => setShowCmd(true)}
            className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 border border-gray-500/30 dark:border-gray-700 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            title="Pesquisar (Ctrl/Cmd + K)"
          >
            <Search size={16} />
            <span className="hidden sm:block">Pesquisar</span>
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600">Ctrl/⌘ K</span>
          </button>

       
          {/* Saudação + tipo */}
          <div className="hidden sm:flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <span className="font-medium">
              Olá, <span className="text-[#5548D9] dark:text-indigo-400 font-semibold">{userName}</span>
            </span>
            <RoleBadge roles={roles} />
          </div>

          {/* Menu do utilizador */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="text-gray-600 dark:text-gray-300 hover:text-[#6C63FF]"
              title="Menu do utilizador"
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
            >
              <UserCircle2 size={28} />
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden"
                role="menu"
              >
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sessão</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{userName}</p>
                  <div className="mt-1">
                    <RoleBadge roles={roles} />
                  </div>
                </div>
                <ul className="text-sm">
                  <li className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2" role="none">
                    <HelpCircle size={16} aria-hidden="true" />
                    <Link to="/ajuda" className="w-full block" role="menuitem" onClick={() => setShowUserMenu(false)}>
                      Ajuda
                    </Link>
                  </li>
                  <li className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2" role="none">
                    <User size={16} aria-hidden="true" />
                    <Link to="/perfil" className="w-full block" role="menuitem" onClick={() => setShowUserMenu(false)}>
                      Perfil
                    </Link>
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 cursor-pointer"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    <span className="w-full block">Sair</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette simples */}
      {showCmd && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCmd(false)} />
          <div className="relative max-w-lg mx-auto mt-24">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <Command size={16} className="text-gray-500" aria-hidden="true" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ir para… (ex.: materiais)"
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400"
                  aria-label="Pesquisar navegação"
                />
                <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 text-gray-500">Esc</kbd>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {filtered.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-gray-500">Nada encontrado</li>
                )}
                {filtered.map((c) => (
                  <li
                    key={c.path}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => { setShowCmd(false); setQuery(""); navigate(c.path) }}
                  >
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
