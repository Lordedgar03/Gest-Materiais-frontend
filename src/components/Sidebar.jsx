"use client";

import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, List, Boxes, PackageCheck, Repeat, FileText,
  Receipt, Recycle, Users, ChevronLeft, ChevronRight, Menu, X, BadgeInfo
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useEffect, useMemo, useState, useCallback } from "react";

/** ADMIN ONLY: módulos que só aparecem para admin (sem mexer no backend) */
const ADMIN_ONLY = new Set(["dashboard", "relatorios", "recibo"]);

/** Catálogo mínimo de permissões por template (client-side) */
const TEMPLATE_TO_PERMS = {
  // baseline agora é bem restrito (apenas Ajuda)
  baseline: [
    { module: "ajuda", action: "visualizar" },
  ],

  // gerir categorias: catálogo + movimentos + requisições (sem relatórios/dashboard)
  manage_category: [
    { module: "categorias", action: "visualizar" },
    { module: "categorias", action: "criar" },
    { module: "categorias", action: "editar" },
    { module: "categorias", action: "eliminar" },

    { module: "tipos", action: "visualizar" },
    { module: "tipos", action: "criar" },
    { module: "tipos", action: "editar" },
    { module: "tipos", action: "eliminar" },

    { module: "materiais", action: "visualizar" },
    { module: "materiais", action: "criar" },
    { module: "materiais", action: "editar" },
    { module: "materiais", action: "eliminar" },

    { module: "movimentacoes", action: "visualizar" },
    { module: "requisicoes", action: "visualizar" },
  ],

  // gerir utilizadores (sem relatórios/dashboard)
  manage_users: [
    { module: "utilizador", action: "visualizar" },
    { module: "utilizador", action: "criar" },
    { module: "utilizador", action: "editar" },
    { module: "utilizador", action: "eliminar" },
    { module: "log", action: "visualizar" },
  ],

  // gerir vendas (sem recibo e sem relatórios, que agora são admin-only)
  manage_sales: [
    { module: "venda", action: "visualizar" },
    { module: "venda", action: "criar" },
    { module: "venda", action: "eliminar" },
  ],
};

function getClaimsFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return { roles: [], templates: [] };
  try {
    const { roles = [], templates = [] } = jwtDecode(token) || {};
    return {
      roles: Array.isArray(roles) ? roles : [],
      templates: Array.isArray(templates) ? templates : []
    };
  } catch {
    return { roles: [], templates: [] };
  }
}

function buildPermissionIndex({ roles, templates }) {
  if (roles?.includes?.("admin")) return { __admin: true };
  const index = new Map();
  const add = (m, a) => {
    if (!index.has(m)) index.set(m, new Set());
    index.get(m).add(a);
  };
  const codes = (templates || []).map(t => t?.template_code).filter(Boolean);
  for (const code of codes) {
    const entries = TEMPLATE_TO_PERMS[code] || [];
    entries.forEach(({ module, action }) => add(module, action));
  }
  return Object.fromEntries([...index.entries()].map(([k, v]) => [k, v]));
}

function hasPermission(permsIndex, roles, module, action = "visualizar") {
  if (!permsIndex) return false;
  const isAdmin = roles?.includes?.("admin") || permsIndex.__admin;
  if (ADMIN_ONLY.has(module)) return !!isAdmin; // admin-only no front
  if (isAdmin) return true;
  const set = permsIndex[module];
  return !!(set && (set.has?.(action) || set.has?.("visualizar")));
}

