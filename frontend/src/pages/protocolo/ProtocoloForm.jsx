import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useNotifications } from '../../context/NotificationContext';

const ProtocoloForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error: showNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // Dados do Requerente
    tipo_requerente: 'Pessoa Física',
    nome_requerente: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    representante_legal: '',
    
    // Dados do Protocolo
    tipo_solicitacao: 'Reclamação',
    assunto: '',
    descricao: '',
    urgente: false,
    prioridade: 'Normal',
    canal_entrada: 'Presencial',
    data_protocolo: new Date().toISOString().split('T')[0],
    prazo_resposta: '',
    
    // Empresa/Fornecedor (se aplicável)
    possui_fornecedor: false,
    nome_fornecedor: '',
    cnpj_fornecedor: '',
    endereco_fornecedor: '',
    telefone_fornecedor: '',
    email_fornecedor: '',
    
    // Dados da Reclamação/Solicitação
    valor_envolvido: '',
    data_ocorrencia: '',
    local_ocorrencia: '',
    produto_servico: '',
    categoria: '',
    subcategoria: '',
    
    // Documentos e Anexos
    documentos: [],
    
    // Observações
    observacoes: '',
    observacoes_internas: '',
    
    // Status e Tramitação
    status: 'Protocolado',
    departamento_destino: '',
    responsavel_analise: '',
    
    // Dados Adicionais
    forma_contato_preferida: 'Email',
    autoriza_divulgacao: false,
    solicita_anonimato: false,
    possui_procuracao: false
  });

  useEffect(() => {
    if (id) {
      fetchProtocolo();
    }
    // Calcular prazo de resposta padrão (30 dias úteis)
    if (!id && !formData.prazo_resposta) {
      const dataProtocolo = new Date(formData.data_protocolo);
      const prazoResposta = new Date(dataProtocolo);
      prazoResposta.setDate(prazoResposta.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        prazo_resposta: prazoResposta.toISOString().split('T')[0]
      }));
    }
  }, [id, formData.data_protocolo]);

  const fetchProtocolo = async () => {
    try {
      setLoading(true);
      // Simular carregamento de dados
      if (id) {
        const mockData = {
          tipo_requerente: 'Pessoa Física',
          nome_requerente: 'Maria Silva Santos',
          cpf_cnpj: '123.456.789-00',
          email: 'maria.santos@email.com',
          telefone: '(11) 98765-4321',
          endereco: 'Rua das Flores, 123, Apto 45',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          tipo_solicitacao: 'Reclamação',
          assunto: 'Produto com defeito não trocado',
          descricao: 'Comprei um smartphone que apresentou defeito após 15 dias de uso. A loja se recusa a fazer a troca.',
          urgente: false,
          prioridade: 'Alta',
          canal_entrada: 'Online',
          data_protocolo: '2024-03-15',
          prazo_resposta: '2024-04-15',
          possui_fornecedor: true,
          nome_fornecedor: 'Loja TecnoMundo Ltda',
          cnpj_fornecedor: '12.345.678/0001-90',
          endereco_fornecedor: 'Av. Principal, 456',
          telefone_fornecedor: '(11) 3333-4444',
          email_fornecedor: 'contato@tecnomundo.com.br',
          valor_envolvido: '1500.00',
          data_ocorrencia: '2024-03-01',
          local_ocorrencia: 'Loja física - Shopping Center Norte',
          produto_servico: 'Smartphone Samsung Galaxy',
          categoria: 'Produtos',
          subcategoria: 'Eletrônicos',
          observacoes: 'Cliente possui nota fiscal e garantia válida',
          status: 'Em Análise',
          departamento_destino: 'Fiscal de Produtos',
          forma_contato_preferida: 'Email',
          autoriza_divulgacao: false,
          solicita_anonimato: false
        };
        setFormData(mockData);
      }
    } catch (error) {
      showNotification('Erro ao carregar dados do protocolo', 'error');
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

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocuments = files.map(file => ({
      id: Date.now() + Math.random(),
      nome: file.name,
      arquivo: file,
      tamanho: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      tipo: file.type.includes('image') ? 'Imagem' : file.type.includes('pdf') ? 'PDF' : 'Documento'
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

  const handleCepBlur = async (cep) => {
    if (cep.length === 9) {
      try {
        // Simular busca de CEP
        const mockCepData = {
          cidade: 'São Paulo',
          estado: 'SP'
        };
        setFormData(prev => ({
          ...prev,
          cidade: mockCepData.cidade,
          estado: mockCepData.estado
        }));
      } catch (error) {
        showNotification('Erro ao buscar CEP', 'error');
      }
    }
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
    if (!formData.nome_requerente || !formData.cpf_cnpj || !formData.assunto || !formData.descricao) {
      showNotification('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    // Validar CPF/CNPJ básico
    const cpfCnpj = formData.cpf_cnpj.replace(/\D/g, '');
    if (formData.tipo_requerente === 'Pessoa Física' && cpfCnpj.length !== 11) {
      showNotification('CPF deve ter 11 dígitos', 'error');
      return;
    }
    if (formData.tipo_requerente === 'Pessoa Jurídica' && cpfCnpj.length !== 14) {
      showNotification('CNPJ deve ter 14 dígitos', 'error');
      return;
    }

    try {
      setSaving(true);
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const numeroProtocolo = `PROT-${Date.now()}`;
      showNotification(
        id ? 'Protocolo atualizado com sucesso' : `Protocolo criado com sucesso! Número: ${numeroProtocolo}`, 
        'success'
      );
      navigate('/protocolo');
    } catch (error) {
      showNotification('Erro ao salvar protocolo');
    } finally {
      setSaving(false);
    }
  };

  const gerarNumeroProtocolo = () => {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hora = String(agora.getHours()).padStart(2, '0');
    const min = String(agora.getMinutes()).padStart(2, '0');
    return `${ano}${mes}${dia}${hora}${min}`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/protocolo')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {id ? 'Editar Protocolo' : 'Novo Protocolo'}
              </h1>
              <p className="text-gray-600">
                {id ? 'Edite os dados do protocolo' : 'Registre uma nova solicitação'}
              </p>
            </div>
          </div>
          {!id && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Número do Protocolo</p>
              <p className="text-lg font-bold text-indigo-600">{gerarNumeroProtocolo()}</p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Dados do Requerente */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Dados do Requerente
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Requerente *
              </label>
              <select
                name="tipo_requerente"
                value={formData.tipo_requerente}
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
                {formData.tipo_requerente === 'Pessoa Física' ? 'Nome Completo' : 'Razão Social'} *
              </label>
              <input
                type="text"
                name="nome_requerente"
                value={formData.nome_requerente}
                onChange={handleChange}
                required
                placeholder={formData.tipo_requerente === 'Pessoa Física' ? 'Digite o nome completo' : 'Digite a razão social'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.tipo_requerente === 'Pessoa Física' ? 'CPF' : 'CNPJ'} *
              </label>
              <input
                type="text"
                name="cpf_cnpj"
                value={formData.cpf_cnpj}
                onChange={(e) => {
                  const formatted = formatCpfCnpj(e.target.value);
                  setFormData(prev => ({ ...prev, cpf_cnpj: formatted }));
                }}
                required
                placeholder={formData.tipo_requerente === 'Pessoa Física' ? '000.000.000-00' : '00.000.000/0000-00'}
                maxLength={formData.tipo_requerente === 'Pessoa Física' ? 14 : 18}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
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
                name="telefone"
                value={formData.telefone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  setFormData(prev => ({ ...prev, telefone: formatted }));
                }}
                required
                placeholder="(11) 99999-9999"
                maxLength={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CEP
              </label>
              <input
                type="text"
                name="cep"
                value={formData.cep}
                onChange={(e) => {
                  const formatted = formatCep(e.target.value);
                  setFormData(prev => ({ ...prev, cep: formatted }));
                }}
                onBlur={(e) => handleCepBlur(e.target.value)}
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
                name="endereco"
                value={formData.endereco}
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
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                name="estado"
                value={formData.estado}
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

            {formData.tipo_requerente === 'Pessoa Jurídica' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Representante Legal
                </label>
                <input
                  type="text"
                  name="representante_legal"
                  value={formData.representante_legal}
                  onChange={handleChange}
                  placeholder="Nome do representante legal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Dados do Protocolo */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Dados da Solicitação
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Solicitação *
              </label>
              <select
                name="tipo_solicitacao"
                value={formData.tipo_solicitacao}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Reclamação">Reclamação</option>
                <option value="Denúncia">Denúncia</option>
                <option value="Consulta">Consulta</option>
                <option value="Sugestão">Sugestão</option>
                <option value="Elogio">Elogio</option>
                <option value="Solicitação de Informação">Solicitação de Informação</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Canal de Entrada
              </label>
              <select
                name="canal_entrada"
                value={formData.canal_entrada}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Presencial">Presencial</option>
                <option value="Online">Online/Site</option>
                <option value="Telefone">Telefone</option>
                <option value="Email">Email</option>
                <option value="Aplicativo">Aplicativo Mobile</option>
                <option value="Carta">Carta/Correio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data do Protocolo
              </label>
              <input
                type="date"
                name="data_protocolo"
                value={formData.data_protocolo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo para Resposta
              </label>
              <input
                type="date"
                name="prazo_resposta"
                value={formData.prazo_resposta}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assunto *
              </label>
              <input
                type="text"
                name="assunto"
                value={formData.assunto}
                onChange={handleChange}
                required
                placeholder="Resuma o problema ou solicitação em poucas palavras"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição Detalhada *
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Descreva detalhadamente a situação, incluindo datas, valores, produtos/serviços envolvidos..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
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

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="urgente"
                  checked={formData.urgente}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  <ExclamationTriangleIcon className="h-4 w-4 inline text-orange-500 mr-1" />
                  Solicitação urgente
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Dados do Fornecedor/Empresa */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Dados do Fornecedor/Empresa
            </h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="possui_fornecedor"
                checked={formData.possui_fornecedor}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Há empresa/fornecedor envolvido</span>
            </label>
          </div>
          
          {formData.possui_fornecedor && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Empresa/Fornecedor
                </label>
                <input
                  type="text"
                  name="nome_fornecedor"
                  value={formData.nome_fornecedor}
                  onChange={handleChange}
                  placeholder="Razão social ou nome fantasia"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  name="cnpj_fornecedor"
                  value={formData.cnpj_fornecedor}
                  onChange={(e) => {
                    const formatted = formatCpfCnpj(e.target.value);
                    setFormData(prev => ({ ...prev, cnpj_fornecedor: formatted }));
                  }}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço da Empresa
                </label>
                <input
                  type="text"
                  name="endereco_fornecedor"
                  value={formData.endereco_fornecedor}
                  onChange={handleChange}
                  placeholder="Endereço completo da empresa"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone da Empresa
                </label>
                <input
                  type="text"
                  name="telefone_fornecedor"
                  value={formData.telefone_fornecedor}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setFormData(prev => ({ ...prev, telefone_fornecedor: formatted }));
                  }}
                  placeholder="(11) 3333-4444"
                  maxLength={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email da Empresa
                </label>
                <input
                  type="email"
                  name="email_fornecedor"
                  value={formData.email_fornecedor}
                  onChange={handleChange}
                  placeholder="contato@empresa.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Detalhes da Ocorrência */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Detalhes da Ocorrência
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Ocorrência
              </label>
              <input
                type="date"
                name="data_ocorrencia"
                value={formData.data_ocorrencia}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Envolvido (R$)
              </label>
              <input
                type="number"
                step="0.01"
                name="valor_envolvido"
                value={formData.valor_envolvido}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local da Ocorrência
              </label>
              <input
                type="text"
                name="local_ocorrencia"
                value={formData.local_ocorrencia}
                onChange={handleChange}
                placeholder="Onde ocorreu o problema"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produto/Serviço
              </label>
              <input
                type="text"
                name="produto_servico"
                value={formData.produto_servico}
                onChange={handleChange}
                placeholder="Descreva o produto ou serviço"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Selecione uma categoria</option>
                <option value="Produtos">Produtos</option>
                <option value="Serviços">Serviços</option>
                <option value="Telecomunicações">Telecomunicações</option>
                <option value="Bancos e Financeiras">Bancos e Financeiras</option>
                <option value="Planos de Saúde">Planos de Saúde</option>
                <option value="Educação">Educação</option>
                <option value="Transporte">Transporte</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documentos */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <DocumentArrowUpIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Documentos Comprobatórios
          </h3>
          
          <div className="space-y-4">
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

        {/* Configurações e Observações */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Configurações e Observações</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de Contato Preferida
              </label>
              <select
                name="forma_contato_preferida"
                value={formData.forma_contato_preferida}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Email">Email</option>
                <option value="Telefone">Telefone</option>
                <option value="SMS">SMS</option>
                <option value="Correspondência">Correspondência</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações Adicionais
              </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={4}
                placeholder="Informações adicionais que julgar relevantes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações Internas (uso interno)
                </label>
                <textarea
                  name="observacoes_internas"
                  value={formData.observacoes_internas}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Observações para uso interno..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="autoriza_divulgacao"
                  checked={formData.autoriza_divulgacao}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Autorizo a divulgação desta reclamação para fins estatísticos
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="solicita_anonimato"
                  checked={formData.solicita_anonimato}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Solicito anonimato na tramitação
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="possui_procuracao"
                  checked={formData.possui_procuracao}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Possui procuração para representação
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigate('/protocolo')}
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

export default ProtocoloForm;