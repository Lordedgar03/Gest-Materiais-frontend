/* eslint-disable no-unused-vars */
"use client";

import { useCallback, useState } from "react";
import api from "../api";

/* helpers */
const today = () => new Date().toLocaleString("sv-SE").slice(0, 10);
const isDigits = (s) => /^\d+$/.test(String(s || "").trim());
const toYMD = (v) => {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  if (typeof v === "number") return new Date(v).toISOString().slice(0, 10);
  if (typeof v === "string") {
    const s = v.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (s.length >= 10) {
      const cut = s.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(cut)) return cut;
    }
  }
  return null;
};

export default function useMarcacao() {
  const [date, setDate] = useState(today());
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  // extras (UI/UX)
  const [selectedAluno, setSelectedAluno] = useState(null); // objeto do aluno escolhido
  const [multiDates, setMultiDates] = useState([]); // chips de datas
  const [falhas, setFalhas] = useState([]); // lista de erros do bulk para modal/detalhe

  const addDate = useCallback((d) => {
    const ymd = toYMD(d);
    if (!ymd) return;
    setMultiDates((prev) => (prev.includes(ymd) ? prev : [...prev, ymd]));
  }, []);
  const removeDate = useCallback((d) => {
    setMultiDates((prev) => prev.filter((x) => x !== d));
  }, []);
  const clearDates = useCallback(() => setMultiDates([]), []);

  // Lista marcações do dia, com filtro por nome OU nº processo (opcionais)
  const load = useCallback(
    async (opts = {}) => {
      setLoading(true);
      try {
        const alvo = (opts.aluno_nome ?? "").trim();
        const params = { data: opts.data || date };

        if (opts.num_processo != null) {
          params.num_processo = Number(opts.num_processo);
        } else if (alvo) {
          if (isDigits(alvo)) params.num_processo = Number(alvo);
          else params.aluno_nome = alvo;
        }

        const r = await api.get("/marcacoes/marcados", { params });
        setList(Array.isArray(r.data) ? r.data : r.data?.data ?? []);
      } catch (e) {
        setToast(e?.response?.data?.message || "Falha ao carregar marcações.");
      } finally {
        setLoading(false);
      }
    },
    [date]
  );

  // Utilitário: constrói seletor do aluno, priorizando valores explícitos; se faltar, usa selectedAluno
  const buildAlunoSelector = useCallback(
    ({ aluno_id, alu_num_processo, aluno_nome }) => {
      const payload = {};
      if (aluno_id != null && String(aluno_id) !== "") {
        payload.aluno_id = Number(aluno_id);
        return payload;
      }
      if (alu_num_processo != null && String(alu_num_processo) !== "") {
        payload.alu_num_processo = Number(alu_num_processo);
        return payload;
      }
      if (aluno_nome) {
        const alvo = String(aluno_nome).trim();
        if (alvo) {
          if (isDigits(alvo)) payload.alu_num_processo = Number(alvo);
          else payload.aluno_nome = alvo;
          return payload;
        }
      }
      // fallback: usar selectedAluno do estado
      if (selectedAluno) {
        if (selectedAluno.alu_id) payload.aluno_id = Number(selectedAluno.alu_id);
        else if (selectedAluno.alu_num_processo) payload.alu_num_processo = Number(selectedAluno.alu_num_processo);
        else if (selectedAluno.alu_nome) {
          const alvo = String(selectedAluno.alu_nome).trim();
          if (alvo) payload.aluno_nome = alvo;
        }
      }
      return payload;
    },
    [selectedAluno]
  );

  // Marca 1 ou várias datas (usa /marcacoes/bulk; se 404, faz fallback 1 a 1)
  const marcar = useCallback(
    async ({ aluno_nome, data, status, alu_num_processo, aluno_id, datas }) => {
      setFalhas([]); // limpa erros anteriores
      try {
        // normaliza as datas: usa `datas` → senão `multiDates` → senão `data`
        const base =
          Array.isArray(datas) && datas.length ? datas : multiDates.length ? multiDates : data ? [data] : [];

        const norm = [...new Set(base.map(toYMD).filter(Boolean))];
        if (!norm.length) {
          setToast("Escolha pelo menos uma data válida.");
          return;
        }

        // seletor do aluno
        const alunoSel = buildAlunoSelector({ aluno_id, alu_num_processo, aluno_nome });
        if (!(alunoSel.aluno_id || alunoSel.alu_num_processo || alunoSel.aluno_nome)) {
          setToast("Selecione um aluno.");
          return;
        }

        // monta body sem campos vazios
        const body = { ...alunoSel, datas: norm };
        if (status && String(status).trim()) body.status = String(status).trim();

        const r = await api.post("/marcacoes/bulk", body);

        const s = r?.data?.resumo || {};
        const fal = Array.isArray(r?.data?.falhas) ? r.data.falhas : [];
        setFalhas(fal);

        let msg = `Criadas: ${s.criadas || 0} • Duplicadas: ${s.duplicadas || 0} • Erros: ${s.erros || 0}`;
        if (fal.length) {
          const first = fal[0];
          msg += `\n• ${first.data}: ${first.message} ${first.code ? `(${first.code})` : first.name ? `(${first.name})` : ""}`;
          console.table(fal);
        }
        setToast(msg);

        // recarrega a última data para feedback imediato
        if (norm.length) await load({ data: norm[norm.length - 1] });
      } catch (e) {
        // Se o backend devolveu JSON com resumo/falhas num 400/207, mostre
        const srv = e?.response?.data;
        if (srv && (srv.resumo || srv.falhas)) {
          const s = srv.resumo || {};
          const fal = Array.isArray(srv.falhas) ? srv.falhas : [];
          setFalhas(fal);

          let msg = `Criadas: ${s.criadas || 0} • Duplicadas: ${s.duplicadas || 0} • Erros: ${s.erros || 0}`;
          if (fal.length) {
            const first = fal[0];
            msg += `\n• ${first.data}: ${first.message} ${first.code ? `(${first.code})` : first.name ? `(${first.name})` : ""}`;
            console.table(fal);
          }
          setToast(msg);

          if (Array.isArray(body?.datas) && body.datas.length) {
            await load({ data: body.datas[body.datas.length - 1] });
          }
          return;
        }

        // fallback simples
        const detalhada = srv?.message || srv?.error || e?.message || "Falha ao criar marcação.";
        setToast(detalhada);

        // fallback se /bulk não existir
        if (e?.response?.status === 404) {
          try {
            const last = toYMD(data) || null;
            if (!last) throw new Error("Sem data válida.");
            const alunoSel = buildAlunoSelector({ aluno_id, alu_num_processo, aluno_nome });
            const single = { ...alunoSel, data: last };
            if (status && String(status).trim()) single.status = String(status).trim();
            await api.post("/marcacoes", single);
            setToast("Marcação criada.");
            await load({ data: last });
          } catch (e2) {
            setToast(e2?.response?.data?.message || "Falha ao criar marcação.");
          }
        }
      }
    },
    [multiDates, buildAlunoSelector, load]
  );

  // Atualiza status usando ala_id (o service aceita ala_status ou alm_statusot)
  const atualizar = useCallback(
    async (ala_id, payload = {}) => {
      try {
        if (!ala_id) {
          setToast("ID da marcação não encontrado.");
          return;
        }
        await api.put(`/marcacoes/${ala_id}`, payload);
        setToast("Marcação atualizada.");
        await load();
      } catch (e) {
        setToast(e?.response?.data?.message || "Falha ao atualizar marcação.");
      }
    },
    [load]
  );

  // Autocomplete de alunos (aceita params.query → detecta nº processo)
  const searchAlunos = useCallback(async (params = {}) => {
    try {
      let finalParams = { ...params };
      if (typeof params.query === "string") {
        const q = params.query.trim();
        finalParams = isDigits(q) ? { num_processo: Number(q) } : { nome: q };
      }
      const r = await api.get("/alunos", { params: finalParams });
      return Array.isArray(r.data) ? r.data : r.data?.data ?? [];
    } catch (e) {
      setToast(e?.response?.data?.message || "Falha ao pesquisar alunos.");
      return [];
    }
  }, []);

  return {
    // estado principal
    date,
    setDate,
    list,
    loading,
    toast,
    setToast,

    // ações
    load,
    marcar,
    atualizar,
    searchAlunos,

    // seleção de aluno e múltiplas datas
    selectedAluno,
    setSelectedAluno,
    multiDates,
    setMultiDates,
    addDate,
    removeDate,
    clearDates,

    // falhas do bulk (para modal/detalhe)
    falhas,
    setFalhas,
  };
}