export default function Sidebar({ open, setOpen }) {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const [claims, setClaims] = useState(() => getClaimsFromToken());
  const { roles } = claims;

  useEffect(() => {
    const reload = () => setClaims(getClaimsFromToken());
    window.addEventListener("storage", reload);
    window.addEventListener("auth:changed", reload);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("auth:changed", reload);
    };
  }, []);

  const permsIndex = useMemo(() => buildPermissionIndex(claims), [claims]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const menuGroups = useMemo(() => ([
    {
      title: "Principal",
      items: [
        // Dashboard (admin-only). Será filtrado pelo hasPermission.
        { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", perm: { module: "dashboard", action: "visualizar" } },
      
      ],
    },
    {
      title: "Gestão",
      items: [
        { path: "/categorias",   icon: List,         label: "Categorias",     perm: { module: "categorias", action: "visualizar" } },
        { path: "/tipos",        icon: Boxes,        label: "Tipos",          perm: { module: "tipos", action: "visualizar" } },
        { path: "/materiais",    icon: PackageCheck, label: "Materiais",      perm: { module: "materiais", action: "visualizar" } },
        { path: "/movimentos",   icon: Repeat,       label: "Movimentações",  perm: { module: "movimentacoes", action: "visualizar" } },
        { path: "/requisicoes",  icon: FileText,     label: "Requisições",    perm: { module: "requisicoes", action: "visualizar" } },
      ],
    },
    {
      title: "Vendas",
      items: [
        { path: "/vendas",  icon: FileText, label: "Vendas",      perm: { module: "venda", action: "visualizar" } },
        { path: "/caixa",   icon: Receipt,  label: "Caixa",       perm: { module: "venda", action: "visualizar" } },
        { path: "/pdv",     icon: Receipt,  label: "Atendimento", perm: { module: "venda", action: "visualizar" } },
      ],
    },
    {
      title: "Sistema",
      items: [
        { path: "/utilizadores",      icon: Users,   label: "Utilizadores", perm: { module: "utilizador", action: "visualizar" } },
        { path: "/materials-recycle", icon: Recycle, label: "Reciclagem",   perm: { module: "materiais", action: "eliminar" } },
      ],
    },
    {
      title: "Relatórios",
      items: [
        // Ambos admin-only
        { path: "/relatorios", icon: FileText, label: "Relatórios", perm: { module: "relatorios", action: "visualizar" } },
        // se tiver /recibos, troque o path
        { path: "/relatorios", icon: Receipt,  label: "Recibos",    perm: { module: "recibo", action: "visualizar" } },
          // Ajuda (baseline)
        { path: "/ajuda", icon: BadgeInfo, label: "Ajuda", perm: { module: "ajuda", action: "visualizar" } },
      ],
    },
  ]), []);

  const filteredGroups = useMemo(() => {
    const groups = menuGroups.map(g => ({
      ...g,
      items: g.items.filter(it => hasPermission(permsIndex, roles, it.perm.module, it.perm.action)),
    }));
    return groups.filter(g => g.items.length > 0);
  }, [menuGroups, permsIndex, roles]);

  const widthCls = open ? "w-72" : isMobile ? "w-0" : "w-16";
  const baseAside =
    "bg-gradient-to-b from-gray-950 via-gray-900 to-gray-900 text-white h-screen transition-all duration-300 flex flex-col shadow-2xl z-50 border-r border-white/10";

  const linkClasses = ({ isActive }) =>
    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
     ${isActive ? "bg-white/10 text-white shadow-md ring-1 ring-white/15" : "text-gray-300 hover:bg-white/5 hover:text-white"}`;

  const handleQuickHelp = useCallback(() => navigate("/ajuda"), [navigate]);

  return (
    <>
      {isMobile && open && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}
      <aside
        className={`${widthCls} ${isMobile ? "fixed" : "relative"} ${baseAside} ${!open && isMobile ? "-translate-x-full" : "translate-x-0"}`}
      >
        {/* Topo */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          {open && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
                <img src="/info11.png" alt="logotipo" className="h-full w-full object-cover" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">Painel</h1>
                <p className="text-[11px] text-gray-400">Controlo &amp; Gestão</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 p-2 transition"
            title={open ? "Fechar menu" : "Abrir menu"}
            aria-label="Alternar menu"
          >
            {isMobile ? (open ? <X size={18} /> : <Menu size={18} />) : (open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />)}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {filteredGroups.map(group => (
            <div key={group.title}>
              {open && (
                <div className="px-2 mb-2">
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{group.title}</h3>
                </div>
              )}
              <ul className="space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink to={item.path} end className={linkClasses} onClick={() => isMobile && setOpen(false)}>
                        <div className="min-w-[20px] flex items-center justify-center opacity-90">
                          <Icon size={18} />
                        </div>
                        {open && <span className="truncate">{item.label}</span>}
                        {!open && !isMobile && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800/95 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none border border-white/10">
                            {item.label}
                          </div>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Rodapé */}
        <div className="border-t border-white/10 p-4">
          {open ? (
            <div className="flex items-center justify-between">
              <button onClick={handleQuickHelp} className="text-xs text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg">
                Ajuda rápida
              </button>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span>© 2025</span>
                <span className="opacity-60">Info STP</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-[10px] text-gray-400">© 2025</div>
          )}
        </div>
      </aside>
    </>
  );
}
