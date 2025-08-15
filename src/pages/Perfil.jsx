import { useEffect, useState } from "react";
import { User } from "lucide-react";

function Perfil() {
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    async function fetchPerfil() {
      const res = await fetch("https://api.exemplo.com/perfil");
      const data = await res.json();
      setPerfil(data);
    }
    fetchPerfil();
  }, []);

  if (!perfil) return <p className="p-4">Carregando perfil...</p>;

  return (
    <div className="p-4">
      <h2 className="flex items-center text-xl font-semibold mb-4 gap-2">
        <User /> Perfil
      </h2>
      <div className="space-y-2">
        <p><strong>Nome:</strong> {perfil.nome}</p>
        <p><strong>Email:</strong> {perfil.email}</p>
        <p><strong>Tipo:</strong> {perfil.tipo}</p>
      </div>
    </div>
  );
}

export default Perfil;
