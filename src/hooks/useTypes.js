import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import api from "../api"

// Decode JWT sem dependências externas
function parseJwtSafe(token) {
  try {
    const base64 = token.split(".")[1]
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json)
  } catch {
    return {}
  }
}

export function useTypes() {
  // ---------- Auth estável ----------
  const decodedRef = useRef(null)
  if (!decodedRef.current && typeof window !== "undefined") {
    const t = localStorage.getItem("token")
    decodedRef.current = t ? parseJwtSafe(t) : {}
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const decoded = decodedRef.current || {}

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

  // Visualização/permissões
  const canView = useMemo(
    () => isAdmin || allowedCategoryIds.length > 0,
    [isAdmin, allowedCategoryIds.length]
  )
  const canManageType = useCallback(
    (catId) => isAdmin || allowedCategoryIds.includes(Number(catId)),
    [isAdmin, allowedCategoryIds]
  )

  // ---------- Estado ----------
  const [allCategories, setAllCategories] = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])
  const [allTypes, setAllTypes] = useState([])
  const [types, setTypes] = useState([])

  // form add
  const [newName, setNewName] = useState("")
  const [newCatId, setNewCatId] = useState("")
  const defaultCatSetRef = useRef(false) // não resetar cat padrão toda hora

  // edição
  const [editingId, setEditingId] = useState(null)
  const [tempName, setTempName] = useState("")
  const [tempCatId, setTempCatId] = useState("")

  // ui
  const [loading, setLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const typesPerPage = 10
  const [currentPage, setCurrentPage] = useState(1)

  // ---------- Requests ----------
  const fetchCategories = useCallback(async () => {
    if (!canView) return
    setLoading(true)
    try {
      const { data } = await api.get("/categorias")
      const list = (Array.isArray(data) ? data : data?.data || []).map((c) => ({
        id: c.cat_id,
        name: c.cat_nome,
      }))

      const nextOpts = isAdmin ? list : list.filter((cat) => allowedCategoryIds.includes(cat.id))

      // evita setState redundante
      const sameAll = JSON.stringify(allCategories) === JSON.stringify(list)
      const sameOpts = JSON.stringify(categoryOptions) === JSON.stringify(nextOpts)

      if (!sameAll) setAllCategories(list)
      if (!sameOpts) setCategoryOptions(nextOpts)

      // define categoria padrão no form de ADD apenas 1x
      if (!defaultCatSetRef.current && nextOpts.length > 0) {
        setNewCatId(nextOpts[0].id)
        defaultCatSetRef.current = true
      }
    } finally {
      setLoading(false)
    }
  }, [canView, isAdmin, allowedCategoryIds, allCategories, categoryOptions])

  const fetchTypes = useCallback(async () => {
    if (!canView) return
    setLoading(true)
    try {
      const { data } = await api.get("/tipos")
      const list = (Array.isArray(data) ? data : data?.data || []).map((t) => ({
        id: t.tipo_id,
        name: t.tipo_nome,
        catId: t.tipo_fk_categoria,
      }))

      const visible = isAdmin ? list : list.filter((t) => allowedCategoryIds.includes(t.catId))

      const sameAll = JSON.stringify(allTypes) === JSON.stringify(list)
      const sameVis = JSON.stringify(types) === JSON.stringify(visible)

      if (!sameAll) setAllTypes(list)
      if (!sameVis) setTypes(visible)
    } finally {
      setLoading(false)
    }
  }, [canView, isAdmin, allowedCategoryIds, allTypes, types])

  // Evita duplo fetch no StrictMode
  const didFetchRef = useRef(false)
  useEffect(() => {
    if (!canView) return
    // eslint-disable-next-line no-undef
    if (process.env.NODE_ENV !== "production") {
      if (didFetchRef.current) return
      didFetchRef.current = true
    }
    fetchCategories()
    fetchTypes()
  }, [canView, fetchCategories, fetchTypes])

  // ---------- Ações ----------
  const addType = useCallback(
    async (e) => {
      e?.preventDefault?.()
      if (!newName.trim() || !newCatId || !canManageType(newCatId)) return
      setAddLoading(true)
      try {
        const { data } = await api.post("/tipos", {
          tipo_nome: newName.trim(),
          tipo_fk_categoria: Number(newCatId),
        })
        const created = { id: data.tipo_id, name: data.tipo_nome, catId: data.tipo_fk_categoria }
        setAllTypes((prev) => [...prev, created])
        if (canManageType(created.catId)) setTypes((prev) => [...prev, created])
        setNewName("")
      } finally {
        setAddLoading(false)
      }
    },
    [newName, newCatId, canManageType]
  )

  const startEdit = useCallback(
    (t) => {
      if (!canManageType(t.catId)) return
      setEditingId(t.id)
      setTempName(t.name)
      setTempCatId(t.catId)
    },
    [canManageType]
  )

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setTempName("")
    setTempCatId("")
  }, [])

  const saveEdit = useCallback(async () => {
    if (!editingId || !tempName.trim() || !tempCatId || !canManageType(tempCatId)) return
    setSaveLoading(true)
    try {
      await api.put(`/tipos/${editingId}`, {
        tipo_nome: tempName.trim(),
        tipo_fk_categoria: Number(tempCatId),
      })
      setAllTypes((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, name: tempName.trim(), catId: Number(tempCatId) } : t))
      )
      setTypes((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, name: tempName.trim(), catId: Number(tempCatId) } : t))
      )
      setEditingId(null)
      setTempName("")
      setTempCatId("")
    } finally {
      setSaveLoading(false)
    }
  }, [editingId, tempName, tempCatId, canManageType])

  const deleteType = useCallback(
    async (id) => {
      const t = allTypes.find((x) => x.id === id)
      if (!t || !canManageType(t.catId)) return
      if (!window.confirm("Confirma exclusão deste tipo?")) return
      setDeleteLoading(id)
      try {
        await api.delete(`/tipos/${id}`)
        setAllTypes((prev) => prev.filter((x) => x.id !== id))
        setTypes((prev) => prev.filter((x) => x.id !== id))
      } finally {
        setDeleteLoading(null)
      }
    },
    [allTypes, canManageType]
  )

  // ---------- Filtro / paginação ----------
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return types.filter((t) => {
      const catName = allCategories.find((c) => c.id === t.catId)?.name || ""
      return t.name.toLowerCase().includes(q) || catName.toLowerCase().includes(q)
    })
  }, [types, allCategories, searchTerm])

  const totalPages = Math.ceil(filtered.length / typesPerPage) || 1
  const current = useMemo(() => {
    const start = (currentPage - 1) * typesPerPage
    return filtered.slice(start, start + typesPerPage)
  }, [filtered, currentPage, typesPerPage])

  return {
    // perms / helpers
    isAdmin, allowedCategoryIds, canView, canManageType,

    // dados
    allCategories, categoryOptions,
    allTypes, types,

    // add form
    newName, setNewName,
    newCatId, setNewCatId,

    // edição
    editingId, tempName, setTempName, tempCatId, setTempCatId,

    // ui
    loading, addLoading, saveLoading, deleteLoading,

    // filtro/paginação
    searchTerm, setSearchTerm,
    currentPage, setCurrentPage,
    typesPerPage, totalPages, current,

    // ações
    fetchCategories, fetchTypes,
    addType, startEdit, cancelEdit, saveEdit, deleteType,
  }
}
