import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import processosService from '../../services/processosService';
import FiltrosAvancados from '../../components/processos/FiltrosAvancados';
import AlertasPrazos from '../../components/processos/AlertasPrazos';

function ProcessoListPage() {
    const [processos, setProcessos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [alertas, setAlertas] = useState(null);
    const [dashboard, setDashboard] = useState(null);
    const [paginacao, setPaginacao] = useState({
        count: 0,
        next: null,
        previous: null,
        page: 1
    });
    const [filtros, setFiltros] = useState({
        status: '',
        prioridade: '',
        search: '',
        analista_responsavel: ''
    });

    useEffect(() => {
        carregarDados();
    }, [filtros, paginacao.page]);

    const carregarDados = async () => {
        try {
            setLoading(true);
            setError(''); // Limpa erros anteriores
            
            // Carrega processos com filtros e paginação
            const responseProcessos = await processosService.listarProcessos(filtros, paginacao.page);
            setProcessos(responseProcessos.results || []);
            setPaginacao(prev => ({
                ...prev,
                count: responseProcessos.count || 0,
                next: responseProcessos.next,
                previous: responseProcessos.previous
            }));

            // Carrega dados do dashboard
            const responseDashboard = await processosService.obterDashboard();
            setDashboard(responseDashboard);

            // Carrega alertas
            const responseAlertas = await processosService.obterAlertas();
            setAlertas(responseAlertas);

        } catch (err) {
            console.error('❌ Erro ao carregar dados:', err);
            setError('Erro ao carregar dados dos processos');
            // Define dados vazios em caso de erro
            setProcessos([]);
            setDashboard({
                resumo: {
                    total_processos: 0,
                    processos_abertos: 0,
                    processos_vencidos: 0,
                    processos_proximos_vencimento: 0,
                    valor_total_tramitacao: 0,
                    tempo_medio_tramitacao: 0
                }
            });
            setAlertas({ resultados: [], total_encontrados: 0 });
        } finally {
            setLoading(false);
        }
    };

    const handlePaginacao = (novaPagina) => {
        setPaginacao(prev => ({ ...prev, page: novaPagina }));
    };

    const limparFiltros = () => {
        setFiltros({
            status: '',
            prioridade: '',
            search: '',
            analista_responsavel: ''
        });
        setPaginacao(prev => ({ ...prev, page: 1 }));
    };

    const getStatusColor = (status) => {
        return `badge-${processosService.getCorStatus(status)}`;
    };

    const getPrioridadeColor = (prioridade) => {
        return `badge-${processosService.getCorPrioridade(prioridade)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0c0f12] transition-colors duration-300">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300 transition-colors duration-300">Carregando processos...</p>
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
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Processos Administrativos</h1>
                                <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Acompanhamento dos processos de autuação</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Alertas de Prazos */}
                {alertas && alertas.total_alertas > 0 && (
                    <div className="mb-6">
                        <AlertasPrazos alertas={alertas} />
                    </div>
                )}

                {/* Filtros Avançados */}
                <div className="mb-6">
                    <FiltrosAvancados
                        filtros={filtros}
                        onFiltrosChange={setFiltros}
                        onLimpar={limparFiltros}
                    />
                </div>

                {/* Dashboard com Estatísticas */}
                {dashboard && dashboard.resumo && (
                    <div className="bg-white dark:bg-[#1a1d21] shadow rounded-lg mb-6 p-6 transition-colors duration-300">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Dashboard de Processos</h3>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{dashboard.resumo.total_processos || 0}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Total de Processos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-colors duration-300">{dashboard.resumo.processos_abertos || 0}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Em Tramitação</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400 transition-colors duration-300">{dashboard.resumo.processos_vencidos || 0}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Prazos Vencidos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 transition-colors duration-300">{dashboard.resumo.processos_proximos_vencimento || 0}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Próximos Vencimento</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400 transition-colors duration-300">
                                    {processosService.formatarValor(dashboard.resumo.valor_total_tramitacao || 0)}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Valor em Tramitação</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 transition-colors duration-300">
                                    {dashboard.resumo.tempo_medio_tramitacao ? Math.round(dashboard.resumo.tempo_medio_tramitacao) : '-'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Dias Médios</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabela de Processos */}
                {error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
                        <p className="text-red-800 dark:text-red-200 transition-colors duration-300">{error}</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors duration-300">
                        {processos.length === 0 ? (
                            <div className="text-center py-12">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">Nenhum processo encontrado</h3>
                                <p className="mt-1 text-gray-500 dark:text-gray-400 transition-colors duration-300">Processos são criados automaticamente dos autos de infração.</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                                            Nº Processo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                                            Empresa Autuada
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Prioridade
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Valor Multa
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Data Abertura
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Prazo Defesa
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {processos.map((processo) => (
                                        <tr key={processo.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {processo.numero_processo}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {processo.autuado}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    CNPJ: {processo.cnpj}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${processosService.getCorStatus(processo.status)}-100 text-${processosService.getCorStatus(processo.status)}-800`}>
                                                    {processo.status_display}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${processosService.getCorPrioridade(processo.prioridade)}-100 text-${processosService.getCorPrioridade(processo.prioridade)}-800`}>
                                                    {processo.prioridade_display}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {processosService.formatarValor(processo.valor_multa)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {processosService.formatarData(processo.criado_em)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {processosService.formatarData(processo.prazo_defesa)}
                                                </div>
                                                {processosService.isPrazoVencido(processo.prazo_defesa, processo.status) && (
                                                    <div className="text-xs text-red-600 font-medium">
                                                        Vencido há {Math.abs(processosService.calcularDiasRestantes(processo.prazo_defesa))} dias
                                                    </div>
                                                )}
                                                {!processosService.isPrazoVencido(processo.prazo_defesa, processo.status) && 
                                                 processo.status === 'aguardando_defesa' && (
                                                    <div className="text-xs text-blue-600">
                                                        {processosService.calcularDiasRestantes(processo.prazo_defesa)} dias restantes
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <Link
                                                    to={`/processos/${processo.id}`}
                                                    className="text-blue-600 hover:text-blue-800 mr-3"
                                                >
                                                    Ver Dossiê
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        
                        {/* Paginação */}
                        {paginacao.count > 0 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => handlePaginacao(paginacao.page - 1)}
                                        disabled={!paginacao.previous}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => handlePaginacao(paginacao.page + 1)}
                                        disabled={!paginacao.next}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Próximo
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Mostrando <span className="font-medium">{((paginacao.page - 1) * 20) + 1}</span> até{' '}
                                            <span className="font-medium">
                                                {Math.min(paginacao.page * 20, paginacao.count)}
                                            </span>{' '}
                                            de <span className="font-medium">{paginacao.count}</span> processos
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                                onClick={() => handlePaginacao(paginacao.page - 1)}
                                                disabled={!paginacao.previous}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">Anterior</span>
                                                ‹
                                            </button>
                                            
                                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                Página {paginacao.page}
                                            </span>
                                            
                                            <button
                                                onClick={() => handlePaginacao(paginacao.page + 1)}
                                                disabled={!paginacao.next}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">Próximo</span>
                                                ›
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProcessoListPage;