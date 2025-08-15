"use client"

import { NavLink } from "react-router-dom"
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
} from "lucide-react"
import { jwtDecode } from "jwt-decode"
import { useState, useEffect, useRef, useCallback } from "react"

// Mapeamento de templates para permissões (frontend)
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
}

// Hook personalizado para auto-hide CORRIGIDO
const useAutoHide = (open, setOpen, autoHideOnScroll = true) => {
  const [isMobile, setIsMobile] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollDirection, setScrollDirection] = useState("up")
  const [lastScrollY, setLastScrollY] = useState(0)

  const scrollTimeoutRef = useRef(null)

  // Hook personalizado para debounce
  const useDebounce = (callback, delay) => {
    const debounceRef = useRef(null)

    return useCallback(
      (...args) => {
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => callback(...args), delay)
      },
      [callback, delay],
    )
  }

  // Função debounced para parar o scroll
  const debouncedStopScrolling = useDebounce(() => {
    setIsScrolling(false)
  }, 150)

  // Handler para scroll com auto-hide CORRIGIDO
  const handleScroll = useCallback(
    (event) => {
      if (!autoHideOnScroll || !isMobile) return

      const currentScrollY = event.target.scrollTop
      const scrollDifference = Math.abs(currentScrollY - lastScrollY)

      // Só processar se houve scroll significativo (evita micro-scrolls)
      if (scrollDifference < 5) return

      const direction = currentScrollY > lastScrollY ? "down" : "up"

      setScrollDirection(direction)
      setIsScrolling(true)
      setLastScrollY(currentScrollY)

      // Auto-hide logic apenas para mobile
      if (direction === "down" && currentScrollY > 100 && open) {
        // Esconder sidebar ao fazer scroll para baixo (após 100px)
        setOpen(false)
      } else if (direction === "up" && currentScrollY < lastScrollY - 50) {
        // Mostrar sidebar ao fazer scroll para cima rapidamente
        setOpen(true)
      }

      // Reset do estado de scrolling após parar
      debouncedStopScrolling()

      // Clear timeout anterior
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // Mostrar sidebar após parar de fazer scroll por 2 segundos
      scrollTimeoutRef.current = setTimeout(() => {
        if (isMobile && !open && currentScrollY < 200) {
          setOpen(true)
        }
      }, 2000)
    },
    [autoHideOnScroll, isMobile, lastScrollY, open, setOpen, debouncedStopScrolling],
  )

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Cleanup dos timeouts
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  return {
    isMobile,
    isScrolling,
    scrollDirection,
    handleScroll,
    autoHideEnabled: autoHideOnScroll && isMobile,
  }
}

