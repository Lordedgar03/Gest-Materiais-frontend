import { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

/** API pública (sem /api) */
const publicApi = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000,
  headers: { "Content-Type": "application/json" }
});

/**
 * Templates → capacidades (module:action)
 * NOTA: dashboard/relatorios/recibo ficam fora por padrão (admin-only no client)
 */
const TEMPLATE_TO_CAPS = {
  baseline: [
    { module: "ajuda", action: "visualizar" },
    { module: "requisicoes", action: "visualizar" }, // se quiser manter como no Sidebar/Routes
  ],
  manage_category: [
    { module: "categorias", action: "visualizar" },
    { module: "categorias", action: "criar" },
    { module: "categorias", action: "editar" },
    { module: "categorias", action: "eliminar" },

    { module: "tipos", action: "visualizar" },
    { module: "tipos", action: "criar" },
    { module: "tipos", action: "editar" },
    { module: "tipos", action: "eliminar" },

    { module: "materiais", action: "visualizar" },
    { module: "materiais", action: "criar" },
    { module: "materiais", action: "editar" },
    { module: "materiais", action: "eliminar" },

    { module: "requisicoes", action: "visualizar" },
    { module: "movimentacoes", action: "visualizar" },
  ],
  manage_users: [
    { module: "utilizador", action: "visualizar" },
    { module: "utilizador", action: "criar" },
    { module: "utilizador", action: "editar" },
    { module: "utilizador", action: "eliminar" },
    { module: "log", action: "visualizar" },
  ],
  // gerir vendas (inclui PDV/Caixa/Vendas + Almoço inteiro via module "venda")
  manage_sales: [
    { module: "venda", action: "visualizar" },
    { module: "venda", action: "criar" },
    { module: "venda", action: "eliminar" },
  ],
};

/** Converte lista de templates -> Set de "module:action" */
function deriveCapsFromTemplates(templates = []) {
  const caps = new Set();
  templates.forEach((t) => {
    const list = TEMPLATE_TO_CAPS[t?.template_code] || [];
    list.forEach((c) => caps.add(`${c.module}:${c.action}`));
  });
  return caps;
}

export default function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");

  const login = async (email, senha) => {
    setErro("");
    setIsLoading(true);

    try {
      if (!email || !senha) throw new Error("Preencha email e palavra-passe.");

      const res = await publicApi.post("/users/login", {
        user_email: String(email || "").trim(),
        user_senha: String(senha || "")
      });

      const token = res?.data?.token;
      if (!token) throw new Error("Token não recebido.");

      // extrai payload
      let nome = "Utilizador";
      let roles = [];
      let templates = [];
      let isAdmin = false;

      try {
        const payload = jwtDecode(token);
        if (payload?.user_nome) nome = payload.user_nome;
        roles = Array.isArray(payload?.roles) ? payload.roles : [];
        templates = Array.isArray(payload?.templates) ? payload.templates : [];
        isAdmin = payload?.is_admin === true || roles.includes("admin");
      } catch {
        roles = Array.isArray(res.data?.roles) ? res.data.roles : [];
        templates = Array.isArray(res.data?.templates) ? res.data.templates : [];
        isAdmin = roles.includes("admin");
      }

      // Se backend devolveu em paralelo, usa como fallback
      if (roles.length === 0 && Array.isArray(res.data?.roles)) roles = res.data.roles;
      if (templates.length === 0 && Array.isArray(res.data?.templates)) templates = res.data.templates;
      isAdmin = isAdmin || roles.includes("admin");

      // Deriva capacidades dos templates
      const capsSet = deriveCapsFromTemplates(templates);

      // ADMIN ganha dashboard/relatorios/recibo no client
      if (isAdmin) {
        ["dashboard:visualizar", "relatorios:visualizar", "recibo:visualizar"].forEach(c => capsSet.add(c));
      }

      // Persistência da sessão
      localStorage.setItem("token", token);
      localStorage.setItem("user_nome", nome);
      localStorage.setItem("roles", JSON.stringify(roles));
      localStorage.setItem("templates", JSON.stringify(templates));
      localStorage.setItem("caps", JSON.stringify(Array.from(capsSet)));
      localStorage.setItem("lastLoginAt", String(Date.now()));

      // Notifica UI (Sidebar/Header/Routes)
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
