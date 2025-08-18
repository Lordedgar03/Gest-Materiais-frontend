import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  UserCircle2,
  LogOut,
  HelpCircle,
  User,
} from "lucide-react";

function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // Simulação do nome do usuário autenticado (pode vir do localStorage ou API)
  const userName = localStorage.getItem("user_nome") || "Utilizador";

  // Função para fazer logout
  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/users/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        // Limpa os dados do usuário do localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user_nome");
        // Redireciona para a página de login
        navigate("/login");
      } else {
        console.error("Falha ao fazer logout");
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

 
  useEffect(() => {
    function handleClickOutside(e) {
      if (!userMenuRef.current?.contains(e.target)) setShowUserMenu(false);
      if (!notifRef.current?.contains(e.target)) setShowNotifications(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between border-b">
      <div className="text-2xl font-bold text-[#5548D9]">
        Gestão de Materiais
      </div>
      <div className="flex items-center gap-4">
        {/* Notificações */}
        <div className="relative" ref={notifRef}>
          <button
            className="relative text-gray-600 hover:text-[#6C63FF]"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notificações"
          >
            <Bell size={24} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 max-h-72 overflow-y-auto bg-white border rounded-lg shadow-lg z-50">
              <ul className="text-sm text-gray-700 divide-y">
                {notifications.length === 0 ? (
                  <li className="px-4 py-3 text-center text-gray-400">
                    Sem notificações
                  </li>
                ) : (
                  notifications.map((notif, i) => (
                    <li key={i} className="px-4 py-2 hover:bg-gray-50">
                      <p className="font-medium">{notif.titulo}</p>
                      <p className="text-xs text-gray-500">{notif.mensagem}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Nome do utilizador */}
        <span className="hidden sm:block font-medium text-gray-700">
          Olá, <span className="text-[#5548D9] font-semibold">{userName}</span>
        </span>

        {/* Menu do utilizador */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="text-gray-600 hover:text-[#6C63FF]"
            title="Menu do utilizador"
          >
            <UserCircle2 size={30} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
              <ul className="text-sm text-gray-700">
                <li className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
                  <HelpCircle size={16} />
                  <Link to="/ajuda" className="w-full block">Ajuda</Link>
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
                  <User size={16} />
                  <Link to="/perfil" className="w-full block">Perfil</Link>
                </li>
                <li 
                  className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span className="w-full block">Sair</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;