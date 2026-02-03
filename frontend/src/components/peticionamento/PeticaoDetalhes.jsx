import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowPathIcon,
  EyeIcon,
  PaperClipIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import peticionamentoService from '../../services/peticionamentoService';
import processosService from '../../services/processosService';

const PeticaoDetalhes = ({ peticao, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('detalhes');
  const [loading, setLoading] = useState(false);
  const [detalhe, setDetalhe] = useState(peticao);
  const [respostas, setRespostas] = useState(peticao?.resposta ? [peticao.resposta] : []);
  const [anexos, setAnexos] = useState(peticao?.anexos || []);
  const [showRespostaModal, setShowRespostaModal] = useState(false);
  const [respostaArquivo, setRespostaArquivo] = useState(null);
  const [respostaErro, setRespostaErro] = useState('');
  const [enviandoResposta, setEnviandoResposta] = useState(false);
  const [showDocumentoModal, setShowDocumentoModal] = useState(false);
  const [documentoTipo, setDocumentoTipo] = useState('PARECER');
  const [documentoArquivo, setDocumentoArquivo] = useState(null);
  const [documentoErro, setDocumentoErro] = useState('');
  const [decisaoResultado, setDecisaoResultado] = useState('procedente');
  const [decisaoPrazoRecursoDias, setDecisaoPrazoRecursoDias] = useState(15);
  const [decisaoValorMulta, setDecisaoValorMulta] = useState('');
  const [decisaoObservacao, setDecisaoObservacao] = useState('');
  const [notificandoDisponibilidade, setNotificandoDisponibilidade] = useState(false);
  const [notificacaoDisponibilidadeErro, setNotificacaoDisponibilidadeErro] = useState('');
  const [notificacaoDisponibilidadeSucesso, setNotificacaoDisponibilidadeSucesso] = useState('');
  const [processoRelacionado, setProcessoRelacionado] = useState(null);
  const [processoLoading, setProcessoLoading] = useState(false);
  const [dosimetriaArquivo, setDosimetriaArquivo] = useState(null);
  const [dosimetriaErro, setDosimetriaErro] = useState('');
  const [dosimetriaSucesso, setDosimetriaSucesso] = useState('');
  const [dosimetriaInfo, setDosimetriaInfo] = useState(null);
  const [dosimetriaEnviando, setDosimetriaEnviando] = useState(false);
  const [despachoObservacao, setDespachoObservacao] = useState('');
  const [despachoPrazoDias, setDespachoPrazoDias] = useState(15);
  const [despachoArquivo, setDespachoArquivo] = useState(null);
  const [despachoEnviando, setDespachoEnviando] = useState(false);
  const [despachoErro, setDespachoErro] = useState('');
  const [despachoSucesso, setDespachoSucesso] = useState('');

  const atualizarDetalhe = async () => {
    if (!peticao?.id) {
      return;
    }
    try {
      const data = await peticionamentoService.obterPeticao(peticao.id);
      setDetalhe(data);
      setRespostas(data?.resposta ? [data.resposta] : []);
      setAnexos(data?.anexos || []);
    } catch (error) {
      console.error('Erro ao carregar detalhes da petição:', error);
    }
  };

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      if (!ativo) return;
      await atualizarDetalhe();
    };

    carregar();
    return () => {
      ativo = false;
    };
  }, [peticao?.id]);

  const formatarStatus = (status) => {
    const statusMap = {
      'RASCUNHO': { label: 'Rascunho', color: 'gray', icon: DocumentTextIcon },
      'ENVIADA': { label: 'Enviada', color: 'blue', icon: ArrowPathIcon },
      'RECEBIDA': { label: 'Recebida', color: 'green', icon: CheckCircleIcon },
      'EM_ANALISE': { label: 'Em Análise', color: 'yellow', icon: EyeIcon },
      'PENDENTE_DOCUMENTACAO': { label: 'Pendente Documentação', color: 'orange', icon: ExclamationTriangleIcon },
      'RESPONDIDA': { label: 'Respondida', color: 'purple', icon: ChatBubbleLeftRightIcon },
      'FINALIZADA': { label: 'Finalizada', color: 'green', icon: CheckCircleIcon },
      'INDEFERIDA': { label: 'Indeferida', color: 'red', icon: ExclamationTriangleIcon },
    };
    
    return statusMap[status] || { label: status, color: 'gray', icon: ExclamationTriangleIcon };
  };

  const formatarTipoPeticao = (categoria) => {
    const tipoMap = {
      'RECLAMACAO': { label: 'Reclamação', color: 'red', icon: '⚠️' },
      'DENUNCIA': { label: 'Denúncia', color: 'orange', icon: '🚨' },
      'SOLICITACAO': { label: 'Solicitação', color: 'blue', icon: '📋' },
      'SUGESTAO': { label: 'Sugestão', color: 'green', icon: '💡' },
      'RECURSO': { label: 'Recurso', color: 'purple', icon: '⚖️' },
    };
    
    return tipoMap[categoria] || { label: categoria, color: 'gray', icon: '📄' };
  };

  const calcularDiasAnalise = (dataCriacao) => {
    if (!dataCriacao) return 0;
    const data = new Date(dataCriacao);
    const hoje = new Date();
    const diffTime = Math.abs(hoje - data);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calcularPrazoRestante = (dataCriacao, prazoResposta) => {
    if (!prazoResposta) return null;
    const diasAnalise = calcularDiasAnalise(dataCriacao);
    return prazoResposta - diasAnalise;
  };

  const dadosPeticao = detalhe || peticao;
  const status = formatarStatus(dadosPeticao?.status);
  const tipoPeticao = formatarTipoPeticao(dadosPeticao?.tipo_peticao?.categoria);
  const StatusIcon = status.icon;
  const diasAnalise = calcularDiasAnalise(dadosPeticao?.criado_em);
  const prazoRestante = calcularPrazoRestante(dadosPeticao?.criado_em, dadosPeticao?.prazo_resposta);

  const respostaAtual = respostas?.[0] || null;
  const documentosJuridicos = (anexos || []).filter((anexo) =>
    ['PARECER', 'DECISAO'].includes((anexo.tipo || '').toUpperCase())
  );
  const possuiDecisao = documentosJuridicos.some(
    (anexo) => (anexo.tipo || '').toUpperCase() === 'DECISAO'
  );
  const instanciaDocumento = dadosPeticao?.dados_especificos?.setor_destino || '';
  const instanciaLabel = instanciaDocumento?.includes('JURIDICO_2')
    ? 'Jurídico 2'
    : instanciaDocumento?.includes('JURIDICO_1')
      ? 'Jurídico 1'
      : 'Jurídico';
  const instanciaJuridico2 = instanciaDocumento?.includes('JURIDICO_2');
  const numeroProcesso = (
    dadosPeticao?.dados_especificos?.numero_processo ||
    dadosPeticao?.protocolo_numero ||
    ''
  ).trim();
  const valorMultaProcesso = processoRelacionado?.valor_multa ?? null;
  const podeDespacharDaf = ['finalizado_procedente', 'aguardando_recurso', 'recurso_apresentado', 'julgamento'].includes(
    (processoRelacionado?.status || '').toLowerCase()
  );

  useEffect(() => {
    let ativo = true;

    const carregarProcesso = async () => {
      if (!numeroProcesso) {
        if (ativo) {
          setProcessoRelacionado(null);
        }
        return;
      }

      setProcessoLoading(true);
      try {
        const processo = await processosService.buscarProcessoPorNumero(numeroProcesso);
        if (ativo) {
          setProcessoRelacionado(processo);
        }
      } catch (error) {
        console.error('Erro ao carregar processo vinculado:', error);
        if (ativo) {
          setProcessoRelacionado(null);
        }
      } finally {
        if (ativo) {
          setProcessoLoading(false);
        }
      }
    };

    carregarProcesso();
    return () => {
      ativo = false;
    };
  }, [numeroProcesso]);

  const validarArquivoResposta = (arquivo) => {
    if (!arquivo) {
      return 'Selecione um arquivo.';
    }
    const extensao = arquivo.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(extensao)) {
      return 'Formato inválido. Envie apenas PDF ou DOC/DOCX.';
    }
    return '';
  };

  const abrirModalResposta = () => {
    setRespostaErro('');
    setRespostaArquivo(null);
    setShowRespostaModal(true);
  };

  const fecharModalResposta = () => {
    setShowRespostaModal(false);
    setRespostaArquivo(null);
    setRespostaErro('');
  };

  const handleUploadResposta = async () => {
    const erro = validarArquivoResposta(respostaArquivo);
    if (erro) {
      setRespostaErro(erro);
      return;
    }

    setEnviandoResposta(true);
    try {
      const formData = new FormData();
      formData.append('arquivo_resposta', respostaArquivo);

      if (respostaAtual?.id) {
        await peticionamentoService.atualizarResposta(respostaAtual.id, formData);
      } else {
        formData.append('peticao', dadosPeticao?.id);
        formData.append('tipo_resposta', 'ORIENTACAO');
        formData.append('titulo', `Resposta da Petição ${dadosPeticao?.numero_peticao || ''}`.trim());
        formData.append('conteudo', 'Resposta anexada em arquivo.');
        await peticionamentoService.criarResposta(formData);
      }

      await atualizarDetalhe();
      fecharModalResposta();
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      setRespostaErro('Não foi possível anexar a resposta. Tente novamente.');
    } finally {
      setEnviandoResposta(false);
    }
  };

  const handleEnviarResposta = async () => {
    if (!respostaAtual?.id) {
      return;
    }
    setEnviandoResposta(true);
    try {
      await peticionamentoService.enviarResposta(respostaAtual.id);
      await atualizarDetalhe();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erro ao enviar resposta por e-mail:', error);
      alert('Não foi possível enviar a resposta. Tente novamente.');
    } finally {
      setEnviandoResposta(false);
    }
  };

  const resetCamposDecisao = () => {
    setDecisaoResultado('procedente');
    setDecisaoPrazoRecursoDias(15);
    setDecisaoValorMulta('');
    setDecisaoObservacao('');
  };

  const abrirModalDocumento = () => {
    setDocumentoTipo('PARECER');
    setDocumentoArquivo(null);
    setDocumentoErro('');
    resetCamposDecisao();
    setShowDocumentoModal(true);
  };

  const fecharModalDocumento = () => {
    setShowDocumentoModal(false);
    setDocumentoArquivo(null);
    setDocumentoErro('');
    resetCamposDecisao();
  };

  const handleDocumentoTipoChange = (value) => {
    setDocumentoTipo(value);
    setDocumentoErro('');
    if (value === 'DECISAO') {
      resetCamposDecisao();
    }
  };

  const handleUploadDocumentoJuridico = async () => {
    if (!documentoArquivo) {
      setDocumentoErro('Selecione um arquivo.');
      return;
    }
    const extensao = documentoArquivo.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(extensao)) {
      setDocumentoErro('Formato inválido. Envie apenas PDF ou DOC/DOCX.');
      return;
    }
    if (documentoTipo === 'DECISAO' && !decisaoResultado) {
      setDocumentoErro('Selecione o resultado da decisão.');
      return;
    }

    const titulo = `${documentoTipo === 'DECISAO' ? 'Decisão' : 'Parecer'} ${instanciaLabel}`.trim();

    setEnviandoResposta(true);
    try {
      await peticionamentoService.criarDocumentoJuridico(
        dadosPeticao?.id,
        documentoArquivo,
        documentoTipo,
        titulo,
        instanciaDocumento ? `Instância: ${instanciaDocumento}` : ''
      );

      if (documentoTipo === 'DECISAO') {
        await peticionamentoService.registrarDecisao(dadosPeticao?.id, {
          resultado: decisaoResultado,
          prazo_recurso_dias: instanciaJuridico2 || decisaoResultado === 'improcedente'
            ? null
            : decisaoPrazoRecursoDias,
          valor_multa: decisaoValorMulta || null,
          observacao: decisaoObservacao || '',
        });
      }
      await atualizarDetalhe();
      fecharModalDocumento();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erro ao enviar documento jurídico:', error);
      const mensagem =
        error?.response?.data?.detail ||
        'Não foi possível enviar o documento. Tente novamente.';
      setDocumentoErro(mensagem);
    } finally {
      setEnviandoResposta(false);
    }
  };

  const handleNotificarDisponibilidade = async () => {
    if (!dadosPeticao?.id) {
      return;
    }

    setNotificandoDisponibilidade(true);
    setNotificacaoDisponibilidadeErro('');
    setNotificacaoDisponibilidadeSucesso('');
    try {
      const resposta = await peticionamentoService.notificarDisponibilidade(dadosPeticao.id);
      const mensagem =
        resposta?.detail ||
        resposta?.mensagem ||
        'Notificação enviada com sucesso.';
      setNotificacaoDisponibilidadeSucesso(mensagem);
      await atualizarDetalhe();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      const mensagem =
        error?.response?.data?.detail ||
        'Não foi possível enviar a notificação. Tente novamente.';
      setNotificacaoDisponibilidadeErro(mensagem);
    } finally {
      setNotificandoDisponibilidade(false);
    }
  };

  const handleDosimetriaChange = (event) => {
    const arquivo = event.target.files?.[0] || null;
    setDosimetriaArquivo(arquivo);
    setDosimetriaErro('');
    setDosimetriaSucesso('');
    setDosimetriaInfo(null);
  };

  const importarDosimetria = async () => {
    if (!processoRelacionado?.id) {
      setDosimetriaErro('Processo vinculado não localizado para esta petição.');
      return;
    }
    if (!dosimetriaArquivo) {
      setDosimetriaErro('Selecione o arquivo Excel da dosimetria.');
      return;
    }
    if (!dosimetriaArquivo.name.toLowerCase().endsWith('.xlsx')) {
      setDosimetriaErro('Use o arquivo em formato .xlsx.');
      return;
    }

    setDosimetriaEnviando(true);
    setDosimetriaErro('');
    setDosimetriaSucesso('');

    try {
      const resp = await processosService.registrarDosimetriaExcel(
        processoRelacionado.id,
        dosimetriaArquivo
      );

      const processoAtualizado = await processosService.obterProcesso(processoRelacionado.id);
      setProcessoRelacionado(processoAtualizado);
      setDosimetriaInfo(resp);

      const origem = resp?.sheet
        ? `${resp.sheet}${resp.celula ? `!${resp.celula}` : ''}`
        : '';
      setDosimetriaSucesso(
        `Dosimetria importada com sucesso.${origem ? ` Origem: ${origem}.` : ''}`
      );

      // Atualiza também os dados da petição (status/observações/espelhamento).
      await atualizarDetalhe();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erro ao importar dosimetria:', error);
      const mensagem =
        error?.response?.data?.detail ||
        'Não foi possível importar a dosimetria. Verifique o arquivo e tente novamente.';
      setDosimetriaErro(mensagem);
    } finally {
      setDosimetriaEnviando(false);
    }
  };

  const despacharParaDaf = async () => {
    if (!processoRelacionado?.id) {
      setDespachoErro('Processo vinculado nao localizado para esta peticao.');
      return;
    }
    if (!podeDespacharDaf) {
      setDespachoErro('O despacho ao DAF so e permitido apos decisao procedente.');
      return;
    }

    setDespachoEnviando(true);
    setDespachoErro('');
    setDespachoSucesso('');
    try {
      const resp = await processosService.despacharParaDaf(processoRelacionado.id, {
        observacao: despachoObservacao,
        prazo_dias: despachoPrazoDias,
        arquivo: despachoArquivo,
      });

      const processoAtualizado = await processosService.obterProcesso(processoRelacionado.id);
      setProcessoRelacionado(processoAtualizado);

      const protocolo = resp?.protocolo ? ` Protocolo: ${resp.protocolo}.` : '';
      setDespachoSucesso(`Despacho ao DAF registrado com sucesso.${protocolo}`);
      setDespachoArquivo(null);

      await atualizarDetalhe();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erro ao despachar para o DAF:', error);
      const mensagem =
        error?.response?.data?.detail ||
        'Nao foi possivel registrar o despacho ao DAF. Tente novamente.';
      setDespachoErro(mensagem);
    } finally {
      setDespachoEnviando(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Cabeçalho */}
        <div className={`bg-${status.color}-500 text-white p-6`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <StatusIcon className="h-8 w-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">
                  {peticionamentoService.formatarNumeroPeticao(dadosPeticao?.numero_peticao)}
                </h2>
                <div className="flex items-center space-x-3 mt-1">
                  <p className="text-sm opacity-90">
                    Status: {status.label}
                  </p>
                  <span className="text-lg">{tipoPeticao.icon}</span>
                  <span className="text-sm opacity-90">{tipoPeticao.label}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm opacity-75">Dias em análise</p>
                <p className="text-xl font-bold">{diasAnalise}</p>
              </div>
              
              {prazoRestante !== null && (
                <div className="text-right">
                  <p className="text-sm opacity-75">Prazo restante</p>
                  <p className={`text-xl font-bold ${
                    prazoRestante <= 0 ? 'text-red-200' :
                    prazoRestante <= 5 ? 'text-yellow-200' :
                    'text-white'
                  }`}>
                    {prazoRestante > 0 ? `${prazoRestante} dias` : 'Em atraso'}
                  </p>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 p-2"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'detalhes', label: 'Detalhes', icon: EyeIcon },
              { id: 'respostas', label: 'Respostas', icon: ChatBubbleLeftRightIcon },
              { id: 'anexos', label: 'Anexos', icon: PaperClipIcon },
              { id: 'historico', label: 'Histórico', icon: ArrowPathIcon },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'anexos' && anexos.length > 0 && (
                    <span className="bg-gray-200 text-gray-600 text-xs rounded-full px-2 py-1">
                      {anexos.length}
                    </span>
                  )}
                  {tab.id === 'respostas' && respostas.length > 0 && (
                    <span className="bg-blue-200 text-blue-600 text-xs rounded-full px-2 py-1">
                      {respostas.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          
          {/* DETALHES */}
          {activeTab === 'detalhes' && (
            <div className="space-y-6">
              
              {/* Informações da Petição */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Assunto</p>
                      <p className="text-gray-900 font-medium">{peticao.assunto}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data de Envio</p>
                      <p className="text-gray-900">
                        {new Date(peticao.criado_em).toLocaleDateString('pt-BR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tipo de Petição</p>
                      <p className="text-gray-900">{peticao.tipo_peticao?.nome || 'Não informado'}</p>
                    </div>
                  </div>
                  
                  {peticao.valor_causa && (
                    <div className="flex items-start">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Valor Envolvido</p>
                        <p className="text-gray-900 font-semibold">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(peticao.valor_causa)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Peticionário</p>
                      <p className="text-gray-900 font-medium">{peticao.peticionario_nome}</p>
                      <p className="text-sm text-gray-600">{peticao.peticionario_documento}</p>
                    </div>
                  </div>
                  
                  {peticao.peticionario_email && (
                    <div className="flex items-start">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">E-mail</p>
                        <p className="text-gray-900">{peticao.peticionario_email}</p>
                      </div>
                    </div>
                  )}
                  
                  {peticao.peticionario_telefone && (
                    <div className="flex items-start">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Telefone</p>
                        <p className="text-gray-900">{peticao.peticionario_telefone}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Prazo de Resposta</p>
                      <p className="text-gray-900">{peticao.prazo_resposta || 30} dias úteis</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Empresa Reclamada */}
              {peticao.empresa_nome && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Empresa Reclamada</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Nome/Razão Social</p>
                        <p className="text-gray-900">{peticao.empresa_nome}</p>
                      </div>
                      {peticao.empresa_cnpj && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">CNPJ</p>
                          <p className="text-gray-900">{peticao.empresa_cnpj}</p>
                        </div>
                      )}
                      {peticao.empresa_endereco && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-gray-500">Endereço</p>
                          <p className="text-gray-900">{peticao.empresa_endereco}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Processo Vinculado + Dosimetria */}
              {numeroProcesso && (
                <div className="border-t pt-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Processo Vinculado</h4>
                      <p className="text-sm text-gray-600">
                        Número do processo: <span className="font-medium text-gray-900">{numeroProcesso}</span>
                      </p>
                    </div>
                    {processoLoading && (
                      <div className="text-xs text-gray-500">Carregando processo...</div>
                    )}
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-indigo-900">Dosimetria da Multa (Excel)</p>
                        <p className="text-xs text-indigo-800">
                          Importe a planilha (.xlsx) para atualizar o valor da multa no processo.
                        </p>
                      </div>
                      {valorMultaProcesso !== null && valorMultaProcesso !== undefined && (
                        <div className="text-xs text-indigo-900 bg-white border border-indigo-200 rounded px-3 py-2">
                          Valor atual: <strong>{processosService.formatarValor(valorMultaProcesso)}</strong>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                      <input
                        type="file"
                        accept=".xlsx"
                        onChange={handleDosimetriaChange}
                        className="block w-full text-sm text-gray-700 border border-indigo-200 rounded-md p-2 bg-white"
                      />
                      <button
                        onClick={importarDosimetria}
                        disabled={dosimetriaEnviando || !processoRelacionado?.id}
                        className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {dosimetriaEnviando ? 'Importando...' : 'Importar Dosimetria'}
                      </button>
                    </div>

                    {!processoRelacionado?.id && !processoLoading && (
                      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                        Não foi possível localizar o processo automaticamente. Verifique o número informado.
                      </div>
                    )}
                    {dosimetriaErro && (
                      <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                        {dosimetriaErro}
                      </div>
                    )}
                    {dosimetriaSucesso && (
                      <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2">
                        {dosimetriaSucesso}
                      </div>
                    )}
                    {dosimetriaInfo?.valor_multa && (
                      <div className="text-[11px] text-indigo-900">
                        Valor identificado na planilha: <strong>{processosService.formatarValor(dosimetriaInfo.valor_multa)}</strong>
                      </div>
                    )}

                    <div className="pt-3 mt-1 border-t border-indigo-200 space-y-2">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-indigo-900">Despacho para DAF (GRM)</p>
                          <p className="text-xs text-indigo-800">
                            Registra o despacho manual ao DAF e anexa o documento ao processo.
                          </p>
                        </div>
                        <div className={`text-[11px] font-semibold px-2.5 py-1.5 rounded border ${
                          podeDespacharDaf
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {podeDespacharDaf ? 'Pronto para despacho' : 'Aguardando decisao procedente'}
                        </div>
                      </div>

                      {!podeDespacharDaf && (
                        <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                          O despacho ao DAF so deve ocorrer apos decisao procedente (ou equivalente).
                        </div>
                      )}

                      <textarea
                        value={despachoObservacao}
                        onChange={(e) => setDespachoObservacao(e.target.value)}
                        rows={2}
                        placeholder="Observacoes para o DAF (ex: emitir GRM e notificar com decisao)..."
                        className="block w-full text-xs text-gray-700 border border-indigo-200 rounded-md p-2 bg-white"
                      />
                      <div>
                        <label className="block text-[11px] font-medium text-indigo-900 mb-1">
                          Anexar despacho (DOC/DOCX/PDF)
                        </label>
                        <input
                          type="file"
                          accept=".doc,.docx,.pdf"
                          onChange={(e) => setDespachoArquivo(e.target.files?.[0] || null)}
                          className="block w-full text-xs text-gray-700 border border-indigo-200 rounded-md p-2 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[140px_auto] gap-2 items-center">
                        <div>
                          <label className="block text-[11px] font-medium text-indigo-900 mb-1">Prazo (dias)</label>
                          <input
                            type="number"
                            min={1}
                            value={despachoPrazoDias}
                            onChange={(e) => setDespachoPrazoDias(Number(e.target.value) || 15)}
                            className="block w-full text-xs text-gray-700 border border-indigo-200 rounded-md p-2 bg-white"
                          />
                        </div>
                        <div className="md:pt-5">
                          <button
                            onClick={despacharParaDaf}
                            disabled={despachoEnviando || !processoRelacionado?.id || !podeDespacharDaf}
                            className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60 text-xs"
                          >
                            {despachoEnviando ? 'Despachando...' : 'Despachar para DAF'}
                          </button>
                        </div>
                      </div>

                      {despachoErro && (
                        <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded p-2">
                          {despachoErro}
                        </div>
                      )}
                      {despachoSucesso && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2">
                          {despachoSucesso}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Descrição */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Descrição da Petição</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {peticao.descricao}
                  </p>
                </div>
              </div>
              
              {/* Pedidos */}
              {peticao.pedidos && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Pedidos</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {peticao.pedidos}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* RESPOSTAS */}
          {activeTab === 'respostas' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h4 className="text-lg font-semibold text-gray-900">
                  Respostas e Comunicações
                </h4>
                <div className="flex flex-wrap gap-2">
                  {respostaAtual?.arquivo_resposta && (
                    <button
                      onClick={() => window.open(respostaAtual.arquivo_resposta, '_blank')}
                      className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 text-sm"
                    >
                      Visualizar Resposta
                    </button>
                  )}
                  <button
                    onClick={abrirModalResposta}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    {respostaAtual ? 'Substituir Arquivo' : 'Anexar Resposta'}
                  </button>
                  {respostaAtual && (
                    <button
                      onClick={handleEnviarResposta}
                      disabled={enviandoResposta}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm disabled:opacity-60"
                    >
                      Enviar por e-mail
                    </button>
                  )}
                </div>
              </div>
              
              {respostas.length === 0 ? (
                <div className="text-center py-8">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma resposta registrada</p>
                  <p className="text-sm text-gray-400 mt-1">
                    As respostas enviadas ao peticionário aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {respostas.map((resposta, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {resposta.tipo_resposta === 'PROCEDENTE' ? '✅ Procedente' :
                             resposta.tipo_resposta === 'IMPROCEDENTE' ? '⛔ Improcedente' :
                             resposta.tipo_resposta === 'PARCIALMENTE_PROCEDENTE' ? '➗ Parcialmente Procedente' :
                             resposta.tipo_resposta === 'ORIENTACAO' ? '📋 Orientação' :
                             resposta.tipo_resposta === 'ENCAMINHAMENTO' ? '📎 Encaminhamento' :
                             resposta.tipo_resposta === 'ARQUIVAMENTO' ? '📁 Arquivamento' :
                             '💬 Resposta'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Por: {resposta.responsavel?.nome || resposta.responsavel?.username || 'Sistema'} • {new Date(resposta.data_envio || resposta.data_elaboracao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          resposta.enviado_email 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {resposta.enviado_email ? 'Enviado por e-mail' : 'Interno'}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {resposta.conteudo || 'Resposta anexada em arquivo.'}
                        </p>
                      </div>
                      
                      {resposta.arquivo_resposta && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-2">Anexos:</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => window.open(resposta.arquivo_resposta, '_blank')}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-200"
                            >
                              📄 Abrir resposta
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 border-t pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Documentos Jurídicos</h4>
                  <div className="flex flex-wrap gap-2">
                    {possuiDecisao && (
                      <button
                        onClick={handleNotificarDisponibilidade}
                        disabled={notificandoDisponibilidade}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm disabled:opacity-60"
                      >
                        {notificandoDisponibilidade ? 'Enviando...' : 'Notificar disponibilidade'}
                      </button>
                    )}
                    <button
                      onClick={abrirModalDocumento}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                    >
                      Anexar Parecer/Decisão
                    </button>
                  </div>
                </div>

                {notificacaoDisponibilidadeErro && (
                  <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                    {notificacaoDisponibilidadeErro}
                  </div>
                )}
                {notificacaoDisponibilidadeSucesso && (
                  <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
                    {notificacaoDisponibilidadeSucesso}
                  </div>
                )}

                {documentosJuridicos.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum parecer ou decisão anexado.</p>
                ) : (
                  <div className="space-y-3">
                    {documentosJuridicos.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3 bg-white">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {doc.titulo} ({doc.tipo})
                          </p>
                          {doc.descricao && (
                            <p className="text-xs text-gray-500">{doc.descricao}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            {doc.data_upload ? new Date(doc.data_upload).toLocaleDateString('pt-BR') : ''}
                          </p>
                        </div>
                        {doc.arquivo && (
                          <button
                            onClick={() => window.open(doc.arquivo, '_blank')}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Abrir
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* ANEXOS */}
          {activeTab === 'anexos' && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-6">
                Anexos da Petição
              </h4>
              
              {anexos.length === 0 ? (
                <div className="text-center py-8">
                  <PaperClipIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum anexo encontrado</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {anexos.map((anexo, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900 truncate">
                            {anexo.nome_arquivo}
                          </span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Download
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Tamanho: {(anexo.tamanho_bytes / 1024 / 1024).toFixed(2)} MB</p>
                        <p>Tipo: {anexo.tipo_mime}</p>
                        {anexo.descricao && (
                          <p className="italic">"{anexo.descricao}"</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Adicionado em {new Date(anexo.data_upload).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* HISTÓRICO */}
          {activeTab === 'historico' && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-6">
                Histórico da Petição
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 bg-blue-50 p-4 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Petição criada</p>
                    <p className="text-sm text-blue-700">
                      Petição registrada no sistema pelo cidadão
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {new Date(peticao.criado_em).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(peticao.criado_em).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                {peticao.data_recebimento && (
                  <div className="flex items-start space-x-3 bg-green-50 p-4 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Petição recebida</p>
                      <p className="text-sm text-green-700">
                        Confirmado recebimento pela instituição
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {new Date(peticao.data_recebimento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
                
                {peticao.status === 'EM_ANALISE' && (
                  <div className="flex items-start space-x-3 bg-yellow-50 p-4 rounded-lg">
                    <EyeIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Em análise</p>
                      <p className="text-sm text-yellow-700">
                        Petição sendo analisada pela equipe técnica
                      </p>
                    </div>
                  </div>
                )}
                
                {peticao.status === 'RESPONDIDA' && (
                  <div className="flex items-start space-x-3 bg-purple-50 p-4 rounded-lg">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-900">Petição respondida</p>
                      <p className="text-sm text-purple-700">
                        Resposta oficial enviada ao peticionário
                      </p>
                      {peticao.data_resposta && (
                        <p className="text-xs text-purple-600 mt-1">
                          {new Date(peticao.data_resposta).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Petição gerada automaticamente pelo sistema
            </div>
            
            <div className="flex space-x-3">
              <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm">
                Imprimir
              </button>
              <button
                onClick={abrirModalResposta}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                {respostaAtual ? 'Substituir resposta' : 'Anexar resposta'}
              </button>
              <button 
                onClick={onClose}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {showRespostaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {respostaAtual ? 'Substituir resposta' : 'Anexar resposta'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Envie um arquivo DOCX ou PDF com a resposta oficial.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo da resposta
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setRespostaArquivo(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md p-2"
                />
              </div>

              {respostaErro && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {respostaErro}
                </div>
              )}
            </div>

            <div className="p-5 border-t flex justify-end gap-2">
              <button
                onClick={fecharModalResposta}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUploadResposta}
                disabled={enviandoResposta}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
              >
                {enviandoResposta ? 'Enviando...' : 'Salvar resposta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDocumentoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Anexar Parecer/Decisão</h3>
              <p className="text-sm text-gray-500 mt-1">
                Selecione o tipo e envie o arquivo em DOCX ou PDF.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo do documento</label>
                <select
                  value={documentoTipo}
                  onChange={(e) => handleDocumentoTipoChange(e.target.value)}
                  className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md p-2"
                >
                  <option value="PARECER">Parecer</option>
                  <option value="DECISAO">Decisão</option>
                </select>
              </div>

              {documentoTipo === 'DECISAO' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resultado</label>
                    <select
                      value={decisaoResultado}
                      onChange={(e) => setDecisaoResultado(e.target.value)}
                      className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md p-2"
                    >
                      <option value="procedente">Procedente</option>
                      <option value="parcial">Procedente Parcial</option>
                      <option value="improcedente">Improcedente</option>
                      <option value="anulatoria_ai">Decisão Anulatória do AI</option>
                      <option value="sanar_vicio">Despacho para sanar vício</option>
                    </select>
                  </div>

                  {decisaoResultado !== 'improcedente' && !instanciaJuridico2 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prazo recurso (dias)</label>
                        <input
                          type="number"
                          min={1}
                          value={decisaoPrazoRecursoDias}
                          onChange={(e) => setDecisaoPrazoRecursoDias(Number(e.target.value || 15))}
                          className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Valor multa (opcional)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={decisaoValorMulta}
                          onChange={(e) => setDecisaoValorMulta(e.target.value)}
                          placeholder="Ex: 12345,67"
                          className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md p-2"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Observação (opcional)</label>
                    <textarea
                      rows={3}
                      value={decisaoObservacao}
                      onChange={(e) => setDecisaoObservacao(e.target.value)}
                      className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md p-2"
                      placeholder="Detalhe da decisão ou encaminhamento."
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arquivo</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setDocumentoArquivo(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md p-2"
                />
              </div>

              {documentoErro && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {documentoErro}
                </div>
              )}
            </div>

            <div className="p-5 border-t flex justify-end gap-2">
              <button
                onClick={fecharModalDocumento}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUploadDocumentoJuridico}
                disabled={enviandoResposta}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
              >
                {enviandoResposta ? 'Enviando...' : 'Salvar documento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PeticaoDetalhes;
