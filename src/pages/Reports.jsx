// src/pages/Reports.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function Reports() {
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchMaterials();
    fetchUsers();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/materials');
      setMaterials(res.data.data || res.data);
    } catch (err) {
      console.error('Erro ao buscar materiais:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Erro ao buscar utilizadores:', err);
    }
  };

  const stockByCategory = categories.map(cat => {
    const totalStock = materials
      .filter(mat => mat.mat_fk_categoria === cat.cat_id_categoria)
      .reduce((sum, mat) => sum + mat.mat_quantidade_estoque, 0);
    return { category: cat.cat_nome, totalStock };
  });

  const lowStockMaterials = materials.filter(m => m.mat_quantidade_estoque < m.mat_estoque_minimo);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(materials);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Materiais');
    XLSX.writeFile(wb, 'RelatorioMateriais.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório de Materiais', 14, 16);
    doc.autoTable({
      head: [['Código', 'Nome', 'Qtd', 'Min', 'Preço']],
      body: materials.map(mat => [
        mat.mat_id_material,
        mat.mat_nome,
        mat.mat_quantidade_estoque,
        mat.mat_estoque_minimo,
        mat.mat_preco
      ]),
      startY: 22
    });
    doc.save('RelatorioMateriais.pdf');
  };

  return (
    <div className="transition-all duration-300 ease-in-out p-4 text-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText size={28} /> Relatórios
        </h1>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-1">
            <Download size={16} /> Excel
          </button>
          <button onClick={exportToPDF} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-1">
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Estoque Total por Categoria</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stockByCategory}>
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="totalStock" fill="#4F46E5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Materiais Abaixo do Estoque Mínimo</h2>
        {lowStockMaterials.length === 0 ? (
          <p className="text-green-700">Todos os materiais estão dentro do estoque adequado.</p>
        ) : (
          <ul className="list-disc list-inside text-red-700">
            {lowStockMaterials.map(mat => (
              <li key={mat.mat_id_material}>
                {mat.mat_nome} (Estoque: {mat.mat_quantidade_estoque} / Mínimo: {mat.mat_estoque_minimo})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Resumo de Utilizadores</h2>
        <p>Total: {users.length} utilizadores registados</p>
        <ul className="mt-2 list-disc list-inside">
          <li>Admins: {users.filter(u => u.user_tipo === 'admin').length}</li>
          <li>Funcionários: {users.filter(u => u.user_tipo === 'funcionario').length}</li>
          <li>Professores: {users.filter(u => u.user_tipo === 'professor').length}</li>
          <li>Ativos: {users.filter(u => u.user_status === 'ativo').length}</li>
          <li>Inativos: {users.filter(u => u.user_status === 'inativo').length}</li>
        </ul>
      </div>
    </div>
  );
}

export default Reports;
