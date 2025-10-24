// src/hooks/useMaterials.js
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import api from "../api";

/* -------- utils -------- */
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json || "{}");
  } catch {
    return {};
  }
}
const asNumber = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const pickArray = (res) =>
  Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];

/* -------- hook -------- */
export function useMaterials() {
  /** ===== Auth & Permissões (estáveis) ===== */
  const decodedRef = useRef(null);
  if (!decodedRef.current && typeof window !== "undefined") {
    const t = localStorage.getItem("token");
    decodedRef.current = t ? parseJwt(t) : {};
  }
  const decoded = decodedRef.current || {};
  const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
  const isAdmin = roles.includes("admin");

  // manage_category pode vir com resource_id (limitação a certas categorias)
  const allowedCategoryIds = (Array.isArray(decoded.templates) ? decoded.templates : [])
    .filter((t) => t?.template_code === "manage_category")
    .map((t) => asNumber(t?.resource_id))
    .filter(Boolean);

  /** ===== Estado ===== */
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // filtros / paginação
  const [filterText, setFilterText] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockFilter, setStockFilter] = useState(""); // "", "low", "normal"
  const [consumivelFilter, setConsumivelFilter] = useState(""); // "", "sim", "não"
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // form
  const [showForm, setShowForm] = useState(false);
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
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // remoção
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteMode, setDeleteMode] = useState("partial"); // 'partial' | 'all'
  const [deleteQty, setDeleteQty] = useState(1);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteErrors, setDeleteErrors] = useState({});

  /** ===== Helpers de permissão ===== */
  const canManageType = useCallback(
    (tipoId) => {
      if (isAdmin) return true;
      const t = types.find((tt) => Number(tt.tipo_id) === Number(tipoId));
      return !!(t && allowedCategoryIds.includes(Number(t.tipo_fk_categoria)));
    },
    [isAdmin, types, allowedCategoryIds]
  );

  const canManageMaterial = useCallback(
    (mat) => (isAdmin ? true : canManageType(mat?.mat_fk_tipo)),
    [isAdmin, canManageType]
  );

  const canView = isAdmin || allowedCategoryIds.length > 0;

  /** ===== Boot ===== */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!canView) return;
      setLoading(true);
      setError(null);
      try {
        const [catRes, typRes, matRes] = await Promise.all([
          api.get("/categorias"),
          api.get("/tipos"),
          api.get("/materiais"),
        ]);
        const catsRaw = pickArray(catRes).map((c) => ({ cat_id: c.cat_id, cat_nome: c.cat_nome }));
        const typesRaw = pickArray(typRes).map((t) => ({
          tipo_id: t.tipo_id,
          tipo_nome: t.tipo_nome,
          tipo_fk_categoria: t.tipo_fk_categoria,
        }));
        const matsRaw = pickArray(matRes);

        const visibleCats = isAdmin
          ? catsRaw
          : catsRaw.filter((c) => allowedCategoryIds.includes(Number(c.cat_id)));
        const visibleTypes = isAdmin
          ? typesRaw
          : typesRaw.filter((t) => allowedCategoryIds.includes(Number(t.tipo_fk_categoria)));
        const visibleMaterials = isAdmin
          ? matsRaw
          : matsRaw.filter((m) =>
              visibleTypes.some((t) => Number(t.tipo_id) === Number(m.mat_fk_tipo))
            );

        if (!alive) return;
        setCategories(visibleCats);
        setTypes(visibleTypes);
        setMaterials(visibleMaterials);
      } catch (e) {
        console.error(e);
        if (alive) setError("Erro ao carregar dados.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetchMaterials = useCallback(async () => {
    try {
      const res = await api.get("/materiais");
      const list = pickArray(res);
      setMaterials(isAdmin ? list : list.filter((m) => canManageMaterial(m)));
    } catch (e) {
      console.error(e);
      setError("Erro ao carregar materiais.");
    }
  }, [isAdmin, canManageMaterial]);

  /** ===== Filtros/Paginação ===== */
  const filteredMaterials = useMemo(() => {
    const q = filterText.trim().toLowerCase();

    return materials.filter((m) => {
      const byText =
        (m.mat_nome ?? "").toLowerCase().includes(q) ||
        (m.mat_descricao ?? "").toLowerCase().includes(q);

      const byType = !selectedType || String(m.mat_fk_tipo) === String(selectedType);

      const typeObj = types.find((t) => Number(t.tipo_id) === Number(m.mat_fk_tipo));
      const byCategory =
        !selectedCategory ||
        (typeObj && String(typeObj.tipo_fk_categoria) === String(selectedCategory));

      const qty = asNumber(m.mat_quantidade_estoque);
      const min = asNumber(m.mat_estoque_minimo);
      const byStock =
        !stockFilter ||
        (stockFilter === "low" && qty < min) ||
        (stockFilter === "normal" && qty >= min);

      const cons = (m.mat_consumivel ?? "").toString().toLowerCase();
      const byConsumivel =
        !consumivelFilter ||
        (consumivelFilter === "sim" && cons === "sim") ||
        (consumivelFilter === "não" && cons === "não");

      return byText && byType && byCategory && byStock && byConsumivel;
    });
  }, [materials, types, filterText, selectedType, selectedCategory, stockFilter, consumivelFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / pageSize));
  const pageMaterials = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMaterials.slice(start, start + pageSize);
  }, [filteredMaterials, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, selectedType, selectedCategory, stockFilter, consumivelFilter]);

  /** ===== Form ===== */
  const validateForm = useCallback(() => {
    const errs = {};
    if (!formData.mat_nome.trim()) errs.mat_nome = "Nome é obrigatório.";

    if (!formData.mat_fk_tipo) errs.mat_fk_tipo = "Tipo é obrigatório.";
    else if (!canManageType(formData.mat_fk_tipo)) errs.mat_fk_tipo = "Sem permissão para este tipo.";

    if (!String(formData.mat_localizacao || "").trim())
      errs.mat_localizacao = "Localização é obrigatória.";

    if (asNumber(formData.mat_preco, -1) < 0) errs.mat_preco = "Preço inválido.";
    if (asNumber(formData.mat_quantidade_estoque, -1) < 0)
      errs.mat_quantidade_estoque = "Quantidade inválida.";
    if (asNumber(formData.mat_estoque_minimo, -1) < 0)
      errs.mat_estoque_minimo = "Estoque mínimo inválido.";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formData, canManageType]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setError(null);
    const payload = {
      ...formData,
      mat_preco: asNumber(formData.mat_preco),
      mat_quantidade_estoque: asNumber(formData.mat_quantidade_estoque),
      mat_estoque_minimo: asNumber(formData.mat_estoque_minimo),
      mat_fk_tipo: asNumber(formData.mat_fk_tipo),
    };
    try {
      if (editingId) {
        await api.put(`/materiais/${editingId}`, payload);
      } else {
        await api.post("/materiais", payload);
      }
      resetForm();
      await refetchMaterials();
    } catch (e) {
      console.error(e?.response?.data || e);
      setError(e?.response?.data?.message || "Erro ao salvar material.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (mat) => {
    if (!canManageMaterial(mat)) {
      window.alert("Sem permissão para editar este material.");
      return;
    }
    setShowForm(true);
    setEditingId(mat.mat_id);
    setFormData({
      mat_nome: mat.mat_nome ?? "",
      mat_descricao: mat.mat_descricao ?? "",
      mat_preco: String(mat.mat_preco ?? ""),
      mat_quantidade_estoque: String(mat.mat_quantidade_estoque ?? ""),
      mat_estoque_minimo: String(mat.mat_estoque_minimo ?? "3"),
      mat_fk_tipo: String(mat.mat_fk_tipo ?? ""),
      mat_localizacao: mat.mat_localizacao ?? "",
      mat_vendavel: mat.mat_vendavel ?? "SIM",
      mat_consumivel: mat.mat_consumivel ?? "não",
    });
  };

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
    });
    setFormErrors({});
    setShowForm(false);
    setEditingId(null);
  };

  /** ===== Remoção ===== */
  const openDeleteModal = (material, mode = "partial") => {
    const estoqueAtual = asNumber(material?.mat_quantidade_estoque);
    setDeleteTarget(material);
    setDeleteMode(mode);
    setDeleteQty(mode === "all" ? estoqueAtual : Math.max(1, Math.min(1, estoqueAtual)));
    setDeleteReason("");
    setDeleteErrors({});
    setDeleteOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteOpen(false);
    setDeleteTarget(null);
    setDeleteMode("partial");
    setDeleteQty(1);
    setDeleteReason("");
    setDeleteErrors({});
  };
  const validateDelete = () => {
    const errs = {};
    const estoqueAtual = asNumber(deleteTarget?.mat_quantidade_estoque);
    const q = asNumber(deleteQty);
    if (!Number.isFinite(q) || q <= 0) errs.qty = "Quantidade inválida.";
    else if (q > estoqueAtual) errs.qty = `Maior que o estoque disponível (${estoqueAtual}).`;
    if (!deleteReason || deleteReason.trim().length < 3) errs.reason = "Descreva o motivo.";
    setDeleteErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (!canManageMaterial(deleteTarget)) {
      window.alert("Sem permissão para excluir este material.");
      return;
    }
    if (!validateDelete()) return;
    const id = deleteTarget.mat_id;
    try {
      await api.delete(`/materiais/${id}`, {
        data: { quantidade: asNumber(deleteQty), descricao: deleteReason.trim() },
      });
      closeDeleteModal();
      await refetchMaterials();
    } catch (e) {
      console.error(e?.response?.data || e);
      setError(e?.response?.data?.message || "Erro ao excluir material.");
    }
  };

  return {
    // perms
    isAdmin,
    canView,
    canCreate: isAdmin || types.some((t) => allowedCategoryIds.includes(Number(t.tipo_fk_categoria))),
    canManageMaterial,
    allowedCategoryIds,
    allowedTypeIds: types
      .filter((t) => isAdmin || allowedCategoryIds.includes(Number(t.tipo_fk_categoria)))
      .map((t) => t.tipo_id),

    // dados/estado
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
  };
}
