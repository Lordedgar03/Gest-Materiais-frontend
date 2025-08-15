"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { jwtDecode } from "jwt-decode"
import {
  Shapes,
  PlusCircle,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Shield,
  EyeOff,
  Lock,
} from "lucide-react"

// Configuração do Axios
axios.defaults.baseURL = "http://localhost:3000/api"
axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token")}`

export default function TypesPage() {
  // Decodifica o JWT e extrai permissões de categoria
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

  // Permissões de categoria vêm em decoded.templates
  const userTemplates = decoded.templates || []
  const categoryTemplates = userTemplates.filter(t => t.template_code === "manage_category")
  const allowedCategoryIds = categoryTemplates
    .map(p => Number.parseInt(p.resource_id))
    .filter(Boolean)

  // helper: checa permissão numa categoria
  const canManageType = catId => isAdmin || allowedCategoryIds.includes(catId)

  // controle de visualização e habilitação do form de Novo Tipo
  const canView = isAdmin || allowedCategoryIds.length > 0
  const canShowAddForm = isAdmin || allowedCategoryIds.length > 0

  // Estados
  const [allCategories, setAllCategories] = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])
  const [allTypes, setAllTypes] = useState([])
  const [types, setTypes] = useState([])
  const [newName, setNewName] = useState("")
  const [newCatId, setNewCatId] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [tempName, setTempName] = useState("")
  const [tempCatId, setTempCatId] = useState("")
  const [loading, setLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const typesPerPage = 10

  // Busca categorias
  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get("/categorias")
      const formatted = data.map(c => ({ id: c.cat_id, name: c.cat_nome }))
      setAllCategories(formatted)

      // apenas categorias permitidas, a menos que admin
      const opts = isAdmin
        ? formatted
        : formatted.filter(cat => allowedCategoryIds.includes(cat.id))
      setCategoryOptions(opts)
      if (!newCatId && opts.length > 0) {
        setNewCatId(opts[0].id)
      }
    } catch (err) {
      console.error("Erro ao buscar categorias:", err)
    } finally {
      setLoading(false)
    }
  }

  // Busca tipos e filtra
  const fetchTypes = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get("/tipos")
      const formatted = data.map(t => ({
        id: t.tipo_id,
        name: t.tipo_nome,
        catId: t.tipo_fk_categoria,
      }))
      setAllTypes(formatted)

      const filtered = isAdmin
        ? formatted
        : formatted.filter(t => allowedCategoryIds.includes(t.catId))
      setTypes(filtered)
    } catch (err) {
      console.error("Erro ao buscar tipos:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canView) {
      fetchCategories()
      fetchTypes()
    }
  }, [canView])

  // Filtra por busca
  const filtered = types.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (allCategories.find(c => c.id === t.catId)?.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  // Paginação
  const totalPages = Math.ceil(filtered.length / typesPerPage)
  const current = filtered.slice(
    (currentPage - 1) * typesPerPage,
    currentPage * typesPerPage
  )

  // Adicionar tipo
  const handleAdd = async e => {
    e.preventDefault()
    // só pode adicionar em categorias permitidas
    if (!newName.trim() || !newCatId || !canManageType(Number(newCatId))) return
    setAddLoading(true)
    try {
      const { data } = await axios.post("/tipos", {
        tipo_nome: newName.trim(),
        tipo_fk_categoria: Number(newCatId),
      })
      const created = {
        id: data.tipo_id,
        name: data.tipo_nome,
        catId: data.tipo_fk_categoria,
      }
      setAllTypes(prev => [...prev, created])
      if (canManageType(created.catId)) {
        setTypes(prev => [...prev, created])
      }
      setNewName("")
    } catch (err) {
      console.error("Erro ao adicionar tipo:", err)
      alert("Falha ao adicionar tipo: " + (err.response?.data?.message || err.message))
    } finally {
      setAddLoading(false)
    }
  }

  // Iniciar edição
  const handleEdit = t => {
    if (!canManageType(t.catId)) return
    setEditingId(t.id)
    setTempName(t.name)
    setTempCatId(t.catId)
  }

  // Salvar edição
  const handleSave = async () => {
    if (!tempName.trim() || !tempCatId || !canManageType(Number(tempCatId))) return
    setSaveLoading(true)
    try {
      await axios.put(`/tipos/${editingId}`, {
        tipo_nome: tempName.trim(),
        tipo_fk_categoria: Number(tempCatId),
      })
      setAllTypes(prev =>
        prev.map(t =>
          t.id === editingId
            ? { ...t, name: tempName.trim(), catId: Number(tempCatId) }
            : t
        )
      )
      setTypes(prev =>
        prev.map(t =>
          t.id === editingId
            ? { ...t, name: tempName.trim(), catId: Number(tempCatId) }
            : t
        )
      )
      setEditingId(null)
      setTempName("")
      setTempCatId("")
    } catch (err) {
      console.error("Erro ao salvar tipo:", err)
      alert("Falha ao salvar tipo: " + (err.response?.data?.message || err.message))
    } finally {
      setSaveLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setTempName("")
    setTempCatId("")
  }

  // Deletar
  const handleDelete = async id => {
    const t = allTypes.find(x => x.id === id)
    if (!canManageType(t.catId)) return
    if (!window.confirm("Confirma exclusão deste tipo?")) return
    setDeleteLoading(id)
    try {
      await axios.delete(`/tipos/${id}`)
      setAllTypes(prev => prev.filter(t => t.id !== id))
      setTypes(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error("Erro ao deletar tipo:", err)
      alert("Falha ao deletar tipo: " + (err.response?.data?.message || err.message))
    } finally {
      setDeleteLoading(null)
    }
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-4">
          <Lock className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">Acesso Negado</h3>
            <p className="text-red-700">Você não tem permissão para visualizar tipos.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Shapes className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Tipos</h1>
            <p className="text-gray-600 mt-1">
              {isAdmin
                ? "Você pode ver todos os tipos"
                : `Você tem acesso a ${allowedCategoryIds.length} categoria${allowedCategoryIds.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      {/* Formulário de Adicionar */}
      {canShowAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Tipo</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Novo tipo..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={newCatId}
                onChange={e => setNewCatId(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={addLoading || !canManageType(newCatId)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {addLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <PlusCircle className="h-5 w-5 mr-2" />}
              Adicionar
            </button>
          </form>
        </div>
      )}

      {/* Busca */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            placeholder="Pesquisar tipos ou categorias..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Lista de Tipos */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {current.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * typesPerPage + idx + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === t.id ? (
                        <input
                          value={tempName}
                          onChange={e => setTempName(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        t.name
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === t.id ? (
                        <select
                          value={tempCatId}
                          onChange={e => setTempCatId(Number(e.target.value))}
                          className="border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        >
                          {categoryOptions.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      ) : (
                        allCategories.find(c => c.id === t.catId)?.name || "—"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === t.id ? (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={saveLoading || !canManageType(tempCatId)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md disabled:opacity-50"
                          >
                            {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(t)}
                            disabled={!canManageType(t.catId)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={!canManageType(t.catId) || deleteLoading === t.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
                          >
                            {deleteLoading === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                          {!canManageType(t.catId) && (
                            <EyeOff className="h-4 w-4 text-gray-400 ml-1" title="Sem permissão" />
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3">{currentPage} / {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
