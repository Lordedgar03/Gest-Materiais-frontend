// src/hooks/useRequisicao.js
import { useEffect, useMemo, useRef, useState } from "react"
import api from "../api"

export const statusColors = {
  Pendente: "bg-yellow-100 text-yellow-800",
  Aprovada: "bg-green-100 text-green-800",
  Rejeitada: "bg-red-100 text-red-800",
  Cancelada: "bg-gray-100 text-gray-700",
  Parcial: "bg-blue-100 text-blue-800",
  "Em Uso": "bg-indigo-100 text-indigo-800",
  Atendida: "bg-emerald-100 text-emerald-800",
  Devolvida: "bg-teal-100 text-teal-800",
}

function parseJwtSafe(token) {
  try {
    const base64 = token.split(".")[1]
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json)
  } catch {
    return {}
  }
}

function normalizeList(res) {
  const d = res?.data
  if (Array.isArray(d)) return d
  if (d && Array.isArray(d.data)) return d.data
  if (d && d.success && Array.isArray(d.data)) return d.data
  return []
}

export function useRequisicao() {
  // ===== Auth/Perms =====
  const decodedRef = useRef(null)
  if (!decodedRef.current && typeof window !== "undefined") {
    const t = localStorage.getItem("token")
    decodedRef.current = t ? parseJwtSafe(t) : {}
  }
  const decoded = decodedRef.current || {}

  const currentUser = {
    id: decoded.id ?? decoded.user_id ?? decoded.userId ?? null,
    nome: decoded.nome ?? decoded.name ?? null,
    email: decoded.email ?? null,
  }

  const permissoes = Array.isArray(decoded.permissoes) ? decoded.permissoes : []
  const canViewUsers = permissoes.some(p => p.modulo === "utilizador" && p.acao === "visualizar")

  const templates = Array.isArray(decoded.templates) ? decoded.templates : []
  const allowedCategoryIds = templates
    .filter(t => t.template_code === "manage_category" && t.resource_id != null)
    .map(t => Number(t.resource_id))
    .filter(Boolean)
  const hasGlobalManageCategory = templates.some(t => t.template_code === "manage_category" && (t.resource_id == null))
  const hasManageCategory = hasGlobalManageCategory || allowedCategoryIds.length > 0

  // ===== Estados =====
  const [requisicoes, setRequisicoes] = useState([])
  const [materiais, setMateriais] = useState([])
  const [tipos, setTipos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [decisoes, setDecisoes] = useState([])

  const [filterStatus, setFilterStatus] = useState("Todos")
  const [filterMaterial, setFilterMaterial] = useState("Todos")
  const [expanded, setExpanded] = useState({})
  const [showForm, setShowForm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // ===== Estado ÚNICO de Modal (sem alerts/prompts) =====
  // kind: 'decisao' | 'atender' | 'devolver' | 'delete'
  const [uiModal, setUiModal] = useState({ open: false, kind: null, payload: null })
  const closeModal = () => setUiModal({ open: false, kind: null, payload: null })

  // ===== Form (criação) =====
  const [formNeededAt, setFormNeededAt] = useState("")
  const [formLocalEntrega, setFormLocalEntrega] = useState("")
  const [formJustificativa, setFormJustificativa] = useState("")
  const [formObservacoes, setFormObservacoes] = useState("")
  const [itemMaterial, setItemMaterial] = useState("")
  const [itemQuantidade, setItemQuantidade] = useState(1)
  const [itemDescricao, setItemDescricao] = useState("")
  const [itens, setItens] = useState([])

  // ===== Helpers =====
  const tipoById = (id) => tipos.find(t => Number(t.tipo_id) === Number(id))
  const materialById = (id) => materiais.find(m => Number(m.mat_id) === Number(id))
  const materialNome = (id) => materialById(id)?.mat_nome ?? `#${id}`
  const categoriaIdDoMaterial = (mat) => {
    if (!mat) return null
    const fkTipo = Number(mat.mat_fk_tipo ?? mat.tipo_id ?? 0)
    const t = tipoById(fkTipo)
    return t ? Number(t.tipo_fk_categoria) : null
  }
  const canOperateReq = (req) => {
    if (hasGlobalManageCategory) return true
    if (!allowedCategoryIds.length) return false
    const items = Array.isArray(req.itens) ? req.itens : []
    if (!items.length) return false
    for (const it of items) {
      const matId = Number(it.rqi_fk_material ?? it.mat_id ?? 0)
      const mat = materialById(matId)
      if (!mat) return false
      const catId = categoriaIdDoMaterial(mat)
      if (!catId || !allowedCategoryIds.includes(Number(catId))) return false
    }
    return true
  }
  const canDecideReq = (req) => canOperateReq(req)

  const aprovadorPorReq = useMemo(() => {
    const map = new Map()
    for (const d of decisoes) {
      if (d.dec_tipo === "Aprovar" && d.dec_fk_requisicao != null) {
        map.set(Number(d.dec_fk_requisicao), Number(d.dec_fk_user))
      }
    }
    return map
  }, [decisoes])

  const isAprovadorDaRequisicao = (req) => {
    const aprovador = aprovadorPorReq.get(Number(req.req_id))
    return aprovador != null && Number(aprovador) === Number(currentUser.id)
  }

  // ===== Fetch =====
  const refetchRequisicoes = async () => {
    const rr = await api.get("/requisicoes", { params: { includeItems: true, includeDecisions: true } })
    const list = normalizeList(rr).map(r => {
      const rr2 = r && r.toJSON ? r.toJSON() : (r?.dataValues ? r.dataValues : r)
      const items = Array.isArray(rr2.itens) ? rr2.itens.map(it => (it?.toJSON ? it.toJSON() : (it?.dataValues ?? it))) : []
      const decs  = Array.isArray(rr2.decisoes) ? rr2.decisoes.map(d => (d?.toJSON ? d.toJSON() : (d?.dataValues ?? d))) : []
      return { ...rr2, itens: items, decisoes: decs }
    })
    setRequisicoes(list)
    setDecisoes(list.flatMap(r => r.decisoes || []))
    return list
  }

  useEffect(() => {
    let mounted = true
    const fetchAll = async () => {
      if (currentUser.id == null) return
      setLoading(true); setError(null)
      try {
        const reqP = api.get("/requisicoes", { params: { includeItems: true, includeDecisions: true } })
        const matP = api.get("/materiais")
        const tipoP = api.get("/tipos")
        const userP = canViewUsers ? api.get("/users") : null
        const [reqRes, matRes, tipoRes, usersRes] = await Promise.all([reqP, matP, tipoP, userP])

        const rawReqs = normalizeList(reqRes)
        const reqs = rawReqs.map(r => {
          const rr = r && r.toJSON ? r.toJSON() : (r?.dataValues ? r.dataValues : r)
          const items = Array.isArray(rr.itens) ? rr.itens.map(it => (it?.toJSON ? it.toJSON() : (it?.dataValues ?? it))) : []
          const decs  = Array.isArray(rr.decisoes) ? rr.decisoes.map(d => (d?.toJSON ? d.toJSON() : (d?.dataValues ?? d))) : []
          return { ...rr, itens: items, decisoes: decs }
        })
        const mats = Array.isArray(matRes?.data) ? matRes.data : (matRes?.data?.data || [])
        const tps  = Array.isArray(tipoRes?.data) ? tipoRes.data : (tipoRes?.data?.data || [])

        if (!mounted) return
        setRequisicoes(reqs)
        setMateriais(mats)
        setTipos(tps)
        setDecisoes(reqs.flatMap(r => r.decisoes || []))
        setUsuarios(canViewUsers ? (Array.isArray(usersRes?.data) ? usersRes.data : (usersRes?.data?.data || [])) : [])
      } catch (err) {
        if (err?.response?.status === 403 || err?.response?.status === 401) {
          if (mounted) setUsuarios([])
        } else {
          console.error("fetchAll error:", err)
          if (mounted) setError(err?.response?.data?.message || err.message || "Erro ao carregar dados")
        }
      } finally { if (mounted) setLoading(false) }
    }
    fetchAll()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===== Form: add/remove/submit =====
  const addItem = () => {
    const q = Number(itemQuantidade)
    if (!itemMaterial) { setError("Selecione um material."); return }
    if (!Number.isFinite(q) || q <= 0) { setError("Informe uma quantidade válida (>0)."); return }
    setItens(l => [...l, {
      rqi_fk_material: Number(itemMaterial),
      rqi_quantidade: q,
      rqi_descricao: itemDescricao.trim() || null
    }])
    setItemMaterial(""); setItemQuantidade(1); setItemDescricao(""); setError(null)
  }
  const removeItem = (idx) => setItens(l => l.filter((_, i) => i !== idx))

  const submitRequisicao = async (e) => {
    e.preventDefault()
    if (!itens.length) { setError("Adicione pelo menos um item."); return }
    try {
      setSubmitting(true); setError(null)
      await api.post("/requisicoes", {
        req_fk_user: currentUser.id,
        req_needed_at: formNeededAt || null,
        req_local_entrega: formLocalEntrega.trim() || null,
        req_justificativa: formJustificativa.trim() || null,
        req_observacoes: formObservacoes.trim() || null,
        itens,
      })
      setFormNeededAt(""); setFormLocalEntrega(""); setFormJustificativa(""); setFormObservacoes("")
      setItens([]); setShowForm(false)
      await refetchRequisicoes()
    } catch (err) {
      console.error("create error:", err)
      setError(err?.response?.data?.message || err.message || "Erro ao criar requisição")
    } finally { setSubmitting(false) }
  }

  // ====== Aberturas de modal (substituem prompts/confirms) ======
  const openDecision = (req, tipo) => {
    if (!req) return
    if (!canDecideReq(req)) { setError("Sem permissão para decidir esta requisição."); return }
    setUiModal({ open: true, kind: "decisao", payload: { reqId: req.req_id, tipo } })
  }

  const openAtender = (req, item) => {
    if (!canOperateReq(req)) { setError("Sem permissão para atender esta requisição."); return }
    const restante = Number(item.rqi_quantidade || 0) - Number(item.rqi_qtd_atendida || 0)
    setUiModal({ open: true, kind: "atender", payload: { reqId: req.req_id, itemId: item.rqi_id, restante } })
  }

  const openDevolver = (req, item) => {
    const emUso = Number(item.rqi_qtd_atendida || 0) - Number(item.rqi_qtd_devolvida || 0)
    if (emUso <= 0) { setError("Nada a devolver."); return }
    if (!isAprovadorDaRequisicao(req)) { setError("Apenas o aprovador pode aprovar a devolução."); return }
    setUiModal({ open: true, kind: "devolver", payload: { reqId: req.req_id, itemId: item.rqi_id, emUso } })
  }

  const openDelete = (reqId) => {
    setUiModal({ open: true, kind: "delete", payload: { reqId } })
  }

  // ====== Confirmações vindas do modal ======
  const confirmDecision = async ({ motivo = "" }) => {
    const { reqId, tipo } = uiModal.payload || {}
    if (!reqId || !tipo) return
    try {
      setLoading(true)
      await api.post(`/requisicoes/${reqId}/decidir`, { tipo, motivo: motivo?.trim() || null })
      await refetchRequisicoes()
      closeModal()
    } catch (err) {
      console.error("decidir error:", err)
      setError(err?.response?.data?.message || err.message || "Erro ao registrar decisão")
    } finally { setLoading(false) }
  }

  const confirmAtender = async ({ quantidade }) => {
    const { reqId, itemId, restante } = uiModal.payload || {}
    const q = Number(quantidade)
    if (!reqId || !itemId) return
    if (!Number.isFinite(q) || q <= 0 || q > Number(restante)) { setError("Quantidade inválida."); return }
    try {
      setLoading(true)
      await api.post(`/requisicoes/${reqId}/atender`, { itens: [{ rqi_id: itemId, quantidade: q }] })
      await refetchRequisicoes()
      setExpanded(ex => ({ ...ex, [reqId]: true }))
      closeModal()
    } catch (err) {
      console.error("atender error:", err)
      setError(err?.response?.data?.message || err.message || "Erro ao atender item")
    } finally { setLoading(false) }
  }

  const confirmDevolver = async ({ quantidade, condicao = "Boa", obs = "" }) => {
    const { reqId, itemId, emUso } = uiModal.payload || {}
    const q = Number(quantidade)
    if (!reqId || !itemId) return
    if (!Number.isFinite(q) || q <= 0 || q > Number(emUso)) { setError("Quantidade inválida."); return }
    const condOk = ["Boa", "Danificada", "Perdida"].includes(condicao)
    try {
      setLoading(true)
      await api.post(`/requisicoes/${reqId}/devolver`, {
        itens: [{ rqi_id: itemId, quantidade: q, condicao: condOk ? condicao : undefined, obs: obs?.trim() || undefined }]
      })
      await refetchRequisicoes()
      setExpanded(ex => ({ ...ex, [reqId]: true }))
      closeModal()
    } catch (err) {
      console.error("devolver error:", err)
      setError(err?.response?.data?.message || err.message || "Erro ao devolver item")
    } finally { setLoading(false) }
  }

  const confirmDelete = async () => {
    const { reqId } = uiModal.payload || {}
    if (!reqId) return
    try {
      setLoading(true)
      await api.delete(`/requisicoes/${reqId}`)
      await refetchRequisicoes()
      closeModal()
    } catch (err) {
      console.error("delete error:", err)
      setError(err?.response?.data?.message || err.message || "Erro ao excluir")
    } finally { setLoading(false) }
  }

  // ===== Lista base / filtros =====
  const baseList = useMemo(() => {
    return requisicoes.filter(r => {
      const fk = r.req_fk_user ?? r.user_id ?? null
      if (hasManageCategory) return true
      return fk ? Number(fk) === Number(currentUser.id) : true
    })
  }, [requisicoes, hasManageCategory, currentUser.id])

  const filtered = useMemo(() => {
    return baseList.filter(r => {
      const okStatus = filterStatus === "Todos" || r.req_status === filterStatus
      const okMaterial =
        filterMaterial === "Todos"
          ? true
          : Array.isArray(r.itens) && r.itens.some(it => Number(it.rqi_fk_material) === Number(filterMaterial))
      return okStatus && okMaterial
    })
  }, [baseList, filterStatus, filterMaterial])

  return {
    // identidade/perms
    currentUser, canViewUsers, allowedCategoryIds, hasGlobalManageCategory, hasManageCategory,
    // dados
    requisicoes, materiais, tipos, usuarios, filtered, decisoes,
    // ui
    loading, submitting, error, setError,
    showForm, setShowForm,
    expanded, setExpanded,
    // filtros
    filterStatus, setFilterStatus,
    filterMaterial, setFilterMaterial,
    // form (modal de criação)
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
    // MODAL STATE + AÇÕES (sem alerts/prompts)
    uiModal, closeModal,
    openDecision, confirmDecision,
    openAtender,  confirmAtender,
    openDevolver, confirmDevolver,
    openDelete,   confirmDelete,
    // regras
    canOperateReq, canDecideReq, isAprovadorDaRequisicao,
  }
}
