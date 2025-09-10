/* eslint-disable no-unused-vars */
"use client";

import React from "react";
import { Users, PlusCircle, Upload, Search, Loader2, X, FileDown } from "lucide-react";
import { Formik, Form, Field } from "formik";
import useAlunos from "../hooks/useAlunos";
import api from "../api";

/* modal simples */
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white border shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}><X size={18}/></button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/* utils CSV */
const detectSep = (text) => (text.split("\n")[0].includes(";") ? ";" : ",");
const normalizeHeader = (h) =>
  String(h || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "_");

const headerAliases = {
  alu_nome: ["alu_nome", "nome", "aluno", "aluno_nome"],
  alu_num_processo: ["alu_num_processo", "num_processo", "n_processo", "numero_processo", "processo"],
  alu_numero: ["alu_numero", "numero", "n_aluno", "n"],
  alu_turma: ["alu_turma", "turma", "classe"],
  alu_ano: ["alu_ano", "ano", "ano_letivo", "ano_lectivo"],
  alu_status: ["alu_status", "status", "estado", "situacao", "situação"],
};

const headerMap = (rawHeader) => {
  const h = normalizeHeader(rawHeader);
  for (const [canonical, aliases] of Object.entries(headerAliases)) {
    if (aliases.includes(h)) return canonical;
  }
  return h; // mantém — pode ser ignorado depois
};

const toAluno = (rowObj) => {
  const o = {
    alu_nome: rowObj.alu_nome?.trim() || "",
    alu_num_processo: rowObj.alu_num_processo ? Number(rowObj.alu_num_processo) : null,
    alu_numero: rowObj.alu_numero ?? null,
    alu_turma: rowObj.alu_turma?.trim() || null,
    alu_ano: rowObj.alu_ano ? Number(rowObj.alu_ano) : null,
    alu_status: (rowObj.alu_status || "ativo").toString().toLowerCase().includes("inativ") ? "inativo" : "ativo",
  };
  // limpeza básica
  if (o.alu_numero === "") o.alu_numero = null;
  if (!o.alu_nome || !o.alu_num_processo || !o.alu_ano) return null;
  return o;
};

