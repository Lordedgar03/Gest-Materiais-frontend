import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import api from "../api"

// Decode JWT sem lib externa
function parseJwtSafe(token) {
  try {
    const base64 = token.split(".")[1]
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json)
  } catch {
    return {}
  }
}

export function useCategories() {
  // ----- Auth estável (lido 1x) -----
  const decodedRef = useRef(null)
  if (!decodedRef.current && typeof window !== "undefined") {
    const t = localStorage.getItem("token")
    decodedRef.current = t ? parseJwtSafe(t) : {}
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const decoded = decodedRef.current || {}

  // IMPORTANTES: memozar tudo que entra nas deps
  const roles = useMemo(() => (Array.isArray(decoded.roles) ? decoded.roles : []), [decoded])
  const isAdmin = useMemo(() => roles.includes("admin"), [roles])

  const userTemplates = useMemo(
    () => (Array.isArray(decoded.templates) ? decoded.templates : []),
    [decoded]
  )
  const categoryTemplates = useMemo(
    () => userTemplates.filter((t) => t.template_code === "manage_category"),
    [userTemplates]
  )
  const allowedCategoryIds = useMemo(
    () =>
      categoryTemplates
        .map((p) => Number.parseInt(p.resource_id))
        .filter(Number.isFinite),
    [categoryTemplates]
  )

  const canViewCategories = useMemo(
    () => isAdmin || categoryTemplates.length > 0,
    [isAdmin, categoryTemplates.length]
  )
  const canCreateCategory = isAdmin
  const canEditCategory = isAdmin
  const canDeleteCategory = isAdmin

  // ----- Estado -----
  const [allCategories, setAllCategories] = useState([])
  const [categories, setCategories] = useState([])
  const [newName, setNewName] = useState("")
  const [editing, setEditing] = useState(null)
  const [tempName, setTempName] = useState("")
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  // Filtro/paginação
  const [searchTerm, setSearchTerm] = useState("")
  const categoriesPerPage = 10
  const [currentPage, setCurrentPage] = useState(1)

  // ----- Requests -----
  const fetchCategories = useCallback(async () => {
    if (!canViewCategories) return
    setLoading(true)
    try {
      const { data } = await api.get("/categorias")
      const formatted = (Array.isArray(data) ? data : data?.data || []).map((c) => ({
        id: c.cat_id,
        name: c.cat_nome,
      }))

      // evita setState desnecessário (reduz re-render)
      const nextAll = formatted
      const nextVisible = isAdmin
        ? nextAll
        : nextAll.filter((cat) => allowedCategoryIds.includes(cat.id))

      setAllCategories((prev) =>
        JSON.stringify(prev) === JSON.stringify(nextAll) ? prev : nextAll
      )
      setCategories((prev) =>
        JSON.stringify(prev) === JSON.stringify(nextVisible) ? prev : nextVisible
      )
    } finally {
      setLoading(false)
    }
  }, [canViewCategories, isAdmin, allowedCategoryIds])

  // Opcional: proteção contra StrictMode (efeitos duplicados em dev)
  const didFetchRef = useRef(false)
  useEffect(() => {
    if (!canViewCategories) return
    // eslint-disable-next-line no-undef
    if (process.env.NODE_ENV !== "production") {
      if (didFetchRef.current) return
      didFetchRef.current = true
    }
    fetchCategories()
  }, [canViewCategories, fetchCategories])

  // ----- Ações -----
  const startEdit = useCallback(
    (cat) => {
      if (!canEditCategory) return
      setEditing(cat.id)
      setTempName(cat.name)
    },
    [canEditCategory]
  )

  const cancelEdit = useCallback(() => {
    setEditing(null)
    setTempName("")
  }, [])

  const saveEdit = useCallback(async () => {
    if (!canEditCategory || !editing || !tempName.trim()) return
    setSaveLoading(true)
    try {
      await api.put(`/categorias/${editing}`, { cat_nome: tempName.trim() })
      const updated = { id: editing, name: tempName.trim() }
      setAllCategories((prev) => prev.map((c) => (c.id === editing ? updated : c)))
      setCategories((prev) => prev.map((c) => (c.id === editing ? updated : c)))
      setEditing(null)
      setTempName("")
    } finally {
      setSaveLoading(false)
    }
  }, [canEditCategory, editing, tempName])

  const addCategory = useCallback(
    async (name) => {
      if (!canCreateCategory || !name.trim()) return
      setAddLoading(true)
      try {
        const { data } = await api.post("/categorias", { cat_nome: name.trim() })
        const newCat = { id: data.cat_id, name: data.cat_nome }
        setAllCategories((prev) => [...prev, newCat])
        if (isAdmin || allowedCategoryIds.includes(newCat.id)) {
          setCategories((prev) => [...prev, newCat])
        }
        setNewName("")
      } finally {
        setAddLoading(false)
      }
    },
    [canCreateCategory, isAdmin, allowedCategoryIds]
  )

  const deleteCategory = useCallback(
    async (id) => {
      if (!canDeleteCategory) return
      setDeleteLoading(id)
      try {
        await api.delete(`/categorias/${id}`)
        setAllCategories((prev) => prev.filter((c) => c.id !== id))
        setCategories((prev) => prev.filter((c) => c.id !== id))
      } finally {
        setDeleteLoading(null)
      }
    },
    [canDeleteCategory]
  )

  // ----- Filtro / paginação -----
  const filteredCategories = useMemo(() => {
    const s = searchTerm.toLowerCase()
    return categories.filter((c) => c.name.toLowerCase().includes(s))
  }, [categories, searchTerm])

  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage) || 1

  const currentCategories = useMemo(() => {
    const start = (currentPage - 1) * categoriesPerPage
    return filteredCategories.slice(start, start + categoriesPerPage)
  }, [filteredCategories, currentPage])

  return {
    // Permissões / header
    isAdmin, allowedCategoryIds,
    canViewCategories, canCreateCategory, canEditCategory, canDeleteCategory,

    // Dados/estado
    allCategories, categories,
    newName, setNewName,
    editing, tempName, setTempName,
    loading, deleteLoading, saveLoading, addLoading,

    // Filtro/paginação
    searchTerm, setSearchTerm,
    currentPage, setCurrentPage,
    categoriesPerPage, totalPages,
    filteredCategories, currentCategories,

    // Ações
    fetchCategories,
    startEdit, cancelEdit, saveEdit,
    addCategory, deleteCategory,
  }
}