const AutoHideSidebar = ({ open, setOpen, autoHideOnScroll = true, onScrollHandler }) => {
  const [isTablet, setIsTablet] = useState(false)
  const { isMobile, isScrolling, scrollDirection, handleScroll, autoHideEnabled } = useAutoHide(
    open,
    setOpen,
    autoHideOnScroll,
  )

  // CORREÇÃO: Expor o handleScroll para o componente pai
  useEffect(() => {
    if (onScrollHandler) {
      onScrollHandler(handleScroll)
    }
  }, [handleScroll, onScrollHandler])

  // Detectar tamanho da tela e ajustar comportamento
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      const newIsMobile = width < 768
      const newIsTablet = width >= 768 && width < 1024

      setIsTablet(newIsTablet)

      // Auto-fechar em mobile, auto-abrir em desktop
      if (newIsMobile) {
        setOpen(false)
      } else if (width >= 1024) {
        setOpen(true)
      }
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [setOpen])

  // Classes responsivas para links
  const linkClasses = ({ isActive }) => {
    const baseClasses =
      "group flex items-center gap-3 rounded-lg transition-all duration-300 font-medium relative overflow-hidden"
    const sizeClasses = isMobile ? "px-4 py-3 text-base" : isTablet ? "px-3 py-2.5 text-sm" : "px-3 py-2 text-sm"

    const stateClasses = isActive
      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
      : "text-gray-300 hover:bg-gray-800/50 hover:text-white"

    return `${baseClasses} ${sizeClasses} ${stateClasses}`
  }

  // Obtém permissões do token
  const getPermissions = () => {
    const token = localStorage.getItem("token")
    if (!token) return []

    try {
      const { templates = [] } = jwtDecode(token)
      const setPerms = new Set()
      templates.forEach((tpl) => {
        const list = templatePermissionsMap[tpl.template_code] || []
        list.forEach((p) => setPerms.add(JSON.stringify(p)))
      })
      return Array.from(setPerms).map((p) => JSON.parse(p))
    } catch (err) {
      console.error("Erro ao decodificar token:", err)
      return []
    }
  }

  // Grupos de menu organizados
  const menuGroups = [
    {
      title: "Principal",
      items: [
        {
          path: "/dashboard",
          icon: <LayoutDashboard size={isMobile ? 24 : 20} />,
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
          icon: <List size={isMobile ? 24 : 20} />,
          label: "Categorias",
          permission: { module: "categorias", action: "visualizar" },
        },
        {
          path: "/tipos",
          icon: <Boxes size={isMobile ? 24 : 20} />,
          label: "Tipos",
          permission: { module: "tipos", action: "visualizar" },
        },
        {
          path: "/materiais",
          icon: <PackageCheck size={isMobile ? 24 : 20} />,
          label: "Materiais",
          permission: { module: "materiais", action: "visualizar" },
        },
        {
          path: "/movimentos",
          icon: <Repeat size={isMobile ? 24 : 20} />,
          label: "Movimentações",
          permission: { module: "movimentacoes", action: "visualizar" },
        },
        {
          path: "/requisicoes",
          icon: <FileText size={isMobile ? 24 : 20} />,
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
          icon: <FileText size={isMobile ? 24 : 20} />,
          label: "Relatórios",
          permission: { module: "relatorios", action: "visualizar" },
        },
        {
          path: "/recibos",
          icon: <Receipt size={isMobile ? 24 : 20} />,
          label: "Recibos",
          permission: { module: "recibo", action: "visualizar" },
        },
      ],
    },
    {
      title: "Sistema",
      items: [
        {
          path: "/utilizadores",
          icon: <Users size={isMobile ? 24 : 20} />,
          label: "Utilizadores",
          permission: { module: "utilizador", action: "visualizar" },
        },
        {
          path: "/materials-recycle",
          icon: <Recycle size={isMobile ? 24 : 20} />,
          label: "Reciclagem",
          permission: { module: "materiais", action: "eliminar" },
        },
      ],
    },
  ]

  // Filtrar itens baseado nas permissões
  const userPerms = getPermissions()
  const filteredMenuGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        userPerms.some((perm) => perm.module === item.permission.module && perm.action === item.permission.action),
      ),
    }))
    .filter((group) => group.items.length > 0)

  // Calcular largura responsiva
  const getSidebarWidth = () => {
    if (!open) return isMobile ? "w-0" : "w-16"
    if (isMobile) return "w-80"
    if (isTablet) return "w-64"
    return "w-72"
  }

  // Fechar sidebar ao clicar em link (mobile)
  const handleLinkClick = () => {
    if (isMobile) {
      setOpen(false)
    }
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Indicador de scroll (apenas para debug - remover em produção) */}
      {isMobile && autoHideOnScroll && (
        <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-xs lg:hidden">
          {isScrolling ? `Scrolling ${scrollDirection}` : "Stopped"} • Auto-hide: {autoHideEnabled ? "ON" : "OFF"}
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`${getSidebarWidth()} ${
          isMobile ? "fixed" : "relative"
        } bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white h-screen transition-all duration-500 flex flex-col shadow-2xl z-50 border-r border-gray-700 ${
          !open && isMobile ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b border-gray-700 ${isMobile ? "p-5" : "p-4"}`}>
          {open && (
            <div className="flex items-center gap-3">
              <div
                className={`${isMobile ? "w-10 h-10" : "w-8 h-8"} bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center`}
              >
                <LayoutDashboard size={isMobile ? 22 : 18} className="text-white" />
              </div>
              <div>
                <h1 className={`${isMobile ? "text-xl" : "text-lg"} font-bold text-white`}>Painel</h1>
                <p className={`${isMobile ? "text-sm" : "text-xs"} text-gray-400`}>Controlo</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setOpen(!open)}
            className={`bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow-lg transition-all duration-300 border border-gray-600 ${
              isMobile ? "p-3" : "p-2"
            }`}
            title={open ? "Fechar menu" : "Abrir menu"}
          >
            {isMobile ? (
              open ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )
            ) : open ? (
              <ChevronLeft size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>

        {/* Auto-hide indicator (mobile only) */}
        {isMobile && autoHideOnScroll && open && (
          <div className="px-4 py-2 bg-blue-900/30 border-b border-blue-700/50">
            <div className="flex items-center gap-2 text-xs text-blue-200">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Auto-hide ativo • Scroll para baixo para esconder</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav
          className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 ${isMobile ? "py-6 px-4" : "py-4 px-3"} space-y-6`}
        >
          {filteredMenuGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {open && (
                <h3
                  className={`font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3 ${
                    isMobile ? "text-sm" : "text-xs"
                  }`}
                >
                  {group.title}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink to={item.path} end className={linkClasses} onClick={handleLinkClick}>
                      <div className={`flex items-center justify-center ${isMobile ? "min-w-[24px]" : "min-w-[20px]"}`}>
                        {item.icon}
                      </div>
                      {open && <span className="flex-1 truncate">{item.label}</span>}
                      {/* Tooltip para modo collapsed (apenas desktop) */}
                      {!open && !isMobile && (
                        <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 border border-gray-600 shadow-lg">
                          {item.label}
                          <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-800 border-l border-b border-gray-600 rotate-45"></div>
                        </div>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Logo */}
        <div className={`border-t border-gray-700 ${isMobile ? "p-5" : "p-4"}`}>
          <div className="flex items-center justify-center">
            <img
              src="/info11.png"
              alt="Logo"
              className={`${
                open ? (isMobile ? "h-16 w-auto" : "h-12 w-auto") : "h-8 w-auto"
              } transition-all duration-300 max-w-full`}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className={`text-center text-gray-500 border-t border-gray-700 ${
            isMobile ? "px-5 py-4 text-sm" : "px-4 py-3 text-xs"
          }`}
        >
          {open ? "© 2025 Info São Tomé e Príncipe" : "© 2025"}
        </div>
      </aside>
    </>
  )
}

export default AutoHideSidebar
