import React, { useState, useEffect } from 'react';
import { 
  CpuChipIcon,
  LightBulbIcon,
  ChartBarIcon,
  CogIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAI } from '../../utils/aiAssistant';

const AIAssistantPanel = () => {
  const { 
    generateSuggestions, 
    getPredictions, 
    getFormSuggestions, 
    getOptimizations, 
    getStats,
    executeAutomation 
  } = useAI();
  
  const [suggestions, setSuggestions] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [optimizations, setOptimizations] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('suggestions');
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      const newSuggestions = generateSuggestions();
      const newPredictions = getPredictions();
      const newOptimizations = getOptimizations();
      const newStats = getStats();
      
      setSuggestions(newSuggestions);
      setPredictions(newPredictions);
      setOptimizations(newOptimizations);
      setStats(newStats);
    } catch (error) {
      console.error('Erro ao carregar dados da IA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleSuggestionAction = (suggestion) => {
    switch (suggestion.action) {
      case 'show_form_help':
        // Implementar ajuda de formulário
        console.log('Mostrando ajuda de formulário');
        break;
      case 'show_error_tips':
        // Implementar dicas de erro
        console.log('Mostrando dicas de erro');
        break;
      case 'show_quick_access':
        // Implementar acesso rápido
        console.log('Mostrando acesso rápido');
        break;
      case 'show_performance_tips':
        // Implementar dicas de performance
        console.log('Mostrando dicas de performance');
        break;
      default:
        console.log('Ação não implementada:', suggestion.action);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'low':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'medium':
        return <InformationCircleIcon className="h-4 w-4" />;
      case 'low':
        return <CheckCircleIcon className="h-4 w-4" />;
      default:
        return <InformationCircleIcon className="h-4 w-4" />;
    }
  };

  const formatConfidence = (confidence) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const renderSuggestions = () => (
    <div className="space-y-4">
      {suggestions.length === 0 ? (
        <div className="text-center py-8">
          <LightBulbIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Nenhuma sugestão disponível
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Continue usando o sistema para receber sugestões inteligentes.
          </p>
        </div>
      ) : (
        suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getPriorityColor(suggestion.priority)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getPriorityIcon(suggestion.priority)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {suggestion.title}
                </h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {suggestion.description}
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(suggestion.priority)}`}>
                    {suggestion.priority}
                  </span>
                  <button
                    onClick={() => handleSuggestionAction(suggestion)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderPredictions = () => (
    <div className="space-y-4">
      {predictions.length === 0 ? (
        <div className="text-center py-8">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Nenhuma previsão disponível
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Continue navegando para receber previsões baseadas no seu padrão de uso.
          </p>
        </div>
      ) : (
        predictions.map((prediction, index) => (
          <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-5 w-5 text-blue-500" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {prediction.action}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Baseado no seu histórico de navegação
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatConfidence(prediction.confidence)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Confiança
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderOptimizations = () => (
    <div className="space-y-4">
      {optimizations.length === 0 ? (
        <div className="text-center py-8">
          <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Nenhuma otimização necessária
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            O sistema está funcionando de forma otimizada.
          </p>
        </div>
      ) : (
        optimizations.map((optimization, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getPriorityColor(optimization.priority)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getPriorityIcon(optimization.priority)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {optimization.type}
                </h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {optimization.message}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderStats = () => (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalInteractions || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Interações</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.totalNavigations || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Navegações</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.totalFormInteractions || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Formulários</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.totalErrors || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Erros</div>
        </div>
      </div>

      {/* Estatísticas de IA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Sugestões Geradas
          </h4>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.suggestionsGenerated || 0}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Regras de Automação
          </h4>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.enabledRules || 0}/{stats.automationRules || 0}
          </div>
        </div>
      </div>

      {/* Detalhes Expandidos */}
      {showDetails && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Detalhes do Sistema de IA
          </h4>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex justify-between">
              <span>Total de Interações:</span>
              <span>{stats.totalInteractions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Total de Navegações:</span>
              <span>{stats.totalNavigations || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Interações com Formulários:</span>
              <span>{stats.totalFormInteractions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Total de Erros:</span>
              <span>{stats.totalErrors || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Sugestões Geradas:</span>
              <span>{stats.suggestionsGenerated || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Regras de Automação:</span>
              <span>{stats.automationRules || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Regras Ativas:</span>
              <span>{stats.enabledRules || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'suggestions', name: 'Sugestões', icon: LightBulbIcon },
    { id: 'predictions', name: 'Previsões', icon: ChartBarIcon },
    { id: 'optimizations', name: 'Otimizações', icon: CogIcon },
    { id: 'stats', name: 'Estatísticas', icon: DocumentTextIcon }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Cabeçalho */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CpuChipIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Assistente de IA
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sugestões inteligentes e automação
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Analisando dados...</p>
          </div>
        ) : (
          <>
            {activeTab === 'suggestions' && renderSuggestions()}
            {activeTab === 'predictions' && renderPredictions()}
            {activeTab === 'optimizations' && renderOptimizations()}
            {activeTab === 'stats' && (
              <div>
                {renderStats()}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Rodapé */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            Sistema de IA ativo • Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </span>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPanel;
