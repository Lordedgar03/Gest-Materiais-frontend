import { useState } from "react";
import axios from "axios";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Configuração do Axios
const api = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setIsLoading(true);

    try {
      // Validação básica do cliente
      if (!email || !senha) {
        throw new Error("Por favor, preencha todos os campos");
      }

      const res = await api.post("/users/login", {
        user_email: email,
        user_senha: senha,
      });

      if (!res.data?.token) {
        throw new Error("Token não recebido na resposta");
      }

      // Armazenamento seguro
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user_nome", JSON.stringify(res.data.user?.nome || "Usuário"));
      localStorage.setItem("permissoes", JSON.stringify(res.data.permissoes || []));
      
      // Atualiza o estado de autenticação
      setIsAuthenticated(true);
      navigate("/dashboard", { replace: true });
      window.location.reload(); // Garante atualização completa do estado
    } catch (err) {
      // Tratamento de erro aprimorado
      let errorMessage = "Erro ao fazer login";
      
      if (err.response) {
        errorMessage = err.response.data?.message || 
                     `Erro ${err.response.status}: ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage = "Sem resposta do servidor - verifique sua conexão";
      } else {
        errorMessage = err.message;
      }
      
      console.error("Erro no login:", err);
      setErro(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/2 bg-cover bg-center bg-gray-600">
        <img 
          src="./info11.png" 
          alt="Imagem login" 
          className="h-full w-full object-cover" 
        />
      </div>

      <div className="w-1/2 flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-10 rounded shadow-lg w-full max-w-md"
        >
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            Login
          </h2>

          <div className="mb-4 relative">
            <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="email"
              placeholder="Email"
              className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="mb-4 relative">
            <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Palavra-passe"
              className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {erro && (
            <div className="text-red-600 text-sm mb-4 text-center">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 rounded flex items-center justify-center gap-2 ${
              isLoading ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Processando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;