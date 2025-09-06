import React, { useState } from 'react';

function FiltrosAvancados({ filtros, onFiltrosChange, onLimpar }) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const statusOptions = [
        { value: 'aguardando_defesa', label: 'Aguardando Defesa', count: 0 },
        { value: 'defesa_apresentada', label: 'Defesa Apresentada', count: 0 },
        { value: 'em_analise', label: 'Em Análise', count: 0 },
        { value: 'aguardando_recurso', label: 'Aguardando Recurso', count: 0 },
        { value: 'recurso_apresentado', label: 'Recurso Apresentado', count: 0 },
        { value: 'julgamento', label: 'Em Julgamento', count: 0 },
        { value: 'finalizado_procedente', label: 'Finalizado - Procedente', count: 0 },
        { value: 'finalizado_improcedente', label: 'Finalizado - Improcedente', count: 0 },
        { value: 'arquivado', label: 'Arquivado', count: 0 },
        { value: 'prescrito', label: 'Prescrito', count: 0 },
    ];

    const prioridadeOptions = [
        { value: 'urgente', label: 'Urgente', color: 'text-red-600' },
        { value: 'alta', label: 'Alta', color: 'text-orange-600' },
        { value: 'normal', label: 'Normal', color: 'text-gray-600' },
        { value: 'baixa', label: 'Baixa', color: 'text-green-600' },
    ];

    const handleInputChange = (name, value) => {
        onFiltrosChange({
            ...filtros,
            [name]: value
        });
    };

    const handleMultiSelectChange = (name, value, checked) => {
        const currentValues = filtros[name] ? filtros[name].split(',') : [];
        let newValues;
        
        if (checked) {
            newValues = [...currentValues, value];
        } else {
            newValues = currentValues.filter(v => v !== value);
        }
        
        handleInputChange(name, newValues.join(','));
    };

    const isValueSelected = (name, value) => {
        if (!filtros[name]) return false;
        return filtros[name].split(',').includes(value);
    };

    const getActiveFiltersCount = () => {
        return Object.values(filtros).filter(value => value && value.toString().trim() !== '').length;
    };

    return (
        <div className="bg-white dark:bg-[#1a1d21] border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors duration-300">
            {/* Header dos Filtros */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Filtros</h3>
                    {getActiveFiltersCount() > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 transition-colors duration-300">
                            {getActiveFiltersCount()} filtro{getActiveFiltersCount() > 1 ? 's' : ''} ativo{getActiveFiltersCount() > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                    >
                        {showAdvanced ? 'Ocultar Avançados' : 'Filtros Avançados'}
                    </button>
                    
                    {getActiveFiltersCount() > 0 && (
                        <button
                            onClick={onLimpar}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors duration-200"
                        >
                            Limpar Todos
                        </button>
                    )}
                </div>
            </div>

            {/* Filtros Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Busca Rápida */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                        🔍 Busca Rápida
                    </label>
                    <input
                        type="text"
                        placeholder="Buscar por processo, empresa, CNPJ..."
                        value={filtros.busca || ''}
                        onChange={(e) => handleInputChange('busca', e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                    />
                </div>

                {/* Status (Select simples) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                        📊 Status
                    </label>
                    <select
                        value={filtros.status || ''}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    >
                        <option value="">Todos os status</option>
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Prioridade */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                        ⚡ Prioridade
                    </label>
                    <select
                        value={filtros.prioridade || ''}
                        onChange={(e) => handleInputChange('prioridade', e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    >
                        <option value="">Todas as prioridades</option>
                        {prioridadeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Filtros de Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                        📅 Data Início
                    </label>
                    <input
                        type="date"
                        value={filtros.data_inicio || ''}
                        onChange={(e) => handleInputChange('data_inicio', e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                        📅 Data Fim
                    </label>
                    <input
                        type="date"
                        value={filtros.data_fim || ''}
                        onChange={(e) => handleInputChange('data_fim', e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                        🎯 Filtros Rápidos
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={filtros.prazo_vencido === 'true'}
                                onChange={(e) => handleInputChange('prazo_vencido', e.target.checked ? 'true' : '')}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-red-600">⚠️ Vencidos</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Filtros Avançados */}
            {showAdvanced && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 transition-colors duration-300">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white transition-colors duration-300 mb-3">Filtros Avançados</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Status Múltiplos */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                                📊 Status (Múltipla Seleção)
                            </label>
                            <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded p-2 space-y-1 bg-white dark:bg-gray-700 transition-colors duration-300">
                                {statusOptions.map(option => (
                                    <label key={option.value} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isValueSelected('status_multiplos', option.value)}
                                            onChange={(e) => handleMultiSelectChange('status_multiplos', option.value, e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Prioridades Múltiplas */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                                ⚡ Prioridades (Múltipla Seleção)
                            </label>
                            <div className="space-y-1">
                                {prioridadeOptions.map(option => (
                                    <label key={option.value} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isValueSelected('prioridade_multipla', option.value)}
                                            onChange={(e) => handleMultiSelectChange('prioridade_multipla', option.value, e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className={`ml-2 text-sm ${option.color} dark:text-gray-300 transition-colors duration-300`}>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Filtros por Valores */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                                💰 Filtros por Valor
                            </label>
                            <div className="space-y-2">
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Valor mínimo (R$)"
                                        value={filtros.valor_min || ''}
                                        onChange={(e) => handleInputChange('valor_min', e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Valor máximo (R$)"
                                        value={filtros.valor_max || ''}
                                        onChange={(e) => handleInputChange('valor_max', e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Responsáveis */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                                👤 Responsáveis
                            </label>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Analista responsável"
                                    value={filtros.analista_responsavel || ''}
                                    onChange={(e) => handleInputChange('analista_responsavel', e.target.value)}
                                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                                />
                                <input
                                    type="text"
                                    placeholder="Fiscal responsável"
                                    value={filtros.fiscal_responsavel || ''}
                                    onChange={(e) => handleInputChange('fiscal_responsavel', e.target.value)}
                                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                                />
                            </div>
                        </div>

                        {/* Prazos */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                                ⏰ Filtros de Prazo
                            </label>
                            <div className="space-y-1">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={filtros.vence_hoje === 'true'}
                                        onChange={(e) => handleInputChange('vence_hoje', e.target.checked ? 'true' : '')}
                                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-orange-600">🔔 Vence hoje</span>
                                </label>
                                
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={filtros.vence_semana === 'true'}
                                        onChange={(e) => handleInputChange('vence_semana', e.target.checked ? 'true' : '')}
                                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-yellow-600">📅 Vence esta semana</span>
                                </label>
                            </div>
                        </div>

                        {/* CNPJ/Empresa */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                                🏢 Empresa
                            </label>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Razão social"
                                    value={filtros.autuado || ''}
                                    onChange={(e) => handleInputChange('autuado', e.target.value)}
                                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                                />
                                <input
                                    type="text"
                                    placeholder="CNPJ (00.000.000/0000-00)"
                                    value={filtros.cnpj || ''}
                                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            {getActiveFiltersCount() > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                            {getActiveFiltersCount()} filtro{getActiveFiltersCount() > 1 ? 's' : ''} aplicado{getActiveFiltersCount() > 1 ? 's' : ''}
                        </div>
                        <button
                            onClick={onLimpar}
                            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FiltrosAvancados;
