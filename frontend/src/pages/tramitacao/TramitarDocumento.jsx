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
  PaperClipIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';
import protocoloTramitacaoService from '../../services/protocoloTramitacaoService';

const TramitarDocumento = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    numeroProtocolo: '',
    setorOrigem: '',
    setorDestino: '',
    responsavelDestino: '',
    prazoResposta: '',
    prioridade: 'normal',
    assunto: '',
    observacoes: '',
    documentosAnexos: [],
    tipoTramitacao: 'encaminhamento'
  });

  const [errors, setErrors] = useState({});
  const [setores, setSetores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [protocoloEncontrado, setProtocoloEncontrado] = useState(null);
  const [buscandoProtocolo, setBuscandoProtocolo] = useState(false);

  const prioridades = [
    { value: 'baixa', label: 'Baixa', color: 'text-green-600' },
    { value: 'normal', label: 'Normal', color: 'text-blue-600' },
    { value: 'alta', label: 'Alta', color: 'text-yellow-600' },
    { value: 'urgente', label: 'Urgente', color: 'text-red-600' }
  ];

  const tiposTramitacao = [
    { value: 'encaminhamento', label: 'Encaminhamento' },
    { value: 'devolucao', label: 'Devolução' },
    { value: 'informacao', label: 'Solicitação de Informação' },
    { value: 'parecer', label: 'Solicitação de Parecer' },
    { value: 'execucao', label: 'Execução' },
    { value: 'arquivamento', label: 'Arquivamento' },
    { value: 'redistribuicao', label: 'Redistribuição' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSetores(),
        loadUsuarios()
      ]);
    } catch (error) {
      showNotification('Erro ao carregar dados auxiliares', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSetores = async () => {
    try {
      const response = await protocoloTramitacaoService.listarSetores();
      setSetores(response.results || response || []);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      // Mock data para desenvolvimento
      setSetores([
        { id: 1, nome: 'Protocolo', sigla: 'PROT' },
        { id: 2, nome: 'Jurídico', sigla: 'JUR' },
        { id: 3, nome: 'Fiscalização', sigla: 'FISC' },
        { id: 4, nome: 'Cobrança', sigla: 'COBR' },
        { id: 5, nome: 'Administrativo', sigla: 'ADM' }
      ]);
    }
  };

  const loadUsuarios = async () => {
    try {
      // Mock data para desenvolvimento
      setUsuarios([
        { id: 1, nome: 'Dr. João Silva', setor: 'Jurídico' },
        { id: 2, nome: 'Dra. Maria Santos', setor: 'Fiscalização' },
        { id: 3, nome: 'Sr. Pedro Costa', setor: 'Cobrança' },
        { id: 4, nome: 'Sra. Ana Oliveira', setor: 'Administrativo' }
      ]);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const buscarProtocolo = async () => {
    if (!formData.numeroProtocolo.trim()) {
      showNotification('Digite o número do protocolo', 'warning');
      return;
    }

    try {
      setBuscandoProtocolo(true);
      const response = await protocoloTramitacaoService.consultarPorNumero(formData.numeroProtocolo);
      
      if (response.results && response.results.length > 0) {
        setProtocoloEncontrado(response.results[0]);
        setFormData(prev => ({
          ...prev,
          setorOrigem: response.results[0].setor_atual || '',
          assunto: response.results[0].assunto || ''
        }));
        showNotification('Protocolo encontrado!', 'success');
      } else {
        setProtocoloEncontrado(null);
        showNotification('Protocolo não encontrado', 'error');
      }
    } catch (error) {
      console.error('Erro ao buscar protocolo:', error);
      showNotification('Erro ao buscar protocolo', 'error');
    } finally {
      setBuscandoProtocolo(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.numeroProtocolo) newErrors.numeroProtocolo = 'Número do protocolo é obrigatório';
    if (!formData.setorDestino) newErrors.setorDestino = 'Setor de destino é obrigatório';
    if (!formData.responsavelDestino) newErrors.responsavelDestino = 'Responsável de destino é obrigatório';
    if (!formData.assunto) newErrors.assunto = 'Assunto é obrigatório';
    if (!formData.prazoResposta) newErrors.prazoResposta = 'Prazo de resposta é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    try {
      setSaving(true);
      
      const tramitacaoData = {
        protocolo: protocoloEncontrado?.id || formData.numeroProtocolo,
        setor_origem: formData.setorOrigem,
        setor_destino: formData.setorDestino,
        responsavel_destino: formData.responsavelDestino,
        prazo_resposta: formData.prazoResposta,
        prioridade: formData.prioridade,
        assunto: formData.assunto,
        observacoes: formData.observacoes,
        tipo_tramitacao: formData.tipoTramitacao,
        documentos_anexos: formData.documentosAnexos
      };

      await protocoloTramitacaoService.criarTramitacao(tramitacaoData);
      
      showNotification('Documento tramitado com sucesso!', 'success');
      navigate('/tramitacao/lista');
    } catch (error) {
      console.error('Erro ao tramitar documento:', error);
      showNotification('Erro ao tramitar documento', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      documentosAnexos: [...prev.documentosAnexos, ...files]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      documentosAnexos: prev.documentosAnexos.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/tramitacao"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Voltar
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tramitar Documento</h1>
              <p className="text-gray-600">Envie documentos entre setores do PROCON</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Busca do Protocolo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Buscar Protocolo
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do Protocolo
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={formData.numeroProtocolo}
                  onChange={(e) => handleInputChange('numeroProtocolo', e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.numeroProtocolo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Digite o número do protocolo"
                />
                <button
                  type="button"
                  onClick={buscarProtocolo}
                  disabled={buscandoProtocolo}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {buscandoProtocolo ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <MagnifyingGlassIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.numeroProtocolo && (
                <p className="text-red-500 text-sm mt-1">{errors.numeroProtocolo}</p>
              )}
            </div>
          </div>

          {/* Informações do Protocolo Encontrado */}
          {protocoloEncontrado && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="font-medium text-green-900">Protocolo Encontrado</h3>
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Número:</span> {protocoloEncontrado.numero}
                </div>
                <div>
                  <span className="font-medium">Interessado:</span> {protocoloEncontrado.interessado}
                </div>
                <div>
                  <span className="font-medium">Assunto:</span> {protocoloEncontrado.assunto}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {protocoloEncontrado.status}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dados da Tramitação */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Dados da Tramitação
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Setor de Origem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Setor de Origem
              </label>
              <select
                value={formData.setorOrigem}
                onChange={(e) => handleInputChange('setorOrigem', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione o setor</option>
                {setores.map(setor => (
                  <option key={setor.id} value={setor.id}>
                    {setor.sigla} - {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Setor de Destino */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Setor de Destino *
              </label>
              <select
                value={formData.setorDestino}
                onChange={(e) => handleInputChange('setorDestino', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.setorDestino ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione o setor</option>
                {setores.map(setor => (
                  <option key={setor.id} value={setor.id}>
                    {setor.sigla} - {setor.nome}
                  </option>
                ))}
              </select>
              {errors.setorDestino && (
                <p className="text-red-500 text-sm mt-1">{errors.setorDestino}</p>
              )}
            </div>

            {/* Responsável de Destino */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsável de Destino *
              </label>
              <select
                value={formData.responsavelDestino}
                onChange={(e) => handleInputChange('responsavelDestino', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.responsavelDestino ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione o responsável</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome} ({usuario.setor})
                  </option>
                ))}
              </select>
              {errors.responsavelDestino && (
                <p className="text-red-500 text-sm mt-1">{errors.responsavelDestino}</p>
              )}
            </div>

            {/* Tipo de Tramitação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Tramitação
              </label>
              <select
                value={formData.tipoTramitacao}
                onChange={(e) => handleInputChange('tipoTramitacao', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {tiposTramitacao.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Prazo de Resposta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo de Resposta *
              </label>
              <input
                type="date"
                value={formData.prazoResposta}
                onChange={(e) => handleInputChange('prazoResposta', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.prazoResposta ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.prazoResposta && (
                <p className="text-red-500 text-sm mt-1">{errors.prazoResposta}</p>
              )}
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                value={formData.prioridade}
                onChange={(e) => handleInputChange('prioridade', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {prioridades.map(prioridade => (
                  <option key={prioridade.value} value={prioridade.value}>
                    {prioridade.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assunto */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assunto *
            </label>
            <input
              type="text"
              value={formData.assunto}
              onChange={(e) => handleInputChange('assunto', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.assunto ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Digite o assunto da tramitação"
            />
            {errors.assunto && (
              <p className="text-red-500 text-sm mt-1">{errors.assunto}</p>
            )}
          </div>

          {/* Observações */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite observações adicionais..."
            />
          </div>

          {/* Anexos */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Documentos Anexos
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
              <PaperClipIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
              >
                Clique para selecionar arquivos
              </label>
              <p className="text-gray-500 text-sm mt-1">
                ou arraste e solte arquivos aqui
              </p>
            </div>

            {/* Lista de arquivos selecionados */}
            {formData.documentosAnexos.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Arquivos selecionados:</h4>
                <div className="space-y-2">
                  {formData.documentosAnexos.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <Link
            to="/tramitacao"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin mr-2" />
                Tramitando...
              </>
            ) : (
              <>
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Tramitar Documento
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TramitarDocumento;
