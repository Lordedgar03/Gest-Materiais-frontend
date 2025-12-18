import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/";

// Cliente público (sem /api)
export const publicApi = axios.create({
  baseURL:`${ API_URL }/`,
});

// Cliente autenticado (/api)
const api = axios.create({
  baseURL: `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user_nome");
      localStorage.removeItem("roles");
      localStorage.removeItem("caps");
      localStorage.removeItem("templates");
      if (window.location.pathname !== "/login")
        window.location.assign("/login");
    } else if (status === 403) {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "error", message: "Sem permissão para esta ação." },
        })
      );
    }
    return Promise.reject(error);
  }
);

export default api;

export const Auth = {
  login: (payload) => publicApi.post("users/login", payload),
  logout: () => api.post("/users/logout"),
};
