import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import portalCidadaoService from '../../services/portalCidadaoService';

const TIPOS_PETICAO_FALLBACK = [
  {
    id: 'DEFESA_PREVIA',
    slug: 'DEFESA_PREVIA',
    nome: 'Defesa Prévia / Impugnação',
    descricao: 'Petição apresentada após o auto de infração para impugnação da autuação.',
    setor_destino: 'JURIDICO_1',
    tipo_caixa: 'PETICAO'
  },
  {
    id: 'RECURSO_SEGUNDA_INSTANCIA',
    slug: 'RECURSO_SEGUNDA_INSTANCIA',
    nome: 'Recurso Administrativo - 2ª instância',
    descricao: 'Recurso para reanálise no Jurídico 2.',
    setor_destino: 'JURIDICO_2_RECURSOS',
    tipo_caixa: 'RECURSO'
  },
  {
    id: 'PEDIDO_DILACAO_PRAZO',
    slug: 'PEDIDO_DILACAO_PRAZO',
    nome: 'Pedido de Dilatação de Prazo',
    descricao: 'Solicitação de prazo adicional para defesa ou recurso.',
    setor_destino: 'JURIDICO_1',
    tipo_caixa: 'SOLICITACAO'
  },
  {
    id: 'PEDIDO_VISTA_AUTOS',
    slug: 'PEDIDO_VISTA_AUTOS',
    nome: 'Pedido de Cópia / Vista dos Autos',
    descricao: 'Solicitação de acesso aos autos do processo administrativo.',
    setor_destino: 'JURIDICO_1',
    tipo_caixa: 'SOLICITACAO'
  },
  {
    id: 'JUNTADA_DOCUMENTOS',
    slug: 'JUNTADA_DOCUMENTOS',
    nome: 'Petição de Juntada de Documentos',
    descricao: 'Apresentação de novos documentos ao processo.',
    setor_destino: 'JURIDICO_1',
    tipo_caixa: 'PETICAO'
  },
  {
    id: 'MANIFESTACAO_COMPLEMENTAR',
    slug: 'MANIFESTACAO_COMPLEMENTAR',
    nome: 'Manifestação Complementar',
    descricao: 'Complementação de argumentos anteriormente apresentados.',
    setor_destino: 'JURIDICO_1',
    tipo_caixa: 'PETICAO'
  },
  {
    id: 'ALEGACOES_FINAIS',
    slug: 'ALEGACOES_FINAIS',
    nome: 'AlegacA�es Finais',
    descricao: 'Apresentação de alegacA�es finais antes da decisão.',
    setor_destino: 'JURIDICO_1',
    tipo_caixa: 'PETICAO'
  },
  {
    id: 'PARCELAMENTO_MULTA',
    slug: 'PARCELAMENTO_MULTA',
    nome: 'Pedido de Parcelamento ou Negociação de Multa',
    descricao: 'Solicitação de parcelamento ou negociação do débito.',
    setor_destino: 'DAF',
    tipo_caixa: 'MULTA'
  },
  {
    id: 'REVISAO_MULTA',
    slug: 'REVISAO_MULTA',
    nome: 'Pedido de Revisão de Multa / Reconsideração',
    descricao: 'Pedido de reavaliação do valor ou condicA�es da multa.',
    setor_destino: 'JURIDICO_2_RECURSOS',
    tipo_caixa: 'RECURSO'
  },
  {
    id: 'EMBARGOS_DECLARACAO',
    slug: 'EMBARGOS_DECLARACAO',
    nome: 'Embargos de Declaração Administrativos',
    descricao: 'Petição para sanar omissão, contradição ou obscuridade na decisão.',
    setor_destino: 'JURIDICO_2_RECURSOS',
    tipo_caixa: 'RECURSO'
  },
];

const PeticionamentoForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [tiposPeticao, setTiposPeticao] = useState([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [anexos, setAnexos] = useState([]);
  const [formData, setFormData] = useState({
    tipo_peticao_id: '',
    tipo_peticao_codigo: '',
    numero_processo: '',
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
  const [processoInfo, setProcessoInfo] = useState(null);
  const [processoError, setProcessoError] = useState(null);

  useEffect(() => {
    const numero = (formData.numero_processo || '').trim();
    if (!numero) {
      setProcessoInfo(null);
      setProcessoError(null);
      setTiposPeticao([]);
      return;
    }

    if (numero.length < 6) {
      return;
    }

    const timeoutId = setTimeout(() => {
      carregarTiposPeticao(numero);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [formData.numero_processo]);

  const carregarTiposPeticao = async (numeroProcesso) => {
    setLoadingTipos(true);
    try {
      const resposta = await portalCidadaoService.getTiposPeticaoPortal(numeroProcesso);
      const tipos = resposta?.tipos ?? resposta ?? [];
      setTiposPeticao(Array.isArray(tipos) ? tipos : []);
      setProcessoInfo(resposta?.processo || null);
      setProcessoError(null);

      if (selectedTipo && Array.isArray(tipos)) {
        const tipoAindaPermitido = tipos.some((tipo) =>
          tipo.slug === selectedTipo.slug || String(tipo.id) === String(selectedTipo.id)
        );
        if (!tipoAindaPermitido) {
          setSelectedTipo(null);
          setFormData(prev => ({
            ...prev,
            tipo_peticao_id: '',
            tipo_peticao_codigo: ''
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
      const detalhe = error?.response?.data?.detail || error?.message || 'Processo nao encontrado.';
      setProcessoError(detalhe);
      setProcessoInfo(null);
      setTiposPeticao(numeroProcesso ? [] : TIPOS_PETICAO_FALLBACK);
    } finally {
      setLoadingTipos(false);
    }
  };
  const obterNomeSetor = (setor) => {
    const mapa = {
      JURIDICO_1: 'Jurídico 1',
      JURIDICO_2_RECURSOS: 'Jurídico 2',
      DAF: 'Financeiro (DAF)',
      FINANCEIRO: 'Financeiro'
    };
    return mapa[setor] || setor || 'Setor nao informado';
  };


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Se mudou o tipo de petição, atualizar selectedTipo
    if (field === 'tipo_peticao_id') {
      const tipoEncontrado = tiposPeticao.find(t => 
        t.id === value || 
        t.slug === value ||
        String(t.id) === String(value) ||
        String(t.slug) === String(value)
      );
      setSelectedTipo(tipoEncontrado || null);
      
      // Se encontrou o tipo e tem slug, atualizar formData com o slug também
      if (tipoEncontrado && tipoEncontrado.slug) {
        setFormData(prev => ({
          ...prev,
          tipo_peticao_codigo: tipoEncontrado.slug
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
    
    if (!formData.tipo_peticao_id && !formData.tipo_peticao_codigo) {
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

    if (!formData.numero_processo) {
      novosErrors.numero_processo = 'Numero do processo e obrigatorio';
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
      const formDataToSend = new FormData();

      // Adicionar apenas campos com valor (não vazios)
      Object.entries(formData).forEach(([campo, valor]) => {
        // Não adicionar campos vazios ou campos que serão tratados separadamente
        if (valor !== undefined && valor !== null && valor !== '' && campo !== 'tipo_peticao_id' && campo !== 'tipo_peticao_codigo') {
          formDataToSend.append(campo, valor);
        }
      });

      // Obter código do tipo selecionado - priorizar slug/código sobre ID
      const tipoSelecionado = selectedTipo || tiposPeticao.find(t => 
        t.id === formData.tipo_peticao_id || 
        t.slug === formData.tipo_peticao_id ||
        String(t.id) === String(formData.tipo_peticao_id) ||
        String(t.slug) === String(formData.tipo_peticao_id)
      );
      
      // Priorizar tipo_peticao_codigo do formData, depois slug do tipo selecionado
      let codigoSelecionado = formData.tipo_peticao_codigo;
      if (!codigoSelecionado && tipoSelecionado) {
        codigoSelecionado = tipoSelecionado.slug;
      }
      
      // Se ainda não tem código e tem tipo_peticao_id, verificar se é um slug
      if (!codigoSelecionado && formData.tipo_peticao_id) {
        // Se o ID parece ser um slug (string não numérica), usar diretamente
        if (typeof formData.tipo_peticao_id === 'string' && !/^\d+$/.test(formData.tipo_peticao_id)) {
          codigoSelecionado = formData.tipo_peticao_id.toUpperCase();
        }
      }
      
      // Adicionar código se encontrado (preferido pela API)
      if (codigoSelecionado) {
        formDataToSend.set('tipo_peticao_codigo', codigoSelecionado.toUpperCase());
        // Remover tipo_peticao_id se temos código para evitar confusão
        formDataToSend.delete('tipo_peticao_id');
      } else if (formData.tipo_peticao_id) {
        // Se não tem código mas tem ID, manter o ID (pode ser ID numérico do banco)
        // Mas garantir que seja numérico
        const tipoId = String(formData.tipo_peticao_id).trim();
        if (/^\d+$/.test(tipoId)) {
          formDataToSend.set('tipo_peticao_id', tipoId);
        } else {
          // Se não é numérico, tentar usar como código
          formDataToSend.set('tipo_peticao_codigo', tipoId.toUpperCase());
          formDataToSend.delete('tipo_peticao_id');
        }
      } else {
        // Se não tem nem código nem ID, isso é um erro
        setLoading(false);
        setErrors({
          tipo_peticao_id: 'Tipo de petição é obrigatório. Por favor, selecione um tipo.'
        });
        return;
      }

      anexos.forEach((anexo) => {
        formDataToSend.append('documentos', anexo);
      });

      // Debug: verificar o que está sendo enviado
      if (import.meta.env.DEV) {
        console.log('=== Dados do Formulário ===');
        console.log('formData:', formData);
        console.log('selectedTipo:', selectedTipo);
        console.log('tipoSelecionado encontrado:', tipoSelecionado);
        console.log('codigoSelecionado:', codigoSelecionado);
        console.log('=== FormData sendo enviado ===');
        for (const [key, value] of formDataToSend.entries()) {
          if (value instanceof File) {
            console.log(`${key}: [Arquivo] ${value.name}`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }
      }

      const resposta = await portalCidadaoService.enviarPeticao(formDataToSend);
      onSuccess && onSuccess(resposta.data);

      // Limpar formulário após sucesso
      setSelectedTipo(null);
      setAnexos([]);
      setFormData({
        tipo_peticao_id: '',
        tipo_peticao_codigo: '',
        numero_processo: '',
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
      setErrors({});
    } catch (error) {
      console.error('Erro ao enviar petição:', error);
      
      // Log detalhado em desenvolvimento
      if (import.meta.env.DEV) {
        console.error('=== Detalhes do Erro ===');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Headers:', error.response?.headers);
      }
      
      // Tentar extrair mensagem de erro da API
      let mensagemErro = 'Erro ao enviar petição. Tente novamente.';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          mensagemErro = errorData.error;
        } else if (errorData.detail) {
          mensagemErro = errorData.detail;
        } else if (typeof errorData === 'string') {
          mensagemErro = errorData;
        } else if (errorData.message) {
          mensagemErro = errorData.message;
        } else {
          // Tentar pegar qualquer mensagem disponível
          mensagemErro = JSON.stringify(errorData);
        }
      } else if (error.message) {
        mensagemErro = error.message;
      }
      
      setErrors({
        geral: mensagemErro
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
            disabled={!formData.numero_processo || !!processoError || loadingTipos}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.tipo_peticao_id ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Selecione o tipo de petição</option>
            {tiposPeticao.map((tipo) => (
              <option key={tipo.id || tipo.slug} value={tipo.slug || tipo.id}>
                {tipo.nome} - Destino: {obterNomeSetor(tipo.setor_destino)}
              </option>
            ))}
          </select>
          {selectedTipo && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Destinado a: <span className="font-semibold">{obterNomeSetor(selectedTipo.setor_destino)}</span></p>
              {selectedTipo.descricao && (
                <p className="text-xs text-gray-500 mt-1">{selectedTipo.descricao}</p>
              )}
            </div>
          )}
          {!formData.numero_processo && (
            <p className="text-xs text-gray-500 mt-2">Informe o número do processo para liberar os tipos de petição.</p>
          )}
          {errors.tipo_peticao_id && (
            <p className="text-sm text-red-600 mt-1">{errors.tipo_peticao_id}</p>
          )}

        </div>

        {/* Numero do Processo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numero do processo *
          </label>
          <input
            type="text"
            value={formData.numero_processo}
            onChange={(e) => handleInputChange('numero_processo', e.target.value)}
            placeholder="Informe o numero do processo"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.numero_processo ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.numero_processo && (
            <p className="text-sm text-red-600 mt-1">{errors.numero_processo}</p>
          )}
          {loadingTipos && (
            <p className="text-xs text-gray-500 mt-2">Validando processo...</p>
          )}
          {processoError && (
            <p className="text-sm text-red-600 mt-2">{processoError}</p>
          )}
          {processoInfo && !processoError && (
            <div className="mt-2 text-xs text-gray-600">
              <p>Status do processo: <span className="font-medium">{processoInfo.status_display || processoInfo.status}</span></p>
              {processoInfo.prazo_defesa && (
                <p>Prazo de defesa: {processoInfo.prazo_defesa}</p>
              )}
              {processoInfo.prazo_recurso && (
                <p>Prazo de recurso: {processoInfo.prazo_recurso}</p>
              )}
              {processoInfo.defesa_ja_apresentada && (
                <p className="text-orange-600">Defesa já apresentada para este processo.</p>
              )}
              {processoInfo.recurso_ja_apresentado && (
                <p className="text-orange-600">Recurso já apresentado para este processo.</p>
              )}
            </div>
          )}
          {!loadingTipos && formData.numero_processo && !processoError && tiposPeticao.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">Nenhum tipo de peticao disponivel para este processo.</p>
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
