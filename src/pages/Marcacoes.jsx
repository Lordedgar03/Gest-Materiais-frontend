"use client";

import React from "react";
import { 
  CalendarCheck2, Search, Loader2, Plus, X, Users, 
  CheckCircle, Clock, AlertCircle, Filter, Calendar,
  Trash2, Edit3, DollarSign, CalendarDays
} from "lucide-react";
import { Formik, Form, Field } from "formik";
import useMarcacao from "../hooks/useMarcacao";

export default function Marcacoes() {
  const {
    date, setDate, list, loading, load, marcar, atualizar, searchAlunos,
    toast, setToast, selectedAluno, setSelectedAluno,
    multiDates, addDate, removeDate
  } = useMarcacao();

  const [query, setQuery] = React.useState("");
  const [sug, setSug] = React.useState([]);
  const [tempDate, setTempDate] = React.useState(date);
  const [statusFilter, setStatusFilter] = React.useState("all");

  React.useEffect(() => { load({ data: date }); }, [load, date]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const q = query.trim();
      if (!q) { setSug([]); return; }
      const s = await searchAlunos({ query: q });
      if (active) setSug(s.slice(0, 8));
    })();
    return () => { active = false };
  }, [query, searchAlunos]);

  const filteredList = React.useMemo(() => {
    if (statusFilter === "all") return list;
    return list.filter(item => 
      (item.alm_statusot || item.ala_status || "").toLowerCase() === statusFilter.toLowerCase()
    );
  }, [list, statusFilter]);

  const getStatusIcon = (status) => {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case 'pago':
        return <CheckCircle size={14} className="text-green-600" />;
      case 'não pago':
        return <Clock size={14} className="text-amber-600" />;
      default:
        return <AlertCircle size={14} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case 'pago':
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case 'não pago':
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-6 space-y-6 bg-gradient-to-br from-orange-50/50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="rounded-2xl p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white grid place-items-center shadow-lg">
              <CalendarCheck2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Gestão de Marcações
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Pesquise alunos e marque almoços para uma ou várias datas
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3">
              <div className="text-sm text-orange-700 dark:text-orange-300 font-medium">Data Selecionada</div>
              <div className="text-lg font-bold text-orange-900 dark:text-orange-100 flex items-center gap-2">
                <CalendarDays size={18} />
                {new Date(date).toLocaleDateString('pt-PT')}
              </div>
            </div>
            <label className="flex flex-col">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alterar Data</span>
              <input
                value={date}
                onChange={(e) => { 
                  const v = e.target.value; 
                  setDate(v); 
                  load({ data: v }); 
                }}
                type="date"
                className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              />
            </label>
          </div>
        </div>
      </header>

      {/* Nova Marcação */}
      <section className="rounded-2xl p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Plus className="text-orange-600" size={24} />
          Nova Marcação
        </h2>

        <Formik
          initialValues={{ alunoInput: "", status: "" }}
          onSubmit={async (v, { resetForm }) => {
            const aluno = selectedAluno?.alu_num_processo ?? v.alunoInput;
            const datas = multiDates.length ? multiDates : [];
            await marcar({ aluno, data: date, status: v.status || undefined, datas });
            resetForm();
            setQuery("");
            setSug([]);
            setSelectedAluno(null);
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="space-y-6">
              {/* Busca de Aluno */}
              <div className="grid md:grid-cols-[minmax(300px,1fr)_200px] gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pesquisar Aluno
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Field
                      name="alunoInput"
                      placeholder="Nome ou número de processo..."
                      value={values.alunoInput}
                      onChange={(e) => { 
                        setFieldValue("alunoInput", e.target.value); 
                        setSelectedAluno(null); 
                        setQuery(e.target.value); 
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  
                  {/* Sugestões */}
                  {sug.length > 0 && values.alunoInput && (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg max-h-64 overflow-auto">
                      {sug.map((a) => (
                        <button
                          type="button"
                          key={`${a.alu_id}-${a.alu_num_processo}`}
                          className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-0 transition-colors"
                          onClick={() => {
                            setFieldValue("alunoInput", String(a.alu_num_processo || a.alu_nome));
                            setSelectedAluno(a);
                            setQuery("");
                            setSug([]);
                          }}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{a.alu_nome}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-4">
                            <span>Processo: <strong>{a.alu_num_processo}</strong></span>
                            <span>Número: <strong>{a.alu_numero ?? "-"}</strong></span>
                            <span>Turma: <strong>{a.alu_turma ?? "-"}</strong></span>
                            <span>Ano: <strong>{a.alu_ano ?? "-"}</strong></span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status do Pagamento
                  </label>
                  <Field 
                    as="select" 
                    name="status" 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Status padrão</option>
                    <option value="pago">Pago</option>
                    <option value="não pago">Não pago</option>
                  </Field>
                </div>
              </div>

              {/* Cartão do Aluno Selecionado */}
              {selectedAluno && (
                <div className="rounded-2xl border border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users size={20} className="text-orange-600" />
                      Aluno Selecionado
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAluno(null);
                        setFieldValue("alunoInput", "");
                      }}
                      className="p-2 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                    >
                      <X size={16} className="text-orange-600" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                    <Info label="Nome Completo" value={selectedAluno.alu_nome} />
                    <Info label="Nº Processo" value={selectedAluno.alu_num_processo} />
                    <Info label="Número" value={selectedAluno.alu_numero} />
                    <Info label="Ano Letivo" value={selectedAluno.alu_ano} />
                    <Info label="Turma" value={selectedAluno.alu_turma} />
                  </div>
                </div>
              )}

              {/* Gestão de Múltiplas Datas */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="text-orange-600" size={20} />
                  Marcação em Múltiplas Datas
                </h4>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Adicionar Data
                    </label>
                    <input 
                      type="date" 
                      value={tempDate} 
                      onChange={(e) => setTempDate(e.target.value)} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => addDate(tempDate)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                    >
                      <Plus size={16} />
                      Adicionar Data
                    </button>
                    {multiDates.length > 0 && (
                      <button 
                        type="button" 
                        onClick={() => multiDates.forEach(d => removeDate(d))}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Trash2 size={16} />
                        Limpar Todas
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de Datas Adicionadas */}
                {multiDates.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Datas Selecionadas ({multiDates.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {multiDates.map(d => (
                        <span 
                          key={d} 
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-sm"
                        >
                          <Calendar size={14} />
                          {new Date(d).toLocaleDateString('pt-PT')}
                          <button 
                            type="button" 
                            onClick={() => removeDate(d)} 
                            className="ml-1 p-0.5 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  {multiDates.length > 0 
                    ? `Serão marcados almoços para ${multiDates.length} data(s) selecionada(s).`
                    : `Será marcado um almoço para a data principal: ${new Date(date).toLocaleDateString('pt-PT')}`
                  }
                </p>
              </div>

              {/* Botão de Submissão */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!values.alunoInput || isSubmitting}
                  className="inline-flex items-center gap-3 px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-medium shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <CalendarCheck2 size={20} />
                  )}
                  {isSubmitting 
                    ? "A processar..." 
                    : multiDates.length > 0 
                      ? `Marcar ${multiDates.length} Data(s)` 
                      : "Marcar Almoço"
                  }
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </section>

      {/* Lista de Marcações do Dia */}
      <section className="rounded-2xl p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <CalendarCheck2 className="text-orange-600" size={24} />
            Marcações para {new Date(date).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          
          {/* Filtros */}
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-gray-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="pago">Pago</option>
              <option value="não pago">Não pago</option>
            </select>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredList.length} de {list.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
              <Loader2 size={24} className="animate-spin" />
              <span>A carregar marcações...</span>
            </div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-gray-500 dark:text-gray-400 space-y-3">
              <CalendarCheck2 size={48} className="mx-auto opacity-50" />
              <p className="font-medium">Nenhuma marcação encontrada</p>
              <p className="text-sm">
                {statusFilter === "all" 
                  ? "Não existem marcações para esta data." 
                  : `Não existem marcações com status "${statusFilter}" para esta data.`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr className="text-gray-700 dark:text-gray-300 text-left">
                    <Th>Aluno</Th>
                    <Th>Nº Processo</Th>
                    <Th>Turma</Th>
                    <Th>Ano</Th>
                    <Th>Status</Th>
                    <Th>Ações</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredList.map((m, i) => (
                    <tr 
                      key={m.ala_id ?? i} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <Td className="font-medium text-gray-900 dark:text-white">
                        {m.alu_nome}
                      </Td>
                      <Td className="text-gray-600 dark:text-gray-400">
                        {m.alu_num_processo ?? "-"}
                      </Td>
                      <Td>
                        {m.alu_turma ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {m.alu_turma}
                          </span>
                        ) : (
                          "-"
                        )}
                      </Td>
                      <Td className="text-gray-600 dark:text-gray-400">
                        {m.alu_ano ?? "-"}
                      </Td>
                      <Td>
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border capitalize ${getStatusColor(m.alm_statusot || m.ala_status)}`}>
                          {getStatusIcon(m.alm_statusot || m.ala_status)}
                          {m.alm_statusot || m.ala_status || "pendente"}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => atualizar(m.ala_id, { alm_statusot: "pago" })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs transition-colors"
                            title="Marcar como pago"
                          >
                            <DollarSign size={12} />
                            Pago
                          </button>
                          <button 
                            onClick={() => atualizar(m.ala_id, { alm_statusot: "não pago" })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs transition-colors"
                            title="Marcar como não pago"
                          >
                            <Clock size={12} />
                            Não Pago
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Toast Notification */}
      {toast && (
        <div 
          role="status" 
          className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-lg border border-gray-700 animate-slide-in-right"
        >
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400" />
            <span>{toast}</span>
            <button 
              className="ml-4 p-1 rounded-lg hover:bg-gray-800 transition-colors" 
              onClick={() => setToast("")}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// Componentes auxiliares
function Th({ children }) { 
  return (
    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">
      {children}
    </th>
  ); 
}

function Td({ children, className = "" }) { 
  return (
    <td className={`px-6 py-4 ${className}`}>
      {children}
    </td>
  ); 
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-white">
        {value ?? "-"}
      </div>
    </div>
  );
}