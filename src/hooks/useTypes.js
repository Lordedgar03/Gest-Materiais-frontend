// src/hooks/useTypes.js
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
  Array.isArray(res?.data)
    ? res.data
    : Array.isArray(res?.data?.data)
    ? res.data.data
    : [];

export function useTypes() {
  // ===== Auth estável (lê 1x) =====
  const decodedRef = useRef(null);
  if (!decodedRef.current && typeof window !== "undefined") {
    const t = localStorage.getItem("token");
    decodedRef.current = t ? parseJwtSafe(t) : {};
  }
  const decoded = decodedRef.current || {};

  // ===== Permissões (memoizadas) =====
  const roles = useMemo(
    () => (Array.isArray(decoded.roles) ? decoded.roles : []),
    [decoded.roles]
  );
  const isAdmin = useMemo(() => roles.includes("admin"), [roles]);

  const userTemplates = useMemo(
    () => (Array.isArray(decoded.templates) ? decoded.templates : []),
    [decoded.templates]
  );

  const allowedCategoryIds = useMemo(
    () =>
      userTemplates
        .filter((t) => t.template_code === "manage_category")
        .map((t) => Number.parseInt(t.resource_id))
        .filter((n) => Number.isFinite(n)),
    [userTemplates]
  );

  const canView = isAdmin || allowedCategoryIds.length > 0;

  const canManageType = useCallback(
    (catId) => isAdmin || allowedCategoryIds.includes(Number(catId)),
    [isAdmin, allowedCategoryIds]
  );

  // ===== Estado =====
  const [allCategories, setAllCategories] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const [allTypes, setAllTypes] = useState([]);
  const [types, setTypes] = useState([]);

  // add form (catId como STRING)
  const [newName, setNewName] = useState("");
  const [newCatId, setNewCatId] = useState(""); // string
  const defaultCatSetRef = useRef(false);

  // edição (catId como STRING)
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState("");
  const [tempCatId, setTempCatId] = useState(""); // string

  // ui
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const loading = loadingCats || loadingTypes;

  const [addLoading, setAddLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // filtro/paginação
  const [searchTerm, setSearchTerm] = useState("");
  const typesPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // ===== Requests =====
  const fetchCategories = useCallback(async () => {
    if (!canView) return;

    setLoadingCats(true);
    try {
      const res = await api.get("/categorias");
      const list = pickArray(res).map((c) => ({
        id: c.cat_id,
        name: c.cat_nome,
      }));

      const visible = isAdmin
        ? list
        : list.filter((c) => allowedCategoryIds.includes(c.id));

      setAllCategories((prev) =>
        JSON.stringify(prev) === JSON.stringify(list) ? prev : list
      );
      setCategoryOptions((prev) =>
        JSON.stringify(prev) === JSON.stringify(visible) ? prev : visible
      );

      if (!defaultCatSetRef.current && visible.length > 0) {
        setNewCatId(String(visible[0].id));
        defaultCatSetRef.current = true;
      }
    } finally {
      setLoadingCats(false);
    }
  }, [canView, isAdmin, allowedCategoryIds]);

  const fetchTypes = useCallback(async () => {
    if (!canView) return;

    setLoadingTypes(true);
    try {
      const res = await api.get("/tipos");
      const list = pickArray(res).map((t) => ({
        id: t.tipo_id,
        name: t.tipo_nome,
        catId: t.tipo_fk_categoria, // number
      }));

      const visible = isAdmin
        ? list
        : list.filter((t) => allowedCategoryIds.includes(t.catId));

      setAllTypes((prev) =>
        JSON.stringify(prev) === JSON.stringify(list) ? prev : list
      );
      setTypes((prev) =>
        JSON.stringify(prev) === JSON.stringify(visible) ? prev : visible
      );
    } finally {
      setLoadingTypes(false);
    }
  }, [canView, isAdmin, allowedCategoryIds]);

  // ===== Fetch inicial (sem loop) =====
  const didFetchRef = useRef(false);
  useEffect(() => {
    if (!canView) return;
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    fetchCategories();
    fetchTypes();
  }, [canView, fetchCategories, fetchTypes]);

  // ===== Ações =====
  const addType = useCallback(
    async (e) => {
      e?.preventDefault?.();

      if (!newName.trim() || !newCatId || !canManageType(newCatId)) return;

      setAddLoading(true);
      try {
        const { data } = await api.post("/tipos", {
          tipo_nome: newName.trim(),
          tipo_fk_categoria: Number(newCatId),
        });

        const created = {
          id: data.tipo_id,
          name: data.tipo_nome,
          catId: data.tipo_fk_categoria,
        };

        setAllTypes((prev) => [...prev, created]);
        if (isAdmin || allowedCategoryIds.includes(created.catId)) {
          setTypes((prev) => [...prev, created]);
        }

        setNewName("");
      } finally {
        setAddLoading(false);
      }
    },
    [newName, newCatId, canManageType, isAdmin, allowedCategoryIds]
  );

  const startEdit = useCallback(
    (t) => {
      if (!canManageType(t.catId)) return;
      setEditingId(t.id);
      setTempName(t.name);
      setTempCatId(String(t.catId));
    },
    [canManageType]
  );

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setTempName("");
    setTempCatId("");
  }, []);

  const saveEdit = useCallback(async () => {
    if (
      !editingId ||
      !tempName.trim() ||
      !tempCatId ||
      !canManageType(tempCatId)
    )
      return;

    setSaveLoading(true);
    try {
      const updatedName = tempName.trim();
      const updatedCatId = Number(tempCatId);

      await api.put(`/tipos/${editingId}`, {
        tipo_nome: updatedName,
        tipo_fk_categoria: updatedCatId,
      });

      // Atualiza lista completa
      setAllTypes((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? { ...t, name: updatedName, catId: updatedCatId }
            : t
        )
      );

      // Atualiza lista visível
      setTypes((prev) => {
        const next = prev.map((t) =>
          t.id === editingId
            ? { ...t, name: updatedName, catId: updatedCatId }
            : t
        );
        return isAdmin
          ? next
          : next.filter((t) => allowedCategoryIds.includes(t.catId));
      });

      cancelEdit();
    } finally {
      setSaveLoading(false);
    }
  }, [
    editingId,
    tempName,
    tempCatId,
    canManageType,
    cancelEdit,
    isAdmin,
    allowedCategoryIds,
  ]);

  const deleteType = useCallback(
    async (id) => {
      const t = allTypes.find((x) => x.id === id);
      if (!t || !canManageType(t.catId)) return;

      setDeleteLoading(id);
      try {
        await api.delete(`/tipos/${id}`);
        setAllTypes((prev) => prev.filter((x) => x.id !== id));
        setTypes((prev) => prev.filter((x) => x.id !== id));
      } finally {
        setDeleteLoading(null);
      }
    },
    [allTypes, canManageType]
  );

  // ===== Filtro / paginação =====
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return types;

    return types.filter((t) => {
      const catName = allCategories.find((c) => c.id === t.catId)?.name || "";
      return (
        t.name.toLowerCase().includes(q) || catName.toLowerCase().includes(q)
      );
    });
  }, [types, allCategories, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / typesPerPage));

  const current = useMemo(() => {
    const start = (currentPage - 1) * typesPerPage;
    return filtered.slice(start, start + typesPerPage);
  }, [filtered, currentPage, typesPerPage]);

  return {
    // perms
    isAdmin,
    allowedCategoryIds,
    canView,
    canManageType,

    // dados
    allCategories,
    categoryOptions,
    allTypes,
    types,

    // add form
    newName,
    setNewName,
    newCatId,
    setNewCatId,

    // edição
    editingId,
    tempName,
    setTempName,
    tempCatId,
    setTempCatId,

    // ui
    loading,
    addLoading,
    saveLoading,
    deleteLoading,

    // filtro/paginação
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    typesPerPage,
    totalPages,
    current,

    // ações
    fetchCategories,
    fetchTypes,
    addType,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteType,
  };
}
