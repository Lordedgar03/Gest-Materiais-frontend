// Crie um arquivo api.js ou similar para configurar suas requisições
import axios from 'axios';
import { navigate } from 'react-router-dom';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Token inválido ou expirado
      handleAutoLogout();
    }
    return Promise.reject(error);
  }
);

const handleAutoLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user_nome");
  navigate("/login");
  // Opcional: mostrar uma mensagem ao usuário
  alert("Sua sessão expirou. Por favor, faça login novamente.");
};

export default api;