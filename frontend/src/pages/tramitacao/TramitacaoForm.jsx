import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  BuildingOffice2Icon,
  ScaleIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';

const TramitacaoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    processoId: '',
    tipoTramitacao: '',
    orgaoOrigem: '',
    orgaoDestino: '',
    responsavelOrigem: '',
    responsavelDestino: '',
    dataEnvio: '',
    prazoResposta: '',
    prioridade: 'normal',
    assunto: '',
    observacoes: '',
    documentosAnexos: [],
    status: 'pendente',
    protocoloInterno: '',
    protocoloExterno: '',
    motivoTramitacao: '',
    acao: '',
    numeroProcesso: '',
    interessado: '',
    cpfCnpj: ''
  });

  const [errors, setErrors] = useState({});
  const [processos, setProcessos] = useState([]);
  const [orgaos, setOrgaos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const tiposTramitacao = [
    { value: 'encaminhamento', label: 'Encaminhamento' },
    { value: 'devolucao', label: 'Devolução' },
    { value: 'informacao', label: 'Solicitação de Informação' },
    { value: 'parecer', label: 'Solicitação de Parecer' },
    { value: 'execucao', label: 'Execução' },
    { value: 'arquivamento', label: 'Arquivamento' },
    { value: 'redistribuicao', label: 'Redistribuição' }
  ];

  const prioridades = [
    { value: 'baixa', label: 'Baixa', color: 'text-green-600' },
    { value: 'normal', label: 'Normal', color: 'text-blue-600' },
    { value: 'alta', label: 'Alta', color: 'text-yellow-600' },
    { value: 'urgente', label: 'Urgente', color: 'text-red-600' }
  ];

  const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: 'text-yellow-600' },
    { value: 'em_andamento', label: 'Em Andamento', color: 'text-blue-600' },
    { value: 'concluido', label: 'Concluído', color: 'text-green-600' },
    { value: 'cancelado', label: 'Cancelado', color: 'text-red-600' }
  ];

  useEffect(() => {
    loadData();
    if (isEditing) {
      loadTramitacao();
    }
  }, [id, isEditing]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadProcessos(),
        loadOrgaos(),
        loadUsuarios()
      ]);
    } catch (error) {
      showNotification('Erro ao carregar dados auxiliares', 'error');
    }
  };

  const loadProcessos = async () => {
    const mockProcessos = [
      { id: 1, numero: '2024001', interessado: 'João Silva', cpfCnpj: '123.456.789-00' },
      { id: 2, numero: '2024002', interessado: 'Empresa ABC Ltda', cpfCnpj: '12.345.678/0001-90' },
      { id: 3, numero: '2024003', interessado: 'Maria Santos', cpfCnpj: '987.654.321-00' }
    ];
    setProcessos(mockProcessos);
  };

  const loadOrgaos = async () => {
    const mockOrgaos = [
      { id: 1, nome: 'PROCON Municipal', sigla: 'PROCON' },
      { id: 2, nome: 'Ministério Público', sigla: 'MP' },
      { id: 3, nome: 'Tribunal de Justiça', sigla: 'TJ' },
      { id: 4, nome: 'Defensoria Pública', sigla: 'DP' },
      { id: 5, nome: 'Polícia Civil', sigla: 'PC' }
    ];
    setOrgaos(mockOrgaos);
  };

  const loadUsuarios = async () => {
    const mockUsuarios = [
      { id: 1, nome: 'Ana Silva', email: 'ana@procon.gov.br', cargo: 'Fiscal' },
      { id: 2, nome: 'Carlos Santos', email: 'carlos@procon.gov.br', cargo: 'Advogado' },
      { id: 3, nome: 'Maria Oliveira', email: 'maria@procon.gov.br', cargo: 'Coordenadora' }
    ];
    setUsuarios(mockUsuarios);
  };

  const loadTramitacao = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        processoId: '1',
        tipoTramitacao: 'encaminhamento',
        orgaoOrigem: '1',
        orgaoDestino: '2',
        responsavelOrigem: '1',
        responsavelDestino: '',
        dataEnvio: '2024-08-27',
        prazoResposta: '2024-09-10',
        prioridade: 'normal',
        assunto: 'Análise de processo administrativo',
        observacoes: 'Processo necessita de parecer jurídico.',
        status: 'pendente',
        protocoloInterno: 'PROT-2024-001',
        motivoTramitacao: 'Necessário parecer jurídico especializado',
        acao: 'Emitir parecer sobre legalidade do procedimento',
        numeroProcesso: '2024001',
        interessado: 'João Silva',
        cpfCnpj: '123.456.789-00'
      };
      
      setFormData(mockData);
    } catch (error) {
      showNotification('Erro ao carregar tramitação', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }

    // Se selecionou um processo, preencher dados automaticamente
    if (field === 'processoId' && value) {
      const processo = processos.find(p => p.id.toString() === value);
      if (processo) {
        setFormData(prev => ({
          ...prev,
          numeroProcesso: processo.numero,
          interessado: processo.interessado,
          cpfCnpj: processo.cpfCnpj
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.processoId) {
      newErrors.processoId = 'Processo é obrigatório';
    }

    if (!formData.tipoTramitacao) {
      newErrors.tipoTramitacao = 'Tipo de tramitação é obrigatório';
    }

    if (!formData.orgaoOrigem) {
      newErrors.orgaoOrigem = 'Órgão de origem é obrigatório';
    }

    if (!formData.orgaoDestino) {
      newErrors.orgaoDestino = 'Órgão de destino é obrigatório';
    }

    if (!formData.responsavelOrigem) {
      newErrors.responsavelOrigem = 'Responsável de origem é obrigatório';
    }

    if (!formData.dataEnvio) {
      newErrors.dataEnvio = 'Data de envio é obrigatória';
    }

    if (!formData.assunto.trim()) {
      newErrors.assunto = 'Assunto é obrigatório';
    }

    if (!formData.motivoTramitacao.trim()) {
      newErrors.motivoTramitacao = 'Motivo da tramitação é obrigatório';
    }

    if (!formData.acao.trim()) {
      newErrors.acao = 'Ação solicitada é obrigatória';
    }

    if (formData.orgaoOrigem === formData.orgaoDestino) {
      newErrors.orgaoDestino = 'Órgão de destino deve ser diferente do órgão de origem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification('Corrija os erros no formulário', 'error');
      return;
    }

    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      showNotification(
        isEditing ? 'Tramitação atualizada com sucesso!' : 'Tramitação criada com sucesso!',
        'success'
      );
      
      navigate('/tramitacao/lista');
    } catch (error) {
      showNotification('Erro ao salvar tramitação', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));

    setFormData(prev => ({
      ...prev,
      documentosAnexos: [...prev.documentosAnexos, ...newFiles]
    }));
  };

  const removeFile = (fileId) => {
    setFormData(prev => ({
      ...prev,
      documentosAnexos: prev.documentosAnexos.filter(file => file.id !== fileId)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/tramitacao/lista"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Tramitação' : 'Nova Tramitação'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {isEditing ? 'Atualize os dados da tramitação' : 'Preencha os dados para criar uma nova tramitação'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados do Processo */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Dados do Processo
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Processo *
                  </label>
                  <select
                    value={formData.processoId}
                    onChange={(e) => handleInputChange('processoId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.processoId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione um processo</option>
                    {processos.map(processo => (
                      <option key={processo.id} value={processo.id}>
                        {processo.numero} - {processo.interessado}
                      </option>
                    ))}
                  </select>
                  {errors.processoId && (
                    <p className="mt-1 text-sm text-red-600">{errors.processoId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número do Processo
                  </label>
                  <input
                    type="text"
                    value={formData.numeroProcesso}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Interessado
                  </label>
                  <input
                    type="text"
                    value={formData.interessado}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CPF/CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.cpfCnpj}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dados da Tramitação */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <BuildingOffice2Icon className="w-5 h-5 mr-2" />
                Dados da Tramitação
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Tramitação *
                  </label>
                  <select
                    value={formData.tipoTramitacao}
                    onChange={(e) => handleInputChange('tipoTramitacao', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.tipoTramitacao ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione o tipo</option>
                    {tiposTramitacao.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                  {errors.tipoTramitacao && (
                    <p className="mt-1 text-sm text-red-600">{errors.tipoTramitacao}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prioridade
                  </label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => handleInputChange('prioridade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {prioridades.map(prioridade => (
                      <option key={prioridade.value} value={prioridade.value}>
                        {prioridade.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Órgão de Origem *
                  </label>
                  <select
                    value={formData.orgaoOrigem}
                    onChange={(e) => handleInputChange('orgaoOrigem', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.orgaoOrigem ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione o órgão</option>
                    {orgaos.map(orgao => (
                      <option key={orgao.id} value={orgao.id}>
                        {orgao.nome} ({orgao.sigla})
                      </option>
                    ))}
                  </select>
                  {errors.orgaoOrigem && (
                    <p className="mt-1 text-sm text-red-600">{errors.orgaoOrigem}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Órgão de Destino *
                  </label>
                  <select
                    value={formData.orgaoDestino}
                    onChange={(e) => handleInputChange('orgaoDestino', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.orgaoDestino ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione o órgão</option>
                    {orgaos.map(orgao => (
                      <option key={orgao.id} value={orgao.id}>
                        {orgao.nome} ({orgao.sigla})
                      </option>
                    ))}
                  </select>
                  {errors.orgaoDestino && (
                    <p className="mt-1 text-sm text-red-600">{errors.orgaoDestino}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Responsável de Origem *
                  </label>
                  <select
                    value={formData.responsavelOrigem}
                    onChange={(e) => handleInputChange('responsavelOrigem', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.responsavelOrigem ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione o responsável</option>
                    {usuarios.map(usuario => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nome} - {usuario.cargo}
                      </option>
                    ))}
                  </select>
                  {errors.responsavelOrigem && (
                    <p className="mt-1 text-sm text-red-600">{errors.responsavelOrigem}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Responsável de Destino
                  </label>
                  <select
                    value={formData.responsavelDestino}
                    onChange={(e) => handleInputChange('responsavelDestino', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Selecione o responsável</option>
                    {usuarios.map(usuario => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nome} - {usuario.cargo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Envio *
                  </label>
                  <input
                    type="date"
                    value={formData.dataEnvio}
                    onChange={(e) => handleInputChange('dataEnvio', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.dataEnvio ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dataEnvio && (
                    <p className="mt-1 text-sm text-red-600">{errors.dataEnvio}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prazo de Resposta
                  </label>
                  <input
                    type="date"
                    value={formData.prazoResposta}
                    onChange={(e) => handleInputChange('prazoResposta', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Protocolo Interno
                  </label>
                  <input
                    type="text"
                    value={formData.protocoloInterno}
                    onChange={(e) => handleInputChange('protocoloInterno', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: PROT-2024-001"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <ScaleIcon className="w-5 h-5 mr-2" />
                Detalhes da Tramitação
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assunto *
                </label>
                <input
                  type="text"
                  value={formData.assunto}
                  onChange={(e) => handleInputChange('assunto', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.assunto ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Análise de processo administrativo"
                />
                {errors.assunto && (
                  <p className="mt-1 text-sm text-red-600">{errors.assunto}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivo da Tramitação *
                </label>
                <textarea
                  value={formData.motivoTramitacao}
                  onChange={(e) => handleInputChange('motivoTramitacao', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.motivoTramitacao ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Descreva o motivo da tramitação"
                />
                {errors.motivoTramitacao && (
                  <p className="mt-1 text-sm text-red-600">{errors.motivoTramitacao}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ação Solicitada *
                </label>
                <textarea
                  value={formData.acao}
                  onChange={(e) => handleInputChange('acao', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.acao ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Descreva a ação que deve ser tomada"
                />
                {errors.acao && (
                  <p className="mt-1 text-sm text-red-600">{errors.acao}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Observações adicionais"
                />
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <PaperClipIcon className="w-5 h-5 mr-2" />
                Documentos Anexos
              </h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {formData.documentosAnexos.length > 0 && (
                <div className="space-y-2">
                  {formData.documentosAnexos.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center space-x-3">
                        <PaperClipIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
                          <p className="text-xs text-gray-500">{(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(doc.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-4">
            <Link
              to="/tramitacao/lista"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  {isEditing ? 'Atualizar' : 'Criar'} Tramitação
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TramitacaoForm;