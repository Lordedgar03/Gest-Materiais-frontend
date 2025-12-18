/* eslint-disable no-unused-vars */
// src/pages/User.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Users,
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  Mail,
  X,
  Camera,
  CheckCircle,
} from "lucide-react";
import { useUser, PERMISSION_TEMPLATES } from "../hooks/useUser";

/* =================== UI Primitivos =================== */
function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "lg", // xs | sm | md | lg | xl
  initialFocusRef,
  closeOnBackdrop = true,
}) {
  const panelRef = useRef(null);

  const sizes = {
    xs: "max-w-sm",
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", handleKey);

    const node = initialFocusRef?.current || panelRef.current;
    node?.focus();

    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose, initialFocusRef]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-desc" : undefined}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-100 transition-opacity"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-6">
        <div
          ref={panelRef}
          tabIndex={-1}
          className={`w-full ${sizes[size]} bg-white dark:bg-gray-900 rounded-2xl shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 outline-none translate-y-2 sm:translate-y-0 scale-[0.98] opacity-0 data-[show=true]:translate-y-0 data-[show=true]:scale-100 data-[show=true]:opacity-100 transition-all duration-200 flex max-h-[85vh] sm:max-h-[80vh]`}
          data-show="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col w-full">
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 supports-[backdrop-filter]:dark:bg-gray-900/75 border-b border-gray-200 dark:border-gray-800 rounded-t-2xl">
              <div className="px-5 sm:px-6 py-4 sm:py-5 flex items-start sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  {title && (
                    <h3
                      id="modal-title"
                      className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate"
                    >
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p
                      id="modal-desc"
                      className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
                    >
                      {description}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="shrink-0 h-9 w-9 grid place-items-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Fechar modal"
                >
                  <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 sm:py-6 overflow-y-auto">
              <div className="max-w-3xl">{children}</div>
            </div>

            {footer && (
              <div className="sticky bottom-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 supports-[backdrop-filter]:dark:bg-gray-900/75 border-t border-gray-200 dark:border-gray-800 rounded-b-2xl">
                <div className="px-5 sm:px-6 py-4 sm:py-5 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:items-center sm:justify-end">
                  {footer}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ open, onClose, onConfirm, name, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Confirmar exclusão"
      description="Esta ação é permanente e removerá o utilizador do sistema."
      footer={
        <>
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-10 px-4 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Excluir
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Tem certeza que deseja excluir{" "}
        <span className="font-semibold text-gray-900 dark:text-white">{name}</span>? Esta ação não pode ser
        desfeita.
      </p>
    </Modal>
  );
}

/* =================== Helpers visuais =================== */
function Avatar({ src, name, size = "md" }) {
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-16 w-16 text-xl",
    xl: "h-24 w-24 text-2xl",
  };
  const initials =
    (name || "")
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  return src ? (
    <img
      src={src || "/placeholder.svg"}
      alt={name || "avatar"}
      className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200 dark:border-gray-700`}
    />
  ) : (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold border-2 border-gray-200 dark:border-gray-700`}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const cls =
    status === "ativo"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {status === "ativo" ? "Ativo" : "Inativo"}
    </span>
  );
}

