/* eslint-disable no-unused-vars */
"use client";

import React from "react";
import { Utensils, Sparkles, CalendarDays, Settings, Loader2, CheckCircle2, X } from "lucide-react";
import { Formik, Form, Field } from "formik";
import useAlmoco from "../hooks/useAlmoco";

/* UI bits */
function Modal({ open, title, onClose, children, footer }) {
  React.useEffect(()=>{ if(!open) return; const k=e=>e.key==="Escape"&&onClose?.(); document.addEventListener("keydown",k); return()=>document.removeEventListener("keydown",k);},[open,onClose]);
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button aria-label="Fechar" onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X size={18}/></button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
function Toast({ msg, tone="ok", onClose }) {
  if(!msg) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`flex items-start gap-3 rounded-xl ${tone==="error"?"bg-rose-600":"bg-gray-900"} text-white px-4 py-3 shadow-xl`}>
        <CheckCircle2 className="mt-0.5 text-emerald-300"/><div className="text-sm">{msg}</div>
        <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100" aria-label="Fechar">✕</button>
      </div>
    </div>
  );
}
const KPI = ({title,value,emoji})=>(
  <div className="rounded-2xl p-4 bg-gradient-to-b from-indigo-50 to-white ring-1 ring-indigo-200/60">
    <div className="text-sm text-gray-600 flex items-center gap-2"><span className="text-lg" aria-hidden>{emoji}</span>{title}</div>
    <div className="text-2xl md:text-3xl font-semibold text-gray-900">{value}</div>
  </div>
);

