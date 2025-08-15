// src/pages/Movements.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  RefreshCw, ReceiptText, Edit2, PlusCircle, XCircle, Search,
  Filter, ChevronDown, ChevronUp, Calendar, Box, Clock, ArrowUpDown,
  ArrowDownUp, ArrowUp, ArrowDown, AlertCircle
} from 'lucide-react';
import AutoCompleteInput from '../components/AutoCompleteInput';

function Movements() {
  // Data states
  const [materials, setMaterials] = useState([]);
  const [movements, setMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [entryText, setEntryText] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedRequisition, setSelectedRequisition] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState('entrada');
  const [description, setDescription] = useState('');
  const [generateReceipt, setGenerateReceipt] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortField, setSortField] = useState('mov_data');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Initial data loading
  useEffect(() => {
    fetchAllData();
  }, []);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [movements, searchTerm, filterType, sortField, sortDirection]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [materialsRes, movementsRes, requisitionsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/materiais'),
        axios.get('http://localhost:3000/api/movimentacoes'),
        axios.get('http://localhost:3000/api/requisicoes')
      ]);

      setMaterials(materialsRes.data.data || materialsRes.data);
      setMovements(movementsRes.data.data || movementsRes.data);
      setRequisitions(requisitionsRes.data.filter(req => req.req_status === 'Aprovada'));
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Falha ao carregar dados. Por favor, tente novamente.');
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/movimentacoes');
      setMovements(res.data.data || res.data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar movimentações:', err);
      setError('Falha ao carregar movimentações.');
      setLoading(false);
    }
  };

  const handleEdit = mov => {
    setEditingId(mov.mov_id);
    setType(mov.mov_tipo);
    setQuantity(mov.mov_quantidade);
    setDescription(mov.mov_descricao);
    setSelectedMaterial(String(mov.mov_fk_material));
    setEntryText(String(mov.mov_fk_material));
    setSelectedRequisition(mov.mov_fk_requisicao || '');
    setGenerateReceipt(false);
    setShowForm(true);
    
    // Scroll to form
    setTimeout(() => {
      document.getElementById('movement-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const resetForm = () => {
    setEditingId(null);
    setEntryText('');
    setSelectedMaterial('');
    setSelectedRequisition('');
    setQuantity(1);
    setDescription('');
    setGenerateReceipt(false);
    setShowForm(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const matId = type === 'entrada' ? entryText : selectedMaterial;
      const selected = materials.find(m => m.mat_id === Number(matId));
      const data = {
        mov_tipo: type,
        mov_quantidade: Number(quantity),
        mov_descricao: description,
        mov_preco: selected?.mat_preco || 0,
        mov_fk_material: Number(matId),
        mov_fk_requisicao: selectedRequisition || null
      };

      if (editingId) {
        await axios.put(`http://localhost:3000/api/movimentacoes/${editingId}`, data);
      } else {
        await axios.post('http://localhost:3000/api/movimentacoes', data);
        if (type === 'saida' && generateReceipt) {
          await axios.post('http://localhost:3000/api/receipts', {
            rec_fk_user: 1,
            rec_tipo: 'Venda de Material',
            rec_total: data.mov_quantidade * data.mov_preco
          });
        }
      }

      resetForm();
      fetchMovements();
    } catch (err) {
      console.error('Erro ao salvar movimentação:', err);
    }
  };

  // Filter and sort functions
  const applyFilters = () => {
    let filtered = [...movements];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(mov => {
        const materialName = getMaterialName(mov.mov_fk_material).toLowerCase();
        const description = mov.mov_descricao?.toLowerCase() || '';
        return materialName.includes(search) || description.includes(search) || 
               String(mov.mov_id).includes(search);
      });
    }
    
    // Apply type filter
    if (filterType) {
      filtered = filtered.filter(mov => mov.mov_tipo === filterType);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortField === 'material_name') {
        const nameA = getMaterialName(a.mov_fk_material).toLowerCase();
        const nameB = getMaterialName(b.mov_fk_material).toLowerCase();
        return sortDirection === 'asc' 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
      }
      
      if (sortField === 'mov_data') {
        const dateA = new Date(a[sortField]);
        const dateB = new Date(b[sortField]);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredMovements(filtered);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1 text-indigo-600" />
      : <ArrowDown className="h-4 w-4 ml-1 text-indigo-600" />;
  };

  const getMaterialName = id => {
    const mat = materials.find(m => m.mat_id === id);
    return mat ? mat.mat_nome : '—';
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setSortField('mov_data');
    setSortDirection('desc');
  };

  // Calculated values
  const totalEntradas = filteredMovements.filter(m => m.mov_tipo === 'entrada')
    .reduce((sum, mov) => sum + mov.mov_quantidade, 0);
    
  const totalSaidas = filteredMovements.filter(m => m.mov_tipo === 'saida')
    .reduce((sum, mov) => sum + mov.mov_quantidade, 0);

  return (
    <div className="transition-all space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-3xl font-bold text-indigo-700 flex items-center gap-2">
          <RefreshCw className="text-indigo-600" /> Movimentações
        </h1>
        
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={fetchMovements}
            className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-1"
          >
            <RefreshCw size={16} /> Atualizar
          </button>
          
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md shadow text-white ${
              showForm ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {showForm ? (<><XCircle size={18} /> Fechar</>) : (<><PlusCircle size={18} /> Nova Movimentação</>)}
          </button>
        </div>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
          <h3 className="text-gray-500 text-sm font-medium">Total de Movimentações</h3>
          <p className="text-2xl font-bold text-gray-800">{filteredMovements.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium">Total de Entradas</h3>
          <p className="text-2xl font-bold text-green-600">{totalEntradas}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <h3 className="text-gray-500 text-sm font-medium">Total de Saídas</h3>
          <p className="text-2xl font-bold text-red-600">{totalSaidas}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
          <h3 className="text-gray-500 text-sm font-medium">Balanço</h3>
          <p className="text-2xl font-bold text-amber-600">{totalEntradas - totalSaidas}</p>
        </div>
      </div>

      {/* Registration form */}
      {showForm && (
        <form id="movement-form" onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4 border border-gray-100">
          <h2 className="text-xl font-semibold text-indigo-700 mb-4 flex items-center gap-2">
            {editingId ? <Edit2 size={20} /> : <PlusCircle size={20} />}
            {editingId ? 'Editar Movimentação' : 'Registrar Nova Movimentação'}
          </h2>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setType('entrada')}
              className={`px-4 py-2 rounded-md text-white font-medium flex items-center gap-2 transition-colors ${
                type === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            >
              <ArrowDown size={18} /> Entrada
            </button>
            <button
              type="button"
              onClick={() => setType('saida')}
              className={`px-4 py-2 rounded-md text-white font-medium flex items-center gap-2 transition-colors ${
                type === 'saida' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            >
              <ArrowUp size={18} /> Saída
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {type === 'entrada' ? (
              <div className="md:col-span-2">
                <AutoCompleteInput
                  label="ID ou Nome do Material (Entrada)"
                  value={entryText}
                  setValue={setEntryText}
                  options={materials.map(m => ({ id: m.mat_id, name: m.mat_nome }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Digite o ID ou comece a escrever o nome do material
                </p>
              </div>
            ) : (
              <div className="md:col-span-2">
                <AutoCompleteInput
                  label="Selecionar Material (Saída)"
                  value={selectedMaterial}
                  setValue={setSelectedMaterial}
                  options={materials.map(m => ({ id: m.mat_id, name: m.mat_nome }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Digite o ID ou comece a escrever o nome do material
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="quantity">
                Quantidade
              </label>
              <input
                id="quantity"
                type="number"
                placeholder="Quantidade"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="border rounded-md p-2 w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="1"
                required
              />
            </div>

            {type === 'saida' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="requisition">
                  Requisição
                </label>
                <select
                  id="requisition"
                  value={selectedRequisition}
                  onChange={e => setSelectedRequisition(e.target.value)}
                  className="border rounded-md p-2 w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecionar Requisição (Opcional)</option>
                  {requisitions.map(req => (
                    <option key={req.req_id} value={req.req_id}>
                      #{req.req_id} - Material #{req.req_fk_mat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                Descrição
              </label>
              <textarea
                id="description"
                placeholder="Descrição da movimentação"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="border rounded-md p-2 w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="2"
              />
            </div>

            {type === 'saida' && !editingId && (
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateReceipt}
                    onChange={e => setGenerateReceipt(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-sm text-gray-700">Gerar recibo automaticamente</span>
                  <ReceiptText size={16} className="text-gray-600" />
                </label>
                {generateReceipt && (
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Um recibo de venda será gerado automaticamente após salvar a movimentação
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md font-medium flex items-center gap-2 transition-colors"
            >
              {editingId ? 'Atualizar' : 'Guardar'} Movimentação
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md font-medium transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {/* Filter and search */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-lg font-semibold text-indigo-700 flex items-center gap-2 mb-3 sm:mb-0">
            <Box className="text-indigo-600" /> Histórico de Movimentações
          </h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={toggleFilters}
              className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Filter size={16} /> 
              Filtros
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            <div className="relative">
              <Search size={16} className="absolute top-2 left-2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Procurar..."
                className="pl-8 pr-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
        
        {showFilters && (
          <div className="bg-gray-50 p-3 rounded-md mb-4 flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por Tipo
              </label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="border rounded p-1 text-sm"
              >
                <option value="">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="saida">Saídas</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <select
                value={sortField}
                onChange={e => {
                  setSortField(e.target.value);
                  setSortDirection('asc');
                }}
                className="border rounded p-1 text-sm"
              >
                <option value="mov_data">Data</option>
                <option value="material_name">Nome do Material</option>
                <option value="mov_quantidade">Quantidade</option>
                <option value="mov_id">ID</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Direção
              </label>
              <select
                value={sortDirection}
                onChange={e => setSortDirection(e.target.value)}
                className="border rounded p-1 text-sm"
              >
                <option value="asc">Crescente</option>
                <option value="desc">Decrescente</option>
              </select>
            </div>
            
            <div className="self-end">
              <button
                onClick={clearFilters}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Movement history table */}
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <RefreshCw size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle size={32} className="mx-auto mb-2 text-red-500" />
            <p className="text-red-500">{error}</p>
            <button 
              onClick={fetchMovements}
              className="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
            >
              Tentar novamente
            </button>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="p-6 text-center">
            <Box size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Nenhuma movimentação encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-indigo-50 text-indigo-900">
                <tr>
                  <th onClick={() => handleSort('mov_id')} className="p-2 cursor-pointer hover:bg-indigo-100">
                    <span className="flex items-center">
                      Código {renderSortIcon('mov_id')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('material_name')} className="p-2 cursor-pointer hover:bg-indigo-100">
                    <span className="flex items-center">
                      Produto {renderSortIcon('material_name')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('mov_tipo')} className="p-2 cursor-pointer hover:bg-indigo-100">
                    <span className="flex items-center">
                      Tipo {renderSortIcon('mov_tipo')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('mov_quantidade')} className="p-2 cursor-pointer hover:bg-indigo-100">
                    <span className="flex items-center">
                      Qtd {renderSortIcon('mov_quantidade')}
                    </span>
                  </th>
                  <th className="p-2">Descrição</th>
                  <th onClick={() => handleSort('mov_preco')} className="p-2 cursor-pointer hover:bg-indigo-100">
                    <span className="flex items-center">
                      Preço (€) {renderSortIcon('mov_preco')}
                    </span>
                  </th>
                  <th onClick={() => handleSort('mov_data')} className="p-2 cursor-pointer hover:bg-indigo-100">
                    <span className="flex items-center">
                      Data {renderSortIcon('mov_data')}
                    </span>
                  </th>
                  <th className="p-2">Requisição</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((mov, idx) => (
                  <tr 
                    key={mov.mov_id} 
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b hover:bg-indigo-50 transition-colors`}
                  >
                    <td className="p-2 font-medium">{mov.mov_id}</td>
                    <td className="p-2">
                      {mov.mov_material_nome ?? getMaterialName(mov.mov_fk_material)}
                    </td>
                    <td className="p-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mov.mov_tipo === 'entrada' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {mov.mov_tipo === 'entrada' ? <ArrowDown size={12} className="mr-1" /> : <ArrowUp size={12} className="mr-1" />}
                        {mov.mov_tipo}
                      </span>
                    </td>
                    <td className="p-2 font-medium">{mov.mov_quantidade}</td>
                    <td className="p-2 max-w-xs truncate">{mov.mov_descricao || '—'}</td>
                    <td className="p-2">€ {Number(mov.mov_preco).toFixed(2)}</td>
                    <td className="p-2">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1 text-gray-500" />
                        {new Date(mov.mov_data).toLocaleDateString()}
                        <Clock size={14} className="ml-2 mr-1 text-gray-500" />
                        {new Date(mov.mov_data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="p-2">
                      {mov.mov_fk_requisicao ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          #{mov.mov_fk_requisicao}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-2">
                      <button 
                        onClick={() => handleEdit(mov)} 
                        className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-100 transition-colors"
                        title="Editar movimentação"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Movements;