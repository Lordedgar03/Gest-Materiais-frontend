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
  { label: "Reciclagem", path: "/MaterialsRecycle" },
  { label: "Vendas", path: "/vendas" },
  { label: "Caixa", path: "/caixa" },
  { label: "pdv", path: "/pdv" },
  { label: "Ajuda", path: "/ajuda" },
  { label: "Perfil", path: "/perfil" },
]

function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showCmd, setShowCmd] = useState(false)
  const [query, setQuery] = useState("")
  const userMenuRef = useRef(null)
  const navigate = useNavigate()

  const userName = (() => {
    try { return JSON.parse(localStorage.getItem("user_nome") || '"Utilizador"') }
    catch { return "Utilizador" }
  })()

  // theme toggle (persistente)
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light")
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
      localStorage.removeItem("permissoes")
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

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase())).slice(0, 8)

  return (
    <>
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="text-xl md:text-2xl font-bold text-[#5548D9]">Gestão de Materiais</div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Search (atalho abre palette) */}
          <button
            onClick={() => setShowCmd(true)}
            className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            title="Pesquisar (Ctrl/Cmd + K)"
          >
            <Search size={16} />
            <span className="hidden sm:block">Pesquisar</span>
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600">Ctrl/⌘ K</span>
          </button>
          <button className="flex  gap-2 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <Link to="/pdv" className="w-full block bg-[#5548D9] hover:bg-[#6C63FF] text-white px-3 py-2 rounded-lg text-sm">
              Atender 
            </Link>
            <Link to="/caixa" className="w-full block bg-[#5548D9] hover:bg-[#6C63FF] text-white px-3 py-2 rounded-lg text-sm">
              Caixa
            </Link>
             <Link to="/vendas" className="w-full block bg-[#5548D9] hover:bg-[#6C63FF] text-white px-3 py-2 rounded-lg text-sm">
              Vendas
            </Link>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(t => (t === "light" ? "dark" : "light"))}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            aria-label="Alternar tema"
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Nome do utilizador */}
          <span className="hidden sm:block font-medium text-gray-700 dark:text-gray-200">
            Olá, <span className="text-[#5548D9] dark:text-indigo-400 font-semibold">{userName}</span>
          </span>

          {/* Menu do utilizador */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="text-gray-600 dark:text-gray-300 hover:text-[#6C63FF]"
              title="Menu do utilizador"
            >
              <UserCircle2 size={28} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sessão</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{userName}</p>
                </div>
                <ul className="text-sm">
                  <li className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
                    <HelpCircle size={16} />
                    <Link to="/ajuda" className="w-full block" onClick={() => setShowUserMenu(false)}>
                      Ajuda
                    </Link>
                  </li>
                  <li className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
                    <User size={16} />
                    <Link to="/perfil" className="w-full block" onClick={() => setShowUserMenu(false)}>
                      Perfil
                    </Link>
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
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
                <Command size={16} className="text-gray-500" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ir para… (ex.: materiais)"
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400"
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
