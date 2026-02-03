import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import processosService from '../../services/processosService';
import HistoricoTimeline from '../../components/processos/HistoricoTimeline';
import DocumentoUploader from '../../components/processos/DocumentoUploader';
import MultaSection from '../../components/processos/MultaSection';
import tramitacaoService from '../../services/tramitacaoService';
import peticionamentoService from '../../services/peticionamentoService';
import { cobrancaService } from '../../services/cobrancaService';

function ProcessoDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const tramitarAutoOpen = useRef(false);
    const [processo, setProcesso] = useState(null);
    const [documentos, setDocumentos] = useState([]);
    const [pareceres, setPareceres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [novoStatus, setNovoStatus] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showParecerModal, setShowParecerModal] = useState(false);
    const [parecerEditId, setParecerEditId] = useState(null);
    const [parecerSaving, setParecerSaving] = useState(false);
    const [tramitarEnviando, setTramitarEnviando] = useState(false);
    const [tramitarErro, setTramitarErro] = useState('');
    const [tramitarSucesso, setTramitarSucesso] = useState('');
    const [showTramitarModal, setShowTramitarModal] = useState(false);
    const [setoresDisponiveis, setSetoresDisponiveis] = useState([]);
    const [setoresCarregando, setSetoresCarregando] = useState(false);
    const [usuariosDisponiveis, setUsuariosDisponiveis] = useState([]);
    const [usuariosCarregando, setUsuariosCarregando] = useState(false);
    const [tramitarForm, setTramitarForm] = useState({
        destinoTipo: 'setor',
        setorDestinoId: '',
        destinatarioId: '',
        motivo: '',
        observacoes: '',
        prazoDias: '',
        arquivo: null,
    });
    const [dosimetriaArquivo, setDosimetriaArquivo] = useState(null);
    const [dosimetriaErro, setDosimetriaErro] = useState('');
    const [dosimetriaSucesso, setDosimetriaSucesso] = useState('');
    const [dosimetriaInfo, setDosimetriaInfo] = useState(null);
    const [dosimetriaEnviando, setDosimetriaEnviando] = useState(false);
    const [despachoObservacao, setDespachoObservacao] = useState('');
    const [despachoArquivo, setDespachoArquivo] = useState(null);
    const [despachoPrazoDias, setDespachoPrazoDias] = useState(15);
    const [despachoEnviando, setDespachoEnviando] = useState(false);
    const [despachoErro, setDespachoErro] = useState('');
    const [despachoSucesso, setDespachoSucesso] = useState('');
    const [grmEnviando, setGrmEnviando] = useState(false);
    const [grmErro, setGrmErro] = useState('');
    const [grmSucesso, setGrmSucesso] = useState('');
    const [parecerForm, setParecerForm] = useState({
        sintese_fatica: '',
        parecer: '',
        decisao: '',
        elaborado_por_nome: '',
        cargo_elaborador: ''
    });

    useEffect(() => {
        carregarProcesso();
        carregarDocumentos();
        carregarPareceres();
    }, [id]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('tramitar') === '1' && !tramitarAutoOpen.current) {
            tramitarAutoOpen.current = true;
            abrirTramitarModal();
        }
    }, [location.search]);

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

    const carregarPareceres = async () => {
        try {
            const response = await processosService.listarPareceres(id);
            setPareceres(response.results || response || []);
        } catch (err) {
            console.error('❌ Erro ao carregar pareceres:', err);
        }
    };

    const handleDosimetriaChange = (event) => {
        const arquivo = event.target.files?.[0] || null;
        setDosimetriaArquivo(arquivo);
        setDosimetriaErro('');
        setDosimetriaSucesso('');
        setDosimetriaInfo(null);
    };

    const importarDosimetria = async () => {
        if (!dosimetriaArquivo) {
            setDosimetriaErro('Selecione o arquivo Excel da dosimetria (.xlsx).');
            return;
        }

        const nome = dosimetriaArquivo.name.toLowerCase();
        if (!nome.endsWith('.xlsx')) {
            setDosimetriaErro('Use o arquivo no formato .xlsx.');
            return;
        }

        setDosimetriaEnviando(true);
        setDosimetriaErro('');
        setDosimetriaSucesso('');
        setDosimetriaInfo(null);
        try {
            const resp = await processosService.registrarDosimetriaExcel(id, dosimetriaArquivo);
            await carregarProcesso();
            await carregarDocumentos();
            const fonte = resp?.sheet && resp?.celula ? `${resp.sheet}!${resp.celula}` : resp?.sheet || '';
            setDosimetriaSucesso(
                `Dosimetria importada com sucesso. Valor da multa atualizado.${fonte ? ` Fonte: ${fonte}.` : ''}`
            );
            setDosimetriaInfo(resp);
            setDosimetriaArquivo(null);
        } catch (err) {
            const mensagem =
                err?.response?.data?.detail ||
                err?.message ||
                'Erro ao importar dosimetria.';
            setDosimetriaErro(mensagem);
        } finally {
            setDosimetriaEnviando(false);
        }
    };

    const podeDespacharDaf = ['finalizado_procedente', 'aguardando_recurso', 'recurso_apresentado', 'julgamento'].includes(
        (processo?.status || '').toLowerCase()
    );

    const despacharParaDaf = async () => {
        if (!podeDespacharDaf) {
            setDespachoErro('O despacho ao DAF so e permitido apos decisao procedente.');
            return;
        }

        setDespachoEnviando(true);
        setDespachoErro('');
        setDespachoSucesso('');
        try {
            const resp = await processosService.despacharParaDaf(id, {
                observacao: despachoObservacao,
                prazo_dias: despachoPrazoDias,
                arquivo: despachoArquivo,
            });
            await carregarProcesso();
            await carregarDocumentos();

            const protocolo = resp?.protocolo ? ` Protocolo: ${resp.protocolo}.` : '';
            setDespachoSucesso(`Despacho ao DAF registrado com sucesso.${protocolo}`);
            setDespachoArquivo(null);
        } catch (err) {
            const mensagem =
                err?.response?.data?.detail ||
                err?.message ||
                'Erro ao registrar despacho ao DAF.';
            setDespachoErro(mensagem);
        } finally {
            setDespachoEnviando(false);
        }
    };

    const baixarGrmDocx = async () => {
        setGrmEnviando(true);
        setGrmErro('');
        setGrmSucesso('');
        try {
            const lista = await cobrancaService.getGrms({ filters: { processo: id } });
            const grms = lista?.results || lista || [];
            if (!grms.length) {
                throw new Error('Nenhuma GRM encontrada para este processo.');
            }
            const grm = grms[0];
            const blob = await cobrancaService.gerarGrmDocx(grm.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const numero = (grm.numero_guia || 'GRM').replace('/', '_');
            link.href = url;
            link.setAttribute('download', `GRM_${numero}.docx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setGrmSucesso(`DOCX da GRM ${grm.numero_guia || ''} gerado com sucesso.`);
        } catch (err) {
            const mensagem =
                err?.message ||
                'Nao foi possivel gerar o DOCX da GRM.';
            setGrmErro(mensagem);
        } finally {
            setGrmEnviando(false);
        }
    };

    const abrirNovoParecer = () => {
        setParecerEditId(null);
        setParecerForm({
            sintese_fatica: '',
            parecer: '',
            decisao: '',
            elaborado_por_nome: '',
            cargo_elaborador: ''
        });
        setShowParecerModal(true);
    };

    const abrirEditarParecer = (parecer) => {
        setParecerEditId(parecer.id);
        setParecerForm({
            sintese_fatica: parecer.sintese_fatica || '',
            parecer: parecer.parecer || '',
            decisao: parecer.decisao || '',
            elaborado_por_nome: parecer.elaborado_por_nome || parecer.elaborado_por_display || '',
            cargo_elaborador: parecer.cargo_elaborador || ''
        });
        setShowParecerModal(true);
    };

    const salvarParecer = async () => {
        if (!parecerForm.parecer.trim() || !parecerForm.decisao.trim()) {
            alert('Preencha os campos obrigatórios do parecer.');
            return;
        }

        setParecerSaving(true);
        try {
            if (parecerEditId) {
                await processosService.atualizarParecer(parecerEditId, parecerForm);
            } else {
                await processosService.criarParecer(id, parecerForm);
            }
            await carregarPareceres();
            setShowParecerModal(false);
            setParecerEditId(null);
            alert('Parecer salvo com sucesso!');
        } catch (err) {
            console.error('❌ Erro ao salvar parecer:', err);
            alert('Erro ao salvar parecer: ' + (err.message || 'Erro desconhecido'));
        } finally {
            setParecerSaving(false);
        }
    };

    const excluirParecer = async (parecerId) => {
        if (!window.confirm('Deseja excluir este parecer?')) {
            return;
        }
        try {
            await processosService.excluirParecer(parecerId);
            await carregarPareceres();
            alert('Parecer excluído com sucesso!');
        } catch (err) {
            console.error('❌ Erro ao excluir parecer:', err);
            alert('Erro ao excluir parecer: ' + (err.message || 'Erro desconhecido'));
        }
    };

    const baixarParecer = async (parecerId, formato) => {
        try {
            const response = formato === 'pdf'
                ? await processosService.baixarParecerPdf(parecerId)
                : await processosService.baixarParecerDocx(parecerId);
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', formato === 'pdf' ? `parecer_${parecerId}.pdf` : `parecer_${parecerId}.docx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('❌ Erro ao baixar parecer:', err);
            alert('Erro ao baixar parecer: ' + (err.message || 'Erro desconhecido'));
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

    const normalizarTexto = (valor) =>
        (valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '');

    const setorEhPermitido = (setor) => {
        const chave = normalizarTexto(`${setor?.sigla || ''} ${setor?.nome || ''}`);
        const tokens = [
            'JURIDICO1',
            'JUR1',
            'JURIDICO2',
            'JUR2',
            'FISCALIZACAO',
            'FISC',
            'DAF',
            'TI',
            'DIRETORIATECNICA',
            'DT',
            'GABINETE',
        ];
        return tokens.some((token) => chave.includes(token));
    };

    const carregarSetores = async () => {
        setSetoresCarregando(true);
        try {
            const resp = await tramitacaoService.listarSetores();
            const lista = resp?.results || resp || [];
            const filtrados = lista.filter(setorEhPermitido);
            setSetoresDisponiveis(filtrados);
        } catch (err) {
            console.error('❌ Erro ao carregar setores:', err);
        } finally {
            setSetoresCarregando(false);
        }
    };

    const carregarUsuarios = async (setorNome = '') => {
        setUsuariosCarregando(true);
        try {
            const lista = await peticionamentoService.listarUsuariosAtivos(true, setorNome);
            setUsuariosDisponiveis(lista || []);
        } catch (err) {
            console.error('❌ Erro ao carregar usuários:', err);
            setUsuariosDisponiveis([]);
        } finally {
            setUsuariosCarregando(false);
        }
    };

    const abrirTramitarModal = async () => {
        setShowTramitarModal(true);
        setTramitarErro('');
        setTramitarSucesso('');
        if (setoresDisponiveis.length === 0 && !setoresCarregando) {
            await carregarSetores();
        }
    };

    const tramitarProcesso = async () => {
        if (!tramitarForm.setorDestinoId) {
            setTramitarErro('Selecione o setor de destino.');
            return;
        }
        if (tramitarForm.destinoTipo === 'usuario' && !tramitarForm.destinatarioId) {
            setTramitarErro('Selecione o destinatário.');
            return;
        }
        setTramitarEnviando(true);
        setTramitarErro('');
        setTramitarSucesso('');
        try {
            const payloadBase = {
                setor_destino_id: tramitarForm.setorDestinoId,
                motivo: tramitarForm.motivo || 'Encaminhamento do processo.',
                observacoes: tramitarForm.observacoes || '',
                prazo_dias: tramitarForm.prazoDias || undefined,
            };
            if (tramitarForm.destinoTipo === 'usuario') {
                payloadBase.destinatario_id = tramitarForm.destinatarioId;
            }

            let payload = payloadBase;
            if (tramitarForm.arquivo) {
                const formData = new FormData();
                Object.keys(payloadBase).forEach((key) => {
                    if (payloadBase[key] !== undefined && payloadBase[key] !== '') {
                        formData.append(key, payloadBase[key]);
                    }
                });
                formData.append('arquivo', tramitarForm.arquivo);
                payload = formData;
            }

            const resp = await processosService.tramitarProcesso(id, payload);
            await carregarProcesso();
            const protocolo = resp?.protocolo ? ` Protocolo: ${resp.protocolo}.` : '';
            setTramitarSucesso(`Processo tramitado com sucesso.${protocolo}`);
            setShowTramitarModal(false);
            setTramitarForm({
                destinoTipo: 'setor',
                setorDestinoId: '',
                destinatarioId: '',
                motivo: '',
                observacoes: '',
                prazoDias: '',
                arquivo: null,
            });
            setUsuariosDisponiveis([]);
        } catch (err) {
            const mensagem =
                err?.response?.data?.detail ||
                err?.message ||
                'Erro ao tramitar processo.';
            setTramitarErro(mensagem);
        } finally {
            setTramitarEnviando(false);
        }
    };

    const setorSelecionado = setoresDisponiveis.find(
        (setor) => String(setor.id) === String(tramitarForm.setorDestinoId)
    );

    useEffect(() => {
        if (tramitarForm.destinoTipo !== 'usuario') {
            return;
        }
        if (setorSelecionado?.nome) {
            carregarUsuarios(setorSelecionado.nome);
        } else {
            setUsuariosDisponiveis([]);
        }
    }, [tramitarForm.destinoTipo, tramitarForm.setorDestinoId]);

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

    const autoInfracao = processo?.auto_infracao_detalhes || null;

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
                                <button
                                    onClick={abrirTramitarModal}
                                    disabled={tramitarEnviando}
                                    className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M13 5l7 7-7 7"></path>
                                    </svg>
                                    {tramitarEnviando ? 'Tramitando...' : 'Tramitar Processo'}
                                </button>
                            </div>
                        </div>

                        {(tramitarErro || tramitarSucesso) && (
                            <div className="mt-4 space-y-2">
                                {tramitarErro && (
                                    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                                        {tramitarErro}
                                    </div>
                                )}
                                {tramitarSucesso && (
                                    <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-3">
                                        {tramitarSucesso}
                                    </div>
                                )}
                            </div>
                        )}

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

                        {/* Dosimetria (Excel) */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Dosimetria da Multa (Excel)</h2>
                                    <p className="text-sm text-gray-600">
                                        Envie o Excel de dosimetria (individual ou coletiva) para atualizar o valor da multa.
                                    </p>
                                </div>
                                {processo.valor_multa && (
                                    <div className="text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                        Valor atual: <strong>{processosService.formatarValor(processo.valor_multa)}</strong>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                                <input
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleDosimetriaChange}
                                    className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md p-2"
                                />
                                <button
                                    onClick={importarDosimetria}
                                    disabled={dosimetriaEnviando}
                                    className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
                                >
                                    {dosimetriaEnviando ? 'Importando...' : 'Importar Dosimetria'}
                                </button>
                            </div>

                            {dosimetriaErro && (
                                <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                                    {dosimetriaErro}
                                </div>
                            )}
                            {dosimetriaSucesso && (
                                <div className="mt-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-3">
                                    {dosimetriaSucesso}
                                </div>
                            )}

                            {dosimetriaInfo?.valor_multa && (
                                <div className="mt-3 text-xs text-gray-600">
                                    Valor identificado na planilha: <strong>{processosService.formatarValor(dosimetriaInfo.valor_multa)}</strong>
                                </div>
                            )}
                        </div>

                        {/* Despacho para DAF */} 
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Despacho para DAF (GRM)</h2>
                                    <p className="text-sm text-gray-600">
                                        Encaminha manualmente o processo ao DAF e anexa o despacho como documento.
                                    </p>
                                </div>
                                <div className={`text-xs font-semibold px-3 py-2 rounded border ${
                                    podeDespacharDaf
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}>
                                    {podeDespacharDaf ? 'Pronto para despacho' : 'Aguardando decisao procedente'}
                                </div>
                            </div>

                            {!podeDespacharDaf && (
                                <div className="mb-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
                                    O despacho ao DAF so deve ocorrer apos decisao procedente (ou equivalente).
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3">
                                <textarea
                                    value={despachoObservacao}
                                    onChange={(e) => setDespachoObservacao(e.target.value)}
                                    rows={3}
                                    placeholder="Observacoes para o DAF (ex: emitir GRM e notificar com decisao)..."
                                    className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md p-2"
                                />
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Anexar despacho (DOC/DOCX/PDF)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".doc,.docx,.pdf"
                                        onChange={(e) => setDespachoArquivo(e.target.files?.[0] || null)}
                                        className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md p-2"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-[200px_auto] gap-3 items-center">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Prazo (dias)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={despachoPrazoDias}
                                            onChange={(e) => setDespachoPrazoDias(Number(e.target.value) || 15)}
                                            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md p-2"
                                        />
                                    </div>
                                    <div className="md:pt-5 flex flex-wrap gap-2">
                                        <button
                                            onClick={despacharParaDaf}
                                            disabled={!podeDespacharDaf || despachoEnviando}
                                            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                                        >
                                            {despachoEnviando ? 'Despachando...' : 'Despachar para DAF'}
                                        </button>
                                        <button
                                            onClick={baixarGrmDocx}
                                            disabled={grmEnviando}
                                            className="inline-flex items-center justify-center px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:opacity-60"
                                        >
                                            {grmEnviando ? 'Gerando...' : 'Gerar DOCX'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {despachoErro && (
                                <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                                    {despachoErro}
                                </div>
                            )}
                            {despachoSucesso && (
                                <div className="mt-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-3">
                                    {despachoSucesso}
                                </div>
                            )}
                            {grmErro && (
                                <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                                    {grmErro}
                                </div>
                            )}
                            {grmSucesso && (
                                <div className="mt-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-3">
                                    {grmSucesso}
                                </div>
                            )}
                        </div>

                        {/* Auto de Infração Relacionado */}
                        {autoInfracao && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Auto de Infração Originário</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {renderField('Natureza da Infração', autoInfracao.relatorio)}
                                    {renderField('Data da Fiscalização', processosService.formatarData(autoInfracao.data_fiscalizacao))}
                                    {renderField('Valor da Multa', processosService.formatarValor(autoInfracao.valor_multa))}
                                    {renderField('Empresa', autoInfracao.razao_social)}
                                    {renderField('CNPJ', autoInfracao.cnpj)}
                                    {renderField('Local', autoInfracao.endereco)}
                                </div>
                                <div className="mt-4">
                                    <Link
                                        to={`/fiscalizacao/infracoes/${autoInfracao.id}`}
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

                        {/* Parecer Técnico (Opcional) */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Parecer Técnico</h2>
                                <button
                                    onClick={abrirNovoParecer}
                                    className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Adicionar Parecer
                                </button>
                            </div>

                            {pareceres.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-sm text-gray-500">Nenhum parecer cadastrado.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pareceres.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    Parecer {item.numero_parecer}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    Elaborado por: {item.elaborado_por_display || 'Não informado'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Criado em: {processosService.formatarDataHora(item.criado_em)}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={() => baixarParecer(item.id, 'docx')}
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    DOCX
                                                </button>
                                                <button
                                                    onClick={() => baixarParecer(item.id, 'pdf')}
                                                    className="text-purple-600 hover:text-purple-800 text-sm"
                                                >
                                                    PDF
                                                </button>
                                                <button
                                                    onClick={() => abrirEditarParecer(item)}
                                                    className="text-amber-600 hover:text-amber-800 text-sm"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => excluirParecer(item.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Excluir
                                                </button>
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

                {/* Modal de Parecer Técnico */}
                {showParecerModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-16 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {parecerEditId ? 'Editar Parecer Técnico' : 'Adicionar Parecer Técnico'}
                                </h3>
                                <button
                                    onClick={() => setShowParecerModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        I - Síntese Fática
                                    </label>
                                    <textarea
                                        value={parecerForm.sintese_fatica}
                                        onChange={(e) => setParecerForm({ ...parecerForm, sintese_fatica: e.target.value })}
                                        rows={4}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="Relato cronológico dos fatos..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        II - Parecer *
                                    </label>
                                    <textarea
                                        value={parecerForm.parecer}
                                        onChange={(e) => setParecerForm({ ...parecerForm, parecer: e.target.value })}
                                        rows={4}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="Análise técnica e jurídica..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        III - Decisão *
                                    </label>
                                    <textarea
                                        value={parecerForm.decisao}
                                        onChange={(e) => setParecerForm({ ...parecerForm, decisao: e.target.value })}
                                        rows={3}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="Conclusão e recomendação final..."
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Elaborado por
                                        </label>
                                        <input
                                            type="text"
                                            value={parecerForm.elaborado_por_nome}
                                            onChange={(e) => setParecerForm({ ...parecerForm, elaborado_por_nome: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            placeholder="Nome do responsável"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Cargo
                                        </label>
                                        <input
                                            type="text"
                                            value={parecerForm.cargo_elaborador}
                                            onChange={(e) => setParecerForm({ ...parecerForm, cargo_elaborador: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            placeholder="Cargo do responsável"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={() => setShowParecerModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={salvarParecer}
                                    disabled={parecerSaving}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-gray-400"
                                >
                                    {parecerSaving ? 'Salvando...' : 'Salvar Parecer'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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

                {/* Modal de Tramitação */}
                {showTramitarModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Tramitar Processo</h3>
                                <button
                                    onClick={() => setShowTramitarModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Setor de Destino *
                                    </label>
                                    <select
                                        value={tramitarForm.setorDestinoId}
                                        onChange={(e) =>
                                            setTramitarForm({
                                                ...tramitarForm,
                                                setorDestinoId: e.target.value,
                                                destinatarioId: '',
                                            })
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        disabled={setoresCarregando}
                                    >
                                        <option value="">Selecione...</option>
                                        {setoresDisponiveis.map((setor) => (
                                            <option key={setor.id} value={setor.id}>
                                                {setor.sigla ? `${setor.sigla} - ` : ''}{setor.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Destino
                                    </label>
                                    <div className="flex items-center space-x-4 text-sm text-gray-700">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="destinoTipo"
                                                value="setor"
                                                checked={tramitarForm.destinoTipo === 'setor'}
                                                onChange={() => setTramitarForm({ ...tramitarForm, destinoTipo: 'setor', destinatarioId: '' })}
                                                className="mr-2"
                                            />
                                            Caixa do Setor
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="destinoTipo"
                                                value="usuario"
                                                checked={tramitarForm.destinoTipo === 'usuario'}
                                                onChange={() => setTramitarForm({ ...tramitarForm, destinoTipo: 'usuario' })}
                                                className="mr-2"
                                            />
                                            Caixa Pessoal
                                        </label>
                                    </div>
                                </div>

                                {tramitarForm.destinoTipo === 'usuario' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Destinatário *
                                        </label>
                                        <select
                                            value={tramitarForm.destinatarioId}
                                            onChange={(e) => setTramitarForm({ ...tramitarForm, destinatarioId: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            disabled={usuariosCarregando}
                                        >
                                            <option value="">Selecione...</option>
                                            {usuariosDisponiveis.map((usuario) => (
                                                <option key={usuario.id} value={usuario.id}>
                                                    {[usuario.first_name, usuario.last_name].filter(Boolean).join(' ') || usuario.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                                    <input
                                        type="text"
                                        value={tramitarForm.motivo}
                                        onChange={(e) => setTramitarForm({ ...tramitarForm, motivo: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="Encaminhamento do processo..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                    <textarea
                                        value={tramitarForm.observacoes}
                                        onChange={(e) => setTramitarForm({ ...tramitarForm, observacoes: e.target.value })}
                                        rows={3}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="Observações adicionais..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo (dias)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={tramitarForm.prazoDias}
                                        onChange={(e) => setTramitarForm({ ...tramitarForm, prazoDias: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        placeholder="Ex: 10"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Anexar documento (DOC/DOCX/PDF)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".doc,.docx,.pdf"
                                        onChange={(e) => setTramitarForm({ ...tramitarForm, arquivo: e.target.files?.[0] || null })}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>

                            {tramitarErro && (
                                <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                                    {tramitarErro}
                                </div>
                            )}

                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={() => setShowTramitarModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={tramitarProcesso}
                                    disabled={tramitarEnviando}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-gray-400"
                                >
                                    {tramitarEnviando ? 'Tramitando...' : 'Confirmar Tramitação'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProcessoDetailPage;
