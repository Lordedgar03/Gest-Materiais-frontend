import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AppRoutes, { isTokenValid } from "./routes/routes";

export default function AppLayout() {
  const { pathname } = useLocation();
  const isLoginPage = pathname === "/login";

  const [isAuthenticated, setIsAuthenticated] = useState(() => isTokenValid());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // sync token across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") setIsAuthenticated(isTokenValid());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // periodic token check (except login)
  useEffect(() => {
    if (isLoginPage) return;
    const id = setInterval(() => setIsAuthenticated(isTokenValid()), 60000);
    return () => clearInterval(id);
  }, [isLoginPage]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {!isLoginPage && <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />}
      <div className="flex-1 overflow-auto">
        {!isLoginPage && <Header />}
        <div className="p-4">
          <AppRoutes isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        </div>
      </div>
    </div>
  );
}
