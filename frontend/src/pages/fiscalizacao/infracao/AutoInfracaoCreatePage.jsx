import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { criarAutoInfracao } from '../../../services/fiscalizacaoService';
import SignaturePad from "../../../components/shared/SignaturePad";

function AutoInfracaoCreatePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [autoData, setAutoData] = useState({
        // === DADOS BÁSICOS ===
        data_fiscalizacao: new Date().toISOString().split('T')[0],
        hora_fiscalizacao: new Date().toTimeString().split(' ')[0].substring(0, 5),
        municipio: 'MANAUS',
        estado: 'AM',
        
        // === DADOS DO ESTABELECIMENTO ===
        razao_social: '',
        nome_fantasia: '',
        atividade: '',
        endereco: '',
        cep: '',
        cnpj: '',
        telefone: '',
        
        // === ORIGEM / PARECER ===
        auto_tipo: '',
        auto_id: '',
        auto_constatacao_numero: '',
        notificacao_numero: '',
        parecer_numero: '',
        parecer_origem: 'FISCALIZAÇÃO/PROCON/AM',
        texto_origem: '',
        
        // === RELATÓRIO E BASE LEGAL ===
        relatorio: '',
        base_legal_cdc: '',
        base_legal_outras: '',
        
        // === INFRAÇÕES ESPECÍFICAS ===
        infracao_art_34: false,
        infracao_art_35: false,
        infracao_art_36: false,
        infracao_art_55: false,
        infracao_art_56: false,
        infracao_publicidade_enganosa: false,
        infracao_precos_abusivos: false,
        infracao_produtos_vencidos: false,
        infracao_falta_informacao: false,
        outras_infracoes: '',
        
        // === FUNDAMENTAÇÃO ===
        fundamentacao_tecnica: '',
        fundamentacao_juridica: '',
        
        // === VALOR DA MULTA ===
        valor_multa: '',
        
        // === RESPONSÁVEIS ===
        responsavel_nome: '',
        responsavel_cpf: '',
        responsavel_funcao: '',
        fiscal_nome: '',
        fiscal_cargo: 'Agente de Fiscalização',
        estabelecimento_responsavel: '',
        
        // === DATAS ===
        data_notificacao: '',
        data_vencimento: '',
        
        // === STATUS ===
        status: 'autuado',
        
        // === ANEXOS ===
        possui_anexo: false,
        descricao_anexo: '',
        
        // === OBSERVAÇÕES ===
        observacoes: ''
    });

    const preencherComAutoConstatacao = (autoConstatacao, tipoAuto) => {
        if (!autoConstatacao) {
            return;
        }

        const tipoMap = {
            banco: 'autobanco',
            posto: 'autoposto',
            supermercado: 'autosupermercado',
            diversos: 'autodiversos',
        };

        setAutoData(prev => ({
            ...prev,
            auto_tipo: tipoMap[tipoAuto] || prev.auto_tipo,
            auto_id: autoConstatacao.id || prev.auto_id,
            data_fiscalizacao: autoConstatacao.data_fiscalizacao || prev.data_fiscalizacao,
            hora_fiscalizacao: autoConstatacao.hora_fiscalizacao || prev.hora_fiscalizacao,
            municipio: autoConstatacao.municipio || prev.municipio,
            estado: autoConstatacao.estado || prev.estado,
            razao_social: autoConstatacao.razao_social || prev.razao_social,
            nome_fantasia: autoConstatacao.nome_fantasia || prev.nome_fantasia,
            atividade: autoConstatacao.atividade || prev.atividade,
            endereco: autoConstatacao.endereco || prev.endereco,
            cep: autoConstatacao.cep || prev.cep,
            cnpj: autoConstatacao.cnpj || prev.cnpj,
            telefone: autoConstatacao.telefone || prev.telefone,
            responsavel_nome: autoConstatacao.responsavel_nome || prev.responsavel_nome,
            responsavel_cpf: autoConstatacao.responsavel_cpf || prev.responsavel_cpf,
            estabelecimento_responsavel: autoConstatacao.estabelecimento_responsavel || prev.estabelecimento_responsavel,
            auto_constatacao_numero: autoConstatacao.numero || prev.auto_constatacao_numero,
        }));
    };

    useEffect(() => {
        const autoConstatacao = location.state?.autoConstatacao;
        const tipoAuto = location.state?.tipoAuto;
        if (autoConstatacao) {
            preencherComAutoConstatacao(autoConstatacao, tipoAuto);
        }
    }, [location.state]);

    // Estados para assinaturas
    const [signatures, setSignatures] = useState({
        assinatura_fiscal: '',
        assinatura_responsavel: ''
    });


    const handleAutoChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            setAutoData(prev => ({ ...prev, [name]: checked }));
        } else {
            setAutoData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Handlers para assinaturas
    const handleSignatureChange = (name, signatureData) => {
        setSignatures(prev => ({
            ...prev,
            [name]: signatureData
        }));
    };

    // Função para converter base64 para File
    const base64ToFile = (base64Data, filename) => {
        try {
            if (!base64Data || typeof base64Data !== 'string') {
                return null;
            }
            
            if (!base64Data.includes('data:image/')) {
                return null;
            }
            
            const arr = base64Data.split(',');
            if (arr.length !== 2) {
                throw new Error('Formato base64 inválido');
            }
            
            const mime = arr[0].match(/:(.*?);/)?.[1];
            if (!mime) {
                throw new Error('MIME type não encontrado');
            }
            
            const bstr = atob(arr[1]);
            const n = bstr.length;
            const u8arr = new Uint8Array(n);
            
            for (let i = 0; i < n; i++) {
                u8arr[i] = bstr.charCodeAt(i);
            }
            
            return new File([u8arr], filename, { type: mime });
        } catch (error) {
            console.error(`Erro ao converter assinatura ${filename}:`, error);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validação básica
        if (!autoData.razao_social || !autoData.cnpj || !autoData.relatorio) {
            setError('Preencha todos os campos obrigatórios');
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            
            // Adicionar todos os campos do formulário
            Object.keys(autoData).forEach(key => {
                const value = autoData[key];
                
                if ((key === 'auto_tipo' || key === 'auto_id') && !value) {
                    return;
                }

                if (typeof value === 'boolean') {
                    formData.append(key, value ? 'true' : 'false');
                } else if (value !== null && value !== undefined) {
                    formData.append(key, String(value));
                }
            });
            
            // Adicionar assinaturas
            Object.keys(signatures).forEach(signatureKey => {
                if (signatures[signatureKey]) {
                    const signatureFile = base64ToFile(
                        signatures[signatureKey], 
                        `${signatureKey}.png`
                    );
                    if (signatureFile) {
                        formData.append(signatureKey, signatureFile);
                    }
                }
            });
            
            const response = await criarAutoInfracao(formData);
            
            alert(`Auto de Infração "${response.numero}" criado com sucesso!`);
            navigate('/fiscalizacao/infracoes');
            
        } catch (err) {
            console.error('Erro ao salvar:', err);
            setError(err.message || 'Ocorreu um erro ao salvar o auto de infração.');
        } finally {
            setLoading(false);
        }
    };

    const renderTextField = (name, label, type = 'text', required = false, maxLength = null) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input 
                type={type} 
                id={name} 
                name={name} 
                value={autoData[name]} 
                onChange={handleAutoChange} 
                required={required}
                maxLength={maxLength}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500" 
            />
        </div>
    );

    const renderTextArea = (name, label, rows = 3, required = false) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea 
                id={name} 
                name={name} 
                value={autoData[name]} 
                onChange={handleAutoChange} 
                required={required}
                rows={rows}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500" 
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-red-600 px-6 py-4">
                        <h1 className="text-2xl font-bold text-white">Novo Auto de Infração</h1>
                        <p className="text-red-100 mt-1">
                            Número: <span className="font-mono bg-red-700 px-2 py-1 rounded text-sm">Gerado Automaticamente</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        {/* === DADOS BÁSICOS === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm mr-2">1</span>
                                Dados Básicos
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {renderTextField('data_fiscalizacao', 'Data da Fiscalização', 'date', true)}
                                {renderTextField('hora_fiscalizacao', 'Hora da Fiscalização', 'time', true)}
                                {renderTextField('municipio', 'Município', 'text', true)}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                                    <input 
                                        type="text" 
                                        value="AMAZONAS" 
                                        disabled 
                                        className="mt-1 block w-full p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* === DADOS DO ESTABELECIMENTO === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm mr-2">2</span>
                                Dados do Estabelecimento
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {renderTextField('razao_social', 'Razão Social', 'text', true, 255)}
                                {renderTextField('nome_fantasia', 'Nome Fantasia', 'text', false, 255)}
                                {renderTextField('atividade', 'Atividade', 'text', true, 255)}
                                {renderTextField('endereco', 'Endereço', 'text', true, 500)}
                                {renderTextField('cep', 'CEP', 'text', false, 10)}
                                {renderTextField('cnpj', 'CNPJ', 'text', true, 18)}
                                {renderTextField('telefone', 'Telefone', 'tel', false, 20)}
                            </div>
                        </div>

                        {/* === ORIGEM DO AUTO === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm mr-2">3</span>
                                Origem do Auto
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderTextField('auto_constatacao_numero', 'Auto de Constatação Nº', 'text', false, 20)}
                                {renderTextField('notificacao_numero', 'Notificação Nº', 'text', false, 20)}
                                {renderTextField('parecer_numero', 'Número do Parecer', 'text', false, 50)}
                                {renderTextField('parecer_origem', 'Origem do Parecer', 'text', false, 100)}
                                {renderTextField('valor_multa', 'Valor da Multa (R$)', 'number', false)}
                            </div>
                            <div className="mt-4">
                                {renderTextArea(
                                    'texto_origem',
                                    'Texto de Origem (introdução antes do relatório)',
                                    4,
                                    false
                                )}
                            </div>
                        </div>

                        {/* === RELATÓRIO === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm mr-2">4</span>
                                Relatório
                            </h2>
                            {renderTextArea('relatorio', 'Relatório Detalhado', 8, true)}
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800">
                                    <strong>Orientação:</strong> Descreva detalhadamente os fatos constatados durante a fiscalização, 
                                    incluindo evidências, testemunhas e circunstâncias relevantes para a autuação.
                                </p>
                            </div>
                        </div>

                        {/* === RESPONSÁVEIS === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm mr-2">5</span>
                                Responsáveis
                            </h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-md font-medium text-gray-800 mb-3">Autoridade Fiscalizadora</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {renderTextField('fiscal_nome', 'Nome do Fiscal', 'text', true, 255)}
                                        {renderTextField('fiscal_cargo', 'Cargo do Fiscal', 'text', true, 100)}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-md font-medium text-gray-800 mb-3">Estabelecimento Fiscalizado</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {renderTextField('responsavel_nome', 'Nome do Responsável', 'text', true, 255)}
                                        {renderTextField('responsavel_cpf', 'CPF do Responsável', 'text', true, 14)}
                                        {renderTextField('responsavel_funcao', 'Função/Cargo', 'text', false, 100)}
                                        {renderTextField('estabelecimento_responsavel', 'Responsável pelo Estabelecimento', 'text', false, 255)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* === ASSINATURAS === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm mr-2">6</span>
                                Assinaturas
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="font-medium text-gray-700 mb-4 text-center">AUTORIDADE FISCALIZADORA</h3>
                                    <SignaturePad
                                        name="assinatura_fiscal"
                                        label="Assinatura do Fiscal"
                                        value={signatures.assinatura_fiscal}
                                        onChange={handleSignatureChange}
                                        required={true}
                                    />
                                </div>
                                
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="font-medium text-gray-700 mb-4 text-center">ESTABELECIMENTO FISCALIZADO</h3>
                                    <SignaturePad
                                        name="assinatura_responsavel"
                                        label="Assinatura do Responsável"
                                        value={signatures.assinatura_responsavel}
                                        onChange={handleSignatureChange}
                                        required={true}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* === ANEXOS/OBSERVAÇÕES REMOVIDOS PARA ESPELHAR O DOCUMENTO === */}

                        {/* === MENSAGEM DE ERRO === */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Erro ao salvar</h3>
                                        <div className="text-sm text-red-700 mt-1">{error}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === BOTÕES DE AÇÃO === */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                            <Link 
                                to="/fiscalizacao/infracoes" 
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                ← Voltar para Lista
                            </Link>
                            
                            <div className="flex space-x-3">
                                <button 
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                            Salvar Auto de Infração
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* === INFORMAÇÕES ADICIONAIS === */}
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-red-800">Informações Importantes</h4>
                                    <div className="text-sm text-red-700 mt-1 space-y-1">
                                        <p>• O número do auto será gerado automaticamente pelo sistema.</p>
                                        <p>• Campos marcados com <span className="text-red-500">*</span> são obrigatórios.</p>
                                        <p>• Marque todas as infrações encontradas durante a fiscalização.</p>
                                        <p>• O relatório deve ser detalhado e objetivo.</p>
                                        <p>• O valor da multa deve estar de acordo com a tabela vigente.</p>
                                        <p>• As assinaturas são obrigatórias para validar o documento.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AutoInfracaoCreatePage;
