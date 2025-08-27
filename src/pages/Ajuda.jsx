"use client"

import { HelpCircle, Shield, LayoutDashboard, PackageCheck, FileText, Users, Settings } from "lucide-react"
import { Link } from "react-router-dom"

export default function Ajuda() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <section className="rounded-xl p-6 bg-white/80 dark:bg-gray-900/70 backdrop-blur border border-gray-100 dark:border-white/10">
        <header className="flex items-center gap-2 mb-4">
          <HelpCircle className="text-indigo-600" aria-hidden />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ajuda & Guia rápido</h1>
        </header>

        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Este sistema permite gerir materiais, categorias, tipos e requisições com base em permissões. Abaixo, um guia rápido das principais áreas.
        </p>

        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <LayoutDashboard className="mt-1 text-indigo-600" aria-hidden />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Dashboard</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Resumo geral de movimentações, estatísticas e distribuição por categoria. Use o botão <b>Atualizar</b> para recarregar dados.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <PackageCheck className="mt-1 text-indigo-600" aria-hidden />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Materiais</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Crie/edite materiais, filtre por categoria/tipo e controle estoque mínimo. Ações de remover unidades e apagar tudo ficam no menu de ações.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Dica: estoques baixos aparecem destacados em <span className="text-rose-600">vermelho</span>.
              </p>
              <Link to="/materiais" className="text-indigo-600 hover:underline text-sm">Ir para Materiais</Link>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <FileText className="mt-1 text-indigo-600" aria-hidden />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Requisições</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Crie requisições com itens. Perfis com permissão podem <b>aprovar/rejeitar/cancelar</b> e também <b>atender/devolver</b> itens.
              </p>
              <Link to="/requisicoes" className="text-indigo-600 hover:underline text-sm">Ir para Requisições</Link>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <Users className="mt-1 text-indigo-600" aria-hidden />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Utilizadores</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Admins podem criar, editar e desativar utilizadores, definir <b>templates de permissão</b> e restrições por categoria.
              </p>
              <Link to="/utilizadores" className="text-indigo-600 hover:underline text-sm">Ir para Utilizadores</Link>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <Shield className="mt-1 text-indigo-600" aria-hidden />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Permissões</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                O acesso é controlado por <b>templates</b> (ex.: <i>baseline</i>, <i>manage_category</i>, <i>manage_users</i>). Algumas rotas exigem que seu token inclua o template certo.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Se você perdeu acesso, tente <b>terminar sessão</b> e entrar novamente.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <Settings className="mt-1 text-indigo-600" aria-hidden />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Boas práticas</h2>
              <ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>Use a pesquisa e filtros para encontrar registros rapidamente.</li>
                <li>Revise as permissões de cada utilizador com regularidade.</li>
                <li>Mantenha estoques mínimos atualizados para alertas fiéis.</li>
                <li>Descreva claramente motivos em exclusões/saídas para auditoria.</li>
              </ul>
            </div>
          </li>
        </ul>
      </section>
    </main>
  )
}
