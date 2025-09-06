import React, { useState } from 'react';
import { 
  QuestionMarkCircleIcon,
  BookOpenIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const AjudaPage = () => {
  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      pergunta: 'Como criar um novo auto de infração?',
      resposta: 'Para criar um novo auto de infração, acesse o menu "Fiscalização" e selecione o tipo de auto desejado (Banco, Supermercado, Posto, etc.). Clique em "Novo Auto" e preencha todos os campos obrigatórios. Após preencher, clique em "Salvar" para finalizar.'
    },
    {
      id: 2,
      pergunta: 'Como acompanhar o status de um processo?',
      resposta: 'Para acompanhar um processo, acesse o menu "Processos" e use a busca pelo número do protocolo. Você também pode filtrar por status, data ou tipo de processo para encontrar o que procura.'
    },
    {
      id: 3,
      pergunta: 'Como gerar relatórios?',
      resposta: 'Acesse o menu "Relatórios" e escolha o tipo de relatório desejado (Fiscalização, Financeiro, Denúncias, etc.). Configure os filtros de data e outros parâmetros, então clique em "Gerar Relatório".'
    },
    {
      id: 4,
      pergunta: 'Como alterar minha senha?',
      resposta: 'Acesse seu perfil através do menu no canto superior direito e clique em "Alterar Senha". Digite sua senha atual e a nova senha duas vezes para confirmar.'
    },
    {
      id: 5,
      pergunta: 'O que fazer se esqueci minha senha?',
      resposta: 'Na tela de login, clique em "Esqueci minha senha" e digite seu email cadastrado. Você receberá um link para redefinir sua senha por email.'
    },
    {
      id: 6,
      pergunta: 'Como adicionar um novo usuário ao sistema?',
      resposta: 'Apenas administradores podem adicionar novos usuários. Acesse o menu "Usuários" e clique em "Novo Usuário". Preencha todos os dados obrigatórios e defina as permissões adequadas.'
    }
  ];

  const tutoriais = [
    {
      id: 1,
      titulo: 'Primeiros Passos no Sistema',
      descricao: 'Aprenda a navegar pelo sistema e usar as funcionalidades básicas',
      duracao: '5 min',
      tipo: 'video',
      nivel: 'Iniciante'
    },
    {
      id: 2,
      titulo: 'Criando Autos de Infração',
      descricao: 'Tutorial completo sobre como criar e gerenciar autos de infração',
      duracao: '15 min',
      tipo: 'video',
      nivel: 'Intermediário'
    },
    {
      id: 3,
      titulo: 'Gerenciando Processos',
      descricao: 'Como criar, acompanhar e finalizar processos administrativos',
      duracao: '12 min',
      tipo: 'video',
      nivel: 'Intermediário'
    },
    {
      id: 4,
      titulo: 'Gerando Relatórios',
      descricao: 'Aprenda a gerar e exportar relatórios do sistema',
      duracao: '8 min',
      tipo: 'video',
      nivel: 'Avançado'
    },
    {
      id: 5,
      titulo: 'Configurações do Sistema',
      descricao: 'Como configurar email, backup e outras configurações',
      duracao: '10 min',
      tipo: 'video',
      nivel: 'Avançado'
    }
  ];

  const documentacao = [
    {
      id: 1,
      titulo: 'Manual do Usuário',
      descricao: 'Documentação completa do sistema para usuários finais',
      tipo: 'pdf',
      tamanho: '2.5 MB'
    },
    {
      id: 2,
      titulo: 'Manual Técnico',
      descricao: 'Documentação técnica para administradores do sistema',
      tipo: 'pdf',
      tamanho: '4.1 MB'
    },
    {
      id: 3,
      titulo: 'Guia de Segurança',
      descricao: 'Políticas e procedimentos de segurança do sistema',
      tipo: 'pdf',
      tamanho: '1.8 MB'
    },
    {
      id: 4,
      titulo: 'API Documentation',
      descricao: 'Documentação da API REST do sistema',
      tipo: 'html',
      tamanho: 'Online'
    }
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Central de Ajuda</h1>
            <p className="text-gray-600 dark:text-gray-300">Encontre respostas para suas dúvidas e aprenda a usar o sistema</p>
          </div>
          <div className="flex items-center space-x-2">
            <QuestionMarkCircleIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Sistema PROCON - v2.0
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'faq', label: 'FAQ', icon: QuestionMarkCircleIcon },
              { id: 'tutoriais', label: 'Tutoriais', icon: VideoCameraIcon },
              { id: 'documentacao', label: 'Documentação', icon: BookOpenIcon },
              { id: 'contato', label: 'Contato', icon: PhoneIcon }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Perguntas Frequentes</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Encontre respostas para as dúvidas mais comuns sobre o sistema.
                </p>
              </div>

              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{faq.pergunta}</span>
                      {expandedFaq === faq.id ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-600 dark:text-gray-400">{faq.resposta}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tutoriais */}
          {activeTab === 'tutoriais' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tutoriais em Vídeo</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Aprenda a usar o sistema através de tutoriais em vídeo organizados por nível de dificuldade.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tutoriais.map((tutorial) => (
                  <div key={tutorial.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center mb-4">
                      <VideoCameraIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          tutorial.nivel === 'Iniciante' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          tutorial.nivel === 'Intermediário' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {tutorial.nivel}
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{tutorial.titulo}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tutorial.descricao}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{tutorial.duracao}</span>
                      <button className="text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm font-medium">
                        Assistir →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentação */}
          {activeTab === 'documentacao' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documentação</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Acesse os manuais e documentação técnica do sistema.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documentacao.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center mb-4">
                      <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          doc.tipo === 'pdf' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {doc.tipo.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{doc.titulo}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{doc.descricao}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{doc.tamanho}</span>
                      <button className="text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm font-medium">
                        Baixar →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contato */}
          {activeTab === 'contato' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Entre em Contato</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Não encontrou o que procurava? Entre em contato conosco através dos canais abaixo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <PhoneIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">Suporte Técnico</h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Para problemas técnicos e dúvidas sobre o sistema.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <strong>Telefone:</strong> (92) 3212-0000
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <strong>Horário:</strong> 8h às 18h (Segunda a Sexta)
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <EnvelopeIcon className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">Email</h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Envie suas dúvidas por email e receba resposta em até 24h.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <strong>Suporte:</strong> suporte@procon.am.gov.br
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <strong>Administrativo:</strong> admin@procon.am.gov.br
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">Chat Online</h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Atendimento em tempo real através do chat.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <strong>Disponível:</strong> 8h às 18h
                    </p>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors duration-300">
                      Iniciar Chat
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <AcademicCapIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mr-3" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">Treinamento</h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Solicite treinamento presencial para sua equipe.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <strong>Contato:</strong> treinamento@procon.am.gov.br
                    </p>
                    <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors duration-300">
                      Solicitar Treinamento
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AjudaPage;
