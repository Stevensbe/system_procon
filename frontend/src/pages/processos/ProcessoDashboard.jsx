import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardProcessos, estatisticasAvancadas } from '../../services/processosService';

function ProcessoDashboard() {
    const [stats, setStats] = useState({
        total_processos: 0,
        por_status: {},
        por_prioridade: {},
        prazos_vencidos: 0,
        valor_total_multas: 0,
        processos_recentes: [],
        alertas: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        carregarDashboard();
    }, []);

    const carregarDashboard = async () => {
        try {
            setLoading(true);
            const [dashboardData, estatisticasData] = await Promise.all([
                dashboardProcessos(),
                estatisticasAvancadas()
            ]);
            
            setStats({
                ...dashboardData,
                ...estatisticasData
            });
        } catch (err) {
            console.error('❌ Erro ao carregar dashboard:', err);
            setError('Erro ao carregar dashboard de processos');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            aguardando_defesa: 'bg-yellow-500',
            defesa_apresentada: 'bg-blue-500',
            em_analise: 'bg-purple-500',
            aguardando_recurso: 'bg-orange-500',
            recurso_apresentado: 'bg-indigo-500',
            julgamento: 'bg-red-500',
            finalizado_procedente: 'bg-green-500',
            finalizado_improcedente: 'bg-gray-500',
            arquivado: 'bg-gray-400',
            prescrito: 'bg-red-400',
        };
        return colors[status] || 'bg-gray-400';
    };

    const getPrioridadeColor = (prioridade) => {
        const colors = {
            urgente: 'text-red-600 bg-red-100',
            alta: 'text-orange-600 bg-orange-100',
            normal: 'text-gray-600 bg-gray-100',
            baixa: 'text-green-600 bg-green-100',
        };
        return colors[prioridade] || 'text-gray-600 bg-gray-100';
    };

    const formatarValor = (valor) => {
        if (!valor) return 'R$ 0,00';
        return `R$ ${parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-6">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Processos</h1>
                            <p className="text-gray-600 mt-1">Visão geral dos processos administrativos</p>
                        </div>
                        <div className="flex space-x-3">
                            <Link
                                to="/processos"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                Ver Todos os Processos
                            </Link>
                            <button
                                onClick={carregarDashboard}
                                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                Atualizar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Alertas Importantes */}
                {stats.alertas && stats.alertas.length > 0 && (
                    <div className="mb-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <svg className="h-6 w-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                                <h3 className="text-lg font-medium text-red-800">Alertas Importantes</h3>
                            </div>
                            <div className="mt-2 space-y-1">
                                {stats.alertas.map((alerta, index) => (
                                    <p key={index} className="text-sm text-red-700">• {alerta}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Estatísticas Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total de Processos</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total_processos}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Prazos Vencidos</p>
                                <p className="text-3xl font-bold text-red-600">{stats.prazos_vencidos}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Valor Total</p>
                                <p className="text-2xl font-bold text-green-600">{formatarValor(stats.valor_total_multas)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Em Andamento</p>
                                <p className="text-3xl font-bold text-purple-600">
                                    {stats.total_processos - (stats.por_status?.finalizado_procedente || 0) - (stats.por_status?.finalizado_improcedente || 0) - (stats.por_status?.arquivado || 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Processos por Status */}
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processos por Status</h3>
                        <div className="space-y-3">
                            {Object.entries(stats.por_status || {}).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mr-3`}></div>
                                        <span className="text-sm text-gray-700 capitalize">
                                            {status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-900">{count}</span>
                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${getStatusColor(status)}`}
                                                style={{ width: `${(count / stats.total_processos) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Processos por Prioridade */}
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processos por Prioridade</h3>
                        <div className="space-y-3">
                            {Object.entries(stats.por_prioridade || {}).map(([prioridade, count]) => (
                                <div key={prioridade} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(prioridade)}`}>
                                            {prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-900">{count}</span>
                                        <span className="text-xs text-gray-500">
                                            ({((count / stats.total_processos) * 100).toFixed(1)}%)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Processos Recentes */}
                {stats.processos_recentes && stats.processos_recentes.length > 0 && (
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Processos Recentes</h3>
                            <Link
                                to="/processos"
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Ver Todos →
                            </Link>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Processo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Empresa
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Criado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {stats.processos_recentes.slice(0, 5).map((processo) => (
                                        <tr key={processo.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {processo.numero_processo}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{processo.autuado}</div>
                                                <div className="text-sm text-gray-500">{processo.cnpj}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(processo.status)}`}>
                                                    {processo.status_display || processo.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(processo.criado_em).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <Link
                                                    to={`/processos/${processo.id}`}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    Ver Dossiê
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProcessoDashboard;
