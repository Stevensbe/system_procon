import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listarProcessos } from '../../services/processosService';

function AlertasPrazos({ showOnlyCount = false }) {
    const [alertas, setAlertas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        carregarAlertas();
    }, []);

    const carregarAlertas = async () => {
        try {
            setLoading(true);
            
            // Buscar processos com filtros específicos para alertas
            const hoje = new Date();
            const umaSemana = new Date();
            umaSemana.setDate(hoje.getDate() + 7);
            
            const response = await listarProcessos(1, {
                prazo_vencido: 'true',
                vence_semana: 'true'
            });
            
            const processosComAlertas = response.results?.filter(processo => {
                if (!processo.prazo_defesa) return false;
                
                const prazo = new Date(processo.prazo_defesa);
                const agora = new Date();
                const diffDias = Math.ceil((prazo - agora) / (1000 * 60 * 60 * 24));
                
                return diffDias <= 7; // Alerta para processos que vencem em até 7 dias
            }) || [];
            
            // Criar alertas estruturados
            const alertasEstruturados = processosComAlertas.map(processo => {
                const prazo = new Date(processo.prazo_defesa);
                const agora = new Date();
                const diffDias = Math.ceil((prazo - agora) / (1000 * 60 * 60 * 24));
                
                let tipo = 'info';
                let mensagem = '';
                
                if (diffDias < 0) {
                    tipo = 'error';
                    mensagem = `Prazo vencido há ${Math.abs(diffDias)} dias`;
                } else if (diffDias === 0) {
                    tipo = 'error';
                    mensagem = 'Prazo vence hoje';
                } else if (diffDias <= 3) {
                    tipo = 'warning';
                    mensagem = `Vence em ${diffDias} dia${diffDias > 1 ? 's' : ''}`;
                } else if (diffDias <= 7) {
                    tipo = 'info';
                    mensagem = `Vence em ${diffDias} dias`;
                }
                
                return {
                    id: processo.id,
                    processo: processo.numero_processo,
                    empresa: processo.autuado,
                    prazo: processo.prazo_defesa,
                    tipo,
                    mensagem,
                    diffDias
                };
            });
            
            // Ordenar por urgência (vencidos primeiro, depois por proximidade)
            alertasEstruturados.sort((a, b) => a.diffDias - b.diffDias);
            
            setAlertas(alertasEstruturados);
        } catch (err) {
            console.error('❌ Erro ao carregar alertas:', err);
        } finally {
            setLoading(false);
        }
    };

    const getIconeAlerta = (tipo) => {
        const icones = {
            error: '🚨',
            warning: '⚠️',
            info: '🔔'
        };
        return icones[tipo] || '🔔';
    };

    const getCorAlerta = (tipo) => {
        const cores = {
            error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
            warning: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200',
            info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        };
        return cores[tipo] || 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200';
    };

    // Modo apenas contador (para header)
    if (showOnlyCount) {
        const alertasUrgentes = alertas.filter(a => a.tipo === 'error' || a.tipo === 'warning');
        
        if (alertasUrgentes.length === 0) return null;
        
        return (
            <button
                onClick={() => setShowModal(true)}
                className="relative inline-flex items-center p-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
            >
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h11a2 2 0 012 2v4m-6 8a9 9 0 100-18 9 9 0 000 18z"></path>
                </svg>
                
                {alertasUrgentes.length > 0 && (
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {alertasUrgentes.length}
                    </span>
                )}
            </button>
        );
    }

    // Modo completo
    return (
        <>
            <div className="bg-white dark:bg-[#1a1d21] border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-300">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">🔔 Alertas de Prazos</h3>
                    <button
                        onClick={carregarAlertas}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
                    >
                        Atualizar
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                    </div>
                ) : alertas.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-2">✅</div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">Nenhum alerta</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Todos os prazos estão em dia!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alertas.slice(0, 5).map((alerta) => (
                            <div key={alerta.id} className={`border rounded-lg p-4 ${getCorAlerta(alerta.tipo)}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className="text-xl">{getIconeAlerta(alerta.tipo)}</div>
                                        <div className="flex-1">
                                            <h4 className="font-medium">
                                                Processo {alerta.processo}
                                            </h4>
                                            <p className="text-sm opacity-90 mt-1">
                                                {alerta.empresa}
                                            </p>
                                            <p className="text-sm font-medium mt-2">
                                                {alerta.mensagem}
                                            </p>
                                            <p className="text-xs opacity-75 mt-1">
                                                Prazo: {new Date(alerta.prazo).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/processos/${alerta.id}`}
                                        className="text-sm font-medium hover:underline"
                                    >
                                        Ver Processo →
                                    </Link>
                                </div>
                            </div>
                        ))}
                        
                        {alertas.length > 5 && (
                            <div className="text-center pt-3 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                                >
                                    Ver todos os {alertas.length} alertas
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal com todos os alertas */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50 transition-colors duration-300">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
                        <div className="mt-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Todos os Alertas de Prazos</h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="max-h-96 overflow-y-auto space-y-3">
                                {alertas.map((alerta) => (
                                    <div key={alerta.id} className={`border rounded-lg p-4 ${getCorAlerta(alerta.tipo)}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3">
                                                <div className="text-xl">{getIconeAlerta(alerta.tipo)}</div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium">
                                                        Processo {alerta.processo}
                                                    </h4>
                                                    <p className="text-sm opacity-90 mt-1">
                                                        {alerta.empresa}
                                                    </p>
                                                    <p className="text-sm font-medium mt-2">
                                                        {alerta.mensagem}
                                                    </p>
                                                    <p className="text-xs opacity-75 mt-1">
                                                        Prazo: {new Date(alerta.prazo).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/processos/${alerta.id}`}
                                                onClick={() => setShowModal(false)}
                                                className="text-sm font-medium hover:underline"
                                            >
                                                Ver Processo →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AlertasPrazos;
