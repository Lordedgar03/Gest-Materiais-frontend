// src/hooks/useCategories.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../api";

function parseJwtSafe(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}
const pickArray = (res) =>
  Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];

export function useCategories() {
  // Auth estável
  const decodedRef = useRef(null);
  if (!decodedRef.current && typeof window !== "undefined") {
    const t = localStorage.getItem("token");
    decodedRef.current = t ? parseJwtSafe(t) : {};
  }
  const decoded = decodedRef.current || {};
  const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
  const isAdmin = roles.includes("admin");

  const userTemplates = Array.isArray(decoded.templates) ? decoded.templates : [];
  const categoryTemplates = userTemplates.filter((t) => t.template_code === "manage_category");
  const allowedCategoryIds = categoryTemplates
    .map((t) => Number.parseInt(t.resource_id))
    .filter((n) => Number.isFinite(n));

  const canViewCategories = isAdmin || categoryTemplates.length > 0;
  const canCreateCategory = isAdmin;
  const canEditCategory = isAdmin;
  const canDeleteCategory = isAdmin;

  // Estado
  const [allCategories, setAllCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null);
  const [tempName, setTempName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  // filtro/paginação
  const [searchTerm, setSearchTerm] = useState("");
  const categoriesPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Requests
  const fetchCategories = useCallback(async () => {
    if (!canViewCategories) return;
    setLoading(true);
    try {
      const res = await api.get("/categorias");
      const formatted = pickArray(res).map((c) => ({ id: c.cat_id, name: c.cat_nome }));
      const visible = isAdmin
        ? formatted
        : formatted.filter((c) => allowedCategoryIds.includes(c.id));
      setAllCategories((prev) =>
        JSON.stringify(prev) === JSON.stringify(formatted) ? prev : formatted
      );
      setCategories((prev) =>
        JSON.stringify(prev) === JSON.stringify(visible) ? prev : visible
      );
    } finally {
      setLoading(false);
    }
  }, [canViewCategories, isAdmin, allowedCategoryIds]);

  // Evita duplo fetch em dev
  const didRef = useRef(false);
  useEffect(() => {
    if (!canViewCategories) return;
    if (process.env.NODE_ENV !== "production") {
      if (didRef.current) return;
      didRef.current = true;
    }
    fetchCategories();
  }, [canViewCategories, fetchCategories]);

  // Ações
  const startEdit = useCallback(
    (cat) => {
      if (!canEditCategory) return;
      setEditing(cat.id);
      setTempName(cat.name);
    },
    [canEditCategory]
  );
  const cancelEdit = useCallback(() => {
    setEditing(null);
    setTempName("");
  }, []);
  const saveEdit = useCallback(async () => {
    if (!canEditCategory || !editing || !tempName.trim()) return;
    setSaveLoading(true);
    try {
      await api.put(`/categorias/${editing}`, { cat_nome: tempName.trim() });
      const updated = { id: editing, name: tempName.trim() };
      setAllCategories((prev) => prev.map((c) => (c.id === editing ? updated : c)));
      setCategories((prev) => prev.map((c) => (c.id === editing ? updated : c)));
      cancelEdit();
    } finally {
      setSaveLoading(false);
    }
  }, [canEditCategory, editing, tempName, cancelEdit]);

  const addCategory = useCallback(
    async (name) => {
      if (!canCreateCategory || !name.trim()) return;
      setAddLoading(true);
      try {
        const { data } = await api.post("/categorias", { cat_nome: name.trim() });
        const newCat = { id: data.cat_id, name: data.cat_nome };
        setAllCategories((prev) => [...prev, newCat]);
        if (isAdmin || allowedCategoryIds.includes(newCat.id)) {
          setCategories((prev) => [...prev, newCat]);
        }
        setNewName("");
      } finally {
        setAddLoading(false);
      }
    },
    [canCreateCategory, isAdmin, allowedCategoryIds]
  );

  const deleteCategory = useCallback(
    async (id) => {
      if (!canDeleteCategory) return;
      setDeleteLoading(id);
      try {
        await api.delete(`/categorias/${id}`);
        setAllCategories((prev) => prev.filter((c) => c.id !== id));
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } finally {
        setDeleteLoading(null);
      }
    },
    [canDeleteCategory]
  );

  // Filtro / paginação
  const filteredCategories = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(s));
  }, [categories, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / categoriesPerPage));
  const currentCategories = useMemo(() => {
    const start = (currentPage - 1) * categoriesPerPage;
    return filteredCategories.slice(start, start + categoriesPerPage);
  }, [filteredCategories, currentPage, categoriesPerPage]);

  return {
    // Permissões
    isAdmin,
    allowedCategoryIds,
    canViewCategories,
    canCreateCategory,
    canEditCategory,
    canDeleteCategory,

    // Dados/estado
    allCategories,
    categories,
    newName,
    setNewName,
    editing,
    tempName,
    setTempName,
    loading,
    deleteLoading,
    saveLoading,
    addLoading,

    // Filtro/paginação
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    categoriesPerPage,
    totalPages,
    filteredCategories,
    currentCategories,

    // Ações
    fetchCategories,
    startEdit,
    cancelEdit,
    saveEdit,
    addCategory,
    deleteCategory,
  };
}
