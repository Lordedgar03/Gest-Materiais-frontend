import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Users, PackageCheck, Shapes, Layers, RefreshCw, FileText,
  TrendingUp, ArrowUpRight, ArrowDownRight, Loader2,
  Calendar, Activity, PieChart, AlertCircle, BarChart4
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell, PieChart as RechartPieChart, Pie
} from 'recharts';

function Dashboard() {
  // States
  const [users, setUsers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Load data
  useEffect(() => {
    fetchAllData();
  }, [refreshKey]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, materialsRes, typesRes, categoriesRes, movementsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/users'),
        axios.get('http://localhost:3000/api/materiais'),
        axios.get('http://localhost:3000/api/tipos'),
        axios.get('http://localhost:3000/api/categorias'),
        axios.get('http://localhost:3000/api/movimentacoes'),
      ]);
      
      setUsers(usersRes.data);
      setMaterials(materialsRes.data.data || materialsRes.data);
      setTypes(typesRes.data);
      setCategories(categoriesRes.data);
      setMovements(movementsRes.data.data || movementsRes.data);
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setError('Falha ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Calculate metrics from API data
  const calculateMetrics = () => {
    // Movement trends (last 7 days)
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    
    const recentMovements = movements.filter(m => 
      new Date(m.mov_data) >= last7Days
    );
    
    const totalEntradas = recentMovements
      .filter(m => m.mov_tipo === 'entrada')
      .reduce((sum, m) => sum + m.mov_quantidade, 0);
      
    const totalSaidas = recentMovements
      .filter(m => m.mov_tipo === 'saida')
      .reduce((sum, m) => sum + m.mov_quantidade, 0);
    
    const inventoryTrend = totalEntradas - totalSaidas;

    // Sales value
    const totalVendas = movements
      .filter(m => m.mov_tipo === 'saida' && m.mov_motivo === 'venda')
      .reduce((sum, m) => sum + (m.mov_valor || 0), 0);
    
    // Materials with low stock
    const lowStockMaterials = materials.filter(m => 
      m.mat_quantidade_estoque < m.mat_estoque_minimo
    ).length;

    return {
      totalEntradas,
      totalSaidas,
      inventoryTrend,
      totalVendas,
      lowStockMaterials
    };
  };

  // Generate chart data
  const generateChartData = () => {
    // Movement chart data
    const movementData = movements.reduce((acc, mov) => {
      const date = new Date(mov.mov_data).toLocaleDateString("pt-PT");
      const found = acc.find(item => item.date === date);
      if (found) {
        found[mov.mov_tipo] = (found[mov.mov_tipo] || 0) + mov.mov_quantidade;
        found.total = (found.entrada || 0) - (found.saida || 0);
      } else {
        acc.push({
          date,
          entrada: mov.mov_tipo === 'entrada' ? mov.mov_quantidade : 0,
          saida: mov.mov_tipo === 'saida' ? mov.mov_quantidade : 0,
          total: mov.mov_tipo === 'entrada' ? mov.mov_quantidade : -mov.mov_quantidade
        });
      }
      return acc;
    }, [])
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-10); // Show only last 10 for better visualization

    // Category distribution data
    const categoryData = categories.map(cat => {
      const catMaterials = materials.filter(m => {
        const tipo = types.find(t => t.tipo_id === m.mat_fk_tipo);
        return tipo && tipo.tipo_fk_categoria === cat.cat_id;
      });
      
      return {
        name: cat.cat_nome,
        value: catMaterials.length,
        percentage: materials.length 
          ? Math.round((catMaterials.length / materials.length) * 100)
          : 0
      };
    }).sort((a, b) => b.value - a.value); // Sort by count, descending

    return {
      movementData,
      categoryData
    };
  };

  // Format tooltip text
  const formatTooltip = (value, name) => {
    const nameMap = {
      entrada: 'Entradas',
      saida: 'Saídas',
      total: 'Balanço'
    };
    return [value, nameMap[name] || name];
  };

  // Calculate all metrics and chart data
  const metrics = loading ? {} : calculateMetrics();
  const chartData = loading ? {} : generateChartData();
  
  // Define card data
  const getCards = () => {
    return [
      { 
        label: "Utilizadores", 
        value: users.length, 
        icon: <Users className="text-blue-600" size={24}/>,
        color: "bg-blue-50 border-blue-500",
        textColor: "text-blue-800"
      },
      { 
        label: "Materiais", 
        value: materials.length,
        secondaryValue: metrics.lowStockMaterials > 0 ? `${metrics.lowStockMaterials} em baixa` : null,
        icon: <PackageCheck className="text-emerald-600" size={24}/>,
        color: "bg-emerald-50 border-emerald-500",
        textColor: "text-emerald-800"
      },
      { 
        label: "Tipos", 
        value: types.length, 
        icon: <Layers className="text-amber-600" size={24}/>,
        color: "bg-amber-50 border-amber-500",
        textColor: "text-amber-800"
      },
      { 
        label: "Categorias", 
        value: categories.length, 
        icon: <Shapes className="text-pink-600" size={24}/>,
        color: "bg-pink-50 border-pink-500",
        textColor: "text-pink-800"
      },
      { 
        label: "Movimentações", 
        value: movements.length, 
        trend: metrics.inventoryTrend,
        icon: <RefreshCw className="text-indigo-600" size={24}/>,
        color: "bg-indigo-50 border-indigo-500",
        textColor: "text-indigo-800"
      },
      { 
        label: "Total em Vendas", 
        value: `€ ${metrics.totalVendas?.toFixed(2) || "0.00"}`, 
        icon: <FileText className="text-purple-600" size={24}/>,
        color: "bg-purple-50 border-purple-500",
        textColor: "text-purple-800"
      },
    ];
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

  // Renders
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Carregando dados...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium text-red-800 mb-2 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" /> 
            Erro ao carregar dados
          </h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
            Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden md:flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date().toLocaleDateString('pt-PT')}
            </span>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {getCards().map((card, idx) => (
            <div 
              key={idx} 
              className={`${card.color} rounded-lg shadow-sm border-l-4 p-3`}
            >
              <div className="flex items-center mb-1">
                <div className="mr-2">
                  {card.icon}
                </div>
                <p className={`text-xs ${card.textColor}`}>{card.label}</p>
              </div>
              <h3 className={`text-lg font-bold ${card.textColor}`}>{card.value}</h3>
              
              {card.secondaryValue && (
                <p className="text-xs text-gray-600 mt-1">{card.secondaryValue}</p>
              )}
              
              {card.trend !== undefined && (
                <div className="flex items-center mt-1">
                  {card.trend > 0 ? (
                    <span className="flex items-center text-green-600 text-xs">
                      <ArrowUpRight size={14} className="mr-1" /> 
                      +{card.trend}
                    </span>
                  ) : card.trend < 0 ? (
                    <span className="flex items-center text-red-600 text-xs">
                      <ArrowDownRight size={14} className="mr-1" /> 
                      {card.trend}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">0</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main chart - takes 2/3 width on large screens */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-indigo-600" />
                Movimentações
              </h2>
              <div className="flex items-center space-x-3">
                <span className="flex items-center text-xs text-gray-600">
                  <div className="h-3 w-3 rounded-full bg-green-400 mr-1"></div>
                  Entradas
                </span>
                <span className="flex items-center text-xs text-gray-600">
                  <div className="h-3 w-3 rounded-full bg-red-400 mr-1"></div>
                  Saídas
                </span>
              </div>
            </div>
            
            {chartData.movementData?.length === 0 ? (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Sem dados de movimentação</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart 
                  data={chartData.movementData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    formatter={formatTooltip}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      border: '1px solid #f3f4f6',
                      borderRadius: '6px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <ReferenceLine y={0} stroke="#e5e7eb" />
                  <Area 
                    type="monotone" 
                    dataKey="entrada" 
                    stroke="#4ade80" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorEntrada)" 
                    activeDot={{ r: 6 }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="saida" 
                    stroke="#f87171" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorSaida)" 
                    activeDot={{ r: 6 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category distribution - takes 1/3 width on large screens */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-indigo-600" />
              Materiais por Categoria
            </h2>
            
            {chartData.categoryData?.length === 0 ? (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Sem categorias disponíveis</p>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <RechartPieChart>
                    <Pie
                      data={chartData.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </RechartPieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex flex-wrap justify-center mt-2">
                  {chartData.categoryData.slice(0, 4).map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center mx-2">
                      <div 
                        className="h-3 w-3 rounded-full mr-1" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                      />
                      <span className="text-xs text-gray-600">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent statistics */}
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <BarChart4 className="h-5 w-5 mr-2 text-indigo-600" />
            Estatísticas Recentes (Últimos 7 dias)
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm text-blue-700 font-medium mb-2">Entradas</h3>
              <p className="text-2xl font-bold text-blue-800">{metrics.totalEntradas}</p>
              <p className="text-xs text-blue-600 mt-1">Total</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <h3 className="text-sm text-red-700 font-medium mb-2">Saídas</h3>
              <p className="text-2xl font-bold text-red-800">{metrics.totalSaidas}</p>
              <p className="text-xs text-red-600 mt-1">Total</p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h3 className="text-sm text-amber-700 font-medium mb-2">Balanço</h3>
              <p className="text-2xl font-bold text-amber-800">{metrics.inventoryTrend}</p>
              <p className="text-xs text-amber-600 mt-1">Diferença entrada/saída</p>
            </div>
            
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
              <h3 className="text-sm text-emerald-700 font-medium mb-2">Materiais</h3>
              <p className="text-2xl font-bold text-emerald-800">{metrics.lowStockMaterials}</p>
              <p className="text-xs text-emerald-600 mt-1">Com estoque baixo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-2 text-center text-xs text-gray-500 flex-shrink-0">
        Última atualização: {new Date().toLocaleString("pt-PT")}
      </div>
    </div>
  );
}

export default Dashboard;