/* eslint-disable no-unused-vars */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../api";

/* helpers */
const money = (n) => Number(n || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
const today = () => new Date().toLocaleString("sv-SE").slice(0, 10);

/* (opcional) gate simples baseado no token */
function parseJwt(t){ try{const b=t.split(".")[1]; return JSON.parse(atob(b.replace(/-/g,"+").replace(/_/g,"/")));}catch{return{}}}
function canUse(decoded){
  const roles = decoded?.roles||[];
  if (decoded?.is_admin || roles.includes("admin")) return true;
  const perms = [
    ...(decoded?.permissions||[]), ...(decoded?.perms||[]), ...(decoded?.scopes||[]),
    ...(decoded?.actions||[]), ...(decoded?.allowed||[])
  ].map(x => (typeof x==="string"?x:(x?.code||x?.name||x?.permission||""))?.toLowerCase());
  if (perms.includes("manage_sales")) return true;
  const templates = (decoded?.templates||[]).map(t => (t?.template_code||t?.code||"").toLowerCase());
  return templates.includes("manage_sales");
}

export default function useAlmoco(){
  const [loadingBoot, setLoadingBoot] = useState(true);
  const [preco, setPreco] = useState(0);
  const [updatingPreco, setUpdatingPreco] = useState(false);

  const [relHoje, setRelHoje] = useState({ totais:{ total_arrecadado:0, total_almocos:0 }, alunosHoje:[] });
  const [loadingHoje, setLoadingHoje] = useState(false);

  const [relData, setRelData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  const [relIntervalo, setRelIntervalo] = useState(null);
  const [loadingIntervalo, setLoadingIntervalo] = useState(false);

  const [relMensal, setRelMensal] = useState(null);
  const [loadingMensal, setLoadingMensal] = useState(false);

  const [toast, setToast] = useState("");
  const [tone, setTone] = useState("ok");

  // gate
  const allowed = useMemo(() => {
    if (typeof window === "undefined") return true;
    const token = localStorage.getItem("token");
    if (!token) return true;
    return canUse(parseJwt(token));
  }, []);

  const loadPreco = useCallback(async ()=>{
    const r = await api.get("/almocos/preco-padrao");
    setPreco(Number(r.data?.preco||0));
  },[]);

  const atualizarPreco = useCallback(async (novo)=>{
    setUpdatingPreco(true);
    try{
      await api.patch("/almocos/preco", { novo_preco:Number(novo) });
      await loadPreco();
      setToast("Preço do almoço atualizado.");
      setTone("ok");
    }catch(e){
      setToast(e?.response?.data?.message || "Falha ao atualizar.");
      setTone("error");
    }finally{ setUpdatingPreco(false); }
  },[loadPreco]);

  const loadHoje = useCallback(async ()=>{
    setLoadingHoje(true);
    try{
      const r = await api.get("/almocos/relatorios/hoje");
      setRelHoje(r.data || { totais:{ total_arrecadado:0, total_almocos:0 }, alunosHoje:[] });
    }finally{ setLoadingHoje(false); }
  },[]);

  const loadPorData = useCallback(async (date)=>{
    setLoadingData(true);
    try{
      const r = await api.get("/almocos/relatorios/por-data", { params:{ date }});
      setRelData(r.data||null);
    }finally{ setLoadingData(false); }
  },[]);

  const loadIntervalo = useCallback(async (inicio,fim)=>{
    setLoadingIntervalo(true);
    try{
      const r = await api.get("/almocos/relatorios/intervalo", { params:{ inicio,fim }});
      setRelIntervalo(r.data||null);
    }finally{ setLoadingIntervalo(false); }
  },[]);

  const loadMensal = useCallback(async (ano, mes)=>{
    setLoadingMensal(true);
    try{
      const r = await api.get("/almocos/relatorios/mensal", { params:{ ano, mes }});
      setRelMensal(r.data||null);
    }finally{ setLoadingMensal(false); }
  },[]);

  useEffect(()=>{
    (async ()=>{
      if(!allowed){ setLoadingBoot(false); return; }
      try{
        await Promise.all([loadPreco(), loadHoje()]);
      }finally{ setLoadingBoot(false); }
    })();
  },[allowed, loadPreco, loadHoje]);

  return {
    allowed, loadingBoot,
    preco, atualizarPreco, updatingPreco,
    relHoje, loadingHoje,
    relData, loadingData, loadPorData,
    relIntervalo, loadingIntervalo, loadIntervalo,
    relMensal, loadingMensal, loadMensal,
    toast, setToast, tone, setTone,
    money, today,
  };
}