const chunk = (arr, size = 200) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export default function Alunos() {
  const { loading, list, filters, setFilters, load, create, update, setStatus, toast, setToast } = useAlunos();

  const [openNew, setOpenNew] = React.useState(false);
  const [editing, setEditing] = React.useState(null);

  // importar
  const [openImport, setOpenImport] = React.useState(false);
  const [fileName, setFileName] = React.useState("");
  const [rowsParsed, setRowsParsed] = React.useState([]); // todos
  const [preview, setPreview] = React.useState([]);       // primeiras 10
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState(null);

  React.useEffect(() => { load(); }, [load]);

  /* leitura simples de CSV (UTF-8) */
  const handleFile = async (file) => {
    setImportResult(null);
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const sep = detectSep(text);
    const lines = text.split(/\r?\n/).filter(l => l.trim().length);
    if (lines.length < 2) {
      setToast("Arquivo vazio ou sem dados."); return;
    }
    const headers = lines[0].split(sep).map(headerMap);
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(sep);
      const obj = {};
      headers.forEach((h, idx) => (obj[h] = cols[idx] ?? ""));
      const aluno = toAluno(obj);
      if (aluno) data.push(aluno);
    }
    setRowsParsed(data);
    setPreview(data.slice(0, 10));
  };

  /* baixa modelo CSV */
  const downloadTemplate = () => {
    const headers = "alu_nome;alu_num_processo;alu_numero;alu_turma;alu_ano;alu_status";
    const sample = [
      "João Silva;12345;12;9A;9;ativo",
      "Maria Santos;12346;;9B;9;ativo",
    ].join("\n");
    const blob = new Blob([headers + "\n" + sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "modelo_alunos.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* importação: tenta /alunos/bulk, senão fallback 1-a-1 */
  const startImport = async () => {
    if (!rowsParsed.length) { setToast("Escolha um CSV válido antes de importar."); return; }
    setImporting(true);
    setImportResult(null);
    let created = 0, updated = 0, ignored = 0, errors = 0;
    try {
      const packs = chunk(rowsParsed, 200);
      for (const pack of packs) {
        try {
          const r = await api.post("/alunos/bulk", { items: pack });
          const rs = r?.data?.results || r?.data || [];
          rs.forEach(x => {
            if (x?.status === "created" || x?.created) created++;
            else if (x?.status === "updated" || x?.updated) updated++;
            else ignored++;
          });
        } catch (e) {
          // fallback: cria um a um
          for (const it of pack) {
            try {
              await api.post("/alunos", it);
              created++;
            } catch (ex) {
              // se back-end responder "já existe", tentamos update por num_processo (se houver endpoint)
              if (String(ex?.response?.status) === "409") {
                try {
                  await api.put(`/alunos/by-numero-proc/${it.alu_num_processo}`, it);
                  updated++;
                } catch {
                  ignored++;
                }
              } else {
                errors++;
              }
            }
          }
        }
      }
      setImportResult({ created, updated, ignored, errors });
      await load(); // recarrega lista
      setToast(`Importação concluída: +${created} criados • ${updated} atualizados • ${ignored} ignorados • ${errors} erros`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <main className="min-h-screen p-3 md:p-6 space-y-6 bg-gradient-to-b from-teal-25 via-white">
      <header className="rounded-2xl p-5 bg-white border shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-teal-100 grid place-items-center"><Users className="text-teal-700"/></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Alunos 👦👧</h1>
            <p className="text-gray-600 text-sm">Pesquise, crie, atualize e **importe** alunos via CSV.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setOpenImport(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-gray-50">
            <Upload size={18}/> Importar CSV
          </button>
          <button onClick={()=>setOpenNew(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
            <PlusCircle size={18}/> Novo
          </button>
        </div>
      </header>

      {/* Filtros */}
      <section className="rounded-2xl p-4 bg-white border shadow-sm">
        <Formik enableReinitialize initialValues={filters} onSubmit={(v)=>{ setFilters(v); load(v); }}>
          {() => (
            <Form className="grid md:grid-cols-6 gap-3">
              <Field name="nome" placeholder="Nome" className="border rounded-xl px-3 py-2"/>
              <Field name="num_processo" type="number" placeholder="Nº processo" className="border rounded-xl px-3 py-2"/>
              <Field name="numero" placeholder="Nº" className="border rounded-xl px-3 py-2"/>
              <Field name="turma" placeholder="Turma" className="border rounded-xl px-3 py-2"/>
              <Field name="ano" type="number" placeholder="Ano" className="border rounded-xl px-3 py-2"/>
              <Field as="select" name="status" className="border rounded-xl px-3 py-2">
                <option value="">-- Status --</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </Field>
              <div className="md:col-span-6 flex gap-2 justify-end">
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
              <article key={a.alu_id || `${a.alu_num_processo}-${a.alu_turma}`} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{a.alu_nome}</h3>
                    <p className="text-sm text-gray-600">Proc: <b>{a.alu_num_processo}</b> • Nº: <b>{a.alu_numero ?? "-"}</b></p>
                    <p className="text-sm text-gray-600">Turma: <b>{a.alu_turma ?? "-"}</b> • Ano: <b>{a.alu_ano}</b></p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${a.alu_status==="inativo"?"bg-rose-100 text-rose-800":"bg-emerald-100 text-emerald-800"}`}>
                    {a.alu_status || "ativo"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="px-3 py-1.5 rounded-xl border hover:bg-gray-50" onClick={()=>setEditing(a)}>Editar</button>
                  {a.alu_status==="inativo" ? (
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
          initialValues={{ alu_nome:"", alu_num_processo:"", alu_numero:"", alu_turma:"", alu_ano:"", alu_status:"ativo" }}
          onSubmit={async (v,{resetForm})=>{
            await create({
              alu_nome: v.alu_nome,
              alu_num_processo: v.alu_num_processo,
              alu_numero: v.alu_numero,
              alu_turma: v.alu_turma,
              alu_ano: v.alu_ano,
              alu_status: v.alu_status
            });
            resetForm();
            setOpenNew(false);
          }}
        >
          {({isSubmitting})=>(
            <Form className="grid gap-3">
              <Field name="alu_nome" placeholder="Nome" className="border rounded-xl px-3 py-2" required/>
              <div className="grid grid-cols-2 gap-3">
                <Field name="alu_num_processo" type="number" placeholder="Nº processo" className="border rounded-xl px-3 py-2" required/>
                <Field name="alu_numero" placeholder="Nº" className="border rounded-xl px-3 py-2"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field name="alu_turma" placeholder="Turma" className="border rounded-xl px-3 py-2"/>
                <Field name="alu_ano" type="number" placeholder="Ano" className="border rounded-xl px-3 py-2" required/>
              </div>
              <Field as="select" name="alu_status" className="border rounded-xl px-3 py-2">
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </Field>
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
              alu_nome: editing.alu_nome || "",
              alu_num_processo: editing.alu_num_processo || "",
              alu_numero: editing.alu_numero || "",
              alu_turma: editing.alu_turma || "",
              alu_ano: editing.alu_ano || "",
              alu_status: editing.alu_status || "ativo"
            }}
            onSubmit={async (v)=>{
              await update(editing.alu_id || editing.id, {
                alu_nome: v.alu_nome,
                alu_num_processo: v.alu_num_processo,
                alu_numero: v.alu_numero,
                alu_turma: v.alu_turma,
                alu_ano: v.alu_ano,
                alu_status: v.alu_status
              });
              setEditing(null);
            }}
          >
            {({isSubmitting})=>(
              <Form className="grid gap-3">
                <Field name="alu_nome" className="border rounded-xl px-3 py-2"/>
                <div className="grid grid-cols-2 gap-3">
                  <Field name="alu_num_processo" type="number" className="border rounded-xl px-3 py-2"/>
                  <Field name="alu_numero" className="border rounded-xl px-3 py-2"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field name="alu_turma" className="border rounded-xl px-3 py-2"/>
                  <Field name="alu_ano" type="number" className="border rounded-xl px-3 py-2"/>
                </div>
                <Field as="select" name="alu_status" className="border rounded-xl px-3 py-2">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </Field>
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

      {/* Importar CSV */}
      <Modal open={openImport} onClose={()=>setOpenImport(false)} title="Importar alunos (CSV)">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Formato recomendado: <code>alu_nome;alu_num_processo;alu_numero;alu_turma;alu_ano;alu_status</code>.  
            Aceita <b>;</b> ou <b>,</b> como separador e cabeçalhos equivalentes (ex.: <i>nome</i>, <i>num_processo</i>, <i>status</i>…).
          </p>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-gray-50 cursor-pointer">
              <Upload size={16}/> Escolher CSV
              <input type="file" accept=".csv,text/csv" className="hidden"
                     onChange={(e)=>handleFile(e.target.files?.[0])}/>
            </label>
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-gray-50"
                    onClick={downloadTemplate}>
              <FileDown size={16}/> Modelo CSV
            </button>
            {fileName && <span className="text-sm text-gray-700 truncate" title={fileName}>{fileName}</span>}
          </div>

          {preview.length > 0 && (
            <div className="rounded-xl border overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left">Nome</th>
                    <th className="px-2 py-1 text-left">Proc.</th>
                    <th className="px-2 py-1 text-left">Nº</th>
                    <th className="px-2 py-1 text-left">Turma</th>
                    <th className="px-2 py-1 text-left">Ano</th>
                    <th className="px-2 py-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i)=>(
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1">{r.alu_nome}</td>
                      <td className="px-2 py-1">{r.alu_num_processo}</td>
                      <td className="px-2 py-1">{r.alu_numero ?? "-"}</td>
                      <td className="px-2 py-1">{r.alu_turma ?? "-"}</td>
                      <td className="px-2 py-1">{r.alu_ano}</td>
                      <td className="px-2 py-1">{r.alu_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-2 text-xs text-gray-600">
                Pré-visualizando {preview.length} de {rowsParsed.length} registos.
              </div>
            </div>
          )}

          {importResult && (
            <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200/60 p-3 text-sm">
              <b>Resultado:</b> {importResult.created} criados • {importResult.updated} atualizados • {importResult.ignored} ignorados • {importResult.errors} erros
            </div>
          )}

          <div className="flex justify-end">
            <button
              disabled={!rowsParsed.length || importing}
              onClick={startImport}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white disabled:opacity-60"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Upload size={16}/>}
              Importar
            </button>
          </div>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-xl shadow" role="status">
          {toast} <button onClick={()=>setToast("")} className="ml-2 underline">ok</button>
        </div>
      )}
    </main>
  );
}
