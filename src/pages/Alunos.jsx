// src/pages/AlunosPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserRound,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Pencil,
  Trash2,
  FilterX,
  Shield,
  Info,
} from "lucide-react";
import { useAlunos } from "../hooks/useAlunos";

/* ---------- Generic Modal ---------- */
function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidth = "max-w-lg",
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={`w-full ${maxWidth} rounded-xl bg-white shadow-xl border border-slate-200`}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
          <div className="p-4">{children}</div>
          {footer && (
            <div className="p-4 border-t border-slate-200">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Form Modal (Criar / Editar aluno) ---------- */
function StudentFormModal({
  open,
  mode,
  formData,
  setFormData,
  onSubmit,
  onClose,
  saving,
}) {
  const isCreate = mode === "create";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          {isCreate ? (
            <>
              <Plus className="h-5 w-5 text-violet-600" />
              Novo aluno
            </>
          ) : (
            <>
              <Pencil className="h-5 w-5 text-indigo-600" />
              Editar aluno
            </>
          )}
        </span>
      }
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-md border text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="student-form"
            disabled={saving}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white ${
              isCreate
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            } disabled:opacity-50`}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isCreate ? (
              <Plus className="h-4 w-4" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            {isCreate ? "Adicionar" : "Guardar"}
          </button>
        </div>
      }
    >
      <form id="student-form" onSubmit={onSubmit} className="space-y-3 text-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nome *
          </label>
          <input
            type="text"
            name="nome"
            placeholder="Nome completo do aluno"
            value={formData.nome}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Número
          </label>
          <input
            type="text"
            name="numero"
            placeholder="Número de aluno"
            value={formData.numero}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Turma
          </label>
          <input
            type="text"
            name="turma"
            placeholder="Ex.: 7ºA, 8ºB…"
            value={formData.turma}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <p className="text-[11px] text-slate-500 pt-1">
          Os dados podem ser alterados posteriormente — não precisas de
          preencher tudo de uma vez.
        </p>
      </form>
    </Modal>
  );
}

/* ---------- Delete Modal ---------- */
function DeleteStudentModal({ open, student, onClose, onConfirm, deleting }) {
  if (!open || !student) return null;

  const nome = student.nome ?? student.alu_nome ?? "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-md"
      title={
        <span className="inline-flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-rose-600" />
          Eliminar aluno
        </span>
      }
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-md border text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded-md text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Eliminar"
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-3 text-sm">
        <p className="text-slate-700">
          Tens a certeza que queres eliminar o aluno{" "}
          <strong>{nome || "sem nome"}</strong>?
        </p>
        <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 mt-[2px]" />
          <p>
            Esta ação não pode ser desfeita. Se o aluno estiver associado a
            outros registos (ex.: marcações de almoço), confirma com a direção
            antes de apagar.
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Página ---------- */
export default function AlunosPage() {
  const {
    filteredStudents,
    loading,
    saving,
    error,
    canView,
    canEdit,
    search,
    setSearch,
    reload,
    createStudent,
    updateStudent,
    deleteStudent,
  } = useAlunos();

  // form state (não mostramos id, só guardamos internamente)
  const [formData, setFormData] = useState({
    id: null,
    nome: "",
    numero: "",
    turma: "",
  });
  const [mode, setMode] = useState("create"); // "create" | "edit"

  // modais
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // paginação local
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sempre que muda a lista ou busca, volta à página 1
  useEffect(() => {
    setPage(1);
  }, [filteredStudents, search]);

  const totalPages = useMemo(() => {
    if (!filteredStudents || filteredStudents.length === 0) return 1;
    return Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  }, [filteredStudents]);

  const paginatedStudents = useMemo(() => {
    if (!filteredStudents || filteredStudents.length === 0) return [];
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page]);

  const resetForm = () => {
    setMode("create");
    setFormData({
      id: null,
      nome: "",
      numero: "",
      turma: "",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setFormModalOpen(true);
  };

  const openEditModal = (student) => {
    setMode("edit");
    setFormData({
      id: student.id ?? student.alu_id ?? null,
      nome: student.nome ?? student.alu_nome ?? "",
      numero: student.numero ?? student.alu_numero ?? "",
      turma: student.turma ?? student.alu_turma ?? "",
    });
    setFormModalOpen(true);
  };

  const closeFormModal = () => {
    setFormModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    const payload = {
      nome: formData.nome,
      numero: formData.numero,
      turma: formData.turma,
    };

    try {
      if (mode === "create") {
        await createStudent(payload);
      } else if (mode === "edit" && formData.id != null) {
        await updateStudent(formData.id, payload);
      }
      closeFormModal();
      reload();
    } catch {
      // erro está em `error`
    }
  };

  const openDeleteConfirm = (student) => {
    if (!canEdit) return;
    setSelectedStudent(student);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedStudent(null);
    setDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedStudent || !canEdit) return;
    const id = selectedStudent.id ?? selectedStudent.alu_id;
    if (!id) return;

    try {
      setDeleting(true);
      await deleteStudent(id);
      closeDeleteModal();
      reload();
    } catch {
      setDeleting(false);
    }
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  if (!canView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-rose-50 p-6 rounded-xl border border-rose-200 flex items-center gap-3">
          <Shield className="h-6 w-6 text-rose-600" />
          <div>
            <h3 className="font-semibold text-rose-800">Acesso negado</h3>
            <p className="text-rose-700 text-sm">
              Não tens permissão para ver a gestão de alunos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalStudents = filteredStudents?.length || 0;

  return (
    <div className=" space-y-3 min-h-screen">
      {/* Header */}
      <div className="rounded-xl p-6 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="text-indigo-600" />
              Gestão de Alunos
            </h1>
            <p className="text-slate-600 mt-1 text-sm">
              Mantém a lista de alunos atualizada para usar noutros módulos
              (almoços, relatórios, etc.).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-sm"
              >
                <Plus className="h-4 w-4" />
                Novo aluno
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-2">
            <UserRound className="text-indigo-600" size={18} />
            <span className="text-indigo-800 text-sm">
              {totalStudents} aluno(s) encontrados
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <Info className="h-4 w-4 mt-[1px]" />
            <p>
              Os identificadores internos do sistema não são mostrados aqui, mas
              são usados para garantir operações seguras no backend.
            </p>
          </div>
        </div>
      </div>

      {/* Barra de pesquisa / ações rápidas */}
      <div className="rounded-xl p-4 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome, número, turma…"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center text-xs">
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm"
            >
              <Loader2 className="h-4 w-4" />
              Recarregar
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm"
              title="Limpar pesquisa"
            >
              <FilterX className="h-4 w-4" />
              Limpar pesquisa
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 mt-[1px]" />
            <div>
              <p className="font-medium">Ocorreu um erro ao carregar alunos.</p>
              <p>{String(error)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        {loading && totalStudents === 0 ? (
          <div className="p-8 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-indigo-600" size={28} />
            <span className="text-slate-600 text-sm">
              A carregar lista de alunos…
            </span>
          </div>
        ) : totalStudents === 0 ? (
          <div className="p-10 text-center">
            <UserRound className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              Nenhum aluno encontrado
            </h3>
            <p className="text-slate-600 text-sm">
              {search
                ? "Tenta ajustar o termo de pesquisa."
                : "Começa por adicionar o primeiro aluno."}
            </p>
          </div>
        ) : (
          <>
            <div className="border-b px-4 py-2 flex items-center justify-between text-xs bg-slate-50">
              <span className="text-slate-600">
                A mostrar alunos {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, totalStudents)} de {totalStudents}
              </span>
              {loading && (
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" />A sincronizar…
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                      Nº
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                      Nome
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                      Número
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                      Turma
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedStudents.map((student, idx) => {
                    const displayIndex = (page - 1) * pageSize + idx + 1; // índice visível (não é ID)
                    const nome = student.nome ?? student.alu_nome ?? "—";
                    const numero = student.numero ?? student.alu_numero ?? "—";
                    const turma = student.turma ?? student.alu_turma ?? "—";

                    return (
                      <tr
                        key={student.id ?? student.alu_id ?? displayIndex}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-2 text-xs text-slate-500">
                          {displayIndex}
                        </td>
                        <td className="px-4 py-2 align-middle">
                          <div className="font-medium text-slate-900">
                            {nome}
                          </div>
                        </td>
                        <td className="px-4 py-2 align-middle text-slate-800">
                          {numero}
                        </td>
                        <td className="px-4 py-2 align-middle text-slate-800">
                          {turma}
                        </td>
                        <td className="px-4 py-2 align-middle">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(student)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              disabled={!canEdit}
                            >
                              <Pencil className="h-3 w-3" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteConfirm(student)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-rose-300 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                              disabled={!canEdit}
                            >
                              <Trash2 className="h-3 w-3" />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-t border-slate-200">
                <p className="text-sm text-slate-700">
                  Página <span className="font-medium">{page}</span> de{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
                <div className="inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    type="button"
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    className="px-2 py-2 border border-slate-300 rounded-l-md bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    title="Anterior"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-2 py-2 border border-slate-300 rounded-r-md bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    title="Próximo"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: Criar / Editar aluno */}
      <StudentFormModal
        open={formModalOpen}
        mode={mode}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onClose={closeFormModal}
        saving={saving}
      />

      {/* MODAL: Eliminar aluno */}
      <DeleteStudentModal
        open={deleteModalOpen}
        student={selectedStudent}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}
