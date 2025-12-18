// src/hooks/useLogin.js
import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { publicApi } from "../api"; // cliente público (sem /api no caminho base)

const TEMPLATE_TO_CAPS = {
  baseline: [
    
    { module: "movimentacao", action: "visualizar" },
    { module: "requisicao",   action: "visualizar" },
    
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
   // { module: "requisicao",   action: "visualizar" },
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
    const code = t?.template_code || t; // suporta objeto {template_code} ou string "baseline"
    const list = TEMPLATE_TO_CAPS[code] || [];
    list.forEach(({ module, action }) => {
      caps.add(`${module}:${action}`);
    });
  });

  return caps;
}

/** Lê dados úteis diretamente do JWT gerado pelo backend */
function parseToken(token) {
  let userId = null;
  let nome = "Utilizador";
  let roles = [];
  let templates = [];
  let expMs = null; // timestamp em milissegundos
  let isAdmin = false;

  try {
    const payload = jwtDecode(token) || {};

    if (payload.user_id != null) {
      userId = payload.user_id;
    }

    if (payload?.user_nome || payload?.nome || payload?.name) {
      nome = payload.user_nome || payload.nome || payload.name;
    }

    if (Array.isArray(payload.roles)) {
      roles = payload.roles;
    }

    if (Array.isArray(payload.templates)) {
      templates = payload.templates;
    }

    if (typeof payload.exp === "number") {
      expMs = payload.exp * 1000; // exp é em segundos no JWT
    }

    isAdmin = roles.includes("admin");
  } catch {
    // se der erro ao decodificar, vamos usar o fallback da resposta do login
  }

  return { userId, nome, roles, templates, expMs, isAdmin };
}

export default function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");

  const login = async (email, senha) => {
    setErro("");
    setIsLoading(true);

    try {
      if (!email || !senha) {
        throw new Error("Preencha email e palavra-passe.");
      }

      // Backend: loginUser.rest = "POST /users/login" no serviço users
      const res = await publicApi.post("/users/login", {
        user_email: String(email || "").trim(),
        user_senha: String(senha || ""),
      });

      const token = res?.data?.token;
      if (!token) {
        throw new Error("Token não recebido.");
      }

      // 1) Decodifica o token de acordo com o backend
      let {
        userId,
        nome: nomeFromToken,
        roles: rolesFromToken,
        templates: templatesFromToken,
        expMs,
        isAdmin: isAdminFromToken,
      } = parseToken(token);

      let nome = nomeFromToken;
      let roles = rolesFromToken;
      let templates = templatesFromToken;
      let isAdmin = isAdminFromToken;

      // 2) Fallback: caso algum campo venha apenas no body
      // Backend loginUser também devolve: { token, roles, templates }
      if (roles.length === 0 && Array.isArray(res.data?.roles)) {
        roles = res.data.roles;
      }

      if (templates.length === 0 && Array.isArray(res.data?.templates)) {
        templates = res.data.templates;
      }

      if (!nome && typeof res.data?.user_nome === "string") {
        nome = res.data.user_nome;
      }

      // Garante flag de admin
      isAdmin = isAdmin || roles.includes("admin");

      // 3) Deriva capacidades a partir dos templates (lado do client, só para UI)
      const capsSet = deriveCapsFromTemplates(templates);

      // 4) Admin ganha acesso aos relatórios no client
      if (isAdmin) {
        capsSet.add("relatorio:visualizar");
      }

      // 5) Persiste sessão no localStorage
      localStorage.setItem("token", token);
      if (userId != null) {
        localStorage.setItem("user_id", String(userId));
      }
      localStorage.setItem("user_nome", nome || "Utilizador");
      localStorage.setItem("roles", JSON.stringify(roles || []));
      localStorage.setItem("templates", JSON.stringify(templates || []));
      localStorage.setItem("caps", JSON.stringify(Array.from(capsSet)));
      localStorage.setItem("lastLoginAt", String(Date.now()));
      if (expMs != null) {
        localStorage.setItem("token_exp", String(expMs));
      }

      // 6) Notifica UI (Sidebar/Header/Routes escutam "auth:changed")
      window.dispatchEvent(new Event("auth:changed"));

      return {
        ok: true,
        userId,
        nome,
        roles,
        templates,
        caps: Array.from(capsSet),
        isAdmin,
        tokenExp: expMs,
      };
    } catch (err) {
      let msg = "Erro ao fazer login.";

      if (err?.response) {
        // moleculer-web costuma mandar { message, name, code, type, data... }
        msg =
          err.response?.data?.message ||
          `Erro ${err.response.status}: ${err.response.statusText}`;
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
    // apenas limpa o lado do client; o logout do backend (blacklist) pode ser chamado noutro ponto
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_nome");
    localStorage.removeItem("roles");
    localStorage.removeItem("templates");
    localStorage.removeItem("caps");
    localStorage.removeItem("lastLoginAt");
    localStorage.removeItem("token_exp");

    window.dispatchEvent(new Event("auth:changed"));
  };

  return { login, logoutLocal, isLoading, erro };
}
