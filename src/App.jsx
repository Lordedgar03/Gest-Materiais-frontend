import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Instância centralizada e eventos (garanta que existam em ./services/api.js)
import api, { authEvents, getToken } from './services/api'

import Sidebar from './components/Sidebar'
import Header from './components/header'
import AppRoutes from './routes/routes'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken())

  const location = useLocation()
  const navigate = useNavigate()
  const isLoginPage = location.pathname === '/login'

  useEffect(() => {
    // Auto-logout vindo dos interceptors da API
    const unsubscribeLogout = authEvents?.onLogout?.(() => {
      setIsAuthenticated(false)
      if (!isLoginPage) navigate('/login', { replace: true })
    }) ?? (() => {})

    // Sincroniza auth entre abas (token no localStorage)
    const onStorage = (e) => {
      if (e.key === 'token') {
        const logged = !!e.newValue
        setIsAuthenticated(logged)
        if (!logged && !isLoginPage) navigate('/login', { replace: true })
      }
    }

    window.addEventListener('storage', onStorage)

    // Sync inicial (reload)
    setIsAuthenticated(!!getToken())

    return () => {
      unsubscribeLogout()
      window.removeEventListener('storage', onStorage)
    }
  }, [isLoginPage, navigate])

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar/Header ocultos no login */}
      {!isLoginPage && <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />}

      <div className="flex-1 overflow-auto">
        {!isLoginPage && <Header />}

        <div className="p-4">
          <AppRoutes
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
          />
        </div>
      </div>
    </div>
  )
}

// Reexporta a instância para compatibilidade
export { api }
