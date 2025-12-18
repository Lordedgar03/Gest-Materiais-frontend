import { useState, useCallback, useEffect } from 'react';
import api from '../api';

export function useRelatorios() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    locais: [],
    tipos: [],
    categorias: []
  });
  const [estoque, setEstoque] = useState({
    grupos: [],
    total: { itens: 0, quantidade: 0, valor_estoque: 0 },
    criterio: 'local'
  });

  // Carregar filtros disponíveis
  useEffect(() => {
    const loadFiltros = async () => {
      try {
        setLoading(true);

        const [materiaisRes, tiposRes, categoriasRes] = await Promise.all([
          api.get('/materiais'),
          api.get('/tipos'),
          api.get('/categorias')
        ]);

        const arr = (r) => (Array.isArray(r?.data) ? r.data : r?.data?.data || []);

        // Locais únicos dos materiais
        const materiais = arr(materiaisRes);
        const locaisUnicos = [...new Set(
          materiais.map(m => m.mat_localizacao).filter(Boolean)
        )].sort();

        // Tipos
        const tipos = arr(tiposRes).map(t => ({
          id: t.tipo_id ?? t.id,
          nome: t.tipo_nome ?? t.nome
        }));

        // Categorias (atenção aos campos cat_id/cat_nome)
        const categorias = arr(categoriasRes).map(c => ({
          id: c.cat_id ?? c.categoria_id ?? c.id,
          nome: c.cat_nome ?? c.categoria_nome ?? c.nome
        }));

        setFiltros({ locais: locaisUnicos, tipos, categorias });
      } catch (err) {
        console.error('Erro ao carregar filtros:', err);
        setError('Erro ao carregar filtros disponíveis');
      } finally {
        setLoading(false);
      }
    };

    loadFiltros();
  }, []);

  // Estoque agrupado (fallback se não houver endpoint)
  const fetchEstoqueAgrupado = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      try {
        response = await api.get('/relatorios/estoque-agrupado', { params });
      } catch (err) {
        if (err.response?.status === 404) {
          // Fallback: agrupa no front
          const r = await api.get('/materiais');
          const materiais = Array.isArray(r?.data) ? r.data : (r?.data?.data || []);

          const groupBy = params.groupBy || 'local';
          const grupos = {};

          materiais.forEach(material => {
            let chave;
            switch (groupBy) {
              case 'local':
                chave = material.mat_localizacao || 'Sem localização';
                break;
              case 'tipo':
                chave = material.tipo_nome || material.Tipo?.tipo_nome || 'Sem tipo';
                break;
              case 'categoria':
                chave =
                  material.categoria_nome ||
                  material.Categoria?.categoria_nome ||
                  material.cat_nome ||
                  'Sem categoria';
                break;
              default:
                chave = 'Outros';
            }

            if (!grupos[chave]) {
              grupos[chave] = { grupo: chave, itens: 0, quantidade: 0, valor_estoque: 0 };
            }

            const qtd = Number(material.mat_quantidade_estoque || 0);
            const preco = Number(material.mat_preco || 0);
            grupos[chave].itens += 1;
            grupos[chave].quantidade += qtd;
            grupos[chave].valor_estoque += qtd * preco;
          });

          const gruposArray = Object.values(grupos);
          const total = gruposArray.reduce((acc, g) => ({
            itens: acc.itens + g.itens,
            quantidade: acc.quantidade + g.quantidade,
            valor_estoque: acc.valor_estoque + g.valor_estoque
          }), { itens: 0, quantidade: 0, valor_estoque: 0 });

          setEstoque({
            grupos: gruposArray.sort((a, b) => a.grupo.localeCompare(b.grupo)),
            total,
            criterio: groupBy
          });
          return;
        }
        throw err;
      }

      // Endpoint disponível
      const data = response?.data || {};
      setEstoque({
        grupos: Array.isArray(data.grupos) ? data.grupos : [],
        total: data.total || { itens: 0, quantidade: 0, valor_estoque: 0 },
        criterio: params.groupBy || 'local'
      });

    } catch (err) {
      console.error('Erro ao carregar estoque agrupado:', err);
      setError(err?.response?.data?.message || err.message || 'Erro ao carregar estoque');
    } finally {
      setLoading(false);
    }
  }, []);

  // Lista detalhada de materiais
  const listaMateriais = useCallback(async (params = {}) => {
    try {
      const response = await api.get('/materiais', { params });
      const materiais = Array.isArray(response?.data) ? response.data : (response?.data?.data || []);

      const materiaisProcessados = materiais.map(material => {
        const qtd = Number(material.mat_quantidade_estoque || 0);
        const preco = Number(material.mat_preco || 0);
        const valorEstoque = qtd * preco;

        return {
          ...material,
          valor_estoque: valorEstoque,
          tipo_nome: material.tipo_nome || material.Tipo?.tipo_nome || 'Sem tipo',
          categoria_nome:
            material.categoria_nome || material.Categoria?.categoria_nome || material.cat_nome || 'Sem categoria'
        };
      });

      const total = materiaisProcessados.reduce((acc, m) => ({
        quantidade: acc.quantidade + Number(m.mat_quantidade_estoque || 0),
        valor_estoque: acc.valor_estoque + Number(m.valor_estoque || 0)
      }), { quantidade: 0, valor_estoque: 0 });

      return { ok: true, rows: materiaisProcessados, total };
    } catch (err) {
      console.error('Erro ao carregar materiais:', err);
      throw new Error(err?.response?.data?.message || err.message || 'Erro ao carregar materiais');
    }
  }, []);

  // Vendas por mês (com múltiplos fallbacks)
  const vendasMensal = useCallback(async (ano) => {
    try {
      // 1) Tenta um endpoint específico
      try {
        const resp = await api.get(`/relatorios/vendas-mensal/${ano}`);
        const data = resp?.data || {};
        return {
          ok: data.ok !== false,
          ano: data.ano || ano,
          meses: Array.isArray(data.meses) ? data.meses : [],
          totalAno: Number(data.totalAno || 0)
        };
      } catch (e1) {
        // 2) Tenta resumido de /relatorios/vendas (se existir)
        try {
          const resp = await api.get(`/relatorios/vendas`, { params: { ano }});
          const data = resp?.data || {};
          if (Array.isArray(data.meses)) {
            const totalAno = data.meses.reduce((s, m) => s + Number(m.total || 0), 0);
            return { ok: true, ano, meses: data.meses, totalAno };
          }
          throw new Error("Sem estrutura mensal");
        } catch (e2) {
          // 3) Agrupa a partir de /vendas
          try {
            const resp = await api.get('/vendas');
            const vendas = Array.isArray(resp?.data) ? resp.data : (resp?.data?.data || []);
            const meses = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: 0 }));

            vendas.forEach(v => {
              const dt = v.ven_data || v.created_at || v.data;
              const d = new Date(dt);
              if (!Number.isNaN(d.getTime()) && d.getFullYear() === ano) {
                const m = d.getMonth(); // 0-11
                meses[m].total += Number(v.ven_total ?? v.total ?? 0);
              }
            });

            const totalAno = meses.reduce((s, m) => s + m.total, 0);
            return { ok: true, ano, meses, totalAno };
          } catch (e3) {
            // 4) Último fallback: estima via /requisicoes atendidas
            try {
              const resp = await api.get('/requisicoes', { params: { ano, status: 'Atendida' }});
              const requisicoes = Array.isArray(resp?.data) ? resp.data : (resp?.data?.data || []);
              const meses = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: 0 }));
              requisicoes.forEach(req => {
                const dt = req.req_created_at || req.createdAt || req.updatedAt;
                const d = new Date(dt);
                if (!Number.isNaN(d.getTime()) && d.getFullYear() === ano) {
                  const m = d.getMonth();
                  const valorEstimado = (req.itens || []).reduce((sum, item) =>
                    sum + (Number(item.rqi_quantidade || 0) * 10), 0); // hSTNística
                  meses[m].total += valorEstimado;
                }
              });
              const totalAno = meses.reduce((s, m) => s + m.total, 0);
              return { ok: true, ano, meses, totalAno };
            } catch {
              return {
                ok: true,
                ano,
                meses: Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: 0 })),
                totalAno: 0
              };
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
      throw new Error(err?.response?.data?.message || err.message || 'Erro ao carregar vendas');
    }
  }, []);

  

  return {
    loading,
    error,
    filtros,
    estoque,
    fetchEstoqueAgrupado,
    listaMateriais,
    vendasMensal
  };

}
      