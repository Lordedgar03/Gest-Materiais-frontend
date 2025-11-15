// src/hooks/useAlmoco.js
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";

/* ===== helpers ===== */

export const money = (n) =>
  Number(n || 0).toLocaleString("pt-PT", {
    style: "currency",
    currency: "STN",
  });

// Mesmo formato do backend (sv-SE -> YYYY-MM-DD)
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
      (typeof x === "string"
        ? x
        : x?.code || x?.name || x?.permission || ""
      )
        ?.toLowerCase()
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
  const [tone, setTone] = useState("ok"); // "ok" | "error"

  // gate – mesmo critério do módulo de vendas (manage_sales / admin)
  const allowed = useMemo(() => {
    if (typeof window === "undefined") return true; // SSR safe
    const token = localStorage.getItem("token");
    if (!token) return true; // se não tem token, não bloqueia UI (ficas livre pra tratar em outro middleware)
    return canUse(parseJwt(token));
  }, []);

  /* ===== API calls (conformes backend) ===== */

  // GET /almocos/preco-padrao
  const loadPreco = useCallback(async () => {
    try {
      const r = await api.get("/almocos/preco-padrao");
      const ppad = Number(r.data?.preco_padrao || 0);
      const phoje = Number(r.data?.preco_hoje ?? ppad);
      setPrecoPadrao(ppad);
      setPrecoHoje(phoje);
    } catch (e) {
      setToast("Falha ao obter preço padrão.");
      setTone("error");
      setPrecoPadrao(0);
      setPrecoHoje(0);
    }
  }, []);

  // PUT /almocos/preco  -> atualizarPrecoPadrao
  // ctx.action: atualizarPrecoPadrao
  const atualizarPrecoPadrao = useCallback(
    async (novo, { aplicarNoDia = false, dataDia } = {}) => {
      const valor = Number(novo);
      if (!Number.isFinite(valor) || valor <= 0) {
        setTone("error");
        setToast("Informe um preço válido (> 0).");
        return;
      }

      setUpdatingPreco(true);
      try {
        const body = { preco: valor };

        // Caso que o backend prevê: aplicar_no_dia + data (snapshot do dia)
        if (aplicarNoDia) {
          body.aplicar_no_dia = true;
          body.data = dataDia || today();
        }

        await api.put("/almocos/preco", body);
        await loadPreco();
        setTone("ok");
        setToast(
          aplicarNoDia
            ? "Preço padrão e preço do dia atualizados."
            : "Preço padrão atualizado."
        );
      } catch (e) {
        setTone("error");
        setToast(
          e?.response?.data?.message || "Falha ao atualizar o preço padrão."
        );
      } finally {
        setUpdatingPreco(false);
      }
    },
    [loadPreco]
  );

  // Alias para manter compatibilidade com o que já tinhas na UI
  const atualizarPreco = atualizarPrecoPadrao;

  // PUT /almocos/preco-dia  -> ajusta só o snapshot de UM dia
  // ctx.action: atualizarPrecoDoDia
  const atualizarPrecoDoDia = useCallback(
    async (data, novo) => {
      const valor = Number(novo);
      if (!data) {
        setTone("error");
        setToast("Informe a data para atualizar o preço do dia.");
        return;
      }
      if (!Number.isFinite(valor) || valor <= 0) {
        setTone("error");
        setToast("Informe um preço válido (> 0).");
        return;
      }

      setUpdatingPreco(true);
      try {
        await api.put("/almocos/preco-dia", { data, preco: valor });
        // se a data for o dia de hoje, faz sentido recarregar para refletir na UI
        if (data === today()) {
          await loadPreco();
        }
        setTone("ok");
        setToast("Preço do dia atualizado.");
      } catch (e) {
        setTone("error");
        setToast(
          e?.response?.data?.message ||
            "Falha ao atualizar o preço do dia."
        );
      } finally {
        setUpdatingPreco(false);
      }
    },
    [loadPreco]
  );

  // GET /almocos/relatorios/hoje
  const loadHoje = useCallback(async () => {
    setLoadingHoje(true);
    try {
      const r = await api.get("/almocos/relatorios/hoje");
      const safe =
        r.data || {
          totais: { total_arrecadado: 0, total_almocos: 0 },
          alunosHoje: [],
        };
      // backend: { alunosHoje: [...], totais: {...} }
      setRelHoje({
        totais: safe.totais || { total_arrecadado: 0, total_almocos: 0 },
        alunosHoje: Array.isArray(safe.alunosHoje) ? safe.alunosHoje : [],
      });
    } catch {
      setRelHoje({
        totais: { total_arrecadado: 0, total_almocos: 0 },
        alunosHoje: [],
      });
    } finally {
      setLoadingHoje(false);
    }
  }, []);

  // GET /marcacoes/marcados?data=YYYY-MM-DD
  const loadListaHoje = useCallback(async () => {
    setLoadingListaHoje(true);
    try {
      const r = await api.get("/marcacoes/marcados", {
        params: { data: today() },
      });
      const payload = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
      setListaHoje(payload);
    } catch {
      setListaHoje([]);
    } finally {
      setLoadingListaHoje(false);
    }
  }, []);

  // GET /almocos/relatorios/por-data?date=YYYY-MM-DD
  const loadPorData = useCallback(async (date) => {
    if (!date) return;
    setLoadingData(true);
    try {
      const r = await api.get("/almocos/relatorios/por-data", {
        params: { date },
      });
      // backend: { total_almocos, total_arrecadado, date }
      setRelData(r.data || null);
    } catch {
      setRelData(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // GET /marcacoes/marcados?data=YYYY-MM-DD
  const loadListaPorData = useCallback(async (date) => {
    if (!date) return;
    setLoadingListaData(true);
    try {
      const r = await api.get("/marcacoes/marcados", {
        params: { data: date },
      });
      const payload = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
      setListaData(payload);
    } catch {
      setListaData([]);
    } finally {
      setLoadingListaData(false);
    }
  }, []);

  // GET /almocos/relatorios/intervalo?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
  const loadIntervalo = useCallback(async (inicio, fim) => {
    if (!inicio || !fim) return;
    setLoadingIntervalo(true);
    try {
      const r = await api.get("/almocos/relatorios/intervalo", {
        params: { inicio, fim },
      });
      // backend: { total_almocos, total_arrecadado, inicio, fim }
      setRelIntervalo(r.data || null);
    } catch {
      setRelIntervalo(null);
    } finally {
      setLoadingIntervalo(false);
    }
  }, []);

  // GET /almocos/relatorios/mensal?ano=2025&mes=setembro|09
  const loadMensal = useCallback(async (ano, mes) => {
    if (!ano || !mes) return;
    setLoadingMensal(true);
    try {
      const r = await api.get("/almocos/relatorios/mensal", {
        params: { ano, mes },
      });
      // backend: { ano, mes, porTurma, totalGeral }
      setRelMensal(r.data || null);
    } catch {
      setRelMensal(null);
    } finally {
      setLoadingMensal(false);
    }
  }, []);

  /* ===== boot ===== */

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

  /* ===== retorno ===== */

  return {
    // gate
    allowed,
    loadingBoot,

    // preço
    precoPadrao,
    precoHoje,
    updatingPreco,
    atualizarPrecoPadrao,
    atualizarPreco,     // alias compatível
    atualizarPrecoDoDia,

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
