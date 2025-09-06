import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import portalCidadaoService from '../../services/portalCidadaoService';

const DenunciaForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    tipo_denuncia: 'GERAL',
    denuncia_anonima: false,
    nome_denunciante: '',
    email: '',
    telefone: '',
    cpf_cnpj: '',
    endereco: '',
    empresa_denunciada: '',
    cnpj_empresa: '',
    endereco_empresa: '',
    descricao_fatos: '',
    data_ocorrencia: '',
    motivo_anonimato: '',
    documentos: [],
    aceite_termos: false
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      const fileList = Array.from(files);
      setFormData(prev => ({
        ...prev,
        [name]: fileList
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validarFormulario = () => {
    const novosErrors = {};

    // Validação baseada em se é denúncia anônima ou não
    if (!formData.denuncia_anonima) {
      // Validação do nome (obrigatório apenas se não for anônima)
      if (!formData.nome_denunciante.trim()) {
        novosErrors.nome_denunciante = 'Nome é obrigatório';
      } else if (formData.nome_denunciante.trim().length < 3) {
        novosErrors.nome_denunciante = 'Nome deve ter pelo menos 3 caracteres';
      }

      // Validação do email (obrigatório apenas se não for anônima)
      if (!formData.email.trim()) {
        novosErrors.email = 'Email é obrigatório';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        novosErrors.email = 'Email inválido';
      }

      // Validação do telefone (obrigatório apenas se não for anônima)
      if (!formData.telefone.trim()) {
        novosErrors.telefone = 'Telefone é obrigatório';
      } else if (formData.telefone.replace(/\D/g, '').length < 10) {
        novosErrors.telefone = 'Telefone inválido';
      }

      // Validação do CPF/CNPJ (obrigatório apenas se não for anônima)
      if (!formData.cpf_cnpj.trim()) {
        novosErrors.cpf_cnpj = 'CPF/CNPJ é obrigatório';
      } else {
        const cpfCnpj = formData.cpf_cnpj.replace(/\D/g, '');
        if (cpfCnpj.length === 11) {
          if (!portalCidadaoService.validarCPF(formData.cpf_cnpj)) {
            novosErrors.cpf_cnpj = 'CPF inválido';
          }
        } else if (cpfCnpj.length === 14) {
          if (!portalCidadaoService.validarCNPJ(formData.cpf_cnpj)) {
            novosErrors.cpf_cnpj = 'CNPJ inválido';
          }
        } else {
          novosErrors.cpf_cnpj = 'CPF/CNPJ deve ter 11 ou 14 dígitos';
        }
      }
    } else {
      // Validação do motivo do anonimato (obrigatório se for anônima)
      if (!formData.motivo_anonimato.trim()) {
        novosErrors.motivo_anonimato = 'Motivo do anonimato é obrigatório';
      } else if (formData.motivo_anonimato.trim().length < 10) {
        novosErrors.motivo_anonimato = 'Motivo deve ter pelo menos 10 caracteres';
      }
    }

    // Validação da empresa denunciada
    if (!formData.empresa_denunciada.trim()) {
      novosErrors.empresa_denunciada = 'Nome da empresa é obrigatório';
    }

    // Validação do CNPJ da empresa
    if (formData.cnpj_empresa.trim()) {
      if (!portalCidadaoService.validarCNPJ(formData.cnpj_empresa)) {
        novosErrors.cnpj_empresa = 'CNPJ da empresa inválido';
      }
    }

    // Validação da descrição
    if (!formData.descricao_fatos.trim()) {
      novosErrors.descricao_fatos = 'Descrição dos fatos é obrigatória';
    } else if (formData.descricao_fatos.trim().length < 50) {
      novosErrors.descricao_fatos = 'Descrição deve ter pelo menos 50 caracteres';
    }

    // Validação da data
    if (!formData.data_ocorrencia) {
      novosErrors.data_ocorrencia = 'Data da ocorrência é obrigatória';
    } else {
      const dataOcorrencia = new Date(formData.data_ocorrencia);
      const hoje = new Date();
      if (dataOcorrencia > hoje) {
        novosErrors.data_ocorrencia = 'Data da ocorrência não pode ser futura';
      }
    }

    // Validação dos documentos
    if (formData.documentos.length > 0) {
      formData.documentos.forEach((file, index) => {
        if (file.size > 10 * 1024 * 1024) { // 10MB
          novosErrors.documentos = 'Cada arquivo deve ter no máximo 10MB';
        }
        
        const extensao = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].includes(extensao)) {
          novosErrors.documentos = 'Tipos de arquivo permitidos: PDF, JPG, PNG, DOC, DOCX';
        }
      });
    }

    // Validação dos termos
    if (!formData.aceite_termos) {
      novosErrors.aceite_termos = 'Você deve aceitar os termos de uso';
    }

    setErrors(novosErrors);
    return Object.keys(novosErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      // Formatar CPF/CNPJ antes de enviar
      const dadosFormatados = {
        ...formData,
        cpf_cnpj: formData.denuncia_anonima ? '' : portalCidadaoService.formatarCPFCNPJ(formData.cpf_cnpj),
        cnpj_empresa: formData.cnpj_empresa ? portalCidadaoService.formatarCPFCNPJ(formData.cnpj_empresa) : '',
        // Limpar dados pessoais se for denúncia anônima
        nome_denunciante: formData.denuncia_anonima ? '' : formData.nome_denunciante,
        email: formData.denuncia_anonima ? '' : formData.email,
        telefone: formData.denuncia_anonima ? '' : formData.telefone,
        endereco: formData.denuncia_anonima ? '' : formData.endereco
      };

      await onSubmit(dadosFormatados);
      setSuccess(true);
      
      // Limpar formulário após sucesso
      setTimeout(() => {
        setFormData({
          tipo_denuncia: 'GERAL',
          denuncia_anonima: false,
          nome_denunciante: '',
          email: '',
          telefone: '',
          cpf_cnpj: '',
          endereco: '',
          empresa_denunciada: '',
          cnpj_empresa: '',
          endereco_empresa: '',
          descricao_fatos: '',
          data_ocorrencia: '',
          motivo_anonimato: '',
          documentos: [],
          aceite_termos: false
        });
        setSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
      setErrors({
        geral: 'Erro ao enviar denúncia. Tente novamente.'
      });
    }
  };

  const formatarCPFCNPJ = (valor) => {
    const formatado = portalCidadaoService.formatarCPFCNPJ(valor);
    setFormData(prev => ({
      ...prev,
      cpf_cnpj: formatado
    }));
  };

  const formatarCNPJEmpresa = (valor) => {
    const formatado = portalCidadaoService.formatarCPFCNPJ(valor);
    setFormData(prev => ({
      ...prev,
      cnpj_empresa: formatado
    }));
  };

  const removerDocumento = (index) => {
    setFormData(prev => ({
      ...prev,
      documentos: prev.documentos.filter((_, i) => i !== index)
    }));
  };

  const toggleDenunciaAnonima = (checked) => {
    setFormData(prev => ({
      ...prev,
      denuncia_anonima: checked,
      // Limpar dados pessoais se marcar como anônima
      nome_denunciante: checked ? '' : prev.nome_denunciante,
      email: checked ? '' : prev.email,
      telefone: checked ? '' : prev.telefone,
      cpf_cnpj: checked ? '' : prev.cpf_cnpj,
      endereco: checked ? '' : prev.endereco,
      motivo_anonimato: checked ? prev.motivo_anonimato : ''
    }));

    // Limpar erros dos campos que serão ocultados
    if (checked) {
      setErrors(prev => ({
        ...prev,
        nome_denunciante: null,
        email: null,
        telefone: null,
        cpf_cnpj: null
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        motivo_anonimato: null
      }));
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
        <div className="text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Denúncia Enviada com Sucesso!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Sua denúncia foi registrada e será analisada por nossos fiscais.
          </p>
          {formData.denuncia_anonima && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Denúncia Anônima:</strong> Sua identidade foi preservada e não será divulgada.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
      <div className="flex items-center mb-6">
        <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400 mr-3" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Denúncia</h3>
      </div>

      {errors.geral && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 mr-2 mt-0.5" />
            <span>{errors.geral}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Denúncia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Denúncia *
          </label>
          <select
            name="tipo_denuncia"
            value={formData.tipo_denuncia}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
          >
            <option value="GERAL">Denúncia Geral</option>
            <option value="BANCO">Instituição Bancária</option>
            <option value="TELEFONIA">Operadora de Telefonia</option>
            <option value="ENERGIA">Concessionária de Energia</option>
            <option value="AGUA">Concessionária de Água</option>
            <option value="TRANSPORTE">Transporte Público</option>
            <option value="SAUDE">Plano de Saúde</option>
            <option value="EDUCACAO">Instituição de Ensino</option>
            <option value="VAREJO">Comércio Varejista</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>

        {/* Opção de Denúncia Anônima */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              name="denuncia_anonima"
              checked={formData.denuncia_anonima}
              onChange={(e) => toggleDenunciaAnonima(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="ml-3">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Denúncia Anônima
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Marque esta opção se deseja manter sua identidade em sigilo. 
                Seus dados pessoais não serão coletados.
              </p>
            </div>
          </div>
        </div>

        {/* Motivo do Anonimato (apenas se for anônima) */}
        {formData.denuncia_anonima && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motivo do Anonimato *
            </label>
            <textarea
              name="motivo_anonimato"
              value={formData.motivo_anonimato}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-colors duration-300 ${
                errors.motivo_anonimato ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Explique brevemente o motivo para manter o anonimato..."
            />
            {errors.motivo_anonimato && (
              <p className="text-red-500 text-sm mt-1">{errors.motivo_anonimato}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Mínimo 10 caracteres. Esta informação será mantida em sigilo.
            </p>
          </div>
        )}

        {/* Dados do Denunciante - Apenas se não for anônima */}
        {!formData.denuncia_anonima && (
          <>
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Dados do Denunciante
              </h4>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="nome_denunciante"
                  value={formData.nome_denunciante}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-colors duration-300 ${
                    errors.nome_denunciante ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Seu nome completo"
                />
                {errors.nome_denunciante && (
                  <p className="text-red-500 text-sm mt-1">{errors.nome_denunciante}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-colors duration-300 ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>
          </>
        )}

        {!formData.denuncia_anonima && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone *
              </label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-colors duration-300 ${
                  errors.telefone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="(00) 00000-0000"
              />
              {errors.telefone && (
                <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CPF/CNPJ *
              </label>
              <input
                type="text"
                name="cpf_cnpj"
                value={formData.cpf_cnpj}
                onChange={handleInputChange}
                onBlur={(e) => formatarCPFCNPJ(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-colors duration-300 ${
                  errors.cpf_cnpj ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
              />
              {errors.cpf_cnpj && (
                <p className="text-red-500 text-sm mt-1">{errors.cpf_cnpj}</p>
              )}
            </div>
          </div>
        )}

        {!formData.denuncia_anonima && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Endereço
            </label>
            <input
              type="text"
              name="endereco"
              value={formData.endereco}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
              placeholder="Rua, número, bairro, cidade - UF"
            />
          </div>
        )}

        {/* Dados da Empresa Denunciada */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 mr-2" />
            Empresa Denunciada
          </h4>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome da Empresa *
            </label>
            <input
              type="text"
              name="empresa_denunciada"
              value={formData.empresa_denunciada}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-colors duration-300 ${
                errors.empresa_denunciada ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Nome da empresa denunciada"
            />
            {errors.empresa_denunciada && (
              <p className="text-red-500 text-sm mt-1">{errors.empresa_denunciada}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CNPJ da Empresa
            </label>
            <input
              type="text"
              name="cnpj_empresa"
              value={formData.cnpj_empresa}
              onChange={handleInputChange}
              onBlur={(e) => formatarCNPJEmpresa(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-colors duration-300 ${
                errors.cnpj_empresa ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="00.000.000/0000-00"
            />
            {errors.cnpj_empresa && (
              <p className="text-red-500 text-sm mt-1">{errors.cnpj_empresa}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Endereço da Empresa
          </label>
          <input
            type="text"
            name="endereco_empresa"
            value={formData.endereco_empresa}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
            placeholder="Endereço da empresa denunciada"
          />
        </div>

        {/* Descrição dos Fatos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descrição dos Fatos *
          </label>
          <textarea
            name="descricao_fatos"
            value={formData.descricao_fatos}
            onChange={handleInputChange}
            rows={6}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-colors duration-300 ${
              errors.descricao_fatos ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Descreva detalhadamente os fatos que motivaram a denúncia..."
          />
          {errors.descricao_fatos && (
            <p className="text-red-500 text-sm mt-1">{errors.descricao_fatos}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Mínimo 50 caracteres. Descreva com detalhes para melhor análise.
          </p>
        </div>

        {/* Data da Ocorrência */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data da Ocorrência *
          </label>
          <input
            type="date"
            name="data_ocorrencia"
            value={formData.data_ocorrencia}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-colors duration-300 ${
              errors.data_ocorrencia ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.data_ocorrencia && (
            <p className="text-red-500 text-sm mt-1">{errors.data_ocorrencia}</p>
          )}
        </div>

        {/* Documentos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Documentos (Opcional)
          </label>
          <input
            type="file"
            name="documentos"
            onChange={handleInputChange}
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
          />
          {errors.documentos && (
            <p className="text-red-500 text-sm mt-1">{errors.documentos}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tipos aceitos: PDF, JPG, PNG, DOC, DOCX. Máximo 10MB por arquivo.
          </p>

          {/* Lista de documentos selecionados */}
          {formData.documentos.length > 0 && (
            <div className="mt-3 space-y-2">
              {formData.documentos.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removerDocumento(index)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Termos de Uso */}
        <div className="flex items-start">
          <input
            type="checkbox"
            name="aceite_termos"
            checked={formData.aceite_termos}
            onChange={handleInputChange}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Declaro que li e aceito os{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              termos de uso
            </a>{' '}
            e{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              política de privacidade
            </a>
            . *
          </label>
        </div>
        {errors.aceite_termos && (
          <p className="text-red-500 text-sm mt-1">{errors.aceite_termos}</p>
        )}

        {/* Botões */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
          >
            {loading ? 'Enviando...' : 'Enviar Denúncia'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DenunciaForm;
