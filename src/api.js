// src/api.js
import axios from "axios"

// ==== Cliente público: rotas sem /api (ex.: POST /users/login) ====
export const publicApi = axios.create({
  baseURL: "http://localhost:3000/",
})

// ==== Cliente autenticado: /api ====
const api = axios.create({
  baseURL: "http://localhost:3000/api",
})

// Injeta Bearer automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handler único de erros
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user_nome")
      localStorage.removeItem("roles")
      localStorage.removeItem("caps")
      localStorage.removeItem("templates")
      if (window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    } else if (status === 403) {
      window.dispatchEvent(new CustomEvent("toast", {
        detail: { type: "error", message: "Sem permissão para esta ação." }
      }))
    }
    return Promise.reject(error)
  }
)

export default api

// Conveniência de autenticação
export const Auth = {
  login: (payload) => publicApi.post("users/login", payload), // rota pública (sem /api)
  logout: () => api.post("/users/logout"),
}
