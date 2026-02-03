import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { criarAutoSupermercado, consultarCNPJReceita } from '../../../services/fiscalizacaoService';
import SignaturePad from "../../../components/shared/SignaturePad";
import FileUpload from "../../../components/shared/FileUpload";
import IrregularidadesSelector from "../../../components/fiscalizacao/IrregularidadesSelector";

function AutoSupermercadoCreatePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cnpjStatus, setCnpjStatus] = useState(null);
    const [cnpjLoading, setCnpjLoading] = useState(false);

    const [autoData, setAutoData] = useState({
        // === CAMPOS DA CLASSE BASE (AutoConstatacaoBase) ===
        razao_social: '',
        nome_fantasia: '',
        porte: '',
        atuacao: '',
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
        
        // === CAMPOS ESPECÍFICOS DO AutoSupermercado ===
        // Cominação Legal
        nada_consta: false,
        cominacao_legal: '',
        // REMOVIDO: sem_irregularidades (não existe no backend)
        
        // Irregularidades específicas de supermercados (nomes exatos do backend)
        comercializar_produtos_vencidos: false,
        comercializar_embalagem_violada: false,
        comercializar_lata_amassada: false,
        comercializar_sem_validade: false,
        comercializar_mal_armazenados: false,
        comercializar_descongelados: false,
        publicidade_enganosa: false,
        obstrucao_monitor: false,
        afixacao_precos_fora_padrao: false,
        ausencia_afixacao_precos: false,
        afixacao_precos_fracionados_fora_padrao: false,
        ausencia_visibilidade_descontos: false,
        ausencia_placas_promocao_vencimento: false,
        
        // Campos para detalhamento das irregularidades
        prazo_cumprimento_dias: 5,
        outras_irregularidades: '',
        narrativa_fatos: '',
        instrucoes_fiscalizado: '',
        possui_anexo: false,
        auto_apreensao: false,
        auto_apreensao_numero: '',
        necessita_pericia: false,
        vicios_aparentes: false,
        receita_bruta_notificada: true,
    });

    // Estados para assinaturas e arquivos
    const [signatures, setSignatures] = useState({
        assinatura_fiscal_1: '',
        assinatura_fiscal_2: '',
        assinatura_representante: ''
    });

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
        
        // Campos obrigatórios baseados no modelo Django AutoSupermercado
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
        
        // Validação específica: pelo menos uma irregularidade deve estar marcada ou "nada consta"
        const irregularidades = [
            autoData.comercializar_produtos_vencidos,
            autoData.comercializar_embalagem_violada,
            autoData.comercializar_lata_amassada,
            autoData.comercializar_sem_validade,
            autoData.comercializar_mal_armazenados,
            autoData.comercializar_descongelados,
            autoData.publicidade_enganosa,
            autoData.obstrucao_monitor,
            autoData.afixacao_precos_fora_padrao,
            autoData.ausencia_afixacao_precos,
            autoData.afixacao_precos_fracionados_fora_padrao,
            autoData.ausencia_visibilidade_descontos,
            autoData.ausencia_placas_promocao_vencimento,
        ];
        
        const temIrregularidades = irregularidades.some(Boolean) || 
                                  (autoData.outras_irregularidades && autoData.outras_irregularidades.trim());
        
        if (!autoData.nada_consta && !temIrregularidades) {
            fieldErrors.push('Marque pelo menos uma irregularidade ou selecione "Nada Consta"');
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
        } else if (type === 'radio') {
            let newValue;
            if (value === 'true') newValue = true;
            else if (value === 'false') newValue = false;
            else newValue = value;
            
            setAutoData(prev => ({ ...prev, [name]: newValue }));
        } else if (type === 'number') {
            const numValue = value === '' ? '' : parseInt(value);
            setAutoData(prev => ({ ...prev, [name]: numValue }));
        } else {
            if (name === 'cnpj') {
                setCnpjStatus(null);
            }
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

    // Handler para assinaturas
    const handleSignatureChange = (name, signatureData) => {
        setSignatures(prev => ({
            ...prev,
            [name]: signatureData
        }));
    };

    // Handler para upload de arquivos
    const handleFilesChange = (files) => {
        setUploadedFiles(files);
    };

    // Função para converter assinatura base64 para File
    const base64ToFile = (base64Data, filename) => {
        try {
            if (!base64Data || typeof base64Data !== 'string') {
                console.warn(`Dados de assinatura inválidos para ${filename}`);
                return null;
            }
            
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
                porte: autoData.porte || '',
                atuacao: autoData.atuacao || '',
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

                // Responsáveis
                fiscal_nome_1: autoData.fiscal_nome_1 || '',
                fiscal_nome_2: autoData.fiscal_nome_2 || '',
                responsavel_nome: autoData.responsavel_nome || '',
                responsavel_cpf: autoData.responsavel_cpf || '',

                // Cominação Legal
                nada_consta: autoData.nada_consta || false,
                cominacao_legal: autoData.cominacao_legal || '',

                // Irregularidades de produtos
                comercializar_produtos_vencidos: autoData.comercializar_produtos_vencidos || false,
                comercializar_embalagem_violada: autoData.comercializar_embalagem_violada || false,
                comercializar_lata_amassada: autoData.comercializar_lata_amassada || false,
                comercializar_sem_validade: autoData.comercializar_sem_validade || false,
                comercializar_mal_armazenados: autoData.comercializar_mal_armazenados || false,
                comercializar_descongelados: autoData.comercializar_descongelados || false,

                // Irregularidades de preços e publicidade
                publicidade_enganosa: autoData.publicidade_enganosa || false,
                obstrucao_monitor: autoData.obstrucao_monitor || false,
                afixacao_precos_fora_padrao: autoData.afixacao_precos_fora_padrao || false,
                ausencia_afixacao_precos: autoData.ausencia_afixacao_precos || false,
                afixacao_precos_fracionados_fora_padrao: autoData.afixacao_precos_fracionados_fora_padrao || false,
                ausencia_visibilidade_descontos: autoData.ausencia_visibilidade_descontos || false,
                ausencia_placas_promocao_vencimento: autoData.ausencia_placas_promocao_vencimento || false,

                // Prazos e informações
                prazo_cumprimento_dias: parseInt(autoData.prazo_cumprimento_dias) || 5,
                outras_irregularidades: autoData.outras_irregularidades || '',
                narrativa_fatos: autoData.narrativa_fatos || 'Narrativa dos fatos constatados durante a fiscalização.',
                instrucoes_fiscalizado: autoData.instrucoes_fiscalizado || '',
                possui_anexo: autoData.possui_anexo || false,
                auto_apreensao: autoData.auto_apreensao || false,
                auto_apreensao_numero: autoData.auto_apreensao_numero || '',
                necessita_pericia: autoData.necessita_pericia || false,
                vicios_aparentes: autoData.vicios_aparentes || false,
                receita_bruta_notificada: autoData.receita_bruta_notificada || true
            };;
            
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
            
            // Adicionar arquivos anexos
            if (uploadedFiles && uploadedFiles.length > 0) {
                uploadedFiles.forEach((fileObj, index) => {
                    if (fileObj && fileObj.file instanceof File) {
                        formData.append('anexos', fileObj.file);
                        formData.append(`anexo_descricao_${index}`, fileObj.name || fileObj.file.name);
                    }
                });
            }

            // Log detalhado para debug
            console.log('=== DADOS SENDO ENVIADOS PARA AUTOSUPERMERCADO ===');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}: [File] ${value.name}`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }

            const response = await criarAutoSupermercado(formData);
            alert(`Auto Supermercado "${response.numero}" criado com sucesso!`);
            navigate('/fiscalizacao/supermercados');
            
        } catch (err) {
            console.error('Erro completo:', err);
            setError(err.message || 'Erro ao criar auto de supermercado');
        } finally {
            setLoading(false);
        }
    };

    // Funções de renderização
    const renderTextField = (name, label, type = 'text', required = false, maxLength = null) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input 
                type={type} 
                id={name} 
                name={name} 
                value={autoData[name] || ''}
                onChange={handleAutoChange} 
                required={required}
                maxLength={maxLength}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
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
                value={autoData[name] || ''}
                onChange={handleAutoChange} 
                required={required}
                rows={rows}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
            />
        </div>
    );

    const renderCheckboxField = (name, label, description = '') => (
        <div className="flex items-start">
            <input 
                type="checkbox" 
                id={name} 
                name={name} 
                checked={Boolean(autoData[name])}
                onChange={handleAutoChange} 
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1" 
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
                value={autoData[name] || ''}
                onChange={handleAutoChange} 
                required={required}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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

    // Opções para selects
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

    const porteOptions = [
        { value: 'microempresa', label: 'Microempresa' },
        { value: 'pequeno', label: 'Pequeno Porte' },
        { value: 'medio', label: 'Medio Porte' },
        { value: 'grande', label: 'Grande Porte' }
    ];


    const prazoOptions = [
        { value: 5, label: '5 dias' },
        { value: 10, label: '10 dias' },
        { value: 15, label: '15 dias' },
        { value: 30, label: '30 dias' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-green-600 px-6 py-4">
                        <h1 className="text-2xl font-bold text-white">Novo Auto de Constatação - Supermercado</h1>
                        <p className="text-green-100 mt-1">
                            Número: <span className="font-mono bg-green-700 px-2 py-1 rounded text-sm">Gerado Automaticamente</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        {/* === DADOS DO ESTABELECIMENTO === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">1</span>
                                Dados do Estabelecimento
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {renderTextField('razao_social', 'Razão Social', 'text', true, 255)}
                                {renderTextField('nome_fantasia', 'Nome Fantasia', 'text', false, 255)}
                                {renderSelect('porte', 'Porte', porteOptions, false)}
                                {renderTextField('atuacao', 'Atua‡Æo', 'text', false, 100)}
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
                                {renderTextField('endereco', 'Endereço', 'text', true, 255)}
                                {renderTextField('municipio', 'Município', 'text', true, 100)}
                                {renderTextField('cep', 'CEP', 'text', false, 10)}
                                {renderTextField('telefone', 'Telefone', 'tel', false, 20)}
{renderSelect('estado', 'Estado', estadoOptions, true)}
                            </div>
                        </div>

                        {/* === ORIGEM DA FISCALIZAÇÃO === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">2</span>
                                Origem da Fiscalização
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderSelect('origem', 'Origem', origemOptions, true)}
                                {autoData.origem === 'outros' && renderTextField('origem_outros', 'Especificar Outros', 'text', false, 255)}
                            </div>
                        </div>

                        {/* === DATA E HORA DA FISCALIZAÇÃO === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">3</span>
                                Data e Hora da Fiscalização
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderTextField('data_fiscalizacao', 'Data da Fiscalização', 'date', true)}
                                {renderTextField('hora_fiscalizacao', 'Hora da Fiscalização', 'time', true)}
                            </div>
                            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm text-green-800">
                                    <strong>Cominação Legal:</strong> Às <strong>{autoData.hora_fiscalizacao || '__:__'}</strong> horas do dia{' '}
                                    <strong>
                                        {autoData.data_fiscalizacao 
                                            ? new Date(autoData.data_fiscalizacao + 'T00:00:00').toLocaleDateString('pt-BR') 
                                            : '__/__/____'
                                        }
                                    </strong>, no exercício das competências dispostas no art. 55 e seguintes da Lei Federal nº 8.078/90, 
                                    legalmente atribuídas ao Instituto de Defesa do Consumidor – PROCON AMAZONAS, neste ato fiscalizatório, constatamos que:
                                </p>
                            </div>
            <div className="mt-4">
                {renderTextArea('cominacao_legal', 'Texto principal da cominacao legal', 4)}
            </div>

                        </div>

                        {/* === IRREGULARIDADES CONSTATADAS === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">4</span>
                                Irregularidades Constatadas
                            </h2>
                            <p className="text-sm text-gray-600 mb-6">
                                O estabelecimento visitado praticou as seguintes irregularidades e/ou violou as seguintes disposições legais:
                            </p>
                            
                            <IrregularidadesSelector
                                tipo="supermercado"
                                irregularidades={{
                                    comercializar_produtos_vencidos: autoData.comercializar_produtos_vencidos,
                                    comercializar_embalagem_violada: autoData.comercializar_embalagem_violada,
                                    comercializar_lata_amassada: autoData.comercializar_lata_amassada,
                                    comercializar_sem_validade: autoData.comercializar_sem_validade,
                                    comercializar_mal_armazenados: autoData.comercializar_mal_armazenados,
                                    comercializar_descongelados: autoData.comercializar_descongelados,
                                    publicidade_enganosa: autoData.publicidade_enganosa,
                                    obstrucao_monitor: autoData.obstrucao_monitor,
                                    afixacao_precos_fora_padrao: autoData.afixacao_precos_fora_padrao,
                                    ausencia_afixacao_precos: autoData.ausencia_afixacao_precos,
                                    afixacao_precos_fracionados_fora_padrao: autoData.afixacao_precos_fracionados_fora_padrao,
                                    ausencia_visibilidade_descontos: autoData.ausencia_visibilidade_descontos,
                                    ausencia_placas_promocao_vencimento: autoData.ausencia_placas_promocao_vencimento,
                                    nada_consta: autoData.nada_consta
                                }}
                                onChange={(irregularidades) => {
                                    setAutoData(prev => ({
                                        ...prev,
                                        comercializar_produtos_vencidos: irregularidades.comercializar_produtos_vencidos || false,
                                        comercializar_embalagem_violada: irregularidades.comercializar_embalagem_violada || false,
                                        comercializar_lata_amassada: irregularidades.comercializar_lata_amassada || false,
                                        comercializar_sem_validade: irregularidades.comercializar_sem_validade || false,
                                        comercializar_mal_armazenados: irregularidades.comercializar_mal_armazenados || false,
                                        comercializar_descongelados: irregularidades.comercializar_descongelados || false,
                                        publicidade_enganosa: irregularidades.publicidade_enganosa || false,
                                        obstrucao_monitor: irregularidades.obstrucao_monitor || false,
                                        afixacao_precos_fora_padrao: irregularidades.afixacao_precos_fora_padrao || false,
                                        ausencia_afixacao_precos: irregularidades.ausencia_afixacao_precos || false,
                                        afixacao_precos_fracionados_fora_padrao: irregularidades.afixacao_precos_fracionados_fora_padrao || false,
                                        ausencia_visibilidade_descontos: irregularidades.ausencia_visibilidade_descontos || false,
                                        ausencia_placas_promocao_vencimento: irregularidades.ausencia_placas_promocao_vencimento || false,
                                        nada_consta: irregularidades.nada_consta || false
                                    }));
                                }}
                                showDetails={true}
                            />
                        </div>

                        {/* === PRAZO E OUTRAS INFORMAÇÕES === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">5</span>
                                Prazo e Outras Informações
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    {renderSelect('prazo_cumprimento_dias', 'Prazo para cumprimento da obrigação (dias)', prazoOptions)}
                                    <div className="space-y-3">
                                        {renderCheckboxField('possui_anexo', 'Possui anexo')}
                                        {renderCheckboxField('auto_apreensao', 'Possui auto de apreensão/inutilização')}
                                        {autoData.auto_apreensao && renderTextField('auto_apreensao_numero', 'Número do Auto de Apreensão/Inutilização', 'text', false, 50)}
                                        {renderCheckboxField('necessita_pericia', 'Os itens apreendidos e ou descartados necessitam de perícia')}
                                        {renderCheckboxField('vicios_aparentes', 'Todos os vicios estavam aparentes')}
                                        {renderCheckboxField('receita_bruta_notificada', 'Receita Bruta Notificada')}
                                    </div>
                                </div>
                                <div>
                                    {renderTextArea('outras_irregularidades', 'Outras irregularidades constatadas/outras cominações legais', 4)}
                                    {renderTextArea('instrucoes_fiscalizado', 'Instrucoes ao fiscalizado', 3)}
                                </div>
                            </div>
                        </div>

                        {/* === NARRATIVA DOS FATOS === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">6</span>
                                Narrativa dos Fatos
                            </h2>
                            {renderTextArea('narrativa_fatos', 'Descreva detalhadamente os fatos constatados durante a fiscalização', 6, true)}
                        </div>

                        {/* === SEÇÃO DE ASSINATURAS === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">9</span>
                                Assinaturas Digitais
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="font-medium text-gray-700 mb-4 text-center">AUTORIDADE FISCALIZADORA</h3>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <SignaturePad
                                                label="Assinatura do Fiscal Responsável"
                                                name="assinatura_fiscal_1"
                                                value={signatures.assinatura_fiscal_1}
                                                onChange={handleSignatureChange}
                                                width={350}
                                                height={120}
                                            />
                                            <div className="mt-2 space-y-2">
                                                {renderTextField('fiscal_nome_1', 'Nome do Fiscal', 'text', true, 255)}
                                            </div>
                                        </div>

                                        <div>
                                            <SignaturePad
                                                label="Assinatura do Fiscal de Apoio (Opcional)"
                                                name="assinatura_fiscal_2"
                                                value={signatures.assinatura_fiscal_2}
                                                onChange={handleSignatureChange}
                                                width={350}
                                                height={120}
                                            />
                                            <div className="mt-2 space-y-2">
                                                {renderTextField('fiscal_nome_2', 'Nome do Fiscal 2 (Opcional)', 'text', false, 255)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="font-medium text-gray-700 mb-4 text-center">ESTABELECIMENTO FISCALIZADO</h3>
                                    
                                    <div>
                                        <SignaturePad
                                            label="Assinatura do Representante da Empresa"
                                            name="assinatura_representante"
                                            value={signatures.assinatura_representante}
                                            onChange={handleSignatureChange}
                                            width={350}
                                            height={120}
                                        />
                                        <div className="mt-2 space-y-2">
                                            {renderTextField('responsavel_nome', 'Nome do Responsável', 'text', true, 255)}
                                            {renderTextField('responsavel_cpf', 'CPF', 'text', true, 20)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Status das assinaturas */}
                            <SignatureStatus />
                        </div>

                        {/* === SEÇÃO DE UPLOAD DE ARQUIVOS === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">10</span>
                                Anexos e Documentos
                            </h2>
                            <FileUpload
                                label="Documentos Anexos"
                                name="anexos"
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                multiple={true}
                                maxSize={10}
                                onFilesChange={handleFilesChange}
                                className="mb-4"
                            />
                            
                            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                                <strong>💡 Tipos de arquivo aceitos:</strong>
                                <ul className="mt-2 list-disc list-inside space-y-1">
                                    <li><strong>Imagens:</strong> JPG, PNG, GIF (para fotos das irregularidades)</li>
                                    <li><strong>Documentos:</strong> PDF, DOC, DOCX (para documentos oficiais)</li>
                                    <li><strong>Planilhas:</strong> XLS, XLSX (para dados tabulados)</li>
                                    <li><strong>Outros:</strong> TXT (para anotações adicionais)</li>
                                </ul>
                            </div>
                        </div>

                        {/* === OBSERVAÇÕES === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">11</span>
                                Observações
                            </h2>
                                                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    <strong>Importante:</strong> O autuado deverá encaminhar, no prazo de 05 (cinco) dias corridos, 
                                    documento oficial que indique a receita bruta anual do estabelecimento fiscalizado, referente aos 12 (doze) meses 
                                    anteriores à lavratura deste auto, sob pena de o valor ser estimado quando do cálculo da multa, 
                                    nos termos do Decreto Estadual do Amazonas nº 43.614/2021.
                                </p>
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
                                        <p className="text-sm text-red-700 mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === BOTÕES DE AÇÃO === */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                            <Link 
                                to="/fiscalizacao/supermercados"
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                ← Voltar para Lista
                            </Link>
                            
                            <div className="flex space-x-3">
                                <button 
                                    type="button"
                                    onClick={() => navigate('/fiscalizacao/supermercados')}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center"
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
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-green-800">Informações Importantes</h4>
                                    <div className="text-sm text-green-700 mt-1 space-y-1">
                                        <p>• O número do auto será gerado automaticamente pelo sistema.</p>
                                        <p>• Campos marcados com <span className="text-red-500">*</span> são obrigatórios.</p>
                                        <p>• Marque todas as irregularidades encontradas durante a fiscalização.</p>
                                        <p>• A narrativa dos fatos deve ser detalhada e objetiva.</p>
                                        <p>• As assinaturas digitais são capturadas através do canvas interativo.</p>
                                        <p>• Anexe fotos e documentos relacionados às irregularidades encontradas.</p>
                                        <p>• <strong>Assinaturas são obrigatórias</strong> apenas quando os nomes correspondentes são preenchidos.</p>
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

export default AutoSupermercadoCreatePage;
