import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

import Sidebar from './components/Sidebar';
import Receipts from './components/receipts';
import Header from "./components/header";

import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Types from './pages/Types';
import Materials from './pages/Materials';
import Movements from './pages/Movements';
import Reports from './pages/Reports';
import UsersPage from './pages/Users';
import MaterialsRecycle from './pages/MaterialsRecycle';
import Ajuda from "./pages/Ajuda";
import Perfil from "./pages/Perfil";
import Login from './pages/Login';
import Requisitions from './pages/Requisitions';


// Configuração base do Axios
const api = axios.create({
	baseURL: 'http://localhost:3000/api',
});

function LayoutPrivado() {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
	const location = useLocation();
	const navigate = useNavigate();
	const isLoginPage = location.pathname === "/login";

	// Define a função com useCallback
	const handleAutoLogout = useCallback(() => {
		localStorage.removeItem("token");
		localStorage.removeItem("user_nome");
		localStorage.removeItem("permissoes");
		setIsAuthenticated(false);
		if (!isLoginPage) {
			navigate("/login");
		}
		console.log("Sessão expirada. Por favor, faça login novamente.");
	}, [navigate, isLoginPage]);

	// Configura os interceptors do Axios
	useEffect(() => {
		const requestInterceptor = api.interceptors.request.use(config => {
			const token = localStorage.getItem("token");
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}
			return config;
		});

		const responseInterceptor = api.interceptors.response.use(
			response => response,
			error => {
				if (error.response?.status === 401) {
					handleAutoLogout();
				}
				return Promise.reject(error);
			}
		);

		return () => {
			api.interceptors.request.eject(requestInterceptor);
			api.interceptors.response.eject(responseInterceptor);
		};
	}, [handleAutoLogout]);

	// Verificação periódica do token
	useEffect(() => {
		if (isLoginPage) return;

		const checkTokenExpiration = () => {
			const token = localStorage.getItem("token");
			if (!token) {
				handleAutoLogout();
				return;
			}

			try {
				const decoded = jwtDecode(token);
				if (decoded.exp * 1000 < Date.now()) {
					handleAutoLogout();
				}
			} catch (error) {
				console.error("Erro ao decodificar token:", error);
				handleAutoLogout();
			}
		};

		checkTokenExpiration();
		const interval = setInterval(checkTokenExpiration, 60000);

		return () => clearInterval(interval);
	}, [handleAutoLogout, isLoginPage]);

	// Componente para rotas protegidas
	const ProtectedRoute = ({ children }) => {
		if (!isAuthenticated) {
			return <Navigate to="/login" replace />;
		}
		return children;
	};

	return (
		<div className="flex h-screen bg-gray-100">
			{!isLoginPage && <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />}

			<div className="flex-1 overflow-auto">
				{!isLoginPage && <Header />}

				<div className="p-4">
					<Routes>
						<Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />

						<Route path="/" element={
							<ProtectedRoute>
								<Dashboard />
							</ProtectedRoute>
						} />

						<Route path="/dashboard" element={
							<ProtectedRoute>
								<Dashboard />
							</ProtectedRoute>
						} />

						{/* Demais rotas protegidas */}
						<Route path="/categorias" element={
							<ProtectedRoute>
								<Categories />
							</ProtectedRoute>
						} />

						<Route path="/tipos" element={
							<ProtectedRoute>
								<Types />
							</ProtectedRoute>
						} />

						<Route path="/materiais" element={
							<ProtectedRoute>
								<Materials />
							</ProtectedRoute>
						} />
						<Route path="/requisicoes" element={
							<ProtectedRoute>
								<Requisitions />
							</ProtectedRoute>
						} />
						<Route path="/movimentos" element={
							<ProtectedRoute>
								<Movements />
							</ProtectedRoute>
						} />

						<Route path="/relatorios" element={
							<ProtectedRoute>
								<Reports />
							</ProtectedRoute>
						} />

						<Route path="/utilizadores" element={
							<ProtectedRoute>
								<UsersPage />
							</ProtectedRoute>
						} />

						<Route path="/recibos" element={
							<ProtectedRoute>
								<Receipts />
							</ProtectedRoute>
						} />

						<Route path="/ajuda" element={
							<ProtectedRoute>
								<Ajuda />
							</ProtectedRoute>
						} />

						<Route path="/perfil" element={
							<ProtectedRoute>
								<Perfil />
							</ProtectedRoute>
						} />

						<Route path="/MaterialsRecycle" element={
							<ProtectedRoute>
								<MaterialsRecycle />
							</ProtectedRoute>
						} />
					</Routes>
				</div>
			</div>
		</div>
	);
}

export { api };
export default LayoutPrivado;