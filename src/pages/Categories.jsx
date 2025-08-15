"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { jwtDecode } from "jwt-decode"
import {
  FolderPlus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Shield,
  Loader2,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Folder,
  Lock,
} from "lucide-react"

// Configuração do Axios
axios.defaults.baseURL = "http://localhost:3000/api"
axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token")}`

export default function CategoriesPage() {
  // Decodifica o JWT e verifica permissões
  const decoded = (() => {
    try {
      const token = localStorage.getItem("token")
      return token ? jwtDecode(token) : {}
    } catch {
      return {}
    }
  })()

  const roles = decoded.roles || []
  const isAdmin = roles.includes("admin")

  // Verifica se tem permissão para categorias
  const userPermissions = decoded.templates || []
  const categoryPermissions = userPermissions.filter((t) => t.template_code === "manage_category")
  const allowedCategoryIds = categoryPermissions.map((p) => Number.parseInt(p.resource_id)).filter(Boolean)

  // Controle de acesso
  const canViewCategories = isAdmin || categoryPermissions.length > 0
  const canCreateCategory = isAdmin
  const canEditCategory = isAdmin
  const canDeleteCategory = isAdmin

  // Estados
  const [allCategories, setAllCategories] = useState([])
  const [categories, setCategories] = useState([])
  const [newName, setNewName] = useState("")
  const [editing, setEditing] = useState(null)
  const [tempName, setTempName] = useState("")
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteLoading, setDeleteLoading] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  const categoriesPerPage = 10

  // Carrega categorias do backend
  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get("/categorias")
      const formattedCategories = data.map((c) => ({
        id: c.cat_id,
        name: c.cat_nome,
      }))

      setAllCategories(formattedCategories)

      // Filtra categorias baseado nas permissões
      if (isAdmin) {
        setCategories(formattedCategories)
      } else {
        const filteredCategories = formattedCategories.filter((cat) => allowedCategoryIds.includes(cat.id))
        setCategories(filteredCategories)
      }
    } catch (err) {
      console.error("Erro ao buscar categorias:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canViewCategories) {
      fetchCategories()
    }
  }, [canViewCategories])

  // Filtrar categorias por busca
  const filteredCategories = categories.filter((cat) => cat.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Paginação
  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage)
  const currentCategories = filteredCategories.slice(
    (currentPage - 1) * categoriesPerPage,
    currentPage * categoriesPerPage,
  )

  // Adicionar categoria
  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newName.trim() || !canCreateCategory) return

    setAddLoading(true)
    try {
      const { data } = await axios.post("/categorias", {
        cat_nome: newName.trim(),
      })

      const newCategory = { id: data.cat_id, name: data.cat_nome }
      setAllCategories((prev) => [...prev, newCategory])
      setCategories((prev) => [...prev, newCategory])
      setNewName("")
    } catch (err) {
      console.error("Erro ao adicionar categoria:", err)
      alert("Falha ao adicionar categoria: " + (err.response?.data?.message || err.message))
    } finally {
      setAddLoading(false)
    }
  }

  // Iniciar edição
  const handleEdit = (cat) => {
    if (!canEditCategory) return
    setEditing(cat.id)
    setTempName(cat.name)
  }

  // Salvar edição
  const handleSave = async () => {
    if (!tempName.trim() || !canEditCategory) return

    setSaveLoading(true)
    try {
      await axios.put(`/categorias/${editing}`, {
        cat_nome: tempName.trim(),
      })

      const updatedCategory = { id: editing, name: tempName.trim() }
      setAllCategories((prev) => prev.map((cat) => (cat.id === editing ? updatedCategory : cat)))
      setCategories((prev) => prev.map((cat) => (cat.id === editing ? updatedCategory : cat)))

      setEditing(null)
      setTempName("")
    } catch (err) {
      console.error("Erro ao editar categoria:", err)
      alert("Falha ao editar categoria: " + (err.response?.data?.message || err.message))
    } finally {
      setSaveLoading(false)
    }
  }

  // Cancelar edição
  const handleCancel = () => {
    setEditing(null)
    setTempName("")
  }

  // Apagar categoria
  const handleDelete = async (id) => {
    if (!canDeleteCategory) return
    if (!window.confirm("Deseja realmente excluir esta categoria?")) return

    setDeleteLoading(id)
    try {
      await axios.delete(`/categorias/${id}`)
      setAllCategories((prev) => prev.filter((cat) => cat.id !== id))
      setCategories((prev) => prev.filter((cat) => cat.id !== id))
    } catch (err) {
      console.error("Erro ao apagar categoria:", err)
      alert("Falha ao apagar categoria: " + (err.response?.data?.message || err.message))
    } finally {
      setDeleteLoading(null)
    }
  }

  // Verificação de acesso
  if (!canViewCategories) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Acesso Negado</h3>
              <p className="text-red-700 mt-1">Você não tem permissão para visualizar categorias.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Folder className="h-8 w-8 text-purple-600" />
                </div>
                Gerenciamento de Categorias
              </h1>
              <p className="text-gray-600 mt-2">
                {isAdmin
                  ? "Gerencie todas as categorias do sistema"
                  : `Você tem acesso a ${allowedCategoryIds.length} categoria${allowedCategoryIds.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Indicador de Permissões */}
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  Administrador
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  {allowedCategoryIds.length} Categoria{allowedCategoryIds.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formulário de Adicionar */}
        {canCreateCategory && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FolderPlus className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Nova Categoria</h2>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Nome da categoria..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={addLoading || !newName.trim()}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Adicionar
              </button>
            </form>
          </div>
        )}

        {/* Busca */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar categorias..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Lista de Categorias */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Lista de Categorias</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredCategories.length} categoria{filteredCategories.length !== 1 ? "s" : ""} encontrada
                  {filteredCategories.length !== 1 ? "s" : ""}
                </p>
              </div>

              {!isAdmin && allowedCategoryIds.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                  <AlertCircle className="h-4 w-4" />
                  Acesso limitado
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome da Categoria
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentCategories.map((cat, index) => (
                      <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                            {(currentPage - 1) * categoriesPerPage + index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editing === cat.id ? (
                            <input
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center gap-3">
                              <Folder className="h-5 w-5 text-purple-500" />
                              <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {editing === cat.id ? (
                              <>
                                <button
                                  onClick={handleSave}
                                  disabled={saveLoading || !tempName.trim()}
                                  className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50 transition-colors disabled:opacity-50"
                                  title="Salvar"
                                >
                                  {saveLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 transition-colors"
                                  title="Cancelar"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                {canEditCategory && (
                                  <button
                                    onClick={() => handleEdit(cat)}
                                    className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition-colors"
                                    title="Editar"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                )}
                                {canDeleteCategory && (
                                  <button
                                    onClick={() => handleDelete(cat.id)}
                                    disabled={deleteLoading === cat.id}
                                    className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                                    title="Excluir"
                                  >
                                    {deleteLoading === cat.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próxima
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando <span className="font-medium">{(currentPage - 1) * categoriesPerPage + 1}</span> a{" "}
                          <span className="font-medium">
                            {Math.min(currentPage * categoriesPerPage, filteredCategories.length)}
                          </span>{" "}
                          de <span className="font-medium">{filteredCategories.length}</span> categoria
                          {filteredCategories.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}

                {/* Estado vazio */}
                {filteredCategories.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <Folder className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {searchTerm ? "Nenhuma categoria encontrada" : "Nenhuma categoria disponível"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm
                        ? "Tente ajustar os termos de busca."
                        : isAdmin
                          ? "Comece criando uma nova categoria."
                          : "Você não tem acesso a nenhuma categoria."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
