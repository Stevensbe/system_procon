import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import processosService from '../../services/processosService';
import HistoricoTimeline from '../../components/processos/HistoricoTimeline';
import DocumentoUploader from '../../components/processos/DocumentoUploader';
import MultaSection from '../../components/processos/MultaSection';

function ProcessoDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [processo, setProcesso] = useState(null);
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [novoStatus, setNovoStatus] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        carregarProcesso();
        carregarDocumentos();
    }, [id]);

    const carregarProcesso = async () => {
        try {
            setLoading(true);
            const response = await processosService.obterProcesso(id);
            setProcesso(response);
        } catch (err) {
            console.error('❌ Erro ao carregar processo:', err);
            setError('Erro ao carregar processo');
        } finally {
            setLoading(false);
        }
    };

    const carregarDocumentos = async () => {
        try {
            const response = await processosService.listarDocumentos(id);
            setDocumentos(response.results || []);
        } catch (err) {
            console.error('❌ Erro ao carregar documentos:', err);
        }
    };

    const handleUpdateStatus = async () => {
        if (!novoStatus) {
            alert('Selecione um novo status');
            return;
        }

        setUpdatingStatus(true);
        try {
            await processosService.alterarStatus(id, novoStatus, observacoes);
            await carregarProcesso(); // Recarregar dados
            setShowStatusModal(false);
            setNovoStatus('');
            setObservacoes('');
            alert('Status atualizado com sucesso!');
        } catch (err) {
            console.error('❌ Erro ao atualizar status:', err);
            alert('Erro ao atualizar status: ' + (err.message || 'Erro desconhecido'));
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getStatusColor = (status) => {
        const cor = processosService.getCorStatus(status);
        return `bg-${cor}-100 text-${cor}-800 border-${cor}-200`;
    };

    const renderField = (label, value, className = '') => (
        <div className={`bg-gray-50 p-3 rounded ${className}`}>
            <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
            <p className="text-gray-900">{value || '-'}</p>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando dossiê do processo...</p>
                </div>
            </div>
        );
    }

    if (error || !processo) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Erro ao carregar</h3>
                    <p className="mt-1 text-sm text-gray-500">{error}</p>
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
                                    Processo {processo.numero_processo}
                                </h1>
                                <p className="text-gray-600 mt-1">{processo.autuado}</p>
                                <div className="mt-2">
                                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(processo.status)}`}>
                                        {processo.status_display || processo.status}
                                    </span>
                                    {processosService.isPrazoVencido(processo.prazo_defesa, processo.status) && (
                                        <span className="ml-2 inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                                            ⚠️ Prazo Vencido há {Math.abs(processosService.calcularDiasRestantes(processo.prazo_defesa))} dias
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowStatusModal(true)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                    Alterar Status
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <Link
                                to="/processos"
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                ← Voltar para Lista de Processos
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna Principal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Dados do Processo */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados do Processo</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderField('Número do Processo', processo.numero_processo)}
                                {renderField('Empresa Autuada', processo.autuado)}
                                {renderField('CNPJ', processo.cnpj)}
                                {renderField('Status', processo.status)}
                                {renderField('Prioridade', processo.prioridade)}
                                {renderField('Data de Abertura', processosService.formatarData(processo.criado_em))}
                                {renderField('Prazo para Defesa', processosService.formatarData(processo.prazo_defesa))}
                                {renderField('Valor da Multa', processosService.formatarValor(processo.valor_multa))}
                            </div>
                        </div>

                        {/* Auto de Infração Relacionado */}
                        {processo.auto_infracao && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Auto de Infração Originário</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {renderField('Natureza da Infração', processo.auto_infracao.relatorio)}
                                    {renderField('Data da Fiscalização', processosService.formatarData(processo.auto_infracao.data_fiscalizacao))}
                                    {renderField('Valor da Multa', processosService.formatarValor(processo.auto_infracao.valor_multa))}
                                    {renderField('Empresa', processo.auto_infracao.razao_social)}
                                    {renderField('CNPJ', processo.auto_infracao.cnpj)}
                                    {renderField('Local', processo.auto_infracao.endereco)}
                                </div>
                                <div className="mt-4">
                                    <Link
                                        to={`/fiscalizacao/infracoes/${processo.auto_infracao.id}`}
                                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                        </svg>
                                        Ver Auto de Infração Completo
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Documentos do Processo */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentos Anexados</h2>
                            
                            {documentos.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum documento anexado</h3>
                                    <p className="mt-1 text-sm text-gray-500">Adicione documentos relevantes ao processo.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {documentos.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="text-2xl">📄</div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {doc.titulo}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {doc.tipo_documento_display}
                                                    </p>
                                                    {doc.descricao && (
                                                        <p className="text-xs text-gray-500">{doc.descricao}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                        Enviado em: {processosService.formatarDataHora(doc.enviado_em)}
                                                    </p>
                                                    {doc.enviado_por && (
                                                        <p className="text-xs text-gray-500">
                                                            Por: {doc.enviado_por_nome}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <a
                                                    href={doc.arquivo}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    Visualizar
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Uploader de Documentos */}
                        <DocumentoUploader
                            processoId={id}
                            onUploadSuccess={() => {
                                carregarDocumentos();
                                alert('Documento enviado com sucesso!');
                            }}
                            onUploadError={(error) => {
                                alert('Erro ao enviar documento: ' + error);
                            }}
                        />

                        {/* Histórico de Tramitação */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <HistoricoTimeline historico={processo.historico || []} />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Informações Rápidas */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Rápidas</h3>
                            <div className="space-y-3">
                                {renderField('Data de Criação', processosService.formatarDataHora(processo.criado_em))}
                                {renderField('Data Atualização', processosService.formatarDataHora(processo.atualizado_em))}
                                {processo.prazo_defesa && renderField('Prazo para Defesa', processosService.formatarData(processo.prazo_defesa))}
                                {processo.prazo_recurso && renderField('Prazo para Recurso', processosService.formatarData(processo.prazo_recurso))}
                                {processo.valor_multa && renderField('Valor da Multa', processosService.formatarValor(processo.valor_multa))}
                                {processo.valor_final && renderField('Valor Final', processosService.formatarValor(processo.valor_final))}
                                {processo.analista_responsavel && renderField('Analista Responsável', processo.analista_responsavel)}
                                {processo.fiscal_responsavel && renderField('Fiscal Responsável', processo.fiscal_responsavel)}
                            </div>
                        </div>

                        {/* Estatísticas */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Documentos:</span>
                                    <span className="text-sm font-medium">{documentos.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Histórico:</span>
                                    <span className="text-sm font-medium">{processo.historico?.length || 0} eventos</span>
                                </div>
                                {processo.tempo_tramitacao && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Tempo de tramitação:</span>
                                        <span className="text-sm font-medium">{processo.tempo_tramitacao} dias</span>
                                    </div>
                                )}
                                {processo.status === 'aguardando_defesa' && processo.prazo_defesa && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Dias restantes:</span>
                                        <span className={`text-sm font-medium ${processosService.isPrazoVencido(processo.prazo_defesa, processo.status) ? 'text-red-600' : 'text-blue-600'}`}>
                                            {processosService.isPrazoVencido(processo.prazo_defesa, processo.status) 
                                                ? `Vencido há ${Math.abs(processosService.calcularDiasRestantes(processo.prazo_defesa))} dias`
                                                : `${processosService.calcularDiasRestantes(processo.prazo_defesa)} dias`
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Seção de Multas */}
                        <MultaSection processoId={processo.id} />
                    </div>
                </div>

                {/* Modal de Alteração de Status */}
                {showStatusModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <h3 className="text-lg font-medium text-gray-900 text-center">Alterar Status do Processo</h3>
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Novo Status</label>
                                        <select
                                            value={novoStatus}
                                            onChange={(e) => setNovoStatus(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="aguardando_defesa">Aguardando Defesa</option>
                                            <option value="defesa_apresentada">Defesa Apresentada</option>
                                            <option value="em_analise">Em Análise</option>
                                            <option value="aguardando_recurso">Aguardando Recurso</option>
                                            <option value="recurso_apresentado">Recurso Apresentado</option>
                                            <option value="julgamento">Em Julgamento</option>
                                            <option value="finalizado_procedente">Finalizado - Procedente</option>
                                            <option value="finalizado_improcedente">Finalizado - Improcedente</option>
                                            <option value="arquivado">Arquivado</option>
                                            <option value="prescrito">Prescrito</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                        <textarea
                                            value={observacoes}
                                            onChange={(e) => setObservacoes(e.target.value)}
                                            placeholder="Motivo da alteração ou observações..."
                                            rows={3}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>
                                <div className="flex space-x-3 mt-6">
                                    <button
                                        onClick={() => setShowStatusModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleUpdateStatus}
                                        disabled={updatingStatus || !novoStatus}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                                    >
                                        {updatingStatus ? 'Atualizando...' : 'Confirmar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProcessoDetailPage;