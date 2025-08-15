"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { jwtDecode } from "jwt-decode"
import {
  Users,
  PlusCircle,
  XCircle,
  Edit,
  Trash2,
  UserPlus,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  Mail,
  Settings,
  X,
  Camera,
  CheckCircle,
} from "lucide-react"

// Configuração do Axios
axios.defaults.baseURL = "http://localhost:3000/api"
axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token")}`

// Templates de permissão disponíveis
const PERMISSION_TEMPLATES = [
  { code: "manage_category", label: "Gerir Categorias", icon: Settings },
  { code: "manage_users", label: "Gerir Usuários", icon: Users },
  { code: "manage_sales", label: "Gerir Vendas", icon: Shield },
]

function UsersPage() {
  // Decodifica o JWT
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

  // Controle de acesso
  const canView = isAdmin || roles.length > 0
  const canCreate = isAdmin
  const canEdit = isAdmin
  const canDelete = isAdmin

  // Estados
  const [users, setUsers] = useState([])
  const [categoriasList, setCategoriasList] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [filter, setFilter] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 10

  // Carregar dados
  useEffect(() => {
    if (canView) {
      loadUsers()
      loadCategorias()
    }
  }, [canView])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await axios.get("/users")
      setUsers(res.data)
    } catch {
      // falha ao carregar
    } finally {
      setLoading(false)
    }
  }

  const loadCategorias = async () => {
    try {
      const res = await axios.get("/categorias")
      setCategoriasList(res.data)
    } catch {
      setCategoriasList([])
    }
  }

  const editarUsuario = (user) => {
    if (!canEdit) return
    console.log("Editando usuário:", user) // Debug
    console.log("Templates do usuário:", user.templates) // Debug
    setEditingUser(user)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!canDelete) return
    if (!window.confirm("Confirmar exclusão deste usuário?")) return

    setDeleteLoading(id)
    try {
      await axios.delete(`/users/${id}`)
      setUsers((u) => u.filter((x) => x.user_id !== id))
    } catch {
      // falha ao excluir
    } finally {
      setDeleteLoading(null)
    }
  }

  // Função para upload de avatar
  const uploadAvatar = async (file) => {
    const formData = new FormData()
    formData.append("file", file)
    try {
      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (!response.ok) throw new Error("Upload failed")
      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("Error uploading avatar:", error)
      throw error
    }
  }

  if (!canView) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-red-600" />
          <p className="text-red-800">Você não tem permissão para visualizar usuários.</p>
        </div>
      </div>
    )
  }

  // Filtragem e paginação
  const filtered = users.filter(
    (u) =>
      u.user_nome.toLowerCase().includes(filter.toLowerCase()) ||
      u.user_email.toLowerCase().includes(filter.toLowerCase()),
  )
  const totalPages = Math.ceil(filtered.length / usersPerPage)
  const currentUsers = filtered.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)

  const getStatusBadge = (status) => {
    return status === "ativo" ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Ativo
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inativo
      </span>
    )
  }

  const getUserTypeBadge = (tipo) => {
    const styles = {
      admin: "bg-blue-100 text-blue-800",
      funcionario: "bg-gray-100 text-gray-800",
      professor: "bg-purple-100 text-purple-800",
    }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[tipo] || styles.funcionario}`}
      >
        {tipo}
      </span>
    )
  }

  // Componente Avatar
  const Avatar = ({ src, name, size = "md" }) => {
    const sizeClasses = {
      sm: "h-8 w-8 text-sm",
      md: "h-10 w-10 text-base",
      lg: "h-16 w-16 text-xl",
      xl: "h-24 w-24 text-2xl",
    }

    const getInitials = (name) => {
      return (
        name
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "??"
      )
    }

    if (src) {
      return (
        <img
          src={src || "/placeholder.svg"}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200`}
        />
      )
    }

    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold border-2 border-gray-200`}
      >
        {getInitials(name)}
      </div>
    )
  }

  // Formulário de criar/editar usuário
  const UserForm = ({ user, onSuccess }) => {
    const isEdit = Boolean(user)
    const [nome, setNome] = useState(user?.user_nome || "")
    const [email, setEmail] = useState(user?.user_email || "")
    const [senha, setSenha] = useState("")
    const [tipo, setTipo] = useState(user?.user_tipo || "funcionario")
    const [status, setStatus] = useState(user?.user_status || "ativo")
    const [avatar, setAvatar] = useState(user?.avatar_url || "")

    // Função para extrair permissões existentes do usuário
    const getExistingPermissions = (userTemplates) => {
      if (!userTemplates || !Array.isArray(userTemplates)) {
        console.log("Nenhum template encontrado ou formato inválido:", userTemplates)
        return []
      }

      const uniquePermissions = [...new Set(userTemplates.map((t) => t.template_code))]
      console.log("Permissões extraídas:", uniquePermissions)
      return uniquePermissions
    }

    // Função para extrair categorias específicas existentes
    const getExistingCategories = (userTemplates) => {
      if (!userTemplates || !Array.isArray(userTemplates)) {
        console.log("Nenhum template encontrado para categorias:", userTemplates)
        return []
      }

      const categoryIds = userTemplates
        .filter((t) => t.template_code === "manage_category" && t.resource_id)
        .map((t) => Number.parseInt(t.resource_id))

      console.log("Categorias extraídas:", categoryIds)
      return categoryIds
    }

    // Inicializar permissões existentes do usuário
    const [templates, setTemplates] = useState(() => {
      const existing = getExistingPermissions(user?.templates)
      console.log("Inicializando templates com:", existing)
      return existing
    })

    // Inicializar categorias específicas existentes
    const [selectedCats, setSelectedCats] = useState(() => {
      const existing = getExistingCategories(user?.templates)
      console.log("Inicializando categorias com:", existing)
      return existing
    })

    const [submitting, setSubmitting] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    const isAdminForm = tipo === "admin"

    // Resetar permissões quando mudar para admin
    useEffect(() => {
      if (tipo === "admin") {
        setTemplates([])
        setSelectedCats([])
      } else if (isEdit && user?.templates) {
        // Recarregar permissões quando voltar de admin para outro tipo
        const existingPermissions = getExistingPermissions(user.templates)
        const existingCategories = getExistingCategories(user.templates)
        setTemplates(existingPermissions)
        setSelectedCats(existingCategories)
      }
    }, [tipo, isEdit, user])

    // Debug: Log dos estados atuais
    useEffect(() => {
      console.log("Estado atual - Templates:", templates)
      console.log("Estado atual - Categorias:", selectedCats)
    }, [templates, selectedCats])

    const toggleTemplate = (code) => {
      console.log("Toggling template:", code)
      setTemplates((prev) => {
        const newTemplates = prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]
        console.log("Novos templates:", newTemplates)

        // Se desmarcar manage_category, limpar categorias selecionadas
        if (code === "manage_category" && prev.includes(code)) {
          console.log("Limpando categorias selecionadas")
          setSelectedCats([])
        }

        return newTemplates
      })
    }

    const toggleCat = (id) => {
      console.log("Toggling categoria:", id)
      setSelectedCats((prev) => {
        const newCats = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        console.log("Novas categorias:", newCats)
        return newCats
      })
    }

    const handleAvatarUpload = async (event) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        alert("Por favor, selecione apenas arquivos de imagem.")
        return
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("O arquivo deve ter no máximo 5MB.")
        return
      }

      setUploadingAvatar(true)
      try {
        const avatarUrl = await uploadAvatar(file)
        setAvatar(avatarUrl)
      } catch (error) {
        alert("Erro ao fazer upload da imagem. Tente novamente.")
      } finally {
        setUploadingAvatar(false)
      }
    }

    const handleSubmit = async (e) => {
      e.preventDefault()
      if (nome.length < 3 || (!isEdit && senha.length < 6)) {
        return alert("Nome mínimo 3 chars e senha mínimo 6.")
      }

      setSubmitting(true)
      const payload = {
        user_nome: nome,
        user_email: email,
        avatar_url: avatar,
        ...(senha && { user_senha: senha }),
        roles: [tipo],
        user_tipo: tipo,
        user_status: status,
        templates: isAdminForm
          ? []
          : templates.flatMap((code) => {
              if (code === "manage_category") {
                return selectedCats.map((catId) => ({
                  template_code: "manage_category",
                  resource_type: "categoria",
                  resource_id: catId,
                }))
              }
              return [{ template_code: code }]
            }),
      }

      console.log("Payload sendo enviado:", payload)

      try {
        if (isEdit) await axios.put(`/users/${user.user_id}`, payload)
        else await axios.post(`/users`, payload)
        onSuccess()
      } catch (error) {
        console.error("Erro ao salvar:", error)
        alert("Erro ao salvar usuário. Tente novamente.")
      } finally {
        setSubmitting(false)
      }
    }

    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                {isEdit ? "Editar Usuário" : "Novo Usuário"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isEdit ? "Atualize as informações do usuário" : "Preencha os dados para criar um novo usuário"}
              </p>
              {isEdit && user?.templates && (
                <p className="text-xs text-blue-600 mt-1">✓ Permissões existentes carregadas automaticamente</p>
              )}
            </div>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar src={avatar} name={nome} size="xl" />
                <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors">
                  {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Clique no ícone da câmera para alterar a foto
                <br />
                <span className="text-xs">Máximo 5MB • JPG, PNG, GIF</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder={isEdit ? "Deixe em branco para manter" : "Mínimo 6 caracteres"}
                  {...(!isEdit && { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuário</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="admin">Administrador</option>
                  <option value="funcionario">Funcionário</option>
                  <option value="professor">Professor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            {!isAdminForm && (
              <>
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-semibold text-gray-900">Permissões</h4>
                    {templates.length > 0 && (
                      <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {templates.length} permissão{templates.length !== 1 ? "ões" : ""} ativa
                        {templates.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {isEdit && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">✓ Pré-carregadas</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PERMISSION_TEMPLATES.map((tpl) => {
                      const IconComponent = tpl.icon
                      const isChecked = templates.includes(tpl.code)
                      return (
                        <div
                          key={tpl.code}
                          className={`flex items-center p-3 border rounded-lg transition-all duration-200 ${
                            isChecked
                              ? "border-blue-300 bg-blue-50 hover:bg-blue-100 shadow-sm"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={tpl.code}
                            checked={isChecked}
                            onChange={() => toggleTemplate(tpl.code)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={tpl.code} className="ml-3 flex items-center gap-2 cursor-pointer flex-1">
                            <IconComponent className={`h-4 w-4 ${isChecked ? "text-blue-600" : "text-gray-600"}`} />
                            <span className={`text-sm font-medium ${isChecked ? "text-blue-900" : "text-gray-700"}`}>
                              {tpl.label}
                            </span>
                            {isChecked && <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />}
                          </label>
                        </div>
                      )
                    })}
                  </div>

                  {templates.includes("manage_category") && (
                    <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h5 className="text-base font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Categorias Específicas
                        {selectedCats.length > 0 && (
                          <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {selectedCats.length} selecionada{selectedCats.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {isEdit && selectedCats.length > 0 && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            ✓ Pré-selecionadas
                          </span>
                        )}
                      </h5>
                      <p className="text-sm text-blue-700 mb-4">
                        Selecione as categorias que este usuário pode gerenciar
                        {isEdit && selectedCats.length > 0 && (
                          <span className="block text-xs text-green-700 mt-1">
                            ✓ Categorias existentes foram carregadas automaticamente
                          </span>
                        )}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {categoriasList.map((cat) => {
                          const isSelected = selectedCats.includes(cat.cat_id)
                          return (
                            <div
                              key={cat.cat_id}
                              className={`flex items-center p-2 rounded border transition-all duration-200 ${
                                isSelected
                                  ? "bg-blue-100 border-blue-300 shadow-sm"
                                  : "bg-white border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                id={`cat-${cat.cat_id}`}
                                checked={isSelected}
                                onChange={() => toggleCat(cat.cat_id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`cat-${cat.cat_id}`}
                                className={`ml-2 text-sm cursor-pointer flex-1 ${
                                  isSelected ? "text-blue-900 font-medium" : "text-gray-700"
                                }`}
                              >
                                {cat.cat_nome}
                              </label>
                              {isSelected && <CheckCircle className="h-3 w-3 text-blue-600" />}
                            </div>
                          )
                        })}
                      </div>
                      {categoriasList.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          <Settings className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">Nenhuma categoria disponível</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting || uploadingAvatar}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                {isEdit ? "Atualizar" : "Criar Usuário"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
            </div>
          </form>
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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                Gerenciamento de Usuários
              </h1>
              <p className="text-gray-600 mt-2">Gerencie usuários, permissões e acessos do sistema</p>
            </div>
            {canCreate && (
              <button
                onClick={() => {
                  setEditingUser(null)
                  setShowForm(!showForm)
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                {showForm ? (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Fechar
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Usuário
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Pesquisar por nome ou email..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <UserForm
                user={editingUser}
                onSuccess={() => {
                  loadUsers()
                  setShowForm(false)
                }}
              />
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Usuários</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filtered.length} usuário{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentUsers.map((u, index) => {
                      // Calcular o índice sequencial baseado na página atual
                      const sequentialIndex = (currentPage - 1) * usersPerPage + index + 1

                      return (
                        <tr key={u.user_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                              {sequentialIndex}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar src={u.avatar_url} name={u.user_nome} size="md" />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{u.user_nome}</div>
                                {u.templates && u.templates.length > 0 && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <Shield className="h-3 w-3" />
                                    {u.templates.length} permissão{u.templates.length !== 1 ? "ões" : ""}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Mail className="h-4 w-4 text-gray-400 mr-2" />
                              {u.user_email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{getUserTypeBadge(u.user_tipo)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(u.user_status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              {canEdit && (
                                <button
                                  onClick={() => editarUsuario(u)}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                  title="Editar usuário"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(u.user_id)}
                                  disabled={deleteLoading === u.user_id}
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
                                  title="Excluir usuário"
                                >
                                  {deleteLoading === u.user_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
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
                          Mostrando <span className="font-medium">{(currentPage - 1) * usersPerPage + 1}</span> a{" "}
                          <span className="font-medium">{Math.min(currentPage * usersPerPage, filtered.length)}</span>{" "}
                          de <span className="font-medium">{filtered.length}</span> usuários
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsersPage
