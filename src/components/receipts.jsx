// src/pages/Receipts.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, PlusCircle, Trash2 } from 'lucide-react';

function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [tipo, setTipo] = useState('Venda de Material');
  const [total, setTotal] = useState('');
  // const [userId, setUserId] = useState(1); substituir com autenticação futura

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/recibos');
      setReceipts(res.data);
    } catch (err) {
      console.error('Erro ao buscar recibos:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/recibos', {
       // rec_fk_user: userId,
        rec_tipo: tipo,
        rec_total: parseFloat(total)
      });
      setTotal('');
      fetchReceipts();
    } catch (err) {
      console.error('Erro ao guardar recibo:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja apagar este recibo?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/recibos/${id}`);
      fetchReceipts();
    } catch (err) {
      console.error('Erro ao apagar recibo:', err);
    }
  };

  return (
    <div className="transition-all duration-300 ease-in-out p-4 text-gray-800">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FileText size={24} /> Gestão de Recibos
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <select value={tipo} onChange={e => setTipo(e.target.value)} className="border p-2 rounded">
          <option value="Venda de Material">Venda de Material</option>
          <option value="Almoço">Almoço</option>
        </select>
        <input
          type="number"
          placeholder="Total (€)"
          value={total}
          onChange={e => setTotal(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2">
          <PlusCircle size={16} /> Guardar
        </button>
      </form>

      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Lista de Recibos</h2>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Código</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Total (€)</th>
              <th className="p-2">Data</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(rec => (
              <tr key={rec.rec_id} className="border-b hover:bg-gray-50">
                <td className="p-2">{rec.rec_id}</td>
                <td className="p-2">{rec.rec_tipo}</td>
                <td className="p-2">€ {rec.rec_total.toFixed(2)}</td>
                <td className="p-2">{new Date(rec.data).toLocaleString()}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleDelete(rec.rec_id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Receipts;
