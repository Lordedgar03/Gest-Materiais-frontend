"use client"

import { useState, useRef } from "react"
import AutoHideSidebar from "../Sidebar"

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const mainContentRef = useRef(null)

  // Função para lidar com o scroll e auto-hide
  const handleMainScroll = (event) => {
    // Buscar o handler de scroll do sidebar
    const scrollHandler = document.querySelector("[data-scroll-handler]")
    if (scrollHandler && scrollHandler.dataset.autoHideEnabled === "true") {
      // Simular o evento de scroll para o handler do sidebar
      const handler = scrollHandler.dataset.scrollHandler
      if (typeof handler === "function") {
        handler(event)
      }
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AutoHideSidebar open={sidebarOpen} setOpen={setSidebarOpen} autoHideOnScroll={true} />

      <main ref={mainContentRef} onScroll={handleMainScroll} className="flex-1 overflow-auto">
        {/* Header responsivo para mobile */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 p-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-xs text-gray-500">Auto-hide ativo • Scroll para testar</p>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conteúdo principal com muito conteúdo para testar scroll */}
        <div className="p-4 sm:p-6 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Auto-Hide Sidebar</h1>
            <div className="space-y-4">
              <p className="text-gray-600">Sidebar com auto-hide implementado! Funcionalidades incluem:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  <strong>Auto-hide em mobile:</strong> Sidebar esconde automaticamente ao fazer scroll para baixo
                </li>
                <li>
                  <strong>Auto-show:</strong> Sidebar aparece ao fazer scroll para cima rapidamente
                </li>
                <li>
                  <strong>Timeout inteligente:</strong> Sidebar aparece após 2 segundos sem scroll (se próximo ao topo)
                </li>
                <li>
                  <strong>Debounce:</strong> Evita chamadas excessivas durante o scroll
                </li>
                <li>
                  <strong>Threshold:</strong> Só ativa após scroll de 100px para baixo
                </li>
                <li>
                  <strong>Configurável:</strong> Pode ser ativado/desativado via prop
                </li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Como Testar</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>1. Abra em um dispositivo móvel ou redimensione a janela para menos de 768px</p>
                  <p>2. Faça scroll para baixo para ver o sidebar desaparecer</p>
                  <p>3. Faça scroll para cima rapidamente para ver o sidebar aparecer</p>
                  <p>4. Pare de fazer scroll próximo ao topo e aguarde 2 segundos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo adicional para testar scroll */}
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Seção {i + 1}</h2>
              <p className="text-gray-600 mb-4">
                Este é um conteúdo de exemplo para testar a funcionalidade de auto-hide do sidebar. Faça scroll para
                baixo em um dispositivo móvel para ver o sidebar desaparecer automaticamente.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Funcionalidade {i + 1}A</h3>
                  <p className="text-sm text-gray-600">
                    Descrição da funcionalidade que demonstra como o conteúdo se adapta quando o sidebar está visível ou
                    oculto.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Funcionalidade {i + 1}B</h3>
                  <p className="text-sm text-gray-600">
                    Mais conteúdo para demonstrar a responsividade e o comportamento do auto-hide em diferentes
                    situações de scroll.
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Seção final */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-3">Final do Conteúdo</h2>
            <p className="mb-4">
              Você chegou ao final! Agora faça scroll para cima para ver o sidebar aparecer novamente automaticamente.
            </p>
            <button
              onClick={() => {
                if (mainContentRef.current) {
                  mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" })
                }
              }}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Voltar ao Topo
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