export default function Almoco(){
  const {
    allowed, loadingBoot,
    preco, atualizarPreco, updatingPreco,
    relHoje, loadingHoje,
    relData, loadingData, loadPorData,
    relIntervalo, loadingIntervalo, loadIntervalo,
    relMensal, loadingMensal, loadMensal,
    toast, setToast, tone,
    money, today
  } = useAlmoco();

  const [openPreco, setOpenPreco] = React.useState(false);

  if(loadingBoot){
    return <main className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600"/></main>;
  }
  if(!allowed){
    return <main className="min-h-screen grid place-items-center p-6"><div className="max-w-md w-full rounded-2xl border bg-white p-6 text-center">
      <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-rose-100 grid place-items-center"><X className="text-rose-600"/></div>
      <h2 className="text-lg font-semibold mb-1">Sem permissão</h2>
      <p className="text-gray-600 text-sm">Solicite acesso ao módulo Almoço.</p>
    </div></main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-25 via-white to-white space-y-6 p-3 md:p-6">
      {/* header divertido e acessível */}
      <header className="rounded-2xl p-5 md:p-6 bg-white border shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-indigo-100 grid place-items-center">
            <Utensils className="text-indigo-600" size={22} aria-hidden/>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Almoço Escolar <span className="inline-block align-middle">🍽️</span></h1>
            <p className="text-gray-600 flex items-center gap-2"><CalendarDays size={16}/> {new Date().toLocaleDateString("pt-PT")}</p>
          </div>
        </div>
        <button onClick={()=>setOpenPreco(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm md:text-base">
          <Settings size={18}/> Definir preço
        </button>
      </header>

      {/* KPIs (simpáticos para crianças: emojis e números grandes) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPI title="Almoços hoje" value={loadingHoje?"…":(relHoje?.totais?.total_almocos||0)} emoji="🍛"/>
        <KPI title="Arrecadado hoje" value={loadingHoje?"…":(money(relHoje?.totais?.total_arrecadado||0))} emoji="💰"/>
        <KPI title="Preço atual" value={money(preco)} emoji="🏷️"/>
      </section>

      {/* Relatórios acessíveis */}
      <section className="rounded-2xl p-5 bg-white border shadow-sm space-y-6">
        <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
          <Sparkles className="text-indigo-600"/> Relatórios rápidos
        </h2>

        {/* Por data */}
        <div className="grid gap-3 md:grid-cols-[240px_auto] items-end">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700">Escolher data</span>
              {({isSubmitting})=>(
                <Form className="flex items-center gap-2 mt-1">
                  <Field name="d" type="date" className="w-48 border rounded-xl px-3 py-2"/>
                  <button type="submit" className="px-3 py-2 rounded-xl border hover:bg-gray-50">{loadingData? <Loader2 className="h-4 w-4 animate-spin"/> :"Gerar"}</button>
                </Form>
              )}
          </label>
          {relData && (
            <div className="rounded-xl bg-indigo-50 p-3 ring-1 ring-indigo-200/60">
              <div className="text-sm text-gray-700">Data: <b>{relData.date}</b></div>
              <div className="text-sm text-gray-700">Almoços: <b>{relData.total_almocos}</b></div>
              <div className="text-sm text-gray-700">Arrecadado: <b>{money(relData.total_arrecadado)}</b></div>
            </div>
          )}
        </div>

        {/* Intervalo */}
        <div>
          <Formik initialValues={{ ini: today(), fim: today() }} onSubmit={v=>loadIntervalo(v.ini, v.fim)}>
            {()=>(
              <Form className="flex flex-wrap items-end gap-2">
                <label className="text-sm">
                  Início
                  <Field name="ini" type="date" className="block border rounded-xl px-3 py-2 mt-1"/>
                </label>
                <label className="text-sm">
                  Fim
                  <Field name="fim" type="date" className="block border rounded-xl px-3 py-2 mt-1"/>
                </label>
                <button type="submit" className="px-3 py-2 rounded-xl border hover:bg-gray-50">{loadingIntervalo? <Loader2 className="h-4 w-4 animate-spin"/> :"Gerar"}</button>
              </Form>
            )}
          </Formik>
          {relIntervalo && (
            <div className="mt-3 rounded-xl bg-teal-50 p-3 ring-1 ring-teal-200/60 text-sm">
              Período: <b>{relIntervalo.inicio}</b> → <b>{relIntervalo.fim}</b> •
              Almoços: <b className="mx-1">{relIntervalo.total_almocos}</b> •
              Arrecadado: <b className="mx-1">{money(relIntervalo.total_arrecadado)}</b>
            </div>
          )}
        </div>

        {/* Mensal */}
        <div>
          <Formik
            initialValues={{ ano: new Date().getFullYear(), mes: new Date().toLocaleString("pt-PT",{month:"long"}) }}
            onSubmit={v=>loadMensal(v.ano, v.mes)}
          >
            {()=>(
              <Form className="flex flex-wrap items-end gap-2">
                <label className="text-sm">
                  Ano
                  <Field name="ano" type="number" className="block border rounded-xl px-3 py-2 mt-1 w-28"/>
                </label>
                <label className="text-sm">
                  Mês
                  <Field as="select" name="mes" className="block border rounded-xl px-3 py-2 mt-1">
                    {["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"].map(m=><option key={m} value={m}>{m}</option>)}
                  </Field>
                </label>
                <button type="submit" className="px-3 py-2 rounded-xl border hover:bg-gray-50">{loadingMensal? <Loader2 className="h-4 w-4 animate-spin"/> :"Gerar"}</button>
              </Form>
            )}
          </Formik>
          {relMensal && (
            <div className="mt-3 rounded-xl bg-pink-50 p-3 ring-1 ring-pink-200/60 text-sm">
              <div>Período: <b>{relMensal.mes}</b> / <b>{relMensal.ano}</b></div>
              <div>Total arrecadado: <b>{money(relMensal.totalGeral?.total_arrecadado||0)}</b></div>
            </div>
          )}
        </div>
      </section>

      {/* Modal Preço */}
      <Modal open={openPreco} onClose={()=>setOpenPreco(false)} title="Preço do almoço">
        <Formik
          initialValues={{ preco: Number(preco||0).toFixed(2) }}
          enableReinitialize
          onSubmit={async (v)=>{ await atualizarPreco(Number(v.preco||0)); }}
        >
          {({isSubmitting})=>(
            <Form className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Preço (EUR)</label>
              <Field name="preco" type="number" step="0.01" min="0" className="w-full border rounded-xl px-3 py-2"/>
              <div className="flex justify-end">
                <button type="submit" disabled={isSubmitting||updatingPreco} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                  {(isSubmitting||updatingPreco)? <Loader2 className="h-4 w-4 animate-spin"/> : <Settings size={16}/>}
                  Guardar
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>

      <Toast msg={toast} tone={tone} onClose={()=>setToast("")}/>
    </main>
  );
}
