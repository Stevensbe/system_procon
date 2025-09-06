import React, { useState, useEffect } from 'react';
import { 
  FunnelIcon,
  MagnifyingGlassIcon,
  ScaleIcon,
  EyeIcon,
  DocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  GavelIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import analiseJuridicaService from '../../services/analiseJuridicaService';

const GestaoRecursos = ({ onRecursoSelect, onNovoRecurso }) => {
  const [loading, setLoading] = useState(false);
  const [recursos, setRecursos] = useState([]);
  const [filtros, setFiltros] = useState({
    status: '',
    tipo_recurso: '',
    relator: '',
    prazo_vencimento: '',
    requerente: '',
    data_inicio: '',
    data_fim: '',
    valor_minimo: '',
    valor_maximo: ''
  });
  const [ordenacao, setOrdenacao] = useState('-data_abertura');
  const [paginacao, setPaginacao] = useState({
    pagina_atual: 1,
    total_paginas: 1,
    total_items: 0,
    items_por_pagina: 15
  });

  useEffect(() => {
    carregarRecursos();
  }, [filtros, ordenacao, paginacao.pagina_atual]);

  const carregarRecursos = async () => {
    setLoading(true);
    try {
      const params = {
        ...filtros,
        ordering: ordenacao,
        page: paginacao.pagina_atual,
        page_size: paginacao.items_por_pagina
      };
      
      const response = await analiseJuridicaService.listarRecursos(params);
      setRecursos(response.results || []);
      setPaginacao(prev => ({
        ...prev,
        total_paginas: Math.ceil((response.count || 0) / paginacao.items_por_pagina),
        total_items: response.count || 0
      }));
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
      // Dados simulados
      setRecursos([
        {
          id: 1,
          numero_recurso: 'REC-2025-0000045',
          tipo_recurso: 'MULTA',
          requerente_nome: 'João Silva Santos',
          requerente_documento: '123.456.789-00',
          numero_processo_origem: 'MUL-2025-0001234',
          status: 'EM_ANALISE',
          data_abertura: '2025-08-10T09:00:00Z',
          prazo_resposta: 30,
          fundamentacao: 'Recurso contra multa por propaganda enganosa',
          valor_causa: 5000.00,
          relator: { first_name: 'Maria', last_name: 'Jurídica' },
          tem_parecer: false,
          prioridade: 'ALTA'
        },
        {
          id: 2,
          numero_recurso: 'REC-2025-0000046',
          tipo_recurso: 'AUTO_INFRACAO',
          requerente_nome: 'Empresa XYZ Ltda',
          requerente_documento: '12.345.678/0001-90',
          numero_processo_origem: 'AUT-2025-0002345',
          status: 'PENDENTE_INFORMACOES',
          data_abertura: '2025-08-12T14:30:00Z',
          prazo_resposta: 15,
          fundamentacao: 'Recurso contra auto de infração por irregularidades',
          valor_causa: 15000.00,
          relator: { first_name: 'Carlos', last_name: 'Legal' },
          tem_parecer: true,
          prioridade: 'URGENTE'
        },
        {
          id: 3,
          numero_recurso: 'REC-2025-0000047',
          tipo_recurso: 'FISCALIZACAO',
          requerente_nome: 'Maria Fernanda Costa',
          requerente_documento: '987.654.321-00',
          numero_processo_origem: 'FISC-2025-0003456',
          status: 'PARECER_EMITIDO',
          data_abertura: '2025-08-05T10:00:00Z',
          prazo_resposta: 20,
          fundamentacao: 'Recurso contra decisão de fiscalização',
          valor_causa: 2500.00,
          relator: { first_name: 'Ana', last_name: 'Parecerista' },
          tem_parecer: true,
          prioridade: 'NORMAL'
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
      tipo_recurso: '',
      relator: '',
      prazo_vencimento: '',
      requerente: '',
      data_inicio: '',
      data_fim: '',
      valor_minimo: '',
      valor_maximo: ''
    });
  };

  const calcularDiasAnalise = (dataAbertura) => {
    const data = new Date(dataAbertura);
    const hoje = new Date();
    return Math.ceil((hoje - data) / (1000 * 60 * 60 * 24));
  };

  const calcularPrazoRestante = (dataAbertura, prazoResposta) => {
    const diasAnalise = calcularDiasAnalise(dataAbertura);
    return prazoResposta - diasAnalise;
  };

  const formatarStatus = (status) => {
    const statusMap = {
      'AGUARDANDO_ANALISE': { label: 'Aguardando Análise', color: 'blue', icon: ClockIcon },
      'EM_ANALISE': { label: 'Em Análise', color: 'yellow', icon: EyeIcon },
      'PENDENTE_INFORMACOES': { label: 'Pend. Informações', color: 'orange', icon: ExclamationTriangleIcon },
      'PARECER_EMITIDO': { label: 'Parecer Emitido', color: 'purple', icon: DocumentCheckIcon },
      'DEFERIDO': { label: 'Deferido', color: 'green', icon: CheckCircleIcon },
      'INDEFERIDO': { label: 'Indeferido', color: 'red', icon: ExclamationTriangleIcon },
      'PARCIALMENTE_DEFERIDO': { label: 'Parcialmente Deferido', color: 'yellow', icon: ScaleIcon },
    };
    
    return statusMap[status] || { label: status, color: 'gray', icon: ExclamationTriangleIcon };
  };

  const formatarTipoRecurso = (tipo) => {
    const tipoMap = {
      'MULTA': { label: 'Multa', color: 'red', icon: '💰' },
      'AUTO_INFRACAO': { label: 'Auto de Infração', color: 'orange', icon: '⚠️' },
      'FISCALIZACAO': { label: 'Fiscalização', color: 'blue', icon: '🔍' },
      'ADMINISTRATIVO': { label: 'Administrativo', color: 'purple', icon: '📋' },
      'RECONSIDERACAO': { label: 'Reconsideração', color: 'yellow', icon: '🔄' },
    };
    
    return tipoMap[tipo] || { label: tipo, color: 'gray', icon: '📄' };
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

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestão de Recursos Administrativos</h3>
          <p className="text-gray-600">
            Analise, julgue e acompanhe recursos administrativos
          </p>
        </div>
        
        <button
          onClick={onNovoRecurso}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Novo Recurso
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtros Avançados
          </h4>
          <button
            onClick={limparFiltros}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filtros.status}
              onChange={(e) => handleFiltroChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="AGUARDANDO_ANALISE">Aguardando Análise</option>
              <option value="EM_ANALISE">Em Análise</option>
              <option value="PENDENTE_INFORMACOES">Pendente Informações</option>
              <option value="PARECER_EMITIDO">Parecer Emitido</option>
              <option value="DEFERIDO">Deferido</option>
              <option value="INDEFERIDO">Indeferido</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filtros.tipo_recurso}
              onChange={(e) => handleFiltroChange('tipo_recurso', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os tipos</option>
              <option value="MULTA">Multa</option>
              <option value="AUTO_INFRACAO">Auto de Infração</option>
              <option value="FISCALIZACAO">Fiscalização</option>
              <option value="ADMINISTRATIVO">Administrativo</option>
              <option value="RECONSIDERACAO">Reconsideração</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Relator</label>
            <input
              type="text"
              value={filtros.relator}
              onChange={(e) => handleFiltroChange('relator', e.target.value)}
              placeholder="Nome do relator"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordenação</label>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="-data_abertura">Mais recentes</option>
              <option value="data_abertura">Mais antigos</option>
              <option value="prazo_resposta">Prazo (crescente)</option>
              <option value="-prazo_resposta">Prazo (decrescente)</option>
              <option value="requerente_nome">Requerente (A-Z)</option>
              <option value="-valor_causa">Valor (maior)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requerente</label>
            <input
              type="text"
              value={filtros.requerente}
              onChange={(e) => handleFiltroChange('requerente', e.target.value)}
              placeholder="Nome ou documento"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              value={filtros.data_inicio}
              onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              value={filtros.data_fim}
              onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Causa</label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={filtros.valor_minimo}
                onChange={(e) => handleFiltroChange('valor_minimo', e.target.value)}
                placeholder="Mínimo"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={filtros.valor_maximo}
                onChange={(e) => handleFiltroChange('valor_maximo', e.target.value)}
                placeholder="Máximo"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              Recursos Encontrados ({paginacao.total_items})
            </h4>
            <button
              onClick={carregarRecursos}
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
          ) : recursos.length === 0 ? (
            <div className="text-center py-8">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum recurso encontrado</p>
              <p className="text-sm text-gray-400 mt-1">Ajuste os filtros ou tente uma nova busca</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recurso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requerente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processo Origem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Relator
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
                {recursos.map((recurso) => {
                  const status = formatarStatus(recurso.status);
                  const tipoRecurso = formatarTipoRecurso(recurso.tipo_recurso);
                  const prioridade = formatarPrioridade(recurso.prioridade);
                  const diasAnalise = calcularDiasAnalise(recurso.data_abertura);
                  const prazoRestante = calcularPrazoRestante(recurso.data_abertura, recurso.prazo_resposta);
                  
                  return (
                    <tr key={recurso.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onRecursoSelect(recurso)}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-blue-600">
                              {analiseJuridicaService.formatarNumeroRecurso(recurso.numero_recurso)}
                            </span>
                            {recurso.tem_parecer && (
                              <DocumentCheckIcon className="h-4 w-4 text-purple-600" />
                            )}
                          </div>
                          <div className="text-sm text-gray-900 mt-1 truncate max-w-xs">
                            {recurso.fundamentacao}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${tipoRecurso.color}-100 text-${tipoRecurso.color}-800`}>
                              {tipoRecurso.icon} {tipoRecurso.label}
                            </span>
                            <span className="text-lg">{prioridade.icon}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {recurso.requerente_nome}
                          </div>
                          <div className="text-sm text-gray-500">
                            {recurso.requerente_documento}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {recurso.numero_processo_origem}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {recurso.relator ? 
                            `${recurso.relator.first_name} ${recurso.relator.last_name}` : 
                            'Não atribuído'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className={`font-medium ${
                            prazoRestante < 0 ? 'text-red-600' :
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
                          {recurso.valor_causa ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(recurso.valor_causa) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRecursoSelect(recurso);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver detalhes"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Ação de emitir parecer
                            }}
                            className="text-purple-600 hover:text-purple-900"
                            title="Emitir parecer"
                          >
                            <DocumentCheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Ação de julgar
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Julgar recurso"
                          >
                            <GavelIcon className="h-4 w-4" />
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
    </div>
  );
};

export default GestaoRecursos;