// src/pages/AlmocosPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  UtensilsCrossed,
  Settings2,
  CalendarRange,
  PlusCircle,
  Filter,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Info,
} from "lucide-react";
import { useAlmocos } from "../hooks/useAlmoco";

// Componente genérico para mostrar relatórios de forma legível
function ReportView({ data }) {
  if (!data) return null;

  // Se vier um array
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <p className="text-[14px] text-gray-900">
          Sem registos para este filtro.
        </p>
      );
    }

    // Array de objetos -> tabela simples
    if (typeof data[0] === "object" && data[0] !== null) {
      const keys = Object.keys(data[0]);

      return (
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-56 overflow-auto">
            <table className="min-w-full text-[12px]">
              <thead className="bg-gray-50">
                <tr>
                  {keys.map((k) => (
                    <th
                      key={k}
                      className="px-2 py-1 text-left text-[14px] text-gray-900"
                    >
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="border-t hover:bg-violet-50/40">
                    {keys.map((k) => (
                      <td key={k} className="px-2 py-1 text-gray-900">
                        {formatValue(row[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Array simples (strings, números, etc.)
    return (
      <ul className="list-disc list-inside text-[14px] text-gray-900 space-y-1">
        {data.map((item, idx) => (
          <li key={idx}>{formatValue(item)}</li>
        ))}
      </ul>
    );
  }

  // Objeto simples { totalAlmocos: 10, pago: 123.5, ... }
  if (typeof data === "object") {
    const entries = Object.entries(data);

    return (
      <dl className="grid grid-cols-1 gap-2 text-[14px] text-gray-800">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between border-b border-dashed border-gray-200 pb-1"
          >
            <dt className="text-[13px] text-gray-900">{key}</dt>
            <dd className="font-medium">{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  // Fallback
  return <p className="text-[14px] text-gray-900">{String(data)}</p>;
}

function formatValue(value) {
  if (value == null) return "—";
  if (typeof value === "number") {
    const isInt = Number.isInteger(value);
    return isInt ? value : value.toFixed(2);
  }
  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }
  return String(value);
}

export default function AlmocosPage() {
  const {
    precoPadrao,
    marcacoes,
    relatorioHoje,
    relatorioPorData,
    relatorioIntervalo,
    relatorioMensal,
    totalMarcacoes,
    loading,
    saving,
    error,
    canView,
    canEdit,
    canViewReports,
    reloadPreco,
    updatePrecoPadrao,
    loadMarcacoes,
    marcarAlmoco,
    loadRelatorioHoje,
    loadRelatorioPorData,
    loadRelatorioIntervalo,
    loadRelatorioMensal,
  } = useAlmocos();

  // Abas: config | marcacoes | relatorios
  const [activeTab, setActiveTab] = useState("config");

  // Formulário de preço
  const [novoPreco, setNovoPreco] = useState("");

  // Filtros de marcação
  const [filtroData, setFiltroData] = useState("");

  // Modal de marcação
  const [marcacaoModalOpen, setMarcacaoModalOpen] = useState(false);
  const [marcacaoForm, setMarcacaoForm] = useState({
    aluno_id: "",
    data: "",
    observacao: "",
  });

  // Paginação de marcações
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filtros de relatório
  const [dataRelatorio, setDataRelatorio] = useState("");
  const [intervaloInicio, setIntervaloInicio] = useState("");
  const [intervaloFim, setIntervaloFim] = useState("");
  const [anoMensal, setAnoMensal] = useState("");
  const [mesMensal, setMesMensal] = useState("");

  useEffect(() => {
    if (canView) {
      reloadPreco();
      loadMarcacoes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  useEffect(() => {
    // sempre que mudas filtro ou lista, volta para primeira página
    setPage(1);
  }, [filtroData, marcacoes]);

  const handleUpdatePreco = async (e) => {
    e.preventDefault();
    if (!canEdit || !novoPreco) return;

    const valor = Number(novoPreco.toString().replace(",", "."));
    if (Number.isNaN(valor) || valor <= 0) {
      alert("Preço inválido. Usa um valor numérico maior que zero.");
      return;
    }
    try {
      await updatePrecoPadrao(valor);
      setNovoPreco("");
    } catch {
      // erro já está em `error`
    }
  };

  const handleFiltrarMarcacoes = async (e) => {
    e.preventDefault();
    await loadMarcacoes(filtroData ? { data: filtroData } : {});
  };

  const handleChangeMarcacao = (e) => {
    const { name, value } = e.target;
    setMarcacaoForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCriarMarcacao = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!marcacaoForm.aluno_id || !marcacaoForm.data) {
      alert("Preenche pelo menos o aluno e a data.");
      return;
    }

    try {
      await marcarAlmoco({
        aluno_id: marcacaoForm.aluno_id,
        data: marcacaoForm.data,
        observacao: marcacaoForm.observacao,
      });
      setMarcacaoForm({
        aluno_id: "",
        data: "",
        observacao: "",
      });
      setMarcacaoModalOpen(false);
      loadMarcacoes(filtroData ? { data: filtroData } : {});
    } catch {
      // erro já está em `error`
    }
  };

  const handleRelatorioPorData = async (e) => {
    e.preventDefault();
    if (!dataRelatorio) return;
    await loadRelatorioPorData(dataRelatorio);
  };

  const handleRelatorioIntervalo = async (e) => {
    e.preventDefault();
    if (!intervaloInicio || !intervaloFim) return;
    await loadRelatorioIntervalo(intervaloInicio, intervaloFim);
  };

  const handleRelatorioMensal = async (e) => {
    e.preventDefault();
    if (!anoMensal || !mesMensal) return;
    await loadRelatorioMensal(anoMensal, mesMensal);
  };

  // Paginação
  const paginatedMarcacoes = useMemo(() => {
    if (!Array.isArray(marcacoes) || marcacoes.length === 0) return [];
    const start = (page - 1) * pageSize;
    return marcacoes.slice(start, start + pageSize);
  }, [marcacoes, page]);

  const totalPages = useMemo(() => {
    if (!Array.isArray(marcacoes) || marcacoes.length === 0) return 1;
    return Math.max(1, Math.ceil(marcacoes.length / pageSize));
  }, [marcacoes]);

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  if (!canView) {
    return (
      <div className="p-6 flex items-center gap-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
        <AlertCircle className="h-5 w-5" />
        <div>
          <p className="font-semibold">Não tens acesso ao módulo de almoços.</p>
          <p className="text-xs">
            Se achas que isto é um erro, contacta o administrador do sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho com estado visível */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 bg-violet-600 p-3 rounded-2xl shadow-2xs">
          <div className="h-10 w-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl text-white font-semibold">
              Módulo de Almoços
            </h1>
            <p className="text-xs text-white">
              Gestão de preço, marcações e relatórios de refeições.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {loading ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              <RefreshCw className="h-3 w-3 animate-spin" />A sincronizar dados…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ●<span>Sistema atualizado</span>
            </span>
          )}
        </div>
      </header>

      {error && (
        <div className="border border-red-300 bg-red-50 text-red-700 text-xs px-3 py-2 rounded flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-[1px]" />
          <div>
            <p className="font-semibold">Ocorreu um erro.</p>
            <p>{String(error)}</p>
            <p className="mt-1 text-[14px] text-red-600/80">
              Tenta recarregar a página. Se o problema continuar, regista este
              texto para apoio técnico.
            </p>
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="border-b border-gray-200 flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab("config")}
          className={`inline-flex items-center gap-2 px-3 py-2 border-b-2 text-xs md:text-sm ${
            activeTab === "config"
              ? "border-violet-600 text-violet-700 font-medium"
              : "border-transparent text-gray-900 hover:text-violet-600 hover:border-violet-200"
          }`}
        >
          <Settings2 className="h-4 w-4" />
          <span>Configuração</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("marcacoes")}
          className={`inline-flex items-center gap-2 px-3 py-2 border-b-2 text-xs md:text-sm ${
            activeTab === "marcacoes"
              ? "border-violet-600 text-violet-700 font-medium"
              : "border-transparent text-gray-900 hover:text-violet-600 hover:border-violet-200"
          }`}
        >
          <CalendarRange className="h-4 w-4" />
          <span>Marcações</span>
          <span className="ml-1 rounded-full bg-gray-100 text-[10px] px-1.5 py-[1px] text-gray-900">
            {totalMarcacoes}
          </span>
        </button>
        {canViewReports && (
          <button
            type="button"
            onClick={() => setActiveTab("relatorios")}
            className={`inline-flex items-center gap-2 px-3 py-2 border-b-2 text-xs md:text-sm ${
              activeTab === "relatorios"
                ? "border-violet-600 text-violet-700 font-medium"
                : "border-transparent text-gray-900 hover:text-violet-600 hover:border-violet-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Relatórios</span>
          </button>
        )}
      </div>

      {/* ABA: Configuração */}
      {activeTab === "config" && (
        <section className="border rounded-xl p-4 md:p-5 space-y-4 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-violet-600" />
                Configuração de preço
              </h2>
              <p className="text-[14px] text-gray-900 mt-1">
                Define o preço padrão aplicado aos almoços. Alterações futuras
                não afetam registos antigos.
              </p>
            </div>
            <button
              type="button"
              onClick={reloadPreco}
              className="inline-flex items-center gap-1 border rounded-full px-3 py-1 text-[12px] hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700"
            >
              <RefreshCw className="h-3 w-3" />
              Recarregar
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <span className="text-gray-900">Preço padrão atual: </span>
              <span className="font-semibold text-violet-700">
                {precoPadrao != null
                  ? `${Number(precoPadrao).toFixed(2)} STN`
                  : "— não definido"}
              </span>
            </div>
          </div>

          {canEdit ? (
            <form
              onSubmit={handleUpdatePreco}
              className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium">Novo preço</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-300"
                  placeholder="Ex.: 25.00"
                  value={novoPreco}
                  onChange={(e) => setNovoPreco(e.target.value)}
                />
               
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs md:text-sm rounded-lg border border-violet-600 bg-violet-600 text-white hover:bg-violet-700 hover:border-violet-700 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "A guardar…" : "Guardar novo preço"}
              </button>
            </form>
          ) : (
            <div className="mt-2 flex items-start gap-2 text-xs text-gray-900">
              <Info className="h-4 w-4 mt-[2px]" />
              <p>Não tens permissão para alterar o preço de almoços.</p>
            </div>
          )}
        </section>
      )}

      {/* ABA: Marcações */}
      {activeTab === "marcacoes" && (
        <section className="space-y-4">
          {/* Barra de filtros e ações */}
          <div className="border rounded-xl p-3 md:p-4 bg-white shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-violet-600" />
                Marcações de almoço
              </h2>
              <p className="text-[14px] text-gray-900">
                Consulta e regista refeições marcadas por data. Usa os filtros
                para localizar rapidamente.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center text-xs">
              <form
                onSubmit={handleFiltrarMarcacoes}
                className="flex items-center gap-2"
              >
                <label className="flex items-center gap-2">
                  <Filter className="h-3 w-3 text-gray-900" />
                  <span className="text-[14px] text-gray-900">Dia:</span>
                  <input
                    type="date"
                    className="border rounded-lg px-2 py-1 text-[14px] focus:outline-none focus:ring-2 focus:ring-violet-200"
                    value={filtroData}
                    onChange={(e) => setFiltroData(e.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[12px] hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700"
                >
                  Aplicar
                </button>
              </form>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setMarcacaoModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-violet-600 bg-violet-600 text-white text-[12px] hover:bg-violet-700 hover:border-violet-700"
                >
                  <PlusCircle className="h-3 w-3" />
                  Nova marcação
                </button>
              )}
            </div>
          </div>

          {/* Lista + paginação */}
          <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="border-b px-3 py-2 flex items-center justify-between text-xs">
              <span className="text-gray-900">
                {totalMarcacoes} marcação(ões) registadas
              </span>
              <span className="text-[14px] text-gray-400">
                Página {page} de {totalPages}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr className="text-left text-[14px] text-gray-900">
                    <th className="px-3 py-2">Aluno</th>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {(!paginatedMarcacoes || paginatedMarcacoes.length === 0) && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-4 text-center text-gray-900 text-xs"
                      >
                        Nenhuma marcação encontrada para o filtro atual.
                      </td>
                    </tr>
                  )}

                  {paginatedMarcacoes.map((m, idx) => {
                    const nomeAluno =
                      m.aluno_nome ||
                      m.aluno?.nome ||
                      m.aluno?.alu_nome ||
                      m.nome_aluno ||
                      "";

                    const data = m.data || m.data_refeicao || m.dia || "";

                    return (
                      <tr
                        key={m.id ?? m.mar_id ?? idx}
                        className="border-t hover:bg-violet-50/40"
                      >
                        <td className="px-3 py-2">{nomeAluno || "—"}</td>
                        <td className="px-3 py-2">
                          {data ? new Date(data).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          {m.observacao || m.obs || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="border-t px-3 py-2 flex items-center justify-between text-[14px] text-gray-900">
              <span>
                A mostrar {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, marcacoes?.length || 0)} de{" "}
                {marcacoes?.length || 0}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="inline-flex items-center justify-center h-7 w-7 rounded border text-gray-900 disabled:opacity-40 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="inline-flex items-center justify-center h-7 w-7 rounded border text-gray-900 disabled:opacity-40 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="text-[14px] text-gray-900 flex items-start gap-2">
            <Info className="h-3 w-3 mt-[2px]" />
            <p>
              Dica: filtra por data para reduzir a lista e encontrar rapidamente
              marcações específicas.
            </p>
          </div>
        </section>
      )}

      {/* ABA: Relatórios */}
      {activeTab === "relatorios" && canViewReports && (
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-600" />
                Relatórios de almoços
              </h2>
              <p className="text-[14px] text-gray-900 mt-1">
                Gera resumos diários, por data, intervalo e mês para apoiar
                controlo e tomada de decisão.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Hoje */}
            <div className="border rounded-xl p-3 bg-white shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-2">
                  <CalendarRange className="h-3 w-3 text-violet-600" />
                  Hoje
                </span>
                <button
                  type="button"
                  onClick={loadRelatorioHoje}
                  className="inline-flex items-center gap-1 border rounded-full px-3 py-1 text-[14px] hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700"
                >
                  Carregar
                </button>
              </div>
              {relatorioHoje && <ReportView data={relatorioHoje} />}
              {!relatorioHoje && (
                <p className="text-[14px] text-gray-900">
                  Ainda não carregaste o relatório de hoje.
                </p>
              )}
            </div>

            {/* Por data */}
            <div className="border rounded-xl p-3 bg-white shadow-sm space-y-2">
              <form
                onSubmit={handleRelatorioPorData}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold">Por data</span>
                  <input
                    type="date"
                    className="border rounded-lg px-2 py-1 text-[14px] focus:outline-none focus:ring-2 focus:ring-violet-200"
                    value={dataRelatorio}
                    onChange={(e) => setDataRelatorio(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 border rounded-full px-3 py-1 text-[14px] hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700"
                >
                  Carregar
                </button>
              </form>
              {relatorioPorData && <ReportView data={relatorioPorData} />}
            </div>

            {/* Intervalo */}
            <div className="border rounded-xl p-3 bg-white shadow-sm space-y-2">
              <form
                onSubmit={handleRelatorioIntervalo}
                className="flex flex-col gap-2 text-xs"
              >
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-semibold">Por intervalo</span>
                  <input
                    type="date"
                    className="border rounded-lg px-2 py-1 text-[14px] focus:outline-none focus:ring-2 focus:ring-violet-200"
                    value={intervaloInicio}
                    onChange={(e) => setIntervaloInicio(e.target.value)}
                  />
                  <span>-</span>
                  <input
                    type="date"
                    className="border rounded-lg px-2 py-1 text-[14px] focus:outline-none focus:ring-2 focus:ring-violet-200"
                    value={intervaloFim}
                    onChange={(e) => setIntervaloFim(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-gray-900">
                    Útil para fechar semana ou período específico.
                  </span>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 border rounded-full px-3 py-1 text-[14px] hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700"
                  >
                    Carregar
                  </button>
                </div>
              </form>
              {relatorioIntervalo && <ReportView data={relatorioIntervalo} />}
            </div>

            {/* Mensal */}
            <div className="border rounded-xl p-3 bg-white shadow-sm space-y-2">
              <form
                onSubmit={handleRelatorioMensal}
                className="flex flex-col gap-2 text-xs"
              >
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-semibold">Mensal</span>
                  <input
                    type="number"
                    className="border rounded-lg px-2 py-1 text-[14px] w-20 focus:outline-none focus:ring-2 focus:ring-violet-200"
                    placeholder="Ano"
                    value={anoMensal}
                    onChange={(e) => setAnoMensal(e.target.value)}
                  />
                  <input
                    type="text"
                    className="border rounded-lg px-2 py-1 text-[14px] w-24 focus:outline-none focus:ring-2 focus:ring-violet-200"
                    placeholder="Mês (1-12 ou 'set')"
                    value={mesMensal}
                    onChange={(e) => setMesMensal(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-gray-900">
                    Aceita número ou nome abreviado do mês.
                  </span>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 border rounded-full px-3 py-1 text-[14px] hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700"
                  >
                    Carregar
                  </button>
                </div>
              </form>
              {relatorioMensal && <ReportView data={relatorioMensal} />}
            </div>
          </div>
        </section>
      )}

      {/* MODAL DE MARCAÇÃO */}
      {marcacaoModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-4 md:p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-violet-600" />
                  Nova marcação de almoço
                </h3>
                <p className="text-[14px] text-gray-900 mt-1">
                  Regista uma refeição para um aluno numa data específica.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMarcacaoModalOpen(false)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-gray-200 text-gray-900 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCriarMarcacao} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium">ID do aluno</label>
                <input
                  type="number"
                  name="aluno_id"
                  className="border rounded-lg px-3 py-2 w-full text-xs focus:outline-none focus:ring-2 focus:ring-violet-200"
                  value={marcacaoForm.aluno_id}
                  onChange={handleChangeMarcacao}
                  required
                />
                <p className="text-[14px] text-gray-900">
                  Usa o ID do aluno tal como está registado no sistema.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-medium">Data</label>
                <input
                  type="date"
                  name="data"
                  className="border rounded-lg px-3 py-2 w-full text-xs focus:outline-none focus:ring-2 focus:ring-violet-200"
                  value={marcacaoForm.data}
                  onChange={handleChangeMarcacao}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium">Observação (opcional)</label>
                <textarea
                  name="observacao"
                  rows={3}
                  className="border rounded-lg px-3 py-2 w-full text-xs resize-none focus:outline-none focus:ring-2 focus:ring-violet-200"
                  value={marcacaoForm.observacao}
                  onChange={handleChangeMarcacao}
                  placeholder="Ex.: dieta especial, isenção, etc."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setMarcacaoModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-[14px] text-gray-900 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg border border-violet-600 bg-violet-600 text-white text-[14px] hover:bg-violet-700 hover:border-violet-700 disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "A marcar…" : "Guardar marcação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
