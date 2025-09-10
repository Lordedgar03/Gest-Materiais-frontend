/* eslint-disable no-unused-vars */
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import api from "../api";

export default function useAlunos(){
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [filters, setFilters] = useState({ nome:"", num_processo:"", numero:"", turma:"", ano:"" });
  const [toast, setToast] = useState("");

  const load = useCallback(async (custom) => {
    setLoading(true);
    try{
      const params = { ...filters, ...(custom||{}) };
      Object.keys(params).forEach(k=> params[k]==="" && delete params[k]);
      const r = await api.get("/alunos", { params });
      setList(Array.isArray(r.data)? r.data : (r.data?.data??[]));
    }finally{ setLoading(false); }
  },[filters]);

  const create = useCallback(async (payload)=>{
    await api.post("/alunos", payload);
    setToast("Aluno criado.");
    await load();
  },[load]);

  const update = useCallback(async (id, payload)=>{
    await api.put(`/alunos/${id}`, payload);
    setToast("Aluno atualizado.");
    await load();
  },[load]);

  const setStatus = useCallback(async (id, status)=>{
    await api.delete(`/alunos/${id}`, { status });
    setToast("Status atualizado.");
    await load();
  },[load]);

  return { loading, list, filters, setFilters, load, create, update, setStatus, toast, setToast };
}
