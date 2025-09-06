import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listarAutosInfracao } from '../../../services/fiscalizacaoService';

function AutoInfracaoListPage() {
    const [autos, setAutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtros, setFiltros] = useState({
        status: '',
        razao_social: '',
        cnpj: '',
        data_inicio: '',
        data_fim: ''
    });

    useEffect(() => {
        carregarAutos();
    }, [filtros]);

    const carregarAutos = async () => {
        try {
            setLoading(true);
            const response = await listarAutosInfracao(1, filtros);
            setAutos(response.results || []);
        } catch (err) {
            console.error('❌ Erro ao carregar autos:', err);
            setError('Erro ao carregar autos de infração');
        } finally {
            setLoading(false);
        }
    };

    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const getStatusColor = (status) => {
        const colors = {
            autuado: 'bg-red-100 text-red-800',
            notificado: 'bg-orange-100 text-orange-800',
            em_defesa: 'bg-blue-100 text-blue-800',
            julgado: 'bg-purple-100 text-purple-800',
            pago: 'bg-green-100 text-green-800',
            cancelado: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status) => {
        const labels = {
            autuado: 'Autuado',
            notificado: 'Notificado',
            em_defesa: 'Em Defesa',
            julgado: 'Julgado',
            pago: 'Pago',
            cancelado: 'Cancelado',
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0c0f12] transition-colors duration-300">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 dark:border-red-400 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors duration-300">Carregando autos de infração...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0c0f12] py-6 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white dark:bg-[#1a1d21] shadow rounded-lg mb-6 transition-colors duration-300">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Autos de Infração</h1>
                                <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Gerenciar autuações e processos administrativos</p>
                            </div>
                            <Link
                                to="/fiscalizacao/infracoes/novo"
                                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                Novo Auto de Infração
                            </Link>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-[#0c0f12] transition-colors duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">Status</label>
                                <select
                                    name="status"
                                    value={filtros.status}
                                    onChange={handleFiltroChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                                >
                                    <option value="">Todos</option>
                                    <option value="autuado">Autuado</option>
                                    <option value="notificado">Notificado</option>
                                    <option value="em_defesa">Em Defesa</option>
                                    <option value="julgado">Julgado</option>
                                    <option value="pago">Pago</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">Razão Social</label>
                                <input
                                    type="text"
                                    name="razao_social"
                                    value={filtros.razao_social}
                                    onChange={handleFiltroChange}
                                    placeholder="Buscar por empresa..."
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">CNPJ</label>
                                <input
                                    type="text"
                                    name="cnpj"
                                    value={filtros.cnpj}
                                    onChange={handleFiltroChange}
                                    placeholder="00.000.000/0000-00"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">Data Início</label>
                                <input
                                    type="date"
                                    name="data_inicio"
                                    value={filtros.data_inicio}
                                    onChange={handleFiltroChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">Data Fim</label>
                                <input
                                    type="date"
                                    name="data_fim"
                                    value={filtros.data_fim}
                                    onChange={handleFiltroChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista de Autos */}
                {error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
                        <p className="text-red-800 dark:text-red-200 transition-colors duration-300">{error}</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#1a1d21] shadow rounded-lg overflow-hidden transition-colors duration-300">
                        {autos.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">Nenhum auto encontrado</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Comece criando um novo auto de infração.</p>
                                <div className="mt-6">
                                    <Link
                                        to="/fiscalizacao/infracoes/novo"
                                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                        </svg>
                                        Novo Auto de Infração
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                                            Auto
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Estabelecimento
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Data
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Valor
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {autos.map((auto) => (
                                        <tr key={auto.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {auto.numero}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {auto.cnpj}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {auto.razao_social}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {auto.atividade}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(auto.data_fiscalizacao).toLocaleDateString('pt-BR')}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {auto.hora_fiscalizacao}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {auto.valor_multa_formatado || `R$ ${parseFloat(auto.valor_multa || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(auto.status)}`}>
                                                    {getStatusLabel(auto.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <Link
                                                        to={`/fiscalizacao/infracoes/${auto.id}`}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        👁️ Ver
                                                    </Link>
                                                    <Link
                                                        to={`/fiscalizacao/infracoes/${auto.id}/editar`}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        ✏️ Editar
                                                    </Link>
                                                    <a
                                                        href={`/api/infracoes/${auto.id}/documento/`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 hover:text-green-800"
                                                    >
                                                        📄 Documento
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Estatísticas rápidas */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total de Infrações</p>
                                <p className="text-2xl font-semibold text-gray-900">{autos.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {autos.filter(auto => ['autuado', 'notificado'].includes(auto.status)).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Valor Total</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    R$ {autos.reduce((sum, auto) => sum + parseFloat(auto.valor_multa || 0), 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Este Mês</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {autos.filter(auto => {
                                        const dataAuto = new Date(auto.data_fiscalizacao);
                                        const agora = new Date();
                                        return dataAuto.getMonth() === agora.getMonth() && dataAuto.getFullYear() === agora.getFullYear();
                                    }).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AutoInfracaoListPage;