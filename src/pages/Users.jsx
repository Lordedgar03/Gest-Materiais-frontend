"use client"

import React, { useState, useEffect } from "react"
import {
  Users, PlusCircle, XCircle, Edit, Trash2, UserPlus, Loader2, Search,
  ChevronLeft, ChevronRight, Shield, Mail, X, Camera, CheckCircle,
} from "lucide-react"
import { useUser, PERMISSION_TEMPLATES } from "../hooks/useUser"

/* ============ UI ATÔMICA ============ */
function Modal({ open, title, onClose, children, footer, maxWidth = "max-w-4xl" }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center p-4 overflow-y-auto">
        <div className={`w-full ${maxWidth} mt-8 rounded-xl bg-white shadow-xl border border-gray-200`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Fechar modal">
              <X size={18} />
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

function ConfirmDeleteModal({ open, onClose, onConfirm, name, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirmar exclusão"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-md">Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Excluir
          </button>
        </div>
      }
    >
      <p className="text-sm text-gray-700">
        Tem certeza que deseja excluir <span className="font-semibold">{name}</span>? Esta ação não pode ser desfeita.
      </p>
    </Modal>
  )
}

function Avatar({ src, name, size = "md" }) {
  const sizeClasses = { sm: "h-8 w-8 text-sm", md: "h-10 w-10 text-base", lg: "h-16 w-16 text-xl", xl: "h-24 w-24 text-2xl" }
  const initials = (name || "")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??"

  return src ? (
    <img
      src={src || "/placeholder.svg"}
      alt={name}
      className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200`}
    />
  ) : (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold border-2 border-gray-200`}>
      {initials}
    </div>
  )
}

function StatusBadge({ status }) {
  const cls =
    status === "ativo"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800"
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status === "ativo" ? "Ativo" : "Inativo"}</span>
}

