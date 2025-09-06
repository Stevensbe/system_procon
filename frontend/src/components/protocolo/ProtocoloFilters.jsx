import React, { useState } from 'react';
import { 
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const ProtocoloFilters = ({ 
  filtros, 
  onFiltrosChange, 
  onSearch, 
  onClear,
  tipos = [],
  status = [],
  responsaveis = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFiltroChange = (campo, valor) => {
    onFiltrosChange({ ...filtros, [campo]: valor });
  };

  const handleClearFilters = () => {
    const filtrosLimpos = {
      search: '',
      tipo: '',
      status: '',
      prioridade: '',
      responsavel: '',
      data_inicio: '',
      data_fim: ''
    };
    onFiltrosChange(filtrosLimpos);
    onClear && onClear();
  };

  const hasActiveFilters = Object.values(filtros).some(valor => valor !== '');

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      {/* Header dos Filtros */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Ativos
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {isExpanded ? 'Ocultar' : 'Expandir'}
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              >
                <XMarkIcon className="w-4 h-4 mr-1" />
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros Básicos (Sempre Visíveis) */}
      <div className="p-4">
        <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MagnifyingGlassIcon className="w-4 h-4 inline mr-1" />
              Buscar
            </label>
            <input
              type="text"
              value={filtros.search}
              onChange={(e) => handleFiltroChange('search', e.target.value)}
              placeholder="Número, assunto, interessado..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DocumentTextIcon className="w-4 h-4 inline mr-1" />
              Tipo
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => handleFiltroChange('tipo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os tipos</option>
              {tipos.map(tipo => (
                <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filtros.status}
              onChange={(e) => handleFiltroChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os status</option>
              {status.map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          {/* Botão de Busca */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* Filtros Avançados (Expandíveis) */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Filtros Avançados</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade
              </label>
              <select
                value={filtros.prioridade}
                onChange={(e) => handleFiltroChange('prioridade', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas as prioridades</option>
                <option value="BAIXA">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <UserIcon className="w-4 h-4 inline mr-1" />
                Responsável
              </label>
              <select
                value={filtros.responsavel}
                onChange={(e) => handleFiltroChange('responsavel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos os responsáveis</option>
                {responsaveis.map(resp => (
                  <option key={resp.id} value={resp.id}>{resp.username}</option>
                ))}
              </select>
            </div>

            {/* Data Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Data Início
              </label>
              <input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Data Fim
              </label>
              <input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filtros Especiais */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Filtros Especiais</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Protocolos Atrasados */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="atrasados"
                  checked={filtros.atrasados === 'true'}
                  onChange={(e) => handleFiltroChange('atrasados', e.target.checked ? 'true' : '')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="atrasados" className="ml-2 text-sm text-gray-700">
                  Apenas atrasados
                </label>
              </div>

              {/* Protocolos Urgentes */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="urgentes"
                  checked={filtros.urgentes === 'true'}
                  onChange={(e) => handleFiltroChange('urgentes', e.target.checked ? 'true' : '')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="urgentes" className="ml-2 text-sm text-gray-700">
                  Apenas urgentes
                </label>
              </div>

              {/* Protocolos Concluídos */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="concluidos"
                  checked={filtros.concluidos === 'true'}
                  onChange={(e) => handleFiltroChange('concluidos', e.target.checked ? 'true' : '')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="concluidos" className="ml-2 text-sm text-gray-700">
                  Incluir concluídos
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros Ativos */}
      {hasActiveFilters && (
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-800">Filtros ativos:</span>
              <div className="flex flex-wrap gap-2">
                {filtros.search && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Busca: {filtros.search}
                    <button
                      onClick={() => handleFiltroChange('search', '')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filtros.tipo && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Tipo: {tipos.find(t => t.id == filtros.tipo)?.nome}
                    <button
                      onClick={() => handleFiltroChange('tipo', '')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filtros.status && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Status: {status.find(s => s.id == filtros.status)?.nome}
                    <button
                      onClick={() => handleFiltroChange('status', '')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filtros.prioridade && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Prioridade: {filtros.prioridade}
                    <button
                      onClick={() => handleFiltroChange('prioridade', '')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Limpar todos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocoloFilters;
