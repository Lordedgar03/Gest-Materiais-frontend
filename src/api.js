// src/api.js
import axios from "axios"

const api = axios.create({ baseURL: "http://localhost:3000/api" })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  console.log(token)
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user_nome")
      // redireciona de forma limpa (sem loops)
      if (window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    }
    return Promise.reject(error)
  }
)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user_nome");
      if (window.location.pathname !== "/login") window.location.assign("/login");
    } else if (status === 403) {
      console.warn("Sem permissão para esta ação.");
      // TODO: mostrar toast/snackbar
    }
    return Promise.reject(error);
  }
);

export default api
