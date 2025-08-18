import React, { Fragment, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useParams } from 'react-router-dom'
import { useUser } from './useUsers'
import { Loader2, Pencil, RefreshCw, Save, ShieldX, Trash2, User as UserIcon, X } from 'lucide-react'

export default function UserPage({ id: idProp }) {
  const params = useParams?.() || {}
  const userId = Number(idProp ?? params.id)
  const { user, loading, saving, error, refresh, update, remove } = useUser(userId)

  const [openForm, setOpenForm] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [form, setForm] = useState(emptyForm())
  React.useEffect(() => { if (user) setForm(fromUser(user)) }, [user])

  const statusPill = useMemo(() => pill(user?.user_status), [user?.user_status])

  function onSubmit(e) {
    e?.preventDefault?.()
    const payload = toPayload(form, showAdvanced)
    update(payload).then(r => { if (r?.ok) setOpenForm(false) })
  }

  async function confirmDelete() {
    const r = await remove(); if (r?.ok) setOpenDelete(false)
  }

  return (
    <div className="relative space-y-6">
      {/* BG */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-400/20 to-violet-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-violet-400/20 to-indigo-400/20 blur-3xl" />

      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white/60 shadow backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_120%_-10%,#a78bfa22,transparent_60%),radial-gradient(80%_60%_at_-10%_120%,#6366f122,transparent_60%)]" />
        <div className="relative p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Utilizador {user ? `#${user.user_id}` : ''}</h1>
                <p className="text-sm text-gray-600">Estado: <span className={statusPill.className}>{statusPill.label}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white/70 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-60">
                <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Atualizar
              </button>
              <button onClick={() => setOpenForm(true)} disabled={!user} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white/70 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-60">
                <Pencil className="h-4 w-4" /> Editar
              </button>
              <button onClick={() => setOpenDelete(true)} disabled={!user} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-rose-600 to-red-600 px-3 py-2 text-sm font-medium text-white shadow disabled:opacity-60">
                <Trash2 className="h-4 w-4" /> Eliminar
              </button>
            </div>
          </div>

          {/* Cards resumo */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Summary title="Nome" value={user?.user_nome || '—'} />
            <Summary title="Email" value={user?.user_email || '—'} />
            <Summary title="Tipo" value={user?.user_tipo || '—'} />
            <Summary title="Roles" value={(user?.roles || []).length} />
          </div>

          {/* Detalhes */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <Field label="ID" value={user?.user_id} />
            <Field label="Status" value={user?.user_status} />
            <Field className="lg:col-span-3" label="Roles">
              {(user?.roles || []).length ? (
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((r, idx) => (
                    <span key={idx} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-700">{String(r)}</span>
                  ))}
                </div>
              ) : <span className="text-gray-500">—</span>}
            </Field>
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 shadow">{String(error)}</div>}

      {/* Modal Editar */}
      <Transition appear show={openForm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOpenForm(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-3xl border border-indigo-100 bg-white/80 shadow-xl backdrop-blur-xl">
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white">
                    <Dialog.Title className="text-base font-semibold">Editar utilizador</Dialog.Title>
                    <Dialog.Description className="text-xs text-white/80">Atualize os campos e guarde as alterações</Dialog.Description>
                  </div>

                  <form onSubmit={onSubmit} className="grid gap-3 p-6 text-sm sm:grid-cols-2">
                    <Field label="Nome">
                      <input required className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={form.user_nome} onChange={e => setForm(p => ({...p, user_nome: e.target.value}))} />
                    </Field>
                    <Field label="Email">
                      <input required type="email" className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={form.user_email} onChange={e => setForm(p => ({...p, user_email: e.target.value}))} />
                    </Field>
                    <Field label="Nova senha (opcional)">
                      <input type="password" className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={form.user_senha} onChange={e => setForm(p => ({...p, user_senha: e.target.value}))} placeholder="Deixe vazio para não alterar" />
                    </Field>
                    <Field label="Status">
                      <select className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={form.user_status} onChange={e => setForm(p => ({...p, user_status: e.target.value}))}>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </Field>

                    <div className="sm:col-span-2 mt-2">
                      <button type="button" onClick={() => setShowAdvanced(v => !v)} className="text-indigo-700 text-xs inline-flex items-center gap-2">
                        <ShieldX className="h-4 w-4" /> {showAdvanced ? 'Ocultar avançado' : 'Mostrar avançado (roles/templates)'}
                      </button>
                    </div>

                    {showAdvanced && (
                      <>
                        <Field className="sm:col-span-2" label="Roles (separadas por vírgula)">
                          <input className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={form.rolesCsv} onChange={e => setForm(p => ({...p, rolesCsv: e.target.value}))} placeholder="ex: admin, gestor, operador" />
                        </Field>
                        <TemplatesEditor value={form.templates} onChange={(list) => setForm(p => ({...p, templates: list}))} />
                      </>
                    )}

                    <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setOpenForm(false)} className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 px-4 py-2 text-sm hover:bg-indigo-50"><X className="h-4 w-4" /> Cancelar</button>
                      <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow disabled:opacity-60"><Save className="h-4 w-4" /> Guardar</button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal Eliminar */}
      <Transition appear show={openDelete} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOpenDelete(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-3xl border border-rose-200 bg-white/80 shadow-xl backdrop-blur-xl">
                  <div className="bg-gradient-to-r from-rose-600 to-red-600 px-6 py-4 text-white">
                    <Dialog.Title className="text-base font-semibold">Eliminar utilizador</Dialog.Title>
                    <Dialog.Description className="text-xs text-white/80">Esta ação é permanente. Continuar?</Dialog.Description>
                  </div>
                  <div className="grid gap-3 p-6 text-sm">
                    <p>Tem a certeza que pretende eliminar <span className="font-medium">{user?.user_nome}</span> ({user?.user_email})?</p>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button onClick={() => setOpenDelete(false)} className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm hover:bg-rose-50"><X className="h-4 w-4" /> Cancelar</button>
                      <button onClick={confirmDelete} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-rose-600 to-red-600 px-4 py-2 text-sm font-medium text-white shadow disabled:opacity-60"><Trash2 className="h-4 w-4" /> Eliminar</button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Loading inicial */}
      {loading && !user && (
        <div className="rounded-2xl border border-indigo-100 bg-white/70 p-5 text-sm text-indigo-700 shadow inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> A carregar…</div>
      )}
    </div>
  )
}

// =============== helpers UI ===============
function Summary({ title, value }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white/70 p-4 shadow-sm">
      <div className="text-xs font-medium text-indigo-700">{title}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900">{String(value ?? '—')}</div>
    </div>
  )
}

function Field({ label, value, children, className = '' }) {
  return (
    <div className={className}>
      <div className="text-[11px] font-medium text-indigo-700">{label}</div>
      {children ? (
        <div className="mt-1">{children}</div>
      ) : (
        <div className="mt-1 rounded-2xl border border-indigo-200 bg-white/80 p-3 text-gray-700">{String(value ?? '—')}</div>
      )}
    </div>
  )
}

function pill(status) {
  const base = 'rounded-full px-3 py-1 text-xs font-medium border'
  switch (status) {
    case 'ativo':   return { className: `${base} bg-emerald-50 text-emerald-700 border-emerald-200`, label: 'Ativo' }
    case 'inativo': return { className: `${base} bg-gray-50 text-gray-600 border-gray-200`, label: 'Inativo' }
    default:        return { className: `${base} bg-white text-gray-700 border-gray-200`, label: String(status || '—') }
  }
}

// =============== helpers Form ===============
function emptyForm() { return { user_nome: '', user_email: '', user_senha: '', user_status: 'ativo', rolesCsv: '', templates: [] } }
function fromUser(u) {
  return {
    user_nome: u.user_nome || '',
    user_email: u.user_email || '',
    user_senha: '',
    user_status: u.user_status || 'ativo',
    rolesCsv: Array.isArray(u.roles) ? u.roles.join(', ') : '',
    templates: Array.isArray(u.templates) ? u.templates.map(t => ({ template_code: t.template_code, resource_type: t.resource_type ?? '', resource_id: t.resource_id ?? '' })) : []
  }
}
function toPayload(f, includeAdvanced) {
  const payload = {
    user_nome: String(f.user_nome || ''),
    user_email: String(f.user_email || ''),
    ...(f.user_senha ? { user_senha: String(f.user_senha) } : {}),
    user_status: f.user_status === 'inativo' ? 'inativo' : 'ativo',
  }
  if (includeAdvanced) {
    const roles = f.rolesCsv.split(',').map(s => s.trim()).filter(Boolean)
    if (roles.length) payload.roles = roles
    const templates = (f.templates || []).filter(t => t.template_code).map(t => ({
      template_code: t.template_code,
      resource_type: t.resource_type || null,
      resource_id: t.resource_id === '' ? null : (isNaN(Number(t.resource_id)) ? t.resource_id : Number(t.resource_id))
    }))
    if (templates.length) payload.templates = templates
  }
  return payload
}

function TemplatesEditor({ value = [], onChange }) {
  function add() { onChange([...(value||[]), { template_code: '', resource_type: '', resource_id: '' }]) }
  function set(i, patch) { onChange(value.map((row, idx) => idx === i ? { ...row, ...patch } : row)) }
  function del(i) { onChange(value.filter((_, idx) => idx !== i)) }
  return (
    <div className="sm:col-span-2">
      <div className="text-[11px] font-medium text-indigo-700">Templates</div>
      <div className="mt-1 space-y-2">
        {(value||[]).map((t, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-3">
            <input placeholder="template_code" className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={t.template_code} onChange={e => set(i, { template_code: e.target.value })} />
            <input placeholder="resource_type (opcional)" className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={t.resource_type} onChange={e => set(i, { resource_type: e.target.value })} />
            <div className="flex items-center gap-2">
              <input placeholder="resource_id (opcional)" className="w-full rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2" value={t.resource_id} onChange={e => set(i, { resource_id: e.target.value })} />
              <button type="button" onClick={() => del(i)} className="rounded-2xl border border-rose-200 bg-white/80 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">Remover</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={add} className="rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm hover:bg-indigo-50">+ Adicionar template</button>
      </div>
    </div>
  )
}
