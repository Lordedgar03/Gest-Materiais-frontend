// src/routes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { jwtDecode } from "jwt-decode";


// lazy-loading (opcional, melhora performance em produção)
const Dashboard         = lazy(() => import("../pages/Dashboard"));
const Categories        = lazy(() => import("../pages/Categories"));
const Types             = lazy(() => import("../pages/Types"));
const Materials         = lazy(() => import("../pages/Materials"));
const Movements         = lazy(() => import("../pages/Movements"));
const Reports           = lazy(() => import("../pages/Reports"));
const UsersPage         = lazy(() => import("../pages/Users"));
const MaterialsRecycle  = lazy(() => import("../pages/MaterialsRecycle"));
const Ajuda             = lazy(() => import("../pages/Ajuda"));
const Perfil            = lazy(() => import("../pages/Perfil"));
const Login             = lazy(() => import("../pages/Login"));
const Requisitions      = lazy(() => import("../pages/Requisitions"));
const Caixa            = lazy(() => import("../pages/Caixa"));
const PDV             = lazy(() => import("../pages/PDV"));
const Vendas      = lazy(() => import("../pages/Vendas"));

// valida JWT (expiração)
// eslint-disable-next-line react-refresh/only-export-components
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

export default function AppRoutes({ isAuthenticated, setIsAuthenticated }) {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-gray-600">
          Carregando…
        </div>
      }
    >
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />

        {/* Protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categorias"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Categories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tipos"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Types />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materiais"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Materials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requisicoes"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Requisitions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movimentos"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Movements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/relatorios"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/utilizadores"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        {/* se tiver a página de recibos, descomente e importe:
        <Route
          path="/recibos"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Receipts />
            </ProtectedRoute>
          }
        />
        */}
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
        <Route
          path="/materials-recycle"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MaterialsRecycle />
            </ProtectedRoute>
          }
        />
        {/*novo vendas */}
        <Route
          path="/vendas"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Vendas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pdv"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <PDV />
            </ProtectedRoute>
          }
        /><Route
          path="/caixa"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Caixa />
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
