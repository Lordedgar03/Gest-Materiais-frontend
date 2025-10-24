import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { publicApi } from "../api"; // usa o cliente público já configurado

const TEMPLATE_TO_CAPS = {
  baseline: [
    { module: "dashboard",    action: "visualizar" },
    { module: "categoria",    action: "visualizar" },
    { module: "tipo",         action: "visualizar" },
    { module: "material",     action: "visualizar" },
    { module: "movimentacao", action: "visualizar" },
    { module: "requisicao",   action: "visualizar" },
    { module: "venda",        action: "visualizar" }, // Vendas/PDV/Caixa/Almoço*
    { module: "recibo",       action: "visualizar" }, // uso no front (exibir/gerar)
  ],
  manage_category: [
    { module: "categoria",    action: "visualizar" },
    { module: "categoria",    action: "criar" },
    { module: "categoria",    action: "editar" },
    { module: "categoria",    action: "eliminar" },

    { module: "tipo",         action: "visualizar" },
    { module: "tipo",         action: "criar" },
    { module: "tipo",         action: "editar" },
    { module: "tipo",         action: "eliminar" },

    { module: "material",     action: "visualizar" },
    { module: "material",     action: "criar" },
    { module: "material",     action: "editar" },
    { module: "material",     action: "eliminar" },

    { module: "movimentacao", action: "visualizar" },
    { module: "requisicao",   action: "visualizar" },
  ],
  manage_users: [
    { module: "usuario", action: "visualizar" },
    { module: "usuario", action: "criar" },
    { module: "usuario", action: "editar" },
    { module: "usuario", action: "eliminar" },
    { module: "log",     action: "visualizar" },
  ],
  // gestão de vendas (inclui PDV/Caixa/Vendas e módulo Almoço via "venda")
  manage_sales: [
    { module: "venda", action: "visualizar" },
    { module: "venda", action: "criar" },
    { module: "venda", action: "eliminar" },
  ],
};

/** Converte templates -> Set("module:action") */
function deriveCapsFromTemplates(templates = []) {
  const caps = new Set();
  templates.forEach((t) => {
    const list = TEMPLATE_TO_CAPS[t?.template_code] || [];
    list.forEach(({ module, action }) => caps.add(`${module}:${action}`));
  });
  return caps;
}

/** Extrai dados úteis do token */
function parseToken(token) {
  let roles = [];
  let templates = [];
  let nome = "Utilizador";
  let isAdmin = false;

  try {
    const payload = jwtDecode(token) || {};
    if (payload?.user_nome || payload?.nome || payload?.name) {
      nome = payload.user_nome || payload.nome || payload.name;
    }
    roles = Array.isArray(payload?.roles) ? payload.roles : [];
    templates = Array.isArray(payload?.templates) ? payload.templates : [];
    isAdmin = payload?.is_admin === true || roles.includes("admin");
  } catch {
    // se não decodificar, deixamos fallback no response do login
  }

  return { roles, templates, nome, isAdmin };
}

export default function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");

  const login = async (email, senha) => {
    setErro("");
    setIsLoading(true);

    try {
      if (!email || !senha) throw new Error("Preencha email e palavra-passe.");

      // Login via rota pública (sem /api)
      const res = await publicApi.post("/users/login", {
        user_email: String(email || "").trim(),
        user_senha: String(senha || "")
      });

      const token = res?.data?.token;
      if (!token) throw new Error("Token não recebido.");

      // 1) Decodifica o token
      let { roles, templates, nome, isAdmin } = parseToken(token);

      // 2) Fallback: caso backend retorne arrays em paralelo
      if (roles.length === 0 && Array.isArray(res.data?.roles)) roles = res.data.roles;
      if (templates.length === 0 && Array.isArray(res.data?.templates)) templates = res.data.templates;
      if (!nome && typeof res.data?.user_nome === "string") nome = res.data.user_nome;
      isAdmin = isAdmin || roles.includes("admin");

      // 3) Deriva capacidades a partir dos templates
      const capsSet = deriveCapsFromTemplates(templates);

      // 4) Admin ganha acesso a relatórios no client (rota /relatorios)
      if (isAdmin) capsSet.add("relatorio:visualizar");

      // 5) Persiste sessão
      localStorage.setItem("token", token);
      localStorage.setItem("user_nome", nome || "Utilizador");
      localStorage.setItem("roles", JSON.stringify(roles));
      localStorage.setItem("templates", JSON.stringify(templates));
      localStorage.setItem("caps", JSON.stringify(Array.from(capsSet)));
      localStorage.setItem("lastLoginAt", String(Date.now()));

      // 6) Notifica UI (Sidebar/Header/Routes escutam "auth:changed")
      window.dispatchEvent(new Event("auth:changed"));

      return { ok: true, roles, templates, caps: Array.from(capsSet), nome };
    } catch (err) {
      let msg = "Erro ao fazer login.";
      if (err?.response) {
        msg = err.response?.data?.message || `Erro ${err.response.status}: ${err.response.statusText}`;
      } else if (err?.request) {
        msg = "Sem resposta do servidor.";
      } else if (err?.message) {
        msg = err.message;
      }
      setErro(msg);
      return { ok: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const logoutLocal = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_nome");
    localStorage.removeItem("roles");
    localStorage.removeItem("templates");
    localStorage.removeItem("caps");
    localStorage.removeItem("lastLoginAt");
    window.dispatchEvent(new Event("auth:changed"));
  };

  return { login, logoutLocal, isLoading, erro };
}
