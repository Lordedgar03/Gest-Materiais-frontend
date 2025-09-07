"use client";

import { useCallback, useEffect, useState } from "react";
import api from "../api";

export default function useConfiguracoes(){
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState("");

  const load = useCallback(async ()=>{
    setLoading(true);
    try{
      const r = await api.get("/configuracoes");
      setItems(Array.isArray(r.data)? r.data : (r.data?.data??[]));
    }finally{ setLoading(false); }
  },[]);

  const upsert = useCallback(async (cfg_chave, valor)=>{
    const payload = (typeof valor==="number") ? { cfg_chave, cfg_valor_n:Number(valor), cfg_valor_s:null }
                                             : { cfg_chave, cfg_valor_s:String(valor),  cfg_valor_n:null };
    await api.post("/configuracoes", payload);
    setToast("Configuração guardada.");
    await load();
  },[load]);

  const bulkUpsert = useCallback(async (arr)=>{
    await api.post("/configuracoes/bulk", { items:arr });
    setToast("Configurações atualizadas.");
    await load();
  },[load]);

  const getValue = useCallback(async (chave, fallback)=> {
    const r = await api.get(`/configuracoes/value/${encodeURIComponent(chave)}`, { params:{ fallbackN: typeof fallback==="number"?fallback:undefined, fallbackS: typeof fallback==="string"?fallback:undefined }});
    return r.data;
  },[]);

  useEffect(()=>{ load(); },[load]);

  return { loading, items, load, upsert, bulkUpsert, getValue, toast, setToast };
}
