import React, { useState, useEffect } from 'react';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import peticionamentoService from '../../services/peticionamentoService';
import { useAuth } from '../../context/SupabaseAuthContext';

const GestaoInterna = ({ onPeticaoSelect, setorDestino = '' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [peticoes, setPeticoes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  const [showDistribuirModal, setShowDistribuirModal] = useState(false);
  const [peticaoDistribuir, setPeticaoDistribuir] = useState(null);
  const [usuarioDestinoId, setUsuarioDestinoId] = useState('');
  const [filtros, setFiltros] = useState({
    status: '',
    categoria: '',
    prazo_vencimento: '',
    peticionario: '',
    empresa: '',
    data_inicio: '',
    data_fim: ''
  });
  const [ordenacao, setOrdenacao] = useState('-criado_em');
  const [paginacao, setPaginacao] = useState({
    pagina_atual: 1,
    total_paginas: 1,
    total_items: 0,
    items_por_pagina: 10
  });

  useEffect(() => {
    carregarPeticoes();
  }, [filtros, ordenacao, paginacao.pagina_atual, setorDestino]);

  const carregarPeticoes = async () => {
    setLoading(true);
    try {
      const params = {
        ...filtros,
        ordering: ordenacao,
        page: paginacao.pagina_atual,
        page_size: paginacao.items_por_pagina
      };

      if (setorDestino) {
        params.setor_destino = setorDestino;
      }

      const response = await peticionamentoService.listarPeticoes(params);
      setPeticoes(response.results || []);
      setPaginacao(prev => ({
        ...prev,
        total_paginas: Math.ceil((response.count || 0) / paginacao.items_por_pagina),
        total_items: response.count || 0
      }));
    } catch (error) {
      console.error('Erro ao carregar petições:', error);
      // Dados simulados
      setPeticoes([
        {
          id: 1,
          numero_peticao: 'PET-2025-0000123',
          assunto: 'Reclamação sobre produto com defeito',
          peticionario_nome: 'João Silva Santos',
          peticionario_documento: '123.456.789-00',
          tipo_peticao: { nome: 'Reclamação', categoria: 'RECLAMACAO' },
          status: 'EM_ANALISE',
          criado_em: '2025-08-15T10:30:00Z',
          prazo_resposta: 30,
          empresa_nome: 'Loja XYZ Ltda',
          valor_causa: 1500.00,
          analista_responsavel: { nome: 'Maria Santos' },
          tem_anexos: true,
          prioridade: 'NORMAL'
        },
        {
          id: 2,
          numero_peticao: 'PET-2025-0000124',
          assunto: 'Solicitação de cancelamento de serviço',
          peticionario_nome: 'Maria Fernanda Costa',
          peticionario_documento: '987.654.321-00',
          tipo_peticao: { nome: 'Solicitação', categoria: 'SOLICITACAO' },
          status: 'PENDENTE_DOCUMENTACAO',
          criado_em: '2025-08-14T14:20:00Z',
          prazo_resposta: 15,
          empresa_nome: 'Telecom ABC',
          valor_causa: 800.00,
          analista_responsavel: null,
          tem_anexos: false,
          prioridade: 'ALTA'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
    setPaginacao(prev => ({ ...prev, pagina_atual: 1 }));
  };

  const limparFiltros = () => {
    setFiltros({
      status: '',
      categoria: '',
      prazo_vencimento: '',
      peticionario: '',
      empresa: '',
      data_inicio: '',
      data_fim: ''
    });
  };

  const calcularDiasAnalise = (dataCriacao) => {
    const data = new Date(dataCriacao);
    const hoje = new Date();
    return Math.ceil((hoje - data) / (1000 * 60 * 60 * 24));
  };

  const calcularPrazoRestante = (dataCriacao, prazoResposta) => {
    const diasAnalise = calcularDiasAnalise(dataCriacao);
    return prazoResposta - diasAnalise;
  };

  const formatarStatus = (status) => {
    const statusMap = {
      'RASCUNHO': { label: 'Rascunho', color: 'gray', icon: DocumentTextIcon },
      'ENVIADA': { label: 'Enviada', color: 'blue', icon: ArrowPathIcon },
      'RECEBIDA': { label: 'Recebida', color: 'green', icon: CheckCircleIcon },
      'EM_ANALISE': { label: 'Em Análise', color: 'yellow', icon: EyeIcon },
      'PENDENTE_DOCUMENTACAO': { label: 'Pend. Documentação', color: 'orange', icon: ExclamationTriangleIcon },
      'RESPONDIDA': { label: 'Respondida', color: 'purple', icon: ChatBubbleLeftRightIcon },
      'FINALIZADA': { label: 'Finalizada', color: 'green', icon: CheckCircleIcon },
      'INDEFERIDA': { label: 'Indeferida', color: 'red', icon: ExclamationTriangleIcon },
    };

    return statusMap[status] || { label: status, color: 'gray', icon: ExclamationTriangleIcon };
  };

  const formatarCategoria = (categoria) => {
    const categoriaMap = {
      'RECLAMACAO': { label: 'Reclamação', color: 'red', icon: '⚠️' },
      'DENUNCIA': { label: 'Denúncia', color: 'orange', icon: '🚨' },
      'SOLICITACAO': { label: 'Solicitação', color: 'blue', icon: '📋' },
      'SUGESTAO': { label: 'Sugestão', color: 'green', icon: '💡' },
      'RECURSO': { label: 'Recurso', color: 'purple', icon: '⚖️' },
    };

    return categoriaMap[categoria] || { label: categoria, color: 'gray', icon: '📄' };
  };

  const formatarPrioridade = (prioridade) => {
    const prioridadeMap = {
      'BAIXA': { label: 'Baixa', color: 'green', icon: '🟢' },
      'NORMAL': { label: 'Normal', color: 'blue', icon: '🔵' },
      'ALTA': { label: 'Alta', color: 'orange', icon: '🟠' },
      'URGENTE': { label: 'Urgente', color: 'red', icon: '🔴' },
    };

    return prioridadeMap[prioridade] || { label: 'Normal', color: 'blue', icon: '🔵' };
  };

  const obterNomeResponsavel = (responsavel) => {
    if (!responsavel) {
      return '—';
    }
    const nome = `${responsavel.first_name || ''} ${responsavel.last_name || ''}`.trim();
    return nome || responsavel.username || responsavel.email || '—';
  };

  const handleAssumir = async (peticaoId) => {
    try {
      await peticionamentoService.atribuirResponsavel(peticaoId);
      await carregarPeticoes();
    } catch (error) {
      console.error('Erro ao assumir petição:', error);
      alert('Não foi possível assumir a petição. Tente novamente.');
    }
  };

  const carregarUsuarios = async () => {
    if (usuarios.length > 0) {
      return;
    }
    setUsuariosLoading(true);
    try {
      const lista = await peticionamentoService.listarUsuariosAtivos(true, setorDestino);
      setUsuarios(lista || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      alert('Não foi possível carregar usuários para distribuição.');
    } finally {
      setUsuariosLoading(false);
    }
  };

  const abrirDistribuir = async (peticao) => {
    setPeticaoDistribuir(peticao);
    setUsuarioDestinoId('');
    setShowDistribuirModal(true);
    await carregarUsuarios();
  };

  const fecharDistribuir = () => {
    setShowDistribuirModal(false);
    setPeticaoDistribuir(null);
    setUsuarioDestinoId('');
  };

  const confirmarDistribuir = async () => {
    if (!peticaoDistribuir || !usuarioDestinoId) {
      alert('Selecione um usuário para distribuir.');
      return;
    }
    try {
      await peticionamentoService.atribuirResponsavel(peticaoDistribuir.id, usuarioDestinoId);
      await carregarPeticoes();
      fecharDistribuir();
    } catch (error) {
      console.error('Erro ao distribuir petição:', error);
      alert('Não foi possível distribuir a petição. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestão Interna de Petições</h3>
        <p className="text-gray-600">
          Analise, responda e gerencie petições recebidas dos cidadãos
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtros de Pesquisa
          </h4>
          <button
            onClick={limparFiltros}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filtros.status}
              onChange={(e) => handleFiltroChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="ENVIADA">Enviada</option>
              <option value="RECEBIDA">Recebida</option>
              <option value="EM_ANALISE">Em Análise</option>
              <option value="PENDENTE_DOCUMENTACAO">Pendente Documentação</option>
              <option value="RESPONDIDA">Respondida</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="INDEFERIDA">Indeferida</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={filtros.categoria}
              onChange={(e) => handleFiltroChange('categoria', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              <option value="RECLAMACAO">Reclamação</option>
              <option value="DENUNCIA">Denúncia</option>
              <option value="SOLICITACAO">Solicitação</option>
              <option value="SUGESTAO">Sugestão</option>
              <option value="RECURSO">Recurso</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
            <select
              value={filtros.prazo_vencimento}
              onChange={(e) => handleFiltroChange('prazo_vencimento', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os prazos</option>
              <option value="vencido">Vencido</option>
              <option value="vence_hoje">Vence hoje</option>
              <option value="vence_5_dias">Vence em 5 dias</option>
              <option value="no_prazo">No prazo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordenação</label>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="-criado_em">Mais recentes</option>
              <option value="criado_em">Mais antigas</option>
              <option value="prazo_resposta">Prazo (crescente)</option>
              <option value="-prazo_resposta">Prazo (decrescente)</option>
              <option value="peticionario_nome">Peticionário (A-Z)</option>
              <option value="-valor_causa">Valor (maior)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peticionário</label>
            <input
              type="text"
              value={filtros.peticionario}
              onChange={(e) => handleFiltroChange('peticionario', e.target.value)}
              placeholder="Nome ou documento"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
            <input
              type="text"
              value={filtros.empresa}
              onChange={(e) => handleFiltroChange('empresa', e.target.value)}
              placeholder="Nome da empresa"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-gray-900">
              Petições Encontradas ({paginacao.total_items})
            </h4>
            <button
              onClick={carregarPeticoes}
              disabled={loading}
              className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : peticoes.length === 0 ? (
            <div className="text-center py-8">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma petição encontrada</p>
              <p className="text-sm text-gray-400 mt-1">Ajuste os filtros ou tente uma nova busca</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Petição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peticionário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prazo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {peticoes.map((peticao) => {
                  const status = formatarStatus(peticao.status);
                  const categoria = formatarCategoria(peticao.tipo_peticao?.categoria);
                  const prioridade = formatarPrioridade(peticao.prioridade);
                  const diasAnalise = calcularDiasAnalise(peticao.criado_em);
                  const prazoRestante = calcularPrazoRestante(peticao.criado_em, peticao.prazo_resposta);

                  return (
                    <tr key={peticao.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onPeticaoSelect(peticao)}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-blue-600">
                              {peticionamentoService.formatarNumeroPeticao(peticao.numero_peticao)}
                            </span>
                            {peticao.tem_anexos && (
                              <PaperClipIcon className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div className="text-sm text-gray-900 mt-1 truncate max-w-xs">
                            {peticao.assunto}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${categoria.color}-100 text-${categoria.color}-800`}>
                              {categoria.icon} {categoria.label}
                            </span>
                            <span className="text-lg">{prioridade.icon}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {peticao.peticionario_nome}
                          </div>
                          <div className="text-sm text-gray-500">
                            {peticao.peticionario_documento}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {peticao.empresa_nome || 'Não informado'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                          {status.label}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          Resp.: {obterNomeResponsavel(peticao.responsavel_atual)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className={`font-medium ${prazoRestante < 0 ? 'text-red-600' :
                              prazoRestante <= 5 ? 'text-orange-600' :
                                'text-green-600'
                            }`}>
                            {prazoRestante < 0 ? `${Math.abs(prazoRestante)} dias em atraso` :
                              prazoRestante === 0 ? 'Vence hoje' :
                                `${prazoRestante} dias restantes`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {diasAnalise} dias em análise
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {peticao.valor_causa ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(peticao.valor_causa) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPeticaoSelect(peticao);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const responsavelId = peticao.responsavel_atual?.id;
                              const usuarioId = user?.id;
                              if (responsavelId && responsavelId !== usuarioId) {
                                const confirmar = window.confirm('Esta petição já possui responsável. Deseja assumir mesmo assim?');
                                if (!confirmar) {
                                  return;
                                }
                              }
                              handleAssumir(peticao.id);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
                          >
                            {peticao.responsavel_atual ? 'Assumir' : 'Assumir'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirDistribuir(peticao);
                            }}
                            className="text-amber-600 hover:text-amber-900 text-xs font-medium"
                          >
                            Distribuir
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Ação de responder
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginação */}
        {paginacao.total_paginas > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {((paginacao.pagina_atual - 1) * paginacao.items_por_pagina) + 1} a{' '}
                {Math.min(paginacao.pagina_atual * paginacao.items_por_pagina, paginacao.total_items)} de{' '}
                {paginacao.total_items} resultados
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPaginacao(prev => ({ ...prev, pagina_atual: prev.pagina_atual - 1 }))}
                  disabled={paginacao.pagina_atual === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                <span className="text-sm text-gray-700">
                  Página {paginacao.pagina_atual} de {paginacao.total_paginas}
                </span>

                <button
                  onClick={() => setPaginacao(prev => ({ ...prev, pagina_atual: prev.pagina_atual + 1 }))}
                  disabled={paginacao.pagina_atual === paginacao.total_paginas}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDistribuirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Distribuir Petição</h4>
            <p className="text-sm text-gray-600 mb-4">
              Selecione o usuário responsável para a petição {peticaoDistribuir?.numero_peticao}.
            </p>

            {usuariosLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <select
                value={usuarioDestinoId}
                onChange={(e) => setUsuarioDestinoId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um usuário</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {`${usuario.first_name || ''} ${usuario.last_name || ''}`.trim() || usuario.username || usuario.email}
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={fecharDistribuir}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarDistribuir}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Distribuir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoInterna;
