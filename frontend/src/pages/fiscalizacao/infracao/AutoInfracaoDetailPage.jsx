import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { obterAutoInfracao, deletarAutoInfracao, validarAutoInfracaoFormal } from '../../../services/fiscalizacaoService';

function AutoInfracaoDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [auto, setAuto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [validacaoMotivo, setValidacaoMotivo] = useState('');
    const [validacaoLoading, setValidacaoLoading] = useState(false);
    const [mostrarMotivo, setMostrarMotivo] = useState(false);

    useEffect(() => {
        carregarAuto();
    }, [id]);
    
    useEffect(() => {
        if (auto) {
            setValidacaoMotivo(auto.validacao_formal_motivo || '');
            setMostrarMotivo(auto.validacao_formal_status === 'erro');
        }
    }, [auto]);

    const carregarAuto = async () => {
        try {
            setLoading(true);
            const response = await obterAutoInfracao(id);
            setAuto(response);
        } catch (err) {
            console.error('❌ Erro ao carregar auto:', err);
            setError('Erro ao carregar auto de infração');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deletarAutoInfracao(id);
            alert('Auto de infração excluído com sucesso!');
            navigate('/fiscalizacao/infracoes');
        } catch (err) {
            console.error('❌ Erro ao excluir auto:', err);
            alert('Erro ao excluir auto de infração');
        }
        setShowDeleteModal(false);
    };
    
    const handleValidacao = async (status) => {
        if (status === 'erro' && !validacaoMotivo.trim()) {
            alert('Informe o motivo do erro formal.');
            return;
        }
        try {
            setValidacaoLoading(true);
            const response = await validarAutoInfracaoFormal(id, {
                status,
                motivo: status === 'erro' ? validacaoMotivo : ''
            });
            setAuto(response);
            setMostrarMotivo(status === 'erro');
        } catch (err) {
            console.error('❌ Erro ao validar formalmente:', err);
            alert('Erro ao registrar validação formal.');
        } finally {
            setValidacaoLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            autuado: 'bg-red-100 text-red-800 border-red-200',
            notificado: 'bg-orange-100 text-orange-800 border-orange-200',
            em_defesa: 'bg-blue-100 text-blue-800 border-blue-200',
            julgado: 'bg-purple-100 text-purple-800 border-purple-200',
            pago: 'bg-green-100 text-green-800 border-green-200',
            cancelado: 'bg-gray-100 text-gray-800 border-gray-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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
    
    const getValidacaoColor = (status) => {
        const colors = {
            pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            valido: 'bg-green-100 text-green-800 border-green-200',
            erro: 'bg-red-100 text-red-800 border-red-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };
    
    const getValidacaoLabel = (status) => {
        const labels = {
            pendente: 'Pendente',
            valido: 'Válido',
            erro: 'Erro Formal',
        };
        return labels[status] || status || 'Pendente';
    };

    const renderField = (label, value, className = '') => (
        <div className={`bg-gray-50 p-4 rounded-lg ${className}`}>
            <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
            <p className="text-gray-900">{value || '-'}</p>
        </div>
    );

    const renderSection = (title, children, icon = null) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    {icon && <span className="mr-2">{icon}</span>}
                    {title}
                </h2>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando auto de infração...</p>
                </div>
            </div>
        );
    }

    if (error || !auto) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Erro ao carregar</h3>
                    <p className="mt-1 text-sm text-gray-500">{error}</p>
                    <div className="mt-6">
                        <Link
                            to="/fiscalizacao/infracoes"
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Voltar para Lista
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white shadow-sm rounded-lg mb-6">
                    <div className="px-6 py-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Auto de Infração {auto.numero}
                                </h1>
                                <p className="text-gray-600 mt-1">{auto.razao_social}</p>
                                <div className="mt-2">
                                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(auto.status)}`}>
                                        {getStatusLabel(auto.status)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <a
                                    href={`/api/infracoes/${auto.id}/documento/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    Gerar Documento
                                </a>
                                <Link
                                    to={`/fiscalizacao/infracoes/${auto.id}/editar`}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                    Editar
                                </Link>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    Excluir
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <Link
                                to="/fiscalizacao/infracoes"
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                ← Voltar para Lista de Infrações
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Informações principais */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna principal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Dados Básicos */}
                        {renderSection('Dados Básicos', (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderField('Data da Fiscalização', new Date(auto.data_fiscalizacao).toLocaleDateString('pt-BR'))}
                                {renderField('Hora da Fiscalização', auto.hora_fiscalizacao)}
                                {renderField('Município', auto.municipio)}
                                {renderField('Estado', auto.estado)}
                            </div>
                        ), '📅')}

                        {/* Dados do Estabelecimento */}
                        {renderSection('Estabelecimento Fiscalizado', (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {renderField('Razão Social', auto.razao_social)}
                                    {renderField('Nome Fantasia', auto.nome_fantasia)}
                                    {renderField('CNPJ', auto.cnpj)}
                                    {renderField('Telefone', auto.telefone)}
                                    {renderField('CEP', auto.cep)}
                                </div>
                                {renderField('Atividade', auto.atividade)}
                                {renderField('Endereço', auto.endereco)}
                            </div>
                        ), '🏢')}

                        {/* Origem do Auto */}
                        {(auto.auto_constatacao_numero || auto.notificacao_numero || auto.parecer_numero || auto.parecer_origem) && renderSection('Origem do Auto', (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderField('Auto de Constatação Nº', auto.auto_constatacao_numero)}
                                {renderField('Notificação Nº', auto.notificacao_numero)}
                                {renderField('Número do Parecer', auto.parecer_numero)}
                                {renderField('Origem do Parecer', auto.parecer_origem)}
                            </div>
                        ), '📋')}
                        {auto.texto_origem && renderSection('Texto de Origem', (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-900 whitespace-pre-wrap">{auto.texto_origem}</p>
                            </div>
                        ), '🧾')}

                        {/* Relatório */}
                        {renderSection('Relatório da Fiscalização', (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-900 whitespace-pre-wrap">{auto.relatorio}</p>
                            </div>
                        ), '📝')}

                        {/* Base Legal */}
                        {renderSection('Base Legal', (
                            <div className="space-y-4">
                                {auto.base_legal_cdc && renderField('Código de Defesa do Consumidor', auto.base_legal_cdc)}
                                {auto.base_legal_outras && renderField('Outras Bases Legais', auto.base_legal_outras)}
                            </div>
                        ), '⚖️')}

                        {/* Infrações Constatadas */}
                        {renderSection('Infrações Constatadas', (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-800 mb-3">Artigos do CDC</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {auto.infracao_art_34 && <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Art. 34</span>}
                                        {auto.infracao_art_35 && <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Art. 35</span>}
                                        {auto.infracao_art_36 && <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Art. 36</span>}
                                        {auto.infracao_art_55 && <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Art. 55</span>}
                                        {auto.infracao_art_56 && <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Art. 56</span>}
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-medium text-gray-800 mb-3">Outras Infrações</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {auto.infracao_publicidade_enganosa && <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">Publicidade Enganosa</span>}
                                        {auto.infracao_precos_abusivos && <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">Preços Abusivos</span>}
                                        {auto.infracao_produtos_vencidos && <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">Produtos Vencidos</span>}
                                        {auto.infracao_falta_informacao && <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">Falta de Informação</span>}
                                    </div>
                                </div>

                                {auto.outras_infracoes && (
                                    <div>
                                        <h4 className="font-medium text-gray-800 mb-2">Infrações Específicas</h4>
                                        <p className="text-gray-900 bg-gray-50 p-3 rounded">{auto.outras_infracoes}</p>
                                    </div>
                                )}
                            </div>
                        ), '🚫')}

                        {/* Fundamentação */}
                        {(auto.fundamentacao_tecnica || auto.fundamentacao_juridica) && renderSection('Fundamentação', (
                            <div className="space-y-4">
                                {auto.fundamentacao_tecnica && renderField('Fundamentação Técnica', auto.fundamentacao_tecnica)}
                                {auto.fundamentacao_juridica && renderField('Fundamentação Jurídica', auto.fundamentacao_juridica)}
                            </div>
                        ), '📖')}

                        {/* Responsáveis */}
                        {renderSection('Responsáveis', (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-medium text-gray-800 mb-3">Autoridade Fiscalizadora</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {renderField('Nome', auto.fiscal_nome)}
                                        {renderField('Cargo', auto.fiscal_cargo)}
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-medium text-gray-800 mb-3">Estabelecimento Fiscalizado</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {renderField('Responsável', auto.responsavel_nome)}
                                        {renderField('CPF', auto.responsavel_cpf)}
                                        {renderField('Função', auto.responsavel_funcao)}
                                    </div>
                                    {auto.estabelecimento_responsavel && renderField('Responsável Legal', auto.estabelecimento_responsavel)}
                                </div>
                            </div>
                        ), '👥')}

                        {/* Assinaturas */}
                        {(auto.assinatura_fiscal || auto.assinatura_responsavel) && renderSection('Assinaturas', (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {auto.assinatura_fiscal && (
                                    <div className="text-center">
                                        <h4 className="font-medium text-gray-800 mb-2">Autoridade Fiscalizadora</h4>
                                        <img 
                                            src={auto.assinatura_fiscal} 
                                            alt="Assinatura do Fiscal" 
                                            className="border border-gray-300 rounded max-h-32 mx-auto"
                                        />
                                    </div>
                                )}
                                {auto.assinatura_responsavel && (
                                    <div className="text-center">
                                        <h4 className="font-medium text-gray-800 mb-2">Responsável do Estabelecimento</h4>
                                        <img 
                                            src={auto.assinatura_responsavel} 
                                            alt="Assinatura do Responsável" 
                                            className="border border-gray-300 rounded max-h-32 mx-auto"
                                        />
                                    </div>
                                )}
                            </div>
                        ), '✍️')}

                        {/* Observações */}
                        {auto.observacoes && renderSection('Observações', (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-900 whitespace-pre-wrap">{auto.observacoes}</p>
                            </div>
                        ), '📄')}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Validação Formal */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ Validação Formal</h3>
                            <div className="space-y-4">
                                <div>
                                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getValidacaoColor(auto.validacao_formal_status)}`}>
                                        {getValidacaoLabel(auto.validacao_formal_status)}
                                    </span>
                                </div>
                                {auto.validado_em && (
                                    <div className="text-sm text-gray-600">
                                        <p>Validado em: {new Date(auto.validado_em).toLocaleString('pt-BR')}</p>
                                        {(auto.validado_por_nome || auto.validado_por) && (
                                            <p>Validado por: {auto.validado_por_nome || auto.validado_por}</p>
                                        )}
                                    </div>
                                )}
                                {(mostrarMotivo || auto.validacao_formal_status === 'erro') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Motivo do Erro Formal
                                        </label>
                                        <textarea
                                            value={validacaoMotivo}
                                            onChange={(e) => setValidacaoMotivo(e.target.value)}
                                            rows={4}
                                            className="w-full border border-gray-300 rounded-md p-3 text-sm"
                                            placeholder="Descreva o erro formal encontrado..."
                                        />
                                    </div>
                                )}
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => {
                                            setMostrarMotivo(false);
                                            handleValidacao('valido');
                                        }}
                                        disabled={validacaoLoading}
                                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60"
                                    >
                                        Aprovar Validação
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!mostrarMotivo) {
                                                setMostrarMotivo(true);
                                                return;
                                            }
                                            handleValidacao('erro');
                                        }}
                                        disabled={validacaoLoading}
                                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60"
                                    >
                                        Registrar Erro Formal
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Informações da Multa */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Penalidade</h3>
                            <div className="space-y-4">
                                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                                    <p className="text-sm text-red-600 font-medium">Valor da Multa</p>
                                    <p className="text-2xl font-bold text-red-800">
                                        {auto.valor_multa_formatado || `R$ ${parseFloat(auto.valor_multa || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                                    </p>
                                </div>
                                
                                {auto.data_notificacao && renderField('Data de Notificação', new Date(auto.data_notificacao).toLocaleDateString('pt-BR'))}
                                {auto.data_vencimento && renderField('Data de Vencimento', new Date(auto.data_vencimento).toLocaleDateString('pt-BR'))}
                            </div>
                        </div>

                        {/* Anexos */}
                        {auto.possui_anexo && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">📎 Anexos</h3>
                                <div className="space-y-2">
                                    {auto.descricao_anexo && (
                                        <p className="text-sm text-gray-600">{auto.descricao_anexo}</p>
                                    )}
                                    <p className="text-xs text-gray-500">Anexos disponíveis no sistema</p>
                                </div>
                            </div>
                        )}

                        {/* Metadados */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Informações do Sistema</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-600">Criado em:</p>
                                    <p className="text-gray-900">
                                        {new Date(auto.criado_em).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Última atualização:</p>
                                    <p className="text-gray-900">
                                        {new Date(auto.atualizado_em).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal de confirmação de exclusão */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="mt-3 text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mt-2">Confirmar Exclusão</h3>
                                <div className="mt-2 px-7 py-3">
                                    <p className="text-sm text-gray-500">
                                        Tem certeza que deseja excluir o Auto de Infração {auto.numero}?
                                        Esta ação não pode ser desfeita.
                                    </p>
                                </div>
                                <div className="items-center px-4 py-3">
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => setShowDeleteModal(false)}
                                            className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 flex-1"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 flex-1"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AutoInfracaoDetailPage;