function RoleBadge({ tipo }) {
  const styles = {
    admin:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    funcionario:
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    professor:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[tipo || "funcionario"] || styles.funcionario
      }`}
    >
      {tipo}
    </span>
  );
}

/* =================== Form de criar/editar =================== */
function UserForm({ user, categoriasList, onClose, onSubmit, uploadAvatar }) {
  const isEdit = Boolean(user?.user_id);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState("funcionario");
  const [status, setStatus] = useState("ativo");
  const [avatar, setAvatar] = useState("");
  const [formError, setFormError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const extractPerms = (templates) =>
    Array.isArray(templates)
      ? Array.from(new Set(templates.map((t) => t.template_code)))
      : [];
  const extractCats = (templates) =>
    Array.isArray(templates)
      ? templates
          .filter(
            (t) =>
              t.template_code === "manage_category" && t.resource_id != null
          )
          .map((t) => Number(t.resource_id))
          .filter(Boolean)
      : [];

  const [templates, setTemplates] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);

  const firstFieldRef = useRef(null);

  useEffect(() => {
    setFormError("");
    if (isEdit && user) {
      setNome(user.user_nome || "");
      setEmail(user.user_email || "");
      setTipo(user.user_tipo || "funcionario");
      setStatus(user.user_status || "ativo");
      setAvatar(user.avatar_url || "");
      setTemplates(extractPerms(user.templates));
      setSelectedCats(extractCats(user.templates));
      setSenha("");
    } else {
      setNome("");
      setEmail("");
      setTipo("funcionario");
      setStatus("ativo");
      setAvatar("");
      setTemplates([]);
      setSelectedCats([]);
      setSenha("");
    }
  }, [isEdit, user]);

  const toggleTemplate = (code) => {
    setTemplates((prev) => {
      const has = prev.includes(code);
      const next = has ? prev.filter((c) => c !== code) : [...prev, code];
      if (has && code === "manage_category") setSelectedCats([]);
      return next;
    });
  };

  const toggleCat = (id) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAvatarUpload = async (event) => {
    setAvatarError("");
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Selecione um ficheiro de imagem (JPG/PNG/GIF).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Imagem acima de 5MB.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file);
      setAvatar(url);
    } catch {
      setAvatarError(
        "Falha ao enviar a imagem. Verifique o endpoint /upload-avatar."
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (nome.trim().length < 3)
      return setFormError("O nome deve ter pelo menos 3 caracteres.");
    if (!isEdit && senha.trim().length < 6)
      return setFormError(
        "A senha do novo utilizador deve ter pelo menos 6 caracteres."
      );

    setSubmitting(true);
    try {
      const payload = {
        user_nome: nome.trim(),
        user_email: email.trim(),
        ...(senha ? { user_senha: senha } : {}),
        user_tipo: tipo,
        user_status: status,
        roles: [tipo],
        templates:
          tipo === "admin"
            ? []
            : templates.flatMap((code) =>
                code === "manage_category"
                  ? selectedCats.map((catId) => ({
                      template_code: "manage_category",
                      resource_type: "categoria",
                      resource_id: catId,
                    }))
                  : [{ template_code: code }]
              ),
      };
      await onSubmit({ isEdit, userId: user?.user_id, payload });
      onClose();
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
          err?.message ||
          "Não foi possível salvar o utilizador."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {formError && (
        <div className="rounded-lg border border-rose-200 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-3 py-2 text-sm">
          {formError}
        </div>
      )}

      {/* Avatar */}
      <div className="flex flex-col items-center space-y-3">
        <div className="relative">
          <Avatar src={avatar} name={nome} size="xl" />
          <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors">
            {uploadingAvatar ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={uploadingAvatar}
            />
          </label>
        </div>
        {avatarError && (
          <p className="text-xs text-rose-600 dark:text-rose-300">
            {avatarError}
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          JPG/PNG/GIF • até 5MB
        </p>
      </div>

      {/* Campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome
          </label>
          <input
            ref={firstFieldRef}
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Nome completo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="email@exemplo.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Senha
          </label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder={
              isEdit ? "Deixe vazio para manter" : "Mínimo 6 caracteres"
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de utilizador
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="admin">Administrador</option>
            <option value="funcionario">Funcionário</option>
            <option value="professor">Professor</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      {/* Permissões (oculta para admin) */}
      {tipo !== "admin" && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
              Permissões
            </h4>
            {templates.length > 0 && (
              <span className="text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {templates.length} ativa{templates.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PERMISSION_TEMPLATES.map((tpl) => {
              const checked = templates.includes(tpl.code);
              return (
                <label
                  key={tpl.code}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                    checked
                      ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800"
                      : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const has = templates.includes(tpl.code);
                      setTemplates((prev) =>
                        has ? prev.filter((c) => c !== tpl.code) : [...prev, tpl.code]
                      );
                      if (tpl.code === "manage_category" && checked) {
                        setSelectedCats([]);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700 rounded"
                  />
                  <span
                    className={`text-sm ${
                      checked
                        ? "text-blue-900 dark:text-blue-200 font-medium"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {tpl.label}
                  </span>
                  {checked && (
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 ml-auto" />
                  )}
                </label>
              );
            })}
          </div>

          {templates.includes("manage_category") && (
            <div className="mt-5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Categorias específicas
                </span>
                {selectedCats.length > 0 && (
                  <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {selectedCats.length} selecionada
                    {selectedCats.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {categoriasList.map((cat) => {
                  const checked = selectedCats.includes(cat.cat_id);
                  return (
                    <label
                      key={cat.cat_id}
                      className={`flex items-center gap-2 p-2 rounded border text-sm cursor-pointer ${
                        checked
                          ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800"
                          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedCats((prev) =>
                            prev.includes(cat.cat_id)
                              ? prev.filter((x) => x !== cat.cat_id)
                              : [...prev, cat.cat_id]
                          )
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700 rounded"
                      />
                      <span
                        className={
                          checked
                            ? "text-blue-900 dark:text-blue-200 font-medium"
                            : "text-gray-700 dark:text-gray-300"
                        }
                      >
                        {cat.cat_nome}
                      </span>
                    </label>
                  );
                })}
                {categoriasList.length === 0 && (
                  <div className="col-span-full text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                    Sem categorias disponíveis
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          type="submit"
          disabled={submitting || uploadingAvatar}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isEdit ? "Atualizar" : "Criar utilizador"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <X size={16} /> Cancelar
        </button>
      </div>
    </form>
  );
}

/* =================== Página =================== */
export default function User() {
  const {
    canView,
    canCreate,
    canEdit,
    canDelete,
    categoriasList,
    loading,
    error,
    setError,
    showForm,
    setShowForm,
    editingUser,
    filter,
    setFilter,
    deleteLoading,
    currentPage,
    setCurrentPage,
    usersPerPage,
    totalPages,
    currentUsers,
    openCreate,
    editarUsuario,
    handleDelete,
    uploadAvatar,
    saveUser,
  } = useUser();

  const [searchValue, setSearchValue] = useState(filter || "");
  useEffect(() => setSearchValue(filter || ""), [filter]);
  useEffect(() => {
    const t = setTimeout(() => setFilter(searchValue), 250);
    return () => clearTimeout(t);
  }, [searchValue, setFilter]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const openDelete = (u) => {
    setDeleteTarget(u);
    setDeleteOpen(true);
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await handleDelete(deleteTarget.user_id);
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  if (!canView) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200">
            Você não tem permissão para visualizar utilizadores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className=" mx-auto p-4 md:p-4 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </span>
                Gestão de Utilizadores
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gerencie pessoas, permissões e acessos do sistema.
              </p>
            </div>
            {canCreate && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircle className="h-4 w-4" />
                Novo utilizador
              </button>
            )}
          </div>
        </div>

        {/* Filtro + erros */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-3">
          <div className="relative">
            <Search className="absolute inset-y-0 left-3 my-auto h-5 w-5 text-gray-400" />
            <label htmlFor="user-search" className="sr-only">
              Pesquisar utilizadores
            </label>
            <input
              id="user-search"
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Pesquisar por nome ou email…"
              className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 px-3 py-2 text-sm">
              {error}{" "}
              <button
                onClick={() => setError(null)}
                className="underline ml-2 text-amber-700 dark:text-amber-300"
              >
                Fechar
              </button>
            </div>
          )}
        </div>

        {/* Modal form */}
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={editingUser ? "Editar utilizador" : "Novo utilizador"}
          size="lg"
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Utilizadores
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentUsers.length} registo
              {currentUsers.length !== 1 ? "s" : ""} nesta página
            </p>
          </div>

          <div className="relative">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : currentUsers.length ? (
                <>
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
                      <tr className="text-left text-gray-600 dark:text-gray-300 uppercase text-xs">
                        <th className="px-6 py-3 font-semibold">Nº</th>
                        <th className="px-6 py-3 font-semibold">Utilizador</th>
                        <th className="px-6 py-3 font-semibold">Email</th>
                        <th className="px-6 py-3 font-semibold">Tipo</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                        <th className="px-6 py-3 font-semibold text-right">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {currentUsers.map((u, index) => {
                        const seq =
                          (currentPage - 1) * usersPerPage + index + 1;
                        return (
                          <tr
                            key={u.user_id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold">
                                {seq}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Avatar
                                  src={u.avatar_url || null}
                                  name={u.user_nome}
                                  size="md"
                                />
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {u.user_nome}
                                  </div>
                                  {Array.isArray(u.templates) &&
                                    u.templates.length > 0 && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                        <Shield className="h-3 w-3" />
                                        {u.templates.length} permissão
                                        {u.templates.length !== 1 ? "ões" : ""}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-gray-900 dark:text-gray-100">
                                <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                                {u.user_email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <RoleBadge tipo={u.user_tipo} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={u.user_status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex justify-end gap-2">
                                {canEdit && (
                                  <button
                                    onClick={() => editarUsuario(u)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    title="Editar utilizador"
                                    aria-label={`Editar ${u.user_nome}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                    Editar
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => {
                                      setDeleteTarget(u);
                                      setDeleteOpen(true);
                                    }}
                                    disabled={deleteLoading === u.user_id}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50"
                                    title="Excluir utilizador"
                                    aria-label={`Excluir ${u.user_nome}`}
                                  >
                                    {deleteLoading === u.user_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                    Excluir
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <nav
                      className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-800 sm:px-6"
                      role="navigation"
                      aria-label="Paginação de utilizadores"
                    >
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          disabled={currentPage === 1}
                          onClick={() =>
                            setCurrentPage((p) => Math.max(p - 1, 1))
                          }
                          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() =>
                            setCurrentPage((p) => Math.min(p + 1, totalPages))
                          }
                          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                        >
                          Próxima
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Página{" "}
                          <span className="font-medium">{currentPage}</span> de{" "}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                        <div className="inline-flex rounded-lg shadow-sm">
                          <button
                            disabled={currentPage === 1}
                            onClick={() =>
                              setCurrentPage((p) => Math.max(p - 1, 1))
                            }
                            className="px-3 py-2 rounded-l-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                            title="Anterior"
                            aria-label="Página anterior"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            disabled={currentPage === totalPages}
                            onClick={() =>
                              setCurrentPage((p) =>
                                Math.min(p + 1, totalPages)
                              )
                            }
                            className="px-3 py-2 rounded-r-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                            title="Próxima"
                            aria-label="Próxima página"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </nav>
                  )}
                </>
              ) : (
                <div className="p-16 text-center">
                  <div className="mx-auto max-w-sm">
                    <div className="h-14 w-14 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 grid place-items-center">
                      <Users className="h-7 w-7 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                      Nenhum utilizador encontrado
                    </h3>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                      Tente ajustar a pesquisa ou criar um novo utilizador.
                    </p>
                    {canCreate && (
                      <button
                        onClick={openCreate}
                        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Novo utilizador
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        name={deleteTarget?.user_nome || ""}
        loading={deleteTarget ? deleteLoading === deleteTarget.user_id : false}
      />
    </div>
  );
}
