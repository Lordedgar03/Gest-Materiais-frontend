"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HelpCircle, LogOut, User, UserCircle2, Search, Command } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import api, { Auth } from "../api";

/* ==================== Templates -> capacidades ==================== */
const TEMPLATE_TO_CAPS = {
  baseline: [
    { module: "dashboard", action: "visualizar" },
    { module: "categoria", action: "visualizar" },
    { module: "tipo", action: "visualizar" },
    { module: "material", action: "visualizar" },
    { module: "movimentacao", action: "visualizar" },
    { module: "requisicao", action: "visualizar" },
    { module: "venda", action: "visualizar" },
    { module: "recibo", action: "visualizar" },
  ],
  manage_category: [
    { module: "categoria", action: "visualizar" },
    { module: "categoria", action: "criar" },
    { module: "categoria", action: "editar" },
    { module: "categoria", action: "eliminar" },
    { module: "tipo", action: "visualizar" },
    { module: "tipo", action: "criar" },
    { module: "tipo", action: "editar" },
    { module: "tipo", action: "eliminar" },
    { module: "material", action: "visualizar" },
    { module: "material", action: "criar" },
    { module: "material", action: "editar" },
    { module: "material", action: "eliminar" },
    { module: "movimentacao", action: "visualizar" },
    { module: "requisicao", action: "visualizar" },
  ],
  manage_users: [
    { module: "usuario", action: "visualizar" },
    { module: "usuario", action: "criar" },
    { module: "usuario", action: "editar" },
    { module: "usuario", action: "eliminar" },
    { module: "log", action: "visualizar" },
  ],
  manage_sales: [
    { module: "venda", action: "visualizar" },
    { module: "venda", action: "criar" },
    { module: "venda", action: "eliminar" },
    { module: "recibo", action: "visualizar" },
  ],
};

function capsFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return { isAdmin: false, capsSet: new Set(), roles: [], user: {} };
  try {
    const decoded = jwtDecode(token) || {};
    const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
    const isAdmin = roles.includes("admin");
    const templates = Array.isArray(decoded.templates) ? decoded.templates : [];
    const capsSet = new Set();
    templates.forEach((tpl) => {
      (TEMPLATE_TO_CAPS[tpl?.template_code] || []).forEach(({ module, action }) =>
        capsSet.add(`${module}:${action}`)
      );
    });
    return { isAdmin, capsSet, roles, user: decoded };
  } catch {
    return { isAdmin: false, capsSet: new Set(), roles: [], user: {} };
  }
}
const roleLabel = (roles = []) =>
  Array.isArray(roles) && roles.includes("admin")
    ? "Administrador"
    : Array.isArray(roles) && roles[0]
    ? roles[0].charAt(0).toUpperCase() + roles[0].slice(1)
    : "Utilizador";

