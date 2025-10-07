import React, { useState } from 'react';
import api from '../../services/api';
import atendimentoService from '../../services/atendimentoService';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  PhoneIcon,
  PaperClipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useNotification } from '../../hooks/useNotifications';

const NovaReclamacao = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const createInitialFormData = () => ({
    // Dados basicos
    tipo_demanda: 'RECLAMACAO',

    // Dados do consumidor
    consumidor_nome: '',
    consumidor_cpf: '',
    consumidor_email: '',
    consumidor_telefone: '',
    consumidor_endereco: '',
    consumidor_cep: '',
    consumidor_cidade: '',
    consumidor_uf: '',

    // Dados da empresa
    empresa_razao_social: '',
    empresa_cnpj: '',
    empresa_endereco: '',
    empresa_telefone: '',
    empresa_email: '',

    // Dados da reclamacao
    descricao_fatos: '',
    data_ocorrencia: '',
    valor_envolvido: '',

    // Dados do atendimento
    tipo_atendimento: 'RECLAMACAO',
    canal_atendimento: 'BALCAO',
    observacoes: '',

    // Anexos
    anexos: []
  });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(createInitialFormData);

  const steps = [
    { number: 1, title: 'Dados do Consumidor', icon: UserIcon },
    { number: 2, title: 'Dados da Empresa', icon: BuildingOfficeIcon },
    { number: 3, title: 'Descricao dos Fatos', icon: DocumentTextIcon },
    { number: 4, title: 'Dados do Atendimento', icon: PhoneIcon },
    { number: 5, title: 'Anexos', icon: PaperClipIcon },
  ];

  const tipoAtendimentoOptions = [
    { value: 'RECLAMACAO', label: 'Reclamacao' },
    { value: 'DENUNCIA', label: 'Denuncia' },
    { value: 'ORIENTACAO', label: 'Orientacao' },
    { value: 'CONSULTA', label: 'Consulta' },
    { value: 'OUTROS', label: 'Outros' },
  ];

  const canalAtendimentoOptions = [
    { value: 'BALCAO', label: 'Balcao Presencial' },
    { value: 'TELEFONE', label: 'Telefone' },
    { value: 'ONLINE', label: 'Portal/Online' },
  ];

  const [empresaData, setEmpresaData] = useState(null);
  const [cnpjMessage, setCnpjMessage] = useState(null);
  const [validatingCNPJ, setValidatingCNPJ] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCNPJ = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCEP = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const consultarCNPJ = async (cnpj) => {
    if (!cnpj) {
      return;
    }

    const sanitizedCnpj = cnpj.replace(/\D/g, '');
    if (sanitizedCnpj.length !== 14) {
      showError('Informe um CNPJ valido com 14 digitos');
      return;
    }

    setValidatingCNPJ(true);
    setCnpjMessage(null);

    try {
      const { data } = await api.get('/atendimento/consultar-cnpj/', {
        params: { cnpj: sanitizedCnpj }
      });

      if (data.sucesso) {
        setEmpresaData(data);
        setFormData((prev) => ({
          ...prev,
          empresa_razao_social: data.razao_social || prev.empresa_razao_social,
          empresa_endereco: data.endereco || prev.empresa_endereco,
          empresa_telefone: data.telefone || prev.empresa_telefone,
          empresa_email: data.email || prev.empresa_email,
        }));
        const message = data.mensagem || 'Dados da empresa carregados automaticamente';
        setCnpjMessage({ type: 'success', text: message });
        showSuccess(message);
      } else {
        const mensagem = data.erro || 'Erro ao consultar CNPJ';
        setEmpresaData(null);
        setCnpjMessage({ type: 'error', text: mensagem });
        showError(mensagem);
      }
    } catch (error) {
      const mensagem = error?.response?.data?.erro || 'Erro ao consultar CNPJ. Tente novamente em instantes.';
      setEmpresaData(null);
      setCnpjMessage({ type: 'error', text: mensagem });
      showError(mensagem);
    } finally {
      setValidatingCNPJ(false);
    }
  };

  const handleFileUpload = (event) => {
    const arquivos = Array.from(event.target.files || []);
    if (!arquivos.length) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      anexos: [...prev.anexos, ...arquivos]
    }));
  };

  const removeFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      anexos: prev.anexos.filter((_, i) => i !== index)
    }));
  };

  const nextStep = () => {
    if (step < steps.length) {
      setStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((prev) => Math.max(1, prev - 1));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.consumidor_nome || !formData.consumidor_cpf ||
        !formData.empresa_razao_social || !formData.empresa_cnpj ||
        !formData.descricao_fatos || !formData.data_ocorrencia) {
      showError('Preencha todos os campos obrigatorios');
      return;
    }

    try {
      setLoading(true);

      const resultado = await atendimentoService.registrarPresencial({
        ...formData,
        anexos: formData.anexos,
      });

      showSuccess(`Atendimento ${resultado.numero_atendimento} e reclamacao ${resultado.reclamacao.numero_protocolo} registrados com sucesso!`);

      setFormData(createInitialFormData());
      setEmpresaData(null);
      setCnpjMessage(null);
      setStep(1);
      navigate(`/atendimento/reclamacoes/${resultado.reclamacao.id}`);
    } catch (error) {
      const resposta = error?.response?.data;
      let mensagem = 'Erro ao registrar atendimento';
      if (resposta) {
        if (typeof resposta === 'string') {
          mensagem = resposta;
        } else if (Array.isArray(resposta)) {
          mensagem = resposta[0];
        } else {
          mensagem = resposta.erro || resposta.detail || mensagem;
        }
      }
      showError(mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nova Reclamação/Denúncia</h1>
        <p className="text-gray-600 mt-2">Registre uma nova reclamação ou denúncia no sistema</p>
      </div>
      {/* Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((stepItem, index) => (
            <div key={stepItem.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step >= stepItem.number 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-500'
              }`}>
                <stepItem.icon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  step >= stepItem.number ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {stepItem.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  step > stepItem.number ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Step 1: Dados do Consumidor */}
        
{step === 1 && (
  <div className="space-y-6">
    <div className="flex items-center mb-6">
      <UserIcon className="h-6 w-6 text-blue-600 mr-3" />
      <h2 className="text-xl font-semibold text-gray-900">Dados do Consumidor</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome Completo *
        </label>
        <input
          type="text"
          name="consumidor_nome"
          value={formData.consumidor_nome}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CPF *
        </label>
        <input
          type="text"
          name="consumidor_cpf"
          value={formData.consumidor_cpf}
          onChange={(e) => {
            const formatted = formatCPF(e.target.value);
            setFormData(prev => ({ ...prev, consumidor_cpf: formatted }));
          }}
          maxLength="14"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          E-mail *
        </label>
        <input
          type="email"
          name="consumidor_email"
          value={formData.consumidor_email}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Telefone
        </label>
        <input
          type="text"
          name="consumidor_telefone"
          value={formData.consumidor_telefone}
          onChange={(e) => {
            const formatted = formatPhone(e.target.value);
            setFormData(prev => ({ ...prev, consumidor_telefone: formatted }));
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Endereço
        </label>
        <input
          type="text"
          name="consumidor_endereco"
          value={formData.consumidor_endereco}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CEP
        </label>
        <input
          type="text"
          name="consumidor_cep"
          value={formData.consumidor_cep}
          onChange={(e) => {
            const formatted = formatCEP(e.target.value);
            setFormData(prev => ({ ...prev, consumidor_cep: formatted }));
          }}
          maxLength="9"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cidade
        </label>
        <input
          type="text"
          name="consumidor_cidade"
          value={formData.consumidor_cidade}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          UF
        </label>
        <select
          name="consumidor_uf"
          value={formData.consumidor_uf}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Selecione</option>
          <option value="AC">AC</option>
          <option value="AL">AL</option>
          <option value="AP">AP</option>
          <option value="AM">AM</option>
          <option value="BA">BA</option>
          <option value="CE">CE</option>
          <option value="DF">DF</option>
          <option value="ES">ES</option>
          <option value="GO">GO</option>
          <option value="MA">MA</option>
          <option value="MT">MT</option>
          <option value="MS">MS</option>
          <option value="MG">MG</option>
          <option value="PA">PA</option>
          <option value="PB">PB</option>
          <option value="PR">PR</option>
          <option value="PE">PE</option>
          <option value="PI">PI</option>
          <option value="RJ">RJ</option>
          <option value="RN">RN</option>
          <option value="RS">RS</option>
          <option value="RO">RO</option>
          <option value="RR">RR</option>
          <option value="SC">SC</option>
          <option value="SP">SP</option>
          <option value="SE">SE</option>
          <option value="TO">TO</option>
        </select>
      </div>
    </div>
  </div>
)}

{/* Step 2: Dados da Empresa */}
{step === 2 && (
  <div className="space-y-6">
    <div className="flex items-center mb-6">
      <BuildingOfficeIcon className="h-6 w-6 text-blue-600 mr-3" />
      <h2 className="text-xl font-semibold text-gray-900">Dados da Empresa</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CNPJ *
        </label>
        <div className="flex">
          <input
            type="text"
            name="empresa_cnpj"
            value={formData.empresa_cnpj}
            onChange={(e) => {
              const formatted = formatCNPJ(e.target.value);
              setFormData(prev => ({ ...prev, empresa_cnpj: formatted }));
              setCnpjMessage(null);
              if (formatted.length === 18) {
                consultarCNPJ(formatted);
              }
            }}
            maxLength="18"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          {validatingCNPJ && (
            <div className="ml-2 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        {cnpjMessage && (
          <p className={`mt-2 text-sm ${cnpjMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {cnpjMessage.text}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Razão Social *
        </label>
        <input
          type="text"
          name="empresa_razao_social"
          value={formData.empresa_razao_social}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Endereço
        </label>
        <input
          type="text"
          name="empresa_endereco"
          value={formData.empresa_endereco}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Telefone
        </label>
        <input
          type="text"
          name="empresa_telefone"
          value={formData.empresa_telefone}
          onChange={(e) => {
            const formatted = formatPhone(e.target.value);
            setFormData(prev => ({ ...prev, empresa_telefone: formatted }));
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          E-mail
        </label>
        <input
          type="email"
          name="empresa_email"
          value={formData.empresa_email}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
    {empresaData && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
          <p className="text-sm text-green-800">
            Dados da empresa carregados automaticamente da Receita Federal
          </p>
        </div>
      </div>
    )}
  </div>
)}
        {/* Step 3: Descrição dos Fatos */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Descrição dos Fatos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Demanda
                </label>
                <select
                  name="tipo_demanda"
                  value={formData.tipo_demanda}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="RECLAMACAO">Reclamação</option>
                  <option value="DENUNCIA">Denúncia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data da Ocorrência *
                </label>
                <input
                  type="date"
                  name="data_ocorrencia"
                  value={formData.data_ocorrencia}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Envolvido (R$)
                </label>
                <input
                  type="number"
                  name="valor_envolvido"
                  value={formData.valor_envolvido}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição dos Fatos *
              </label>
              <textarea
                name="descricao_fatos"
                value={formData.descricao_fatos}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descreva detalhadamente os fatos que motivaram a reclamação/denúncia..."
                required
              />
            </div>
          </div>
        )}
        {/* Step 4: Dados do Atendimento */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <PhoneIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Dados do Atendimento</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Atendimento *
                </label>
                <select
                  name="tipo_atendimento"
                  value={formData.tipo_atendimento}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {tipoAtendimentoOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Canal do Atendimento *
                </label>
                <select
                  name="canal_atendimento"
                  value={formData.canal_atendimento}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {canalAtendimentoOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observacoes do Atendimento
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Registre observacoes relevantes do atendimento presencial..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Anexos */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <PaperClipIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Anexos</h2>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="anexos" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Clique para selecionar arquivos
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      ou arraste e solte aqui
                    </span>
                  </label>
                  <input
                    id="anexos"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="sr-only"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG, TXT (máx. 10MB cada)
                </p>
              </div>
            </div>
            {formData.anexos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">Arquivos Selecionados:</h3>
                {formData.anexos.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center">
                      <PaperClipIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className={`px-4 py-2 rounded-lg ${
              step === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            Anterior
          </button>
          {step < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Próximo
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Registrar Reclamação
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default NovaReclamacao;
