// src/hooks/usePDV.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";

/* ===== helpers ===== */
export const fmt = (n) =>
  Number(n || 0).toLocaleString("pt-PT", { style: "currency", currency: "STN" });

// Decodifica JWT simples
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/** true se for admin OU possuir manage_sales */
function hasManageSales(decoded) {
  if (!decoded) return false;

  const roles = decoded.roles || [];
  if (decoded.is_admin === true || roles.includes("admin")) return true;

  const rawPerms = []
    .concat(decoded.permissions || [])
    .concat(decoded.perms || [])
    .concat(decoded.scopes || [])
    .concat(decoded.actions || [])
    .concat(decoded.allowed || []);

  const normPerms = new Set(
    rawPerms
      .map((p) => {
        if (typeof p === "string") return p.toLowerCase();
        if (p && typeof p === "object") {
          const cand = p.code || p.name || p.action_code || p.actionCode || p.permission;
          return cand ? String(cand).toLowerCase() : "";
        }
        return "";
      })
      .filter(Boolean),
  );

  if (normPerms.has("manage_sales")) return true;

  const templates = Array.isArray(decoded.templates) ? decoded.templates : [];
  const hasTemplate = templates.some((t) => {
    const cand =
      t?.template_code || t?.code || t?.name || t?.permission || t?.action_code || t?.actionCode;
    return String(cand || "").toLowerCase() === "manage_sales";
  });

  return hasTemplate;
}

