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

/** true se for admin OU possuir manage_sales (em permissions/perms/scopes OU em templates) */
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
  // Gate de permissão
  const decodedRef = useRef(null);
  if (!decodedRef.current && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    decodedRef.current = token ? parseJwt(token) : {};
  }
  const allowed = hasManageSales(decodedRef.current || {});

  // Estado base
  const [materials, setMaterials] = useState([]); // [{id, nome, preco, stock, min}]
  const [catalogQ, setCatalogQ] = useState("");
  const [cart, setCart] = useState([]); // [{id, nome, preco, qtd}]
  const [customer, setCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountMode, setDiscountMode] = useState("valor"); // "valor" | "percent"

  // Modais
  const [payOpen, setPayOpen] = useState(false);

  // Pagamento (opcional; não vai ao back hoje)
  const [payMethod, setPayMethod] = useState("Dinheiro");

  // Loading/control
  const [loading, setLoading] = useState(false); // checkout
  const [loadingBoot, setLoadingBoot] = useState(true);

  // Caixa do dia
  const [caixa, setCaixa] = useState(null); // objeto do caixa de hoje (ou null)
  const caixaAberto = caixa?.cx_status === "Aberto";

  // Toast
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState("ok"); // ok | error

  /* boot: materiais + status do caixa (só se permitido) */
  useEffect(() => {
    (async () => {
      if (!allowed) {
        setLoadingBoot(false);
        return;
      }
      try {
        const mats = await api.get("/materiais");
        // inclui stock e mínimo
        const vendaveis = (mats?.data || [])
          .filter((m) => (m.mat_status ?? "ativo") === "ativo" && (m.mat_vendavel === "SIM" || m.mat_vendavel === true))
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

  // Derivados
  const subtotal = useMemo(
    () => cart.reduce((a, it) => a + it.preco * it.qtd, 0),
    [cart],
  );

  const discountValue = useMemo(() => {
    if (discountMode === "percent")
      return Math.min(subtotal, (Number(discount || 0) / 100) * subtotal);
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

  /* Helpers de stock */
  const stockOf = (id) => {
    const m = materials.find((x) => x.id === id);
    return m ? Number(m.stock || 0) : 0;
  };

  /* Carrinho (respeitando stock) */
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

  // Checkout
  const checkout = async () => {
    if (!caixaAberto) {
      setToast("Abra o caixa do dia para registrar vendas.");
      setToastTone("error");
      return;
    }
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const cliente = (customer || "").trim() || "Cliente";
      const created = await api.post("/vendas", { ven_cliente_nome: cliente });
      const venda = created?.data?.data || created?.data;
      if (!venda?.ven_id) throw new Error("Falha ao abrir venda.");

      for (const it of cart) {
        await api.post(`/vendas/${venda.ven_id}/itens`, {
          material_id: it.id,
          quantidade: it.qtd,
        });
      }

      const descontoValor = Number(discountValue || 0);
      if (descontoValor > 0) {
        await api.post(`/vendas/${venda.ven_id}/desconto`, { desconto: descontoValor, modo: discountMode });
      }

      await api.post(`/vendas/${venda.ven_id}/pagar`, { metodo: payMethod });

      clearSale();
      setToast("Venda registrada com sucesso!");
      setToastTone("ok");

      // Retorna dica de recibo para o front imprimir se quiser
      return { venda: { ven_id: venda.ven_id }, recibo: { pdf_hint: `/api/vendas/${venda.ven_id}/recibo/pdf` } };
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Falha ao concluir venda.";
      setToast(msg);
      setToastTone("error");
      throw err;
    } finally {
      setLoading(false);
      setPayOpen(false);
    }
  };

  return {
    // gate
    allowed,
    // boot
    loadingBoot,
    // materiais com stock
    materials, setMaterials,
    catalog, catalogQ, setCatalogQ,
    // carrinho
    cart, setCart, addItem, inc, dec, updateQty, removeItem, clearSale, stockOf,
    // cliente e desconto
    customer, setCustomer, discount, setDiscount, discountMode, setDiscountMode,
    // modais
    payOpen, setPayOpen,
    // caixa
    caixa, caixaAberto,
    // derivados
    subtotal, discountValue, total,
    // checkout
    loading, checkout, payMethod, setPayMethod,
    // toast
    toast, toastTone, setToast, setToastTone,
    // utils
    fmt,
  };
}

export default usePDV;
