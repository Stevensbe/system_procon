import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useNotification } from '../../hooks/useNotifications';
import api from '../../services/api';
import atendimentoService from '../../services/atendimentoService';

const DetalhesReclamacao = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [reclamacao, setReclamacao] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [anexos, setAnexos] = useState([]);
  const [atendimento, setAtendimento] = useState(null);
  const [documentosConciliacao, setDocumentosConciliacao] = useState({ ata: null, decisao: null });
  const [remocaoLoading, setRemocaoLoading] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const { data } = await api.get(`/atendimento/reclamacoes/${id}/`);

      setReclamacao(data);
      setHistorico(data.historico || []);
      setAnexos(data.anexos || []);
      setAtendimento(data.atendimento || null);
      setDocumentosConciliacao({
        ata: data.ata_conciliacao_url || null,
        decisao: data.decisao_documento_url || null,
      });
    } catch (error) {
      const mensagem = error?.response?.data?.detail || error?.message || 'Erro ao carregar dados da reclamação';
      showError(mensagem);
    } finally {
      setLoading(false);
    }
  };

  const solicitarRemocaoDados = async () => {
    if (!atendimento) {
      return;
    }

    const observacoes = window.prompt('Informe o motivo da solicitação de remoção (opcional):', '');
    if (observacoes === null) {
      return;
    }

    try {
      setRemocaoLoading(true);
      await atendimentoService.solicitarRemocaoDados(atendimento.id, observacoes || '');
      showSuccess('Solicitação de remoção registrada.');
      await carregarDados();
    } catch (error) {
      const mensagem = error?.response?.data?.erro || error?.response?.data?.detail || error.message || 'Falha ao solicitar remoção.';
      showError(mensagem);
    } finally {
      setRemocaoLoading(false);
    }
  };

  const confirmarRemocaoDados = async () => {
    if (!atendimento) {
      return;
    }

    if (!atendimento.dados_remocao_solicitada_em) {
      showError('É necessário registrar a solicitação de remoção antes de confirmar.');
      return;
    }

    const confirmado = window.confirm('Confirmar a anonimização definitiva dos dados e anexos deste atendimento? Esta ação não poderá ser revertida.');
    if (!confirmado) {
      return;
    }

    try {
      setRemocaoLoading(true);
      await atendimentoService.confirmarRemocaoDados(atendimento.id);
      showSuccess('Dados removidos/anonimizados com sucesso.');
      await carregarDados();
    } catch (error) {
      const mensagem = error?.response?.data?.erro || error?.response?.data?.detail || error.message || 'Falha ao remover dados.';
      showError(mensagem);
    } finally {
      setRemocaoLoading(false);
    }
  };
  const formatDateTime = (value) => {
    if (!value) {
      return null;
    }
    const data = new Date(value);
    if (Number.isNaN(data.getTime())) {
      return null;
    }
    return data.toLocaleString('pt-BR');
  };
  const getStatusColor = (status) => {
    const colors = {
      'REGISTRADA': 'bg-blue-100 text-blue-800',
      'EM_ANALISE': 'bg-yellow-100 text-yellow-800',
      'CLASSIFICADA': 'bg-green-100 text-green-800',
      'NOTIFICADA': 'bg-purple-100 text-purple-800',
      'CONCILIADA': 'bg-green-100 text-green-800',
      'FINALIZADA': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'REGISTRADA': 'Registrada',
      'EM_ANALISE': 'Em Análise',
      'CLASSIFICADA': 'Classificada',
      'NOTIFICADA': 'Notificada',
      'CONCILIADA': 'Conciliada',
      'FINALIZADA': 'Finalizada'
    };
    return texts[status] || status;
  };

  const getTipoDocumentoText = (tipo) => {
    const texts = {
      'NOTA_FISCAL': 'Nota Fiscal',
      'CONTRATO': 'Contrato',
      'COMPROVANTE': 'Comprovante',
      'PRINT_TELA': 'Print de Tela',
      'OUTROS': 'Outros'
    };
    return texts[tipo] || tipo;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(parsed)) {
      return null;
    }

    return parsed.toFixed(2);
  };

  const consentimentoRegistradoEm = formatDateTime(atendimento?.consentimento_registrado_em);
  const remocaoSolicitadaEm = formatDateTime(atendimento?.dados_remocao_solicitada_em);
  const remocaoConcluidaEm = formatDateTime(atendimento?.dados_removidos_em);
  const origemConsentimento = atendimento?.consentimento_origem || '-';
  const podeSolicitarRemocao = Boolean(atendimento && !atendimento.dados_removidos_em);
  const podeConfirmarRemocao = Boolean(atendimento && atendimento.dados_remocao_solicitada_em && !atendimento.dados_removidos_em);
  const possuiDocumentosConciliacao = Boolean(documentosConciliacao.ata || documentosConciliacao.decisao);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!reclamacao) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Reclamação não encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">A reclamação solicitada não foi encontrada.</p>
      </div>
    );
  }

  const valorEnvolvidoFormatado = formatCurrency(reclamacao.valor_envolvido);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/atendimento')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Voltar
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {reclamacao.numero_protocolo}
            </h1>
            <p className="text-gray-600 mt-2">
              {reclamacao.tipo_demanda === 'RECLAMACAO' ? 'Reclamação' : 'Denúncia'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(reclamacao.status)}`}>
              {getStatusText(reclamacao.status)}
            </span>
            <div className="flex space-x-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Editar
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Classificar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Consumidor */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <UserIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Dados do Consumidor</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <p className="text-sm text-gray-900">{reclamacao.consumidor_nome}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CPF</label>
                <p className="text-sm text-gray-900">{reclamacao.consumidor_cpf}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <p className="text-sm text-gray-900">{reclamacao.consumidor_email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <p className="text-sm text-gray-900">{reclamacao.consumidor_telefone}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Endereço</label>
                <p className="text-sm text-gray-900">
                  {reclamacao.consumidor_endereco}, {reclamacao.consumidor_cep} - {reclamacao.consumidor_cidade}/{reclamacao.consumidor_uf}
                </p>
              </div>
            </div>
          </div>

          {/* Dados da Empresa */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Dados da Empresa</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Razão Social</label>
                <p className="text-sm text-gray-900">{reclamacao.empresa_razao_social}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                <p className="text-sm text-gray-900">{reclamacao.empresa_cnpj}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <p className="text-sm text-gray-900">{reclamacao.empresa_telefone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <p className="text-sm text-gray-900">{reclamacao.empresa_email}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Endereço</label>
                <p className="text-sm text-gray-900">{reclamacao.empresa_endereco}</p>
              </div>
            </div>
          </div>

          {/* Descrição dos Fatos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Descrição dos Fatos</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Data da Ocorrência</label>
                <p className="text-sm text-gray-900">
                  {new Date(reclamacao.data_ocorrencia).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor Envolvido</label>
                <p className="text-sm text-gray-900">
                  {valorEnvolvidoFormatado ? `R$ ${valorEnvolvidoFormatado}` : 'Não informado'}
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Descrição</label>
              <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                {reclamacao.descricao_fatos}
              </p>
            </div>
          </div>

          {/* Anexos */}
          {anexos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <PaperClipIcon className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Anexos</h2>
              </div>
              
              <div className="space-y-3">
                {anexos.map((anexo) => {
                  const dataUploadFormatada = formatDateTime(anexo.data_upload);
                  const dataRemocaoFormatada = formatDateTime(anexo.removido_em);
                  const tamanhoMB = typeof anexo.tamanho_bytes === 'number'
                    ? (anexo.tamanho_bytes / 1024 / 1024).toFixed(2)
                    : null;
                  return (
                    <div key={anexo.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <PaperClipIcon className="h-4 w-4 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{anexo.descricao}</p>
                          <p className="text-xs text-gray-500">
                            {getTipoDocumentoText(anexo.tipo_documento)} - {dataUploadFormatada || 'Data indisponivel'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {tamanhoMB ? `${tamanhoMB} MB` : 'Tamanho indisponivel'}
                            {anexo.content_type ? ` • ${anexo.content_type}` : ''}
                          </p>
                          {anexo.checksum_sha256 && (
                            <p className="text-[11px] text-gray-400 break-all">
                              Checksum: {anexo.checksum_sha256}
                            </p>
                          )}
                          {anexo.removido_em && (
                            <p className="mt-1 text-xs text-red-600">
                              Removido em {dataRemocaoFormatada || 'Registro indisponivel'}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => anexo.arquivo_url && window.open(anexo.arquivo_url, '_blank')}
                        disabled={!anexo.arquivo_url}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {anexo.arquivo_url ? 'Baixar' : 'Arquivo removido'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Documentos da Conciliação</h2>
            </div>

            <div className="space-y-3">
              {documentosConciliacao.ata && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Ata de conciliação</p>
                    <p className="text-xs text-gray-500">Registro oficial da sessão de audiência.</p>
                  </div>
                  <a
                    href={documentosConciliacao.ata}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Visualizar
                  </a>
                </div>
              )}

              {documentosConciliacao.decisao && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Documento da decisão</p>
                    <p className="text-xs text-gray-500">Despacho ou decisão administrativa publicada.</p>
                  </div>
                  <a
                    href={documentosConciliacao.decisao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Visualizar
                  </a>
                </div>
              )}

              {!possuiDocumentosConciliacao && (
                <p className="text-sm text-gray-500">Nenhuma ata ou documento de decisão anexado até o momento.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações do Protocolo */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Protocolo</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Número</label>
                <p className="text-sm text-gray-900">{reclamacao.numero_protocolo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Criação</label>
                <p className="text-sm text-gray-900">
                  {new Date(reclamacao.criado_em).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Atendente</label>
                <p className="text-sm text-gray-900">{reclamacao.atendente_responsavel}</p>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                Classificar Reclamação
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                Notificar Empresa
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                Marcar Conciliação
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                Elaborar Decisão
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                Aplicar Penalidade
              </button>
            </div>
          </div>

          {atendimento && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">LGPD e Consentimento</h3>
              <dl className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <dt>Consentimento registrado</dt>
                  <dd className="font-medium text-gray-900">
                    {atendimento.consentimento_lgpd ? 'Sim' : 'Nao'}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Origem</dt>
                  <dd className="font-medium text-gray-900">{origemConsentimento}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Registrado em</dt>
                  <dd className="text-gray-900">{consentimentoRegistradoEm || '-'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Remocao solicitada</dt>
                  <dd className="text-gray-900">{remocaoSolicitadaEm || '-'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Remocao concluida</dt>
                  <dd className="text-gray-900">{remocaoConcluidaEm || '-'}</dd>
                </div>
              </dl>
              {atendimento.dados_remocao_observacoes && (
                <p className="mt-3 text-xs text-gray-600">
                  Observacoes: {atendimento.dados_remocao_observacoes}
                </p>
              )}
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={solicitarRemocaoDados}
                  disabled={!podeSolicitarRemocao || remocaoLoading}
                  className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Solicitar remocao LGPD
                </button>
                <button
                  type="button"
                  onClick={confirmarRemocaoDados}
                  disabled={!podeConfirmarRemocao || remocaoLoading}
                  className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar remocao
                </button>
              </div>
            </div>
          )}
          {/* Histórico */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico</h3>
            
            <div className="space-y-4">
              {historico.map((item) => (
                <div key={item.id} className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{item.acao}</p>
                    <p className="text-xs text-gray-500">{item.descricao}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(item.data_acao).toLocaleDateString('pt-BR')} - {item.usuario}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesReclamacao;












