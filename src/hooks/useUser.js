
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import api from "../api"

export const PERMISSION_TEMPLATES = [
  { code: "manage_category", label: "Gerir Categorias" },
  { code: "manage_users",    label: "Gerir Utilizadores" },
  { code: "manage_sales",    label: "Gerir Vendas" },
]

// ==== helpers ===============================================================
function parseJwtSafe(token) {
  try {
    const base64 = token.split(".")[1]
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json)
  } catch {
    return {}
  }
}


function normalizeUserDetail(raw) {
  const u = { ...raw }

  if (Array.isArray(u.templates) && u.templates.every(t => "template_code" in t)) {
    return u
  }

  if (Array.isArray(u.UserTemplates)) {
    u.templates = u.UserTemplates.map(ut => {
      const code =
        ut?.permissionTemplate?.template_code ??
        ut?.PermissionTemplate?.template_code ??
        ut?.permissionTemplates?.template_code ??
        ut?.template_code
      return {
        template_code: code,
        resource_type: ut?.resource_type ?? null,
        resource_id: ut?.resource_id ?? null,
      }
    }).filter(t => !!t.template_code)
    delete u.UserTemplates
    return u
  }

  u.templates = []
  return u
}

// ==== hook ==================================================================
export function useUser() {
  // -------- Auth (fixo) --------
  const decodedRef = useRef(null)
  if (!decodedRef.current && typeof window !== "undefined") {
    const t = localStorage.getItem("token")
    decodedRef.current = t ? parseJwtSafe(t) : {}
  }
  const decoded = decodedRef.current || {}
  const roles = Array.isArray(decoded.roles) ? decoded.roles : []
  const isAdmin = roles.includes("admin")

  const canView   = isAdmin || roles.length > 0
  const canCreate = isAdmin
  const canEdit   = isAdmin
  const canDelete = isAdmin

  // -------- Estado de dados/UI --------
  const [users, setUsers] = useState([])
  const [categoriasList, setCategoriasList] = useState([])
  const [loading, setLoading] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const [filter, setFilter] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(null)
  const [error, setError] = useState(null)

  // paginação simples
  const usersPerPage = 10
  const [currentPage, setCurrentPage] = useState(1)

  // -------- Requests --------
  const loadUsers = useCallback(async () => {
    if (!canView) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/users")
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setUsers(list)
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Falha ao carregar utilizadores.")
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

  useEffect(() => {
    if (!canView) return
    loadUsers()
    loadCategorias()
  }, [canView, loadUsers, loadCategorias])

  const openCreate = useCallback(() => {
    setEditingUser(null)
    setShowForm(true)
  }, [])

  const editarUsuario = useCallback(async (rowUser) => {
    setLoading(true)
    setError(null)
    try {
      // Busca os templates do usuário para preencher o modal corretamente
      const { data } = await api.get(`/users/${rowUser.user_id}`)
      const detail = normalizeUserDetail(data)
      setEditingUser({ ...rowUser, ...detail })
      setShowForm(true)
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Falha ao carregar detalhes do utilizador.")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDelete = useCallback(async (id) => {
    if (!canDelete || !id) return
    setDeleteLoading(id)
    setError(null)
    try {
      await api.delete(`/users/${id}`)
      setUsers(u => u.filter(x => x.user_id !== id))
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Não foi possível eliminar o utilizador.")
    } finally {
      setDeleteLoading(null)
    }
  }, [canDelete])

  // upload avatar (se houver endpoint no backend)
  const uploadAvatar = useCallback(async (file) => {
    const formData = new FormData()
    formData.append("file", file)
    const { data } = await api.post("/upload-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    if (!data?.url) throw new Error("Resposta inválida do upload.")
    return data.url
  }, [])

  // CRIAR/ATUALIZAR
  const saveUser = useCallback(async ({ isEdit, userId, payload }) => {
    // IMPORTANTÍSSIMO: adequar o payload ao contrato do backend
    try {
      if (isEdit) {
        // PUT /api/users/:id aceita estes campos (ver users.updateUser)
        const editPayload = {
          user_nome: payload.user_nome,
          user_email: payload.user_email,
          ...(payload.user_senha ? { user_senha: payload.user_senha } : {}),
          roles: payload.roles,
          templates: payload.templates,
          user_status: payload.user_status,
          user_tipo: payload.user_tipo,
        }
        await api.put(`/users/${userId}`, editPayload)
      } else {
        // POST /api/users (createuser) ACEITA APENAS:
        // user_nome, user_email, user_senha, roles, templates
        if (!payload.user_senha || payload.user_senha.length < 6) {
          throw new Error("A senha é obrigatória e deve ter pelo menos 6 caracteres.")
        }
        const createPayload = {
          user_nome: payload.user_nome,
          user_email: payload.user_email,
          user_senha: payload.user_senha,
          roles: payload.roles,
          templates: payload.templates,
        }
        await api.post(`/users`, createPayload)
      }

      await loadUsers()
      setShowForm(false)
      setEditingUser(null)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        (isEdit ? "Não foi possível atualizar o utilizador." : "Não foi possível criar o utilizador.")
      )
      // Repassa pra o form poder exibir também
      throw err
    }
  }, [loadUsers])

  // -------- Filtro + paginação --------
  const filtered = useMemo(() => {
    const f = (filter || "").toLowerCase().trim()
    if (!f) return users
    return users.filter(u =>
      (u.user_nome || "").toLowerCase().includes(f) ||
      (u.user_email || "").toLowerCase().includes(f)
    )
  }, [users, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / usersPerPage))

  const currentUsers = useMemo(() => {
    const start = (currentPage - 1) * usersPerPage
    return filtered.slice(start, start + usersPerPage)
  }, [filtered, currentPage])

  useEffect(() => { setCurrentPage(1) }, [filter])

  return {
    // perms
    isAdmin, canView, canCreate, canEdit, canDelete,

    // dados/ui
    users, categoriasList, loading, error, setError,
    showForm, setShowForm,
    editingUser, setEditingUser,
    filter, setFilter,
    deleteLoading,

    // paginação
    currentPage, setCurrentPage,
    usersPerPage, totalPages, currentUsers,

    // ações
    loadUsers, loadCategorias,
    openCreate, editarUsuario, handleDelete,
    uploadAvatar, saveUser,
  }
}
