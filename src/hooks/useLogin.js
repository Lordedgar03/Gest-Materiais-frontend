// useLogin.js
import { useState } from "react"
import axios from "axios"
import { jwtDecode } from "jwt-decode"

// IMPORTANTE: login é no gateway público (sem /api)
const publicApi = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000,
  headers: { "Content-Type": "application/json" }
})

export default function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [erro, setErro] = useState("")

  const login = async (email, senha) => {
    setErro("")
    setIsLoading(true)

    try {
      if (!email || !senha) throw new Error("Preencha email e palavra-passe.")

      const res = await publicApi.post("/users/login", {
        user_email: String(email || "").trim(),
        user_senha: String(senha || "")
      })

      const token = res?.data?.token
      if (!token) throw new Error("Token não recebido.")

      // Decodifica para extrair nome e claims úteis
      let nome = "Utilizador"
      try {
        const payload = jwtDecode(token)
        if (payload?.user_nome) nome = payload.user_nome
      } catch { /* ok, usa fallback */ }

      // Persiste de forma simples (o interceptor do api privado lê daqui)
      localStorage.setItem("token", token)
      localStorage.setItem("user_nome", JSON.stringify(nome))
      if (Array.isArray(res.data?.templates)) {
        localStorage.setItem("permissoes", JSON.stringify(res.data.templates))
      } else {
        localStorage.removeItem("permissoes")
      }

      return { ok: true }
    } catch (err) {
      let msg = "Erro ao fazer login."
      if (err?.response) {
        msg = err.response?.data?.message || `Erro ${err.response.status}: ${err.response.statusText}`
      } else if (err?.request) {
        msg = "Sem resposta do servidor."
      } else if (err?.message) {
        msg = err.message
      }
      setErro(msg)
      return { ok: false, error: msg }
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading, erro }
}
