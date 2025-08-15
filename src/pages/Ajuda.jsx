import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";

function Ajuda() {
  const [ajudas, setAjudas] = useState([]);

  useEffect(() => {
    async function fetchAjuda() {
      const res = await fetch("https://api.exemplo.com/ajuda");
      const data = await res.json();
      setAjudas(data);
    }
    fetchAjuda();
  }, []);

  return (
    <div className="p-4">
      <h2 className="flex items-center text-xl font-semibold mb-4 gap-2">
        <HelpCircle /> Ajuda
      </h2>
      <ul className="space-y-2">
        {ajudas.map((item, index) => (
          <li key={index} className="border p-3 rounded shadow-sm">
            <p className="font-medium">{item.pergunta}</p>
            <p className="text-sm text-gray-600">{item.resposta}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Ajuda;
