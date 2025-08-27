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
  Recycle,
  Users,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BadgeInfo,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useEffect, useMemo, useState } from "react";

const templatePermissionsMap = {
  baseline: [
    { module: "dashboard", action: "visualizar" },
    { module: "relatorios", action: "visualizar" },
    { module: "categorias", action: "visualizar" },
    { module: "tipos", action: "visualizar" },
    { module: "materiais", action: "visualizar" },
    { module: "movimentacoes", action: "visualizar" },
    { module: "requisicoes", action: "visualizar" },
    { module: "venda", action: "visualizar" },
    { module: "recibo", action: "visualizar" },
  ],
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
    { module: "requisicoes", action: "visualizar" },
    { module: "movimentacoes", action: "visualizar" },
  ],
  manage_users: [
    { module: "utilizador", action: "visualizar" },
    { module: "utilizador", action: "criar" },
    { module: "utilizador", action: "editar" },
    { module: "utilizador", action: "eliminar" },
    { module: "log", action: "visualizar" },
  ],
};

function getUserPermissionsFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return [];
  try {
    const { templates = [] } = jwtDecode(token);
    const setPerms = new Set();
    templates.forEach((tpl) => {
      const list = templatePermissionsMap[tpl.template_code] || [];
      list.forEach((p) => setPerms.add(JSON.stringify(p)));
    });
    return Array.from(setPerms).map((p) => JSON.parse(p));
  } catch {
    return [];
  }
}

export default function Sidebar({ open, setOpen }) {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const userPerms = useMemo(getUserPermissionsFromToken, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const menuGroups = [
    {
      title: "Principal",
      items: [
        {
          path: "/dashboard",
          icon: LayoutDashboard,
          label: "Dashboard",
          permission: { module: "dashboard", action: "visualizar" },
        },
      ],
    },
    {
      title: "Gestão",
      items: [
        {
          path: "/categorias",
          icon: List,
          label: "Categorias",
          permission: { module: "categorias", action: "visualizar" },
        },
        {
          path: "/tipos",
          icon: Boxes,
          label: "Tipos",
          permission: { module: "tipos", action: "visualizar" },
        },
        {
          path: "/materiais",
          icon: PackageCheck,
          label: "Materiais",
          permission: { module: "materiais", action: "visualizar" },
        },
        {
          path: "/movimentos",
          icon: Repeat,
          label: "Movimentações",
          permission: { module: "movimentacoes", action: "visualizar" },
        },
        {
          path: "/requisicoes",
          icon: FileText,
          label: "Requisições",
          permission: { module: "requisicoes", action: "visualizar" },
        },
        
      ],
    },
    {
      title: "Relatórios",
      items: [
        {
          path: "/relatorios",
          icon: FileText,
          label: "Relatórios",
          permission: { module: "relatorios", action: "visualizar" },
        },
        {
          path: "/recibos",
          icon: Receipt,
          label: "Recibos",
          permission: { module: "recibo", action: "visualizar" },
        },
      ],
    },
     {
      title: "Vendas",
      items: [
        {
          path: "/vendas",
          icon: FileText,
          label: "Vendas",
          permission: { module: "vendas", action: "visualizar" },
        },
        {
          path: "/caixa",
          icon: Receipt,
          label: "Caixa",
          permission: { module: "Caixa", action: "visualizar" },
        },
        {
          path: "/pdv",
          icon: Receipt,
          label: "Pdv",
          permission: { module: "pdv", action: "visualizar" },
        },
      ],
    },
    {
      title: "Sistema",
      items: [
        {
          path: "/utilizadores",
          icon: Users,
          label: "Utilizadores",
          permission: { module: "utilizador", action: "visualizar" },
        },
        {
          path: "/materials-recycle",
          icon: Recycle,
          label: "Reciclagem",
          permission: { module: "materiais", action: "eliminar" },
        },
      ],
    },
    
  ];

  const filteredGroups = menuGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) =>
        userPerms.some(
          (p) =>
            p.module === it.permission.module &&
            p.action === it.permission.action
        )
      ),
    }))
    .filter((g) => g.items.length > 0);

  const widthCls = open ? "w-72" : isMobile ? "w-0" : "w-16";
  const baseAside =
    "bg-gradient-to-b from-gray-950 via-gray-900 to-gray-900 text-white h-screen transition-all duration-300 flex flex-col shadow-2xl z-50 border-r border-white/10";

  const linkClasses = ({ isActive }) =>
    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
     ${
       isActive
         ? "bg-white/10 text-white shadow-md ring-1 ring-white/15"
         : "text-gray-300 hover:bg-white/5 hover:text-white"
     }`;

  const handleQuickHelp = () => navigate("/ajuda");

  return (
    <>
      {/* Overlay mobile */}
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`${widthCls} ${
          isMobile ? "fixed" : "relative"
        } ${baseAside} ${
          !open && isMobile ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Topo */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          {open && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br  items-center justify-center shadow-brand">
               
                <img src="../..//info11.png" alt="logotipo" className=" rounded-xl bg-gradient-to-br  flex items-center justify-center shadow-brand" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">Painel</h1>
                <p className="text-[11px] text-gray-400">Controlo & Gestão</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 p-2 transition"
            title={open ? "Fechar menu" : "Abrir menu"}
            aria-label="Alternar menu"
          >
            {isMobile ? (
              open ? (
                <X size={18} />
              ) : (
                <Menu size={18} />
              )
            ) : open ? (
              <ChevronLeft size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {filteredGroups.map((group) => (
            <div key={group.title}>
              {open && (
                <div className="px-2 mb-2">
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    {group.title}
                  </h3>
                </div>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end
                        className={linkClasses}
                        onClick={() => isMobile && setOpen(false)}
                      >
                        <div className="min-w-[20px] flex items-center justify-center opacity-90">
                          <Icon size={18} />
                        </div>
                        {open && <span className="truncate">{item.label}</span>}
                        {/* tooltip quando fechado (desktop) */}
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

        {/* Ações rápidas / rodapé */}
        <div className="border-t border-white/10 p-4">
          {open ? (
            <div className="flex items-center justify-between">
              <button
                onClick={handleQuickHelp}
                className="text-xs text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg"
              >
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
