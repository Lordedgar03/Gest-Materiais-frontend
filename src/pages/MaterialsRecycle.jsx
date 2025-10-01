// src/pages/MaterialsRecycle.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ArrowLeft,
  ArrowRight,
  PackageCheck,
  RotateCcw,
  Trash2
} from 'lucide-react';

function MaterialsRecycle() {
  const [recycledMaterials, setRecycledMaterials] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterText, setFilterText] = useState('');

  const fetchRecycledMaterials = async (page = 1, search = '') => {
    try {
      const res = await axios.get(`http://localhost:3000/api/materials/recycle?page=${page}&search=${search}`);
      setRecycledMaterials(res.data.data);
      setCurrentPage(res.data.pagination.current_page);
      setTotalPages(res.data.pagination.total_pages);
    } catch (err) {
      console.error('Erro ao carregar materiais reciclados:', err);
    }
  };

  useEffect(() => {
    fetchRecycledMaterials(currentPage, filterText);
  }, [currentPage, filterText]);

  const handleRestore = async (id) => {
    if (confirm('Deseja restaurar este material?')) {
      try {
        await axios.put(`http://localhost:3000/api/materials/restore/${id}`);
        alert('Material restaurado com sucesso!');
        fetchRecycledMaterials();
      } catch (err) {
        console.error('Erro ao restaurar material:', err);
        alert('Erro ao restaurar material.');
      }
    }
  };

  const handlePermanentDelete = async (id) => {
    if (confirm('Deseja excluir permanentemente este material?')) {
      try {
        await axios.delete(`http://localhost:3000/api/materials/permanent/${id}`);
        alert('Material excluído permanentemente.');
        fetchRecycledMaterials();
      } catch (err) {
        console.error('Erro ao excluir material:', err);
        alert('Erro ao excluir material.');
      }
    }
  };

  return (
    <div className=" transition-all text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#5548D9] flex items-center gap-2">
          <PackageCheck size={28} /> Reciclagem de Materiais
        </h1>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Filtrar por nome..."
          value={filterText}
          onChange={(e) => {
            setFilterText(e.target.value);
            setCurrentPage(1);
          }}
          className="border p-2 rounded w-full"
        />
      </div>

      <div className="bg-white rounded shadow p-4 transition duration-300">
        <table className="w-full text-sm">
          <thead className="bg-[#ECECFF]">
            <tr className="text-left">
              <th className="p-2">Código</th>
              <th className="p-2">Nome</th>
              <th className="p-2">Descrição</th>
              <th className="p-2">Preço (STN)</th>
              <th className="p-2">Qtd</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {recycledMaterials.map((mat) => (
              <tr key={mat.mat_id_material} className="bg-red-50 border-b">
                <td className="p-2">{mat.mat_id_material}</td>
                <td className="p-2">{mat.mat_nome}</td>
                <td className="p-2">{mat.mat_descricao}</td>
                <td className="p-2">STN {Number(mat.mat_preco).toFixed(2)}</td>
                <td className="p-2">{mat.mat_quantidade_estoque}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => handleRestore(mat.mat_id_material)} className="text-green-600 hover:text-green-800">
                    <RotateCcw size={18} />
                  </button>
                  <button onClick={() => handlePermanentDelete(mat.mat_id_material)} className="text-red-600 hover:text-red-800">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-center items-center gap-2 mt-4">
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" disabled={currentPage === 1}>
            <ArrowLeft size={18} />
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded" disabled={currentPage === totalPages}>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MaterialsRecycle;
