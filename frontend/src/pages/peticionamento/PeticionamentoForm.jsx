import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  ScaleIcon,
  ClockIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';

const PeticionamentoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // Dados Básicos do Peticionamento
    tipo_peticionamento: 'Petição Inicial',
    numero_processo: '',
    assunto: '',
    descricao: '',
    fundamentacao_legal: '',
    data_apresentacao: new Date().toISOString().split('T')[0],
    urgente: false,
    confidencial: false,
    
    // Dados do Peticionário
    tipo_peticionario: 'Pessoa Física',
    nome_peticionario: '',
    cpf_cnpj_peticionario: '',
    email_peticionario: '',
    telefone_peticionario: '',
    endereco_peticionario: '',
    cidade_peticionario: '',
    estado_peticionario: '',
    cep_peticionario: '',
    profissao_peticionario: '',
    
    // Dados do Procurador (se aplicável)
    possui_procurador: false,
    nome_procurador: '',
    oab_procurador: '',
    email_procurador: '',
    telefone_procurador: '',
    
    // Dados da Parte Contrária (se aplicável)
    possui_parte_contraria: false,
    nome_parte_contraria: '',
    cpf_cnpj_parte_contraria: '',
    endereco_parte_contraria: '',
    
    // Pedidos Específicos
    pedidos: [
      {
        id: Date.now(),
        tipo: 'Principal',
        descricao: '',
        fundamentacao: '',
        valor_causa: '',
        prazo_cumprimento: ''
      }
    ],
    
    // Documentos de Instrução
    documentos: [],
    documentos_obrigatorios: {
      identidade: false,
      comprovante_residencia: false,
      procuracao: false,
      documentos_comprobatorios: false
    },
    
    // Informações Processuais
    competencia: '',
    vara_responsavel: '',
    prioridade: 'Normal',
    categoria_direito: '',
    subcategoria: '',
    
    // Dados Adicionais
    valor_da_causa: '',
    beneficiario_gratuidade: false,
    isento_custas: false,
    requer_liminar: false,
    requer_tutela_antecipada: false,
    
    // Observações e Notas
    observacoes_peticionario: '',
    observacoes_internas: '',
    
    // Configurações
    forma_intimacao: 'Email',
    autoriza_publicacao: false,
    requer_vista_autos: false,
    
    // Status e Controle
    status: 'Rascunho',
    protocolo_relacionado: ''
  });

  useEffect(() => {
    if (id) {
      fetchPeticionamento();
    }
  }, [id]);

  const fetchPeticionamento = async () => {
    try {
      setLoading(true);
      // Simular carregamento de dados
      if (id) {
        const mockData = {
          tipo_peticionamento: 'Petição Inicial',
          numero_processo: 'PROC-2024-001234',
          assunto: 'Ação de Reparação de Danos - Produto com Defeito',
          descricao: 'Petição inicial requerendo reparação de danos materiais e morais decorrentes de produto defeituoso vendido pela empresa requerida.',
          fundamentacao_legal: 'Art. 6º, VI e VIII; Art. 14, §1º; Art. 18, §1º, II do Código de Defesa do Consumidor (Lei 8.078/90)',
          data_apresentacao: '2024-03-20',
          urgente: false,
          confidencial: false,
          tipo_peticionario: 'Pessoa Física',
          nome_peticionario: 'João Carlos da Silva',
          cpf_cnpj_peticionario: '123.456.789-00',
          email_peticionario: 'joao.silva@email.com',
          telefone_peticionario: '(11) 98765-4321',
          endereco_peticionario: 'Rua das Palmeiras, 456, Apto 78',
          cidade_peticionario: 'São Paulo',
          estado_peticionario: 'SP',
          cep_peticionario: '01234-567',
          profissao_peticionario: 'Engenheiro Civil',
          possui_procurador: true,
          nome_procurador: 'Dra. Maria Fernanda Costa',
          oab_procurador: 'SP 234.567',
          email_procurador: 'maria.costa@advocacia.com',
          telefone_procurador: '(11) 3333-4444',
          possui_parte_contraria: true,
          nome_parte_contraria: 'TecnoMax Eletrônicos Ltda',
          cpf_cnpj_parte_contraria: '12.345.678/0001-90',
          endereco_parte_contraria: 'Av. Comercial, 789, Centro',
          pedidos: [
            {
              id: 1,
              tipo: 'Principal',
              descricao: 'Condenação da requerida ao pagamento de indenização por danos materiais',
              fundamentacao: 'Produto apresentou defeito dentro do prazo de garantia',
              valor_causa: '5000.00',
              prazo_cumprimento: '30'
            },
            {
              id: 2,
              tipo: 'Subsidiário',
              descricao: 'Alternativamente, troca do produto por outro da mesma espécie',
              fundamentacao: 'Direito à substituição previsto no CDC',
              valor_causa: '3000.00',
              prazo_cumprimento: '15'
            }
          ],
          competencia: '1ª Vara Cível',
          prioridade: 'Alta',
          categoria_direito: 'Direito do Consumidor',
          subcategoria: 'Vícios do Produto',
          valor_da_causa: '5000.00',
          beneficiario_gratuidade: false,
          requer_liminar: true,
          requer_tutela_antecipada: false,
          forma_intimacao: 'Email',
          status: 'Protocolado'
        };
        setFormData(mockData);
      }
    } catch (error) {
      showNotification('Erro ao carregar dados do peticionamento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocuments = files.map(file => ({
      id: Date.now() + Math.random(),
      nome: file.name,
      arquivo: file,
      tamanho: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      tipo: file.type.includes('image') ? 'Imagem' : 
            file.type.includes('pdf') ? 'PDF' : 'Documento',
      categoria: 'Instrução'
    }));
    
    setFormData(prev => ({
      ...prev,
      documentos: [...prev.documentos, ...newDocuments]
    }));
  };

  const removeDocument = (docId) => {
    setFormData(prev => ({
      ...prev,
      documentos: prev.documentos.filter(doc => doc.id !== docId)
    }));
  };

  const addPedido = () => {
    const newPedido = {
      id: Date.now(),
      tipo: 'Subsidiário',
      descricao: '',
      fundamentacao: '',
      valor_causa: '',
      prazo_cumprimento: ''
    };
    setFormData(prev => ({
      ...prev,
      pedidos: [...prev.pedidos, newPedido]
    }));
  };

  const removePedido = (pedidoId) => {
    if (formData.pedidos.length > 1) {
      setFormData(prev => ({
        ...prev,
        pedidos: prev.pedidos.filter(p => p.id !== pedidoId)
      }));
    }
  };

  const updatePedido = (pedidoId, field, value) => {
    setFormData(prev => ({
      ...prev,
      pedidos: prev.pedidos.map(p => 
        p.id === pedidoId ? { ...p, [field]: value } : p
      )
    }));
  };

  const formatCpfCnpj = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const formatCep = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações obrigatórias
    if (!formData.nome_peticionario || !formData.cpf_cnpj_peticionario || 
        !formData.assunto || !formData.descricao || !formData.fundamentacao_legal) {
      showNotification('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    // Validar se há pelo menos um pedido com descrição
    const pedidosValidos = formData.pedidos.filter(p => p.descricao.trim() !== '');
    if (pedidosValidos.length === 0) {
      showNotification('Adicione pelo menos um pedido válido', 'error');
      return;
    }

    // Validar documentos obrigatórios se necessário
    if (formData.possui_procurador && !formData.documentos_obrigatorios.procuracao) {
      showNotification('Anexe a procuração quando há procurador constituído', 'error');
      return;
    }

    try {
      setSaving(true);
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const numeroPeticionamento = `PET-${Date.now()}`;
      showNotification(
        id ? 'Peticionamento atualizado com sucesso' : `Peticionamento protocolado com sucesso! Número: ${numeroPeticionamento}`, 
        'success'
      );
      navigate('/peticionamento');
    } catch (error) {
      showNotification('Erro ao salvar peticionamento', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/peticionamento')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {id ? 'Editar Peticionamento' : 'Novo Peticionamento'}
              </h1>
              <p className="text-gray-600">
                {id ? 'Edite os dados do peticionamento' : 'Crie uma nova petição jurídica'}
              </p>
            </div>
          </div>
          {formData.numero_processo && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Processo</p>
              <p className="text-lg font-bold text-indigo-600">{formData.numero_processo}</p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Dados Básicos do Peticionamento */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <ScaleIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Dados Básicos do Peticionamento
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Peticionamento *
              </label>
              <select
                name="tipo_peticionamento"
                value={formData.tipo_peticionamento}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Petição Inicial">Petição Inicial</option>
                <option value="Contestação">Contestação</option>
                <option value="Tréplica">Tréplica</option>
                <option value="Recurso">Recurso</option>
                <option value="Embargos de Declaração">Embargos de Declaração</option>
                <option value="Petição Intermediária">Petição Intermediária</option>
                <option value="Alegações Finais">Alegações Finais</option>
                <option value="Cumprimento de Sentença">Cumprimento de Sentença</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Apresentação
              </label>
              <input
                type="date"
                name="data_apresentacao"
                value={formData.data_apresentacao}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assunto da Petição *
              </label>
              <input
                type="text"
                name="assunto"
                value={formData.assunto}
                onChange={handleChange}
                required
                placeholder="Ex: Ação de Reparação de Danos - Produto com Defeito"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição dos Fatos *
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Descreva detalhadamente os fatos que fundamentam a petição..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fundamentação Legal *
              </label>
              <textarea
                name="fundamentacao_legal"
                value={formData.fundamentacao_legal}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Ex: Art. 6º, VI e VIII do Código de Defesa do Consumidor..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria do Direito
              </label>
              <select
                name="categoria_direito"
                value={formData.categoria_direito}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Selecione a categoria</option>
                <option value="Direito do Consumidor">Direito do Consumidor</option>
                <option value="Direito Civil">Direito Civil</option>
                <option value="Direito Empresarial">Direito Empresarial</option>
                <option value="Direito Administrativo">Direito Administrativo</option>
                <option value="Direito Tributário">Direito Tributário</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                name="prioridade"
                value={formData.prioridade}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Baixa">Baixa</option>
                <option value="Normal">Normal</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="urgente"
                  checked={formData.urgente}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mr-1" />
                  Peticionamento urgente
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="confidencial"
                  checked={formData.confidencial}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Petição confidencial/sigilosa</span>
              </label>
            </div>
          </div>
        </div>

        {/* Dados do Peticionário */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Dados do Peticionário
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Peticionário *
              </label>
              <select
                name="tipo_peticionario"
                value={formData.tipo_peticionario}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Pessoa Física">Pessoa Física</option>
                <option value="Pessoa Jurídica">Pessoa Jurídica</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.tipo_peticionario === 'Pessoa Física' ? 'Nome Completo' : 'Razão Social'} *
              </label>
              <input
                type="text"
                name="nome_peticionario"
                value={formData.nome_peticionario}
                onChange={handleChange}
                required
                placeholder={formData.tipo_peticionario === 'Pessoa Física' ? 'Digite o nome completo' : 'Digite a razão social'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.tipo_peticionario === 'Pessoa Física' ? 'CPF' : 'CNPJ'} *
              </label>
              <input
                type="text"
                name="cpf_cnpj_peticionario"
                value={formData.cpf_cnpj_peticionario}
                onChange={(e) => {
                  const formatted = formatCpfCnpj(e.target.value);
                  setFormData(prev => ({ ...prev, cpf_cnpj_peticionario: formatted }));
                }}
                required
                placeholder={formData.tipo_peticionario === 'Pessoa Física' ? '000.000.000-00' : '00.000.000/0000-00'}
                maxLength={formData.tipo_peticionario === 'Pessoa Física' ? 14 : 18}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email_peticionario"
                value={formData.email_peticionario}
                onChange={handleChange}
                required
                placeholder="email@exemplo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone *
              </label>
              <input
                type="text"
                name="telefone_peticionario"
                value={formData.telefone_peticionario}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  setFormData(prev => ({ ...prev, telefone_peticionario: formatted }));
                }}
                required
                placeholder="(11) 99999-9999"
                maxLength={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {formData.tipo_peticionario === 'Pessoa Física' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profissão
                </label>
                <input
                  type="text"
                  name="profissao_peticionario"
                  value={formData.profissao_peticionario}
                  onChange={handleChange}
                  placeholder="Ex: Engenheiro Civil"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CEP
              </label>
              <input
                type="text"
                name="cep_peticionario"
                value={formData.cep_peticionario}
                onChange={(e) => {
                  const formatted = formatCep(e.target.value);
                  setFormData(prev => ({ ...prev, cep_peticionario: formatted }));
                }}
                placeholder="00000-000"
                maxLength={9}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço Completo
              </label>
              <input
                type="text"
                name="endereco_peticionario"
                value={formData.endereco_peticionario}
                onChange={handleChange}
                placeholder="Rua, número, complemento"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                name="cidade_peticionario"
                value={formData.cidade_peticionario}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                name="estado_peticionario"
                value={formData.estado_peticionario}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Selecione</option>
                <option value="SP">São Paulo</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="MG">Minas Gerais</option>
                <option value="RS">Rio Grande do Sul</option>
                {/* Adicionar outros estados conforme necessário */}
              </select>
            </div>
          </div>
        </div>

        {/* Dados do Procurador */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Dados do Procurador
            </h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="possui_procurador"
                checked={formData.possui_procurador}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Possui procurador constituído</span>
            </label>
          </div>
          
          {formData.possui_procurador && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Procurador
                </label>
                <input
                  type="text"
                  name="nome_procurador"
                  value={formData.nome_procurador}
                  onChange={handleChange}
                  placeholder="Nome completo do advogado"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OAB
                </label>
                <input
                  type="text"
                  name="oab_procurador"
                  value={formData.oab_procurador}
                  onChange={handleChange}
                  placeholder="Ex: SP 123.456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email do Procurador
                </label>
                <input
                  type="email"
                  name="email_procurador"
                  value={formData.email_procurador}
                  onChange={handleChange}
                  placeholder="advogado@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone do Procurador
                </label>
                <input
                  type="text"
                  name="telefone_procurador"
                  value={formData.telefone_procurador}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setFormData(prev => ({ ...prev, telefone_procurador: formatted }));
                  }}
                  placeholder="(11) 3333-4444"
                  maxLength={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Parte Contrária */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Parte Contrária</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="possui_parte_contraria"
                checked={formData.possui_parte_contraria}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Há parte contrária/requerida</span>
            </label>
          </div>
          
          {formData.possui_parte_contraria && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome/Razão Social
                </label>
                <input
                  type="text"
                  name="nome_parte_contraria"
                  value={formData.nome_parte_contraria}
                  onChange={handleChange}
                  placeholder="Nome ou razão social da parte contrária"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  name="cpf_cnpj_parte_contraria"
                  value={formData.cpf_cnpj_parte_contraria}
                  onChange={(e) => {
                    const formatted = formatCpfCnpj(e.target.value);
                    setFormData(prev => ({ ...prev, cpf_cnpj_parte_contraria: formatted }));
                  }}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  name="endereco_parte_contraria"
                  value={formData.endereco_parte_contraria}
                  onChange={handleChange}
                  placeholder="Endereço completo da parte contrária"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pedidos */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Pedidos
            </h3>
            <button
              type="button"
              onClick={addPedido}
              className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Adicionar Pedido
            </button>
          </div>

          <div className="space-y-6">
            {formData.pedidos.map((pedido, index) => (
              <div key={pedido.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Pedido #{index + 1}</span>
                  <div className="flex items-center space-x-2">
                    <select
                      value={pedido.tipo}
                      onChange={(e) => updatePedido(pedido.id, 'tipo', e.target.value)}
                      className="text-sm px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="Principal">Principal</option>
                      <option value="Subsidiário">Subsidiário</option>
                      <option value="Alternativo">Alternativo</option>
                      <option value="Cautelar">Cautelar</option>
                    </select>
                    {formData.pedidos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePedido(pedido.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Pedido</label>
                    <textarea
                      value={pedido.descricao}
                      onChange={(e) => updatePedido(pedido.id, 'descricao', e.target.value)}
                      rows={3}
                      placeholder="Descreva claramente o que está sendo pedido..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fundamentação</label>
                    <textarea
                      value={pedido.fundamentacao}
                      onChange={(e) => updatePedido(pedido.id, 'fundamentacao', e.target.value)}
                      rows={2}
                      placeholder="Fundamente juridicamente este pedido..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Causa (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pedido.valor_causa}
                      onChange={(e) => updatePedido(pedido.id, 'valor_causa', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo para Cumprimento (dias)</label>
                    <input
                      type="number"
                      value={pedido.prazo_cumprimento}
                      onChange={(e) => updatePedido(pedido.id, 'prazo_cumprimento', e.target.value)}
                      placeholder="Ex: 30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documentos */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <DocumentArrowUpIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Documentos de Instrução
          </h3>
          
          <div className="space-y-6">
            {/* Check-list de documentos obrigatórios */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Documentos Obrigatórios</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.documentos_obrigatorios.identidade}
                    onChange={(e) => handleNestedChange('documentos_obrigatorios', 'identidade', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Documento de Identidade</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.documentos_obrigatorios.comprovante_residencia}
                    onChange={(e) => handleNestedChange('documentos_obrigatorios', 'comprovante_residencia', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Comprovante de Residência</span>
                </label>

                {formData.possui_procurador && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.documentos_obrigatorios.procuracao}
                      onChange={(e) => handleNestedChange('documentos_obrigatorios', 'procuracao', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Procuração</span>
                  </label>
                )}

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.documentos_obrigatorios.documentos_comprobatorios}
                    onChange={(e) => handleNestedChange('documentos_obrigatorios', 'documentos_comprobatorios', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Documentos Comprobatórios dos Fatos</span>
                </label>
              </div>
            </div>

            {/* Upload de documentos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anexar Documentos
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG. Tamanho máximo: 10MB por arquivo.
              </p>
            </div>
            
            {formData.documentos.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Documentos Anexados:</h4>
                <div className="space-y-2">
                  {formData.documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {doc.tipo}
                        </span>
                        <span className="text-sm text-gray-700">{doc.nome}</span>
                        <span className="text-xs text-gray-500">({doc.tamanho})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informações Complementares */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Informações Complementares</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor da Causa (R$)
              </label>
              <input
                type="number"
                step="0.01"
                name="valor_da_causa"
                value={formData.valor_da_causa}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de Intimação Preferida
              </label>
              <select
                name="forma_intimacao"
                value={formData.forma_intimacao}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Email">Email</option>
                <option value="Correio">Correio</option>
                <option value="Diário Oficial">Diário Oficial</option>
                <option value="Portal do Advogado">Portal do Advogado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competência/Vara
              </label>
              <input
                type="text"
                name="competencia"
                value={formData.competencia}
                onChange={handleChange}
                placeholder="Ex: 1ª Vara Cível"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Protocolo Relacionado
              </label>
              <input
                type="text"
                name="protocolo_relacionado"
                value={formData.protocolo_relacionado}
                onChange={handleChange}
                placeholder="Ex: PROT-2024-001234"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações do Peticionário
              </label>
              <textarea
                name="observacoes_peticionario"
                value={formData.observacoes_peticionario}
                onChange={handleChange}
                rows={4}
                placeholder="Observações ou informações adicionais..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="beneficiario_gratuidade"
                  checked={formData.beneficiario_gratuidade}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Beneficiário da justiça gratuita</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requer_liminar"
                  checked={formData.requer_liminar}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Requer concessão de liminar</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requer_tutela_antecipada"
                  checked={formData.requer_tutela_antecipada}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Requer tutela antecipada</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="autoriza_publicacao"
                  checked={formData.autoriza_publicacao}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Autoriza publicação para fins acadêmicos</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requer_vista_autos"
                  checked={formData.requer_vista_autos}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Requer vista dos autos</span>
              </label>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigate('/peticionamento')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              id ? 'Atualizar' : 'Protocolar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PeticionamentoForm;