import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import api from "../api"

// (opcional) exportar para mostrar labels/ícones no form
export const PERMISSION_TEMPLATES = [
  { code: "manage_category", label: "Gerir Categorias" },
  { code: "manage_users",    label: "Gerir Usuários"   },
  { code: "manage_sales",    label: "Gerir Vendas"     },
]

// decode JWT sem depender de lib externa
function parseJwtSafe(token) {
  try {
    const base64 = token.split(".")[1]
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json)
  } catch {
    return {}
  }
}

export function useUser() {
  // -------- Auth (estático, fora de state p/ não causar re-render) --------
  const decodedRef = useRef(null)
  if (!decodedRef.current && typeof window !== "undefined") {
    const t = localStorage.getItem("token")
    decodedRef.current = t ? parseJwtSafe(t) : {}
  }
  const decoded = decodedRef.current || {}
  const roles = Array.isArray(decoded.roles) ? decoded.roles : []
  const isAdmin = roles.includes("admin")
  const canView = isAdmin || roles.length > 0
  const canCreate = isAdmin
  const canEdit = isAdmin
  const canDelete = isAdmin

  // -------- Estado de dados/UI --------
  const [users, setUsers] = useState([])
  const [categoriasList, setCategoriasList] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [filter, setFilter] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(null)

  const usersPerPage = 10
  const [currentPage, setCurrentPage] = useState(1)

  // -------- Requests --------
  const loadUsers = useCallback(async () => {
    if (!canView) return
    setLoading(true)
    try {
      const res = await api.get("/users")
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setUsers(list)
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // opcional: set erro
    } finally {
      setLoading(false)
    }
  }, [canView])

  const loadCategorias = useCallback(async () => {
    if (!canView) return
    try {
      const res = await api.get("/categorias")
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setCategoriasList(list)
    } catch {
      setCategoriasList([])
    }
  }, [canView])

  // roda 1x no mount (sem loops)
  useEffect(() => {
    if (!canView) return
    loadUsers()
    loadCategorias()
  }, [canView, loadUsers, loadCategorias])

  const editarUsuario = useCallback((user) => {
    if (!canEdit) return
    setEditingUser(user)
    setShowForm(true)
  }, [canEdit])

  const handleDelete = useCallback(async (id) => {
    if (!canDelete) return
    if (!window.confirm("Confirmar exclusão deste usuário?")) return
    setDeleteLoading(id)
    try {
      await api.delete(`/users/${id}`)
      setUsers(u => u.filter(x => x.user_id !== id))
    } catch { /* noop */ }
    finally {
      setDeleteLoading(null)
    }
  }, [canDelete])

  // upload avatar via API (multipart)
  const uploadAvatar = useCallback(async (file) => {
    const formData = new FormData()
    formData.append("file", file)
    const { data } = await api.post("/upload-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    // espere { url } do backend
    return data?.url
  }, [])

  // criar/atualizar
  const saveUser = useCallback(async ({ isEdit, userId, payload }) => {
    if (isEdit) {
      await api.put(`/users/${userId}`, payload)
    } else {
      await api.post(`/users`, payload)
    }
    await loadUsers()
    setShowForm(false)
    setEditingUser(null)
  }, [loadUsers])

  // -------- Filtro e paginação --------
  const filtered = useMemo(() => {
    const f = filter.toLowerCase()
    return users.filter(u =>
      (u.user_nome || "").toLowerCase().includes(f) ||
      (u.user_email || "").toLowerCase().includes(f)
    )
  }, [users, filter])

  const totalPages = Math.ceil(filtered.length / usersPerPage) || 1

  const currentUsers = useMemo(() => {
    const start = (currentPage - 1) * usersPerPage
    return filtered.slice(start, start + usersPerPage)
  }, [filtered, currentPage])

  return {
    // perms
    isAdmin, canView, canCreate, canEdit, canDelete,

    // dados e ui
    users, categoriasList, loading,
    showForm, setShowForm,
    editingUser, setEditingUser,
    filter, setFilter,
    deleteLoading,
    currentPage, setCurrentPage,
    usersPerPage, totalPages, currentUsers,

    // ações
    loadUsers, loadCategorias,
    editarUsuario, handleDelete,
    uploadAvatar, saveUser,
  }
}