function RoleBadge({ tipo }) {
  const styles = {
    admin: "bg-blue-100 text-blue-800",
    funcionario: "bg-gray-100 text-gray-800",
    professor: "bg-purple-100 text-purple-800",
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[tipo] || styles.funcionario}`}>
      {tipo}
    </span>
  )
}

/* ============ FORM MODAL ============ */
function UserForm({ user, categoriasList, onClose, onSubmit, uploadAvatar }) {
  const isEdit = Boolean(user)
  const [nome, setNome] = useState(user?.user_nome || "")
  const [email, setEmail] = useState(user?.user_email || "")
  const [senha, setSenha] = useState("")
  const [tipo, setTipo] = useState(user?.user_tipo || "funcionario")
  const [status, setStatus] = useState(user?.user_status || "ativo")
  const [avatar, setAvatar] = useState(user?.avatar_url || "")
  const [avatarError, setAvatarError] = useState("")
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // permissões (somente para não-admin)
  const isAdminForm = tipo === "admin"
  const extractPerms = (templates) => {
    if (!Array.isArray(templates)) return []
    return Array.from(new Set(templates.map(t => t.template_code)))
  }
  const extractCats = (templates) => {
    if (!Array.isArray(templates)) return []
    return templates
      .filter(t => t.template_code === "manage_category" && t.resource_id != null)
      .map(t => Number(t.resource_id))
      .filter(Boolean)
  }

  const [templates, setTemplates] = useState(() => extractPerms(user?.templates))
  const [selectedCats, setSelectedCats] = useState(() => extractCats(user?.templates))

  useEffect(() => {
    setFormError("")
    if (tipo === "admin") {
      setTemplates([])
      setSelectedCats([])
    } else if (isEdit && user?.templates) {
      setTemplates(extractPerms(user.templates))
      setSelectedCats(extractCats(user.templates))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo])

  const toggleTemplate = (code) => {
    setTemplates(prev => {
      const has = prev.includes(code)
      const next = has ? prev.filter(c => c !== code) : [...prev, code]
      if (has && code === "manage_category") setSelectedCats([])
      return next
    })
  }
  const toggleCat = (id) => {
    setSelectedCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleAvatarUpload = async (event) => {
    setAvatarError("")
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setAvatarError("Selecione um ficheiro de imagem (JPG/PNG/GIF).")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Imagem acima de 5MB.")
      return
    }
    setUploadingAvatar(true)
    try {
      const url = await uploadAvatar(file)
      setAvatar(url)
    } catch {
      setAvatarError("Falha ao enviar a imagem. Tente novamente.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setFormError("")
    if (nome.trim().length < 3) {
      setFormError("O nome deve ter pelo menos 3 caracteres.")
      return
    }
    if (!isEdit && senha.trim().length < 6) {
      setFormError("A senha do novo utilizador deve ter pelo menos 6 caracteres.")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        user_nome: nome.trim(),
        user_email: email.trim(),
        avatar_url: avatar || null,
        ...(senha && { user_senha: senha }),
        roles: [tipo],
        user_tipo: tipo,
        user_status: status,
        templates: isAdminForm
          ? []
          : templates.flatMap(code =>
              code === "manage_category"
                ? selectedCats.map(catId => ({ template_code: "manage_category", resource_type: "categoria", resource_id: catId }))
                : [{ template_code: code }]
            ),
      }
      await onSubmit({ isEdit, userId: user?.user_id, payload })
      onClose()
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Não foi possível salvar o utilizador.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            {isEdit ? "Editar utilizador" : "Novo utilizador"}
          </h3>
          <p className="text-sm text-gray-600">
            {isEdit ? "Atualize as informações do utilizador." : "Preencha os dados para criar um novo utilizador."}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
          <X size={16} /> Fechar
        </button>
      </div>

      {/* Mensagem de erro do formulário */}
      {formError && (
        <div className="rounded-md border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm">
          {formError}
        </div>
      )}

      {/* Avatar */}
      <div className="flex flex-col items-center space-y-3">
        <div className="relative">
          <Avatar src={avatar} name={nome} size="xl" />
          <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors">
            {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar}/>
          </label>
        </div>
        {avatarError && <p className="text-xs text-rose-600">{avatarError}</p>}
        <p className="text-xs text-gray-500 text-center">JPG/PNG/GIF • até 5MB</p>
      </div>

      {/* Campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            type="text" value={nome} onChange={(e)=>setNome(e.target.value)} required
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Nome completo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="email@exemplo.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input
            type="password" value={senha} onChange={(e)=>setSenha(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder={isEdit ? "Deixe vazio para manter" : "Mínimo 6 caracteres"}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de utilizador</label>
          <select
            value={tipo} onChange={(e)=>setTipo(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="admin">Administrador</option>
            <option value="funcionario">Funcionário</option>
            <option value="professor">Professor</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status} onChange={(e)=>setStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      {/* Permissões (quando não-admin) */}
      {!isAdminForm && (
        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <h4 className="text-base font-semibold text-gray-900">Permissões</h4>
            {templates.length > 0 && (
              <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {templates.length} ativa{templates.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PERMISSION_TEMPLATES.map((tpl) => {
              const checked = templates.includes(tpl.code)
              return (
                <label
                  key={tpl.code}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                    checked ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTemplate(tpl.code)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className={`text-sm ${checked ? "text-blue-900 font-medium" : "text-gray-700"}`}>{tpl.label}</span>
                  {checked && <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />}
                </label>
              )
            })}
          </div>

          {templates.includes("manage_category") && (
            <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-700" />
                <span className="text-sm font-semibold text-blue-900">Categorias específicas</span>
                {selectedCats.length > 0 && (
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {selectedCats.length} selecionada{selectedCats.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {categoriasList.map((cat) => {
                  const checked = selectedCats.includes(cat.cat_id)
                  return (
                    <label
                      key={cat.cat_id}
                      className={`flex items-center gap-2 p-2 rounded border text-sm cursor-pointer ${
                        checked ? "bg-blue-100 border-blue-300" : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCat(cat.cat_id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className={checked ? "text-blue-900 font-medium" : "text-gray-700"}>{cat.cat_nome}</span>
                    </label>
                  )
                })}
                {categoriasList.length === 0 && (
                  <div className="col-span-full text-center text-gray-500 text-sm py-4">Sem categorias disponíveis</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2 pt-4 border-t">
        <button
          type="submit"
          disabled={submitting || uploadingAvatar}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {isEdit ? "Atualizar" : "Criar utilizador"}
        </button>
        <button type="button" onClick={onClose} className="inline-flex items-center gap-2 px-4 py-2 border rounded-md">
          <X size={16} /> Cancelar
        </button>
      </div>
    </form>
  )
}

