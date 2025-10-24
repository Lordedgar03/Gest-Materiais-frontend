"use client";

import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  Boxes,
  PackageCheck,
  Repeat,
  FileText,
  Receipt,
  Users,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BadgeInfo,
  UtensilsCrossed,
  GraduationCap,
  CalendarCheck2,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useEffect, useMemo, useState, useCallback } from "react";

/* ==================== Permissões ==================== */
const ADMIN_ONLY = new Set(["relatorio"]);
const TEMPLATE_TO_PERMS = {
  baseline: [
    { module: "dashboard", action: "visualizar" },
    { module: "requisicao", action: "visualizar" },
    { module: "categoria", action: "visualizar" },
    { module: "tipo", action: "visualizar" },
    { module: "material", action: "visualizar" },
    { module: "movimentacao", action: "visualizar" },
    { module: "venda", action: "visualizar" },
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
  ],
};

function getClaimsFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return { roles: [], templates: [] };
  try {
    const { roles = [], templates = [] } = jwtDecode(token) || {};
    return {
      roles: Array.isArray(roles) ? roles : [],
      templates: Array.isArray(templates) ? templates : [],
    };
  } catch {
    return { roles: [], templates: [] };
  }
}

function buildPermissionIndex({ roles, templates }) {
  if (roles?.includes?.("admin")) return { __admin: true };
  const index = new Map();
  const push = (m, a) => {
    if (!index.has(m)) index.set(m, new Set());
    index.get(m).add(a);
  };
  const codes = (templates || []).map((t) => t?.template_code).filter(Boolean);
  for (const code of codes) {
    (TEMPLATE_TO_PERMS[code] || []).forEach(({ module, action }) => push(module, action));
  }
  return Object.fromEntries([...index.entries()].map(([k, v]) => [k, v]));
}

function hasPermission(permsIndex, roles, module, action = "visualizar") {
  if (!permsIndex) return false;
  const isAdmin = roles?.includes?.("admin") || permsIndex.__admin;
  if (ADMIN_ONLY.has(module)) return !!isAdmin; // admin-only
  if (isAdmin) return true;
  const set = permsIndex[module];
  return !!(set && (set.has?.(action) || set.has?.("visualizar")));
}

/* ==================== Itens de navegação ==================== */
const RAW_GROUPS = [
  {
    title: "Principal",
    items: [
      { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", perm: { module: "dashboard" } },
    ],
  },
  {
    title: "Gestão",
    items: [
      { path: "/categorias", icon: List,         label: "Categorias",     perm: { module: "categoria" } },
      { path: "/tipos",      icon: Boxes,        label: "Tipos",          perm: { module: "tipo" } },
      { path: "/materiais",  icon: PackageCheck, label: "Materiais",      perm: { module: "material" } },
      { path: "/movimentos", icon: Repeat,       label: "Movimentações",  perm: { module: "movimentacao" } },
      { path: "/requisicoes",icon: FileText,     label: "Requisições",    perm: { module: "requisicao" } },
    ],
  },
  {
    title: "Vendas",
    items: [
      { path: "/vendas", icon: FileText, label: "Vendas",      perm: { module: "venda" } },
      { path: "/caixa",  icon: Receipt,  label: "Caixa",       perm: { module: "venda" } },
      { path: "/pdv",    icon: Receipt,  label: "Atendimento", perm: { module: "venda" } },
    ],
  },
  {
    title: "Almoço",
    items: [
      { path: "/almoco",    icon: UtensilsCrossed, label: "Almoço",    perm: { module: "venda" } },
      { path: "/alunos",    icon: GraduationCap,   label: "Alunos",    perm: { module: "venda" } },
      { path: "/marcacoes", icon: CalendarCheck2,  label: "Marcações", perm: { module: "venda" } },
    ],
  },
  {
    title: "Sistema",
    items: [{ path: "/utilizadores", icon: Users, label: "Utilizadores", perm: { module: "usuario" } }],
  },
  {
    title: "Relatórios",
    items: [
      { path: "/relatorios", icon: FileText,  label: "Relatórios", perm: { module: "relatorio" } }, // admin-only
      { path: "/ajuda",      icon: BadgeInfo, label: "Ajuda",      perm: { module: "dashboard" } },
    ],
  },
];

/* ==================== Sub-componentes ==================== */
function NavSection({ title, children, expanded }) {
  return (
    <div className="mb-1">
      {expanded && (
        <div className="px-3 pt-3 pb-1">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400/90 dark:text-slate-400">
            {title}
          </h3>
        </div>
      )}
      <ul className="px-2 space-y-1">{children}</ul>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, compact, onClick }) {
  return (
    <li>
      <NavLink
        to={to}
        end
        onClick={onClick}
        className={({ isActive }) =>
          `
            group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
            transition-colors
            ${isActive
              ? "bg-white/10 text-white ring-1 ring-white/15 shadow-md"
              : "text-slate-300 hover:bg-white/5 hover:text-white"}
          `
        }
      >
        <div className="min-w-[20px] flex items-center justify-center opacity-90">
          <Icon size={18} />
        </div>
        {!compact && <span className="truncate">{label}</span>}
        {compact && (
          <div
            className="
              pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2
              rounded px-2 py-1 text-xs text-white bg-slate-800/95 border border-white/10 shadow-lg
              opacity-0 group-hover:opacity-100 transition
            "
          >
            {label}
          </div>
        )}
      </NavLink>
    </li>
  );
}

/* ==================== Sidebar ==================== */
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
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const groups = useMemo(() => {
    const permitted = RAW_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((it) => hasPermission(permsIndex, roles, it.perm.module, it.perm.action)),
    })).filter((g) => g.items.length > 0);
    return permitted;
  }, [permsIndex, roles]);

  const widthCls = open ? "w-72" : isMobile ? "w-0" : "w-18";
  const asMobileDrawer = isMobile ? "fixed inset-y-0 left-0" : "relative";
  const slideCls = !open && isMobile ? "-translate-x-full" : "translate-x-0";

  const baseAside = `
    ${widthCls} ${asMobileDrawer} ${slideCls}
    z-50 transition-all duration-300
    bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900
    text-white shadow-2xl border-r border-white/10 flex flex-col
    backdrop-blur supports-[backdrop-filter]:bg-white/5
  `;

  const handleQuickHelp = useCallback(() => navigate("/ajuda"), [navigate]);

  return (
    <>
      {/* Overlay mobile */}
      {isMobile && open && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
      )}

      <aside className={baseAside} aria-label="Navegação principal">
        {/* Topo */}
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-3">
          {open && (
            <div className="flex items-center gap-3 pl-1">
              <div className="h-10 w-10 rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
                <img src="/info11.png" alt="Logótipo" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-5">Painel de controle - EPSTP</p>
                <p className="text-[11px] text-slate-400/90">Controlo & Gestão</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title={open ? "Fechar menu" : "Abrir menu"}
            aria-label="Alternar menu"
          >
            {isMobile ? (open ? <X size={18} /> : <Menu size={18} />) : open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-2">
          {groups.map((g) => (
            <NavSection key={g.title} title={g.title} expanded={open}>
              {g.items.map((it) => (
                <NavItem
                  key={it.path}
                  to={it.path}
                  icon={it.icon}
                  label={it.label}
                  compact={!open && !isMobile}
                  onClick={() => isMobile && setOpen(false)}
                />
              ))}
            </NavSection>
          ))}
        </nav>

        {/* Rodapé */}
        <div className="border-t border-white/10 p-3">
          {open ? (
            <div className="flex items-center justify-between">
              <button
                onClick={handleQuickHelp}
                className="rounded-lg px-3 py-2 text-xs text-slate-200 hover:bg-white/5 transition"
              >
                Ajuda rápida
              </button>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>© 2025</span>
                <span className="opacity-60">Info EPSTP</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-[10px] text-slate-400">© 2025</div>
          )}
        </div>
      </aside>
    </>
  );
}
