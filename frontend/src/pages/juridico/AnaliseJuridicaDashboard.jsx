import React, { useState, useEffect } from 'react';
import { 
  DocumentMagnifyingGlassIcon,
  ClipboardDocumentCheckIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentPlusIcon,
  ChartBarIcon,
  ArrowPathIcon,
  FolderOpenIcon,
  GavelIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import analiseJuridicaService from '../../services/analiseJuridicaService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RecursoDetalhes from '../../components/juridico/RecursoDetalhes';
import ParecerForm from '../../components/juridico/ParecerForm';
import GestaoRecursos from '../../components/juridico/GestaoRecursos';

const AnaliseJuridicaDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState(null);
  const [recursosPendentes, setRecursosPendentes] = useState([]);
  const [recursosPrazo, setRecursosPrazo] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [recursoSelecionado, setRecursoSelecionado] = useState(null);
  const [mostrarParecer, setMostrarParecer] = useState(false);
  const [recursoParaParecer, setRecursoParaParecer] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [dados, pendentes, prazo] = await Promise.all([
        analiseJuridicaService.obterDadosDashboard(),
        analiseJuridicaService.listarRecursosPendentes(),
        analiseJuridicaService.listarRecursosPrazo()
      ]);
      
      setEstatisticas(dados);
      setRecursosPendentes(pendentes.results || pendentes || []);
      setRecursosPrazo(prazo.results || prazo || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Dados simulados para demonstração
      setEstatisticas({
        total_recursos: 234,
        recursos_mes: 28,
        em_analise: 45,
        deferidos: 89,
        indeferidos: 67,
        pendentes_informacoes: 12,
        pareceres_emitidos: 156,
        em_atraso: 8
      });
      
      setRecursosPendentes([
        {
          id: 1,
          numero_recurso: 'REC-2025-0000045',
          tipo_recurso: 'MULTA',
          requerente_nome: 'João Silva Santos',
          numero_processo_origem: 'MUL-2025-0001234',
          status: 'EM_ANALISE',
          data_abertura: '2025-08-10T09:00:00Z',
          prazo_resposta: 30,
          fundamentacao: 'Recurso contra multa por propaganda enganosa',
          relator: { first_name: 'Maria', last_name: 'Jurídica' }
        },
        {
          id: 2,
          numero_recurso: 'REC-2025-0000046',
          tipo_recurso: 'AUTO_INFRACAO',
          requerente_nome: 'Empresa XYZ Ltda',
          numero_processo_origem: 'AUT-2025-0002345',
          status: 'PENDENTE_INFORMACOES',
          data_abertura: '2025-08-12T14:30:00Z',
          prazo_resposta: 15,
          fundamentacao: 'Recurso contra auto de infração por irregularidades',
          relator: { first_name: 'Carlos', last_name: 'Legal' }
        }
      ]);
      
      setRecursosPrazo([
        {
          id: 3,
          numero_recurso: 'REC-2025-0000047',
          requerente_nome: 'Maria Silva',
          data_abertura: '2025-08-05T10:00:00Z',
          prazo_resposta: 20,
          status: 'EM_ANALISE'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading && activeTab === 'dashboard') {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Análise Jurídica
          </h1>
          <p className="text-gray-600">
            Gestão de recursos, pareceres e decisões administrativas
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveTab('novo-recurso')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DocumentPlusIcon className="h-5 w-5 mr-2" />
            Novo Recurso
          </button>
          <button
            onClick={carregarDados}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
          { id: 'recursos', label: 'Recursos', icon: ScaleIcon },
          { id: 'pareceres', label: 'Pareceres', icon: ClipboardDocumentCheckIcon },
          { id: 'decisoes', label: 'Decisões', icon: GavelIcon },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'dashboard' && (
        <>
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium uppercase tracking-wider">
                    Total Recursos
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.total_recursos?.toLocaleString()}
                  </p>
                </div>
                <ScaleIcon className="h-10 w-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium uppercase tracking-wider">
                    Este Mês
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.recursos_mes?.toLocaleString()}
                  </p>
                </div>
                <DocumentPlusIcon className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium uppercase tracking-wider">
                    Em Análise
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.em_analise?.toLocaleString()}
                  </p>
                </div>
                <DocumentMagnifyingGlassIcon className="h-10 w-10 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-medium uppercase tracking-wider">
                    Deferidos
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.deferidos?.toLocaleString()}
                  </p>
                </div>
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium uppercase tracking-wider">
                    Indeferidos
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.indeferidos?.toLocaleString()}
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-10 w-10 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium uppercase tracking-wider">
                    Pend. Info
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.pendentes_informacoes?.toLocaleString()}
                  </p>
                </div>
                <ClockIcon className="h-10 w-10 text-orange-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium uppercase tracking-wider">
                    Pareceres
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.pareceres_emitidos?.toLocaleString()}
                  </p>
                </div>
                <ClipboardDocumentCheckIcon className="h-10 w-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 text-sm font-medium uppercase tracking-wider">
                    Em Atraso
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.em_atraso?.toLocaleString()}
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
              </div>
            </div>
          </div>

          {/* Seções de Recursos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recursos Pendentes */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-yellow-500" />
                  Recursos Pendentes de Análise
                </h3>
              </div>
              <div className="p-6">
                {recursosPendentes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nenhum recurso pendente
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recursosPendentes.slice(0, 5).map(recurso => {
                      const status = analiseJuridicaService.formatarStatus(recurso.status);
                      const tipo = analiseJuridicaService.formatarTipoRecurso(recurso.tipo_recurso);
                      const diasAnalise = analiseJuridicaService.calcularDiasRecurso(recurso.data_abertura);
                      const prazoRestante = analiseJuridicaService.calcularPrazoRestante(recurso.data_abertura, recurso.prazo_resposta);
                      const prazoInfo = analiseJuridicaService.formatarPrazo(prazoRestante);
                      
                      return (
                        <div key={recurso.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-blue-600">
                                {analiseJuridicaService.formatarNumeroRecurso(recurso.numero_recurso)}
                              </p>
                              <p className="text-sm text-gray-900 mt-1">
                                {recurso.fundamentacao}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Requerente:</strong> {recurso.requerente_nome}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Processo:</strong> {recurso.numero_processo_origem}
                              </p>
                              {recurso.relator && (
                                <p className="text-sm text-gray-600">
                                  <strong>Relator:</strong> {recurso.relator.first_name} {recurso.relator.last_name}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium bg-${tipo.color}-100 text-${tipo.color}-800`}>
                                  {tipo.icon} {tipo.label}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col items-end">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                                {status.label}
                              </span>
                              <span className={`text-xs mt-1 px-2 py-1 rounded bg-${prazoInfo.color}-100 text-${prazoInfo.color}-800`}>
                                {prazoInfo.icon} {prazoInfo.label}
                              </span>
                              <span className="text-xs text-gray-500 mt-1">
                                {diasAnalise} dias
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recursos Próximos do Prazo */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-500" />
                  Recursos Próximos do Prazo
                </h3>
              </div>
              <div className="p-6">
                {recursosPrazo.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nenhum recurso próximo do prazo
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recursosPrazo.slice(0, 5).map(recurso => {
                      const prazoRestante = analiseJuridicaService.calcularPrazoRestante(recurso.data_abertura, recurso.prazo_resposta);
                      const prazoInfo = analiseJuridicaService.formatarPrazo(prazoRestante);
                      const status = analiseJuridicaService.formatarStatus(recurso.status);
                      
                      return (
                        <div key={recurso.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-blue-600">
                                {analiseJuridicaService.formatarNumeroRecurso(recurso.numero_recurso)}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Requerente:</strong> {recurso.requerente_nome}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Aberto em {new Date(recurso.data_abertura).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="ml-4 flex flex-col items-end">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800 mb-1`}>
                                {status.label}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded font-medium bg-${prazoInfo.color}-100 text-${prazoInfo.color}-800`}>
                                {prazoInfo.icon} {prazoInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'recursos' && (
        <GestaoRecursos 
          onRecursoSelect={(recurso) => setRecursoSelecionado(recurso)}
          onNovoRecurso={() => {
            // Implementar novo recurso
            setActiveTab('dashboard');
          }}
        />
      )}

      {activeTab === 'pareceres' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <ClipboardDocumentCheckIcon className="h-6 w-6 mr-2 text-blue-600" />
            Pareceres Jurídicos
          </h3>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h4 className="font-medium text-blue-800">Sistema de Pareceres</h4>
                <p className="mt-1 text-sm text-blue-700">
                  Interface completa para elaboração, revisão e gestão de pareceres jurídicos.
                  Acesse recursos individuais para emitir pareceres específicos.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center py-8">
            <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Pareceres Jurídicos
            </h4>
            <p className="text-gray-600 mb-6">
              Navegue até a aba "Recursos" para acessar recursos específicos e emitir pareceres
            </p>
            <button 
              onClick={() => setActiveTab('recursos')}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
            >
              Ir para Recursos
            </button>
          </div>
        </div>
      )}

      {activeTab === 'decisoes' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <GavelIcon className="h-6 w-6 mr-2 text-blue-600" />
            Decisões Administrativas
          </h3>
          
          <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h4 className="font-medium text-purple-800">Sistema de Decisões</h4>
                <p className="mt-1 text-sm text-purple-700">
                  Interface para tomada de decisões administrativas baseadas em pareceres jurídicos.
                  Julgue recursos e publique decisões oficiais.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center py-8">
            <GavelIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Decisões Administrativas
            </h4>
            <p className="text-gray-600 mb-6">
              Navegue até a aba "Recursos" para acessar recursos com pareceres e tomar decisões
            </p>
            <button 
              onClick={() => setActiveTab('recursos')}
              className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700"
            >
              Ir para Recursos
            </button>
          </div>
        </div>
      )}
      
      {/* Modal de Detalhes do Recurso */}
      {recursoSelecionado && (
        <RecursoDetalhes 
          recurso={recursoSelecionado}
          onClose={() => setRecursoSelecionado(null)}
          onUpdate={(recursoAtualizado) => {
            // Atualizar dados e fechar modal
            carregarDados();
            setRecursoSelecionado(null);
          }}
        />
      )}
      
      {/* Modal de Parecer */}
      {mostrarParecer && recursoParaParecer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <ParecerForm 
              recurso={recursoParaParecer}
              onSuccess={(parecer) => {
                carregarDados();
                setMostrarParecer(false);
                setRecursoParaParecer(null);
              }}
              onCancel={() => {
                setMostrarParecer(false);
                setRecursoParaParecer(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnaliseJuridicaDashboard;