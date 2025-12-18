// src/hooks/useAlmoco.js
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";

/* ===== helpers ===== */

export const money = (n) =>
  Number(n || 0).toLocaleString("pt-PT", {
    style: "currency",
    currency: "STN",
  });

// Mesmo formato do backend (sv-SE -> YYYY-MM-DD)
export const today = () => new Date().toLocaleString("sv-SE").slice(0, 10);

function parseJwt(t) {
  try {
    const b = t.split(".")[1];
    return JSON.parse(atob(b.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

function canUse(decoded) {
  const roles = decoded?.roles || [];
  if (decoded?.is_admin || roles.includes("admin")) return true;

  const perms = [
    ...(decoded?.permissions || []),
    ...(decoded?.perms || []),
    ...(decoded?.scopes || []),
    ...(decoded?.actions || []),
    ...(decoded?.allowed || []),
  ]
    .map((x) =>
      (typeof x === "string"
        ? x
        : x?.code || x?.name || x?.permission || ""
      )?.toLowerCase()
    )
    .filter(Boolean);

  if (perms.includes("manage_sales")) return true;

  const templates = (decoded?.templates || []).map((t) =>
    (t?.template_code || t?.code || "").toLowerCase()
  );
  return templates.includes("manage_sales");
}

/* ===== Export helpers (CSV / XLSX / PDF) ===== */

const nf2 = new Intl.NumberFormat("pt-PT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const stn = (n) => `STN ${nf2.format(Number(n || 0))}`;

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportCSV(rows, filename) {
  if (!rows?.length) {
    const blob = new Blob(["Sem dados"], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, filename.replace(/\.xlsx$/i, ".txt"));
    return;
  }

  const cols = Object.keys(rows[0] || {});
  const lines = [cols.join(";")];
  for (const r of rows) {
    lines.push(cols.map((c) => String(r?.[c] ?? "")).join(";"));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, filename.replace(/\.xlsx$/i, ".csv"));
}

async function exportXLSX(rows, filename, sheetName = "Relatorio") {
  try {
    const mod = await import("xlsx"); // SheetJS
    const XLSX = mod.default || mod;

    const ws = XLSX.utils.json_to_sheet(rows || []);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(
      blob,
      filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
    );
    return true;
  } catch {
    // fallback CSV
    exportCSV(rows, filename);
    return false;
  }
}

async function exportPDF({
  title,
  subtitle,
  columns,
  bodyRows,
  footerLines,
  filename,
}) {
  try {
    const jspdfMod = await import("jspdf");
    const autoTableMod = await import("jspdf-autotable");

    const jsPDF = jspdfMod.jsPDF || jspdfMod.default;
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    const pageW = doc.internal.pageSize.getWidth();
    let y = 12;

    doc.setFontSize(14);
    doc.text(String(title || "Relatório"), 14, y);
    y += 6;

    if (subtitle) {
      doc.setFontSize(10);
      doc.text(String(subtitle), 14, y);
      y += 6;
    }

    const head = [columns.map((c) => c.label)];
    const body = (bodyRows || []).map((r) =>
      columns.map((c) => String(r?.[c.key] ?? ""))
    );

    autoTableMod.default(doc, {
      head,
      body: body.length ? body : [["Sem dados"]],
      startY: y,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    let endY = (doc.lastAutoTable?.finalY || y) + 6;

    if (footerLines?.length) {
      doc.setFontSize(10);
      for (const line of footerLines) {
        if (endY > 285) {
          doc.addPage();
          endY = 14;
        }
        doc.text(String(line), 14, endY);
        endY += 5;
      }
    }

    doc.save(filename?.endsWith(".pdf") ? filename : `${filename}.pdf`);
    return true;
  } catch {
    // fallback print (o user pode salvar como PDF)
    window.print();
    return false;
  }
}

/* ===== hook ===== */

export default function useAlmoco() {
  const [loadingBoot, setLoadingBoot] = useState(true);

  // preço
  const [precoPadrao, setPrecoPadrao] = useState(0);
  const [precoHoje, setPrecoHoje] = useState(0);
  const [updatingPreco, setUpdatingPreco] = useState(false);

  // relatórios (sumários)
  const [relHoje, setRelHoje] = useState({
    totais: { total_arrecadado: 0, total_almocos: 0 },
    alunosHoje: [],
  });
  const [loadingHoje, setLoadingHoje] = useState(false);

  const [relData, setRelData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  const [relIntervalo, setRelIntervalo] = useState(null);
  const [loadingIntervalo, setLoadingIntervalo] = useState(false);

  const [relMensal, setRelMensal] = useState(null);
  const [loadingMensal, setLoadingMensal] = useState(false);

  // LISTAS (alunos por dia)
  const [listaHoje, setListaHoje] = useState([]);
  const [loadingListaHoje, setLoadingListaHoje] = useState(false);

  const [listaData, setListaData] = useState([]);
  const [loadingListaData, setLoadingListaData] = useState(false);

  // toasts
  const [toast, setToast] = useState("");
  const [tone, setTone] = useState("ok"); // "ok" | "error"

  // gate
  const allowed = useMemo(() => {
    if (typeof window === "undefined") return true;
    const token = localStorage.getItem("token");
    if (!token) return true;
    return canUse(parseJwt(token));
  }, []);

  /* ===== API calls (conformes backend) ===== */

  const loadPreco = useCallback(async () => {
    try {
      const r = await api.get("/almocos/preco-padrao");
      const ppad = Number(r.data?.preco_padrao || 0);
      const phoje = Number(r.data?.preco_hoje ?? ppad);
      setPrecoPadrao(ppad);
      setPrecoHoje(phoje);
    } catch {
      setToast("Falha ao obter preço padrão.");
      setTone("error");
      setPrecoPadrao(0);
      setPrecoHoje(0);
    }
  }, []);

  const atualizarPrecoPadrao = useCallback(
    async (novo, { aplicarNoDia = false, dataDia } = {}) => {
      const valor = Number(novo);
      if (!Number.isFinite(valor) || valor <= 0) {
        setTone("error");
        setToast("Informe um preço válido (> 0).");
        return;
      }

      setUpdatingPreco(true);
      try {
        const body = { preco: valor };
        if (aplicarNoDia) {
          body.aplicar_no_dia = true;
          body.data = dataDia || today();
        }

        await api.put("/almocos/preco", body);
        await loadPreco();
        setTone("ok");
        setToast(
          aplicarNoDia
            ? "Preço padrão e preço do dia atualizados."
            : "Preço padrão atualizado."
        );
      } catch (e) {
        setTone("error");
        setToast(
          e?.response?.data?.message || "Falha ao atualizar o preço padrão."
        );
      } finally {
        setUpdatingPreco(false);
      }
    },
    [loadPreco]
  );

  const atualizarPreco = atualizarPrecoPadrao;

  const atualizarPrecoDoDia = useCallback(
    async (data, novo) => {
      const valor = Number(novo);
      if (!data) {
        setTone("error");
        setToast("Informe a data para atualizar o preço do dia.");
        return;
      }
      if (!Number.isFinite(valor) || valor <= 0) {
        setTone("error");
        setToast("Informe um preço válido (> 0).");
        return;
      }

      setUpdatingPreco(true);
      try {
        await api.put("/almocos/preco-dia", { data, preco: valor });
        if (data === today()) await loadPreco();
        setTone("ok");
        setToast("Preço do dia atualizado.");
      } catch (e) {
        setTone("error");
        setToast(
          e?.response?.data?.message || "Falha ao atualizar o preço do dia."
        );
      } finally {
        setUpdatingPreco(false);
      }
    },
    [loadPreco]
  );

  const loadHoje = useCallback(async () => {
    setLoadingHoje(true);
    try {
      const r = await api.get("/almocos/relatorios/hoje");
      const safe = r.data || {
        totais: { total_arrecadado: 0, total_almocos: 0 },
        alunosHoje: [],
      };
      setRelHoje({
        totais: safe.totais || { total_arrecadado: 0, total_almocos: 0 },
        alunosHoje: Array.isArray(safe.alunosHoje) ? safe.alunosHoje : [],
      });
    } catch {
      setRelHoje({
        totais: { total_arrecadado: 0, total_almocos: 0 },
        alunosHoje: [],
      });
    } finally {
      setLoadingHoje(false);
    }
  }, []);

  const loadListaHoje = useCallback(async () => {
    setLoadingListaHoje(true);
    try {
      const r = await api.get("/marcacoes/marcados", {
        params: { data: today() },
      });
      const payload = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
      setListaHoje(payload);
    } catch {
      setListaHoje([]);
    } finally {
      setLoadingListaHoje(false);
    }
  }, []);

  const loadPorData = useCallback(async (date) => {
    if (!date) return;
    setLoadingData(true);
    try {
      const r = await api.get("/almocos/relatorios/por-data", {
        params: { date },
      });
      setRelData(r.data || null);
    } catch {
      setRelData(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  const loadListaPorData = useCallback(async (date) => {
    if (!date) return;
    setLoadingListaData(true);
    try {
      const r = await api.get("/marcacoes/marcados", {
        params: { data: date },
      });
      const payload = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
      setListaData(payload);
    } catch {
      setListaData([]);
    } finally {
      setLoadingListaData(false);
    }
  }, []);

  const loadIntervalo = useCallback(async (inicio, fim) => {
    if (!inicio || !fim) return;
    setLoadingIntervalo(true);
    try {
      const r = await api.get("/almocos/relatorios/intervalo", {
        params: { inicio, fim },
      });
      setRelIntervalo(r.data || null);
    } catch {
      setRelIntervalo(null);
    } finally {
      setLoadingIntervalo(false);
    }
  }, []);

  const loadMensal = useCallback(async (ano, mes) => {
    if (!ano || !mes) return;
    setLoadingMensal(true);
    try {
      const r = await api.get("/almocos/relatorios/mensal", {
        params: { ano, mes },
      });
      setRelMensal(r.data || null);
    } catch {
      setRelMensal(null);
    } finally {
      setLoadingMensal(false);
    }
  }, []);

  /* ===== boot ===== */

  useEffect(() => {
    (async () => {
      if (!allowed) {
        setLoadingBoot(false);
        return;
      }
      try {
        await Promise.all([loadPreco(), loadHoje(), loadListaHoje()]);
      } finally {
        setLoadingBoot(false);
      }
    })();
  }, [allowed, loadPreco, loadHoje, loadListaHoje]);

  /* ===== normalizadores para export ===== */

  const mapRow = useCallback((r) => {
    const status = String(r?.ala_status || "pendente");
    const valor = Number(r?.ala_valor || 0);
    return {
      Aluno: r?.alu_nome ?? "",
      Processo: r?.alu_num_processo ?? "",
      Turma: r?.alu_turma ?? "",
      Status: status,
      Valor_STN: nf2.format(valor),
    };
  }, []);

  const totalsFromRows = useCallback((rows) => {
    const totalPago = (rows || []).reduce((s, r) => {
      const st = String(r?.ala_status || "").toLowerCase();
      return s + (st === "pago" ? Number(r?.ala_valor || 0) : 0);
    }, 0);
    return { totalPago };
  }, []);

  /* ===== EXPORTS: HOJE ===== */

  const exportHojeExcel = useCallback(async () => {
    try {
      const rows = (listaHoje || []).map(mapRow);
      const d = today();
      await exportXLSX(rows, `almocos-hoje-${d}.xlsx`, "Hoje");
      setTone("ok");
      setToast("Exportação Excel concluída (ou CSV, se faltar XLSX).");
    } catch {
      setTone("error");
      setToast("Falha ao exportar Excel.");
    }
  }, [listaHoje, mapRow]);

  const exportHojePdf = useCallback(async () => {
    try {
      const rows = (listaHoje || []).map(mapRow);
      const { totalPago } = totalsFromRows(listaHoje || []);
      const d = today();

      await exportPDF({
        title: "Relatório de Almoços — Hoje",
        subtitle: `Data: ${d} • Total pago: ${stn(totalPago)} • Registos: ${
          rows.length
        }`,
        columns: [
          { key: "Aluno", label: "Aluno" },
          { key: "Processo", label: "Nº Processo" },
          { key: "Turma", label: "Turma" },
          { key: "Status", label: "Status" },
          { key: "Valor_STN", label: "Valor (STN)" },
        ],
        bodyRows: rows,
        footerLines: [`Total pago: ${stn(totalPago)}`],
        filename: `almocos-hoje-${d}.pdf`,
      });

      setTone("ok");
      setToast("Exportação PDF concluída (ou impressão, se faltar PDF libs).");
    } catch {
      setTone("error");
      setToast("Falha ao exportar PDF.");
    }
  }, [listaHoje, mapRow, totalsFromRows]);

  /* ===== EXPORTS: POR DATA ===== */

  const exportPorDataExcel = useCallback(
    async (date) => {
      const d = date || relData?.date || "";
      if (!d) {
        setTone("error");
        setToast("Selecione uma data primeiro.");
        return;
      }
      try {
        const rows = (listaData || []).map(mapRow);
        await exportXLSX(rows, `almocos-por-data-${d}.xlsx`, "PorData");
        setTone("ok");
        setToast("Exportação Excel concluída (ou CSV, se faltar XLSX).");
      } catch {
        setTone("error");
        setToast("Falha ao exportar Excel.");
      }
    },
    [listaData, relData, mapRow]
  );

  const exportPorDataPdf = useCallback(
    async (date) => {
      const d = date || relData?.date || "";
      if (!d) {
        setTone("error");
        setToast("Selecione uma data primeiro.");
        return;
      }
      try {
        const rows = (listaData || []).map(mapRow);
        const { totalPago } = totalsFromRows(listaData || []);
        await exportPDF({
          title: "Relatório de Almoços — Por Data",
          subtitle: `Data: ${d} • Total pago: ${stn(totalPago)} • Registos: ${
            rows.length
          }`,
          columns: [
            { key: "Aluno", label: "Aluno" },
            { key: "Processo", label: "Nº Processo" },
            { key: "Turma", label: "Turma" },
            { key: "Status", label: "Status" },
            { key: "Valor_STN", label: "Valor (STN)" },
          ],
          bodyRows: rows,
          footerLines: [`Total pago: ${stn(totalPago)}`],
          filename: `almocos-por-data-${d}.pdf`,
        });
        setTone("ok");
        setToast(
          "Exportação PDF concluída (ou impressão, se faltar PDF libs)."
        );
      } catch {
        setTone("error");
        setToast("Falha ao exportar PDF.");
      }
    },
    [listaData, relData, mapRow, totalsFromRows]
  );

  /* ===== EXPORTS: INTERVALO (só resumo) ===== */

  const exportIntervaloExcel = useCallback(async () => {
    if (!relIntervalo?.inicio || !relIntervalo?.fim) {
      setTone("error");
      setToast("Selecione um intervalo primeiro.");
      return;
    }
    try {
      const total = Number(
        relIntervalo.total_arrecadado ??
          relIntervalo.total ??
          relIntervalo.total_almocado ??
          0
      );
      const rows = [
        {
          Inicio: relIntervalo.inicio,
          Fim: relIntervalo.fim,
          Total_Almocos: Number(relIntervalo.total_almocos || 0),
          Total_Arrecadado_STN: nf2.format(total),
        },
      ];
      await exportXLSX(
        rows,
        `almocos-intervalo-${relIntervalo.inicio}_a_${relIntervalo.fim}.xlsx`,
        "Intervalo"
      );
      setTone("ok");
      setToast("Exportação Excel concluída (ou CSV, se faltar XLSX).");
    } catch {
      setTone("error");
      setToast("Falha ao exportar Excel.");
    }
  }, [relIntervalo]);

  const exportIntervaloPdf = useCallback(async () => {
    if (!relIntervalo?.inicio || !relIntervalo?.fim) {
      setTone("error");
      setToast("Selecione um intervalo primeiro.");
      return;
    }
    try {
      const total = Number(
        relIntervalo.total_arrecadado ??
          relIntervalo.total ??
          relIntervalo.total_almocado ??
          0
      );
      const rows = [
        {
          Inicio: relIntervalo.inicio,
          Fim: relIntervalo.fim,
          Total_Almocos: Number(relIntervalo.total_almocos || 0),
          Total_Arrecadado_STN: stn(total),
        },
      ];
      await exportPDF({
        title: "Relatório de Almoços — Intervalo",
        subtitle: `Período: ${relIntervalo.inicio} → ${relIntervalo.fim}`,
        columns: [
          { key: "Inicio", label: "Início" },
          { key: "Fim", label: "Fim" },
          { key: "Total_Almocos", label: "Total almoços" },
          { key: "Total_Arrecadado_STN", label: "Total arrecadado" },
        ],
        bodyRows: rows,
        footerLines: [],
        filename: `almocos-intervalo-${relIntervalo.inicio}_a_${relIntervalo.fim}.pdf`,
      });
      setTone("ok");
      setToast("Exportação PDF concluída (ou impressão, se faltar PDF libs).");
    } catch {
      setTone("error");
      setToast("Falha ao exportar PDF.");
    }
  }, [relIntervalo]);

  /* ===== EXPORTS: MENSAL ===== */

  const exportMensalExcel = useCallback(async () => {
    if (!relMensal?.ano || !relMensal?.mes) {
      setTone("error");
      setToast("Gere o relatório mensal primeiro.");
      return;
    }
    try {
      const rows = Array.isArray(relMensal?.porTurma)
        ? relMensal.porTurma.map((r) => ({
            Turma: r?.turma ?? "",
            Qtd_Almocos: Number(r?.qtd || 0),
            Total_STN: nf2.format(Number(r?.total || 0)),
          }))
        : [];
      await exportXLSX(
        rows,
        `almocos-mensal-${relMensal.ano}-${String(relMensal.mes).replace(
          /\s+/g,
          "_"
        )}.xlsx`,
        "Mensal"
      );
      setTone("ok");
      setToast("Exportação Excel concluída (ou CSV, se faltar XLSX).");
    } catch {
      setTone("error");
      setToast("Falha ao exportar Excel.");
    }
  }, [relMensal]);

  const exportMensalPdf = useCallback(async () => {
    if (!relMensal?.ano || !relMensal?.mes) {
      setTone("error");
      setToast("Gere o relatório mensal primeiro.");
      return;
    }
    try {
      const rows = Array.isArray(relMensal?.porTurma)
        ? relMensal.porTurma.map((r) => ({
            Turma: r?.turma ?? "",
            Qtd_Almocos: Number(r?.qtd || 0),
            Total_STN: stn(Number(r?.total || 0)),
          }))
        : [];

      const totalGeral = Number(relMensal?.totalGeral?.total_arrecadado || 0);

      await exportPDF({
        title: "Relatório de Almoços — Mensal",
        subtitle: `Mês: ${relMensal.mes} • Ano: ${relMensal.ano} • Total: ${stn(
          totalGeral
        )}`,
        columns: [
          { key: "Turma", label: "Turma" },
          { key: "Qtd_Almocos", label: "Nº almoços" },
          { key: "Total_STN", label: "Total" },
        ],
        bodyRows: rows,
        footerLines: [`Total do mês: ${stn(totalGeral)}`],
        filename: `almocos-mensal-${relMensal.ano}-${String(
          relMensal.mes
        ).replace(/\s+/g, "_")}.pdf`,
      });

      setTone("ok");
      setToast("Exportação PDF concluída (ou impressão, se faltar PDF libs).");
    } catch {
      setTone("error");
      setToast("Falha ao exportar PDF.");
    }
  }, [relMensal]);

  /* ===== retorno ===== */

  return {
    // gate
    allowed,
    loadingBoot,

    // preço
    precoPadrao,
    precoHoje,
    updatingPreco,
    atualizarPrecoPadrao,
    atualizarPreco,
    atualizarPrecoDoDia,

    // relatórios
    relHoje,
    loadingHoje,

    relData,
    loadingData,
    loadPorData,

    relIntervalo,
    loadingIntervalo,
    loadIntervalo,

    relMensal,
    loadingMensal,
    loadMensal,

    // listas
    listaHoje,
    loadingListaHoje,
    listaData,
    loadingListaData,
    loadListaPorData,

    // UI
    toast,
    setToast,
    tone,
    setTone,

    // helpers
    money,
    today,

    // EXPORTS
    exportHojePdf,
    exportHojeExcel,
    exportPorDataPdf,
    exportPorDataExcel,
    exportIntervaloPdf,
    exportIntervaloExcel,
    exportMensalPdf,
    exportMensalExcel,
  };
}
