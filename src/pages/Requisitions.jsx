/* eslint-disable no-unused-vars */
"use client"

import React from "react"
import {
  FileText, PlusCircle, X, Loader2, AlertCircle, Shield, Search, PackagePlus,
  CheckCircle, XCircle, Trash2, Undo2
} from "lucide-react"
import { useRequisicao, statusColors } from "../hooks/useRequisicao"

/* Modal Genérico */
function Modal({ open, title, onClose, children, footer, maxWidth = "max-w-2xl" }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-xl border border-gray-200`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && <div className="p-4 border-t">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

function StatusChip({ status }) {
  const cls = statusColors[status] || "bg-gray-100 text-gray-800"
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
}

export default function Requisicao() {
  const {
    // perms
    hasManageCategory, allowedCategoryIds,
    // dados
    materiais, usuarios, filtered,
    // ui comum
    loading, submitting, error, setError,
    showForm, setShowForm,
    // filtros
    filterStatus, setFilterStatus,
    filterMaterial, setFilterMaterial,
    // form (controlado pelo hook)
    formNeededAt, setFormNeededAt,
    formLocalEntrega, setFormLocalEntrega,
    formJustificativa, setFormJustificativa,
    formObservacoes, setFormObservacoes,
    itemMaterial, setItemMaterial,
    itemQuantidade, setItemQuantidade,
    itemDescricao, setItemDescricao,
    itens, addItem, removeItem, submitRequisicao,
    // helpers
    materialNome,
    // NOVOS: estado de modal + ações
    uiModal, closeModal,
    openDecision, confirmDecision,
    openAtender,  confirmAtender,
    openDevolver, confirmDevolver,
    openDelete,   confirmDelete,
    // regras
    canOperateReq, canDecideReq,
  } = useRequisicao()

  if (loading && filtered.length === 0) {
    return (
      <div className="p-10 flex flex-col items-center">
        <Loader2 size={34} className="animate-spin text-indigo-600" />
        <span className="mt-2 text-gray-600">Carregando…</span>
      </div>
    )
  }

  return (
    <main className="min-h-screen  space-y-6">
      <header className="rounded-2xl p-6 bg-white/90 backdrop-blur border border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="text-indigo-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Requisições</h1>
            <p className="text-sm text-gray-600">Crie, acompanhe e atue nas requisições de materiais.</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusCircle size={18} /> Nova requisição
        </button>
      </header>

      {error && (
        <div className="rounded-xl p-3 bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2" role="alert">
          <AlertCircle /> {String(error)}
          <button className="ml-auto underline decoration-rose-400" onClick={() => setError(null)}>Fechar</button>
        </div>
      )}

      {/* Filtros básicos */}
      <section className="rounded-2xl p-4 bg-white/90 border border-gray-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <label className="block text-xs  text-gray-600 mb-1">Utilizador</label>
            <input className="w-full pl-9 pr-3 py-2 border rounded-lg" placeholder="Pesquisar (visuais – plugue no hook se quiser)" />
          </div>
          <div>
            <label className="block text-xs  text-gray-600 mb-1">Status</label>
            <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="Todos">Todos</option>
              {["Pendente","Aprovada","Atendida","Em Uso","Parcial","Devolvida","Rejeitada","Cancelada"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Material (em qualquer item)</label>
            <select value={filterMaterial} onChange={(e)=>setFilterMaterial(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="Todos">Todos</option>
              {materiais.map(m => <option key={m.mat_id} value={m.mat_id}>{m.mat_nome}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Lista em cards simples */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {filtered.length ? filtered.map(req => {
          const codigo = req.req_codigo ?? req.codigo ?? `#${req.req_id ?? "?"}`
          const mayOperate = canOperateReq(req)
          const mayDecide = canDecideReq(req)
          return (
            <article key={req.req_id} className="rounded-2xl bg-white/90 border border-gray-400 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500">{codigo}</div>
                  <div className="mt-1"><StatusChip status={req.req_status} /></div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                {Array.isArray(req.itens) ? `${req.itens.length} item(ns)` : "0 item"}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => openDecision(req, "Aprovar")}
                  disabled={!(req.req_status === "Pendente" && mayDecide)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md  bg-green-800 border text-white hover:bg-emerald-50 disabled:opacity-50"
                >
                  <CheckCircle size={14}/> Aprovar
                </button>
                <button
                  onClick={() => openDecision(req, "Rejeitar")}
                  disabled={!(req.req_status === "Pendente" && mayDecide)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border bg-rose-800 border-rose-400 text-white hover:bg-rose-50 disabled:opacity-50"
                >
                  <XCircle size={14}/> Rejeitar
                </button>
                <button
                  onClick={() => openDecision(req, "Cancelar")}
                  disabled={!(req.req_status === "Pendente" && mayDecide)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border bg-amber-800 border-amber-400 text-white hover:bg-amber-50 disabled:opacity-50"
                >
                  <X size={14}/> Cancelar
                </button>
                <button
                  onClick={() => openDelete(req.req_id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border text-gray-700 hover:bg-gray-50"
                >
                  <Trash2 size={14}/> Excluir
                </button>
              </div>

              {/* ações por item (atender/devolver) – exemplo do primeiro item */}
              {Array.isArray(req.itens) && req.itens.length > 0 && (
                <div className="mt-3 rounded-lg  bg-gray-100 p-2">
                  {req.itens.slice(0,1).map(it => {
                    const restante = Number(it.rqi_quantidade || 0) - Number(it.rqi_qtd_atendida || 0)
                    const emUso = Number(it.rqi_qtd_atendida || 0) - Number(it.rqi_qtd_devolvida || 0)
                    return (
                      <div key={it.rqi_id} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-gray-600">{materialNome(it.rqi_fk_material)}</span>
                        <span className="text-gray-500">• Solicitado {it.rqi_quantidade}</span>
                        <span className="text-gray-500">• Atendido {it.rqi_qtd_atendida || 0}</span>
                        <span className="text-gray-500">• Devolvido {it.rqi_qtd_devolvida || 0}</span>
                        <div className="ml-auto flex gap-2">
                          <button
                            onClick={() => openAtender(req, it)}
                            disabled={!(restante > 0 && mayOperate)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                          >
                            <CheckCircle size={12}/> Atendido
                          </button>
                          <button
                            onClick={() => openDevolver(req, it)}
                            disabled={!(emUso > 0)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded border bg-teal-900 border-teal-800 text-white hover:bg-teal-50 disabled:opacity-50"
                          >
                            <Undo2 size={12}/> Devolver
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </article>
          )
        }) : (
          <div className="col-span-full p-10 text-center rounded-2xl bg-white/90 border">
            <p className="text-gray-700">Nenhuma requisição encontrada.</p>
          </div>
        )}
      </section>

      {/* ===== MODAL: Formulário de nova requisição ===== */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova requisição" maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button form="form-req" type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-70">
              {submitting && <Loader2 size={18} className="animate-spin" />} Enviar
            </button>
          </div>
        }
      >
        <form id="form-req" onSubmit={submitRequisicao} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Necessário em</label>
              <input type="date" value={formNeededAt} onChange={e=>setFormNeededAt(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Local de entrega</label>
              <input type="text" value={formLocalEntrega} onChange={e=>setFormLocalEntrega(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Justificativa</label>
              <input type="text" value={formJustificativa} onChange={e=>setFormJustificativa(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm mb-1">Observações</label>
              <input type="text" value={formObservacoes} onChange={e=>setFormObservacoes(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div className="pt-3 border-t space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><PackagePlus size={16}/> Itens</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select value={itemMaterial} onChange={e=>setItemMaterial(e.target.value)} className="border rounded-lg px-3 py-2">
                <option value="">Selecione um material</option>
                {materiais.map(m => <option key={m.mat_id} value={m.mat_id}>{m.mat_nome}</option>)}
              </select>
              <input type="number" min="1" value={itemQuantidade} onChange={e=>setItemQuantidade(e.target.value)} className="border rounded-lg px-3 py-2" placeholder="Quantidade" />
              <input type="text" value={itemDescricao} onChange={e=>setItemDescricao(e.target.value)} className="border rounded-lg px-3 py-2" placeholder="Observação (opcional)" />
              <button type="button" onClick={addItem} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-2">
                <PackagePlus size={16}/> Adicionar item
              </button>
            </div>

            {itens.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                      <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-600 uppercase">Material</th>
                      <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-600 uppercase">Qtd</th>
                      <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((it, idx) => (
                      <tr key={it.rqi_id ?? idx} className="border-t">
                        <td className="py-2 pr-4">#{it.rqi_id ?? idx+1}</td>
                        <td className="py-2 pr-4">
                          {materialNome(it.rqi_fk_material)}
                          {it.rqi_descricao ? <span className="block text-xs text-gray-500">{it.rqi_descricao}</span> : null}
                        </td>
                        <td className="py-2 pr-4">{it.rqi_quantidade}</td>
                        <td className="py-2 pr-4">
                          <button type="button" onClick={()=>removeItem(idx)} className="px-2 py-1 border rounded text-rose-700 border-rose-200 hover:bg-rose-50">Remover</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* ===== MODAL: Decisão (Aprovar/Rejeitar/Cancelar) ===== */}
      <Modal
        open={uiModal.open && uiModal.kind === "decisao"}
        onClose={closeModal}
        title={`Registrar decisão — ${uiModal.payload?.tipo ?? ""}`}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button onClick={() => {
              const motivo = document.getElementById("motivo-dec")?.value || ""
              confirmDecision({ motivo })
            }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Confirmar</button>
          </div>
        }
      >
        <label className="block text-sm mb-1">Motivo (opcional)</label>
        <textarea id="motivo-dec" rows={3} className="w-full border rounded-lg px-3 py-2" placeholder="Observações..." />
      </Modal>

      {/* ===== MODAL: Atender Item ===== */}
      <Modal
        open={uiModal.open && uiModal.kind === "atender"}
        onClose={closeModal}
        title="Atender item"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button onClick={() => {
              const quantidade = Number(document.getElementById("qtd-atender")?.value || 0)
              confirmAtender({ quantidade })
            }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Confirmar</button>
          </div>
        }
      >
        <p className="text-sm text-gray-600 mb-2">Restante: <b>{uiModal.payload?.restante ?? 0}</b></p>
        <label className="block text-sm mb-1">Quantidade a atender</label>
        <input id="qtd-atender" type="number" min={1} max={uiModal.payload?.restante ?? 1} defaultValue={uiModal.payload?.restante ?? 1} className="w-full border rounded-lg px-3 py-2" />
      </Modal>

      {/* ===== MODAL: Devolver Item ===== */}
      <Modal
        open={uiModal.open && uiModal.kind === "devolver"}
        onClose={closeModal}
        title="Aprovar devolução"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button onClick={() => {
              const quantidade = Number(document.getElementById("qtd-dev")?.value || 0)
              const condicao   = document.getElementById("cond-dev")?.value || "Boa"
              const obs        = document.getElementById("obs-dev")?.value || ""
              confirmDevolver({ quantidade, condicao, obs })
            }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Confirmar</button>
          </div>
        }
      >
        <p className="text-sm text-gray-600 mb-2">Em uso: <b>{uiModal.payload?.emUso ?? 0}</b></p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Quantidade</label>
            <input id="qtd-dev" type="number" min={1} max={uiModal.payload?.emUso ?? 1} defaultValue={uiModal.payload?.emUso ?? 1} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Condição</label>
            <select id="cond-dev" defaultValue="Boa" className="w-full border rounded-lg px-3 py-2">
              <option>Boa</option>
              <option>Danificada</option>
              <option>Perdida</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm mb-1">Observações</label>
            <textarea id="obs-dev" rows={3} className="w-full border rounded-lg px-3 py-2" placeholder="Opcional..." />
          </div>
        </div>
      </Modal>

      {/* ===== MODAL: Excluir Requisição ===== */}
      <Modal
        open={uiModal.open && uiModal.kind === "delete"}
        onClose={closeModal}
        title="Excluir requisição"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button onClick={confirmDelete} className="px-4 py-2 bg-rose-600 text-white rounded-lg">Excluir</button>
          </div>
        }
      >
        <p className="text-sm text-gray-700">Tem certeza que deseja excluir esta requisição? Esta ação não poderá ser desfeita.</p>
      </Modal>
    </main>
  )
}
