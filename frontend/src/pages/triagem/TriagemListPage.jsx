import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Shield,
  Bell,
  User as UserIcon,
  RefreshCw,
  Clock,
  ArrowRight,
  Calendar,
  Building2,
  Phone,
  Mail,
  MapPin,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Paperclip,
  MessageSquare,
} from 'lucide-react';
import triagemService from '../../services/triagemService';

const ORIGENS_CONFIG = {
  TELEFONE: { value: 'TELEFONE', label: 'Telefone', icon: Phone, badge: 'bg-blue-100 text-blue-800' },
  EMAIL: { value: 'EMAIL', label: 'E-mail', icon: Mail, badge: 'bg-purple-100 text-purple-800' },
  PRESENCIAL: { value: 'PRESENCIAL', label: 'Presencial', icon: UserIcon, badge: 'bg-green-100 text-green-800' },
  PORTAL: { value: 'PORTAL', label: 'Portal Cidadão', icon: Building2, badge: 'bg-orange-100 text-orange-800' },
  OFICIO: { value: 'OFICIO', label: 'Ofício/Parceiro', icon: Building2, badge: 'bg-slate-100 text-slate-800' },
  ROTINA: { value: 'ROTINA', label: 'Fiscalização Rotineira', icon: MapPin, badge: 'bg-emerald-100 text-emerald-800' },
};

const ORIGENS_FORM = ['TELEFONE', 'EMAIL', 'PRESENCIAL', 'OFICIO', 'ROTINA'];

const PRIORIDADE_LABEL = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

const PRIORIDADE_BADGE = {
  critica: 'bg-red-100 text-red-800',
  alta: 'bg-orange-100 text-orange-800',
  media: 'bg-blue-100 text-blue-800',
  baixa: 'bg-slate-100 text-slate-700',
};

const STATUS_LABEL = {
  em_triagem: 'Em triagem',
  aguardando_complemento: 'Aguardando complemento',
  encaminhado_fiscalizacao: 'Encaminhado à fiscalização',
  encaminhado_juridico: 'Encaminhado ao jurídico',
  convertido_ppa: 'PPA vinculado',
  fora_competencia: 'Fora da competência PROCON',
  arquivado: 'Arquivado',
};

const STATUS_BADGE = {
  em_triagem: 'bg-indigo-100 text-indigo-800',
  aguardando_complemento: 'bg-amber-100 text-amber-800',
  encaminhado_fiscalizacao: 'bg-blue-100 text-blue-800',
  encaminhado_juridico: 'bg-sky-100 text-sky-800',
  convertido_ppa: 'bg-emerald-100 text-emerald-800',
  fora_competencia: 'bg-rose-100 text-rose-700',
  arquivado: 'bg-slate-200 text-slate-700',
};

const DECISAO_LABEL = {
  pendente: 'Pendente',
  solicitar_complemento: 'Solicitar complementação',
  abrir_fiscalizacao: 'Abrir fiscalização',
  encaminhar_juridico: 'Encaminhar jurídico',
  abrir_campanha: 'Incluir em rotina',
  arquivar: 'Arquivar',
};

const emptyForm = {
  origem: 'TELEFONE',
  assunto: '',
  descricao: '',
  empresa_alvo: '',
  cnpj_empresa: '',
  denunciante_contato: '',
  denunciante_nome: '',
  endereco_empresa: '',
  observacoes: '',
};

const Header = () => (
  <header className="bg-white shadow-sm border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sistema de Fiscalização</h1>
            <p className="text-sm text-gray-500">Triagem de Denúncias</p>
          </div>
        </div>

        <div />
      </div>
    </div>
  </header>
);

