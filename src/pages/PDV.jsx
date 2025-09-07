/* eslint-disable no-unused-vars */
"use client";

import React from "react";
import {
  ShoppingCart, PlusCircle, X, Trash2, CreditCard, CheckCircle2, Lock, Loader2,
  Package, ArrowRight, Search, Percent, BadgeDollarSign, Minus, Plus, ShieldAlert, Check, ChevronDown
} from "lucide-react";
import { Formik, Form, Field, FieldArray, useFormikContext } from "formik";
import * as Yup from "yup";
import { usePDV } from "../hooks/usePDV";
import api from "../api";

/* ========== Modal ========== */
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full ${maxW} rounded-2xl bg-white shadow-2xl border border-gray-200`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t">{footer}</div>}
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

/* ========== Helpers visuais ========== */
const Th = ({ children }) => (
  <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase text-xs">{children}</th>
);
const Td = ({ children, className = "" }) => <td className={`px-3 py-2 ${className}`}>{children}</td>;
const Row = ({ label, value, bold = false, className = "" }) => (
  <div className={`flex items-center justify-between ${bold ? "font-semibold text-base" : "text-sm"} ${className}`}>
    <span className="text-gray-600">{label}</span><span>{value}</span>
  </div>
);

/* ========== Impressão (PDF/HTML) ========== */
function useThermalPrint() {
  const [printing, setPrinting] = React.useState(false);

  const printBlob = React.useCallback((blob, filename = "recibo.html") => {
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, { position: "fixed", right: 0, bottom: 0, width: 0, height: 0, border: 0 });
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); }
      finally {
        setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(iframe); }, 1200);
      }
    };
  }, []);

  const apiGetPrintable = React.useCallback(async (url, method = "GET") => {
    const res = await api.request({ url, method, responseType: "blob", headers: { Accept: "application/pdf, text/html" } });
    return res.data;
  }, []);

  const inferTodaysLastPaidSaleId = React.useCallback(async () => {
    const d = new Date(); const day = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const res = await api.get("/vendas", { params: { status: "Paga", from: day, to: day } });
    const list = res.data;
    return (Array.isArray(list) && list[0]?.ven_id) || null;
  }, []);

  const printReceiptForSale = React.useCallback(async (result, setToast) => {
    setPrinting(true);
    try {
      const venId = result?.venda?.ven_id ?? result?.data?.venda?.ven_id ?? result?.ven_id ?? result?.data?.ven_id ?? result?.id ?? result?.venId ?? null;
      const recId = result?.recibo?.rec_id ?? result?.data?.recibo?.rec_id ?? result?.rec_id ?? null;
      const pdfHint = result?.recibo?.pdf_hint ?? result?.data?.recibo?.pdf_hint ?? result?.pdf_hint ?? null;

      if (pdfHint) {
        const blob = await apiGetPrintable(pdfHint, "GET");
        printBlob(blob, `recibo-${recId || venId || "venda"}.html`);
        setToast?.("Recibo gerado.");
        return;
      }
      if (recId) {
        const blob = await apiGetPrintable(`/recibos/${recId}/pdf`, "GET");
        printBlob(blob, `recibo-${recId}.pdf`);
        setToast?.("Recibo gerado.");
        return;
      }
      if (venId) {
        const blob = await apiGetPrintable(`/vendas/${venId}/recibo/pdf`, "POST");
        printBlob(blob, `recibo-${venId}.html`);
        setToast?.("Recibo gerado.");
        return;
      }
      const inferred = await inferTodaysLastPaidSaleId();
      if (inferred) {
        const blob = await apiGetPrintable(`/vendas/${inferred}/recibo/pdf`, "POST");
        printBlob(blob, `recibo-${inferred}.html`);
        setToast?.("Recibo gerado.");
        return;
      }
      setToast?.("Venda concluída, mas não consegui gerar o recibo.");
    } catch (e) {
      console.error(e);
      setToast?.("Não foi possível gerar/imprimir o recibo.");
    } finally {
      setPrinting(false);
    }
  }, [apiGetPrintable, printBlob, inferTodaysLastPaidSaleId]);

  return { printing, printReceiptForSale };
}

/* ========== Sincronizador Formik -> usePDV ========== */
function SyncWithHook({ setCart, setCustomer, setDiscount, setDiscountMode }) {
  const { values } = useFormikContext();
  React.useEffect(() => { setCart(values.cart || []); }, [values.cart, setCart]);
  React.useEffect(() => { setCustomer(values.customer || ""); }, [values.customer, setCustomer]);
  React.useEffect(() => { setDiscount(values.discount || 0); }, [values.discount, setDiscount]);
  React.useEffect(() => { setDiscountMode(values.discountMode || "valor"); }, [values.discountMode, setDiscountMode]);
  return null;
}

/* ========== Modal do Catálogo com seleção múltipla ========== */
function CatalogModal({ open, onClose, materials, fmt, addManyToCart }) {
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState("name-asc"); // name-asc | price-asc | price-desc
  const [selected, setSelected] = React.useState(() => new Set());

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = term
      ? materials.filter(m => (m.nome + String(m.preco)).toLowerCase().includes(term))
      : materials.slice(0);
    if (sort === "name-asc") list.sort((a,b) => a.nome.localeCompare(b.nome));
    if (sort === "price-asc") list.sort((a,b) => a.preco - b.preco);
    if (sort === "price-desc") list.sort((a,b) => b.preco - a.preco);
    return list;
  }, [materials, q, sort]);

  const toggle = (id) => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const allIds = React.useMemo(() => filtered.map(m => m.id), [filtered]);
  const allSelected = selected.size > 0 && allIds.every(id => selected.has(id));
  const noneSelected = selected.size === 0;

  const toggleAll = () => {
    setSelected(s => {
      if (s.size && allIds.every(id => s.has(id))) return new Set();
      return new Set(allIds);
    });
  };

  const confirmAdd = () => {
    if (!selected.size) return;
    const items = materials
      .filter(m => selected.has(m.id))
      .map(m => ({ id: m.id, nome: m.nome, preco: Number(m.preco), qtd: 1 }));
    addManyToCart(items);
    setSelected(new Set());
    setQ("");
    onClose?.();
  };

  return (
    <Modal open={open} onClose={onClose} title="Adicionar itens" maxW="max-w-3xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">{selected.size} selecionado(s)</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border">Cancelar</button>
            <button
              disabled={noneSelected}
              onClick={confirmAdd}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
            >
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative grow">
          <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar produto…"
            className="w-full pl-8 pr-3 py-2 border rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="name-asc">Nome (A–Z)</option>
            <option value="price-asc">Preço (↑)</option>
            <option value="price-desc">Preço (↓)</option>
          </select>
          <button onClick={toggleAll} className="px-3 py-2 rounded-lg border inline-flex items-center gap-2">
            <Check size={16} /> {allSelected ? "Desmarcar" : "Selecionar todos"}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-gray-600">Nenhum item encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((m) => {
            const isSel = selected.has(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m.id)}
                className={`relative p-3 rounded-xl border text-left transition
                  ${isSel ? "ring-2 ring-indigo-400 bg-indigo-50/60" : "hover:bg-gray-50"}`}
                aria-pressed={isSel}
              >
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded ${isSel ? "bg-indigo-600" : "bg-gray-200"}`}>
                    {isSel && <Check size={14} className="text-white" />}
                  </span>
                </div>
                <div className="font-medium line-clamp-2">{m.nome}</div>
                <div className="text-sm text-gray-600 mt-1">{fmt(m.preco)}</div>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

/* ========== Página ========== */
export default function PDV() {
  const {
    allowed, loadingBoot,
    materials, cart, setCart,
    customer, setCustomer, discount, setDiscount, discountMode, setDiscountMode,
    payOpen, setPayOpen, addOpen, setAddOpen,
    caixaAberto,
    subtotal, discountValue, total,
    loading, checkout, toast, toastTone, setToast, fmt
  } = usePDV();

  const { printing, printReceiptForSale } = useThermalPrint();

  const handleCheckout = React.useCallback(async () => {
    try {
      const result = await checkout();
      setPayOpen(false);
      await printReceiptForSale(result ?? null, setToast);
    } catch (e) {
      console.error(e);
    }
  }, [checkout, printReceiptForSale, setPayOpen, setToast]);

  if (loadingBoot) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </main>
    );
  }
  if (!allowed) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-rose-100 grid place-items-center">
            <ShieldAlert className="text-rose-600" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Sem permissão</h2>
          <p className="text-gray-600 text-sm">O seu utilizador não tem acesso ao módulo <b>Vendas</b> (PDV).</p>
        </div>
      </main>
    );
  }

  /* ===== Formik: estado de carrinho/checkout ===== */
  const initialValues = {
    customer: customer || "",
    discount: discount || 0,
    discountMode: discountMode || "valor",
    cart: cart || []
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
        qtd: Yup.number().min(1).required()
      })
    )
  });

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={() => setPayOpen(true)}
    >
      {({ values, setFieldValue, errors, touched }) => (
        <Form className="min-h-screen bg-gradient-to-b from-gray-50 to-white space-y-6">
          {/* sincroniza para o hook */}
          <SyncWithHook
            setCart={setCart}
            setCustomer={setCustomer}
            setDiscount={setDiscount}
            setDiscountMode={setDiscountMode}
          />

          <header className="rounded-2xl p-6 bg-white border border-gray-300 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 grid place-items-center">
                <ShoppingCart className="text-indigo-600" size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">PDV</h1>
                <p className="text-gray-600">Carrinho + Checkout </p>
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
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <PlusCircle size={18} /> Adicionar itens
                  </button>
                  <button
                    type="button"
                    onClick={() => setFieldValue("cart", [])}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border"
                  >
                    <Trash2 size={18} /> Limpar
                  </button>
                </div>
              </div>

              {/* Cards responsivos no mobile, tabela no desktop */}
              {values.cart.length === 0 ? (
                <div className="p-6 text-center text-gray-600">
                  <Package className="mx-auto text-gray-400 mb-2" size={40} />
                  Nenhum item no carrinho. Clique em “Adicionar itens”.
                </div>
              ) : (
                <>
                  {/* Mobile / tablets: cards */}
                  <div className="grid sm:hidden grid-cols-1 gap-3">
                    <FieldArray name="cart">
                      {({ remove, replace }) => (
                        values.cart.map((it, idx) => (
                          <div key={it.id} className="rounded-xl border p-3 flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium">{it.nome}</div>
                              <div className="text-xs text-gray-600">{fmt(it.preco)}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="inline-flex items-center rounded-lg border">
                                <button type="button" onClick={() => replace(idx, { ...it, qtd: Math.max(1, it.qtd - 1) })} className="p-1.5 hover:bg-gray-50">
                                  <Minus size={14} />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={it.qtd}
                                  onChange={(e) => replace(idx, { ...it, qtd: Math.max(1, Number(e.target.value || 1)) })}
                                  className="w-16 text-center px-1 py-1 outline-none"
                                />
                                <button type="button" onClick={() => replace(idx, { ...it, qtd: it.qtd + 1 })} className="p-1.5 hover:bg-gray-50">
                                  <Plus size={14} />
                                </button>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{fmt(it.preco * it.qtd)}</div>
                                <button type="button" onClick={() => remove(idx)} className="mt-1 text-rose-600 text-xs inline-flex items-center gap-1">
                                  <X size={14} /> Remover
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </FieldArray>
                  </div>

                  {/* Desktop: tabela */}
                  <div className="hidden sm:block overflow-x-auto rounded-xl border">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr><Th>Produto</Th><Th>Preço</Th><Th>Qtd</Th><Th>Total</Th><Th></Th></tr>
                      </thead>
                      <tbody className="bg-white">
                        <FieldArray name="cart">
                          {({ remove, replace }) => (
                            values.cart.map((it, idx) => (
                              <tr key={it.id} className={`border-t ${idx % 2 ? "bg-gray-50/50" : ""}`}>
                                <Td>{it.nome}</Td>
                                <Td>{fmt(it.preco)}</Td>
                                <Td>
                                  <div className="inline-flex items-center rounded-lg border">
                                    <button type="button" onClick={() => replace(idx, { ...it, qtd: Math.max(1, it.qtd - 1) })} className="p-1.5 hover:bg-gray-50"><Minus size={14} /></button>
                                    <input
                                      type="number"
                                      min="1"
                                      value={it.qtd}
                                      onChange={(e) => replace(idx, { ...it, qtd: Math.max(1, Number(e.target.value || 1)) })}
                                      className="w-16 text-center px-1 py-1 outline-none"
                                    />
                                    <button type="button" onClick={() => replace(idx, { ...it, qtd: it.qtd + 1 })} className="p-1.5 hover:bg-gray-50"><Plus size={14} /></button>
                                  </div>
                                </Td>
                                <Td className="font-medium">{fmt(it.preco * it.qtd)}</Td>
                                <Td className="text-right">
                                  <button type="button" onClick={() => remove(idx)} className="p-2 rounded hover:bg-gray-100 text-rose-600" aria-label={`Remover ${it.nome}`}>
                                    <X size={16} />
                                  </button>
                                </Td>
                              </tr>
                            ))
                          )}
                        </FieldArray>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Resumo / Checkout */}
            <aside className="rounded-2xl p-5 bg-white border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Resumo</h2>

              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <Field
                name="customer"
                as="input"
                type="text"
                className="w-full border rounded-lg px-3 py-2 mb-4"
                placeholder="Nome (opcional)"
              />

              <div className="space-y-2 mb-4 text-sm">
                <Row label="Subtotal" value={fmt(subtotal)} />
                <div className="flex items-center justify-between">
                  <div className="text-gray-600 inline-flex items-center gap-1">
                    {values.discountMode === "percent" ? <Percent size={16} /> : <BadgeDollarSign size={16} />}
                    Desconto
                  </div>
                  <div className="flex items-center gap-2">
                    <Field as="select" name="discountMode" className="border rounded-lg px-2 py-1 text-xs">
                      <option value="valor">€</option>
                      <option value="percent">%</option>
                    </Field>
                    <Field
                      name="discount"
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-24 border rounded px-2 py-1 text-right"
                      aria-label="Valor de desconto"
                    />
                  </div>
                </div>
                <Row label="Desconto aplicado" value={`- ${fmt(discountValue)}`} className="text-amber-700" />
                <Row label="Total" value={fmt(total)} bold />
              </div>

              <button
                type="submit"
                disabled={!caixaAberto || values.cart.length === 0 || printing}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                aria-disabled={!caixaAberto || values.cart.length === 0 || printing}
              >
                <CreditCard size={18} /> Finalizar pagamento
              </button>
            </aside>
          </section>

          {/* Modal: catálogo com seleção */}
          <CatalogModal
            open={addOpen}
            onClose={() => setAddOpen(false)}
            materials={materials}
            fmt={fmt}
            addManyToCart={(items) => {
              // mescla com os existentes somando quantidades
              const map = new Map(values.cart.map(i => [i.id, { ...i }]));
              for (const it of items) {
                if (map.has(it.id)) map.set(it.id, { ...map.get(it.id), qtd: map.get(it.id).qtd + 1 });
                else map.set(it.id, it);
              }
              setFieldValue("cart", Array.from(map.values()));
            }}
          />

          {/* Modal: pagamento */}
          <Modal
            open={payOpen}
            onClose={() => setPayOpen(false)}
            title={<span className="inline-flex items-center gap-2"><CreditCard className="text-emerald-600" /> Pagamento</span>}
            footer={
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setPayOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
                <button type="button" onClick={handleCheckout} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">
                  {(loading || printing) ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} /> Confirmar</span>}
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
                {/* só UI; o hook não envia ao back */}
                <select className="w-full border rounded-lg px-3 py-2">
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
        </Form>
      )}
    </Formik>
  );
}
