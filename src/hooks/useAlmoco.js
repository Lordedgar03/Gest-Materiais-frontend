/* eslint-disable no-unused-vars */
// src/hooks/useAlmoco.js
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";

/* ===== helpers ===== */
export const money = (n) =>
  Number(n || 0).toLocaleString("pt-PT", { style: "currency", currency: "STN" });

export const today = () => new Date().toLocaleString("sv-SE").slice(0, 10);

function parseJwt(t) {
  try {
    const b = t.split(".")[1];
    return JSON.parse(atob(b.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

function canUse(decoded) {
  const roles = decoded?.roles || [];
  if (decoded?.is_admin || roles.includes("admin")) return true;

  const perms = [
    ...(decoded?.permissions || []),
    ...(decoded?.perms || []),
    ...(decoded?.scopes || []),
    ...(decoded?.actions || []),
    ...(decoded?.allowed || []),
  ]
    .map((x) =>
      (typeof x === "string" ? x : (x?.code || x?.name || x?.permission || ""))?.toLowerCase()
    )
    .filter(Boolean);

  if (perms.includes("manage_sales")) return true;

  const templates = (decoded?.templates || []).map(
    (t) => (t?.template_code || t?.code || "").toLowerCase()
  );
  return templates.includes("manage_sales");
}

/* ===== hook ===== */
export default function useAlmoco() {
  const [loadingBoot, setLoadingBoot] = useState(true);

  // preço
  const [precoPadrao, setPrecoPadrao] = useState(0);
  const [precoHoje, setPrecoHoje] = useState(0);
  const [updatingPreco, setUpdatingPreco] = useState(false);

  // relatórios (sumários)
  const [relHoje, setRelHoje] = useState({
    totais: { total_arrecadado: 0, total_almocos: 0 },
    alunosHoje: [],
  });
  const [loadingHoje, setLoadingHoje] = useState(false);

  const [relData, setRelData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  const [relIntervalo, setRelIntervalo] = useState(null);
  const [loadingIntervalo, setLoadingIntervalo] = useState(false);

  const [relMensal, setRelMensal] = useState(null);
  const [loadingMensal, setLoadingMensal] = useState(false);

  // LISTAS (alunos por dia)
  const [listaHoje, setListaHoje] = useState([]);
  const [loadingListaHoje, setLoadingListaHoje] = useState(false);

  const [listaData, setListaData] = useState([]);
  const [loadingListaData, setLoadingListaData] = useState(false);

  // toasts
  const [toast, setToast] = useState("");
  const [tone, setTone] = useState("ok");

  // gate
  const allowed = useMemo(() => {
    if (typeof window === "undefined") return true;
    const token = localStorage.getItem("token");
    if (!token) return true;
    return canUse(parseJwt(token));
  }, []);

  /* ===== API calls ===== */

  const loadPreco = useCallback(async () => {
    try {
      const r = await api.get("/almocos/preco-padrao");
      const ppad = Number(r.data?.preco_padrao || 0);
      const phoje = Number(r.data?.preco_hoje ?? ppad);
      setPrecoPadrao(ppad);
      setPrecoHoje(phoje);
    } catch (e) {
      setToast("Falha a obter preço padrão.");
      setTone("error");
      setPrecoPadrao(0);
      setPrecoHoje(0);
    }
  }, []);

  const atualizarPreco = useCallback(
    async (novo, { aplicarHoje = false } = {}) => {
      const valor = Number(novo);
      if (!Number.isFinite(valor) || valor <= 0) {
        setTone("error");
        setToast("Informe um preço válido (> 0).");
        return;
      }

      setUpdatingPreco(true);
      try {
        const body = { preco: valor };
        if (aplicarHoje) {
          body.aplicar_no_dia = true;
          body.data = today();
        }
        await api.put("/almocos/preco", body);
        await loadPreco();
        setTone("ok");
        setToast(aplicarHoje ? "Preço padrão e de hoje atualizados." : "Preço padrão atualizado.");
      } catch (e) {
        setTone("error");
        setToast(e?.response?.data?.message || "Falha ao atualizar o preço.");
      } finally {
        setUpdatingPreco(false);
      }
    },
    [loadPreco]
  );

  // sumário de hoje
  const loadHoje = useCallback(async () => {
    setLoadingHoje(true);
    try {
      const r = await api.get("/almocos/relatorios/hoje");
      const safe = r.data || { totais: { total_arrecadado: 0, total_almocos: 0 }, alunosHoje: [] };
      setRelHoje(safe);
    } catch {
      setRelHoje({ totais: { total_arrecadado: 0, total_almocos: 0 }, alunosHoje: [] });
    } finally {
      setLoadingHoje(false);
    }
  }, []);

  // lista de hoje (todos os alunos marcados hoje)
  const loadListaHoje = useCallback(async () => {
    setLoadingListaHoje(true);
    try {
      const r = await api.get("/marcacoes/marcados", { params: { data: today() } });
      setListaHoje(Array.isArray(r.data) ? r.data : r.data?.data ?? []);
    } catch {
      setListaHoje([]);
    } finally {
      setLoadingListaHoje(false);
    }
  }, []);

  // sumário por data
  const loadPorData = useCallback(async (date) => {
    if (!date) return;
    setLoadingData(true);
    try {
      const r = await api.get("/almocos/relatorios/por-data", { params: { date } });
      setRelData(r.data || null);
    } catch {
      setRelData(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // lista por data
  const loadListaPorData = useCallback(async (date) => {
    if (!date) return;
    setLoadingListaData(true);
    try {
      const r = await api.get("/marcacoes/marcados", { params: { data: date } });
      setListaData(Array.isArray(r.data) ? r.data : r.data?.data ?? []);
    } catch {
      setListaData([]);
    } finally {
      setLoadingListaData(false);
    }
  }, []);

  // intervalo / mensal (sumários)
  const loadIntervalo = useCallback(async (inicio, fim) => {
    if (!inicio || !fim) return;
    setLoadingIntervalo(true);
    try {
      const r = await api.get("/almocos/relatorios/intervalo", { params: { inicio, fim } });
      setRelIntervalo(r.data || null);
    } catch {
      setRelIntervalo(null);
    } finally {
      setLoadingIntervalo(false);
    }
  }, []);

  const loadMensal = useCallback(async (ano, mes) => {
    if (!ano || !mes) return;
    setLoadingMensal(true);
    try {
      const r = await api.get("/almocos/relatorios/mensal", { params: { ano, mes } });
      setRelMensal(r.data || null);
    } catch {
      setRelMensal(null);
    } finally {
      setLoadingMensal(false);
    }
  }, []);

  /* boot */
  useEffect(() => {
    (async () => {
      if (!allowed) {
        setLoadingBoot(false);
        return;
      }
      try {
        await Promise.all([loadPreco(), loadHoje(), loadListaHoje()]);
      } finally {
        setLoadingBoot(false);
      }
    })();
  }, [allowed, loadPreco, loadHoje, loadListaHoje]);

  return {
    // gate
    allowed,
    loadingBoot,

    // preço
    precoPadrao,
    precoHoje,
    atualizarPreco,
    updatingPreco,

    // relatórios (sumário)
    relHoje,
    loadingHoje,
    relData,
    loadingData,
    loadPorData,
    relIntervalo,
    loadingIntervalo,
    loadIntervalo,
    relMensal,
    loadingMensal,
    loadMensal,

    // listas (detalhado)
    listaHoje,
    loadingListaHoje,
    listaData,
    loadingListaData,
    loadListaPorData,

    // UI
    toast,
    setToast,
    tone,
    setTone,

    // helpers
    money,
    today,
  };
}
