/* eslint-disable no-unused-vars */
// src/hooks/useAlunos.js
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";

/** util pequeno */
const persist = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

export default function useAlunos() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // filtros de busca
  const [filters, setFilters] = useState(() =>
    persist.get("alunos:filters", { nome: "", num_processo: "", numero: "", turma: "", ano: "", status: "" })
  );
  useEffect(() => persist.set("alunos:filters", filters), [filters]);

  // ordenação client-side
  const [sort, setSort] = useState(() => persist.get("alunos:sort", { by: "alu_nome", dir: "asc" }));
  useEffect(() => persist.set("alunos:sort", sort), [sort]);

  // preferências UI
  const [cols, setCols] = useState(() =>
    persist.get("alunos:cols", { nome: true, num_processo: true, numero: true, turma: true, ano: true, status: true })
  );
  useEffect(() => persist.set("alunos:cols", cols), [cols]);

  const [density, setDensity] = useState(() => persist.get("alunos:density", "comfortable"));
  useEffect(() => persist.set("alunos:density", density), [density]);

  const normalizeParams = (obj) => {
    const params = { ...obj };
    Object.keys(params).forEach((k) => {
      if (params[k] === "" || params[k] == null) delete params[k];
    });
    return params;
  };

  const load = useCallback(
    async (custom) => {
      setLoading(true);
      setError("");
      try {
        const params = normalizeParams({ ...filters, ...(custom || {}) });
        const r = await api.get("/alunos", { params });
        const arr = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
        setList(arr);
      } catch (e) {
        setError(e?.response?.data?.message || "Falha ao carregar alunos.");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const create = useCallback(
    async (payload) => {
      setError("");
      try {
        await api.post("/alunos", payload);
        setToast({ type: "success", message: "Aluno criado." });
        await load();
      } catch (e) {
        setError(e?.response?.data?.message || "Falha ao criar aluno.");
        setToast({ type: "error", message: "Falha ao criar aluno." });
      }
    },
    [load]
  );

  const update = useCallback(
    async (id, payload) => {
      setError("");
      try {
        await api.put(`/alunos/${id}`, payload);
        setToast({ type: "success", message: "Aluno atualizado." });
        await load();
      } catch (e) {
        setError(e?.response?.data?.message || "Falha ao atualizar aluno.");
        setToast({ type: "error", message: "Falha ao atualizar aluno." });
      }
    },
    [load]
  );

  /** Atualizar status/remover (fallback DELETE) */
  const setStatus = useCallback(
    async (id, status) => {
      setError("");
      try {
        await api.put(`/alunos/${id}`, { alu_status: status });
        setToast({ type: "success", message: "Status atualizado." });
      } catch (e) {
        if (e?.response?.status === 404 || e?.response?.status === 400) {
          try {
            await api.delete(`/alunos/${id}`);
            setToast({ type: "success", message: "Aluno removido." });
          } catch (e2) {
            setError(e2?.response?.data?.message || "Falha ao remover aluno.");
            setToast({ type: "error", message: "Falha ao remover aluno." });
          }
        } else {
          setError(e?.response?.data?.message || "Falha ao atualizar status.");
          setToast({ type: "error", message: "Falha ao atualizar status." });
        }
      } finally {
        await load();
      }
    },
    [load]
  );

  /** bulk status (ativa/desativa lista de ids) */
  const bulkStatus = useCallback(
    async (ids = [], nextStatus = "ativo") => {
      if (!ids.length) return;
      try {
        // tenta endpoint bulk; se não existir, iterativo
        try {
          await api.post("/alunos/bulk-status", { ids, status: nextStatus });
        } catch {
          await Promise.all(ids.map((id) => api.put(`/alunos/${id}`, { alu_status: nextStatus }).catch(() => null)));
        }
        setToast({ type: "success", message: `Atualizado: ${ids.length} registo(s).` });
      } catch {
        setToast({ type: "error", message: "Falha no processamento em massa." });
      } finally {
        load();
      }
    },
    [load]
  );

  /** ordena array em memória */
  const sorted = useMemo(() => {
    const arr = [...list];
    const { by, dir } = sort;
    const factor = dir === "desc" ? -1 : 1;
    arr.sort((a, b) => {
      const va = (a?.[by] ?? "").toString().toLowerCase();
      const vb = (b?.[by] ?? "").toString().toLowerCase();
      if (va < vb) return -1 * factor;
      if (va > vb) return 1 * factor;
      return 0;
    });
    return arr;
  }, [list, sort]);

  const setSortBy = (by) => {
    setSort((s) => (s.by === by ? { by, dir: s.dir === "asc" ? "desc" : "asc" } : { by, dir: "asc" }));
  };

  return {
    loading,
    error,
    toast, setToast,

    // dados
    list: sorted,

    // filtros
    filters, setFilters, load,

    // crud
    create, update, setStatus, bulkStatus,

    // preferências UI
    cols, setCols, density, setDensity,

    // ordenação
    sort, setSortBy,
  };
}
