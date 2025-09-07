"use client";

import React from "react";
import { CalendarCheck2, Search, Loader2, X } from "lucide-react";
import { Formik, Form, Field } from "formik";
import useMarcacao from "../hooks/useMarcacao";

export default function Marcacoes(){
  const { date, setDate, list, loading, load, marcar, atualizar, searchAlunos, toast, setToast } = useMarcacao();
  const [query, setQuery] = React.useState("");
  const [sug, setSug] = React.useState([]);

  React.useEffect(()=>{ load({ data: date }); },[load, date]);

  React.useEffect(()=>{
    let active = true;
    (async()=>{
      if(!query.trim()){ setSug([]); return; }
      const data = await searchAlunos({ nome: query.trim() });
      if(active) setSug(data.slice(0,8));
    })();
    return ()=>{active=false};
  },[query, searchAlunos]);

  return (
    <main className="min-h-screen p-3 md:p-6 space-y-6 bg-gradient-to-b from-orange-25 via-white">
      <header className="rounded-2xl p-5 bg-white border shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-orange-100 grid place-items-center"><CalendarCheck2 className="text-orange-700"/></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Marcações 🍊</h1>
            <p className="text-gray-600">Registe presenças e pagamentos de forma simples.</p>
          </div>
        </div>
        <label className="text-sm">
          <span className="mr-2">Data</span>
          <input value={date} onChange={(e)=>{setDate(e.target.value); load({ data:e.target.value });}} type="date" className="border rounded-xl px-3 py-2"/>
        </label>
      </header>

      {/* Nova marcação rápida */}
      <section className="rounded-2xl p-4 bg-white border shadow-sm">
        <Formik
          initialValues={{ aluno_nome:"", status:"" }}
          onSubmit={async (v,{resetForm})=>{
            await marcar({ aluno_nome:v.aluno_nome.trim(), data:date, status: v.status||undefined });
            resetForm();
            setQuery("");
            setSug([]);
          }}
        >
          {({ values, setFieldValue, isSubmitting })=>(
            <Form className="grid md:grid-cols-[minmax(240px,1fr)_160px_120px] gap-3">
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></div>
                <Field
                  name="aluno_nome"
                  aria-label="Aluno"
                  placeholder="Pesquisar aluno…"
                  value={values.aluno_nome}
                  onChange={(e)=>{ setFieldValue("aluno_nome", e.target.value); setQuery(e.target.value); }}
                  className="w-full pl-8 pr-3 py-2 border rounded-xl"
                />
                {sug.length>0 && values.aluno_nome && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow-lg max-h-56 overflow-auto">
                    {sug.map((a)=>(
                      <button type="button" key={`${a.alu_num_processo}-${a.alu_turma}`} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        onClick={()=>{ setFieldValue("aluno_nome", a.alu_nome); setQuery(""); setSug([]);}}>
                        <div className="font-medium">{a.alu_nome}</div>
                        <div className="text-xs text-gray-600">Proc: {a.alu_num_processo} • Turma: {a.alu_turma}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Field as="select" name="status" className="border rounded-xl px-3 py-2">
                <option value="">Status padrão</option>
                <option value="pago">pago</option>
                <option value="não pago">não pago</option>
              </Field>
              <button type="submit" disabled={!values.aluno_nome || isSubmitting} className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white">
                {isSubmitting? <Loader2 className="h-4 w-4 animate-spin"/> : "Marcar"}
              </button>
            </Form>
          )}
        </Formik>
      </section>

      {/* Tabela do dia */}
      <section className="rounded-2xl p-4 bg-white border shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Marcados em {date}</h2>
        {loading? (
          <div className="py-8 text-center text-gray-600"><Loader2 className="inline h-5 w-5 animate-spin mr-2"/>A carregar…</div>
        ) : list.length===0 ? (
          <p className="text-gray-600">Sem marcações nesta data.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr><Th>Aluno</Th><Th>Status</Th><Th>Presença</Th><Th>Ações</Th></tr>
              </thead>
              <tbody className="bg-white">
                {list.map((m,i)=>(
                  <tr key={m.alm_id ?? i} className={`border-t ${i%2?"bg-gray-50/50":""}`}>
                    <Td>{m.aluno_nome || m.alu_nome}</Td>
                    <Td className="capitalize">{m.alm_statusot || "-"}</Td>
                    <Td className="capitalize">{m.alm_presenca || "-"}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <button className="px-2 py-1 rounded-xl border hover:bg-gray-50" onClick={()=>atualizar(m.alm_id, { alm_presenca:"presente" })}>Presente</button>
                        <button className="px-2 py-1 rounded-xl border hover:bg-gray-50" onClick={()=>atualizar(m.alm_id, { alm_presenca:"ausente" })}>Ausente</button>
                        <button className="px-2 py-1 rounded-xl border hover:bg-gray-50" onClick={()=>atualizar(m.alm_id, { alm_statusot:"pago" })}>Pago</button>
                        <button className="px-2 py-1 rounded-xl border hover:bg-gray-50" onClick={()=>atualizar(m.alm_id, { alm_statusot:"não pago" })}>Não pago</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {toast && <div role="status" className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-xl shadow">{toast} <button className="ml-2 underline" onClick={()=>setToast("")}>ok</button></div>}
    </main>
  );
}

function Th({children}){ return <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase text-xs">{children}</th> }
function Td({children, className=""}){ return <td className={`px-3 py-2 ${className}`}>{children}</td> }
