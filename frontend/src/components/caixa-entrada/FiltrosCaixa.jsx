import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ProconInput, ProconSelect, ProconButton } from '../ui';

const FiltrosCaixa = ({ filtros, onFiltrosChange, showSetorFilter = true }) => {
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false);

  const handleInputChange = (name, value) => {
    onFiltrosChange({ [name]: value });
  };

  const limparFiltros = () => {
    onFiltrosChange({
      status: '',
      prioridade: '',
      setor: '',
      tipo: '',
      data_inicio: '',
      data_fim: '',
      busca: ''
    });
  };

  const opcoesStatus = [
    { value: '', label: 'Todos os Status' },
    { value: 'NAO_LIDO', label: 'Não Lido' },
    { value: 'LIDO', label: 'Lido' },
    { value: 'EM_ANALISE', label: 'Em Análise' },
    { value: 'ENCAMINHADO', label: 'Encaminhado' },
    { value: 'ARQUIVADO', label: 'Arquivado' }
  ];

  const opcoesPrioridade = [
    { value: '', label: 'Todas as Prioridades' },
    { value: 'URGENTE', label: 'Urgente' },
    { value: 'ALTA', label: 'Alta' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'BAIXA', label: 'Baixa' }
  ];

  const opcoesSetor = [
    { value: '', label: 'Todos os Setores' },
    { value: 'ATENDIMENTO', label: 'Atendimento' },
    { value: 'FISCALIZACAO', label: 'Fiscalização' },
    { value: 'JURIDICO', label: 'Jurídico' },
    { value: 'FINANCEIRO', label: 'Financeiro' },
    { value: 'DIRETORIA', label: 'Diretoria' }
  ];

  const opcoesTipo = [
    { value: '', label: 'Todos os Tipos' },
    { value: 'DENUNCIA', label: 'Denúncia' },
    { value: 'PETICAO', label: 'Petição' },
    { value: 'AUTO_INFRACAO', label: 'Auto de Infração' },
    { value: 'MULTA', label: 'Multa' },
    { value: 'PROTOCOLO', label: 'Protocolo' },
    { value: 'DOCUMENTO_INTERNO', label: 'Documento Interno' }
  ];

  const filtrosAtivos = Object.values(filtros).filter(valor => valor !== '').length;

  return (
    <div className="space-y-4">
      
      {/* Filtros principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Busca */}
        <ProconInput
          label="Buscar"
          name="busca"
          value={filtros.busca || ''}
          onChange={(e) => handleInputChange('busca', e.target.value)}
          placeholder="Protocolo, assunto, empresa..."
          icon={MagnifyingGlassIcon}
        />

        {/* Status */}
        <ProconSelect
          label="Status"
          name="status"
          value={filtros.status || ''}
          onChange={(e) => handleInputChange('status', e.target.value)}
          options={opcoesStatus}
        />

        {/* Prioridade */}
        <ProconSelect
          label="Prioridade"
          name="prioridade"
          value={filtros.prioridade || ''}
          onChange={(e) => handleInputChange('prioridade', e.target.value)}
          options={opcoesPrioridade}
        />

        {/* Tipo */}
        <ProconSelect
          label="Tipo"
          name="tipo"
          value={filtros.tipo || ''}
          onChange={(e) => handleInputChange('tipo', e.target.value)}
          options={opcoesTipo}
        />
      </div>

      {/* Filtros avançados */}
      {showFiltrosAvancados && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          
          {/* Setor (condicional) */}
          {showSetorFilter && (
            <ProconSelect
              label="Setor"
              name="setor"
              value={filtros.setor || ''}
              onChange={(e) => handleInputChange('setor', e.target.value)}
              options={opcoesSetor}
            />
          )}

          {/* Data início */}
          <ProconInput
            label="Data Início"
            name="data_inicio"
            type="date"
            value={filtros.data_inicio || ''}
            onChange={(e) => handleInputChange('data_inicio', e.target.value)}
          />

          {/* Data fim */}
          <ProconInput
            label="Data Fim"
            name="data_fim"
            type="date"
            value={filtros.data_fim || ''}
            onChange={(e) => handleInputChange('data_fim', e.target.value)}
          />
        </div>
      )}

      {/* Ações dos filtros */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        
        <div className="flex items-center space-x-3">
          {/* Botão filtros avançados */}
          <ProconButton
            variant="ghost"
            size="sm"
            icon={FunnelIcon}
            onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
          >
            {showFiltrosAvancados ? 'Filtros Simples' : 'Filtros Avançados'}
          </ProconButton>

          {/* Indicador de filtros ativos */}
          {filtrosAtivos > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              {filtrosAtivos} filtro{filtrosAtivos > 1 ? 's' : ''} ativo{filtrosAtivos > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Botão limpar filtros */}
        {filtrosAtivos > 0 && (
          <ProconButton
            variant="outline"
            size="sm"
            icon={XMarkIcon}
            onClick={limparFiltros}
          >
            Limpar Filtros
          </ProconButton>
        )}
      </div>
    </div>
  );
};

export default FiltrosCaixa;
