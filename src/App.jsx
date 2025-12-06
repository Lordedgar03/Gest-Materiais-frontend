// src/App.jsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/header";

import AppRoutes, { isTokenValid } from "./routes/routes";

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  // estado de auth baseado no token
  const [isAuthenticated, setIsAuthenticated] = useState(() => isTokenValid());

  // escuta mudanças do token (outra aba)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") setIsAuthenticated(isTokenValid());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // checagem periódica leve (60s) – exceto na página de login
  useEffect(() => {
    if (isLoginPage) return;
    const id = setInterval(() => setIsAuthenticated(isTokenValid()), 60000);
    return () => clearInterval(id);
  }, [isLoginPage]);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100">
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
  );
}
