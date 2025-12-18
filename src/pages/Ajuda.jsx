/* eslint-disable no-unused-vars */
// src/pages/Ajuda.jsx
"use client";

import React from "react";
import {
  HelpCircle,
  Shield,
  LayoutDashboard,
  PackageCheck,
  FileText,
  Users,
  Settings,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  LifeBuoy,
  LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";

/* ------------------------ UI helpers ------------------------ */
function SectionCard({ icon, title, children, to }) {
  return (
    <article className="group relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur shadow-sm hover:shadow-md transition-all">
      <div className="p-6">
        <header className="mb-3 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 dark:bg-gray-800">
            {icon}
          </span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </header>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          {children}
        </div>
        {to && (
          <div className="mt-4">
            <Link
              to={to}
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
            >
              Aceder
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 -bottom-8 h-16 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="mx-6 h-[1px] bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
      </div>
    </article>
  );
}

function QuickLink({ to, icon, label, desc }) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur p-4 hover:shadow-md focus:ring-2 focus:ring-indigo-500 outline-none transition"
    >
      <span className="mt-0.5 grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
        {icon}
      </span>
      <div>
        <div className="font-semibold text-gray-900 dark:text-white leading-tight">
          {label}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
      </div>
    </Link>
  );
}

function Accordion({ items }) {
  const [open, setOpen] = React.useState(null);
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
      {items.map((it, i) => {
        const active = open === i;
        return (
          <div key={i}>
            <button
              className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/60 focus:ring-2 focus:ring-indigo-500 rounded-2xl md:rounded-none transition"
              onClick={() => setOpen(active ? null : i)}
              aria-expanded={active}
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {it.q}
              </span>
              {active ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {active && (
              <div className="px-5 pb-5 pt-1 text-sm text-gray-700 dark:text-gray-300">
                {it.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------ Página ------------------------ */
export default function Ajuda() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Skip link para acessibilidade */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 rounded-md bg-indigo-600 px-3 py-2 text-white shadow"
      >
        Ir para o conteúdo
      </a>

      {/* Hero */}
      <section className="mx-auto px-4 pt-4 md:pt-4">
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur p-6 md:p-8 shadow-sm">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
                <HelpCircle className="h-7 w-7" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Ajuda & Guia rápido
                </h1>
                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  Encontre aqui um panorama do sistema, boas práticas e atalhos
                  para as áreas mais usadas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full md:w-auto">
              <QuickLink
                to="/"
                icon={<LayoutDashboard className="h-5 w-5" />}
                label="Dashboard"
                desc="Visão geral"
              />
              <QuickLink
                to="/materiais"
                icon={<PackageCheck className="h-5 w-5" />}
                label="Materiais"
                desc="Gestão de stock"
              />
              <QuickLink
                to="/requisicoes"
                icon={<FileText className="h-5 w-5" />}
                label="Requisições"
                desc="Fluxos e aprovações"
              />
            </div>
          </header>
        </div>
      </section>

      {/* Conteúdo principal com navegação lateral (vira topo no mobile) */}
      <div id="conteudo" className="mx-auto p-4 md:p-4 grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Nav lateral */}
        <nav aria-label="Secções" className="print:hidden">
          <div className="sticky top-4 space-y-2">
            <a
              href="#sec-dashboard"
              className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
            >
              Dashboard
            </a>
            <a
              href="#sec-materiais"
              className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
            >
              Materiais
            </a>
            <a
              href="#sec-requisicoes"
              className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
            >
              Requisições
            </a>
            <a
              href="#sec-users"
              className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
            >
              Utilizadores
            </a>
            <a
              href="#sec-permissoes"
              className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
            >
              Permissões
            </a>
            <a
              href="#sec-boas"
              className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
            >
              Boas práticas
            </a>
            <a
              href="#sec-faq"
              className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
            >
              FAQ
            </a>
          </div>
        </nav>

        {/* Coluna de conteúdo */}
        <div className="space-y-6">
          {/* Dashboard */}
          <div id="sec-dashboard" className="scroll-mt-24">
            <SectionCard
              icon={<LayoutDashboard className="h-5 w-5 text-indigo-600" />}
              title="Dashboard"
              to="/"
            >
              <p>
                Resumo geral de movimentações, estatísticas e distribuição por
                categoria. Use o botão <b>Atualizar</b> para recarregar dados.
              </p>
            </SectionCard>
          </div>

          {/* Materiais */}
          <div id="sec-materiais" className="scroll-mt-24">
            <SectionCard
              icon={<PackageCheck className="h-5 w-5 text-indigo-600" />}
              title="Materiais"
              to="/materiais"
            >
              <p>
                Crie/edite materiais, filtre por categoria/tipo e controle
                estoque mínimo. Ações de remover unidades e apagar tudo ficam no
                menu de ações.
              </p>
              <p className="mt-1">
                Dica: estoques baixos aparecem destacados em{" "}
                <span className="text-rose-600 dark:text-rose-400">vermelho</span>.
              </p>
            </SectionCard>
          </div>

          {/* Requisições */}
          <div id="sec-requisicoes" className="scroll-mt-24">
            <SectionCard
              icon={<FileText className="h-5 w-5 text-indigo-600" />}
              title="Requisições"
              to="/requisicoes"
            >
              <p>
                Crie requisições com itens. Perfis com permissão podem{" "}
                <b>aprovar/rejeitar/cancelar</b> e também{" "}
                <b>atender/devolver</b> itens.
              </p>
            </SectionCard>
          </div>

          {/* Utilizadores */}
          <div id="sec-users" className="scroll-mt-24">
            <SectionCard
              icon={<Users className="h-5 w-5 text-indigo-600" />}
              title="Utilizadores"
              to="/utilizadores"
            >
              <p>
                Admins podem criar, editar e desativar utilizadores, definir{" "}
                <b>templates de permissão</b> e restrições por categoria.
              </p>
            </SectionCard>
          </div>

          {/* Permissões */}
          <div id="sec-permissoes" className="scroll-mt-24">
            <SectionCard
              icon={<Shield className="h-5 w-5 text-indigo-600" />}
              title="Permissões"
            >
              <p>
                O acesso é controlado por <b>templates</b> (ex.:{" "}
                <i>baseline</i>, <i>manage_category</i>, <i>manage_users</i>).
                Algumas rotas exigem que o token inclua o template certo.
              </p>
              <p className="mt-1">
                Se perdeu acesso, tente <b>terminar sessão</b> e entrar
                novamente.
              </p>
            </SectionCard>
          </div>

          {/* Boas práticas */}
          <div id="sec-boas" className="scroll-mt-24">
            <SectionCard
              icon={<Settings className="h-5 w-5 text-indigo-600" />}
              title="Boas práticas"
            >
              <ul className="list-disc pl-5 space-y-1">
                <li>Use a pesquisa e filtros para encontrar registos rapidamente.</li>
                <li>Revise as permissões de cada utilizador com regularidade.</li>
                <li>Mantenha estoques mínimos atualizados para alertas fiéis.</li>
                <li>
                  Descreva claramente motivos em exclusões/saídas para auditoria.
                </li>
              </ul>
            </SectionCard>
          </div>

          {/* FAQ */}
          <div id="sec-faq" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Perguntas frequentes
              </h2>
            </div>

            <Accordion
              items={[
                {
                  q: "Não vejo algumas páginas. É permissão?",
                  a: (
                    <>
                      Sim. O acesso é controlado por templates. Fale com um
                      administrador para verificar os templates do seu utilizador.
                    </>
                  ),
                },
                {
                  q: "Os números do dashboard parecem desatualizados.",
                  a: (
                    <>
                      Clique em <b>Atualizar</b> no topo do dashboard. Se
                      persistir, refaça a sessão e tente novamente.
                    </>
                  ),
                },
                {
                  q: "Como guardar uma cópia em PDF dos relatórios?",
                  a: (
                    <>
                      Nos relatórios, utilize <b>Exportar PDF</b> (usa o diálogo
                      de impressão do navegador). No mobile, escolha “Guardar
                      como PDF”.
                    </>
                  ),
                },
                {
                  q: "Perdi o acesso após trocar de papel.",
                  a: (
                    <>
                      Termine sessão e entre novamente para receber um token com
                      permissões atualizadas.
                    </>
                  ),
                },
              ]}
            />
          </div>

          {/* Dica de sessão */}
          <div className="print:hidden">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur p-4 flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <LogOut className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </span>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <b>Dica:</b> se algo não aparecer como esperado, <i>termine
                sessão</i> e entre novamente para renovar permissões.
              </div>
            </div>
          </div>

          {/* Rodapé enxuto */}
          <footer className="pt-2 pb-10 text-xs text-gray-500 dark:text-gray-500">
            <p>
              © {new Date().getFullYear()} — Ajuda do sistema de gestão de
              materiais e requisições.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
