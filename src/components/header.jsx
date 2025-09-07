"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HelpCircle,
  LogOut,
  User,
  UserCircle2,
  Search,
  Moon,
  Sun,
  Command,
} from "lucide-react";
import api from "../api";

/** Helper: etiqueta amigável da role principal */
const roleLabel = (roles = []) => {
  if (!Array.isArray(roles)) return "Utilizador";
  if (roles.includes("admin")) return "Administrador";
  if (roles.includes("professor")) return "Professor";
  if (roles.includes("funcionario")) return "Funcionário";
  const r = roles[0];
  return r ? r.charAt(0).toUpperCase() + r.slice(1) : "Utilizador";
};

function RoleBadge({ roles }) {
  const label = roleLabel(roles);
  const isAdmin = Array.isArray(roles) && roles.includes("admin");
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium
        ${isAdmin ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700"}`}
      title={`Tipo: ${label}`}
    >
      {label}
    </span>
  );
}

/** Verifica se o utilizador tem a capacidade necessária */
const hasCap = (capsSet, module, action = "visualizar") =>
  capsSet.has(`${module}:${action}`);

/** Lista bruta de comandos + a permissão requerida */
const RAW_COMMANDS = [
  { label: "Dashboard",     path: "/dashboard",        perm: { module: "dashboard",   action: "visualizar" } },
  { label: "Categorias",    path: "/categorias",       perm: { module: "categorias",  action: "visualizar" } },
  { label: "Tipos",         path: "/tipos",            perm: { module: "tipos",       action: "visualizar" } },
  { label: "Materiais",     path: "/materiais",        perm: { module: "materiais",   action: "visualizar" } },
  { label: "Movimentações", path: "/movimentos",       perm: { module: "movimentacoes", action: "visualizar" } },
  { label: "Requisições",   path: "/requisicoes",      perm: { module: "requisicoes", action: "visualizar" } },
  { label: "Relatórios",    path: "/relatorios",       perm: { module: "relatorios",  action: "visualizar" } },
  { label: "Utilizadores",  path: "/utilizadores",     perm: { module: "utilizador",  action: "visualizar" } },
  { label: "Vendas",        path: "/vendas",           perm: { module: "venda",       action: "visualizar" } },
  { label: "Caixa",         path: "/caixa",            perm: { module: "venda",       action: "visualizar" } },
  { label: "Atendimento",   path: "/pdv",              perm: { module: "venda",       action: "visualizar" } },
  // Módulo Almoço (tudo controlado por module "venda" no client)
  { label: "Almoço (Resumo)", path: "/almoco",         perm: { module: "venda",       action: "visualizar" } },
  { label: "Alunos",          path: "/alunos",         perm: { module: "venda",       action: "visualizar" } },
  { label: "Marcações",       path: "/marcacoes",      perm: { module: "venda",       action: "visualizar" } },
  { label: "Configurações",   path: "/configuracoes",  perm: { module: "venda",       action: "visualizar" } },
  { label: "Ajuda",           path: "/ajuda",          perm: { module: "ajuda",       action: "visualizar" } },
  { label: "Perfil",          path: "/perfil",         perm: { module: "ajuda",       action: "visualizar" } }, // livre, usa mesma gate leve
];

function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const [query, setQuery] = useState("");

  const [userName, setUserName] = useState("Utilizador");
  const [roles, setRoles] = useState([]);
  const [caps, setCaps] = useState(new Set());

  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // lê sessão do localStorage
  const readSession = () => {
    const nome = localStorage.getItem("user_nome") || "Utilizador";
    let r = [];
    let c = [];
    try { r = JSON.parse(localStorage.getItem("roles") || "[]"); } catch { /* empty */ }
    try { c = JSON.parse(localStorage.getItem("caps")  || "[]"); } catch { /* empty */ }
    setUserName(nome);
    setRoles(Array.isArray(r) ? r : []);
    setCaps(new Set(Array.isArray(c) ? c : []));
  };

  useEffect(() => {
    readSession();
    const onAuth = () => readSession();
    window.addEventListener("auth:changed", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("auth:changed", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, []);

 
  const handleLogout = async () => {
    try {
      await api.post("/users/logout").catch(() => {});
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user_nome");
      localStorage.removeItem("roles");
      localStorage.removeItem("templates");
      localStorage.removeItem("caps");
      localStorage.removeItem("lastLoginAt");
      window.dispatchEvent(new Event("auth:changed"));
      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!userMenuRef.current?.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Command palette (Ctrl/Cmd + K)
  useEffect(() => {
    const onKey = (e) => {
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setShowCmd((v) => !v);
      }
      if (showCmd && e.key === "Escape") setShowCmd(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCmd]);

  // Filtra os comandos pelo que o utilizador pode visualizar
  const allowedCommands = useMemo(() => {
    return RAW_COMMANDS.filter((c) => hasCap(caps, c.perm.module, c.perm.action));
  }, [caps]);

  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase();
    return allowedCommands.filter(c => c.label.toLowerCase().includes(q)).slice(0, 8);
  }, [allowedCommands, query]);

  return (
    <>
      <header className="bg-gray-950 px-4 py-5 flex items-center justify-between border-b border-gray-800 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="text-xl md:text-2xl font-bold text-white">
            Gestão de Materiais
          </div>
        
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {/* Search (atalho abre palette) */}
          <button
            onClick={() => setShowCmd(true)}
            className="hidden md:flex items-center gap-2 text-sm text-gray-400 border border-gray-700 rounded-lg px-3 py-2 hover:bg-white/5 transition"
            title="Pesquisar (Ctrl/Cmd + K)"
          >
            <Search size={16} />
            <span className="hidden sm:block">Pesquisar</span>
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-gray-700">Ctrl/⌘ K</span>
          </button>

          {/* Saudação + tipo */}
          <div className="hidden sm:flex items-center gap-2 text-gray-200">
            <span className="font-medium">
              Olá, <span className="text-indigo-400 font-semibold">{userName}</span>
            </span>
            <RoleBadge roles={roles} />
          </div>

          {/* Menu do utilizador */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="text-gray-200 hover:text-indigo-400"
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
                  <li className="px-4 py-2 text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2" role="none">
                    <HelpCircle size={16} aria-hidden="true" />
                    <Link to="/ajuda" className="w-full block" role="menuitem" onClick={() => setShowUserMenu(false)}>
                      Ajuda
                    </Link>
                  </li>
                  <li className="px-4 py-2 text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2" role="none">
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

      {/* Command Palette (respeita permissões em caps) */}
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
                  placeholder="Ir para… (ex.: materiais, almoço, caixa)"
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
                    onClick={() => { setShowCmd(false); setQuery(""); navigate(c.path); }}
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
  );
}

export default Header;
