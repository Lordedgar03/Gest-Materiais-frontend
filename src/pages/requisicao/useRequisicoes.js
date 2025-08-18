import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '../../services/api' // ajuste o caminho conforme seu projeto

// ---- Normalizadores ----
const normalizeItem = (it = {}) => ({
  rqi_id: Number(it?.rqi_id ?? it?.id),
  rqi_fk_requisicao: Number(it?.rqi_fk_requisicao ?? it?.req_id ?? 0),
  rqi_fk_material: Number(it?.rqi_fk_material ?? 0),
  rqi_descricao: it?.rqi_descricao ?? '',
  rqi_quantidade: Number(it?.rqi_quantidade ?? 0),
  rqi_qtd_atendida: Number(it?.rqi_qtd_atendida ?? 0),
  rqi_qtd_devolvida: Number(it?.rqi_qtd_devolvida ?? 0),
  rqi_devolvido: it?.rqi_devolvido ?? 'Nao', // 'Nao' | 'Parcial' | 'Sim'
  rqi_status: it?.rqi_status ?? 'Pendente',
  rqi_data_devolucao: it?.rqi_data_devolucao ? new Date(it.rqi_data_devolucao) : null,
  rqi_condicao_retorno: it?.rqi_condicao_retorno ?? null,
  rqi_obs_devolucao: it?.rqi_obs_devolucao ?? null,
})

const normalizeDecisao = (d = {}) => ({
  dec_id: Number(d?.dec_id ?? d?.id ?? 0),
  dec_fk_requisicao: Number(d?.dec_fk_requisicao ?? 0),
  dec_fk_user: Number(d?.dec_fk_user ?? 0),
  dec_tipo: d?.dec_tipo ?? '', // 'Aprovar' | 'Rejeitar' | 'Cancelar'
  dec_motivo: d?.dec_motivo ?? null,
  dec_data: d?.dec_data ? new Date(d.dec_data) : null,
})

const normalizeReq = (h = {}) => ({
  req_id: Number(h?.req_id ?? h?.id),
  req_codigo: String(h?.req_codigo ?? ''),
  req_fk_user: Number(h?.req_fk_user ?? 0),
  req_status: String(h?.req_status ?? 'Pendente'),
  req_date: h?.req_date ? new Date(h.req_date) : null,
  req_needed_at: h?.req_needed_at ?? null,
  req_local_entrega: h?.req_local_entrega ?? '',
  req_justificativa: h?.req_justificativa ?? '',
  req_observacoes: h?.req_observacoes ?? '',
  req_approved_by: h?.req_approved_by ?? null,
  req_approved_at: h?.req_approved_at ? new Date(h.req_approved_at) : null,
  createdAt: h?.createdAt ? new Date(h.createdAt) : null,
  updatedAt: h?.updatedAt ? new Date(h.updatedAt) : null,
  itens: Array.isArray(h?.itens) ? h.itens.map(normalizeItem) : [],
  decisoes: Array.isArray(h?.decisoes) ? h.decisoes.map(normalizeDecisao) : [],
})

/**
 * Hook para gerir uma requisição específica.
 * Como o backend não expõe GET /requisicoes/:id, usamos GET /requisicoes e filtramos pelo id.
 */
export function useRequisicao(reqId, { includeItems = true, includeDecisions = true } = {}) {
  const [requisicao, setRequisicao] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const fetchOne = useCallback(async () => {
    if (!reqId) return { ok: false, message: 'reqId inválido' }
    abortRef.current?.abort?.()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true); setError(null)
    try {
      const { data } = await api.get('/requisicoes', { params: { includeItems, includeDecisions }, signal: controller.signal })
      const rows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
      const found = rows.find(r => Number(r.req_id) === Number(reqId))
      if (!found) throw new Error('Requisição não encontrada')
      setRequisicao(normalizeReq(found))
      return { ok: true }
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') return { ok: false, canceled: true }
      const msg = err?.response?.data?.message || err?.message || 'Falha ao carregar a requisição'
      setError(msg)
      return { ok: false, message: msg }
    } finally { setLoading(false) }
  }, [reqId, includeItems, includeDecisions])

  useEffect(() => { fetchOne() }, [fetchOne])

  // ---- Ações ----
  const setStatus = useCallback(async (req_status) => {
    if (!reqId) return { ok: false }
    setSaving(true); setError(null)
    try {
      const { data } = await api.put(`/requisicoes/${reqId}/status`, { req_status })
      const raw = data?.data ?? data
      setRequisicao(prev => normalizeReq(raw))
      return { ok: true }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao atualizar status'
      setError(msg)
      return { ok: false, message: msg }
    } finally { setSaving(false) }
  }, [reqId])

  const decidir = useCallback(async (tipo, motivo) => {
    if (!reqId) return { ok: false }
    setSaving(true); setError(null)
    try {
      const body = { tipo, ...(motivo ? { motivo } : {}) }
      const { data } = await api.post(`/requisicoes/${reqId}/decidir`, body)
      const raw = data?.data ?? data
      setRequisicao(prev => normalizeReq(raw))
      return { ok: true }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao registrar decisão'
      setError(msg)
      return { ok: false, message: msg }
    } finally { setSaving(false) }
  }, [reqId])

  const atender = useCallback(async (itens) => {
    if (!reqId) return { ok: false }
    setSaving(true); setError(null)
    try {
      const body = { itens: (itens||[]).map(i => ({ rqi_id: Number(i.rqi_id), quantidade: Number(i.quantidade) })) }
      await api.post(`/requisicoes/${reqId}/atender`, body)
      await fetchOne()
      return { ok: true }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao atender itens'
      setError(msg); return { ok: false, message: msg }
    } finally { setSaving(false) }
  }, [reqId, fetchOne])

  const devolver = useCallback(async (itens) => {
    if (!reqId) return { ok: false }
    setSaving(true); setError(null)
    try {
      const body = { itens: (itens||[]).map(i => ({ rqi_id: Number(i.rqi_id), quantidade: Number(i.quantidade), ...(i.condicao ? { condicao: i.condicao } : {}), ...(i.obs ? { obs: i.obs } : {}) })) }
      await api.post(`/requisicoes/${reqId}/devolver`, body)
      await fetchOne()
      return { ok: true }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao registrar devolução'
      setError(msg); return { ok: false, message: msg }
    } finally { setSaving(false) }
  }, [reqId, fetchOne])

  const remove = useCallback(async () => {
    if (!reqId) return { ok: false }
    setSaving(true); setError(null)
    try {
      await api.delete(`/requisicoes/${reqId}`)
      setRequisicao(null)
      return { ok: true }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao eliminar requisição'
      setError(msg); return { ok: false, message: msg }
    } finally { setSaving(false) }
  }, [reqId])

  // ---- Derivados ----
  const metrics = useMemo(() => {
    const itens = requisicao?.itens || []
    const totalItens = itens.length
    const totalQtd = itens.reduce((acc, i) => acc + Number(i.rqi_quantidade||0), 0)
    const atendida = itens.reduce((acc, i) => acc + Number(i.rqi_qtd_atendida||0), 0)
    const devolvida = itens.reduce((acc, i) => acc + Number(i.rqi_qtd_devolvida||0), 0)
    const emUso = atendida - devolvida
    return { totalItens, totalQtd, atendida, devolvida, emUso }
  }, [requisicao])

  return {
    requisicao,
    loading,
    saving,
    error,
    metrics,

    // ações
    refresh: fetchOne,
    setStatus,
    decidir,
    atender,
    devolver,
    remove,
  }
}
