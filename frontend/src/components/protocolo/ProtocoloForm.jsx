import React, { useState, useEffect } from 'react';
import { 
  DocumentPlusIcon,
  PaperClipIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import protocoloTramitacaoService from '../../services/protocoloTramitacaoService';

const ProtocoloForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [setores, setSetores] = useState([]);
  const [anexos, setAnexos] = useState([]);
  const [formData, setFormData] = useState({
    tipo_documento: '',
    assunto: '',
    interessado_nome: '',
    interessado_documento: '',
    interessado_email: '',
    interessado_telefone: '',
    interessado_endereco: '',
    setor_destinatario: '',
    prioridade: 'NORMAL',
    observacoes: '',
    prazo_resposta: '',
    origem: 'EXTERNO',
    // Dados específicos por origem
    auto_infracao: '',
    peticao_eletronica: '',
    processo_multa: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [tipos, setoresData] = await Promise.all([
        protocoloTramitacaoService.listarTiposDocumento(),
        protocoloTramitacaoService.listarSetores()
      ]);
      
      setTiposDocumento(tipos.results || tipos || []);
      setSetores(setoresData.results || setoresData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Dados simulados
      setTiposDocumento([
        { id: 1, nome: 'Petição Eletrônica', prazo_resposta_dias: 30 },
        { id: 2, nome: 'Auto de Infração', prazo_resposta_dias: 15 },
        { id: 3, nome: 'Documento Externo', prazo_resposta_dias: 20 },
        { id: 4, nome: 'Recurso Administrativo', prazo_resposta_dias: 30 },
        { id: 5, nome: 'Solicitação Interna', prazo_resposta_dias: 10 }
      ]);
      
      setSetores([
        { id: 1, nome: 'Atendimento', sigla: 'ATD' },
        { id: 2, nome: 'Jurídico', sigla: 'JUR' },
        { id: 3, nome: 'Fiscalização', sigla: 'FISC' },
        { id: 4, nome: 'Direção', sigla: 'DIR' }
      ]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-preencher prazo baseado no tipo de documento
    if (field === 'tipo_documento') {
      const tipo = tiposDocumento.find(t => t.id == value);
      if (tipo) {
        setFormData(prev => ({
          ...prev,
          prazo_resposta: tipo.prazo_resposta_dias
        }));
      }
    }
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const novosAnexos = [];
    
    files.forEach(file => {
      if (file.size > 50 * 1024 * 1024) { // 50MB
        setErrors(prev => ({
          ...prev,
          anexos: 'Arquivos devem ter no máximo 50MB'
        }));
        return;
      }
      
      novosAnexos.push(file);
    });
    
    setAnexos(prev => [...prev, ...novosAnexos]);
    setErrors(prev => ({
      ...prev,
      anexos: null
    }));
  };

  const removerAnexo = (index) => {
    setAnexos(prev => prev.filter((_, i) => i !== index));
  };

  const validarFormulario = () => {
    const novosErrors = {};
    
    if (!formData.tipo_documento) {
      novosErrors.tipo_documento = 'Tipo de documento é obrigatório';
    }
    
    if (!formData.assunto || formData.assunto.length < 10) {
      novosErrors.assunto = 'Assunto deve ter pelo menos 10 caracteres';
    }
    
    if (!formData.interessado_nome) {
      novosErrors.interessado_nome = 'Nome do interessado é obrigatório';
    }
    
    if (!formData.interessado_documento) {
      novosErrors.interessado_documento = 'Documento do interessado é obrigatório';
    }
    
    if (formData.interessado_email && !/\S+@\S+\.\S+/.test(formData.interessado_email)) {
      novosErrors.interessado_email = 'E-mail inválido';
    }
    
    if (!formData.setor_destinatario) {
      novosErrors.setor_destinatario = 'Setor destinatário é obrigatório';
    }
    
    setErrors(novosErrors);
    return Object.keys(novosErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    setLoading(true);
    try {
      const protocolo = await protocoloTramitacaoService.criarProtocolo(formData);
      
      // Fazer upload dos anexos se houver
      if (anexos.length > 0) {
        for (const anexo of anexos) {
          await protocoloTramitacaoService.uploadAnexo(protocolo.id, anexo, 'Anexo do protocolo');
        }
      }
      
      onSuccess && onSuccess(protocolo);
    } catch (error) {
      console.error('Erro ao criar protocolo:', error);
      setErrors({
        geral: 'Erro ao criar protocolo. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DocumentPlusIcon className="h-6 w-6 mr-2 text-blue-600" />
          Novo Protocolo
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Preencha os dados para protocolar o documento
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Erro Geral */}
        {errors.geral && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{errors.geral}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Dados Básicos do Documento */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Dados do Documento</h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Documento *
              </label>
              <select
                value={formData.tipo_documento}
                onChange={(e) => handleInputChange('tipo_documento', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.tipo_documento ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione o tipo de documento</option>
                {tiposDocumento.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
              {errors.tipo_documento && (
                <p className="text-sm text-red-600 mt-1">{errors.tipo_documento}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origem do Documento
              </label>
              <select
                value={formData.origem}
                onChange={(e) => handleInputChange('origem', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EXTERNO">Documento Externo</option>
                <option value="FISCALIZACAO">Auto de Fiscalização</option>
                <option value="PETICAO_ELETRONICA">Petição Eletrônica</option>
                <option value="PROCESSO_MULTA">Processo de Multa</option>
                <option value="INTERNO">Documento Interno</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assunto *
            </label>
            <input
              type="text"
              value={formData.assunto}
              onChange={(e) => handleInputChange('assunto', e.target.value)}
              placeholder="Descreva o assunto do documento"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.assunto ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.assunto && (
              <p className="text-sm text-red-600 mt-1">{errors.assunto}</p>
            )}
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              rows={3}
              placeholder="Informações adicionais sobre o documento..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Dados do Interessado */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-gray-600" />
            Dados do Interessado
          </h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.interessado_nome}
                onChange={(e) => handleInputChange('interessado_nome', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.interessado_nome ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.interessado_nome && (
                <p className="text-sm text-red-600 mt-1">{errors.interessado_nome}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPF/CNPJ *
              </label>
              <input
                type="text"
                value={formData.interessado_documento}
                onChange={(e) => handleInputChange('interessado_documento', e.target.value)}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.interessado_documento ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.interessado_documento && (
                <p className="text-sm text-red-600 mt-1">{errors.interessado_documento}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={formData.interessado_email}
                onChange={(e) => handleInputChange('interessado_email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.interessado_email ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.interessado_email && (
                <p className="text-sm text-red-600 mt-1">{errors.interessado_email}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="text"
                value={formData.interessado_telefone}
                onChange={(e) => handleInputChange('interessado_telefone', e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço Completo
            </label>
            <input
              type="text"
              value={formData.interessado_endereco}
              onChange={(e) => handleInputChange('interessado_endereco', e.target.value)}
              placeholder="Rua, número, bairro, cidade, estado, CEP"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Tramitação */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-600" />
            Tramitação
          </h4>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Setor Destinatário *
              </label>
              <select
                value={formData.setor_destinatario}
                onChange={(e) => handleInputChange('setor_destinatario', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.setor_destinatario ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione o setor</option>
                {setores.map(setor => (
                  <option key={setor.id} value={setor.id}>
                    {setor.sigla} - {setor.nome}
                  </option>
                ))}
              </select>
              {errors.setor_destinatario && (
                <p className="text-sm text-red-600 mt-1">{errors.setor_destinatario}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                value={formData.prioridade}
                onChange={(e) => handleInputChange('prioridade', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BAIXA">🟢 Baixa</option>
                <option value="NORMAL">🔵 Normal</option>
                <option value="ALTA">🟠 Alta</option>
                <option value="URGENTE">🔴 Urgente</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                Prazo (dias)
              </label>
              <input
                type="number"
                value={formData.prazo_resposta}
                onChange={(e) => handleInputChange('prazo_resposta', e.target.value)}
                min="1"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Vínculos com outros documentos */}
        {formData.origem !== 'EXTERNO' && (
          <div className="border-b border-gray-200 pb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Vínculos
            </h4>
            
            <div className="grid md:grid-cols-2 gap-6">
              {formData.origem === 'FISCALIZACAO' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto de Infração
                  </label>
                  <input
                    type="text"
                    value={formData.auto_infracao}
                    onChange={(e) => handleInputChange('auto_infracao', e.target.value)}
                    placeholder="Número do auto de infração"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {formData.origem === 'PETICAO_ELETRONICA' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Petição Eletrônica
                  </label>
                  <input
                    type="text"
                    value={formData.peticao_eletronica}
                    onChange={(e) => handleInputChange('peticao_eletronica', e.target.value)}
                    placeholder="Número da petição"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {formData.origem === 'PROCESSO_MULTA' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Processo de Multa
                  </label>
                  <input
                    type="text"
                    value={formData.processo_multa}
                    onChange={(e) => handleInputChange('processo_multa', e.target.value)}
                    placeholder="Número do processo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Anexos */}
        <div className="pb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <PaperClipIcon className="h-5 w-5 mr-2 text-gray-600" />
            Anexos
          </h4>
          
          <div className="mb-4">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              Arquivos aceitos: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (máximo 50MB cada)
            </p>
            {errors.anexos && (
              <p className="text-sm text-red-600 mt-1">{errors.anexos}</p>
            )}
          </div>
          
          {/* Lista de Anexos */}
          {anexos.length > 0 && (
            <div className="space-y-2">
              {anexos.map((arquivo, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="flex items-center">
                    <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700">{arquivo.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({(arquivo.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerAnexo(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Botões */}
        <div className="border-t pt-6 flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
          >
            <DocumentPlusIcon className="h-5 w-5 mr-2" />
            {loading ? 'Protocolando...' : 'Protocolar Documento'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProtocoloForm;