import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { tiService } from '../../services/tiService';
import { cpfMask, phoneMask, formatMatricula, validateCPF, validatePassword } from '../../utils/validators';

const TIDashboard = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [permissoes, setPermissoes] = useState([]);
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSetor, setFilterSetor] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [capturadoresAtivos, setCapturadoresAtivos] = useState(false);
  const [capturadoresLoading, setCapturadoresLoading] = useState(false);
  const [capturadoresErro, setCapturadoresErro] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    matricula: '',
    cargo: '',
    departamento: '',
    setor: '',
    role: 'usuario',
    status: 'ativo',
    senha: '',
    confirmarSenha: '',
    permissoesModulos: {}
  });

  useEffect(() => {
    loadData();
  }, []);

  const parseBool = (value) => {
    if (value === true || value === 1) return true;
    const texto = String(value ?? '').trim().toLowerCase();
    return ['true', '1', 'yes', 'sim', 'on', 'ativo'].includes(texto);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar dados reais da API
      const [usuariosData, modulosData, cargosData, setoresData, capturadoresConfig] = await Promise.all([
        tiService.listarUsuarios(),
        tiService.listarModulos(),
        tiService.listarCargos(),
        tiService.listarSetores(),
        tiService.obterConfiguracao('triagem_capturadores_ativos').catch(() => null)
      ]);
      
      setUsuarios(usuariosData);
      setModulos(modulosData);
      setPermissoes(cargosData);
      setSetores(setoresData || []);
      if (capturadoresConfig) {
        setCapturadoresAtivos(parseBool(capturadoresConfig.valor));
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Fallback para dados mockados em caso de erro
      const usuariosSimulados = [
        {
          id: 1,
          nome: 'João Silva',
          email: 'joao.silva@procon.am.gov.br',
          telefone: '(92) 99999-9999',
          cpf: '12345678901',
          matricula: 'TI001',
          cargo: 'Analista de TI',
          departamento: 'Tecnologia da Informação',
          role: 'admin',
          status: 'ativo',
          dataCriacao: '2024-01-15',
          ultimoAcesso: '2024-01-20 14:30',
          permissoesModulos: {
            dashboard: { visualizar: true, editar: true, excluir: true },
            fiscalizacao: { visualizar: true, editar: true, excluir: false },
            atendimento: { visualizar: true, editar: false, excluir: false },
            'portal-empresa': { visualizar: true, editar: true, excluir: true },
            'portal-consumidor': { visualizar: true, editar: true, excluir: true },
            cobranca: { visualizar: true, editar: true, excluir: false },
            juridico: { visualizar: true, editar: false, excluir: false },
            relatorios: { visualizar: true, editar: true, excluir: false },
            auditoria: { visualizar: true, editar: false, excluir: false },
            configuracoes: { visualizar: true, editar: true, excluir: true }
          }
        },
        {
          id: 2,
          nome: 'Maria Santos',
          email: 'maria.santos@procon.am.gov.br',
          telefone: '(92) 88888-8888',
          cpf: '98765432100',
          matricula: 'FIS001',
          cargo: 'Fiscal',
          departamento: 'Fiscalização',
          role: 'fiscal',
          status: 'ativo',
          dataCriacao: '2024-01-10',
          ultimoAcesso: '2024-01-20 16:45',
          permissoesModulos: {
            dashboard: { visualizar: true, editar: false, excluir: false },
            fiscalizacao: { visualizar: true, editar: true, excluir: false },
            atendimento: { visualizar: false, editar: false, excluir: false },
            'portal-empresa': { visualizar: false, editar: false, excluir: false },
            'portal-consumidor': { visualizar: true, editar: false, excluir: false },
            cobranca: { visualizar: false, editar: false, excluir: false },
            juridico: { visualizar: false, editar: false, excluir: false },
            relatorios: { visualizar: false, editar: false, excluir: false },
            auditoria: { visualizar: false, editar: false, excluir: false },
            configuracoes: { visualizar: false, editar: false, excluir: false }
          }
        },
        {
          id: 3,
          nome: 'Carlos Oliveira',
          email: 'carlos.oliveira@procon.am.gov.br',
          telefone: '(92) 77777-7777',
          cpf: '11122233344',
          matricula: 'ATD001',
          cargo: 'Atendente',
          departamento: 'Atendimento',
          role: 'atendente',
          status: 'ativo',
          dataCriacao: '2024-01-05',
          ultimoAcesso: '2024-01-20 17:20',
          permissoesModulos: {
            dashboard: { visualizar: true, editar: false, excluir: false },
            fiscalizacao: { visualizar: false, editar: false, excluir: false },
            atendimento: { visualizar: true, editar: true, excluir: false },
            'portal-empresa': { visualizar: false, editar: false, excluir: false },
            'portal-consumidor': { visualizar: true, editar: false, excluir: false },
            cobranca: { visualizar: false, editar: false, excluir: false },
            juridico: { visualizar: false, editar: false, excluir: false },
            relatorios: { visualizar: false, editar: false, excluir: false },
            auditoria: { visualizar: false, editar: false, excluir: false },
            configuracoes: { visualizar: false, editar: false, excluir: false }
          }
        }
      ];

      const modulosSistema = [
        { id: 1, nome: 'Dashboard', descricao: 'Painel principal', icone: 'fa-chart-bar', ativo: true },
        { id: 2, nome: 'Fiscalização', descricao: 'Módulo de fiscalização', icone: 'fa-search', ativo: true },
        { id: 3, nome: 'Atendimento', descricao: 'Sistema de atendimento', icone: 'fa-headset', ativo: true },
        { id: 4, nome: 'Portal Empresa', descricao: 'Portal para empresas', icone: 'fa-building', ativo: true },
        { id: 5, nome: 'Portal Consumidor', descricao: 'Portal para consumidores', icone: 'fa-user', ativo: true },
        { id: 6, nome: 'Cobrança', descricao: 'Módulo de cobrança', icone: 'fa-dollar-sign', ativo: true },
        { id: 7, nome: 'Jurídico', descricao: 'Módulo jurídico', icone: 'fa-balance-scale', ativo: true },
        { id: 8, nome: 'Relatórios', descricao: 'Relatórios e estatísticas', icone: 'fa-chart-pie', ativo: true },
        { id: 9, nome: 'Auditoria', descricao: 'Logs e auditoria', icone: 'fa-shield-alt', ativo: true },
        { id: 10, nome: 'Configurações', descricao: 'Configurações gerais', icone: 'fa-cogs', ativo: true }
      ];

      setUsuarios(usuariosSimulados);
      setModulos(modulosSistema);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCapturadores = async () => {
    setCapturadoresLoading(true);
    setCapturadoresErro('');
    try {
      const novoValor = !capturadoresAtivos;
      const payload = { valor: novoValor };
      const atualizado = await tiService.atualizarConfiguracao('triagem_capturadores_ativos', payload);
      setCapturadoresAtivos(parseBool(atualizado.valor));
    } catch (error) {
      console.error('Erro ao atualizar capturadores:', error);
      setCapturadoresErro('Nao foi possivel atualizar o toggle.');
    } finally {
      setCapturadoresLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!formData.cpf && !formData.matricula) {
      alert('CPF ou Matrícula é obrigatório!');
      return;
    }
    
    if (formData.cpf && !validateCPF(formData.cpf)) {
      alert('CPF inválido!');
      return;
    }
    
    if (formData.senha && formData.senha !== formData.confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }
    
    const passwordValidation = validatePassword(formData.senha);
    if (formData.senha && !passwordValidation.isValid) {
      alert('Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial!');
      return;
    }

    try {
      const usuarioData = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        cpf: formData.cpf,
        matricula: formData.matricula,
        cargo: formData.cargo,
        departamento: formData.departamento,
        setor: formData.setor || formData.departamento,
        role: formData.role,
        status: formData.status,
        senha: formData.senha,
        permissoesModulos: formData.permissoesModulos
      };
      
      if (editingUser) {
        await tiService.atualizarUsuario(editingUser.id, usuarioData);
      } else {
        await tiService.criarUsuario(usuarioData);
      }
      
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        matricula: '',
        cargo: '',
        departamento: '',
        setor: '',
        role: 'usuario',
        status: 'ativo',
        senha: '',
        confirmarSenha: '',
        permissoesModulos: {}
      });
  };

    const editUsuario = (usuario) => {
      setFormData({
        nome: usuario.nome || '',
        email: usuario.email || '',
        telefone: usuario.telefone || '',
        cpf: usuario.cpf || '',
        matricula: usuario.matricula || '',
        cargo: usuario.cargo || '',
        departamento: usuario.departamento || '',
        setor: usuario.setor || usuario.departamento || '',
        role: usuario.role || 'usuario',
        status: usuario.status || 'ativo',
        senha: '',
        confirmarSenha: '',
        permissoesModulos: usuario.permissoesModulos || {}
      });
    setEditingUser(usuario);
    setShowModal(true);
  };

  const aplicarPermissoesPorRole = (role) => {
    const permissoesPorRole = {
      admin: {
        dashboard: { visualizar: true, criar: true, editar: true, excluir: true, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        fiscalizacao: { visualizar: true, criar: true, editar: true, excluir: true, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        atendimento: { visualizar: true, criar: true, editar: true, excluir: true, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        'portal-empresa': { visualizar: true, criar: true, editar: true, excluir: true, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        'portal-consumidor': { visualizar: true, criar: true, editar: true, excluir: true, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        processos: { visualizar: true, criar: true, editar: true, excluir: true, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        cobranca: { visualizar: true, criar: true, editar: true, excluir: true, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        juridico: { visualizar: true, criar: true, editar: true, excluir: true, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        relatorios: { visualizar: true, criar: true, editar: true, excluir: true, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        auditoria: { visualizar: true, criar: true, editar: true, excluir: true, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        configuracoes: { visualizar: true, criar: true, editar: true, excluir: true, aprovar: true, rejeitar: true, exportar: true, imprimir: true }
      },
      coordenador: {
        dashboard: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        fiscalizacao: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        atendimento: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        'portal-empresa': { visualizar: true, criar: false, editar: false, excluir: false, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        'portal-consumidor': { visualizar: true, criar: false, editar: false, excluir: false, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        processos: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        cobranca: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        juridico: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        relatorios: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: true, rejeitar: true, exportar: true, imprimir: true },
        auditoria: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        configuracoes: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false }
      },
      fiscal: {
        dashboard: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        fiscalizacao: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        atendimento: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        'portal-empresa': { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        'portal-consumidor': { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        processos: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        cobranca: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        juridico: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        relatorios: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        auditoria: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        configuracoes: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false }
      },
      atendente: {
        dashboard: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        fiscalizacao: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        atendimento: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        'portal-empresa': { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        'portal-consumidor': { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        processos: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        cobranca: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        juridico: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        relatorios: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        auditoria: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        configuracoes: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false }
      },
      analista: {
        dashboard: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        fiscalizacao: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        atendimento: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        'portal-empresa': { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        'portal-consumidor': { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        processos: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        cobranca: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        juridico: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        relatorios: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        auditoria: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: true, imprimir: true },
        configuracoes: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false }
      },
      usuario: {
        dashboard: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        fiscalizacao: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        atendimento: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        'portal-empresa': { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        'portal-consumidor': { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        processos: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        cobranca: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        juridico: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        relatorios: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        auditoria: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false },
        configuracoes: { visualizar: false, criar: false, editar: false, excluir: false, aprovar: false, rejeitar: false, exportar: false, imprimir: false }
      }
    };

    return permissoesPorRole[role] || permissoesPorRole.usuario;
  };

  const deleteUsuario = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await tiService.excluirUsuario(id);
        loadData();
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      coordenador: 'bg-purple-100 text-purple-800',
      fiscal: 'bg-blue-100 text-blue-800',
      atendente: 'bg-green-100 text-green-800',
      analista: 'bg-yellow-100 text-yellow-800',
      usuario: 'bg-gray-100 text-gray-800'
    };
    return badges[role] || badges.usuario;
  };

  const getStatusBadge = (status) => {
    return status === 'ativo' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const filteredUsuarios = usuarios.filter((usuario) => {
    const termo = searchTerm.trim().toLowerCase();
    const matchTermo =
      !termo ||
      (usuario.nome || '').toLowerCase().includes(termo) ||
      (usuario.email || '').toLowerCase().includes(termo) ||
      (usuario.cpf || '').toLowerCase().includes(termo) ||
      (usuario.matricula || '').toLowerCase().includes(termo);

    const matchSetor = !filterSetor || (usuario.setor || usuario.departamento || '') === filterSetor;
    const matchRole = !filterRole || (usuario.role || '') === filterRole;
    const matchStatus = !filterStatus || (usuario.status || '') === filterStatus;

    return matchTermo && matchSetor && matchRole && matchStatus;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Painel de TI</h1>
        <p className="text-gray-600">Gerencie usuários, permissões e configurações do sistema</p>
      </div>

      {/* Estatísticas */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Capturadores de Demanda</h3>
            <p className="text-sm text-gray-600">Ativa as entradas por email, telefone e presencial.</p>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                capturadoresAtivos ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {capturadoresAtivos ? 'Ativo' : 'Stand by'}
            </span>
            <button
              type="button"
              onClick={handleToggleCapturadores}
              disabled={capturadoresLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                capturadoresAtivos
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${capturadoresLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {capturadoresLoading ? 'Salvando...' : capturadoresAtivos ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        </div>
        {capturadoresErro && (
          <p className="text-sm text-red-600 mt-2">{capturadoresErro}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="fa fa-users text-blue-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="fa fa-check-circle text-green-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold text-gray-900">
                {usuarios.filter(u => u.status === 'ativo').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="fa fa-cubes text-purple-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Módulos</p>
              <p className="text-2xl font-bold text-gray-900">{modulos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="fa fa-shield-alt text-yellow-600"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Permissões</p>
              <p className="text-2xl font-bold text-gray-900">{permissoes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Adicionar Usuário */}
      <div className="mb-6">
        <button
          onClick={() => {
            resetForm();
            setEditingUser(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Adicionar Usuário
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Usuários do Sistema</h3>
        </div>

        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, email, CPF ou matrícula"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Setor</label>
              <select
                value={filterSetor}
                onChange={(e) => setFilterSetor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {setores.map((setor) => (
                  <option key={setor.id} value={setor.nome}>
                    {setor.sigla ? `${setor.sigla} - ${setor.nome}` : setor.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="usuario">Usuário</option>
                <option value="atendente">Atendente</option>
                <option value="fiscal">Fiscal</option>
                <option value="analista">Analista</option>
                <option value="coordenador">Coordenador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <i className="fa fa-spinner fa-spin text-2xl text-gray-400"></i>
            <p className="mt-2 text-gray-600">Carregando usuários...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPF/Matrícula
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Setor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Acesso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <i className="fa fa-user text-gray-600"></i>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {usuario.nome}
                          </div>
                          <div className="text-sm text-gray-500">
                            {usuario.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usuario.cpf || usuario.matricula}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usuario.cargo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usuario.setor || usuario.departamento || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(usuario.role)}`}>
                        {usuario.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(usuario.status)}`}>
                        {usuario.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {usuario.ultimoAcesso}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editUsuario(usuario)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar usuário"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteUsuario(usuario.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir usuário"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Adicionar/Editar Usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: phoneMask(e.target.value)})}
                      placeholder="(92) 99999-9999"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CPF (Login) *
                    </label>
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => setFormData({...formData, cpf: cpfMask(e.target.value)})}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {formData.cpf && !validateCPF(formData.cpf) && (
                      <p className="text-red-500 text-xs mt-1">CPF inválido</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matrícula (Alternativa ao CPF)
                    </label>
                    <input
                      type="text"
                      value={formData.matricula}
                      onChange={(e) => setFormData({...formData, matricula: formatMatricula(e.target.value)})}
                      placeholder="12345"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={formData.cargo}
                      onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Setor
                      </label>
                      <select
                        value={formData.setor}
                        onChange={(e) => setFormData({ ...formData, setor: e.target.value, departamento: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione o setor</option>
                        {setores.map((setor) => (
                          <option key={setor.id} value={setor.nome}>
                            {setor.sigla ? `${setor.sigla} - ${setor.nome}` : setor.nome}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        O setor define as permissões e a caixa de entrada do usuário.
                      </p>
                    </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={formData.role}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setFormData({...formData, role: newRole});
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="usuario">Usuário</option>
                        <option value="atendente">Atendente</option>
                        <option value="fiscal">Fiscal</option>
                        <option value="analista">Analista</option>
                        <option value="coordenador">Coordenador</option>
                        <option value="admin">Administrador</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const permissoesPadrao = aplicarPermissoesPorRole(formData.role);
                          setFormData({...formData, permissoesModulos: permissoesPadrao});
                        }}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200 text-sm"
                        title="Aplicar permissões padrão para este role"
                      >
                        <i className="fa fa-magic"></i>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha {editingUser ? '(deixe em branco para manter a atual)' : '*'}
                    </label>
                    <input
                      type="password"
                      value={formData.senha}
                      onChange={(e) => setFormData({...formData, senha: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!editingUser}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Senha {editingUser ? '(deixe em branco para manter a atual)' : '*'}
                    </label>
                    <input
                      type="password"
                      value={formData.confirmarSenha}
                      onChange={(e) => setFormData({...formData, confirmarSenha: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!editingUser}
                    />
                  </div>
                </div>

                {/* Seção de Permissões por Módulo */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Permissões por Módulo</h4>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const todasPermissoes = {};
                          modulos.forEach(modulo => {
                            const moduloKey = modulo.nome.toLowerCase().replace(' ', '-');
                            todasPermissoes[moduloKey] = {
                              visualizar: true,
                              criar: true,
                              editar: true,
                              excluir: true,
                              aprovar: true,
                              rejeitar: true,
                              exportar: true,
                              imprimir: true
                            };
                          });
                          setFormData({...formData, permissoesModulos: todasPermissoes});
                        }}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors duration-200 text-sm"
                      >
                        <i className="fa fa-check-square mr-1"></i>
                        Todas
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nenhumaPermissao = {};
                          modulos.forEach(modulo => {
                            const moduloKey = modulo.nome.toLowerCase().replace(' ', '-');
                            nenhumaPermissao[moduloKey] = {
                              visualizar: false,
                              criar: false,
                              editar: false,
                              excluir: false,
                              aprovar: false,
                              rejeitar: false,
                              exportar: false,
                              imprimir: false
                            };
                          });
                          setFormData({...formData, permissoesModulos: nenhumaPermissao});
                        }}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-200 text-sm"
                      >
                        <i className="fa fa-square mr-1"></i>
                        Nenhuma
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modulos.map((modulo) => (
                      <div key={modulo.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <i className={`fa ${modulo.icone} text-blue-600 mr-2`}></i>
                          <h5 className="font-medium text-gray-900">{modulo.nome}</h5>
                        </div>
                        <div className="space-y-2">
                          {['visualizar', 'criar', 'editar', 'excluir', 'aprovar', 'rejeitar', 'exportar', 'imprimir'].map((permissao) => (
                            <label key={permissao} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.permissoesModulos[modulo.nome.toLowerCase().replace(' ', '-')]?.[permissao] || false}
                                onChange={(e) => {
                                  const moduloKey = modulo.nome.toLowerCase().replace(' ', '-');
                                  setFormData({
                                    ...formData,
                                    permissoesModulos: {
                                      ...formData.permissoesModulos,
                                      [moduloKey]: {
                                        ...formData.permissoesModulos[moduloKey],
                                        [permissao]: e.target.checked
                                      }
                                    }
                                  });
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700 capitalize">
                                {permissao}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {editingUser ? 'Atualizar' : 'Criar'} Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TIDashboard;
