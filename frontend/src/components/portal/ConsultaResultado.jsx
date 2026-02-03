import React from 'react';
import { 
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  UserIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
const ConsultaResultado = ({ resultado, tipo = 'protocolo' }) => {
  if (!resultado) return null;

  const formatarStatus = (status) => {
    const statusMap = {
      'PROTOCOLADO': { label: 'Protocolado', color: 'blue', icon: DocumentTextIcon },
      'EM_TRAMITACAO': { label: 'Em Tramitação', color: 'yellow', icon: ArrowPathIcon },
      'PENDENTE': { label: 'Pendente', color: 'red', icon: ClockIcon },
      'FINALIZADO': { label: 'Finalizado', color: 'green', icon: CheckCircleIcon },
      'ARQUIVADO': { label: 'Arquivado', color: 'gray', icon: DocumentTextIcon },
      'ENVIADA': { label: 'Enviada', color: 'blue', icon: DocumentTextIcon },
      'RECEBIDA': { label: 'Recebida', color: 'green', icon: CheckCircleIcon },
      'EM_ANALISE': { label: 'Em Análise', color: 'yellow', icon: EyeIcon },
      'RESPONDIDA': { label: 'Respondida', color: 'purple', icon: CheckCircleIcon },
      'AGUARDANDO_DEFESA': { label: 'Aguardando Defesa', color: 'yellow', icon: ClockIcon },
      'DEFESA_APRESENTADA': { label: 'Defesa Apresentada', color: 'blue', icon: DocumentTextIcon },
      'AGUARDANDO_RECURSO': { label: 'Aguardando Recurso', color: 'yellow', icon: ClockIcon },
      'RECURSO_APRESENTADO': { label: 'Recurso Apresentado', color: 'blue', icon: DocumentTextIcon },
      'JULGAMENTO': { label: 'Em Julgamento', color: 'yellow', icon: EyeIcon },
      'FINALIZADO_PROCEDENTE': { label: 'Finalizado - Procedente', color: 'green', icon: CheckCircleIcon },
      'FINALIZADO_IMPROCEDENTE': { label: 'Finalizado - Improcedente', color: 'green', icon: CheckCircleIcon },
    };
    
    return statusMap[status] || { label: status, color: 'gray', icon: ExclamationCircleIcon };
  };

  if (!resultado.encontrado) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {tipo === 'peticao' ? 'Petição não encontrada' : 'Protocolo não encontrado'}
          </h3>
          <p className="text-gray-600 mb-4">
            {resultado.erro || 'Verifique os dados informados e tente novamente.'}
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
            <div className="flex">
              <div className="ml-3 text-sm">
                <h4 className="font-medium text-blue-800 mb-2">Dicas para sua consulta:</h4>
                <ul className="text-blue-700 space-y-1">
                  <li>• Verifique se digitou o número corretamente</li>
                  <li>• Confirme se o CPF/CNPJ está correto</li>
                  <li>• Aguarde alguns minutos se acabou de protocolar</li>
                  <li>• Entre em contato conosco se o problema persistir</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const status = formatarStatus(resultado.status);
  const StatusIcon = status.icon;
  const statusLabel = resultado.status_display || status.label;
  const isProcesso = tipo === 'processo';
  const numeroExibicao = resultado.numero_processo || resultado.numero_protocolo || resultado.numero_peticao;
  const interessadoExibicao = resultado.autuado || resultado.interessado_nome || resultado.peticionario_nome;
  const dataExibicao =
    resultado.data_protocolo ||
    resultado.criado_em ||
    resultado.data_envio ||
    resultado.data_notificacao;
  const documentosDisponiveis = resultado.documentos_disponiveis || [];
  const documentosRequerDocumento = Boolean(resultado.documentos_requer_documento);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Cabeçalho com Status */}
      <div className={`bg-${status.color}-500 text-white p-6`}>
        <div className="flex items-center">
          <StatusIcon className="h-8 w-8 mr-3" />
          <div>
            <h3 className="text-xl font-bold">
              {tipo === 'peticao' ? 'Petição Encontrada' : isProcesso ? 'Processo Encontrado' : 'Protocolo Encontrado'}
            </h3>
            <p className="text-sm opacity-90">
              Status: {statusLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="p-6">
        {/* Informações Básicas */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Número</p>
                <p className="text-lg font-semibold text-blue-600">
                  {numeroExibicao}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {tipo === 'peticao' ? 'Data de Envio' : isProcesso ? 'Data de Criação' : 'Data do Protocolo'}
                </p>
                <p className="text-gray-900">
                  {dataExibicao ? new Date(dataExibicao).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
                </p>
              </div>
            </div>
            
            {resultado.prazo_resposta && (
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Prazo de Resposta</p>
                  <p className="text-gray-900">{resultado.prazo_resposta} dias úteis</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Interessado</p>
                <p className="text-gray-900">
                  {interessadoExibicao}
                </p>
              </div>
            </div>
            
            {resultado.empresa_nome && (
              <div className="flex items-start">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Empresa</p>
                  <p className="text-gray-900">{resultado.empresa_nome}</p>
                </div>
              </div>
            )}
            
            {resultado.valor_causa && (
              <div className="flex items-start">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Valor Envolvido</p>
                  <p className="text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(resultado.valor_causa)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assunto/Descrição */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            {tipo === 'peticao' ? 'Assunto da Petição' : isProcesso ? 'Resumo do Processo' : 'Assunto'}
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900 leading-relaxed">
              {resultado.assunto || resultado.descricao || '-'}
            </p>
          </div>
        </div>

        {/* Timeline de Tramitação */}
        {resultado.tramitacoes && resultado.tramitacoes.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Tramitação</h4>
            <div className="space-y-4">
              {resultado.tramitacoes.map((tramitacao, index) => (
                <div key={index} className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                    }`}></div>
                    {index < resultado.tramitacoes.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {tramitacao.setor_destino || tramitacao.acao}
                        </p>
                        <p className="text-sm text-gray-600">
                          {tramitacao.observacoes}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(tramitacao.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documentos disponíveis */}
        {isProcesso && (documentosDisponiveis.length > 0 || documentosRequerDocumento) && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Documentos Disponíveis</h4>
            {documentosDisponiveis.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                Para liberar os documentos, informe o CPF/CNPJ do autuado na consulta do processo.
              </div>
            ) : (
              <div className="space-y-3">
                {documentosDisponiveis.map((doc) => (
                  <div
                    key={`${doc.origem || 'processo'}-${doc.id}`}
                    className="flex items-center justify-between border rounded-lg p-3 bg-white"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.titulo}</p>
                      <p className="text-xs text-gray-500">
                        {doc.tipo_display || doc.tipo} •{' '}
                        {doc.data ? new Date(doc.data).toLocaleDateString('pt-BR') : 'Sem data'}
                      </p>
                    </div>
                    {doc.download_url && (
                      <button
                        onClick={() => window.open(doc.download_url, '_blank')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Baixar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Próximos Passos */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h4 className="font-medium text-blue-800 mb-2">Próximos Passos</h4>
              <div className="text-sm text-blue-700">
                {statusLabel === 'Em Análise' && (
                  <p>Sua solicitação está sendo analisada pela equipe técnica. Você será notificado quando houver atualizações.</p>
                )}
                {statusLabel === 'Pendente' && (
                  <p>Documentação complementar necessária. Verifique seu e-mail para instruções detalhadas.</p>
                )}
                {statusLabel === 'Em Tramitação' && (
                  <p>Sua solicitação está seguindo o fluxo normal de tramitação entre os setores competentes.</p>
                )}
                {statusLabel === 'Respondida' && (
                  <p>Resposta enviada para seu e-mail cadastrado. Verifique sua caixa de entrada e spam.</p>
                )}
                {statusLabel === 'Finalizada' && (
                  <p>Processo concluído. Se necessário, você pode abrir um novo protocolo para questões relacionadas.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informações de Contato */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Precisa de Ajuda?</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>📞 Telefone: (xx) xxxx-xxxx</p>
            <p>📧 E-mail: atendimento@procon.gov.br</p>
            <p>🕒 Horário: Segunda a Sexta, 8h às 17h</p>
            <p className="mt-2 text-xs text-gray-500">
              Ao entrar em contato, informe o número {numeroExibicao}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultaResultado;
