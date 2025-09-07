"use client";

import React from "react";
import { Settings2, Search, Loader2, Pencil, X } from "lucide-react";
import { Formik, Form, Field } from "formik";
import useConfiguracoes from "../hooks/useConfiguracoes";

function Modal({ open, title, onClose, children }) {
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white border shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X size={18}/></button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function Configuracoes(){
  const { loading, items, upsert, toast, setToast } = useConfiguracoes();
  const [q, setQ] = React.useState("");
  const [edit, setEdit] = React.useState(null);

  const filtered = React.useMemo(()=> items.filter(i => `${i.cfg_chave} ${i.cfg_valor_s??""} ${i.cfg_valor_n??""}`.toLowerCase().includes(q.toLowerCase())), [items,q]);

  return (
    <main className="min-h-screen p-3 md:p-6 space-y-6 bg-gradient-to-b from-purple-25 via-white">
      <header className="rounded-2xl p-5 bg-white border shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-purple-100 grid place-items-center"><Settings2 className="text-purple-700"/></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Configurações ✨</h1>
            <p className="text-gray-600">Ajuste chaves e valores do sistema.</p>
          </div>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Procurar…" className="pl-8 pr-3 py-2 border rounded-xl"/>
        </div>
      </header>

      {loading ? (
        <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-purple-600"/></div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(cfg=>(
            <article key={cfg.cfg_id || cfg.cfg_chave} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500">Chave</div>
                  <h3 className="font-semibold">{cfg.cfg_chave}</h3>
                </div>
                <button aria-label="Editar" className="p-2 rounded-lg hover:bg-gray-100" onClick={()=>setEdit(cfg)}><Pencil size={16}/></button>
              </div>
              <div className="mt-3 text-sm">
                <div className="text-gray-600">Valor (texto): <b>{cfg.cfg_valor_s ?? "-"}</b></div>
                <div className="text-gray-600">Valor (número): <b>{cfg.cfg_valor_n ?? "-"}</b></div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* editar */}
      <Modal open={!!edit} onClose={()=>setEdit(null)} title="Editar configuração">
        {edit && (
          <Formik
            enableReinitialize
            initialValues={{ val_s: edit.cfg_valor_s ?? "", val_n: edit.cfg_valor_n ?? "" }}
            onSubmit={async v=>{
              const hasNumber = v.val_n !== "" && !isNaN(Number(v.val_n));
              await upsert(edit.cfg_chave, hasNumber ? Number(v.val_n) : v.val_s);
              setEdit(null);
            }}
          >
            {({ isSubmitting })=>(
              <Form className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor texto</label>
                  <Field name="val_s" className="w-full border rounded-xl px-3 py-2"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor número</label>
                  <Field name="val_n" type="number" className="w-full border rounded-xl px-3 py-2"/>
                  <p className="text-xs text-gray-500 mt-1">Se preencher número, ele tem prioridade.</p>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 text-white">{isSubmitting? <Loader2 className="h-4 w-4 animate-spin"/> : "Guardar"}</button>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </Modal>

      {toast && <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-xl shadow">{toast} <button className="ml-2 underline" onClick={()=>setToast("")}>ok</button></div>}
    </main>
  );
}
