/* eslint-disable no-unused-vars */
"use client";

import React from "react";
import {
  ShoppingCart, PlusCircle, X, Trash2, CreditCard, CheckCircle2, Lock, Loader2,
  Package, ArrowRight, Search, Percent, BadgeDollarSign, Minus, Plus,
  ShieldAlert, Check, Filter, Moon, SunMedium
} from "lucide-react";
import { Formik, Form, FieldArray, useFormikContext } from "formik";
import * as Yup from "yup";
import { usePDV, fmt } from "../hooks/usePDV";

/* ========== Dark mode ========== */
function useDarkMode() {
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    const stored = localStorage.getItem("theme");
    const shouldDark = stored
      ? stored === "dark"
      : window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    document.documentElement.classList.toggle("dark", !!shouldDark);
    setDark(!!shouldDark);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };
  return { dark, toggle };
}

/* ========== Modal genérico ========== */
function Modal({ open, title, onClose, children, footer, maxW = "max-w-2xl" }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full ${maxW} rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl`}>
          <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{title}</h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t dark:border-zinc-800">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/* ========== Toast ========== */
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

/* ========== Sincronizador rápido (Formik -> hook) ========== */
function Sync({ setCart, setCustomer, setDiscount, setDiscountMode }) {
  const { values } = useFormikContext();
  React.useEffect(() => { setCart(values.cart || []); }, [values.cart, setCart]);
  React.useEffect(() => { setCustomer(values.customer || ""); }, [values.customer, setCustomer]);
  React.useEffect(() => { setDiscount(values.discount || 0); }, [values.discount, setDiscount]);
  React.useEffect(() => { setDiscountMode(values.discountMode || "valor"); }, [values.discountMode, setDiscountMode]);
  return null;
}

/* ========== Página ========== */
export default function PDV() {
  const { dark, toggle } = useDarkMode();

  const {
    // gate
    allowed, loadingBoot,
    // materiais + stock
    materials, catalogQ, setCatalogQ, addItem, stockOf,
    // carrinho/checkout
    cart, setCart, inc, dec, updateQty, removeItem,
    customer, setCustomer, discount, setDiscount, discountMode, setDiscountMode,
    payOpen, setPayOpen,
    caixaAberto,
    subtotal, discountValue, total,
    loading, checkout,
    toast, toastTone, setToast,
  } = usePDV();

  const [stockFilter, setStockFilter] = React.useState(""); // "", "low", "ok"

  const products = React.useMemo(() => {
    let arr = materials;
    if (stockFilter === "low") arr = arr.filter((p) => p.min > 0 && p.stock <= p.min);
    if (stockFilter === "ok")  arr = arr.filter((p) => p.stock > (p.min || 0));
    if (catalogQ?.trim()) {
      const q = catalogQ.trim().toLowerCase();
      arr = arr.filter((p) => (p.nome + p.preco).toLowerCase().includes(q));
    }
    return arr;
  }, [materials, catalogQ, stockFilter]);

  const initialValues = {
    customer: customer || "",
    discount: discount || 0,
    discountMode: discountMode || "valor",
    cart: cart || [],
  };

  const schema = Yup.object({
    customer: Yup.string().max(120, "Nome muito longo"),
    discount: Yup.number().min(0, ">= 0").required(),
    discountMode: Yup.mixed().oneOf(["valor", "percent"]),
    cart: Yup.array().of(
      Yup.object({
        id: Yup.number().required(),
        nome: Yup.string().required(),
        preco: Yup.number().min(0).required(),
        qtd: Yup.number().min(1).required(),
      })
    )
  });

  const handleCheckout = async () => {
    try {
      const result = await checkout();
      setPayOpen(false);
      const url = result?.recibo?.pdf_hint;
      if (url) {
        const res = await fetch(url);
        const blob = await res.blob();
        const i = document.createElement("iframe");
        i.style.position = "fixed"; i.style.right = 0; i.style.bottom = 0; i.style.width = 0; i.style.height = 0; i.style.border = 0;
        i.src = URL.createObjectURL(blob);
        document.body.appendChild(i);
        i.onload = () => {
          i.contentWindow?.print?.();
          setTimeout(() => { URL.revokeObjectURL(i.src); document.body.removeChild(i); }, 800);
        };
      }
    } catch (e) {
      // erro já tratado no hook
    }
  };

  if (loadingBoot) {
    return (
      <main className="min-h-screen grid place-items-center bg-white dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-white dark:bg-zinc-950">
        <div className="max-w-md w-full rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-rose-100 grid place-items-center">
            <ShieldAlert className="text-rose-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-1">Sem permissão</h2>
          <p className="text-gray-600 dark:text-zinc-300 text-sm">
            O seu utilizador não tem acesso ao módulo <b>Vendas</b> (Atendimento).
          </p>
        </div>
      </main>
    );
  }

  return (
    <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={() => setPayOpen(true)}>
      {({ values, setFieldValue }) => (
        <Form className="min-h-screen bg-gray-50 dark:bg-zinc-950">
          <Sync
            setCart={setCart}
            setCustomer={setCustomer}
            setDiscount={setDiscount}
            setDiscountMode={setDiscountMode}
          />

          {/* Header */}
          <header className="sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-zinc-950/80 rounded-2xl border border-gray-200 shadow-sm dark:border-zinc-800">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 grid place-items-center">
                  <ShoppingCart className="text-indigo-600" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Atendimento</h1>
                  <p className="text-gray-600 dark:text-zinc-300 text-sm">Catálogo • Stock • Carrinho</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {caixaAberto ? (
                  <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <Lock size={16} /> Caixa aberto
                  </span>
                ) : (
                  <a href="/caixa" className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 dark:bg-red-400 dark:text-white">
                    <Lock size={16} /> Abrir caixa <ArrowRight size={14} />
                  </a>
                )}
             
              </div>
            </div>
          </header>

          {/* Corpo: coluna de catálogo + coluna do carrinho */}
          <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Catálogo */}
            <section className="lg:col-span-2">
              {/* Filtros */}
              <div className="mb-3 flex flex-col sm:flex-row gap-2">
                <div className="relative grow">
                  <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={catalogQ}
                    onChange={(e) => setCatalogQ(e.target.value)}
                    placeholder="Pesquisar produto por nome…"
                    className="w-full pl-8 pr-3 py-2 border rounded-lg bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-zinc-300 inline-flex items-center gap-1">
                    <Filter size={14} /> Stock:
                  </span>
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">Todos</option>
                    <option value="low">Baixo</option>
                    <option value="ok">Normal/OK</option>
                  </select>
                </div>
              </div>

              {/* Grid de produtos */}
              <div className="rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-3">
                {products.length === 0 ? (
                  <div className="h-36 grid place-items-center text-gray-600 dark:text-zinc-300">
                    <Package className="mb-2" />
                    Nenhum produto encontrado.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {products.map((p) => {
                      const low = p.min > 0 && p.stock <= p.min;
                      const out = p.stock <= 0;
                      return (
                        <div
                          key={p.id}
                          className={`group rounded-xl border p-3 bg-white dark:bg-zinc-950 dark:border-zinc-800 hover:shadow-sm transition
                            ${out ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-gray-900 dark:text-zinc-100 line-clamp-2">{p.nome}</div>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap
                              ${out ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                                   : low ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                   : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"}`}
                            >
                              {out ? "Sem stock" : low ? `Baixo • ${p.stock}` : `Stock • ${p.stock}`}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600 dark:text-zinc-300">{fmt(p.preco)}</div>
                          <button
                            type="button"
                            disabled={out}
                            onClick={() => addItem(p)}
                            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                                       bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                          >
                            <PlusCircle size={16} /> Adicionar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Carrinho / Resumo */}
            <aside className="rounded-2xl border border-gray-200 shadow-sm p-5 bg-white dark:bg-zinc-900  dark:border-zinc-800 ">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Carrinho</h2>
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border dark:border-zinc-800 dark:text-white"
                >
                  <Trash2 size={16} /> Limpar
                </button>
              </div>

              {/* Lista do carrinho */}
              {values.cart.length === 0 ? (
                <div className="p-6 text-center text-gray-600 dark:text-zinc-300">
                  <Package className="mx-auto text-gray-400 dark:text-zinc-500 mb-2" size={40} />
                  Sem itens. Adicione produtos no catálogo.
                </div>
              ) : (
                <div className="rounded-2xl space-y-2 max-h-[60vh] overflow-auto border-2 p-1 border-gray-200 shadow-sm">
                  <FieldArray name="cart">
                    {() =>
                      values.cart.map((it) => {
                        const max = stockOf(it.id);
                        const left = Math.max(0, max - it.qtd);
                        const warn = left === 0;
                        return (
                          <div key={it.id} className="rounded-2xl border dark:border-zinc-800 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-zinc-100">{it.nome}</div>
                                <div className="text-xs text-gray-600 dark:text-zinc-400">
                                  {fmt(it.preco)} • Stock restante:{" "}
                                  <span className={warn ? "text-rose-600" : "text-emerald-600"}>{left}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(it.id)}
                                className="p-2 rounded text-rose-600 dark:text-rose-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                aria-label={`Remover ${it.nome}`}
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="inline-flex items-center rounded-lg border dark:border-zinc-800 dark:text-white">
                                <button type="button" onClick={() => dec(it.id)} className="p-1.5 hover:bg-gray-50 dark:hover:bg-zinc-800">
                                  <Minus size={14} />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max={max}
                                  value={it.qtd}
                                  onChange={(e) => updateQty(it.id, e.target.value)}
                                  className="w-16 text-center px-1 py-1 outline-none bg-transparent dark:text-white"
                                />
                                <button type="button" onClick={() => inc(it.id)} className="p-1.5 hover:bg-gray-50 dark:hover:bg-zinc-800">
                                  <Plus size={14} />
                                </button>
                              </div>
                              <div className="font-semibold dark:text-white">{fmt(it.preco * it.qtd)}</div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </FieldArray>
                </div>
              )}

              {/* Cliente e totais */}
              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Cliente</label>
                <input
                  value={values.customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 mb-4 bg-white dark:text-white dark:bg-zinc-950 dark:border-zinc-800"
                  placeholder="Nome (opcional)"
                />

                <div className="space-y-2 mb-4 text-sm dark:text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-zinc-300">Subtotal</span>
                    <span>{fmt(subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-gray-600 dark:text-zinc-300 inline-flex items-center gap-1">
                      {values.discountMode === "percent" ? <Percent size={16} /> : <BadgeDollarSign size={16} />}
                      Desconto
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={values.discountMode}
                        onChange={(e) => setDiscountMode(e.target.value)}
                        className="border rounded-lg px-2 py-1 text-xs bg-white dark:bg-zinc-950 dark:border-zinc-800 dark:text-white"
                      >
                        <option value="valor">STN</option>
                        <option value="percent">%</option>
                      </select>
                      <input
                        value={values.discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-24 border rounded px-2 py-1 text-right bg-white dark:bg-zinc-950 dark:border-zinc-800 dark:text-white"
                        aria-label="Valor de desconto"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-amber-700 dark:text-amber-300">
                    <span>Desconto aplicado</span>
                    <span>- {fmt(discountValue)}</span>
                  </div>

                  <div className="flex items-center justify-between font-semibold text-base">
                    <span className="text-gray-700 dark:text-zinc-200">Total</span>
                    <span className="dark:text-white">{fmt(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!caixaAberto || values.cart.length === 0 || loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                  aria-disabled={!caixaAberto || values.cart.length === 0 || loading}
                >
                  <CreditCard size={18} /> Finalizar pagamento
                </button>
              </div>
            </aside>
          </div>

          {/* Modal: pagamento (resumo final) */}
          <Modal
            open={payOpen}
            onClose={() => setPayOpen(false)}
            title={<span className="inline-flex items-center gap-2"><CreditCard className="text-emerald-600" /> Pagamento</span>}
            footer={
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setPayOpen(false)} className="px-4 py-2 rounded-lg border dark:border-zinc-800">Cancelar</button>
                <button type="button" onClick={handleCheckout} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} /> Confirmar</span>}
                </button>
              </div>
            }
          >
            <div className="space-y-3 text-gray-900 dark:text-white">
              <div className="flex items-center justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="flex items-center justify-between text-amber-700 dark:text-amber-300"><span>Desconto</span><span>- {fmt(discountValue)}</span></div>
              <div className="flex items-center justify-between font-semibold"><span>Total</span><span>{fmt(total)}</span></div>
              <p className="text-xs text-gray-600 dark:text-zinc-400">O método de pagamento pode ser definido no recibo/retaguarda.</p>
            </div>
          </Modal>

          <Toast msg={toast} tone={toastTone} onClose={() => setToast("")} />
        </Form>
      )}
    </Formik>
  );
}
