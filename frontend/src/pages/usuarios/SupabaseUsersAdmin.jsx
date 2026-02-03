/**
 * @fileoverview Página de Gerenciamento de Usuários Supabase
 * @description Interface administrativa para gerenciar usuários do sistema
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Shield,
    ShieldCheck,
    ShieldAlert,
    Mail,
    Phone,
    Calendar,
    CheckCircle,
    XCircle,
    RefreshCw,
    X,
    Save,
    AlertTriangle,
    Building,
    User,
    Crown,
    Eye,
    EyeOff,
    Key
} from 'lucide-react';
import { useAuth } from '../../context/SupabaseAuthContext';
import {
    listUsers,
    updateUser,
    changeUserRole,
    toggleUserStatus,
    createUser,
    deleteUser,
    resetUserPassword,
    getUserStats
} from '../../services/userAdminService';

// Configuração de roles
const ROLES = [
    { value: 'admin', label: 'Administrador', icon: Crown, color: 'text-red-500 bg-red-100' },
    { value: 'staff', label: 'Funcionário', icon: ShieldCheck, color: 'text-blue-500 bg-blue-100' },
    { value: 'empresa', label: 'Empresa', icon: Building, color: 'text-purple-500 bg-purple-100' },
    { value: 'consumer', label: 'Consumidor', icon: User, color: 'text-green-500 bg-green-100' },
    { value: 'user', label: 'Usuário', icon: User, color: 'text-gray-500 bg-gray-100' },
];

// Componente de Badge de Role
const RoleBadge = ({ role }) => {
    const roleConfig = ROLES.find(r => r.value === role) || ROLES[4];
    const Icon = roleConfig.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig.color}`}>
            <Icon className="w-3 h-3" />
            {roleConfig.label}
        </span>
    );
};

// Componente de Modal
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-screen items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl`}
                    >
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6">
                            {children}
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
};

// Componente Principal
const SupabaseUsersAdmin = () => {
    const { user: currentUser, isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modais
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Form de criação
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'user'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Carregar usuários
    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [usersData, statsData] = await Promise.all([
                listUsers(),
                getUserStats()
            ]);
            setUsers(usersData);
            setStats(statsData);
        } catch (err) {
            setError(err.message || 'Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Aplicar filtros
    useEffect(() => {
        let filtered = [...users];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(u =>
                u.email?.toLowerCase().includes(term) ||
                u.full_name?.toLowerCase().includes(term) ||
                u.phone?.includes(term)
            );
        }

        if (roleFilter) {
            filtered = filtered.filter(u => u.role === roleFilter);
        }

        if (statusFilter === 'active') {
            filtered = filtered.filter(u => u.is_active !== false);
        } else if (statusFilter === 'inactive') {
            filtered = filtered.filter(u => u.is_active === false);
        }

        setFilteredUsers(filtered);
    }, [users, searchTerm, roleFilter, statusFilter]);

    // Handlers
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await createUser(newUser);
            setSuccess('Usuário criado com sucesso!');
            setShowCreateModal(false);
            setNewUser({ email: '', password: '', fullName: '', phone: '', role: 'user' });
            loadUsers();
        } catch (err) {
            setError(err.message || 'Erro ao criar usuário');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;

        setSubmitting(true);
        setError(null);

        try {
            await updateUser(selectedUser.id, {
                full_name: selectedUser.full_name,
                phone: selectedUser.phone,
                role: selectedUser.role
            });
            setSuccess('Usuário atualizado com sucesso!');
            setShowEditModal(false);
            loadUsers();
        } catch (err) {
            setError(err.message || 'Erro ao atualizar usuário');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        setSubmitting(true);
        setError(null);

        try {
            await deleteUser(selectedUser.id);
            setSuccess('Usuário deletado com sucesso!');
            setShowDeleteModal(false);
            loadUsers();
        } catch (err) {
            setError(err.message || 'Erro ao deletar usuário');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await toggleUserStatus(user.id, user.is_active === false);
            setSuccess(`Usuário ${user.is_active === false ? 'ativado' : 'desativado'} com sucesso!`);
            loadUsers();
        } catch (err) {
            setError(err.message || 'Erro ao alterar status');
        }
    };

    const handleResetPassword = async (email) => {
        try {
            await resetUserPassword(email);
            setSuccess('Email de recuperação enviado!');
        } catch (err) {
            setError(err.message || 'Erro ao enviar email');
        }
    };

    // Limpar mensagens após 5 segundos
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    // Formatar data
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
                    <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Alertas */}
            <AnimatePresence>
                {(success || error) && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {success ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            <span>{success || error}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-600" />
                            Gerenciamento de Usuários
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Gerencie os usuários do sistema, permissões e acessos
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadUsers}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            Novo Usuário
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <Users className="w-10 h-10 text-blue-500 opacity-50" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Ativos</p>
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Admins</p>
                                <p className="text-2xl font-bold text-red-600">{stats.byRole.admin}</p>
                            </div>
                            <Crown className="w-10 h-10 text-red-500 opacity-50" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Funcionários</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.byRole.staff}</p>
                            </div>
                            <ShieldCheck className="w-10 h-10 text-blue-500 opacity-50" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Empresas</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.byRole.empresa}</p>
                            </div>
                            <Building className="w-10 h-10 text-purple-500 opacity-50" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nome, email ou telefone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todos os roles</option>
                        {ROLES.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todos os status</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                    </select>
                    <span className="text-sm text-gray-500">
                        {filteredUsers.length} usuário(s)
                    </span>
                </div>
            </div>

            {/* Lista de Usuários */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Users className="w-12 h-12 mb-2 opacity-50" />
                        <p>Nenhum usuário encontrado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Usuário
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Contato
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Role
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Criado em
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredUsers.map((user) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                    {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {user.full_name || 'Sem nome'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    {user.email}
                                                </span>
                                                {user.phone && (
                                                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {user.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <RoleBadge role={user.role || 'user'} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.is_active !== false
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {user.is_active !== false ? (
                                                    <><CheckCircle className="w-3 h-3" /> Ativo</>
                                                ) : (
                                                    <><XCircle className="w-3 h-3" /> Inativo</>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(user.created_at)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser({ ...user });
                                                        setShowEditModal(true);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    className={`p-2 rounded-lg transition-colors ${user.is_active !== false
                                                            ? 'text-orange-600 hover:bg-orange-50'
                                                            : 'text-green-600 hover:bg-green-50'
                                                        }`}
                                                    title={user.is_active !== false ? 'Desativar' : 'Ativar'}
                                                >
                                                    {user.is_active !== false ? (
                                                        <XCircle className="w-4 h-4" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(user.email)}
                                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Resetar Senha"
                                                >
                                                    <Key className="w-4 h-4" />
                                                </button>
                                                {user.id !== currentUser?.id && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Deletar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: Criar Usuário */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Novo Usuário"
                size="md"
            >
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome Completo
                        </label>
                        <input
                            type="text"
                            value={newUser.fullName}
                            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="João da Silva"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="email@exemplo.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Senha
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                className="w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Mínimo 8 caracteres"
                                minLength={8}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefone
                        </label>
                        <input
                            type="tel"
                            value={newUser.phone}
                            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="(92) 99999-9999"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role (Papel)
                        </label>
                        <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {ROLES.map(role => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitting ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Criar Usuário
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Editar Usuário */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Editar Usuário"
                size="md"
            >
                {selectedUser && (
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={selectedUser.email}
                                disabled
                                className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                value={selectedUser.full_name || ''}
                                onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefone
                            </label>
                            <input
                                type="tel"
                                value={selectedUser.phone || ''}
                                onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role (Papel)
                            </label>
                            <select
                                value={selectedUser.role || 'user'}
                                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                {ROLES.map(role => (
                                    <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Salvar Alterações
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal: Confirmar Exclusão */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirmar Exclusão"
                size="sm"
            >
                {selectedUser && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Deletar usuário?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Tem certeza que deseja deletar <strong>{selectedUser.email}</strong>?
                            Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={submitting}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Deletar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SupabaseUsersAdmin;
