"use client";

import { useCallback, useState } from "react";
import api from "../api";

const today = () => new Date().toLocaleString("sv-SE").slice(0,10);

export default function useMarcacao(){
  const [date, setDate] = useState(today());
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async (opts={})=>{
    setLoading(true);
    try{
      const params = { aluno_nome: opts.aluno_nome||"", data: opts.data||date };
      const r = await api.get("/marcacoes/marcados", { params });
      setList(Array.isArray(r.data)? r.data : (r.data?.data??[]));
    }finally{ setLoading(false); }
  },[date]);

  const marcar = useCallback( async ({ aluno_nome, data, status })=>{
    await api.post("/marcacoes", { aluno_nome, data, status });
    setToast("Marcação criada.");
    await load({ data });
  },[load]);

  const atualizar = useCallback( async (id, payload)=>{
    await api.patch(`/marcacoes/${id}`, payload);
    setToast("Marcação atualizada.");
    await load();
  },[load]);

  const searchAlunos = useCallback(async (params={})=>{
    const r = await api.get("/alunos", { params });
    return Array.isArray(r.data)? r.data : (r.data?.data??[]);
  },[]);

  return { date, setDate, list, loading, load, marcar, atualizar, searchAlunos, toast, setToast };
}
