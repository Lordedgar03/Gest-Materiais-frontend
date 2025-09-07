/* eslint-disable react-refresh/only-export-components */
// src/routes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { jwtDecode } from "jwt-decode";

/* ========== Lazy pages ========== */
const Dashboard     = lazy(() => import("../pages/Dashboard"));
const Categories    = lazy(() => import("../pages/Categories"));
const Types         = lazy(() => import("../pages/Types"));
const Materials     = lazy(() => import("../pages/Materials"));
const Movements     = lazy(() => import("../pages/Movements"));
const Reports       = lazy(() => import("../pages/Reports"));
const UsersPage     = lazy(() => import("../pages/Users"));
const Requisitions  = lazy(() => import("../pages/Requisitions"));
const Caixa         = lazy(() => import("../pages/Caixa"));
const PDV           = lazy(() => import("../pages/PDV"));
const Vendas        = lazy(() => import("../pages/Vendas"));

/** Novas páginas do módulo Almoço */
const Almoco        = lazy(() => import("../pages/Almoco"));
const Alunos        = lazy(() => import("../pages/Alunos"));
const Marcacoes     = lazy(() => import("../pages/Marcacoes"));
const Configuracoes = lazy(() => import("../pages/Configuracoes"));

const Ajuda         = lazy(() => import("../pages/Ajuda"));
const Perfil        = lazy(() => import("../pages/Perfil"));
const Login         = lazy(() => import("../pages/Login"));

/* ========== Auth helpers ========== */
export function isTokenValid() {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const { exp } = jwtDecode(token);
    return typeof exp === "number" ? exp * 1000 > Date.now() : true;
  } catch {
    return false;
  }
}

function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/** Constrói capacidades a partir do token (igual ao Sidebar) */
const TEMPLATE_TO_CAPS = {
  baseline: [
    { module: "dashboard", action: "visualizar" },
    { module: "relatorios", action: "visualizar" },
    { module: "categorias", action: "visualizar" },
    { module: "tipos", action: "visualizar" },
    { module: "materiais", action: "visualizar" },
    { module: "movimentacoes", action: "visualizar" },
    { module: "requisicoes", action: "visualizar" },
    { module: "venda", action: "visualizar" },   // dá acesso a Vendas/PDV/Caixa/Almoço/Alunos/Marcações/Configurações (front)
    { module: "recibo", action: "visualizar" },
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
  manage_sales: [
    { module: "venda", action: "visualizar" },
    { module: "venda", action: "criar" },
    { module: "venda", action: "eliminar" },
    { module: "recibo", action: "visualizar" },
  ],
};

function getAuthzFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return { isAdmin: false, caps: new Set() };
  try {
    const decoded = jwtDecode(token);
    const roles = Array.isArray(decoded?.roles) ? decoded.roles : [];
    const isAdmin = roles.includes("admin");
    const templates = Array.isArray(decoded?.templates) ? decoded.templates : [];
    const caps = new Set();
    templates.forEach((tpl) => {
      const list = TEMPLATE_TO_CAPS[tpl?.template_code] || [];
      list.forEach((c) => caps.add(`${c.module}:${c.action}`));
    });
    return { isAdmin, caps };
  } catch {
    return { isAdmin: false, caps: new Set() };
  }
}

function hasPermission({ isAdmin, caps }, { module, action }) {
  if (isAdmin) return true;
  return caps.has(`${module}:${action}`);
}

function RequirePermission({ children, permission }) {
  const authz = getAuthzFromToken();
  return hasPermission(authz, permission) ? children : <Navigate to="/dashboard" replace />;
}

/* ========== Routes ========== */
export default function AppRoutes({ isAuthenticated, setIsAuthenticated }) {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Carregando…</div>}>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />

        {/* Protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "dashboard", action: "visualizar" }}>
                <Dashboard />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "dashboard", action: "visualizar" }}>
                <Dashboard />
              </RequirePermission>
            </ProtectedRoute>
          }
        />

        <Route
          path="/categorias"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "categorias", action: "visualizar" }}>
                <Categories />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tipos"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "tipos", action: "visualizar" }}>
                <Types />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/materiais"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "materiais", action: "visualizar" }}>
                <Materials />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/requisicoes"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "requisicoes", action: "visualizar" }}>
                <Requisitions />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/movimentos"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "movimentacoes", action: "visualizar" }}>
                <Movements />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/relatorios"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "relatorios", action: "visualizar" }}>
                <Reports />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/utilizadores"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "utilizador", action: "visualizar" }}>
                <UsersPage />
              </RequirePermission>
            </ProtectedRoute>
          }
        />

        {/* Vendas & Caixa */}
        <Route
          path="/vendas"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "venda", action: "visualizar" }}>
                <Vendas />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pdv"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "venda", action: "visualizar" }}>
                <PDV />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/caixa"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "venda", action: "visualizar" }}>
                <Caixa />
              </RequirePermission>
            </ProtectedRoute>
          }
        />

        {/* Módulo Almoço (tudo sob permissão "venda:visualizar") */}
        <Route
          path="/almoco"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "venda", action: "visualizar" }}>
                <Almoco />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/alunos"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "venda", action: "visualizar" }}>
                <Alunos />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marcacoes"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "venda", action: "visualizar" }}>
                <Marcacoes />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RequirePermission permission={{ module: "venda", action: "visualizar" }}>
                <Configuracoes />
              </RequirePermission>
            </ProtectedRoute>
          }
        />

        {/* Sistema */}
        <Route
          path="/ajuda"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Ajuda />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Perfil />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Suspense>
  );
}
