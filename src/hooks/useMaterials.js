import { useEffect, useMemo, useRef, useState } from "react"
import api from "../api" // ajusta o caminho se necessário

// Decodifica JWT de forma segura
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1]
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json)
  } catch {
    return {}
  }
}

export function useMaterials() {
  /** ===== Permissões (estáticas na montagem) ===== */
  const decodedRef = useRef(null)
  if (!decodedRef.current && typeof window !== "undefined") {
    const token = localStorage.getItem("token")
    decodedRef.current = token ? parseJwt(token) : {}
  }
  const decoded = decodedRef.current || {}
  const roles = decoded.roles || []
  const isAdmin = roles.includes("admin")

  const categoryTemplates = (decoded.templates || []).filter(
    (t) => t.template_code === "manage_category"
  )
  const allowedCategoryIds = categoryTemplates
    .map((p) => Number(p.resource_id))
    .filter(Boolean)

  /** ===== Estados ===== */
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [materials, setMaterials] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filtros / paginação
  const [filterText, setFilterText] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [stockFilter, setStockFilter] = useState("")
  const [consumivelFilter, setConsumivelFilter] = useState("") // "", "sim", "não"
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Form
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    mat_nome: "",
    mat_descricao: "",
    mat_preco: "",
    mat_quantidade_estoque: "",
    mat_estoque_minimo: "3",
    mat_fk_tipo: "",
    mat_localizacao: "",
    mat_vendavel: "SIM",
    mat_consumivel: "não",
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // Remoção (modal)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteMode, setDeleteMode] = useState("partial") // 'partial' | 'all'
  const [deleteQty, setDeleteQty] = useState(1)
  const [deleteReason, setDeleteReason] = useState("")
  const [deleteErrors, setDeleteErrors] = useState({})

  /** ===== Helpers de permissão ===== */
  const canManageType = (tipoId) => {
    if (isAdmin) return true
    const tipo = types.find((t) => t.tipo_id === Number(tipoId))
    return !!(tipo && allowedCategoryIds.includes(tipo.tipo_fk_categoria))
  }
  const canManageMaterial = (mat) => {
    if (isAdmin) return true
    return canManageType(mat.mat_fk_tipo)
  }

  const canView = isAdmin || allowedCategoryIds.length > 0
  const allowedTypeIds = useMemo(
    () =>
      types
        .filter(
          (t) => isAdmin || allowedCategoryIds.includes(t.tipo_fk_categoria)
        )
        .map((t) => t.tipo_id),
    [types, isAdmin, allowedCategoryIds]
  )
  const canCreate = isAdmin || allowedTypeIds.length > 0

  /** ===== Carregamento inicial ===== */
  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!canView) return
      setLoading(true)
      setError(null)
      try {
        // 1) categorias
        const catRes = await api.get("/categorias")
        const allCats = (catRes.data?.data ?? catRes.data ?? []).map((c) => ({
          cat_id: c.cat_id,
          cat_nome: c.cat_nome,
        }))
        const cats = isAdmin
          ? allCats
          : allCats.filter((c) => allowedCategoryIds.includes(c.cat_id))

        // 2) tipos
        const typRes = await api.get("/tipos")
        const allTypes = (typRes.data?.data ?? typRes.data ?? []).map((t) => ({
          tipo_id: t.tipo_id,
          tipo_nome: t.tipo_nome,
          tipo_fk_categoria: t.tipo_fk_categoria,
        }))
        const typs = isAdmin
          ? allTypes
          : allTypes.filter((t) =>
              allowedCategoryIds.includes(t.tipo_fk_categoria)
            )

        // 3) materiais
        const matRes = await api.get("/materiais")
        const list = Array.isArray(matRes.data?.data)
          ? matRes.data.data
          : matRes.data
        const mats = isAdmin
          ? list
          : list.filter((m) => {
              const t = typs.find((tt) => tt.tipo_id === m.mat_fk_tipo)
              return !!t
            })

        if (!mounted) return
        setCategories(cats)
        setTypes(typs)
        setMaterials(mats)
      } catch (e) {
        console.error(e)
        if (mounted) setError("Erro ao carregar dados")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** ===== (Re)carregar materiais ===== */
  const refetchMaterials = async () => {
    try {
      const res = await api.get("/materiais")
      const list = Array.isArray(res.data?.data) ? res.data.data : res.data
      const mats = isAdmin ? list : list.filter((m) => canManageMaterial(m))
      setMaterials(mats)
    } catch (e) {
      console.error(e)
      setError("Erro ao carregar materiais")
    }
  }

  /** ===== Filtro client-side ===== */
  const filteredMaterials = useMemo(() => {
    const text = filterText.trim().toLowerCase()
    return materials.filter((material) => {
      const matchesText =
        material.mat_nome.toLowerCase().includes(text) ||
        (material.mat_descricao || "").toLowerCase().includes(text)

      const matchesType =
        !selectedType ||
        String(material.mat_fk_tipo) === String(selectedType)

      const mType = types.find((t) => t.tipo_id === material.mat_fk_tipo)
      const matchesCategory =
        !selectedCategory ||
        (mType &&
          String(mType.tipo_fk_categoria) === String(selectedCategory))

      const qty = Number(material.mat_quantidade_estoque)
      const min = Number(material.mat_estoque_minimo)
      const matchesStock =
        !stockFilter ||
        (stockFilter === "low" && qty < min) ||
        (stockFilter === "normal" && qty >= min)

      const matchesConsumivel =
        !consumivelFilter || material.mat_consumivel === consumivelFilter

      return (
        matchesText &&
        matchesType &&
        matchesCategory &&
        matchesStock &&
        matchesConsumivel
      )
    })
  }, [
    materials,
    types,
    filterText,
    selectedType,
    selectedCategory,
    stockFilter,
    consumivelFilter,
  ])

  // paginação
  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / pageSize))
  const pageMaterials = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredMaterials.slice(start, start + pageSize)
  }, [filteredMaterials, currentPage])

  // reset de página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [filterText, selectedType, selectedCategory, stockFilter, consumivelFilter])

  /** ===== Form ===== */
  const validateForm = () => {
    const errors = {}
    if (!formData.mat_nome) errors.mat_nome = "Nome é obrigatório"

    if (!formData.mat_fk_tipo) {
      errors.mat_fk_tipo = "Tipo é obrigatório"
    } else if (!canManageType(formData.mat_fk_tipo)) {
      errors.mat_fk_tipo = "Sem permissão para este tipo"
    }

    if (!formData.mat_localizacao)
      errors.mat_localizacao = "Localização é obrigatória"
    if (
      isNaN(Number(formData.mat_preco)) ||
      Number(formData.mat_preco) < 0
    )
      errors.mat_preco = "Preço inválido"

    const q = Number(formData.mat_quantidade_estoque)
    if (isNaN(q) || q < 0) errors.mat_quantidade_estoque = "Quantidade inválida"

    const min = Number(formData.mat_estoque_minimo)
    if (isNaN(min) || min < 0)
      errors.mat_estoque_minimo = "Estoque mínimo inválido"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        mat_preco: Number(formData.mat_preco),
        mat_quantidade_estoque: Number(formData.mat_quantidade_estoque),
        mat_estoque_minimo: Number(formData.mat_estoque_minimo),
        mat_fk_tipo: Number(formData.mat_fk_tipo),
        // mat_consumivel já está "sim"/"não"
      }
      if (editingId) {
        await api.put(`/materiais/${editingId}`, payload)
      } else {
        await api.post(`/materiais`, payload)
      }
      resetForm()
      await refetchMaterials()
    } catch (err) {
      console.error(err?.response?.data || err)
      setError(err?.response?.data?.message || "Erro ao salvar material")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (mat) => {
    if (!canManageMaterial(mat)) {
      window.alert("Sem permissão para editar este material")
      return
    }
    setShowForm(true)
    setEditingId(mat.mat_id)
    setFormData({
      mat_nome: mat.mat_nome,
      mat_descricao: mat.mat_descricao,
      mat_preco: mat.mat_preco,
      mat_quantidade_estoque: mat.mat_quantidade_estoque,
      mat_estoque_minimo: mat.mat_estoque_minimo,
      mat_fk_tipo: mat.mat_fk_tipo,
      mat_localizacao: mat.mat_localizacao,
      mat_vendavel: mat.mat_vendavel,
      mat_consumivel: mat.mat_consumivel ?? "não",
    })
  }

  const resetForm = () => {
    setFormData({
      mat_nome: "",
      mat_descricao: "",
      mat_preco: "",
      mat_quantidade_estoque: "",
      mat_estoque_minimo: "3",
      mat_fk_tipo: "",
      mat_localizacao: "",
      mat_vendavel: "SIM",
      mat_consumivel: "não",
    })
    setFormErrors({})
    setShowForm(false)
    setEditingId(null)
  }

  /** ===== Remoção ===== */
  const openDeleteModal = (material, mode = "partial") => {
    const estoqueAtual = Number(material.mat_quantidade_estoque) || 0
    setDeleteTarget(material)
    setDeleteMode(mode)
    setDeleteQty(mode === "all" ? estoqueAtual : Math.min(1, estoqueAtual) || 1)
    setDeleteReason("")
    setDeleteErrors({})
    setDeleteOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteOpen(false)
    setDeleteTarget(null)
    setDeleteMode("partial")
    setDeleteQty(1)
    setDeleteReason("")
    setDeleteErrors({})
  }

  const validateDelete = () => {
    const errs = {}
    const estoqueAtual = Number(deleteTarget?.mat_quantidade_estoque) || 0
    const q = Number(deleteQty)
    if (!Number.isFinite(q) || q <= 0) errs.qty = "Quantidade inválida."
    else if (q > estoqueAtual)
      errs.qty = `Quantidade maior que o estoque disponível (${estoqueAtual}).`
    if (!deleteReason || deleteReason.trim().length < 3)
      errs.reason = "Descreva o motivo (mín. 3 caracteres)."
    setDeleteErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    if (!canManageMaterial(deleteTarget)) {
      window.alert("Sem permissão para excluir este material")
      return
    }
    if (!validateDelete()) return

    const id = deleteTarget.mat_id
    const quantidade = Number(deleteQty)
    const descricao = deleteReason.trim()
    const estoqueAtual = Number(deleteTarget.mat_quantidade_estoque) || 0

    try {
      await api.delete(`/materiais/${id}`, { data: { quantidade, descricao } })
      if (quantidade < estoqueAtual) {
        console.log(`Removidas ${quantidade} unidade(s).`)
      } else {
        console.log("Material removido com sucesso.")
      }
      closeDeleteModal()
      await refetchMaterials()
    } catch (err) {
      console.error(err?.response?.data || err)
      setError(err?.response?.data?.message || "Erro ao excluir material")
    }
  }

  return {
    // permissões
    isAdmin,
    canView,
    canCreate,
    canManageMaterial,
    allowedCategoryIds,
    allowedTypeIds,

    // dados/erro/loading
    categories,
    types,
    materials,
    loading,
    error,

    // filtros/paginação
    filterText,
    setFilterText,
    selectedType,
    setSelectedType,
    selectedCategory,
    setSelectedCategory,
    stockFilter,
    setStockFilter,
    consumivelFilter,
    setConsumivelFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredMaterials,
    pageMaterials,

    // form
    showForm,
    setShowForm,
    formData,
    setFormData,
    formErrors,
    isSubmitting,
    editingId,
    handleSubmit,
    handleEdit,
    resetForm,

    // remoção
    deleteOpen,
    deleteTarget,
    deleteMode,
    deleteQty,
    setDeleteQty,
    deleteReason,
    setDeleteReason,
    deleteErrors,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete,
  }
}
