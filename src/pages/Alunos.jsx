/* eslint-disable no-unused-vars */
"use client";

import React from "react";
import { Users, PlusCircle, Search, Loader2, X } from "lucide-react";
import { Formik, Form, Field } from "formik";
import useAlunos from "../hooks/useAlunos";

/* modal simples */
function Modal({ open, title, onClose, children }) {
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white border shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}><X size={18}/></button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function Alunos(){
  const { loading, list, filters, setFilters, load, create, update, setStatus, toast, setToast } = useAlunos();
  const [openNew, setOpenNew] = React.useState(false);
  const [editing, setEditing] = React.useState(null);

  React.useEffect(()=>{ load(); },[load]);

  return (
    <main className="min-h-screen p-3 md:p-6 space-y-6 bg-gradient-to-b from-teal-25 via-white">
      <header className="rounded-2xl p-5 bg-white border shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-teal-100 grid place-items-center"><Users className="text-teal-700"/></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Alunos 👦👧</h1>
            <p className="text-gray-600">Pesquise, crie e actualize os alunos.</p>
          </div>
        </div>
        <button onClick={()=>setOpenNew(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
          <PlusCircle size={18}/> Novo
        </button>
      </header>

      {/* Filtros */}
      <section className="rounded-2xl p-4 bg-white border shadow-sm">
        <Formik
          enableReinitialize
          initialValues={filters}
          onSubmit={(v)=>{ setFilters(v); load(v); }}
        >
          {({ isSubmitting })=>(
            <Form className="grid md:grid-cols-5 gap-3">
              <Field name="nome" placeholder="Nome" className="border rounded-xl px-3 py-2"/>
              <Field name="num_processo" type="number" placeholder="Nº processo" className="border rounded-xl px-3 py-2"/>
              <Field name="numero" type="number" placeholder="Nº" className="border rounded-xl px-3 py-2"/>
              <Field name="turma" placeholder="Turma" className="border rounded-xl px-3 py-2"/>
              <Field name="ano" type="number" placeholder="Ano" className="border rounded-xl px-3 py-2"/>
              <div className="md:col-span-5 flex gap-2 justify-end">
                <button type="submit" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-gray-50">
                  <Search size={16}/> Filtrar
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </section>

      {/* Lista */}
      <section>
        {loading ? (
          <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-teal-600"/></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a)=>(
              <article key={`${a.alu_num_processo}-${a.alu_turma}`} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{a.alu_nome}</h3>
                    <p className="text-sm text-gray-600">Proc: <b>{a.alu_num_processo}</b> • Nº: <b>{a.alu_numero ?? "-"}</b></p>
                    <p className="text-sm text-gray-600">Turma: <b>{a.alu_turma}</b> • Ano: <b>{a.alu_ano}</b></p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${a.status==="inativo"?"bg-rose-100 text-rose-800":"bg-emerald-100 text-emerald-800"}`}>
                    {a.status || "ativo"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="px-3 py-1.5 rounded-xl border hover:bg-gray-50" onClick={()=>setEditing(a)}>Editar</button>
                  {a.status==="inativo" ? (
                    <button className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white" onClick={()=>setStatus(a.alu_id || a.id, "ativo")}>Ativar</button>
                  ) : (
                    <button className="px-3 py-1.5 rounded-xl bg-rose-600 text-white" onClick={()=>setStatus(a.alu_id || a.id, "inativo")}>Desativar</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Novo */}
      <Modal open={openNew} onClose={()=>setOpenNew(false)} title="Novo aluno">
        <Formik
          initialValues={{ alu_nome:"", alu_num_processo:"", alu_numero:"", alu_turma:"", alu_ano:"" }}
          onSubmit={async (v,{resetForm})=>{ await create({
            alu_nome:v.alu_nome, alu_num_processo:Number(v.alu_num_processo),
            alu_numero: v.alu_numero ? Number(v.alu_numero):null,
            alu_turma: v.alu_turma, alu_ano:Number(v.alu_ano)
          }); resetForm(); setOpenNew(false); }}
        >
          {({isSubmitting})=>(
            <Form className="grid gap-3">
              <Field name="alu_nome" placeholder="Nome" className="border rounded-xl px-3 py-2" required/>
              <Field name="alu_num_processo" type="number" placeholder="Nº processo" className="border rounded-xl px-3 py-2" required/>
              <div className="grid grid-cols-2 gap-3">
                <Field name="alu_numero" type="number" placeholder="Nº" className="border rounded-xl px-3 py-2"/>
                <Field name="alu_turma" placeholder="Turma" className="border rounded-xl px-3 py-2" required/>
              </div>
              <Field name="alu_ano" type="number" placeholder="Ano" className="border rounded-xl px-3 py-2" required/>
              <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 rounded-xl bg-teal-600 text-white">
                  {isSubmitting? <Loader2 className="h-4 w-4 animate-spin"/> : "Guardar"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Editar */}
      <Modal open={!!editing} onClose={()=>setEditing(null)} title="Editar aluno">
        {editing && (
          <Formik
            enableReinitialize
            initialValues={{
              alu_nome: editing.alu_nome, alu_num_processo: editing.alu_num_processo,
              alu_numero: editing.alu_numero, alu_turma: editing.alu_turma, alu_ano: editing.alu_ano
            }}
            onSubmit={async (v)=>{ await update(editing.alu_id || editing.id, {
              alu_nome:v.alu_nome, alu_num_processo:Number(v.alu_num_processo),
              alu_numero: v.alu_numero?Number(v.alu_numero):null, alu_turma:v.alu_turma, alu_ano:Number(v.alu_ano)
            }); setEditing(null); }}
          >
            {({isSubmitting})=>(
              <Form className="grid gap-3">
                <Field name="alu_nome" className="border rounded-xl px-3 py-2"/>
                <Field name="alu_num_processo" type="number" className="border rounded-xl px-3 py-2"/>
                <div className="grid grid-cols-2 gap-3">
                  <Field name="alu_numero" type="number" className="border rounded-xl px-3 py-2"/>
                  <Field name="alu_turma" className="border rounded-xl px-3 py-2"/>
                </div>
                <Field name="alu_ano" type="number" className="border rounded-xl px-3 py-2"/>
                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 rounded-xl bg-teal-600 text-white">
                    {isSubmitting? <Loader2 className="h-4 w-4 animate-spin"/> : "Guardar"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </Modal>

      {toast && <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-xl shadow" role="status">{toast} <button onClick={()=>setToast("")} className="ml-2 underline">ok</button></div>}
    </main>
  );
}