/* ============ PÁGINA ============ */
export default function User() {
  const {
    // perms
    canView, canCreate, canEdit, canDelete,
    // dados/ui
    categoriasList, loading, showForm, setShowForm, editingUser, setEditingUser,
    filter, setFilter, deleteLoading,
    currentPage, setCurrentPage, usersPerPage, totalPages, currentUsers,
    // ações
    editarUsuario, handleDelete, uploadAvatar, saveUser,
  } = useUser()

  // busca com debounce (evita re-render/consulta a cada tecla)
  const [searchValue, setSearchValue] = useState(filter || "")
  useEffect(() => setSearchValue(filter || ""), [filter])
  useEffect(() => {
    const t = setTimeout(() => setFilter(searchValue), 250)
    return () => clearTimeout(t)
  }, [searchValue, setFilter])

  // modal de delete
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const openDelete = (u) => { setDeleteTarget(u); setDeleteOpen(true) }
  const confirmDelete = async () => {
    if (!deleteTarget) return
    await handleDelete(deleteTarget.user_id)
    setDeleteOpen(false)
    setDeleteTarget(null)
  }

  if (!canView) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-red-600" />
          <p className="text-red-800">Você não tem permissão para visualizar utilizadores.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto  space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600" />
                </span>
                Gestão de Utilizadores
              </h1>
              <p className="text-gray-600 mt-2">Gerencie pessoas, permissões e acessos do sistema.</p>
            </div>
            {canCreate && (
              <button
                onClick={() => { setEditingUser(null); setShowForm(true) }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircle className="h-4 w-4" />
                Novo utilizador
              </button>
            )}
          </div>
        </div>

        {/* Toolbar de busca */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="relative">
            <Search className="absolute inset-y-0 left-3 my-auto h-5 w-5 text-gray-400" />
            <label htmlFor="user-search" className="sr-only">Pesquisar utilizadores</label>
            <input
              id="user-search"
              type="text"
              value={searchValue}
              onChange={(e)=> setSearchValue(e.target.value)}
              placeholder="Pesquisar por nome ou email…"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Modal do Formulário */}
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={editingUser ? "Editar utilizador" : "Novo utilizador"}
          maxWidth="max-w-3xl"
          footer={null}
        >
          <UserForm
            user={editingUser}
            categoriasList={categoriasList}
            uploadAvatar={uploadAvatar}
            onClose={() => setShowForm(false)}
            onSubmit={saveUser}
          />
        </Modal>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Utilizadores</h2>
            <p className="text-sm text-gray-600 mt-1">
              {currentUsers.length} registo{currentUsers.length !== 1 ? "s" : ""} nesta página
            </p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : currentUsers.length ? (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilizador</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentUsers.map((u, index) => {
                      const seq = (currentPage - 1) * usersPerPage + index + 1
                      return (
                        <tr key={u.user_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                              {seq}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar src={u.avatar_url} name={u.user_nome} size="md" />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{u.user_nome}</div>
                                {Array.isArray(u.templates) && u.templates.length > 0 && (
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
                          <td className="px-6 py-4 whitespace-nowrap"><RoleBadge tipo={u.user_tipo} /></td>
                          <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={u.user_status} /></td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              {canEdit && (
                                <button
                                  onClick={() => editarUsuario(u) /* hook normalmente abre o form */}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-blue-700 hover:bg-blue-50"
                                  title="Editar utilizador"
                                  aria-label={`Editar ${u.user_nome}`}
                                >
                                  <Edit className="h-4 w-4" />
                                  Editar
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => openDelete(u)}
                                  disabled={deleteLoading === u.user_id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                  title="Excluir utilizador"
                                  aria-label={`Excluir ${u.user_nome}`}
                                >
                                  {deleteLoading === u.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                  Excluir
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        className="px-4 py-2 border rounded disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        className="px-4 py-2 border rounded disabled:opacity-50"
                      >
                        Próxima
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-700">
                        Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
                      </p>
                      <nav className="inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          className="px-2 py-2 border rounded-l disabled:opacity-50"
                          title="Anterior"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                          className="px-2 py-2 border rounded-r disabled:opacity-50"
                          title="Próxima"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-gray-600">Nenhum utilizador encontrado.</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null) }}
        onConfirm={confirmDelete}
        name={deleteTarget?.user_nome || ""}
        loading={deleteTarget ? deleteLoading === deleteTarget.user_id : false}
      />
    </div>
  )
}
