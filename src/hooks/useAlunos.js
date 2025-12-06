// src/hooks/useAlunos.js
"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../api";

// Decodifica JWT (igual padrão dos outros hooks)
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function useAlunos() {
  /** ===== Permissões (apenas para UI) ===== */
  const [canView, setCanView] = useState(true);
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCanView(false);
      setCanEdit(false);
      return;
    }

    const decoded = parseJwt(token);

    // Ajusta para o teu esquema de permissões/templates se quiser
    const isAdmin =
      decoded.is_admin === true ||
      (Array.isArray(decoded.roles) && decoded.roles.includes("admin"));

    if (isAdmin) {
      setCanView(true);
      setCanEdit(true);
      return;
    }

    // Exemplo simples: se tiver um template "manage_lunch" ou "manage_students"
    const templates = Array.isArray(decoded.templates) ? decoded.templates : [];
    const codes = templates.map((t) =>
      typeof t === "string" ? t : t?.template_code || t?.code || ""
    );

    const canManageStudents = codes.some((c) =>
      ["manage_students", "manage_lunch"].includes(c)
    );

    setCanView(canManageStudents);
    setCanEdit(canManageStudents);
  }, []);

  /** ===== Estado ===== */
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");

  /** ===== Carregar alunos ===== */
  const loadStudents = async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/alunos");
      // Backend pode devolver array direto ou { data: [...] }
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setStudents(data);
    } catch (err) {
      console.error("Erro ao carregar alunos:", err);
      setError(err?.response?.data?.message || "Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  /** ===== Criar / Atualizar / Remover ===== */

  // data -> objeto com os campos que o teu backend espera (ex: alu_nome, alu_numero, alu_turma, ...)
  const createStudent = async (data) => {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.post("/alunos", data);
      const created = res.data?.data || res.data;
      setStudents((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error("Erro ao criar aluno:", err);
      setError(err?.response?.data?.message || "Erro ao criar aluno");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const updateStudent = async (id, data) => {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.put(`/alunos/${id}`, data);
      const updated = res.data?.data || res.data;
      setStudents((prev) =>
        prev.map((s) =>
          String(s.id || s.alu_id) === String(id) ? { ...s, ...updated } : s
        )
      );
      return updated;
    } catch (err) {
      console.error("Erro ao atualizar aluno:", err);
      setError(err?.response?.data?.message || "Erro ao atualizar aluno");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = async (id) => {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      await api.delete(`/alunos/${id}`);
      setStudents((prev) =>
        prev.filter((s) => String(s.id || s.alu_id) !== String(id))
      );
    } catch (err) {
      console.error("Erro ao eliminar aluno:", err);
      setError(err?.response?.data?.message || "Erro ao eliminar aluno");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /** ===== Filtro simples por texto ===== */
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter((s) => {
      const nome = (s.nome || s.alu_nome || "").toString().toLowerCase();
      const numero = (s.numero || s.alu_numero || "").toString().toLowerCase();
      const turma = (s.turma || s.alu_turma || "").toString().toLowerCase();
      return nome.includes(q) || numero.includes(q) || turma.includes(q);
    });
  }, [students, search]);

  return {
    // dados
    students,
    filteredStudents,

    // estados
    loading,
    saving,
    error,

    // permissões (para controlar botões no UI)
    canView,
    canEdit,

    // filtros
    search,
    setSearch,

    // ações
    reload: loadStudents,
    createStudent,
    updateStudent,
    deleteStudent,
  };
}
