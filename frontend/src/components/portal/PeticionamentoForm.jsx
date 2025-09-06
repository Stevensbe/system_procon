import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import portalCidadaoService from '../../services/portalCidadaoService';

const PeticionamentoForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [tiposPeticao, setTiposPeticao] = useState([]);
  const [anexos, setAnexos] = useState([]);
  const [formData, setFormData] = useState({
    tipo_peticao_id: '',
    assunto: '',
    descricao: '',
    nome_completo: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    cep: '',
    empresa_envolvida: '',
    cnpj_empresa: '',
    valor_envolvido: '',
    data_ocorrencia: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    carregarTiposPeticao();
  }, []);

  const carregarTiposPeticao = async () => {
    try {
      // Usar o serviço de peticionamento para buscar tipos
      const response = await fetch('/peticionamento/api/tipos-peticao/');
      const data = await response.json();
      setTiposPeticao(data.results || data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
      setTiposPeticao([
        { id: 1, nome: 'Apresentação de Defesa Processual', categoria: 'DEFESA_PROCESSUAL' },
        { id: 2, nome: 'Inserir Anexo de Defesa Processual Jurídico 1ª Instância', categoria: 'ANEXO_DEFESA_1A' },
        { id: 3, nome: 'Inserir Anexo de Defesa Processual Jurídico 2ª Instância', categoria: 'ANEXO_DEFESA_2A' },
        { id: 4, nome: 'Solicitação de Carga (Cópia ou Acesso aos Autos) de Processo da 1ª Instância', categoria: 'SOLICITACAO_CARGA_1A' },
        { id: 5, nome: 'Solicitação de Carga (Cópia ou Acesso aos Autos) de Processo da 2ª Instância', categoria: 'SOLICITACAO_CARGA_2A' },
        { id: 6, nome: 'Solicitação de Guia para Recolhimento de Multa-GRM. Processos em 1ª Instância', categoria: 'SOLICITACAO_GUIA_MULTA_1A' }
      ]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
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
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setErrors(prev => ({
          ...prev,
          anexos: 'Arquivos devem ter no máximo 10MB'
        }));
        return;
      }
      
      if (!['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].includes(file.name.split('.').pop().toLowerCase())) {
        setErrors(prev => ({
          ...prev,
          anexos: 'Tipos de arquivo permitidos: PDF, JPG, PNG, DOC, DOCX'
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
    
    if (!formData.tipo_peticao_id) {
      novosErrors.tipo_peticao_id = 'Tipo de petição é obrigatório';
    }
    
    if (!formData.assunto) {
      novosErrors.assunto = 'Assunto é obrigatório';
    }
    
    if (!formData.descricao || formData.descricao.length < 50) {
      novosErrors.descricao = 'Descrição deve ter pelo menos 50 caracteres';
    }
    
    if (!formData.nome_completo) {
      novosErrors.nome_completo = 'Nome completo é obrigatório';
    }
    
    if (!formData.cpf_cnpj) {
      novosErrors.cpf_cnpj = 'CPF/CNPJ é obrigatório';
    } else if (!portalCidadaoService.validarCPF(formData.cpf_cnpj) && !portalCidadaoService.validarCNPJ(formData.cpf_cnpj)) {
      novosErrors.cpf_cnpj = 'CPF/CNPJ inválido';
    }
    
    if (!formData.email) {
      novosErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      novosErrors.email = 'E-mail inválido';
    }
    
    if (!formData.telefone) {
      novosErrors.telefone = 'Telefone é obrigatório';
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
      // Criar FormData com dados e anexos
      const formDataToSend = new FormData();
      
      // Adicionar dados básicos
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Adicionar anexos
      anexos.forEach((anexo, index) => {
        formDataToSend.append('documentos', anexo);
      });
      
      const resultado = await portalCidadaoService.enviarPeticaoJuridica(formDataToSend);
      onSuccess && onSuccess(resultado.data);
    } catch (error) {
      console.error('Erro ao enviar petição:', error);
      setErrors({
        geral: 'Erro ao enviar petição. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DocumentTextIcon className="h-6 w-6 mr-2 text-blue-600" />
          Nova Petição Eletrônica
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Preencha todos os campos para enviar sua petição
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
        
        {/* Tipo de Petição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Petição *
          </label>
          <select
            value={formData.tipo_peticao_id}
            onChange={(e) => handleInputChange('tipo_peticao_id', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.tipo_peticao_id ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Selecione o tipo de petição</option>
            {tiposPeticao.map(tipo => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </select>
          {errors.tipo_peticao_id && (
            <p className="text-sm text-red-600 mt-1">{errors.tipo_peticao_id}</p>
          )}
        </div>
        
        {/* Assunto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assunto *
          </label>
          <input
            type="text"
            value={formData.assunto}
            onChange={(e) => handleInputChange('assunto', e.target.value)}
            placeholder="Descreva brevemente o assunto da petição"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.assunto ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.assunto && (
            <p className="text-sm text-red-600 mt-1">{errors.assunto}</p>
          )}
        </div>
        
        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição Detalhada *
          </label>
          <textarea
            value={formData.descricao}
            onChange={(e) => handleInputChange('descricao', e.target.value)}
            placeholder="Descreva detalhadamente sua solicitação, incluindo fatos, datas e circunstâncias relevantes..."
            rows={6}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.descricao ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          <div className="flex justify-between mt-1">
            {errors.descricao && (
              <p className="text-sm text-red-600">{errors.descricao}</p>
            )}
            <p className="text-sm text-gray-500">
              {formData.descricao.length}/2000 caracteres (mínimo 50)
            </p>
          </div>
        </div>
        
        {/* Dados do Peticionário */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Dados do Peticionário</h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.nome_completo}
                onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nome_completo ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.nome_completo && (
                <p className="text-sm text-red-600 mt-1">{errors.nome_completo}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPF/CNPJ *
              </label>
              <input
                type="text"
                value={formData.cpf_cnpj}
                onChange={(e) => handleInputChange('cpf_cnpj', portalCidadaoService.formatarCPFCNPJ(e.target.value))}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cpf_cnpj ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.cpf_cnpj && (
                <p className="text-sm text-red-600 mt-1">{errors.cpf_cnpj}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone *
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', portalCidadaoService.formatarTelefone(e.target.value))}
                placeholder="(11) 99999-9999"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.telefone ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.telefone && (
                <p className="text-sm text-red-600 mt-1">{errors.telefone}</p>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço Completo
            </label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => handleInputChange('endereco', e.target.value)}
              placeholder="Rua, número, bairro, cidade, estado"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mt-4 w-32">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CEP
            </label>
            <input
              type="text"
              value={formData.cep}
              onChange={(e) => handleInputChange('cep', e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2'))}
              placeholder="00000-000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Dados da Empresa Envolvida */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Empresa Envolvida (se aplicável)</h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Empresa
              </label>
              <input
                type="text"
                value={formData.empresa_envolvida}
                onChange={(e) => handleInputChange('empresa_envolvida', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CNPJ da Empresa
              </label>
              <input
                type="text"
                value={formData.cnpj_empresa}
                onChange={(e) => handleInputChange('cnpj_empresa', portalCidadaoService.formatarCPFCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Informações Adicionais */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Informações Adicionais</h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Envolvido (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valor_envolvido}
                onChange={(e) => handleInputChange('valor_envolvido', e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Ocorrência
              </label>
              <input
                type="date"
                value={formData.data_ocorrencia}
                onChange={(e) => handleInputChange('data_ocorrencia', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Anexos */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Anexos</h4>
          
          <div className="mb-4">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              Arquivos aceitos: PDF, JPG, PNG, DOC, DOCX (máximo 10MB cada)
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
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Enviando...' : 'Enviar Petição'}
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

export default PeticionamentoForm;