"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api"; // axios com interceptors (token) e baseURL http://localhost:3000/api
import {
  ShoppingCart, PlusCircle, X, Trash2, CreditCard, CheckCircle2, Lock, Loader2, Package, ArrowRight,
  Search, Percent, BadgeDollarSign, Minus, Plus, ShieldAlert
} from "lucide-react";

/* ===== helpers ===== */
const fmt = (n) => (Number(n || 0)).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });

// Decodifica JWT simples (igual ao padrão que você já usa)
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
      .filter(Boolean)
  );
  if (normPerms.has("manage_sales")) return true;

  const templates = Array.isArray(decoded.templates) ? decoded.templates : [];
  const hasTemplate = templates.some((t) => {
    const cand = t?.template_code || t?.code || t?.name || t?.permission || t?.action_code || t?.actionCode;
    return String(cand || "").toLowerCase() === "manage_sales";
  });

  return hasTemplate;
}

/* ===== Modal ===== */
function Modal({ open, title, onClose, children, footer }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div ref={ref} className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Fechar"><X size={18} /></button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/* ===== Toast ===== */
function Toast({ msg, tone = "ok", onClose }) {
  if (!msg) return null;
  const toneCls = tone === "error" ? "bg-rose-600" : "bg-gray-900";
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`flex items-start gap-3 rounded-xl ${toneCls} text-white px-4 py-3 shadow-xl`}>
        <CheckCircle2 className="mt-0.5 text-emerald-300" />
        <div className="text-sm">{msg}</div>
        <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100" aria-label="Fechar">✕</button>
      </div>
    </div>
  );
}

