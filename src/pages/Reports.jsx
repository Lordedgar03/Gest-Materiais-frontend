/* eslint-disable no-unused-vars */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { 
  FileDown, 
  Loader2, 
  AlertCircle, 
  BarChart3, 
  TrendingUp, 
  Package, 
  DollarSign,
  Calendar,
  Filter,
  Download,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import * as XLSX from "xlsx";
import { useRelatorios } from "../hooks/useRelatorios";

function Th({ children, className = "" }) {
  return (
    <th scope="col" className={`px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap ${className}`}>{children}</td>;
}

function KPI({ label, value, icon: Icon, trend, trendValue, color = "blue" }) {
  const colorClasses = {
    blue: "from-blue-500 to-indigo-600",
    green: "from-green-500 to-emerald-600", 
    purple: "from-purple-500 to-violet-600",
    orange: "from-orange-500 to-amber-600"
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`h-3 w-3 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
              {trendValue}
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, children, className = "" }) {
  return (
    <section className={`rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-xl ${className}`}>
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function FilterGrid({ children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
      {children}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, icon: Icon }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 hover:shadow-md"
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ActionButton({ onClick, disabled, loading, children, variant = "primary" }) {
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/90"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${variants[variant]}`}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
      {children}
    </button>
  );
}

const MESES_NOMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function Reports() {
  const {
    loading, error,
    filtros,
    estoque, fetchEstoqueAgrupado,
    listaMateriais,
    vendasMensal
  } = useRelatorios();

  // filtros gerais do agregado
  const [agrupadoPor, setAgrupadoPor] = useState("local");
  const [localSel, setLocalSel] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");

  // agrupamento do DETALHE
  const [detGroupBy, setDetGroupBy] = useState("todos");
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // vendas
  const [ano, setAno] = useState(new Date().getFullYear());
  const [ven, setVen] = useState({ ok: true, ano, porMes: Array.from({length:12},(_,i)=>({mes:i+1, valor:0})), total: 0 });
  const [venLoading, setVenLoading] = useState(false);
  const [venErr, setVenErr] = useState("");

  // materiais detalhe
  const [det, setDet] = useState({ ok: true, rows: [], total: { quantidade:0, valor_estoque:0 } });
  const [detLoading, setDetLoading] = useState(false);
  const [detErr, setDetErr] = useState("");

  // estados de exportação
  const [expAgg, setExpAgg] = useState(false);
  const [expDet, setExpDet] = useState(false);
  const [expVen, setExpVen] = useState(false);

  // carregar agregado
  useEffect(() => {
    const params = {
      groupBy: agrupadoPor,
      ...(localSel ? { local: localSel } : {}),
      ...(tipoId ? { tipo_id: Number(tipoId) } : {}),
      ...(categoriaId ? { categoria_id: Number(categoriaId) } : {}),
    };
    fetchEstoqueAgrupado(params);
  }, [agrupadoPor, localSel, tipoId, categoriaId, fetchEstoqueAgrupado]);

  // carregar detalhe
  useEffect(() => {
    (async () => {
      try {
        setDetLoading(true); setDetErr("");
        const res = await listaMateriais({
          ...(localSel ? { local: localSel } : {}),
          ...(tipoId ? { tipo_id: Number(tipoId) } : {}),
          ...(categoriaId ? { categoria_id: Number(categoriaId) } : {}),
        });
        setDet(res);
      } catch (e) {
        setDetErr(e?.response?.data?.message || e?.message || "Falha ao carregar materiais.");
        setDet({ ok:false, rows:[], total:{quantidade:0, valor_estoque:0} });
      } finally {
        setDetLoading(false);
      }
    })();
  }, [localSel, tipoId, categoriaId, listaMateriais]);

  // carregar vendas
  useEffect(() => {
    (async () => {
      try {
        setVenLoading(true); setVenErr("");
        const r = await vendasMensal(ano);
        const meses = Array.isArray(r?.meses) ? r.meses : [];
        const porMes = Array.from({length:12},(_,i)=>{
          const mm = meses.find(x => Number(x.mes)===i+1);
          return { mes: i+1, valor: Number(mm?.total || 0) };
        });
        setVen({ ok: r?.ok !== false, ano: r?.ano ?? ano, porMes, total: Number(r?.totalAno || 0) });
      } catch (e) {
        setVenErr(e?.response?.data?.message || e?.message || "Falha ao carregar vendas.");
        setVen(prev=>({ ...prev, ok:false, porMes: prev.porMes.map(x=>({...x,valor:0})), total:0 }));
      } finally {
        setVenLoading(false);
      }
    })();
  }, [ano, vendasMensal]);

  // KPIs do agregado
  const kpisMat = useMemo(() => {
    const t = estoque?.total || { itens:0, quantidade:0, valor_estoque:0 };
    return {
      itens: Number(t.itens||0),
      quantidade: Number(t.quantidade||0),
      valor: Number(t.valor_estoque||0),
    };
  }, [estoque]);

  // agrupamento do DETALHE no front
  const detalheAgrupado = useMemo(() => {
    const rows = det?.rows || [];
    if (detGroupBy === "todos") {
      return [{ chave: "Todos", itens: rows }];
    }
    const keyer = {
      local: (r) => r.mat_localizacao || "Sem localização",
      tipo:  (r) => r.tipo_nome || "Sem tipo",
      categoria: (r) => r.categoria_nome || "Sem categoria",
    }[detGroupBy];

    const map = new Map();
    for (const r of rows) {
      const k = keyer(r) || "Não definido";
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    }
    return Array.from(map, ([chave, itens]) => ({ chave, itens }))
      .sort((a,b)=>String(a.chave).localeCompare(String(b.chave),"pt"));
  }, [det?.rows, detGroupBy]);

  // toggle grupo expandido
  const toggleGroup = (chave) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chave)) {
        newSet.delete(chave);
      } else {
        newSet.add(chave);
      }
      return newSet;
    });
  };

  // exportações
  const exportAgg = async () => {
    try {
      setExpAgg(true);
      const linhas = (estoque?.grupos || []).map(g => ({
        "Grupo": g.grupo ?? "Não definido",
        "Itens": Number(g.itens||0),
        "Quantidade": Number(g.quantidade||0),
        "Valor em estoque (STN)": Number(g.valor_estoque||0).toFixed(2),
      }));
      const tot = [{
        "Total Itens": Number(estoque?.total?.itens||0),
        "Total Qtd": Number(estoque?.total?.quantidade||0),
        "Total (STN)": Number(estoque?.total?.valor_estoque||0).toFixed(2),
      }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhas), "Estoque (grupos)");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tot), "Totais");
      XLSX.writeFile(wb, `estoque_agrupado_${estoque?.criterio||agrupadoPor}.xlsx`, { compression:true });
    } finally {
      setExpAgg(false);
    }
  };

  const exportDet = async () => {
    try {
      setExpDet(true);
      const linhas = (det?.rows || []).map(r => ({
        "Grupo": detGroupBy==="todos"
          ? "Todos"
          : detGroupBy==="local" ? (r.mat_localizacao||"Sem localização")
          : detGroupBy==="tipo" ? (r.tipo_nome||"Sem tipo")
          : (r.categoria_nome||"Sem categoria"),
        "Material": r.mat_nome ?? "Sem nome",
        "Tipo": r.tipo_nome ?? "Sem tipo",
        "Categoria": r.categoria_nome ?? "Sem categoria",
        "Local": r.mat_localizacao ?? "Sem localização",
        "Quantidade": Number(r.mat_quantidade_estoque||0),
        "Preço (STN)": Number(r.mat_preco||0).toFixed(2),
        "Valor em estoque (STN)": Number(r.valor_estoque || (Number(r.mat_quantidade_estoque||0)*Number(r.mat_preco||0))).toFixed(2),
      }));
      const tot = [{
        "Total Qtd": Number(det?.total?.quantidade||0),
        "Total (STN)": Number(det?.total?.valor_estoque||0).toFixed(2),
      }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhas), "Materiais (detalhe)");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tot), "Totais");
      XLSX.writeFile(wb, `materiais_detalhe_${detGroupBy}.xlsx`, { compression:true });
    } finally {
      setExpDet(false);
    }
  };

  const exportVen = async () => {
    try {
      setExpVen(true);
      const linhas = (ven?.porMes || []).map(m => ({
        "Mês": `${String(m.mes).padStart(2,"0")} - ${MESES_NOMES[(m.mes-1)%12]}`,
        "Total (STN)": Number(m.valor||0).toFixed(2),
      }));
      const tot = [{ "Ano": ven?.ano ?? ano, "Arrecadado (STN)": Number(ven?.total||0).toFixed(2) }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhas), "Por mês");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tot), "Total do ano");
      XLSX.writeFile(wb, `vendas_${ven?.ano||ano}.xlsx`, { compression:true });
    } finally {
      setExpVen(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/20 space-y-8 p-6">
      {/* Header */}
      <header className="rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Relatórios Avançados
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Análise completa de materiais e vendas</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
        </div>
      </header>

      {/* Estoque Section */}
      <SectionCard title="Análise de Estoque">
        <FilterGrid>
          <FilterSelect
            label="Agrupar por"
            value={agrupadoPor}
            onChange={(e) => setAgrupadoPor(e.target.value)}
            icon={Filter}
            options={[
              { value: "local", label: "Localização" },
              { value: "tipo", label: "Tipo" },
              { value: "categoria", label: "Categoria" }
            ]}
          />
          
          <FilterSelect
            label="Local"
            value={localSel}
            onChange={(e) => setLocalSel(e.target.value)}
            options={[
              { value: "", label: "Todos os locais" },
              ...(filtros?.locais || []).map(l => ({ value: l, label: l }))
            ]}
          />

          <FilterSelect
            label="Tipo"
            value={tipoId}
            onChange={(e) => setTipoId(e.target.value)}
            options={[
              { value: "", label: "Todos os tipos" },
              ...(filtros?.tipos || []).map(t => ({ value: t.id, label: t.nome }))
            ]}
          />

          <FilterSelect
            label="Categoria"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            options={[
              { value: "", label: "Todas as categorias" },
              ...(filtros?.categorias || []).map(c => ({ value: c.id, label: c.nome }))
            ]}
          />

          <div className="lg:col-span-2 flex items-end">
            <ActionButton onClick={exportAgg} loading={expAgg || loading}>
              <Download className="h-5 w-5" />
              Exportar Estoque
            </ActionButton>
          </div>
        </FilterGrid>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
          <KPI 
            label="Total de Itens" 
            value={kpisMat.itens.toLocaleString()} 
            icon={Package}
            color="blue"
          />
          <KPI 
            label="Quantidade Total" 
            value={kpisMat.quantidade.toLocaleString()} 
            icon={BarChart3}
            color="green"
          />
          <KPI 
            label="Valor em Estoque" 
            value={`STN${kpisMat.valor.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`} 
            icon={DollarSign}
            color="purple"
          />
        </div>
      </SectionCard>

      {/* Materiais Detalhe */}
      <SectionCard title="Materiais Detalhados">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between mb-6">
          <FilterSelect
            label="Agrupar detalhes por"
            value={detGroupBy}
            onChange={(e) => setDetGroupBy(e.target.value)}
            icon={Eye}
            options={[
              { value: "todos", label: "Sem agrupamento" },
              { value: "local", label: "Por localização" },
              { value: "tipo", label: "Por tipo" },
              { value: "categoria", label: "Por categoria" }
            ]}
          />
          
          <ActionButton onClick={exportDet} loading={expDet || detLoading}>
            <Download className="h-5 w-5" />
            Exportar Materiais
          </ActionButton>
        </div>

        <div className="rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-lg overflow-hidden">
          {detLoading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Carregando materiais...</p>
            </div>
          ) : detErr ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <p className="text-red-600 dark:text-red-400 font-medium">{String(detErr)}</p>
            </div>
          ) : (det?.rows || []).length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">Nenhum material encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {detalheAgrupado.map(({ chave, itens }) => {
                const isExpanded = expandedGroups.has(chave);
                const tot = itens.reduce((s,x)=>({
                  qtd: s.qtd + Number(x.mat_quantidade_estoque||0),
                  val: s.val + Number(x.valor_estoque||0),
                }), { qtd:0, val:0 });

                return (
                  <div key={chave} className="border-b border-gray-200/50 dark:border-gray-700/50 last:border-b-0">
                    {detGroupBy !== "todos" && (
                      <button
                        onClick={() => toggleGroup(chave)}
                        className="w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 flex items-center justify-between font-semibold text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                          <span className="text-gray-900 dark:text-gray-100">{chave}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">({itens.length} item{itens.length !== 1 ? 's' : ''})</span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    )}
                    
                    {(detGroupBy === "todos" || isExpanded) && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50/80 dark:bg-gray-800/80">
                            <tr>
                              <Th>Material</Th>
                              <Th>Tipo</Th>
                              <Th>Categoria</Th>
                              <Th>Localização</Th>
                              <Th className="text-right">Quantidade</Th>
                              <Th className="text-right">Preço (STN)</Th>
                              <Th className="text-right">Valor Total (STN)</Th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                            {itens.map(r => (
                              <tr key={r.mat_id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors duration-150">
                                <Td className="font-medium">{r.mat_nome ?? "Sem nome"}</Td>
                                <Td>{r.tipo_nome ?? "Sem tipo"}</Td>
                                <Td>{r.categoria_nome ?? "Sem categoria"}</Td>
                                <Td>{r.mat_localizacao ?? "Sem localização"}</Td>
                                <Td className="text-right font-mono">{Number(r.mat_quantidade_estoque||0).toLocaleString()}</Td>
                                <Td className="text-right font-mono">STN{Number(r.mat_preco||0).toFixed(2)}</Td>
                                <Td className="text-right font-mono font-semibold">STN{Number(r.valor_estoque||0).toFixed(2)}</Td>
                              </tr>
                            ))}
                            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 font-bold">
                              <Td colSpan={4} className="font-semibold">Subtotal do grupo</Td>
                              <Td className="text-right font-mono">{tot.qtd.toLocaleString()}</Td>
                              <Td className="text-right">—</Td>
                              <Td className="text-right font-mono">STN{tot.val.toFixed(2)}</Td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
              
              <div className="px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 font-bold text-lg">
                <div className="flex justify-between items-center">
                  <span>Total Geral</span>
                  <div className="flex gap-8">
                    <span>Quantidade: {Number(det?.total?.quantidade||0).toLocaleString()}</span>
                    <span>Valor: STN{Number(det?.total?.valor_estoque||0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Vendas Section */}
      <SectionCard title="Análise de Vendas">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between mb-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ano de Análise
            </label>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(Number(e.target.value || new Date().getFullYear()))}
              className="w-48 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
              min="2000" 
              max="2100"
            />
          </div>
          
          <ActionButton onClick={exportVen} loading={expVen || venLoading}>
            <Download className="h-5 w-5" />
            Exportar Vendas
          </ActionButton>
        </div>

        {/* KPIs de Vendas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPI 
            label="Ano Analisado" 
            value={ven?.ano ?? ano} 
            icon={Calendar}
            color="blue"
          />
          <KPI 
            label="Total Arrecadado" 
            value={`STN${Number(ven?.total||0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`} 
            icon={DollarSign}
            color="green"
          />
          <KPI 
            label="Média Mensal" 
            value={`STN${(Number(ven?.total||0)/12).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`} 
            icon={TrendingUp}
            color="purple"
          />
          <KPI 
            label="Meses com Vendas" 
            value={`${(ven?.porMes||[]).filter(m=>(m?.valor||0)>0).length}/12`} 
            icon={BarChart3}
            color="orange"
          />
        </div>

        {/* Tabela de Vendas */}
        <div className="rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-lg overflow-hidden">
          {venLoading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Carregando dados de vendas...</p>
            </div>
          ) : venErr ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <p className="text-red-600 dark:text-red-400 font-medium">{String(venErr)}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                  <tr>
                    <Th>Mês</Th>
                    <Th className="text-right">Vendas (STN)</Th>
                    <Th className="text-right">% do Total</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  {(ven?.porMes||[]).map((m,i)=>{
                    const percentage = ven?.total > 0 ? (Number(m.valor||0) / Number(ven.total) * 100) : 0;
                    return (
                      <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors duration-150">
                        <Td className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                            {`${String(m.mes).padStart(2,"0")} - ${MESES_NOMES[(m.mes-1)%12]}`}
                          </div>
                        </Td>
                        <Td className="text-right font-mono">STN{Number(m.valor||0).toFixed(2)}</Td>
                        <Td className="text-right font-mono text-gray-600 dark:text-gray-400">{percentage.toFixed(1)}%</Td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 font-bold text-lg">
                    <Td className="font-bold">Total do Ano</Td>
                    <Td className="text-right font-mono">STN{Number(ven?.total||0).toFixed(2)}</Td>
                    <Td className="text-right font-mono">100%</Td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionCard>
    </main>
  );
}