const StatsCards = ({ stats, onRefresh, isLoading }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-7 shadow-lg">
    <div className="flex justify-between items-start gap-7 flex-wrap">
      <div className="flex-1 min-w-0">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs uppercase tracking-wider mb-3">
          Fiscalização
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Triagem de Demandas</h2>
        <p className="text-slate-600 max-w-lg leading-relaxed">
          Centralize denúncias multicanal, priorize casos críticos e acompanhe o encaminhamento para fiscalização ou
          análise jurídica.
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="bg-white rounded-xl p-4 min-w-32 shadow-lg">
          <span className="text-xs uppercase tracking-wider text-slate-500 block mb-1">Total em fila</span>
          <strong className="text-2xl text-slate-900 font-bold">{stats.total}</strong>
        </div>

        <div className="bg-white rounded-xl p-4 min-w-32 shadow-lg">
          <span className="text-xs uppercase tracking-wider text-slate-500 block mb-1">Pendentes</span>
          <strong className="text-2xl text-orange-600 font-bold">{stats.pending}</strong>
        </div>

        <div className="bg-white rounded-xl p-4 min-w-32 shadow-lg">
          <span className="text-xs uppercase tracking-wider text-slate-500 block mb-1">Encaminhadas</span>
          <strong className="text-2xl text-green-600 font-bold">{stats.forwarded}</strong>
        </div>

        <div className="bg-white rounded-xl p-4 min-w-32 shadow-lg">
          <span className="text-xs uppercase tracking-wider text-slate-500 block mb-1">Críticas</span>
          <strong className="text-2xl text-red-600 font-bold">{stats.critical}</strong>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-3 bg-white text-blue-600 hover:text-blue-700 transition-colors rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 font-medium"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar fila</span>
        </button>
      </div>
    </div>
  </div>
);

