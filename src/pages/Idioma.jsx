import { useState } from "react";
import { Globe } from "lucide-react";

function Idioma() {
  const [idiomaSelecionado, setIdiomaSelecionado] = useState("pt");

  const idiomas = [
    { nome: "Português", sigla: "pt" },
    { nome: "Inglês", sigla: "en" },
    { nome: "Francês", sigla: "fr" },
    { nome: "Espanhol", sigla: "es" },
    { nome: "Alemão", sigla: "de" },
  ];

  const handleChange = (e) => {
    const sigla = e.target.value;
    setIdiomaSelecionado(sigla);
    // Aqui você pode disparar a mudança de idioma real, se quiser
    console.log("Idioma selecionado:", sigla);
  };

  return (
    <div className="p-4">
      <h2 className="flex items-center text-xl font-semibold mb-4 gap-2">
        <Globe /> Idioma
      </h2>

      <label htmlFor="idioma" className="block mb-2 text-gray-700">
        Escolha o idioma:
      </label>
      <select
        id="idioma"
        value={idiomaSelecionado}
        onChange={handleChange}
        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
      >
        {idiomas.map((idioma) => (
          <option key={idioma.sigla} value={idioma.sigla}>
            {idioma.nome}
          </option>
        ))}
      </select>

      <p className="mt-4 text-sm text-gray-600">
        Idioma atual selecionado: <strong>{idiomaSelecionado.toUpperCase()}</strong>
      </p>
    </div>
  );
}

export default Idioma;
