// src/hooks/useAlmocos.js
"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../api";

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function useAlmocos() {
  /** ===== Permissões básicas ===== */
  const [canView, setCanView] = useState(true);
  const [canEdit, setCanEdit] = useState(true);
  const [canViewReports, setCanViewReports] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCanView(false);
      setCanEdit(false);
      setCanViewReports(false);
      return;
    }

    const decoded = parseJwt(token);
    const isAdmin =
      decoded.is_admin === true ||
      (Array.isArray(decoded.roles) && decoded.roles.includes("admin"));

    if (isAdmin) {
      setCanView(true);
      setCanEdit(true);
      setCanViewReports(true);
      return;
    }

    const templates = Array.isArray(decoded.templates) ? decoded.templates : [];
    const codes = templates.map((t) =>
      typeof t === "string" ? t : t?.template_code || t?.code || ""
    );

    const manageLunch = codes.some((c) => c === "manage_lunch");
    const viewReports = codes.some((c) => c === "view_reports");

    setCanView(manageLunch || viewReports);
    setCanEdit(manageLunch);
    setCanViewReports(viewReports || manageLunch);
  }, []);

  /** ===== Estado ===== */

  // Preço padrão
  const [precoPadrao, setPrecoPadrao] = useState(null);

  // Marcações
  const [marcacoes, setMarcacoes] = useState([]);

  // Relatórios
  const [relatorioHoje, setRelatorioHoje] = useState(null);
  const [relatorioPorData, setRelatorioPorData] = useState(null);
  const [relatorioIntervalo, setRelatorioIntervalo] = useState(null);
  const [relatorioMensal, setRelatorioMensal] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /** ===== Preço padrão ===== */

  const loadPrecoPadrao = async () => {
    if (!canView) return;
    try {
      const res = await api.get("/almocos/preco-padrao");
      setPrecoPadrao(res.data?.preco || res.data?.precoPadrao || res.data);
    } catch (err) {
      console.error("Erro ao carregar preço padrão:", err);
      setError(err?.response?.data?.message || "Erro ao carregar preço padrão");
    }
  };

  const updatePrecoPadrao = async (novoPreco) => {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      // ajusta o corpo conforme o almocos.atualizarPrecoPadrao espera
      const res = await api.put("/almocos/preco", { preco: novoPreco });
      const valor = res.data?.preco || res.data?.precoPadrao || novoPreco;
      setPrecoPadrao(valor);
      return valor;
    } catch (err) {
      console.error("Erro ao atualizar preço padrão:", err);
      setError(
        err?.response?.data?.message || "Erro ao atualizar preço padrão"
      );
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /** ===== Marcações ===== */

  // Carrega marcações marcadas (por exemplo, para hoje ou filtro)
  const loadMarcacoes = async (params = {}) => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/marcacoes/marcados", { params });
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setMarcacoes(data);
    } catch (err) {
      console.error("Erro ao carregar marcações:", err);
      setError(err?.response?.data?.message || "Erro ao carregar marcações");
    } finally {
      setLoading(false);
    }
  };

  // Uma marcação simples
  const marcarAlmoco = async (payload) => {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      // payload: { aluno_id, data, tipo_refeicao, ... } → ajusta pros campos do teu backend
      const res = await api.post("/marcacoes", payload);
      const created = res.data?.data || res.data;
      setMarcacoes((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error("Erro ao marcar almoço:", err);
      setError(err?.response?.data?.message || "Erro ao marcar almoço");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Marcações em lote (ex: turma inteira)
  const marcarAlmocosEmLote = async (payload) => {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      // payload: lista de marcações
      const res = await api.post("/marcacoes/bulk", payload);
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      // Decide se queres mesclar no estado ou só recarregar
      setMarcacoes((prev) => [...prev, ...data]);
      return data;
    } catch (err) {
      console.error("Erro ao marcar almoços em lote:", err);
      setError(err?.response?.data?.message || "Erro ao marcar em lote");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const atualizarMarcacao = async (id, payload) => {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.put(`/marcacoes/${id}`, payload);
      const updated = res.data?.data || res.data;
      setMarcacoes((prev) =>
        prev.map((m) =>
          String(m.id || m.mar_id) === String(id) ? { ...m, ...updated } : m
        )
      );
      return updated;
    } catch (err) {
      console.error("Erro ao atualizar marcação:", err);
      setError(err?.response?.data?.message || "Erro ao atualizar marcação");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /** ===== Relatórios ===== */

  const loadRelatorioHoje = async () => {
    if (!canViewReports) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/almocos/relatorios/hoje");
      setRelatorioHoje(res.data);
      return res.data;
    } catch (err) {
      console.error("Erro ao carregar relatório de hoje:", err);
      setError(
        err?.response?.data?.message || "Erro ao carregar relatório de hoje"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadRelatorioPorData = async (data) => {
    if (!canViewReports) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/almocos/relatorios/por-data", {
        params: { data },
      });
      setRelatorioPorData(res.data);
      return res.data;
    } catch (err) {
      console.error("Erro ao carregar relatório por data:", err);
      setError(
        err?.response?.data?.message || "Erro ao carregar relatório por data"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadRelatorioIntervalo = async (inicio, fim) => {
    if (!canViewReports) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/almocos/relatorios/intervalo", {
        params: { inicio, fim },
      });
      setRelatorioIntervalo(res.data);
      return res.data;
    } catch (err) {
      console.error("Erro ao carregar relatório por intervalo:", err);
      setError(
        err?.response?.data?.message ||
          "Erro ao carregar relatório por intervalo"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadRelatorioMensal = async (ano, mes) => {
    if (!canViewReports) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/almocos/relatorios/mensal", {
        params: { ano, mes },
      });
      setRelatorioMensal(res.data);
      return res.data;
    } catch (err) {
      console.error("Erro ao carregar relatório mensal:", err);
      setError(
        err?.response?.data?.message || "Erro ao carregar relatório mensal"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /** ===== Derivados simples ===== */
  const totalMarcacoes = useMemo(
    () => (Array.isArray(marcacoes) ? marcacoes.length : 0),
    [marcacoes]
  );

  return {
    // estados brutos
    precoPadrao,
    marcacoes,
    relatorioHoje,
    relatorioPorData,
    relatorioIntervalo,
    relatorioMensal,

    // derivados
    totalMarcacoes,

    // flags
    loading,
    saving,
    error,

    // permissões
    canView,
    canEdit,
    canViewReports,

    // ações
    reloadPreco: loadPrecoPadrao,
    updatePrecoPadrao,

    loadMarcacoes,
    marcarAlmoco,
    marcarAlmocosEmLote,
    atualizarMarcacao,

    loadRelatorioHoje,
    loadRelatorioPorData,
    loadRelatorioIntervalo,
    loadRelatorioMensal,
  };
}