const QueueSection = ({
  triagens,
  isLoading,
  onRefresh,
  onEncaminharFiscal,
  onEncaminharJuridico,
  onSolicitarComplemento,
  onArquivar,
  onRegistrarForaCompetencia,
  onResponderDenuncia,
  updatingId,
}) => {
  const getOriginConfig = (value) => ORIGENS_CONFIG[value] ?? ORIGENS_CONFIG.TELEFONE;

  return (
    <div className="bg-white rounded-xl shadow-lg border-0">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Fila de triagem</h3>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-semibold text-xs uppercase tracking-wider">
                {triagens.length === 1 ? '1 demanda' : `${triagens.length} demandas`}
              </span>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 hover:bg-blue-50 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="font-medium">Atualizar</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="font-medium">Carregando fila de triagem...</span>
          </div>
        ) : triagens.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-slate-900 mb-2">Nenhuma demanda em triagem</h4>
            <p className="text-slate-500 max-w-md mx-auto">Todas as denúncias foram processadas ou não há novas demandas no momento.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Protocolo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Assunto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Origem</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Prioridade</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Prazo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Atualizado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {triagens.map((triagem) => {
                  const origem = getOriginConfig(triagem.origem);
                  const prioridadeAtual = triagem.prioridade_definida || triagem.prioridade_calculada || triagem.prioridade_sugerida;
                  const prioridadeBadge = PRIORIDADE_BADGE[prioridadeAtual] || 'bg-slate-100 text-slate-700';
                  const prazoAlvo = triagem.prazo_previsto_atendimento || triagem.prazo_atendimento;
                  const prazoTexto = prazoAlvo ? new Date(prazoAlvo).toLocaleDateString('pt-BR') : '—';
                  return (
                    <tr key={triagem.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{triagem.numero_protocolo}</div>
                        {triagem.denuncia_portal_numero && (
                          <div className="text-xs text-slate-500">Portal: {triagem.denuncia_portal_numero}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-48 truncate font-medium text-slate-900">{triagem.empresa_alvo}</div>
                        {triagem.cnpj_empresa && <div className="text-sm text-slate-500">{triagem.cnpj_empresa}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-60 truncate font-medium text-slate-900">{triagem.assunto}</div>
                        {triagem.observacoes && (
                          <div className="text-sm text-slate-500 max-w-60 truncate">{triagem.observacoes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${origem.badge}`}>
                          {origem.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${prioridadeBadge}`}
                        >
                          {PRIORIDADE_LABEL[prioridadeAtual] || prioridadeAtual}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{prazoTexto}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            STATUS_BADGE[triagem.status] || 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {STATUS_LABEL[triagem.status] || triagem.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(triagem.atualizado_em).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(triagem.atualizado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {triagem.anexos && triagem.anexos.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <Paperclip className="h-3 w-3" />
                            <span>
                              {triagem.anexos.length}{' '}
                              {triagem.anexos.length === 1 ? 'anexo' : 'anexos'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => onEncaminharFiscal(triagem)}
                            disabled={updatingId === triagem.id}
                            className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60"
                          >
                            <ArrowRight className={`w-4 h-4 ${updatingId === triagem.id ? 'animate-spin' : ''}`} />
                            <span>Fiscalização</span>
                          </button>
                          <button
                            onClick={() => onEncaminharJuridico(triagem)}
                            disabled={updatingId === triagem.id}
                            className="flex items-center space-x-1 px-3 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors font-medium disabled:opacity-60"
                          >
                            <Building2 className="w-4 h-4" />
                            <span>Juridico</span>
                          </button>
                          <button
                            onClick={() => onSolicitarComplemento(triagem)}
                            disabled={updatingId === triagem.id}
                            className="flex items-center space-x-1 px-3 py-2 bg-amber-100 text-amber-800 text-sm rounded-lg hover:bg-amber-200 transition-colors font-medium disabled:opacity-60"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Complemento</span>
                          </button>
                          <button
                            onClick={() => onArquivar(triagem)}
                            disabled={updatingId === triagem.id}
                            className="flex items-center space-x-1 px-3 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition-colors font-medium disabled:opacity-60"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Arquivar</span>
                          </button>
                          <button
                            onClick={() => onRegistrarForaCompetencia(triagem)}
                            disabled={updatingId === triagem.id}
                            className="flex items-center space-x-1 px-3 py-2 bg-rose-100 text-rose-700 text-sm rounded-lg hover:bg-rose-200 transition-colors font-medium disabled:opacity-60"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Fora do PROCON</span>
                          </button>
                          {triagem.denuncia_portal && (
                            <button
                              onClick={() => onResponderDenuncia(triagem)}
                              className="flex items-center space-x-1 px-3 py-2 bg-emerald-100 text-emerald-700 text-sm rounded-lg hover:bg-emerald-200 transition-colors font-medium"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>Responder</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const RespostaDenunciaModal = ({
  open,
  triagem,
  formState,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  isLoading,
  error,
}) => {
  if (!open) {
    return null;
  }

  const numeroPortal = triagem?.denuncia_portal_numero || '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-slate-900">Responder denuncia do portal</h3>
          <p className="text-sm text-slate-500 mt-1">
            Protocolo: {triagem?.numero_protocolo || '-'} · Portal: {numeroPortal}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="text-sm text-slate-500">Carregando dados da denuncia...</div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Competencia do PROCON</label>
                <select
                  value={formState.competencia_procon}
                  onChange={(event) => onChange('competencia_procon', event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione</option>
                  <option value="true">Sim</option>
                  <option value="false">Nao</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resposta do fiscal</label>
                <textarea
                  value={formState.resposta_fiscal}
                  onChange={(event) => onChange('resposta_fiscal', event.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descreva a analise e a resposta ao denunciante."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Orientacao sugerida</label>
                <textarea
                  value={formState.orientacao_destino}
                  onChange={(event) => onChange('orientacao_destino', event.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Orgao competente, contatos ou orientacoes adicionais."
                />
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || isLoading}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar resposta'}
          </button>
        </div>
      </div>
    </div>
  );
};

const NewComplaintForm = ({ onSubmit, isSubmitting }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formState, setFormState] = useState({ ...emptyForm });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event) => {
    const arquivos = Array.from(event.target.files || []);
    setSelectedFiles(arquivos);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => {
      const atualizados = prev.filter((_, fileIndex) => fileIndex !== index);
      if (fileInputRef.current && typeof DataTransfer !== 'undefined') {
        const dataTransfer = new DataTransfer();
        atualizados.forEach((file) => dataTransfer.items.add(file));
        fileInputRef.current.files = dataTransfer.files;
      } else if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return atualizados;
    });
  };

  const formatSize = (valor) => {
    if (valor === undefined || valor === null) {
      return '';
    }
    if (valor < 1024) {
      return `${valor} B`;
    }
    if (valor < 1024 ** 2) {
      return `${(valor / 1024).toFixed(1)} KB`;
    }
    if (valor < 1024 ** 3) {
      return `${(valor / 1024 ** 2).toFixed(1)} MB`;
    }
    return `${(valor / 1024 ** 3).toFixed(1)} GB`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = new FormData();

    Object.entries(formState).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        payload.append(key, value);
      }
    });
    payload.set('origem', formState.origem || 'TELEFONE');

    selectedFiles.forEach((file) => {
      payload.append('anexos', file);
    });

    try {
      await onSubmit(payload);
      setFormState({ ...emptyForm });
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsExpanded(false);
    } catch (error) {
      console.error('Erro ao registrar denúncia:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border-0">
      <div className="p-6 border-b border-gray-100">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center space-x-2 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
        >
          <span className={`w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-45' : ''}`}>
            +
          </span>
          <span>Registrar nova denúncia</span>
        </button>
        <p className="text-sm text-gray-600 mt-1">Use este formulário para demandas recebidas por telefone, presencialmente ou por e-mail.</p>
      </div>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Origem</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ORIGENS_FORM.map((value) => {
                const { label, icon: Icon } = ORIGENS_CONFIG[value];
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleInputChange('origem', value)}
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                      formState.origem === value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assunto / título</label>
              <input
                type="text"
                value={formState.assunto}
                onChange={(e) => handleInputChange('assunto', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resumo curto</label>
              <input
                type="text"
                value={formState.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Anotações para a equipe de fiscalização"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição detalhada</label>
            <textarea
              value={formState.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Resumo do relato apresentado pelo denunciante."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Empresa / estabelecimento</label>
              <input
                type="text"
                value={formState.empresa_alvo}
                onChange={(e) => handleInputChange('empresa_alvo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
              <input
                type="text"
                value={formState.cnpj_empresa}
                onChange={(e) => handleInputChange('cnpj_empresa', e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contato denunciante</label>
              <input
                type="text"
                value={formState.denunciante_contato}
                onChange={(e) => handleInputChange('denunciante_contato', e.target.value)}
                placeholder="Telefone ou e-mail"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do denunciante</label>
              <input
                type="text"
                value={formState.denunciante_nome}
                onChange={(e) => handleInputChange('denunciante_nome', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Endereço do fato</label>
            <input
              type="text"
              value={formState.endereco_empresa}
              onChange={(e) => handleInputChange('endereco_empresa', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Documentos e anexos</label>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="w-full cursor-pointer rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-sm text-gray-600 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedFiles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {selectedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-600"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-slate-400" />
                      <span className="truncate max-w-[14rem]" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-xs text-slate-400">{formatSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-xs font-medium text-red-500 hover:text-red-600"
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Registrando...' : 'Registrar denúncia'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const QuickSummary = ({ triagens }) => {
  const statusCounts = useMemo(
    () =>
      triagens.reduce((acc, triagem) => {
        acc[triagem.status] = (acc[triagem.status] || 0) + 1;
        return acc;
      }, {}),
    [triagens],
  );
  const priorityCounts = useMemo(
    () =>
      triagens.reduce((acc, triagem) => {
        const chave =
          triagem.prioridade_definida ||
          triagem.prioridade_calculada ||
          triagem.prioridade_sugerida ||
          'media';
        acc[chave] = (acc[chave] || 0) + 1;
        return acc;
      }, {}),
    [triagens],
  );
  const originCounts = useMemo(
    () =>
      triagens.reduce((acc, triagem) => {
        acc[triagem.origem] = (acc[triagem.origem] || 0) + 1;
        return acc;
      }, {}),
    [triagens],
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h6 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Resumo por Prioridade</h6>
          </div>
          <ul className="space-y-3">
            {Object.values(priorityCounts).every((valor) => valor === 0) || Object.keys(priorityCounts).length === 0 ? (
              <li className="text-slate-500 text-sm">Nenhum item para exibir.</li>
            ) : (
              ['critica', 'alta', 'media', 'baixa'].map((nivel) => {
                const total = priorityCounts[nivel] || 0;
                if (total === 0) return null;
                return (
                  <li key={nivel} className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">{PRIORIDADE_LABEL[nivel]}</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${PRIORIDADE_BADGE[nivel]}`}>
                      {total}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg border-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h6 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Resumo por Status</h6>
          </div>
          <ul className="space-y-3">
            {Object.entries(statusCounts).length === 0 ? (
              <li className="text-slate-500 text-sm">Nenhum item para exibir.</li>
            ) : (
              Object.entries(statusCounts).map(([status, count]) => (
                <li key={status} className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">{STATUS_LABEL[status] || status}</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-sm font-semibold">
                    {count}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg border-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h6 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Resumo por Origem</h6>
          </div>
          <ul className="space-y-3">
            {Object.entries(originCounts).length === 0 ? (
              <li className="text-slate-500 text-sm">Nenhum item para exibir.</li>
            ) : (
              Object.entries(originCounts).map(([origem, count]) => {
                const config = ORIGENS_CONFIG[origem];
                return (
                  <li key={origem} className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">{config?.label ?? origem}</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-sm font-semibold">
                      {count}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

function TriagemListPage() {
  const [triagens, setTriagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [erro, setErro] = useState(null);
  const [respostaModalOpen, setRespostaModalOpen] = useState(false);
  const [respostaTriagem, setRespostaTriagem] = useState(null);
  const [respostaForm, setRespostaForm] = useState({
    competencia_procon: '',
    orientacao_destino: '',
    resposta_fiscal: '',
  });
  const [respostaErro, setRespostaErro] = useState(null);
  const [respostaLoading, setRespostaLoading] = useState(false);
  const [respostaSubmitting, setRespostaSubmitting] = useState(false);

  const loadTriagens = async () => {
    try {
      setLoading(true);
      const data = await triagemService.listarTriagens({ page_size: 50, ordering: '-criado_em' });
      setTriagens(data.results || data);
    } catch (error) {
      console.error('Erro ao carregar triagens:', error);
      setErro('Não foi possível carregar a fila de triagem. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTriagens();
  }, []);

  const resetRespostaForm = () => {
    setRespostaForm({
      competencia_procon: '',
      orientacao_destino: '',
      resposta_fiscal: '',
    });
    setRespostaErro(null);
  };

  const handleAbrirResposta = (triagem) => {
    setRespostaTriagem(triagem);
    resetRespostaForm();
    setRespostaModalOpen(true);
  };

  const handleFecharResposta = () => {
    setRespostaModalOpen(false);
    setRespostaTriagem(null);
  };

  const handleRespostaChange = (field, value) => {
    setRespostaForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const carregarResposta = async () => {
      if (!respostaModalOpen || !respostaTriagem?.denuncia_portal) {
        return;
      }
      setRespostaLoading(true);
      setRespostaErro(null);
      try {
        const dados = await triagemService.obterRespostaDenuncia(respostaTriagem.denuncia_portal);
        if (dados) {
          setRespostaForm({
            competencia_procon:
              dados.competencia_procon === true ? 'true' : dados.competencia_procon === false ? 'false' : '',
            orientacao_destino: dados.orientacao_destino || '',
            resposta_fiscal: dados.resposta_fiscal || '',
          });
        }
      } catch (error) {
        console.error('Erro ao carregar resposta:', error);
        setRespostaErro('Nao foi possivel carregar a resposta atual.');
      } finally {
        setRespostaLoading(false);
      }
    };

    carregarResposta();
  }, [respostaModalOpen, respostaTriagem]);

  const handleSalvarResposta = async () => {
    if (!respostaTriagem?.denuncia_portal) {
      setRespostaErro('Denuncia do portal nao encontrada.');
      return;
    }
    if (!respostaForm.competencia_procon) {
      setRespostaErro('Informe se a demanda e competencia do PROCON.');
      return;
    }
    if (!respostaForm.resposta_fiscal.trim()) {
      setRespostaErro('Informe a resposta do fiscal.');
      return;
    }

    setRespostaSubmitting(true);
    setRespostaErro(null);
    try {
      const payload = {
        competencia_procon: respostaForm.competencia_procon === 'true',
        resposta_fiscal: respostaForm.resposta_fiscal,
        orientacao_destino: respostaForm.orientacao_destino,
      };
      await triagemService.responderDenuncia(respostaTriagem.denuncia_portal, payload);
      handleFecharResposta();
      await loadTriagens();
    } catch (error) {
      console.error('Erro ao salvar resposta:', error);
      setRespostaErro('Nao foi possivel registrar a resposta.');
    } finally {
      setRespostaSubmitting(false);
    }
  };
  const handleCreateTriagem = async (formState) => {
    try {
      setSubmitting(true);
      await triagemService.criarTriagem(formState);
      await loadTriagens();
    } catch (error) {
      console.error('Erro ao registrar denúncia:', error);
      setErro('Não foi possível registrar a denúncia. Verifique os campos e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTriagem = async (triagem, status, decisao, mensagemErroPadrao, dadosExtras = {}) => {
    try {
      setUpdatingId(triagem.id);
      await triagemService.atualizarTriagem(triagem.id, { status, decisao, ...dadosExtras });
      await loadTriagens();
    } catch (error) {
      console.error('Erro ao atualizar triagem:', error);
      setErro(mensagemErroPadrao);
    } finally {
      setUpdatingId(null);
    }
  };

  const coletarMotivoObservacao = (acaoLabel) => {
    const motivoInformado = window.prompt(`Informe o motivo para ${acaoLabel}:`);
    if (motivoInformado === null) {
      return null;
    }
    const motivo = motivoInformado.trim();
    if (!motivo) {
      window.alert('O motivo é obrigatório para continuar.');
      return null;
    }

    const observacaoInformada = window.prompt('Descreva a observação detalhada:');
    if (observacaoInformada === null) {
      return null;
    }
    const observacao = observacaoInformada.trim();
    if (!observacao) {
      window.alert('A observação é obrigatória para continuar.');
      return null;
    }

    return { motivo, observacao };
  };

  const handleEncaminharFiscalizacao = (triagem) =>
    handleUpdateTriagem(triagem, 'encaminhado_fiscalizacao', 'abrir_fiscalizacao', 'Não foi possível encaminhar a denúncia.');

  const handleEncaminharJuridico = (triagem) =>
    handleUpdateTriagem(triagem, 'encaminhado_juridico', 'encaminhar_juridico', 'Não foi possível encaminhar ao jurídico.');

  const handleSolicitarComplemento = (triagem) => {
    const dados = coletarMotivoObservacao('solicitar complementação');
    if (!dados) {
      return;
    }
    handleUpdateTriagem(
      triagem,
      'aguardando_complemento',
      'solicitar_complemento',
      'Não foi possível solicitar complementação.',
      { motivo: dados.motivo, observacao_extra: dados.observacao }
    );
  };

  const handleArquivar = (triagem) => {
    const dados = coletarMotivoObservacao('arquivar a denúncia');
    if (!dados) {
      return;
    }
    handleUpdateTriagem(triagem, 'arquivado', 'arquivar', 'Não foi possível arquivar a denúncia.', {
      motivo: dados.motivo,
      observacao_extra: dados.observacao,
    });
  };

  const handleRegistrarForaCompetencia = (triagem) => {
    const dados = coletarMotivoObservacao('registrar como fora da competência do PROCON');
    if (!dados) {
      return;
    }
    handleUpdateTriagem(triagem, 'fora_competencia', 'arquivar', 'Não foi possível registrar a competência.', {
      motivo: dados.motivo,
      observacao_extra: dados.observacao,
    });
  };

  const stats = useMemo(() => {
    const pending = triagens.filter((t) =>
      ['em_triagem', 'aguardando_complemento', 'convertido_ppa'].includes(t.status),
    ).length;
    const forwarded = triagens.filter((t) =>
      ['encaminhado_fiscalizacao', 'encaminhado_juridico'].includes(t.status),
    ).length;
    const critical = triagens.filter((t) => {
      const prioridadeAtual =
        t.prioridade_definida || t.prioridade_calculada || t.prioridade_sugerida || 'media';
      return prioridadeAtual === 'critica';
    }).length;
    return {
      total: triagens.length,
      pending,
      forwarded,
      critical,
    };
  }, [triagens]);

  const triagensPendentes = triagens.filter((t) =>
    ['em_triagem', 'aguardando_complemento', 'convertido_ppa'].includes(t.status),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {erro && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        <StatsCards stats={stats} onRefresh={loadTriagens} isLoading={loading} />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 space-y-8">
            <QueueSection
              triagens={triagensPendentes}
              isLoading={loading}
              onRefresh={loadTriagens}
              onEncaminharFiscal={handleEncaminharFiscalizacao}
              onEncaminharJuridico={handleEncaminharJuridico}
              onSolicitarComplemento={handleSolicitarComplemento}
              onArquivar={handleArquivar}
              onRegistrarForaCompetencia={handleRegistrarForaCompetencia}
              onResponderDenuncia={handleAbrirResposta}
              updatingId={updatingId}
            />
            <NewComplaintForm onSubmit={handleCreateTriagem} isSubmitting={submitting} />
          </div>
          <div className="xl:col-span-1">
            <QuickSummary triagens={triagens} />
          </div>
        </div>

        <RespostaDenunciaModal
          open={respostaModalOpen}
          triagem={respostaTriagem}
          formState={respostaForm}
          onChange={handleRespostaChange}
          onClose={handleFecharResposta}
          onSubmit={handleSalvarResposta}
          isSubmitting={respostaSubmitting}
          isLoading={respostaLoading}
          error={respostaErro}
        />
      </div>
    </div>
  );
}

export default TriagemListPage;
