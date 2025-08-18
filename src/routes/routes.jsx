import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

// Lazy loading para code-splitting (carrega páginas sob demanda)
const Dashboard = lazy(() => import('../pages/Dashboard'))
const Categories = lazy(() => import('../pages/categorias/Categories'))
const Types = lazy(() => import('../pages/tipos/Types'))
const Materials = lazy(() => import('../pages/materiais/Materials'))
const Movements = lazy(() => import('../pages/movimentos/Movements'))
const Reports = lazy(() => import('../pages/Reports'))
const UsersPage = lazy(() => import('../pages/user/Users'))
const MaterialsRecycle = lazy(() => import('../pages/MaterialsRecycle'))
const Ajuda = lazy(() => import('../pages/Ajuda'))
const Perfil = lazy(() => import('../pages/Perfil'))
const Login = lazy(() => import('../pages/login/Login'))
const Requisitions = lazy(() => import('../pages/requisicao/Requisitions'))
const Receipts = lazy(() => import('../components/receipts'))

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function AppRoutes({ isAuthenticated, setIsAuthenticated }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 text-gray-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando…
        </div>
      }
    >
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />

        {/* Rotas protegidas */}
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

        <Route
          path="/recibos"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Receipts />
            </ProtectedRoute>
          }
        />

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

        {/* Mantém o caminho com a mesma capitalização usada no projeto */}
        <Route
          path="/MaterialsRecycle"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MaterialsRecycle />
            </ProtectedRoute>
          }
        />

        {/* 404 → redireciona para o dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