/* ===== Hook principal ===== */
export function usePDV() {
  const decodedRef = useRef(null);
  if (!decodedRef.current && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    decodedRef.current = token ? parseJwt(token) : {};
  }
  const allowed = hasManageSales(decodedRef.current || {});

  const [materials, setMaterials] = useState([]);
  const [catalogQ, setCatalogQ] = useState("");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountMode, setDiscountMode] = useState("valor");

  const [payOpen, setPayOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("Dinheiro");

  const [loading, setLoading] = useState(false);
  const [loadingBoot, setLoadingBoot] = useState(true);

  const [caixa, setCaixa] = useState(null);
  const caixaAberto = caixa?.cx_status === "Aberto";

  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState("ok");

  useEffect(() => {
    (async () => {
      if (!allowed) {
        setLoadingBoot(false);
        return;
      }
      try {
        const mats = await api.get("/materiais");

        const vendaveis = (mats?.data || [])
          .filter(
            (m) =>
              (m.mat_status ?? "ativo") === "ativo" &&
              (m.mat_vendavel === "SIM" || m.mat_vendavel === true),
          )
          .map((m) => ({
            id: m.mat_id,
            nome: m.mat_nome,
            preco: Number(m.mat_preco || 0),
            stock: Number(m.mat_quantidade_estoque ?? m.stock ?? 0),
            min: Number(m.mat_estoque_minimo ?? m.min ?? 0),
          }));

        setMaterials(vendaveis);

        const cx = await api.get("/caixas/aberto").then((r) => r.data).catch(() => null);
        setCaixa(cx || null);
      } catch (err) {
        console.error(err);
        setToast("Falha ao carregar dados iniciais.");
        setToastTone("error");
      } finally {
        setLoadingBoot(false);
      }
    })();
  }, [allowed]);

  const subtotal = useMemo(() => cart.reduce((a, it) => a + it.preco * it.qtd, 0), [cart]);

  const discountValue = useMemo(() => {
    if (discountMode === "percent") {
      return Math.min(subtotal, (Number(discount || 0) / 100) * subtotal);
    }
    return Math.min(subtotal, Number(discount || 0));
  }, [discount, discountMode, subtotal]);

  const total = useMemo(
    () => Math.max(0, Number(subtotal) - Number(discountValue || 0)),
    [subtotal, discountValue],
  );

  const catalog = useMemo(
    () =>
      materials.filter((m) =>
        (m.nome + String(m.preco)).toLowerCase().includes((catalogQ || "").toLowerCase()),
      ),
    [materials, catalogQ],
  );

  const stockOf = (id) => {
    const m = materials.find((x) => x.id === id);
    return m ? Number(m.stock || 0) : 0;
  };

  const addItem = (mat) => {
    const available = stockOf(mat.id);
    const inCart = cart.find((i) => i.id === mat.id)?.qtd || 0;

    if (available <= inCart) {
      setToast("Quantidade solicitada excede o stock disponível.");
      setToastTone("error");
      return;
    }

    setCart((c) => {
      const i = c.findIndex((x) => x.id === mat.id);
      if (i >= 0) {
        const copy = [...c];
        copy[i] = { ...copy[i], qtd: copy[i].qtd + 1 };
        return copy;
      }
      return [...c, { id: mat.id, nome: mat.nome, preco: Number(mat.preco), qtd: 1 }];
    });
  };

  const inc = (id) => {
    const max = stockOf(id);
    setCart((c) =>
      c.map((it) => {
        if (it.id !== id) return it;
        if (it.qtd >= max) {
          setToast("Limite de stock atingido para este item.");
          setToastTone("error");
          return it;
        }
        return { ...it, qtd: it.qtd + 1 };
      }),
    );
  };

  const dec = (id) =>
    setCart((c) => c.map((it) => (it.id === id ? { ...it, qtd: Math.max(1, it.qtd - 1) } : it)));

  const updateQty = (id, qtd) => {
    const max = stockOf(id);
    const next = Math.max(1, Math.min(Number(qtd || 1), max));
    if (Number(qtd) > max) {
      setToast("Quantidade ajustada ao stock disponível.");
      setToastTone("error");
    }
    setCart((c) => c.map((it) => (it.id === id ? { ...it, qtd: next } : it)));
  };

  const removeItem = (id) => setCart((c) => c.filter((it) => it.id !== id));

  const clearSale = () => {
    setCart([]);
    setCustomer("");
    setDiscount(0);
    setDiscountMode("valor");
  };

  // ✅ pagar com retry: tenta com forma_pagamento; se backend rejeitar, tenta sem body
  const _paySale = async (venId) => {
    try {
      const res = await api.post(`/vendas/${venId}/pagar`, { forma_pagamento: payMethod });
      return res?.data;
    } catch (err) {
      const status = err?.response?.status;
      const msg = String(err?.response?.data?.message || err?.message || "");

      const isValidation =
        status === 422 ||
        status === 400 ||
        msg.toLowerCase().includes("validation") ||
        msg.toLowerCase().includes("parâmetros") ||
        msg.toLowerCase().includes("parameters");

      if (!isValidation) throw err;

      // retry sem body
      const res2 = await api.post(`/vendas/${venId}/pagar`);
      return res2?.data;
    }
  };

  /**
   * Checkout:
   * - cria venda
   * - adiciona itens
   * - aplica desconto
   * - paga (captura recibo.rec_id)
   */
  const checkout = async () => {
    if (!caixaAberto) {
      setToast("Abra o caixa do dia para registrar vendas.");
      setToastTone("error");
      return null;
    }
    if (cart.length === 0) return null;

    setLoading(true);
    try {
      const cliente = (customer || "").trim() || "Cliente";

      // 1) cria venda
      const created = await api.post("/vendas", { ven_cliente_nome: cliente });
      const venda = created?.data?.data || created?.data;
      const venId = venda?.ven_id;
      if (!venId) throw new Error("Falha ao abrir venda.");

      // 2) itens
      for (const it of cart) {
        await api.post(`/vendas/${venId}/itens`, {
          material_id: it.id,
          quantidade: it.qtd,
        });
      }

      // 3) desconto
      const descontoValor = Number(discountValue || 0);
      if (descontoValor > 0) {
        await api.post(`/vendas/${venId}/desconto`, { desconto: descontoValor });
      }

      // 4) pagar (agora retorna recibo)
      const paid = await _paySale(venId);

      const recId =
        paid?.recibo?.rec_id ||
        paid?.recibo?.id ||
        paid?.rec_id ||
        null;

      setPayOpen(false);
      clearSale();
      setToast("Venda registrada com sucesso!");
      setToastTone("ok");

      return {
        venda,
        ven_id: venId,
        rec_id: recId,
        recibo: paid?.recibo || null,
        paid,
      };
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Falha ao concluir venda.";
      setToast(msg);
      setToastTone("error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    allowed,
    loadingBoot,

    materials,
    setMaterials,
    catalog,
    catalogQ,
    setCatalogQ,

    cart,
    setCart,
    addItem,
    inc,
    dec,
    updateQty,
    removeItem,
    clearSale,
    stockOf,

    customer,
    setCustomer,
    discount,
    setDiscount,
    discountMode,
    setDiscountMode,

    payOpen,
    setPayOpen,

    payMethod,
    setPayMethod,

    caixa,
    caixaAberto,

    subtotal,
    discountValue,
    total,

    loading,
    checkout,

    toast,
    toastTone,
    setToast,
    setToastTone,

    fmt,
  };
}

export default usePDV;
