import React, { useState, useEffect } from 'react';
import { 
  CpuChipIcon,
  LightBulbIcon,
  ChartBarIcon,
  CogIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAI } from '../../utils/aiAssistant';

const PortalAI = ({ isOpen, onClose }) => {
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

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

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
        console.log('Mostrando ajuda de formulário');
        break;
      case 'show_error_tips':
        console.log('Mostrando dicas de erro');
        break;
      case 'show_quick_access':
        console.log('Mostrando acesso rápido');
        break;
      case 'show_performance_tips':
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
            Continue usando o portal para receber sugestões inteligentes.
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
            O portal está funcionando de forma otimizada.
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
      <div className="grid grid-cols-2 gap-4">
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
      </div>

      {/* Estatísticas de IA */}
      <div className="grid grid-cols-1 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Sugestões Geradas
          </h4>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.suggestionsGenerated || 0}
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'suggestions', name: 'Sugestões', icon: LightBulbIcon },
    { id: 'predictions', name: 'Previsões', icon: ChartBarIcon },
    { id: 'optimizations', name: 'Otimizações', icon: CogIcon },
    { id: 'stats', name: 'Estatísticas', icon: DocumentTextIcon }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CpuChipIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Assistente de IA - Portal do Cidadão
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
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Abas */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
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
          <div className="p-6 max-h-96 overflow-y-auto">
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
                {activeTab === 'stats' && renderStats()}
              </>
            )}
          </div>

          {/* Rodapé */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
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
      </div>
    </div>
  );
};

export default PortalAI;
