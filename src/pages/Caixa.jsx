// src/pages/Caixa.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useCaixa } from "../hooks/useCaixa";
import { usePDV } from "../hooks/usePDV";

export default function CaixaPage() {
  const {
    allowed: caixaAllowed,
    cash,
    loading: loadingCaixa,
    isAberto,
    openOpenModal,
    setOpenOpenModal,
    openCloseModal,
    setOpenCloseModal,
    initialBalance,
    setInitialBalance,
    toast: toastCaixa,
    setToast: setToastCaixa,
    salesToday,
    resume,
    abrirCaixa,
    fecharCaixa,
    fmt,
  } = useCaixa();

  const {
    allowed: pdvAllowed,
    loadingBoot,
    catalogQ,
    setCatalogQ,
    catalog,
    cart,
    customer,
    setCustomer,
    discount,
    setDiscount,
    discountMode,
    setDiscountMode,
    subtotal,
    discountValue,
    total,
    payMethod,
    setPayMethod,
    payOpen,
    setPayOpen,
    caixa: caixaPDV,
    caixaAberto,
    addItem,
    inc,
    dec,
    updateQty,
    removeItem,
    clearSale,
    loading: loadingCheckout,
    checkout,
    toast: toastPDV,
    toastTone,
    setToast: setToastPDV,
    fmt: fmtPDV,
  } = usePDV();

  const [tab, setTab] = useState("atendimento"); // "atendimento" | "lista"

  const allAllowed = caixaAllowed && pdvAllowed;
  const caixaInfo = cash || caixaPDV || null;
  const caixaEstaAberto = isAberto || caixaAberto;

  // filtros listagem de atendimentos
  const [listStatus, setListStatus] = useState("Todos");
  const [listSearch, setListSearch] = useState("");

  const filteredSalesToday = useMemo(() => {
    return (salesToday || []).filter((s) => {
      if (listStatus !== "Todos" && s.ven_status !== listStatus) return false;
      if (!listSearch.trim()) return true;
      const q = listSearch.toLowerCase();
      const code = String(s.ven_codigo || "").toLowerCase();
      const client = String(s.ven_cliente_nome || "").toLowerCase();
      return code.includes(q) || client.includes(q);
    });
  }, [salesToday, listStatus, listSearch]);

  // sincronizar toast caixa -> pdv se necessário
  useEffect(() => {
    if (toastCaixa && !toastPDV) {
      setToastPDV(toastCaixa);
    }
  }, [toastCaixa, toastPDV, setToastPDV]);

  if (!allAllowed) {
    return (
      <div className="p-6">
        <div className="max-w-xl mx-auto border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          Não tens permissão para aceder ao módulo de caixa e atendimentos.
        </div>
      </div>
    );
  }

  const anyToast = toastPDV || toastCaixa;
  const toastColor =
    toastTone === "error"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-indigo-50 text-indigo-700 border-indigo-200";

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-indigo-700">Caixa</h1>
          <p className="text-sm text-gray-500">
            Atendimento e listagem de atendimentos do dia.
          </p>
        </div>

        {caixaEstaAberto ? (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Caixa aberto
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-xs text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Caixa fechado
          </span>
        )}
      </header>

      {/* Toast */}
      {anyToast && (
        <div
          className={`flex items-center justify-between px-4 py-2 text-xs border rounded-lg ${toastColor}`}
        >
          <span>{anyToast}</span>
          <button
            type="button"
            onClick={() => {
              setToastCaixa("");
              setToastPDV("");
            }}
            className="text-[10px] uppercase tracking-wide font-semibold"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Tabs */}
      <section className="border border-gray-200 rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-200 flex">
          <button
            type="button"
            onClick={() => setTab("atendimento")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              tab === "atendimento"
                ? "text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Atendimento
          </button>
          <button
            type="button"
            onClick={() => setTab("lista")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              tab === "lista"
                ? "text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Listagem de atendimentos
          </button>
        </div>

        <div className="p-4">
          {tab === "atendimento" ? (
            <AtendimentoTab
              caixaInfo={caixaInfo}
              resume={resume}
              fmt={fmt}
              caixaEstaAberto={caixaEstaAberto}
              loadingCaixa={loadingCaixa}
              loadingBoot={loadingBoot}
              setOpenOpenModal={setOpenOpenModal}
              setOpenCloseModal={setOpenCloseModal}
              // produtos
              catalogQ={catalogQ}
              setCatalogQ={setCatalogQ}
              catalog={catalog}
              // carrinho
              cart={cart}
              fmtPDV={fmtPDV}
              addItem={addItem}
              inc={inc}
              dec={dec}
              updateQty={updateQty}
              removeItem={removeItem}
              clearSale={clearSale}
              // cliente / desconto
              customer={customer}
              setCustomer={setCustomer}
              discount={discount}
              setDiscount={setDiscount}
              discountMode={discountMode}
              setDiscountMode={setDiscountMode}
              // totais
              subtotal={subtotal}
              discountValue={discountValue}
              total={total}
              // pagamento
              payMethod={payMethod}
              setPayMethod={setPayMethod}
              payOpen={payOpen}
              setPayOpen={setPayOpen}
              loadingCheckout={loadingCheckout}
              checkout={checkout}
            />
          ) : (
            <ListaAtendimentosTab
              sales={filteredSalesToday}
              totalSales={salesToday.length}
              listStatus={listStatus}
              setListStatus={setListStatus}
              listSearch={listSearch}
              setListSearch={setListSearch}
              fmt={fmt}
            />
          )}
        </div>
      </section>

      {/* Modal abrir caixa */}
      {openOpenModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-indigo-700 border-b pb-2">
              Abrir caixa
            </h2>
            <p className="text-xs text-gray-600">
              Define o saldo inicial do caixa para hoje.
            </p>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="Saldo inicial"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setOpenOpenModal(false)}
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={abrirCaixa}
                className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal fechar caixa */}
      {openCloseModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-red-700 border-b pb-2">
              Fechar caixa
            </h2>
            <p className="text-xs text-gray-600">
              Tens a certeza que pretendes fechar o caixa do dia?
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setOpenCloseModal(false)}
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={fecharCaixa}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Fechar caixa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========== ABA ATENDIMENTO =========== */

function AtendimentoTab({
  caixaInfo,
  resume,
  fmt,
  caixaEstaAberto,
  loadingCaixa,
  loadingBoot,
  catalogQ,
  setCatalogQ,
  setOpenOpenModal,
  setOpenCloseModal,
  catalog,
  cart,
  fmtPDV,
  addItem,
  inc,
  dec,
  updateQty,
  removeItem,
  clearSale,
  customer,
  setCustomer,
  discount,
  setDiscount,
  discountMode,
  setDiscountMode,
  subtotal,
  discountValue,
  total,
  payMethod,
  setPayMethod,
  payOpen,
  setPayOpen,
  loadingCheckout,
  checkout,
}) {
  // paginação dos produtos
  const [prodPage, setProdPage] = useState(1);
  const [prodPerPage, setProdPerPage] = useState(9); // 3x3

  const totalProdPages = Math.max(1, Math.ceil(catalog.length / prodPerPage));
  const pagedProducts = useMemo(
    () => catalog.slice((prodPage - 1) * prodPerPage, prodPage * prodPerPage),
    [catalog, prodPage, prodPerPage]
  );

  useEffect(() => {
    // reset de página sempre que muda pesquisa
    setProdPage(1);
  }, [catalogQ]);

  return (
    <>
      {/* Resumo do caixa (dentro da aba de atendimento) */}
      <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-indigo-700">
            Resumo do caixa (dia)
          </h2>
          <div className="mt-3 flex">
            {!caixaEstaAberto && (
              <button
                type="button"
                onClick={() => setOpenOpenModal(true)}
                className="px-4 py-1.5 text-xs rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Abrir caixa
              </button>
            )}

            {caixaEstaAberto && (
              <button
                type="button"
                onClick={() => setOpenCloseModal(true)}
                className="px-4 py-1.5 text-xs rounded-full bg-red-600 text-white hover:bg-red-700 transition"
              >
                Fechar caixa
              </button>
            )}
          </div>
          {(loadingCaixa || loadingBoot) && (
            <span className="text-[16px] text-gray-400">A carregar…</span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="space-y-1">
            <p className="text-gray-600">Data</p>
            <p className="font-medium text-gray-900">
              {caixaInfo?.cx_data
                ? new Date(caixaInfo.cx_data).toLocaleDateString("pt-PT")
                : new Date().toLocaleDateString("pt-PT")}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-600">Saldo inicial</p>
            <p className="font-medium text-gray-900">
              {caixaInfo?.cx_saldo_inicial != null
                ? fmt(caixaInfo.cx_saldo_inicial)
                : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-600">Bruto</p>
            <p className="font-medium text-gray-900">
              {fmt(resume.totalBruto)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-600">Total recebido</p>
            <p className="font-semibold text-indigo-700 text-base">
              {fmt(resume.total)}
            </p>
          </div>
        </div>
      </div>

      {/* Layout: produtos + lateral (carrinho/resumo atend.) */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Produtos com paginação */}
        <div className="space-y-3 col-span-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="w-full md:w-64 text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Filtrar produtos..."
                value={catalogQ}
                onChange={(e) => setCatalogQ(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-[16px] text-gray-500">
              <span>Total: {catalog.length} produtos</span>
              <label className="flex items-center gap-1">
                por página:
                <select
                  className="border rounded px-1 py-0.5 text-[16px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={prodPerPage}
                  onChange={(e) => setProdPerPage(Number(e.target.value) || 9)}
                >
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                </select>
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pagedProducts.length === 0 && !loadingBoot && (
              <p className="text-xs text-gray-400 col-span-full">
                Nenhum produto encontrado.
              </p>
            )}

            {pagedProducts.map((m) => {
              const inCart = cart.find((c) => c.id === m.id);
              const qtd = inCart?.qtd || 0;

              return (
                <div
                  key={m.id}
                  className="relative border border-indigo-100 rounded-xl p-3 bg-indigo-50/40 hover:bg-indigo-50 transition shadow-sm flex flex-col justify-between min-h-[130px]"
                >
                  {/* preço no canto */}

                  <div className="space-y-1 pr-10">
                    {" "}
                    <div className="absolute top-2 right-2 text-[16px] font-semibold text-indigo-800 bg-white/80 px-2 py-0.5 rounded-full border border-indigo-200">
                      {fmtPDV(m.preco)}
                    </div>
                    <p className="text-[16px] font-semibold text-gray-900 line-clamp-2">
                      {m.nome}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Codi: <span className="font-mono">{m.id}</span>
                    </p>
                    <p className="text-[10px] text-gray-500">
                      No carrinho:{" "}
                      <span className="font-semibold text-indigo-700">
                        {qtd}
                      </span>
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => inCart && dec(m.id)}
                        className="h-6 w-6 text-xs border border-indigo-300 text-indigo-700 rounded-full flex items-center justify-center hover:bg-indigo-100 disabled:opacity-40"
                        disabled={!inCart}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="w-12 text-[16px] border border-indigo-200 rounded text-center"
                        value={qtd || ""}
                        onChange={(e) =>
                          inCart && updateQty(m.id, e.target.value)
                        }
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => inCart && inc(m.id)}
                        className="h-6 w-6 text-xs border border-indigo-300 text-indigo-700 rounded-full flex items-center justify-center hover:bg-indigo-100 disabled:opacity-40"
                        disabled={!inCart}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => addItem(m)}
                      className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow hover:bg-indigo-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* paginação produtos */}
          {totalProdPages > 1 && (
            <div className="flex items-center justify-between text-[16px] text-gray-600 mt-2">
              <span>
                Página {prodPage} de {totalProdPages}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={prodPage === 1}
                  onClick={() => setProdPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-100"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={prodPage === totalProdPages}
                  onClick={() =>
                    setProdPage((p) => Math.min(totalProdPages, p + 1))
                  }
                  className="px-2 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-100"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>

        {/* lateral: carrinho + resumo de atendimento/pagamento */}
        <div className="space-y-3 ">
          {/* carrinho */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-700">
                Carrinho ({cart.length})
              </h3>
              <button
                type="button"
                onClick={clearSale}
                className="text-[10px] text-gray-500 hover:text-gray-700"
              >
                Limpar
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto">
              {cart.length === 0 && (
                <p className="text-[16px] text-gray-400">
                  Nenhum item no carrinho.
                </p>
              )}

              {cart.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between gap-2 border-b last:border-0 py-1"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-medium text-gray-800 truncate">
                      {it.nome}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {fmtPDV(it.preco)} / un.
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => dec(it.id)}
                      className="h-5 w-5 text-[10px] border rounded-full flex items-center justify-center hover:bg-gray-100"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className="w-10 text-[16px] border rounded text-center"
                      value={it.qtd}
                      onChange={(e) => updateQty(it.id, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => inc(it.id)}
                      className="h-5 w-5 text-[10px] border rounded-full flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <p className="text-[16px] font-semibold text-indigo-700">
                      {fmtPDV(it.preco * it.qtd)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="text-[10px] text-red-500 hover:text-red-700"
                    >
                      remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* cliente / desconto */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-2 text-xs">
            <div className="space-y-1">
              <label className="text-gray-700">Cliente</label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                placeholder="Nome do cliente (opcional)"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-[1.2fr,0.8fr] gap-2 items-end">
              <div className="space-y-1">
                <label className="text-gray-700">Desconto</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-gray-700">Modo</label>
                <select
                  className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  value={discountMode}
                  onChange={(e) => setDiscountMode(e.target.value)}
                >
                  <option value="valor">Valor</option>
                  <option value="percent">% Percentual</option>
                </select>
              </div>
            </div>
          </div>

          {/* resumo de atendimento / pagamento */}
          <div className="border border-indigo-100 rounded-lg p-3 space-y-2 bg-indigo-50/40">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-800">
                {fmtPDV(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Desconto</span>
              <span className="font-medium text-amber-700">
                - {fmtPDV(discountValue)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-indigo-100 pt-2 mt-1">
              <span className="font-semibold text-indigo-800">
                Total a pagar
              </span>
              <span className="font-bold text-lg text-indigo-700">
                {fmtPDV(total)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 mt-2">
              <select
                className="flex-1 border rounded px-2 py-1 text-[16px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
              >
                <option>Dinheiro</option>
                <option>POS</option>
                <option>Transferência</option>
              </select>

              <button
                type="button"
                disabled={
                  loadingCheckout || cart.length === 0 || !caixaEstaAberto
                }
                onClick={() => setPayOpen(true)}
                className="px-4 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Finalizar venda
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* modal confirmar pagamento */}
      {payOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-indigo-700 border-b pb-2">
              Confirmar pagamento
            </h2>
            <p className="text-xs text-gray-600">
              Método: <span className="font-medium">{payMethod}</span>
            </p>
            <p className="text-xs text-gray-600">
              Total:{" "}
              <span className="font-semibold text-indigo-800">
                {fmtPDV(total)}
              </span>
            </p>
            <div className="flex justify-end gap-2 text-xs mt-2">
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loadingCheckout}
                onClick={async () => {
                  await checkout();
                  setPayOpen(false);
                }}
                className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {loadingCheckout ? "A processar..." : "Confirmar venda"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =========== ABA LISTAGEM =========== */

function ListaAtendimentosTab({
  sales,
  totalSales,
  listStatus,
  setListStatus,
  listSearch,
  setListSearch,
  fmt,
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs text-gray-500">
            Atendimentos do dia:{" "}
            <span className="font-semibold">{totalSales}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            className="border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Filtrar por código/cliente..."
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
          />
          <select
            className="border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={listStatus}
            onChange={(e) => setListStatus(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Paga">Paga</option>
            <option value="Pendente">Pendente</option>
            <option value="Cancelada">Cancelada</option>
            <option value="Estornada">Estornada</option>
          </select>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-indigo-50 border-b border-indigo-100 px-3 py-2 text-[16px] font-semibold text-indigo-900">
          Lista de atendimentos ({sales.length})
        </div>
        <div className="overflow-x-auto max-h-72">
          <table className="min-w-full text-[16px]">
            <thead className="bg-gray-50">
              <tr className="text-gray-600">
                <th className="px-2 py-1 text-left font-semibold">Código</th>
                <th className="px-2 py-1 text-left font-semibold">Cliente</th>
                <th className="px-2 py-1 text-right font-semibold">Total</th>
                <th className="px-2 py-1 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-4 text-center text-gray-400"
                  >
                    Nenhum atendimento encontrado.
                  </td>
                </tr>
              )}

              {sales.map((s) => (
                <tr
                  key={s.ven_id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-2 py-1">{s.ven_codigo}</td>
                  <td className="px-2 py-1">
                    {s.ven_cliente_nome || "Cliente"}
                  </td>
                  <td className="px-2 py-1 text-right font-medium text-indigo-700">
                    {fmt(s.ven_total)}
                  </td>
                  <td className="px-2 py-1 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] border ${
                        s.ven_status === "Paga"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : s.ven_status === "Cancelada" ||
                            s.ven_status === "Estornada"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {s.ven_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
