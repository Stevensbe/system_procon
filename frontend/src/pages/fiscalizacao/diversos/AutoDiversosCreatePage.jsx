import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { criarAutoDiversos, consultarCNPJReceita } from '../../../services/fiscalizacaoService';
import SignaturePad from "../../../components/shared/SignaturePad";
import FileUpload from "../../../components/shared/FileUpload";
import IrregularidadesSelector from "../../../components/fiscalizacao/IrregularidadesSelector";

function AutoDiversosCreatePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cnpjStatus, setCnpjStatus] = useState(null);
    const [cnpjLoading, setCnpjLoading] = useState(false);

    const [autoData, setAutoData] = useState({
        // === CAMPOS DA CLASSE BASE (AutoConstatacaoBase) ===
        // numero é gerado automaticamente pelo backend
        razao_social: '', // Aqui será "ESTABELECIMENTO" no documento
        nome_fantasia: '',
        atividade: '',
        endereco: '',
        cep: '',
        municipio: '',
        estado: 'AM',
        cnpj: '',
        telefone: '',
        data_fiscalizacao: new Date().toISOString().split('T')[0],
        hora_fiscalizacao: new Date().toTimeString().split(' ')[0].substring(0, 5),
        origem: 'acao',
        origem_outros: '',
        
        // Responsáveis pelas assinaturas (SEM matrícula - backend não tem)
        fiscal_nome_1: '',
        fiscal_nome_2: '',
        responsavel_nome: '',
        responsavel_cpf: '',
        
        // === CAMPOS ESPECÍFICOS DO AutoDiversos ===
        porte: '',
        atuacao: '',
        
        // Irregularidades específicas
        publicidade_enganosa: false,
        precos_fora_padrao: false,
        ausencia_precos: false,
        precos_eletronico_fora_padrao: false,
        ausencia_precos_eletronico: false,
        fracionados_fora_padrao: false,
        ausencia_desconto_visibilidade: false,
        ausencia_exemplar_cdc: false,
        substituicao_troco: false,
        
        // Aplicação de advertência
        aplicar_advertencia: false,
        
        // Campos adicionais
        outras_irregularidades: '',
        narrativa_fatos: '',
        observacoes: ''
    });

    // Estados para assinaturas
    const [signatures, setSignatures] = useState({
        assinatura_fiscal_1: '',
        assinatura_fiscal_2: '',
        assinatura_representante: ''
    });

    // Estados para arquivos anexados
    const [uploadedFiles, setUploadedFiles] = useState([]);

    // ========== FUNÇÕES DE VALIDAÇÃO CORRIGIDAS ==========
    
    // Validação simples de CPF
    const isValidCPF = (cpf) => {
        const cleanCPF = cpf.replace(/\D/g, '');
        return cleanCPF.length === 11 && !/^(\d)\1{10}$/.test(cleanCPF);
    };

    // Validações para campos de assinatura - CORRIGIDA
    const validateSignatures = () => {
        const errors = [];
        
        // Só exigir assinatura se nome foi preenchido
        if (autoData.fiscal_nome_1 && autoData.fiscal_nome_1.trim() && !signatures.assinatura_fiscal_1) {
            errors.push("Assinatura do fiscal principal é obrigatória quando o nome é preenchido");
        }
        
        if (autoData.fiscal_nome_2 && autoData.fiscal_nome_2.trim() && !signatures.assinatura_fiscal_2) {
            errors.push("Assinatura do fiscal 2 é obrigatória quando o nome é preenchido");
        }
        
        if (autoData.responsavel_nome && autoData.responsavel_nome.trim() && !signatures.assinatura_representante) {
            errors.push("Assinatura do representante é obrigatória quando o nome é preenchido");
        }
        
        // Validação da qualidade da assinatura (menos rigorosa)
        Object.entries(signatures).forEach(([key, signature]) => {
            if (signature && signature.length < 50) {
                const fieldName = key.replace('assinatura_', '').replace('_', ' ');
                errors.push(`Assinatura ${fieldName} parece muito simples`);
            }
        });
        
        return errors;
    };

    // Função de validação antes do submit - CORRIGIDA
    const validateFormBeforeSubmit = () => {
        const signatureErrors = validateSignatures();
        
        // Campos obrigatórios baseados no backend Django
        const requiredFields = [
            { field: 'razao_social', message: 'Razão Social é obrigatória' },
            { field: 'cnpj', message: 'CNPJ é obrigatório' },
            { field: 'atividade', message: 'Atividade é obrigatória' },
            { field: 'endereco', message: 'Endereço é obrigatório' },
            { field: 'municipio', message: 'Município é obrigatório' },
            { field: 'data_fiscalizacao', message: 'Data da Fiscalização é obrigatória' },
            { field: 'hora_fiscalizacao', message: 'Hora da Fiscalização é obrigatória' },
            { field: 'narrativa_fatos', message: 'Narrativa dos fatos é obrigatória' },
            { field: 'fiscal_nome_1', message: 'Nome do fiscal principal é obrigatório' },
            { field: 'responsavel_nome', message: 'Nome do responsável é obrigatório' },
            { field: 'responsavel_cpf', message: 'CPF do responsável é obrigatório' }
        ];
        
        const fieldErrors = requiredFields
            .filter(({ field }) => !autoData[field] || autoData[field].toString().trim() === '')
            .map(({ message }) => message);
        
        // Validação de CNPJ
        if (autoData.cnpj && autoData.cnpj.replace(/\D/g, '').length !== 14) {
            fieldErrors.push('CNPJ deve ter 14 dígitos');
        }
        
        // Validação de CPF
        if (autoData.responsavel_cpf && !isValidCPF(autoData.responsavel_cpf)) {
            fieldErrors.push('CPF do responsável tem formato inválido');
        }
        
        // Validação de data
        if (autoData.data_fiscalizacao) {
            const dataFiscalizacao = new Date(autoData.data_fiscalizacao);
            const hoje = new Date();
            if (dataFiscalizacao > hoje) {
                fieldErrors.push('Data da fiscalização não pode ser futura');
            }
        }
        
        return [...signatureErrors, ...fieldErrors];
    };

    // Componente para exibir status das assinaturas - CORRIGIDO
    const SignatureStatus = () => (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Status das Assinaturas:</h4>
            <div className="space-y-1 text-xs">
                <div className={`flex items-center ${
                    !autoData.fiscal_nome_1 ? 'text-gray-400' : 
                    signatures.assinatura_fiscal_1 ? 'text-green-600' : 'text-red-600'
                }`}>
                    {!autoData.fiscal_nome_1 ? '–' : signatures.assinatura_fiscal_1 ? '✓' : '✗'} Fiscal Principal
                    {autoData.fiscal_nome_1 && !signatures.assinatura_fiscal_1 && ' (OBRIGATÓRIA)'}
                </div>
                <div className={`flex items-center ${
                    !autoData.fiscal_nome_2 ? 'text-gray-400' : 
                    signatures.assinatura_fiscal_2 ? 'text-green-600' : 'text-red-600'
                }`}>
                    {!autoData.fiscal_nome_2 ? '–' : signatures.assinatura_fiscal_2 ? '✓' : '✗'} Fiscal Secundário
                    {autoData.fiscal_nome_2 && !signatures.assinatura_fiscal_2 && ' (OBRIGATÓRIA)'}
                </div>
                <div className={`flex items-center ${
                    !autoData.responsavel_nome ? 'text-gray-400' : 
                    signatures.assinatura_representante ? 'text-green-600' : 'text-red-600'
                }`}>
                    {!autoData.responsavel_nome ? '–' : signatures.assinatura_representante ? '✓' : '✗'} Representante
                    {autoData.responsavel_nome && !signatures.assinatura_representante && ' (OBRIGATÓRIA)'}
                </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
                💡 Dica: As assinaturas são obrigatórias apenas quando os nomes correspondentes são preenchidos.
            </div>
        </div>
    );

    // ========== FIM DAS FUNÇÕES DE VALIDAÇÃO ==========

    const handleAutoChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            setAutoData(prev => ({ ...prev, [name]: checked }));
        } else {
            setAutoData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleConsultarCNPJ = async () => {
        try {
            setCnpjLoading(true);
            setCnpjStatus(null);
            const cleanCNPJ = autoData.cnpj.replace(/\D/g, '');
            const data = await consultarCNPJReceita(cleanCNPJ);
            setAutoData(prev => ({
                ...prev,
                razao_social: data.razao_social || prev.razao_social,
                nome_fantasia: data.nome_fantasia || prev.nome_fantasia,
                atividade: (data?.dados_brutos?.atividade_principal?.[0]?.text) || prev.atividade,
                atuacao: data?.dados_brutos?.natureza_juridica || prev.atuacao,
                endereco: data.endereco
                    ? `${data.endereco}${data.numero ? `, ${data.numero}` : ''}${data.bairro ? ` - ${data.bairro}` : ''}`
                    : prev.endereco,
                municipio: data.cidade || prev.municipio,
                estado: data.uf || prev.estado,
                cep: data.cep || prev.cep,
                telefone: data.telefone || prev.telefone,
            }));
            const detalhe = data.razao_social ? `Razao social: ${data.razao_social}` : 'CNPJ confirmado na Receita Federal.';
            setCnpjStatus({ type: 'success', message: detalhe, cnpj: cleanCNPJ });
        } catch (err) {
            setCnpjStatus({ type: 'error', message: err.message || 'Erro ao consultar CNPJ.' });
        } finally {
            setCnpjLoading(false);
        }
    };

    // Handlers para assinaturas
    const handleSignatureChange = (name, signatureData) => {
        console.log('Assinatura recebida:', name, signatureData ? 'SIM' : 'NÃO');
        setSignatures(prev => ({
            ...prev,
            [name]: signatureData
        }));
    };

    // Handlers para arquivos
    const handleFilesChange = (files) => {
        setUploadedFiles(files);
    };

    // Função para converter base64 para File
    const base64ToFile = (base64Data, filename) => {
        try {
            if (!base64Data || typeof base64Data !== 'string') {
                console.warn(`Dados de assinatura inválidos para ${filename}`);
                return null;
            }
            
            // Verifica se é um base64 válido
            if (!base64Data.includes('data:image/')) {
                console.warn(`Formato de assinatura inválido para ${filename}`);
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

    // ========== FUNÇÃO HANDLESUBMIT COMPLETAMENTE CORRIGIDA ==========
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validação antes do submit
        const validationErrors = validateFormBeforeSubmit();
        if (validationErrors.length > 0) {
            setError(`Erros de validação:\n${validationErrors.join('\n')}`);
            setLoading(false);
            return;
        }

        try {
            const cleanCNPJ = (autoData.cnpj || '').replace(/\D/g, '');
            if (!cnpjStatus || cnpjStatus.type !== 'success' || cnpjStatus.cnpj !== cleanCNPJ) {
                try {
                    setCnpjLoading(true);
                    const data = await consultarCNPJReceita(cleanCNPJ);
                    setAutoData(prev => ({
                        ...prev,
                        razao_social: data.razao_social || prev.razao_social,
                        nome_fantasia: data.nome_fantasia || prev.nome_fantasia,
                        atividade: (data?.dados_brutos?.atividade_principal?.[0]?.text) || prev.atividade,
                        atuacao: data?.dados_brutos?.natureza_juridica || prev.atuacao,
                        endereco: data.endereco
                            ? `${data.endereco}${data.numero ? `, ${data.numero}` : ''}${data.bairro ? ` - ${data.bairro}` : ''}`
                            : prev.endereco,
                        municipio: data.cidade || prev.municipio,
                        estado: data.uf || prev.estado,
                        cep: data.cep || prev.cep,
                        telefone: data.telefone || prev.telefone,
                    }));
                    const detalhe = data.razao_social ? `Razao social: ${data.razao_social}` : 'CNPJ confirmado na Receita Federal.';
                    setCnpjStatus({ type: 'success', message: detalhe, cnpj: cleanCNPJ });
                } catch (err) {
                    setError(`CNPJ: ${err.message || 'Erro ao consultar CNPJ.'}`);
                    setLoading(false);
                    return;
                } finally {
                    setCnpjLoading(false);
                }
            }

            const formData = new FormData();
            
            // === MAPEAMENTO CORRETO PARA BACKEND DJANGO ===
            const fieldsToSend = {
                // Campos básicos obrigatórios
                razao_social: autoData.razao_social || '',
                nome_fantasia: autoData.nome_fantasia || '',
                atividade: autoData.atividade || '',
                endereco: autoData.endereco || '',
                cep: autoData.cep || '',
                municipio: autoData.municipio || '',
                estado: autoData.estado || 'AM',
                cnpj: autoData.cnpj || '',
                telefone: autoData.telefone || '',
                data_fiscalizacao: autoData.data_fiscalizacao || '',
                hora_fiscalizacao: autoData.hora_fiscalizacao || '',
                origem: autoData.origem || 'acao',
                origem_outros: autoData.origem_outros || '',
                
                // Responsáveis (SEM matrícula - backend não tem este campo)
                fiscal_nome_1: autoData.fiscal_nome_1 || '',
                fiscal_nome_2: autoData.fiscal_nome_2 || '',
                responsavel_nome: autoData.responsavel_nome || '',
                responsavel_cpf: autoData.responsavel_cpf || '',
                
                // Campos específicos do AutoDiversos com NOMES CORRETOS do backend
                porte: autoData.porte || '',
                atuacao: autoData.atuacao || '',
                
                // Irregularidades com nomes corretos do modelo Django
                publicidade_enganosa: autoData.publicidade_enganosa || false,
                afixacao_precos_fora_padrao: autoData.precos_fora_padrao || false,
                ausencia_afixacao_precos: autoData.ausencia_precos || false,
                afixacao_precos_eletronico_fora_padrao: autoData.precos_eletronico_fora_padrao || false,
                ausencia_afixacao_precos_eletronico: autoData.ausencia_precos_eletronico || false,
                afixacao_precos_fracionados_fora_padrao: autoData.fracionados_fora_padrao || false,
                ausencia_visibilidade_descontos: autoData.ausencia_desconto_visibilidade || false,
                ausencia_exemplar_cdc: autoData.ausencia_exemplar_cdc || false,
                substituicao_troco: autoData.substituicao_troco || false,
                
                // Campos obrigatórios do backend com nomes corretos
                advertencia: autoData.aplicar_advertencia || false, // Nome correto no backend
                outras_irregularidades: autoData.outras_irregularidades || '',
                narrativa_fatos: autoData.narrativa_fatos || 'Narrativa dos fatos constatados durante a fiscalização.',
                receita_bruta_notificada: true // Campo obrigatório do backend
            };
            
            // Enviar campos um por um com conversão adequada
            Object.keys(fieldsToSend).forEach(key => {
                const value = fieldsToSend[key];
                
                // Conversão de tipos para o backend Django
                if (typeof value === 'boolean') {
                    formData.append(key, value ? 'true' : 'false');
                } else if (value !== null && value !== undefined) {
                    formData.append(key, String(value));
                }
            });
            
            // Adicionar assinaturas com validação melhorada
            const signatureFiles = [];
            Object.keys(signatures).forEach(signatureKey => {
                if (signatures[signatureKey]) {
                    const signatureFile = base64ToFile(
                        signatures[signatureKey], 
                        `${signatureKey}.png`
                    );
                    if (signatureFile) {
                        formData.append(signatureKey, signatureFile);
                        signatureFiles.push(signatureKey);
                    } else {
                        console.warn(`Falha ao processar assinatura: ${signatureKey}`);
                    }
                }
            });
            
            // Adicionar arquivos com estrutura correta
            if (uploadedFiles && uploadedFiles.length > 0) {
                uploadedFiles.forEach((fileObj, index) => {
                    if (fileObj && fileObj.file instanceof File) {
                        formData.append('anexos', fileObj.file);
                        formData.append(`anexo_descricao_${index}`, fileObj.name || fileObj.file.name);
                    }
                });
            }

            // Log detalhado para debug
            console.log('=== DADOS SENDO ENVIADOS PARA AUTO DIVERSOS ===');
            console.log('Campos principais:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }
            console.log('Assinaturas processadas:', signatureFiles);
            console.log('Total de anexos:', uploadedFiles?.length || 0);

            // Chamar a função do service corrigido
            const response = await criarAutoDiversos(formData);
            
            console.log('✅ Sucesso! Resposta do servidor:', response);
            alert(`Auto Diversos "${response.numero}" criado com sucesso!`);
      navigate('/fiscalizacao/diversos');
            
        } catch (err) {
            console.error('❌ Erro detalhado:', err);
            
            // Melhor tratamento de erro para o usuário
            let errorMessage = 'Ocorreu um erro ao salvar.';
            
            if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
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
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" 
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
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" 
            />
        </div>
    );

    const renderCheckboxField = (name, label, description = '') => (
        <div className="flex items-start">
            <input 
                type="checkbox" 
                id={name} 
                name={name} 
                checked={autoData[name]} 
                onChange={handleAutoChange} 
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1" 
            />
            <div className="ml-2">
                <label htmlFor={name} className="block text-sm text-gray-700">{label}</label>
                {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
            </div>
        </div>
    );

    const renderSelect = (name, label, options, required = false) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select 
                id={name}
                name={name} 
                value={autoData[name]} 
                onChange={handleAutoChange} 
                required={required}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            >
                <option value="">Selecione...</option>
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );

    // Opções baseadas no modelo
    const porteOptions = [
        { value: 'microempresa', label: 'Microempresa' },
        { value: 'pequeno', label: 'Pequeno Porte' },
        { value: 'medio', label: 'Médio Porte' },
        { value: 'grande', label: 'Grande Porte' }
    ];

    const origemOptions = [
        { value: 'acao', label: 'Ação Fiscalizatória' },
        { value: 'denuncia', label: 'Denúncia' },
        { value: 'forca_tarefa', label: 'Força Tarefa' },
        { value: 'outros', label: 'Outros' }
    ];

    const estadoOptions = [
        { value: 'AC', label: 'Acre' },
        { value: 'AL', label: 'Alagoas' },
        { value: 'AP', label: 'Amapa' },
        { value: 'AM', label: 'Amazonas' },
        { value: 'BA', label: 'Bahia' },
        { value: 'CE', label: 'Ceara' },
        { value: 'DF', label: 'Distrito Federal' },
        { value: 'ES', label: 'Espirito Santo' },
        { value: 'GO', label: 'Goias' },
        { value: 'MA', label: 'Maranhao' },
        { value: 'MT', label: 'Mato Grosso' },
        { value: 'MS', label: 'Mato Grosso do Sul' },
        { value: 'MG', label: 'Minas Gerais' },
        { value: 'PA', label: 'Para' },
        { value: 'PB', label: 'Paraiba' },
        { value: 'PR', label: 'Parana' },
        { value: 'PE', label: 'Pernambuco' },
        { value: 'PI', label: 'Piaui' },
        { value: 'RJ', label: 'Rio de Janeiro' },
        { value: 'RN', label: 'Rio Grande do Norte' },
        { value: 'RS', label: 'Rio Grande do Sul' },
        { value: 'RO', label: 'Rondonia' },
        { value: 'RR', label: 'Roraima' },
        { value: 'SC', label: 'Santa Catarina' },
        { value: 'SP', label: 'Sao Paulo' },
        { value: 'SE', label: 'Sergipe' },
        { value: 'TO', label: 'Tocantins' },
    ];


    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-purple-600 px-6 py-4">
                        <h1 className="text-2xl font-bold text-white">Novo Auto de Constatação - Legislação Diversas</h1>
                        <p className="text-purple-100 mt-1">
                            Número: <span className="font-mono bg-purple-700 px-2 py-1 rounded text-sm">Gerado Automaticamente</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        {/* === DADOS DO ESTABELECIMENTO === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm mr-2">1</span>
                                Dados do Estabelecimento
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {renderTextField('razao_social', 'Estabelecimento', 'text', true, 255)}
                                {renderTextField('nome_fantasia', 'Nome Fantasia', 'text', false, 255)}
                                <div>
                                    <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
                                        CNPJ <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1 flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                id="cnpj"
                                                name="cnpj"
                                                value={autoData.cnpj}
                                                onChange={handleAutoChange}
                                                required
                                                maxLength={18}
                                                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleConsultarCNPJ}
                                                disabled={cnpjLoading}
                                                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
                                            >
                                                {cnpjLoading ? 'Consultando...' : 'Consultar Receita'}
                                            </button>
                                        </div>
                                        {cnpjStatus && (
                                            <p className={`text-xs ${cnpjStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                                {cnpjStatus.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {renderTextField('atividade', 'Atividade', 'text', true, 255)}
                                {renderSelect('porte', 'Porte', porteOptions)}
                                {renderTextField('atuacao', 'Atuação', 'text', false, 100)}
                            </div>
                        </div>

                        {/* === ENDEREÇO E CONTATO === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm mr-2">2</span>
                                Endereço e Contato
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {renderTextField('endereco', 'Endereço', 'text', true, 255)}
                                {renderTextField('cep', 'CEP', 'text', true, 10)}
                                {renderTextField('municipio', 'Município', 'text', true, 100)}
{renderSelect('estado', 'Estado', estadoOptions, true)}
                                {renderTextField('telefone', 'Telefone', 'tel', false, 20)}
                            </div>
                        </div>

                        {/* === DATA E HORA DA FISCALIZAÇÃO === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm mr-2">3</span>
                                Data e Hora da Fiscalização
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderTextField('data_fiscalizacao', 'Data da Fiscalização', 'date', true)}
                                {renderTextField('hora_fiscalizacao', 'Hora da Fiscalização', 'time', true)}
                            </div>
                            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <p className="text-sm text-purple-800">
                                    <strong>Cominação Legal:</strong> Às <strong>{autoData.hora_fiscalizacao || '__:__'}</strong> horas do dia{' '}
                                    <strong>
                                        {autoData.data_fiscalizacao 
                                            ? new Date(autoData.data_fiscalizacao + 'T00:00:00').toLocaleDateString('pt-BR') 
                                            : '__/__/____'
                                        }
                                    </strong>, no exercício das competências dispostas no art. 55 e seguintes da Lei Federal nº 8.078/90, 
                                    largamente atribuídas ao Instituto de Defesa do Consumidor – PROCON AMAZONAS, neste ato fiscalizatório, fora constatado que:
                                </p>
                            </div>
                        </div>

                        {/* === ORIGEM DA FISCALIZAÇÃO === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm mr-2">4</span>
                                Origem da Fiscalização
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderSelect('origem', 'Origem', origemOptions, true)}
                                {autoData.origem === 'outros' && renderTextField('origem_outros', 'Especificar Outros', 'text', false, 255)}
                            </div>
                        </div>

                        {/* === IRREGULARIDADES CONSTATADAS === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm mr-2">5</span>
                                Irregularidades Constatadas
                            </h2>
                            <p className="text-sm text-gray-600 mb-6">
                                O estabelecimento visitado praticou as seguintes irregularidades e/ou violou as seguintes disposições legais:
                            </p>
                            
                            <IrregularidadesSelector
                                tipo="diversos"
                                irregularidades={{
                                    publicidade_enganosa: autoData.publicidade_enganosa,
                                    afixacao_precos_fora_padrao: autoData.precos_fora_padrao,
                                    ausencia_afixacao_precos: autoData.ausencia_precos,
                                    afixacao_precos_eletronico_fora_padrao: autoData.precos_eletronico_fora_padrao,
                                    ausencia_afixacao_precos_eletronico: autoData.ausencia_precos_eletronico,
                                    afixacao_precos_fracionados_fora_padrao: autoData.fracionados_fora_padrao,
                                    ausencia_visibilidade_descontos: autoData.ausencia_desconto_visibilidade,
                                    ausencia_exemplar_cdc: autoData.ausencia_exemplar_cdc,
                                    substituicao_troco: autoData.substituicao_troco,
                                    nada_consta: autoData.nada_consta
                                }}
                                onChange={(irregularidades) => {
                                    setAutoData(prev => ({
                                        ...prev,
                                        publicidade_enganosa: irregularidades.publicidade_enganosa || false,
                                        precos_fora_padrao: irregularidades.afixacao_precos_fora_padrao || false,
                                        ausencia_precos: irregularidades.ausencia_afixacao_precos || false,
                                        precos_eletronico_fora_padrao: irregularidades.afixacao_precos_eletronico_fora_padrao || false,
                                        ausencia_precos_eletronico: irregularidades.ausencia_afixacao_precos_eletronico || false,
                                        fracionados_fora_padrao: irregularidades.afixacao_precos_fracionados_fora_padrao || false,
                                        ausencia_desconto_visibilidade: irregularidades.ausencia_visibilidade_descontos || false,
                                        ausencia_exemplar_cdc: irregularidades.ausencia_exemplar_cdc || false,
                                        substituicao_troco: irregularidades.substituicao_troco || false,
                                        nada_consta: irregularidades.nada_consta || false
                                    }));
                                }}
                                showDetails={true}
                            />
                        </div>

                        {/* === MEDIDA DISCIPLINAR === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm mr-2">6</span>
                                Medida Disciplinar
                            </h2>
                            <div className="space-y-4">
                                {renderCheckboxField(
                                    'aplicar_advertencia', 
                                    'Aplicar ADVERTÊNCIA como medida disciplinar'
                                )}
                                
                                {autoData.aplicar_advertencia && (
                                    <div className="ml-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm text-yellow-800">
                                            <strong>Advertência:</strong> Razão pela qual, resolvemos aplicar-lhe como medida disciplinar a presente 
                                            <strong> ADVERTÊNCIA</strong> e com o intuito de evitar a reincidência ou o cometimento de outra(s) falta(s) 
                                            de qualquer natureza prevista em lei que nos obrigará a tomar outras medidas cabíveis de acordo com a 
                                            legislação em vigor orientamos o autuado a providenciar sua imediata adequação à lei.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* === OUTRAS INFORMAÇÕES === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm mr-2">7</span>
                                Outras Informações
                            </h2>
                            <div className="space-y-4">
                                {renderTextArea('outras_irregularidades', 'Outras irregularidades constatadas/outras cominações legais', 4)}
                                {renderTextArea('narrativa_fatos', 'Narrativa dos fatos', 6, true)}
                                {renderTextArea('observacoes', 'Observações gerais', 4)}
                            </div>
                            
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Importante:</strong> Fica o autuado intimado a encaminhar ao Departamento de Fiscalização 
                                    a Receita Bruta Anual declarada, sob pena da mesma ser estimada por este PROCON/AM, caso não seja 
                                    fornecida no prazo de 05 dias corridos, contados a partir da lavratura do presente Auto.
                                </p>
                            </div>
                        </div>

                        {/* === RESPONSÁVEIS E ASSINATURAS === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm mr-2">8</span>
                                Responsáveis e Assinaturas
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="font-medium text-gray-700 mb-4 text-center">AUTORIDADE FISCALIZADORA</h3>
                                    
                                    {/* Assinatura Fiscal 1 */}
                                    <div className="mb-4">
                                        <SignaturePad
                                            name="assinatura_fiscal_1"
                                            label="Assinatura do Fiscal Principal"
                                            value={signatures.assinatura_fiscal_1}
                                            onChange={handleSignatureChange}
                                            required={true}
                                        />
                                        <div className="space-y-2 mt-4">
                                            {renderTextField('fiscal_nome_1', 'Nome do Fiscal', 'text', true, 255)}
                                        </div>
                                    </div>

                                    {/* Assinatura Fiscal 2 */}
                                    <div>
                                        <SignaturePad
                                            name="assinatura_fiscal_2"
                                            label="Assinatura do Fiscal 2 (Opcional)"
                                            value={signatures.assinatura_fiscal_2}
                                            onChange={handleSignatureChange}
                                        />
                                        <div className="space-y-2 mt-4">
                                            {renderTextField('fiscal_nome_2', 'Nome do Fiscal 2 (Opcional)', 'text', false, 255)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="font-medium text-gray-700 mb-4 text-center">ESTABELECIMENTO FISCALIZADO</h3>
                                    
                                    {/* Assinatura Responsável */}
                                    <div>
                                        <SignaturePad
                                            name="assinatura_representante"
                                            label="Assinatura do Representante"
                                            value={signatures.assinatura_representante}
                                            onChange={handleSignatureChange}
                                            required={true}
                                        />
                                        <div className="space-y-2 mt-4">
                                            {renderTextField('responsavel_nome', 'Nome do Responsável', 'text', true, 255)}
                                            {renderTextField('responsavel_cpf', 'CPF', 'text', true, 20)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Status das assinaturas */}
                            <SignatureStatus />
                            
                            {/* Upload de arquivos */}
                            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
                                <h3 className="font-medium text-gray-700 mb-3">Anexos e Documentos</h3>
                                <FileUpload 
                                    onFilesChange={handleFilesChange}
                                    acceptedFormats="image/*,.pdf,.doc,.docx"
                                    maxFiles={5}
                                    maxSize={5 * 1024 * 1024} // 5MB
                                />
                            </div>
                        </div>

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
                                        <div className="text-sm text-red-700 mt-1 whitespace-pre-line">{error}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === BOTÕES DE AÇÃO === */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                            <Link 
                                to="/fiscalizacao" 
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
                                    className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center"
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
                                            Salvar Auto de Constatação
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* === INFORMAÇÕES ADICIONAIS === */}
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-purple-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-purple-800">Informações Importantes</h4>
                                    <div className="text-sm text-purple-700 mt-1 space-y-1">
                                        <p>• O número do auto será gerado automaticamente pelo sistema.</p>
                                        <p>• Campos marcados com <span className="text-red-500">*</span> são obrigatórios.</p>
                                        <p>• Marque todas as irregularidades encontradas durante a fiscalização.</p>
                                        <p>• A narrativa dos fatos deve ser detalhada e objetiva.</p>
                                        <p>• A advertência pode ser aplicada como medida disciplinar quando apropriado.</p>
                                        <p>• O procedimento administrativo será regulado nos termos do Decreto Estadual 43.614/21.</p>
                                        <p>• <strong>Assinaturas são obrigatórias</strong> apenas quando os nomes correspondentes são preenchidos.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* === LEGISLAÇÃO APLICÁVEL === */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                                </svg>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-blue-800">Legislação Aplicável</h4>
                                    <div className="text-sm text-blue-700 mt-1 space-y-1">
                                        <p>• <strong>Lei Federal nº 8.078/90</strong> - Código de Defesa do Consumidor</p>
                                        <p>• <strong>Lei nº 10.962/2004</strong> - Afixação de preços</p>
                                        <p>• <strong>Lei nº 10.962/2010</strong> - Produtos fracionados e descontos</p>
                                        <p>• <strong>Lei nº 12.291/2010</strong> - Exemplar do CDC</p>
                                        <p>• <strong>Decreto Estadual nº 43.614/2021</strong> - Processo administrativo</p>
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

export default AutoDiversosCreatePage;
