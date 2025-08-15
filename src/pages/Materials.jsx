"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import {
  PlusCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  PackageCheck,
  Trash2,
  Pencil,
  Loader2,
  AlertCircle,
  Search,
  Shield,
  EyeOff,
  Package,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { toast } from "react-toastify"

// Configuração do Axios
axios.defaults.baseURL = "http://localhost:3000/api"
axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token")}`

function MaterialsImproved() {
  // Função para decodificar payload do JWT (JS puro)
  const parseJwt = (token) => {
    try {
      const base64 = token.split(".")[1]
      const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"))
      return JSON.parse(json)
    } catch {
      return {}
    }
  }

  // Extrai dados do token
  const decoded = (() => {
    const token = localStorage.getItem("token")
    return token ? parseJwt(token) : {}
  })()

  const roles = decoded.roles || []
  const isAdmin = roles.includes("admin")

  // Permissões de categoria
  const templates = decoded.templates || []
  const categoryTemplates = templates.filter((t) => t.template_code === "manage_category")
  const allowedCategoryIds = categoryTemplates.map((p) => Number(p.resource_id)).filter(Boolean)

  // Filtra tipos permitidos pelas categorias
  const [allowedTypeIds, setAllowedTypeIds] = useState([])

  // Helpers de permissão
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])

  // Recebe um tipoId, extrai sua categoria e verifica se está permitida
  const canManageType = (tipoId) => {
    if (isAdmin) return true
    const tipo = types.find((t) => t.tipo_id === Number(tipoId))
    return !!(tipo && allowedCategoryIds.includes(tipo.tipo_fk_categoria))
  }
  const canManageMaterial = (mat) => {
    if (isAdmin) return true
    return canManageType(mat.mat_fk_tipo)
  }

  // Controle de acesso
  const canView = isAdmin || allowedCategoryIds.length > 0
  const canCreate = isAdmin || allowedTypeIds.length > 0

  const [materials, setMaterials] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [filterText, setFilterText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedType, setSelectedType] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [stockFilter, setStockFilter] = useState("")

  const [formData, setFormData] = useState({
    mat_nome: "",
    mat_descricao: "",
    mat_preco: "",
    mat_quantidade_estoque: "",
    mat_estoque_minimo: "3",
    mat_fk_tipo: "",
    mat_localizacao: "",
    mat_vendavel: "SIM",
  })

  const [editingId, setEditingId] = useState(null)

  // ======= ESTADO DO MODAL DE REMOÇÃO =======
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // material inteiro
  const [deleteMode, setDeleteMode] = useState("partial") // 'partial' | 'all'
  const [deleteQty, setDeleteQty] = useState(1)
  const [deleteReason, setDeleteReason] = useState("")
  const [deleteErrors, setDeleteErrors] = useState({})

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

    if (!Number.isFinite(q) || q <= 0) {
      errs.qty = "Quantidade inválida."
    } else if (q > estoqueAtual) {
      errs.qty = `Quantidade maior que o estoque disponível (${estoqueAtual}).`
    }

    if (!deleteReason || deleteReason.trim().length < 3) {
      errs.reason = "Descreva o motivo (mín. 3 caracteres)."
    }

    setDeleteErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    if (!canManageMaterial(deleteTarget)) {
      toast.error("Sem permissão para excluir este material")
      return
    }
    if (!validateDelete()) return

    const id = deleteTarget.mat_id
    const quantidade = Number(deleteQty)
    const descricao = deleteReason.trim()
    const estoqueAtual = Number(deleteTarget.mat_quantidade_estoque) || 0

    try {
      const { data } = await axios.delete(`/materiais/${id}`, {
        data: { quantidade, descricao },
      })

      toast.success(
        data?.message ||
          (quantidade < estoqueAtual ? `Removidas ${quantidade} unidade(s).` : "Material removido com sucesso.")
      )
      closeDeleteModal()
      fetchMaterials()
    } catch (err) {
      console.error("Error deleting material:", err?.response?.data || err)
      const msg = err?.response?.data?.message || "Erro ao excluir material"
      setError(msg)
      toast.error(msg)
    }
  }

  // Buscar materiais
  const fetchMaterials = async (page = 1, search = "") => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`/materiais`, { params: { page, search } })
      let filteredMaterials = response.data
      filteredMaterials = isAdmin ? filteredMaterials : filteredMaterials.filter((m) => canManageMaterial(m))

      setMaterials(filteredMaterials)
      setTotalPages(Math.ceil(filteredMaterials.length / 10))
    } catch (err) {
      console.error("Error fetching materials:", err)
      setError(err?.response?.data?.message || "Failed to load materials")
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  // Buscar categorias permitidas
  const fetchCategories = async () => {
    try {
      const { data } = await axios.get("/categorias")
      const all = data.map((c) => ({ cat_id: c.cat_id, cat_nome: c.cat_nome }))
      setCategories(isAdmin ? all : all.filter((c) => allowedCategoryIds.includes(c.cat_id)))
    } catch (err) {
      console.error("Error fetching categories:", err)
      toast.error("Erro ao carregar categorias")
    }
  }

  // Buscar tipos permitidos
  const fetchTypes = async () => {
    try {
      const { data } = await axios.get("/tipos")
      const all = data.map((t) => ({
        tipo_id: t.tipo_id,
        tipo_nome: t.tipo_nome,
        tipo_fk_categoria: t.tipo_fk_categoria,
      }))
      const filtered = isAdmin ? all : all.filter((t) => allowedCategoryIds.includes(t.tipo_fk_categoria))
      setTypes(filtered)
      setAllowedTypeIds(filtered.map((t) => t.tipo_id))
    } catch (err) {
      console.error("Error fetching types:", err)
      toast.error("Erro ao carregar tipos")
    }
  }

  // Validação do formulário
  const validateForm = () => {
    const errors = {}
    if (!formData.mat_nome) errors.mat_nome = "Nome é obrigatório"

    if (!formData.mat_fk_tipo) {
      errors.mat_fk_tipo = "Tipo é obrigatório"
    } else if (!canManageType(formData.mat_fk_tipo)) {
      errors.mat_fk_tipo = "Sem permissão para este tipo"
    }

    if (!formData.mat_localizacao) errors.mat_localizacao = "Localização é obrigatória"
    if (isNaN(Number(formData.mat_preco)) || Number(formData.mat_preco) < 0) errors.mat_preco = "Preço inválido"
    if (isNaN(Number(formData.mat_quantidade_estoque)) || Number(formData.mat_quantidade_estoque) < 0) {
      errors.mat_quantidade_estoque = "Quantidade inválida"
    }
    if (isNaN(Number(formData.mat_estoque_minimo)) || Number(formData.mat_estoque_minimo) < 0) {
      errors.mat_estoque_minimo = "Estoque mínimo inválido"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Submeter formulário
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
      }

      if (editingId) {
        await axios.put(`/materiais/${editingId}`, payload)
        toast.success("Material atualizado com sucesso")
      } else {
        await axios.post(`/materiais`, payload)
        toast.success("Material criado com sucesso")
      }

      resetForm()
      fetchMaterials()
    } catch (err) {
      console.error("Submission error:", err?.response?.data || err)
      setError(err?.response?.data?.message || "Error saving material")
      toast.error(err?.response?.data?.message || "Erro ao salvar material")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Resetar formulário
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
    })
    setFormErrors({})
    setShowForm(false)
    setEditingId(null)
  }

  // Editar material
  const handleEdit = (mat) => {
    if (!canManageMaterial(mat)) {
      toast.error("Sem permissão para editar este material")
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
    })
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (!canView) return

    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        await fetchCategories()
        await fetchTypes()
        await fetchMaterials()
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
        setError("Erro ao carregar dados")
      } finally {
        setLoading(false)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView])

  // Carregar materiais quando filtros mudarem
  useEffect(() => {
    if (types.length > 0) {
      fetchMaterials(currentPage, filterText)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterText, types])

  // Filtrar materiais para exibição
  const filteredMaterials = materials.filter((material) => {
    const matchesText =
      material.mat_nome.toLowerCase().includes(filterText.toLowerCase()) ||
      (material.mat_descricao || "").toLowerCase().includes(filterText.toLowerCase())

    const matchesType = !selectedType || material.mat_fk_tipo.toString() === selectedType

    const materialType = types.find((t) => t.tipo_id === material.mat_fk_tipo)
    const matchesCategory =
      !selectedCategory || (materialType && materialType.tipo_fk_categoria.toString() === selectedCategory)

    const matchesStock =
      !stockFilter ||
      (stockFilter === "low" && material.mat_quantidade_estoque < material.mat_estoque_minimo) ||
      (stockFilter === "normal" && material.mat_quantidade_estoque >= material.mat_estoque_minimo)

    return matchesText && matchesType && matchesCategory && matchesStock
  })

  if (!canView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 flex items-center gap-4">
          <Shield className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800">Acesso Negado</h3>
            <p className="text-red-700">Você não tem permissão para ver materiais.</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading && materials.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="ml-2 text-gray-600">Carregando materiais...</span>
      </div>
    )
  }

  if (error && materials.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div>
            <h3 className="font-semibold text-red-800">Erro de Acesso</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const DeleteModal = () => {
    if (!deleteOpen || !deleteTarget) return null
    const estoqueAtual = Number(deleteTarget.mat_quantidade_estoque) || 0
    const saldo = Math.max(estoqueAtual - Number(deleteQty || 0), 0)
    const isAll = deleteMode === "all"

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* backdrop */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={closeDeleteModal}
          aria-hidden="true"
        />
        {/* modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {isAll ? (
                  <>
                    <XCircle className="text-red-600" />
                    Apagar Tudo — {deleteTarget.mat_nome}
                  </>
                ) : (
                  <>
                    <Trash2 className="text-red-600" />
                    Remover Unidades — {deleteTarget.mat_nome}
                  </>
                )}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Estoque atual: <strong>{estoqueAtual}</strong>
              </p>
            </div>
            <button
              onClick={closeDeleteModal}
              className="p-2 rounded hover:bg-gray-100"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Quantidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade a remover {isAll && "(máx.)"}
              </label>
              <input
                type="number"
                min={1}
                max={estoqueAtual}
                disabled={isAll}
                value={deleteQty}
                onChange={(e) => setDeleteQty(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 ${
                  deleteErrors.qty ? "border-red-500" : "border-gray-300"
                } ${isAll ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              {deleteErrors.qty && <p className="text-red-500 text-xs mt-1">{deleteErrors.qty}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Saldo ficará: <strong>{saldo}</strong>
              </p>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (obrigatório)</label>
              <textarea
                rows={3}
                placeholder={isAll ? "Ex.: Item descontinuado / perda total / inventário" : "Ex.: Danificado / vencido"}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 ${
                  deleteErrors.reason ? "border-red-500" : "border-gray-300"
                }`}
              />
              {deleteErrors.reason && <p className="text-red-500 text-xs mt-1">{deleteErrors.reason}</p>}
            </div>

            {/* Alerta */}
            <div className={`p-3 rounded-lg ${isAll ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
              <p className={`${isAll ? "text-red-700" : "text-amber-700"} text-sm`}>
                {isAll
                  ? "Atenção: esta ação remove TODO o estoque deste material. Se o saldo chegar a zero, o material será excluído."
                  : "Esta ação registra uma SAÍDA no histórico de movimentações com o motivo informado."}
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={closeDeleteModal}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              className={`px-4 py-2 rounded-lg text-white ${
                isAll ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {isAll ? "Apagar tudo" : "Remover unidades"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <PackageCheck className="text-blue-600" />
              Gestão de Materiais
            </h1>
            <p className="text-gray-600 mt-1">
              {isAdmin
                ? "Acesso total a todos os materiais"
                : `Acesso a ${categories.length} categoria(s) e ${types.length} tipo(s) de materiais`}
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => {
                setShowForm(!showForm)
                if (showForm) resetForm()
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showForm ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {showForm ? <XCircle size={18} /> : <PlusCircle size={18} />}
              {showForm ? "Cancelar" : "Novo Material"}
            </button>
          )}
        </div>

        {/* Permissões Info */}
        {!isAdmin && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
            <Shield className="text-blue-600" size={18} />
            <span className="text-blue-800 text-sm">
              Você tem acesso a {allowedCategoryIds.length} categoria(s) e {allowedTypeIds.length} tipo(s)
            </span>
          </div>
        )}
        {isAdmin && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
            <Shield className="text-green-600" size={18} />
            <span className="text-green-800 text-sm">Modo administrador: Acesso completo a todas as categorias e tipos</span>
          </div>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? "Editar Material" : "Adicionar Novo Material"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                placeholder="Nome do material"
                value={formData.mat_nome}
                onChange={(e) => setFormData({ ...formData, mat_nome: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                  formErrors.mat_nome ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.mat_nome && <p className="text-red-500 text-xs mt-1">{formErrors.mat_nome}</p>}
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                value={formData.mat_fk_tipo}
                onChange={(e) => setFormData({ ...formData, mat_fk_tipo: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                  formErrors.mat_fk_tipo ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Selecione um tipo</option>
                {types.map((t) => (
                  <option key={t.tipo_id} value={t.tipo_id} disabled={!canManageType(t.tipo_id)}>
                    {t.tipo_nome} ({categories.find((c) => c.cat_id === t.tipo_fk_categoria)?.cat_nome})
                  </option>
                ))}
              </select>
              {formErrors.mat_fk_tipo && <p className="text-red-500 text-xs mt-1">{formErrors.mat_fk_tipo}</p>}
            </div>

            {/* Preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (€)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.mat_preco}
                onChange={(e) => setFormData({ ...formData, mat_preco: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                  formErrors.mat_preco ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.mat_preco && <p className="text-red-500 text-xs mt-1">{formErrors.mat_preco}</p>}
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
              <input
                type="number"
                placeholder="0"
                value={formData.mat_quantidade_estoque}
                onChange={(e) => setFormData({ ...formData, mat_quantidade_estoque: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                  formErrors.mat_quantidade_estoque ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.mat_quantidade_estoque && (
                <p className="text-red-500 text-xs mt-1">{formErrors.mat_quantidade_estoque}</p>
              )}
            </div>

            {/* Estoque mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
              <input
                type="number"
                placeholder="3"
                value={formData.mat_estoque_minimo}
                onChange={(e) => setFormData({ ...formData, mat_estoque_minimo: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                  formErrors.mat_estoque_minimo ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.mat_estoque_minimo && (
                <p className="text-red-500 text-xs mt-1">{formErrors.mat_estoque_minimo}</p>
              )}
            </div>

            {/* Localização */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localização *</label>
              <input
                type="text"
                placeholder="Localização do armazém"
                value={formData.mat_localizacao}
                onChange={(e) => setFormData({ ...formData, mat_localizacao: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                  formErrors.mat_localizacao ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.mat_localizacao && (
                <p className="text-red-500 text-xs mt-1">{formErrors.mat_localizacao}</p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                placeholder="Descrição do material"
                value={formData.mat_descricao}
                onChange={(e) => setFormData({ ...formData, mat_descricao: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Vendável */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendável</label>
              <select
                value={formData.mat_vendavel}
                onChange={(e) => setFormData({ ...formData, mat_vendavel: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="SIM">Sim</option>
                <option value="NAO">Não</option>
              </select>
            </div>

            {/* Botões */}
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                {editingId ? "Atualizar Material" : "Salvar Material"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar materiais..."
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat.cat_id} value={cat.cat_id}>
                {cat.cat_nome}
              </option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os tipos</option>
            {types.map((type) => (
              <option key={type.tipo_id} value={type.tipo_id}>
                {type.tipo_nome}
              </option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os estoques</option>
            <option value="low">Estoque baixo</option>
            <option value="normal">Estoque normal</option>
          </select>
        </div>
      </div>

      {/* Tabela de Materiais */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center items-center">
            <Loader2 size={24} className="animate-spin text-blue-600" />
          </div>
        ) : filteredMaterials.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mín</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localização</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendável</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMaterials.map((mat) => {
                    const isLowStock = mat.mat_quantidade_estoque < mat.mat_estoque_minimo
                    const canManage = canManageMaterial(mat)
                    return (
                      <tr key={mat.mat_id} className={isLowStock ? "bg-red-50" : "hover:bg-gray-50"}>
                        <td className="px-6 py-4 text-sm text-gray-900">{mat.mat_id}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{mat.mat_nome}</div>
                          {mat.mat_descricao && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">{mat.mat_descricao}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">€ {Number(mat.mat_preco).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isLowStock ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                            {isLowStock ? (
                              <TrendingDown size={12} className="mr-1" />
                            ) : (
                              <TrendingUp size={12} className="mr-1" />
                            )}
                            {mat.mat_quantidade_estoque}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{mat.mat_estoque_minimo}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {types.find((t) => t.tipo_id === mat.mat_fk_tipo)?.tipo_nome || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{mat.mat_localizacao}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              mat.mat_vendavel === "SIM" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {mat.mat_vendavel === "SIM" ? "Sim" : "Não"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium flex justify-end gap-3">
                          <button
                            onClick={() => handleEdit(mat)}
                            disabled={!canManage}
                            className={canManage ? "text-blue-600" : "text-gray-400"}
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>

                          {/* Remover unidades (abre modal) */}
                          <button
                            onClick={() => openDeleteModal(mat, "partial")}
                            disabled={!canManage}
                            className={canManage ? "text-amber-600" : "text-gray-400"}
                            title="Remover unidades"
                          >
                            <Trash2 size={16} />
                          </button>

                          {/* Apagar tudo (abre modal com quantidade travada no total) */}
                          <button
                            onClick={() => openDeleteModal(mat, "all")}
                            disabled={!canManage}
                            className={canManage ? "text-red-600" : "text-gray-400"}
                            title="Apagar tudo"
                          >
                            <XCircle size={16} />
                          </button>

                          {!canManage && <EyeOff size={16} className="text-gray-400" title="Sem permissão" />}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-700">
                    Página <span className="font-medium">{currentPage}</span> de{" "}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                  <nav className="inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-2 border rounded-l disabled:opacity-50"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-2 border rounded-r disabled:opacity-50"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum material encontrado</h3>
            <p className="text-gray-600">
              {filterText || selectedType || selectedCategory || stockFilter
                ? "Tente ajustar os filtros de pesquisa."
                : "Comece criando seu primeiro material."}
            </p>
          </div>
        )}
      </div>

      {/* Modal de remoção */}
      <DeleteModal />
    </div>
  )
}

export default MaterialsImproved