function RoleBadge({ roles }) {
  const label = roleLabel(roles);
  const isAdmin = Array.isArray(roles) && roles.includes("admin");
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
        isAdmin ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"
      }`}
      title={`Tipo: ${label}`}
    >
      {label}
    </span>
  );
}

/* ==================== Comandos (palette) ==================== */
const RAW_COMMANDS = [
  { label: "Dashboard", path: "/dashboard", perm: { module: "dashboard" } },
  { label: "Categorias", path: "/categorias", perm: { module: "categoria" } },
  { label: "Tipos", path: "/tipos", perm: { module: "tipo" } },
  { label: "Materiais", path: "/materiais", perm: { module: "material" } },
  { label: "Movimentações", path: "/movimentos", perm: { module: "movimentacao" } },
  { label: "Requisições", path: "/requisicoes", perm: { module: "requisicao" } },
  { label: "Vendas", path: "/vendas", perm: { module: "venda" } },
  { label: "Caixa", path: "/caixa", perm: { module: "venda" } },
  { label: "Atendimento", path: "/pdv", perm: { module: "venda" } },
  { label: "Almoço (Resumo)", path: "/almoco", perm: { module: "venda" } },
  { label: "Alunos", path: "/alunos", perm: { module: "venda" } },
  { label: "Marcações", path: "/marcacoes", perm: { module: "venda" } },
  { label: "Relatórios", path: "/relatorios", perm: { module: "relatorio" } },
  { label: "Ajuda", path: "/ajuda", perm: { module: "dashboard" } },
  { label: "Perfil", path: "/perfil", perm: { module: "dashboard" } },
];

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const [query, setQuery] = useState("");

  const [userName, setUserName] = useState("Utilizador");
  const [roles, setRoles] = useState([]);
  const [authz, setAuthz] = useState({ isAdmin: false, capsSet: new Set(), roles: [] });

  const [toastMsg, setToastMsg] = useState("");
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  const refreshAuth = async () => {
    const next = capsFromToken();
    setAuthz(next);
    setRoles(next.roles);

    try {
      const r = await api.get("/profile");
      const nome =
        r?.data?.nome || r?.data?.name || localStorage.getItem("user_nome") || "Utilizador";
      setUserName(nome);
      localStorage.setItem("user_nome", nome);
    } catch {
      const nome = localStorage.getItem("user_nome") || "Utilizador";
      setUserName(nome);
    }
  };

  useEffect(() => {
    refreshAuth();
    const onAuth = () => refreshAuth();
    window.addEventListener("auth:changed", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("auth:changed", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, []);

  // Toast (403, etc.)
  useEffect(() => {
    const onToast = (e) => {
      const msg = e?.detail?.message || "Operação não permitida.";
      setToastMsg(msg);
      const t = setTimeout(() => setToastMsg(""), 3500);
      return () => clearTimeout(t);
    };
    window.addEventListener("toast", onToast);
    return () => window.removeEventListener("toast", onToast);
  }, []);

  const handleLogout = async () => {
    try {
      await Auth.logout().catch(() => {});
    } finally {
      ["token", "user_nome", "roles", "templates", "caps", "lastLoginAt"].forEach((k) =>
        localStorage.removeItem(k)
      );
      window.dispatchEvent(new Event("auth:changed"));
      navigate("/login", { replace: true });
    }
  };

  // fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!userMenuRef.current?.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // palette: Ctrl/Cmd+K e Esc
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

  const hasCap = ({ isAdmin, capsSet }, module, action = "visualizar") =>
    isAdmin || capsSet.has(`${module}:${action}`);

  const allowedCommands = useMemo(
    () => RAW_COMMANDS.filter((c) => hasCap(authz, c.perm.module, c.perm.action)),
    [authz]
  );

  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase();
    return allowedCommands.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 8);
  }, [allowedCommands, query]);

  return (
    <>
      <header
        className="
          sticky top-0 z-40 w-full
          border-b border-slate-200/70 bg-white/80 backdrop-blur
          dark:border-slate-800 dark:bg-slate-900/70
        "
      >
        <div className="mx-auto flex h-14 items-center justify-between px-3 sm:px-4">
          {/* Branding simples */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-lg font-semibold text-slate-900 dark:text-slate-100">
              Gestão de Materiais
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Botão que abre a palette */}
            <button
              onClick={() => setShowCmd(true)}
              className="
                hidden md:flex items-center gap-2 rounded-lg border border-slate-300/70
                px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100
                dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800
              "
              title="Pesquisar (Ctrl/Cmd + K)"
            >
              <Search size={16} />
              <span className="hidden lg:block">Pesquisar</span>
              <span className="ml-2 rounded border px-1.5 py-0.5 text-[10px] border-slate-300/80 dark:border-slate-600">
                Ctrl/⌘ K
              </span>
            </button>

            {/* Saudação */}
            <div className="hidden sm:flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <span className="font-medium">
                Olá, <span className="font-semibold text-indigo-600 dark:text-indigo-400">{userName}</span>
              </span>
              <RoleBadge roles={roles} />
            </div>

            {/* Menu utilizador */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="text-slate-700 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                title="Menu do utilizador"
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
              >
                <UserCircle2 size={28} />
              </button>

              {showUserMenu && (
                <div
                  className="
                    absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border bg-white shadow-xl
                    border-slate-200 dark:border-slate-800 dark:bg-slate-900
                  "
                  role="menu"
                >
                  <div className="border-b px-4 py-3 border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sessão</p>
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{userName}</p>
                    <div className="mt-1">
                      <RoleBadge roles={roles} />
                    </div>
                  </div>

                  <ul className="text-sm">
                    <li className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800" role="none">
                      <HelpCircle size={16} aria-hidden="true" />
                      <Link to="/ajuda" className="block w-full" role="menuitem" onClick={() => setShowUserMenu(false)}>
                        Ajuda
                      </Link>
                    </li>
                    <li className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800" role="none">
                      <User size={16} aria-hidden="true" />
                      <Link to="/perfil" className="block w-full" role="menuitem" onClick={() => setShowUserMenu(false)}>
                        Perfil
                      </Link>
                    </li>
                    <li
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} aria-hidden="true" />
                      <span className="block w-full">Sair</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Command Palette */}
      {showCmd && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCmd(false)} />
          <div className="relative mx-auto mt-24 max-w-lg">
            <div className="overflow-hidden rounded-2xl border bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 border-b px-4 py-3 border-slate-200 dark:border-slate-800">
                <Command size={16} className="text-slate-500" aria-hidden="true" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ir para… (ex.: materiais, almoço, caixa)"
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-slate-100"
                  aria-label="Pesquisar navegação"
                />
                <kbd className="rounded border px-1.5 py-0.5 text-[10px] text-slate-500 border-slate-300 dark:border-slate-700">
                  Esc
                </kbd>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {filtered.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-slate-500">Nada encontrado</li>
                )}
                {filtered.map((c) => (
                  <li
                    key={c.path}
                    className="cursor-pointer px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => {
                      setShowCmd(false);
                      setQuery("");
                      navigate(c.path);
                    }}
                  >
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed right-4 top-4 z-50 rounded-xl bg-black/80 px-4 py-3 text-white shadow-lg backdrop-blur">
          {toastMsg}
        </div>
      )}
    </>
  );
}