export default function PDV() {
  /** ===== Gate de permissão (admin/manage_sales) ===== */
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
  const [discountMode, setDiscountMode] = useState("valor"); // "valor" | "percent"
  const [payOpen, setPayOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("Dinheiro"); // (opcional – hoje não vai ao back)
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState("ok");
  const [caixa, setCaixa] = useState(null); // objeto do caixa de hoje (ou null)
  const [loadingBoot, setLoadingBoot] = useState(true);

  /* boot: materiais + status do caixa (só se permitido) */
  useEffect(() => {
    (async () => {
      if (!allowed) { setLoadingBoot(false); return; }
      try {
        const mats = await api.get("/materiais");
        const vendaveis = (mats?.data || [])
          .filter((m) => m.mat_status === "ativo" && m.mat_vendavel === "SIM")
          .map((m) => ({ id: m.mat_id, nome: m.mat_nome, preco: Number(m.mat_preco || 0) }));
        setMaterials(vendaveis);

        const cx = await api.get("/caixas/aberto").then(r => r.data).catch(() => null);
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

  const caixaAberto = caixa?.cx_status === "Aberto";
  const subtotal = useMemo(() => cart.reduce((a, it) => a + it.preco * it.qtd, 0), [cart]);
  const discountValue = useMemo(() => {
    if (discountMode === "percent") return Math.min(subtotal, (Number(discount || 0) / 100) * subtotal);
    return Math.min(subtotal, Number(discount || 0));
  }, [discount, discountMode, subtotal]);
  const total = useMemo(() => Math.max(0, Number(subtotal) - Number(discountValue || 0)), [subtotal, discountValue]);

  const catalog = useMemo(
    () => materials.filter(m => (m.nome + String(m.preco)).toLowerCase().includes(catalogQ.toLowerCase())),
    [materials, catalogQ]
  );

  const addItem = (mat) => {
    setCart((c) => {
      const i = c.findIndex((x) => x.id === mat.id);
      if (i >= 0) {
        const copy = [...c];
        copy[i] = { ...copy[i], qtd: copy[i].qtd + 1 };
        return copy;
      }
      return [...c, { id: mat.id, nome: mat.nome, preco: Number(mat.preco), qtd: 1 }];
    });
    setAddOpen(false);
  };
  const inc = (id) => setCart(c => c.map(it => it.id === id ? { ...it, qtd: it.qtd + 1 } : it));
  const dec = (id) => setCart(c => c.map(it => it.id === id ? { ...it, qtd: Math.max(1, it.qtd - 1) } : it));
  const updateQty = (id, qtd) => setCart((c) => c.map((it) => (it.id === id ? { ...it, qtd: Math.max(1, Number(qtd || 1)) } : it)));
  const removeItem = (id) => setCart((c) => c.filter((it) => it.id !== id));
  const clearSale = () => { setCart([]); setCustomer(""); setDiscount(0); setDiscountMode("valor"); };

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
          quantidade: it.qtd
        });
      }

      const descontoValor = Number(discountValue || 0);
      if (descontoValor > 0) {
        await api.post(`/vendas/${venda.ven_id}/desconto`, { desconto: descontoValor });
      }

      await api.post(`/vendas/${venda.ven_id}/pagar`);

      setPayOpen(false);
      clearSale();
      setToast("Venda registrada com sucesso!");
      setToastTone("ok");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Falha ao concluir venda.";
      setToast(msg);
      setToastTone("error");
    } finally {
      setLoading(false);
    }
  };

  if (loadingBoot) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </main>
    );
  }

  // Gate visual — sem permissão
  if (!allowed) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-rose-100 grid place-items-center">
            <ShieldAlert className="text-rose-600" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Sem permissão</h2>
          <p className="text-gray-600 text-sm">
            O seu utilizador não tem acesso ao módulo <b>Vendas</b> (PDV).
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b space-y-6">
      <header className="rounded-2xl p-6 bg-white border border-gray-300 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-indigo-100 grid place-items-center">
            <ShoppingCart className="text-indigo-600" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">PDV</h1>
            <p className="text-gray-600">Carrinho + Checkout</p>
          </div>
        </div>
        <div>
          {caixaAberto ? (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800">
              <Lock size={16} /> Caixa aberto
            </span>
          ) : (
            <a href="/caixa" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800">
              <Lock size={16} /> Abrir caixa <ArrowRight size={14} />
            </a>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Carrinho */}
        <div className="xl:col-span-2 rounded-2xl p-5 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Carrinho</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                <PlusCircle size={18} /> Adicionar item
              </button>
              <button onClick={clearSale} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border">
                <Trash2 size={18} /> Limpar
              </button>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              <Package className="mx-auto text-gray-400 mb-2" size={40} />
              Nenhum item no carrinho. Clique em “Adicionar item”.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <Th>Produto</Th>
                    <Th>Preço</Th>
                    <Th>Qtd</Th>
                    <Th>Total</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {cart.map((it, idx) => (
                    <tr key={it.id} className={`border-t ${idx % 2 ? "bg-gray-50/50" : ""}`}>
                      <Td>{it.nome}</Td>
                      <Td>{fmt(it.preco)}</Td>
                      <Td>
                        <div className="inline-flex items-center rounded-lg border">
                          <button onClick={() => dec(it.id)} className="p-1.5 hover:bg-gray-50" aria-label={`Diminuir ${it.nome}`}><Minus size={14} /></button>
                          <input
                            type="number" min="1" value={it.qtd}
                            onChange={(e) => updateQty(it.id, e.target.value)}
                            className="w-16 text-center px-1 py-1 outline-none"
                            aria-label={`Quantidade de ${it.nome}`}
                          />
                          <button onClick={() => inc(it.id)} className="p-1.5 hover:bg-gray-50" aria-label={`Aumentar ${it.nome}`}><Plus size={14} /></button>
                        </div>
                      </Td>
                      <Td className="font-medium">{fmt(it.preco * it.qtd)}</Td>
                      <Td className="text-right">
                        <button onClick={() => removeItem(it.id)} className="p-2 rounded hover:bg-gray-100 text-rose-600" aria-label={`Remover ${it.nome}`}>
                          <X size={16} />
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumo */}
        <aside className="rounded-2xl p-5 bg-white border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Resumo</h2>

          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <input
            type="text" value={customer} onChange={(e) => setCustomer(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-4" placeholder="Nome (opcional)"
          />

          <div className="space-y-2 mb-4 text-sm">
            <Row label="Subtotal" value={fmt(subtotal)} />
            <div className="flex items-center justify-between">
              <div className="text-gray-600 inline-flex items-center gap-1">
                {discountMode === "percent" ? <Percent size={16} /> : <BadgeDollarSign size={16} />}
                Desconto
              </div>
              <div className="flex items-center gap-2">
                <select value={discountMode} onChange={(e) => setDiscountMode(e.target.value)} className="border rounded-lg px-2 py-1 text-xs">
                  <option value="valor">€</option>
                  <option value="percent">%</option>
                </select>
                <input
                  type="number" step="0.01" min="0" value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-24 border rounded px-2 py-1 text-right"
                  aria-label="Valor de desconto"
                />
              </div>
            </div>
            <Row label="Desconto aplicado" value={`- ${fmt(discountValue)}`} className="text-amber-700" />
            <Row label="Total" value={fmt(total)} bold />
          </div>

          <button
            disabled={!caixaAberto || cart.length === 0}
            onClick={() => setPayOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            aria-disabled={!caixaAberto || cart.length === 0}
          >
            <CreditCard size={18} /> Finalizar pagamento
          </button>
        </aside>
      </section>

      {/* Modal: catálogo */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Adicionar item">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={catalogQ} onChange={(e) => setCatalogQ(e.target.value)}
            placeholder="Pesquisar produto…"
            className="w-full pl-8 pr-3 py-2 border rounded-lg"
          />
        </div>
        {catalog.length === 0 ? (
          <div className="text-sm text-gray-600">Nenhum item encontrado.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {catalog.map((m) => (
              <button
                key={m.id}
                onClick={() => addItem(m)}
                className="p-3 rounded-xl border hover:bg-gray-50 text-left"
                aria-label={`Adicionar ${m.nome}`}
              >
                <div className="font-medium">{m.nome}</div>
                <div className="text-sm text-gray-600">{fmt(m.preco)}</div>
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal: pagamento */}
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title={<span className="inline-flex items-center gap-2"><CreditCard className="text-emerald-600" /> Pagamento</span>}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setPayOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
            <button onClick={checkout} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} /> Confirmar</span>}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <Row label="Subtotal" value={fmt(subtotal)} />
          <Row label="Desconto" value={`- ${fmt(discountValue)}`} className="text-amber-700" />
          <Row label="Total" value={fmt(total)} bold />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pagamento</label>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option>Dinheiro</option>
              <option>Multibanco</option>
              <option>MB Way</option>
              <option>Cartão</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">*(opcional – atualmente não é enviado ao servidor)</p>
          </div>
        </div>
      </Modal>

      <Toast msg={toast} tone={toastTone} onClose={() => setToast("")} />
    </main>
  );
}

/* small bits */
function Th({ children }) { return <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase text-xs">{children}</th>; }
function Td({ children, className = "" }) { return <td className={`px-3 py-2 ${className}`}>{children}</td>; }
function Row({ label, value, bold = false, className = "" }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-semibold text-base" : "text-sm"} ${className}`}>
      <span className="text-gray-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}
