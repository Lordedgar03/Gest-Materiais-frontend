"use client";

import React from "react";
import { CalendarCheck2, Search, Loader2, Plus, X } from "lucide-react";
import { Formik, Form, Field } from "formik";
import useMarcacao from "../hooks/useMarcacao";

export default function Marcacoes(){
  const {
    date, setDate, list, loading, load, marcar, atualizar, searchAlunos,
    toast, setToast, selectedAluno, setSelectedAluno,
    multiDates, addDate, removeDate
  } = useMarcacao();

  const [query, setQuery] = React.useState("");
  const [sug, setSug] = React.useState([]);
  const [tempDate, setTempDate] = React.useState(date);

  React.useEffect(()=>{ load({ data: date }); },[load, date]);

  React.useEffect(()=>{
    let active = true;
    (async()=>{
      const q = query.trim();
      if(!q){ setSug([]); return; }
      const s = await searchAlunos({ query: q });
      if(active) setSug(s.slice(0,8));
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
            <p className="text-gray-600">Escolha o aluno, visualize os dados e marque 1 ou várias datas.</p>
          </div>
        </div>
        <label className="text-sm">
          <span className="mr-2">Data</span>
          <input
            value={date}
            onChange={(e)=>{ const v=e.target.value; setDate(v); load({ data:v }); }}
            type="date"
            className="border rounded-xl px-3 py-2"
          />
        </label>
      </header>

      {/* Nova marcação / múltiplas datas */}
      <section className="rounded-2xl p-4 bg-white border shadow-sm">
        <Formik
          initialValues={{ alunoInput:"", status:"" }}
          onSubmit={async (v,{resetForm})=>{
            const aluno = selectedAluno?.alu_num_processo ?? v.alunoInput;
            const datas = multiDates.length ? multiDates : [];
            await marcar({ aluno, data: date, status: v.status || undefined, datas });
            resetForm();
            setQuery("");
            setSug([]);
          }}
        >
          {({ values, setFieldValue, isSubmitting })=>(
            <Form className="space-y-4">
              {/* Busca aluno */}
              <div className="grid md:grid-cols-[minmax(260px,1fr)_160px] gap-3">
                <div className="relative">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16}/></div>
                  <Field
                    name="alunoInput"
                    aria-label="Aluno ou nº processo"
                    placeholder="Aluno ou nº processo…"
                    value={values.alunoInput}
                    onChange={(e)=>{ setFieldValue("alunoInput", e.target.value); setSelectedAluno(null); setQuery(e.target.value); }}
                    className="w-full pl-8 pr-3 py-2 border rounded-xl"
                  />
                  {sug.length>0 && values.alunoInput && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow-lg max-h-56 overflow-auto">
                      {sug.map((a)=>(
                        <button
                          type="button"
                          key={`${a.alu_id}-${a.alu_num_processo}`}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                          onClick={()=>{
                            setFieldValue("alunoInput", String(a.alu_num_processo || a.alu_nome));
                            setSelectedAluno(a);
                            setQuery("");
                            setSug([]);
                          }}
                        >
                          <div className="font-medium">{a.alu_nome}</div>
                          <div className="text-xs text-gray-600">
                            Proc: {a.alu_num_processo} • Nº: {a.alu_numero ?? "-"} • Ano: {a.alu_ano ?? "-"} • Turma: {a.alu_turma ?? "-"}
                          </div>
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
              </div>

              {/* Cartão com dados completos do aluno selecionado */}
              {selectedAluno && (
                <div className="rounded-xl border bg-gray-50 p-3 text-sm grid md:grid-cols-5 gap-2">
                  <Info label="Nome" value={selectedAluno.alu_nome}/>
                  <Info label="Proc." value={selectedAluno.alu_num_processo}/>
                  <Info label="Número" value={selectedAluno.alu_numero ?? "-"}/>
                  <Info label="Ano" value={selectedAluno.alu_ano ?? "-"}/>
                  <Info label="Turma" value={selectedAluno.alu_turma ?? "-"}/>
                </div>
              )}

              {/* Datas múltiplas */}
              <div className="rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <input type="date" value={tempDate} onChange={(e)=>setTempDate(e.target.value)} className="border rounded-xl px-3 py-2"/>
                  <button type="button" className="px-3 py-2 rounded-xl border hover:bg-gray-50 flex items-center gap-1" onClick={()=>addDate(tempDate)}>
                    <Plus size={16}/> Adicionar data
                  </button>
                  {multiDates.length>0 && (
                    <button type="button" className="px-3 py-2 rounded-xl border hover:bg-gray-50" onClick={()=>multiDates.forEach(d=>removeDate(d))}>
                      Limpar todas
                    </button>
                  )}
                </div>
                {multiDates.length>0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {multiDates.map(d=>(
                      <span key={d} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-800 text-xs">
                        {d}
                        <button type="button" onClick={()=>removeDate(d)} className="ml-1 rounded hover:bg-orange-200">
                          <X size={12}/>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Se adicionar uma ou mais datas acima, serão marcadas **todas** de uma vez. Sem datas aqui, será usada a data do topo ({date}).
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={!values.alunoInput || isSubmitting}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isSubmitting? <Loader2 className="h-4 w-4 animate-spin"/> : (multiDates.length>0 ? "Marcar várias" : "Marcar")}
                </button>
              </div>
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
                <tr><Th>Aluno</Th><Th>Nº Proc.</Th><Th>Turma</Th><Th>Ano</Th><Th>Status</Th><Th>Ações</Th></tr>
              </thead>
              <tbody className="bg-white">
                {list.map((m,i)=>(
                  <tr key={m.ala_id ?? i} className={`border-t ${i%2?"bg-gray-50/50":""}`}>
                    <Td>{m.alu_nome}</Td>
                    <Td>{m.alu_num_processo ?? "-"}</Td>
                    <Td>{m.alu_turma ?? "-"}</Td>
                    <Td>{m.alu_ano ?? "-"}</Td>
                    <Td className="capitalize">{m.alm_statusot || m.ala_status || "-"}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <button className="px-2 py-1 rounded-xl border hover:bg-gray-50" onClick={()=>atualizar(m.ala_id, { alm_statusot:"pago" })}>Pago</button>
                        <button className="px-2 py-1 rounded-xl border hover:bg-gray-50" onClick={()=>atualizar(m.ala_id, { alm_statusot:"não pago" })}>Não pago</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {toast && (
        <div role="status" className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-xl shadow">
          {toast} <button className="ml-2 underline" onClick={()=>setToast("")}>ok</button>
        </div>
      )}
    </main>
  );
}

function Th({children}){ return <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase text-xs">{children}</th> }
function Td({children, className=""}){ return <td className={`px-3 py-2 ${className}`}>{children}</td> }

function Info({label, value}){
  return (
    <div><span className="text-gray-500">{label}:</span> <span className="font-medium">{value ?? "-"}</span></div>
  );
}
