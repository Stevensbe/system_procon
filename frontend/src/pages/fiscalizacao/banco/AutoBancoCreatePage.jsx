import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { criarAutoBanco, consultarCNPJReceita } from '../../../services/fiscalizacaoService';
import SignaturePad from "../../../components/shared/SignaturePad";
import FileUpload from "../../../components/shared/FileUpload";


 // Importing necessary components and services 
function AutoBancoCreatePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cnpjStatus, setCnpjStatus] = useState(null);
    const [cnpjLoading, setCnpjLoading] = useState(false);

    // States for main form data
    const [autoData, setAutoData] = useState({
        // === CAMPOS DA CLASSE BASE (AutoConstatacaoBase) ===
        razao_social: '',
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
        
        // === CAMPOS ESPECÍFICOS DO AutoBanco ===
        porte: '',
        atuacao: '',
        
        cominacao_legal: '',
        // Cominação Legal
        nada_consta: false,
        sem_irregularidades: false,
        
        // Lei das Filas - Campos booleanos com 3 estados (True, False, None)
        todos_caixas_funcionando: null,
        distribuiu_senha: null,
        distribuiu_senha_fora_padrao: null,
        ausencia_cartaz_informativo: false,
        ausencia_profissional_libras: false,
        
        // Campos adicionais para senhas fora do padrão
        senha_sem_nome_estabelecimento: false,
        senha_sem_horarios: false,
        senha_sem_rubrica: false,
        
        relogio_exposto: null,
        observacoes: ''
    });

    // Queue attendances state
    const [atendimentos, setAtendimentos] = useState([]);
    const [novoAtendimento, setNovoAtendimento] = useState({
        letra_senha: '',
        horario_chegada: '',
        horario_atendimento: '',
        tempo_decorrido: 15,
        tipo_servico: 'simples',
        limite_tempo: 15
    });

    // Signatures state
    const [signatures, setSignatures] = useState({
        assinatura_fiscal_1: '',
        assinatura_fiscal_2: '',
        assinatura_representante: ''
    });

    // Uploaded files state
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
        
        // Campos obrigatórios baseados no modelo Django AutoBanco
        const requiredFields = [
            { field: 'razao_social', message: 'Razão Social é obrigatória' },
            { field: 'cnpj', message: 'CNPJ é obrigatório' },
            { field: 'atividade', message: 'Atividade é obrigatória' },
            { field: 'endereco', message: 'Endereço é obrigatório' },
            { field: 'municipio', message: 'Município é obrigatório' },
            { field: 'data_fiscalizacao', message: 'Data da Fiscalização é obrigatória' },
            { field: 'hora_fiscalizacao', message: 'Hora da Fiscalização é obrigatória' },
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
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Status das Assinaturas:</h4>
            <div className="space-y-1 text-xs">
                <div className={`flex items-center ${
                    !autoData.fiscal_nome_1 ? 'text-gray-400 dark:text-gray-500' : 
                    signatures.assinatura_fiscal_1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                    {!autoData.fiscal_nome_1 ? '–' : signatures.assinatura_fiscal_1 ? '✓' : '✗'} Fiscal Principal
                    {autoData.fiscal_nome_1 && !signatures.assinatura_fiscal_1 && ' (OBRIGATÓRIA)'}
                </div>
                <div className={`flex items-center ${
                    !autoData.fiscal_nome_2 ? 'text-gray-400 dark:text-gray-500' : 
                    signatures.assinatura_fiscal_2 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                    {!autoData.fiscal_nome_2 ? '–' : signatures.assinatura_fiscal_2 ? '✓' : '✗'} Fiscal Secundário
                    {autoData.fiscal_nome_2 && !signatures.assinatura_fiscal_2 && ' (OBRIGATÓRIA)'}
                </div>
                <div className={`flex items-center ${
                    !autoData.responsavel_nome ? 'text-gray-400 dark:text-gray-500' : 
                    signatures.assinatura_representante ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                    {!autoData.responsavel_nome ? '–' : signatures.assinatura_representante ? '✓' : '✗'} Representante
                    {autoData.responsavel_nome && !signatures.assinatura_representante && ' (OBRIGATÓRIA)'}
                </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                💡 Dica: As assinaturas são obrigatórias apenas quando os nomes correspondentes são preenchidos.
            </div>
        </div>
    );

    // ========== FIM DAS FUNÇÕES DE VALIDAÇÃO ==========

    // Handle input changes for autoData form fields
    const handleAutoChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setAutoData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'radio') {
            let newValue;
            if (value === 'true') newValue = true;
            else if (value === 'false') newValue = false;
            else newValue = null;
            setAutoData(prev => ({ ...prev, [name]: newValue }));
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

    // Handle input changes for new attendance
    const handleAtendimentoChange = (e) => {
        const { name, value } = e.target;
        if (name === 'tipo_servico') {
            const limiteDefault = value === 'complexo' ? 30 : 15;
            setNovoAtendimento(prev => ({
                ...prev,
                tipo_servico: value,
                limite_tempo: limiteDefault
            }));
            return;
        }
        setNovoAtendimento(prev => ({ ...prev, [name]: value }));
    };

    // Add a new attendance entry
    const adicionarAtendimento = () => {
        if (!novoAtendimento.letra_senha || !novoAtendimento.horario_chegada || !novoAtendimento.horario_atendimento) {
            alert('Preencha todos os campos do atendimento.');
            return;
        }
        setAtendimentos(prev => [...prev, { ...novoAtendimento }]);
        setNovoAtendimento({
            letra_senha: '',
            horario_chegada: '',
            horario_atendimento: '',
            tempo_decorrido: 15,
            tipo_servico: 'simples',
            limite_tempo: 15
        });
    };

    // Remove attendance entry by index
    const removerAtendimento = (index) => {
        setAtendimentos(prev => prev.filter((_, i) => i !== index));
    };

    // Handle signature changes from SignaturePad components
    const handleSignatureChange = (name, signatureData) => {
        setSignatures(prev => ({
            ...prev,
            [name]: signatureData
        }));
    };

    // Handle files uploaded from FileUpload component
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
                
                // Campos específicos do AutoBanco
                porte: autoData.porte || '',
                atuacao: autoData.atuacao || '',
                
                cominacao_legal: autoData.cominacao_legal || '',
                // Cominação Legal
                nada_consta: autoData.nada_consta || false,
                sem_irregularidades: autoData.sem_irregularidades || false,
                
                // Lei das Filas - Campos booleanos com 3 estados
                todos_caixas_funcionando: autoData.todos_caixas_funcionando,
                distribuiu_senha: autoData.distribuiu_senha,
                distribuiu_senha_fora_padrao: autoData.distribuiu_senha_fora_padrao,
                ausencia_cartaz_informativo: autoData.ausencia_cartaz_informativo || false,
                ausencia_profissional_libras: autoData.ausencia_profissional_libras || false,
                
                relogio_exposto: autoData.relogio_exposto,
                // Campos para senhas fora do padrão
                senha_sem_nome_estabelecimento: autoData.senha_sem_nome_estabelecimento || false,
                senha_sem_horarios: autoData.senha_sem_horarios || false,
                senha_sem_rubrica: autoData.senha_sem_rubrica || false,
                
                // Observações
                observacoes: autoData.observacoes || ''
            };

            // Enviar campos um por um com conversão adequada
            Object.keys(fieldsToSend).forEach(key => {
                const value = fieldsToSend[key];
                
                // Conversão de tipos para o backend Django
                if (typeof value === 'boolean') {
                    formData.append(key, value ? 'true' : 'false');
                } else if (value === null) {
                    // Para campos com 3 estados (True, False, None)
                    formData.append(key, '');
                } else if (value !== undefined) {
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
                    } else {
                        console.warn(`Falha ao processar assinatura: ${signatureKey}`);
                    }
                }
            });

            // Adicionar arquivos
            if (uploadedFiles && uploadedFiles.length > 0) {
                uploadedFiles.forEach((fileObj, index) => {
                    if (fileObj && fileObj.file instanceof File) {
                        formData.append('anexos', fileObj.file);
                        formData.append(`anexo_descricao_${index}`, fileObj.name || fileObj.file.name);
                    }
                });
            }
            if (atendimentos && atendimentos.length > 0) {
                formData.append('atendimentos_caixa_data', JSON.stringify(atendimentos));
            }

            // Log detalhado para debug
            console.log('=== DADOS SENDO ENVIADOS PARA AUTOBANCO ===');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }
            console.log('Total de atendimentos:', atendimentos.length);

            const response = await criarAutoBanco(formData);
            alert(`Auto de Banco "${response.numero}" criado com sucesso!`);
            navigate('/fiscalizacao/bancos');
        } catch (err) {
            setError(err.message || 'Ocorreu um erro ao salvar. Verifique os dados e a conexão.');
        } finally {
            setLoading(false);
        }
    };

    // Helper render functions
    const renderTextField = (name, label, type = 'text', required = false, maxLength = null) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
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
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
            />
        </div>
    );

    const renderTextArea = (name, label, rows = 3, required = false) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
                id={name}
                name={name}
                value={autoData[name]}
                onChange={handleAutoChange}
                required={required}
                rows={rows}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
            />
        </div>
    );

    const renderCheckboxField = (name, label) => (
        <div className="flex items-start">
            <input
                type="checkbox"
                id={name}
                name={name}
                checked={autoData[name]}
                onChange={handleAutoChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded mt-1 transition-colors duration-300"
            />
            <label htmlFor={name} className="ml-2 block text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">{label}</label>
        </div>
    );

    const renderRadioGroup = (name, question, note = '') => (
        <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">{question}</p>
            {note && <p className="text-xs text-gray-500 dark:text-gray-400 italic transition-colors duration-300">{note}</p>}
            <div className="flex items-center space-x-4">
                <div className="flex items-center">
                    <input
                        type="radio"
                        id={`${name}_sim`}
                        name={name}
                        value="true"
                        checked={autoData[name] === true}
                        onChange={handleAutoChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 transition-colors duration-300"
                    />
                    <label htmlFor={`${name}_sim`} className="ml-2 text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">Sim</label>
                </div>
                <div className="flex items-center">
                    <input
                        type="radio"
                        id={`${name}_nao`}
                        name={name}
                        value="false"
                        checked={autoData[name] === false}
                        onChange={handleAutoChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 transition-colors duration-300"
                    />
                    <label htmlFor={`${name}_nao`} className="ml-2 text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">Não</label>
                </div>
                <div className="flex items-center">
                    <input
                        type="radio"
                        id={`${name}_null`}
                        name={name}
                        value="null"
                        checked={autoData[name] === null}
                        onChange={handleAutoChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 transition-colors duration-300"
                    />
                    <label htmlFor={`${name}_null`} className="ml-2 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Não se aplica</label>
                </div>
            </div>
        </div>
    );

    const renderRadioGroupInverted = (name, question, note = '') => {
        const value = autoData[name];
        const isYes = value === false;
        const isNo = value === true;
        const isNull = value === null;

        const handleChange = (event) => {
            const { value: next } = event.target;
            let nextValue = null;
            if (next === 'true') nextValue = false;
            else if (next === 'false') nextValue = true;
            setAutoData(prev => ({ ...prev, [name]: nextValue }));
        };

        return (
            <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">{question}</p>
                {note && <p className="text-xs text-gray-500 dark:text-gray-400 italic transition-colors duration-300">{note}</p>}
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <input
                            type="radio"
                            id={`${name}_sim`}
                            name={name}
                            value="true"
                            checked={isYes}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 transition-colors duration-300"
                        />
                        <label htmlFor={`${name}_sim`} className="ml-2 text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">Sim</label>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="radio"
                            id={`${name}_nao`}
                            name={name}
                            value="false"
                            checked={isNo}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 transition-colors duration-300"
                        />
                        <label htmlFor={`${name}_nao`} className="ml-2 text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">Não</label>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="radio"
                            id={`${name}_null`}
                            name={name}
                            value="null"
                            checked={isNull}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 transition-colors duration-300"
                        />
                        <label htmlFor={`${name}_null`} className="ml-2 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Não se aplica</label>
                    </div>
                </div>
            </div>
        );
    };

    const renderSelect = (name, label, options, required = false) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                id={name}
                name={name}
                value={autoData[name]}
                onChange={handleAutoChange}
                required={required}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
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

    const formatAtendimentoHora = (value) => (value ? value : '_____:_____');
    const formatAtendimentoSenha = (value) => (value ? value : '____________');
    const markChoice = (checked) => (checked ? '(X)' : '(___)');

    const renderAtendimentosResumo = (titulo, items, limites, indice) => (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 transition-colors duration-300">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300">{titulo}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 transition-colors duration-300">
                {indice}º) {markChoice(items.length > 0)} Não atender o consumidor nos prazos previstos na Lei, conforme as senhas:
            </p>
            <div className="mt-3 space-y-3">
                {['a', 'b', 'c'].map((letra, idx) => {
                    const item = items[idx] || {};
                    return (
                        <div key={letra} className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                            <div>
                                {letra}) Nº {formatAtendimentoSenha(item.letra_senha)} horário de chegada {formatAtendimentoHora(item.horario_chegada)} horário de atendimento {formatAtendimentoHora(item.horario_atendimento)}.
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-300">
                                <span>{markChoice(item.limite_tempo === limites[0])} {limites[0]} min./dias normais.</span>
                                <span>{markChoice(item.limite_tempo === limites[1])} {limites[1]} min./vesp./pós feriados.</span>
                                <span>{markChoice(item.limite_tempo === limites[2])} {limites[2]} min./pagamento</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

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
        { value: 'AP', label: 'Amapá' },
        { value: 'AM', label: 'Amazonas' },
        { value: 'BA', label: 'Bahia' },
        { value: 'CE', label: 'Ceará' },
        { value: 'DF', label: 'Distrito Federal' },
        { value: 'ES', label: 'Espírito Santo' },
        { value: 'GO', label: 'Goiás' },
        { value: 'MA', label: 'Maranhão' },
        { value: 'MT', label: 'Mato Grosso' },
        { value: 'MS', label: 'Mato Grosso do Sul' },
        { value: 'MG', label: 'Minas Gerais' },
        { value: 'PA', label: 'Pará' },
        { value: 'PB', label: 'Paraíba' },
        { value: 'PR', label: 'Paraná' },
        { value: 'PE', label: 'Pernambuco' },
        { value: 'PI', label: 'Piauí' },
        { value: 'RJ', label: 'Rio de Janeiro' },
        { value: 'RN', label: 'Rio Grande do Norte' },
        { value: 'RS', label: 'Rio Grande do Sul' },
        { value: 'RO', label: 'Rondônia' },
        { value: 'RR', label: 'Roraima' },
        { value: 'SC', label: 'Santa Catarina' },
        { value: 'SP', label: 'São Paulo' },
        { value: 'SE', label: 'Sergipe' },
        { value: 'TO', label: 'Tocantins' },
    ];

    const atendimentosSimples = atendimentos.filter((at) => at.tipo_servico === 'simples');
    const atendimentosComplexos = atendimentos.filter((at) => at.tipo_servico === 'complexo');


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0c0f12] py-6 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-[#1a1d21] shadow-xl rounded-lg overflow-hidden transition-colors duration-300">
                    {/* Header */}
                    <div className="bg-blue-600 px-6 py-4">
                        <h1 className="text-2xl font-bold text-white">Novo Auto de Constatação - Banco</h1>
                        <p className="text-blue-100 mt-1">
                            Número: <span className="font-mono bg-blue-700 px-2 py-1 rounded text-sm">Gerado Automaticamente</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        {/* === Dados do Estabelecimento === */}
                        <div className="bg-gray-50 dark:bg-[#0c0f12] rounded-lg p-6 transition-colors duration-300">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center transition-colors duration-300">
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm mr-2 transition-colors duration-300">1</span>
                                Dados do Estabelecimento
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {renderTextField('razao_social', 'Razão Social', 'text', true, 255)}
                                {renderTextField('nome_fantasia', 'Nome Fantasia', 'text', false, 255)}
                                <div>
                                    <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
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
                                                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleConsultarCNPJ}
                                                disabled={cnpjLoading}
                                                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium transition-colors duration-300"
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

                        {/* === Endereço e Contato === */}
                        <div className="bg-gray-50 dark:bg-[#0c0f12] rounded-lg p-6 transition-colors duration-300">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center transition-colors duration-300">
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm mr-2 transition-colors duration-300">2</span>
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

                        {/* === Origem da Fiscalização === */}
                        <div className="bg-gray-50 dark:bg-[#0c0f12] rounded-lg p-6 transition-colors duration-300">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center transition-colors duration-300">
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm mr-2 transition-colors duration-300">3</span>
                                Origem da Fiscalização
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderSelect('origem', 'Origem', origemOptions, true)}
                                {autoData.origem === 'outros' && renderTextField('origem_outros', 'Especificar Outros', 'text', false, 255)}
                            </div>
                        </div>

                        {/* === Cominacao Legal === */}
                        <div className="bg-gray-50 dark:bg-[#0c0f12] rounded-lg p-6 transition-colors duration-300">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center transition-colors duration-300">
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm mr-2 transition-colors duration-300">4</span>
                                Cominacao Legal
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderTextField('data_fiscalizacao', 'Data da Fiscalização', 'date', true)}
                                {renderTextField('hora_fiscalizacao', 'Hora da Fiscalização', 'time', true)}
                            </div>
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-300">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Cominação Legal:</strong> Às <strong>{autoData.hora_fiscalizacao || '__:__'}</strong> horas do dia{' '}
                                    <strong>
                                        {autoData.data_fiscalizacao
                                            ? new Date(autoData.data_fiscalizacao + 'T00:00:00').toLocaleDateString('pt-BR')
                                            : '__/__/____'}
                                    </strong>, no exercício das competências dispostas no art. 55 e seguintes da Lei Federal nº 8.078/90,{' '}
                                    legalmente atribuídas ao Instituto de Defesa do Consumidor – PROCON AMAZONAS, fora constatado que:
                                </p>
                            </div>
                            <div className="mt-4 space-y-4">
                                {renderCheckboxField('nada_consta', 'Nada consta')}
                                {renderCheckboxField('sem_irregularidades', 'No momento da fiscalização não foram constatadas irregularidades consumeristas')}
                                {renderTextArea('cominacao_legal', 'Texto principal da cominacao legal', 4)}
                            </div>
                        </div>

                        {/* === Lei das Filas === */}
                        <div className="bg-gray-50 dark:bg-[#0c0f12] rounded-lg p-6 transition-colors duration-300">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center transition-colors duration-300">
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm mr-2 transition-colors duration-300">5</span>
                                Lei das Filas - Irregularidades
                            </h2>
                            <div className="space-y-6">
                                {renderRadioGroup(
                                    'todos_caixas_funcionando',
                                    'a) Todos os caixas/quiosques estão preenchidos e em funcionamento?',
                                    'Caso "Sim", será acrescentado o prazo de 10 minutos - art. 10, §2º, Lei nº 5.867/2022.'
                                )}

                                {renderRadioGroup(
                                    'distribuiu_senha',
                                    'b) Distribui senha para atendimento?',
                                    'Art. 11 Lei nº 5.867/2022.'
                                )}

                                {renderRadioGroup(
                                    'distribuiu_senha_fora_padrao',
                                    'c) Distribui senhas/bilhetes fora do padrão?',
                                    'Art. 11 Lei nº 5.867/2022 - ausente um ou mais dos seguintes itens obrigatórios:'
                                )}

                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 transition-colors duration-300">
                                        Itens obrigatórios:
                                    </p>
                                    <div className="space-y-2 pl-4">
                                        {renderCheckboxField('senha_sem_nome_estabelecimento', 'Nome do estabelecimento')}
                                        {renderCheckboxField('senha_sem_horarios', 'Horários entrada/atendimento')}
                                        {renderCheckboxField('senha_sem_rubrica', 'Rubrica do funcionário')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        {renderRadioGroupInverted(
                                            'ausencia_cartaz_informativo',
                                            'd) Possui Cartaz informativo sobre o tempo máximo de espera para atendimento conforme "Lei das Filas"?',
                                            'Art. 12 Lei nº 5.867/2022 - Dimensão mínima 60cm x 50cm.'
                                        )}
                                    </div>

                                    <div>
                                        {renderRadioGroupInverted(
                                            'ausencia_profissional_libras',
                                            'e) Possui profissional capacitado intérprete em Língua Brasileira de Sinais (LIBRAS) ou plataforma de acessibilidade com sistema que atenda aos portadores de deficiência auditiva, em local de fácil acesso e com sinalização de indicação?',
                                            'Art. 2º da Lei Estadual do Amazonas nº 6.254/2013.'
                                        )}
                                    </div>
                                </div>

                                {renderRadioGroup(
                                    'relogio_exposto',
                                    'g) Possui relógio exposto em local visível?',
                                    'Art. 11 da Lei Estadual nº 5.867/2022.'
                                )}
                            </div>
                        </div>

                        {/* === Atendimentos de Caixa === */}
                        <div className="bg-gray-50 dark:bg-[#0c0f12] rounded-lg p-6 transition-colors duration-300">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center transition-colors duration-300">
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm mr-2 transition-colors duration-300">6</span>
                                Atendimentos de Caixa (Lei das Filas)
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                {renderAtendimentosResumo(
                                    'Serviço de caixa (Art. 10, incisos I, II e II da Lei nº 5.867/22 - AM)',
                                    atendimentosSimples,
                                    [15, 20, 25],
                                    1
                                )}
                                {renderAtendimentosResumo(
                                    'Serviço mais complexos (Art. 10, § 1º, incisos I, II e III da Lei nº 5.867/22 - AM)',
                                    atendimentosComplexos,
                                    [30, 40, 50],
                                    2
                                )}
                            </div>

                            {/* List of attendances */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 max-h-40 overflow-y-auto transition-colors duration-300">
                                {atendimentos.length > 0 ? (
                                    <div className="p-4">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-300">Atendimentos Registrados:</h4>
                                        <div className="space-y-2">
                                            {atendimentos.map((at, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded transition-colors duration-300">
                                                    <span className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                                                        <strong>Senha:</strong> {at.letra_senha} |{' '}
                                                        <strong>Chegada:</strong> {at.horario_chegada} |{' '}
                                                        <strong>Atendimento:</strong> {at.horario_atendimento} |{' '}
                                                        <strong>Tipo:</strong> {at.tipo_servico} |{' '}
                                                        <strong>Limite:</strong> {at.limite_tempo || '-'} min |{' '}
                                                        <strong>Tempo:</strong> {at.tempo_decorrido} min
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removerAtendimento(i)}
                                                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-bold text-sm transition-colors duration-300"
                                                    >
                                                        Remover
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 transition-colors duration-300">Nenhum atendimento registrado</div>
                                )}
                            </div>

                            {/* New attendance form */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-3 transition-colors duration-300">Adicionar Novo Atendimento:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">Senha</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: A001"
                                            name="letra_senha"
                                            value={novoAtendimento.letra_senha}
                                            onChange={handleAtendimentoChange}
                                            maxLength="10"
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">Horário Chegada</label>
                                        <input
                                            type="time"
                                            name="horario_chegada"
                                            value={novoAtendimento.horario_chegada}
                                            onChange={handleAtendimentoChange}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">Horário Atendimento</label>
                                        <input
                                            type="time"
                                            name="horario_atendimento"
                                            value={novoAtendimento.horario_atendimento}
                                            onChange={handleAtendimentoChange}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">Tempo (min)</label>
                                        <select
                                            name="tempo_decorrido"
                                            value={novoAtendimento.tempo_decorrido}
                                            onChange={handleAtendimentoChange}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
                                        >
                                            <option value="15">15 min</option>
                                            <option value="20">20 min</option>
                                            <option value="25">25 min</option>
                                            <option value="30">30 min</option>
                                            <option value="40">40 min</option>
                                            <option value="50">50 min</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">Tipo de Servico</label>
                                        <select
                                            name="tipo_servico"
                                            value={novoAtendimento.tipo_servico}
                                            onChange={handleAtendimentoChange}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
                                        >
                                            <option value="simples">Servico de caixa</option>
                                            <option value="complexo">Servico mais complexo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">Limite (min)</label>
                                        <select
                                            name="limite_tempo"
                                            value={novoAtendimento.limite_tempo}
                                            onChange={handleAtendimentoChange}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
                                        >
                                            {(novoAtendimento.tipo_servico === 'complexo' ? [30, 40, 50] : [15, 20, 25]).map((tempo) => (
                                                <option key={tempo} value={tempo}>{tempo} min</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={adicionarAtendimento}
                                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors duration-300"
                                >
                                    Adicionar Atendimento
                                </button>
                            </div>
                        </div>

                        {/* === Observações === */}
                        <div className="bg-gray-50 dark:bg-[#0c0f12] rounded-lg p-6 transition-colors duration-300">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center transition-colors duration-300">
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm mr-2 transition-colors duration-300">7</span>
                                Observações
                            </h2>
                            {renderTextArea('observacoes', 'Observações e outras irregularidades constatadas/cominações legais', 5)}
                        </div>

                        {/* === Responsáveis e Assinaturas === */}
                        <div className="bg-gray-50 dark:bg-[#0c0f12] rounded-lg p-6 transition-colors duration-300">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center transition-colors duration-300">
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm mr-2 transition-colors duration-300">8</span>
                                Responsáveis e Assinaturas
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
                                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4 text-center transition-colors duration-300">AUTORIDADE FISCALIZADORA</h3>

                                    {/* SignaturePad for Fiscal 1 */}
                                    <div className="mb-4">
                                        <SignaturePad
                                            name="assinatura_fiscal_1"
                                            label="Assinatura do Fiscal Principal"
                                            value={signatures.assinatura_fiscal_1}
                                            onChange={handleSignatureChange}
                                            required={true}
                                        />
                                        <div className="space-y-2 mt-3">
                                            {renderTextField('fiscal_nome_1', 'Nome do Fiscal', 'text', true, 255)}
                                        </div>
                                    </div>

                                    {/* SignaturePad for Fiscal 2 */}
                                    <div>
                                        <SignaturePad
                                            name="assinatura_fiscal_2"
                                            label="Assinatura do Fiscal 2 (Opcional)"
                                            value={signatures.assinatura_fiscal_2}
                                            onChange={handleSignatureChange}
                                        />
                                        <div className="space-y-2 mt-3">
                                            {renderTextField('fiscal_nome_2', 'Nome do Fiscal 2 (Opcional)', 'text', false, 255)}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
                                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4 text-center transition-colors duration-300">ESTABELECIMENTO FISCALIZADO</h3>

                                    {/* SignaturePad for Responsible */}
                                    <div>
                                        <SignaturePad
                                            name="assinatura_representante"
                                            label="Assinatura do Representante"
                                            value={signatures.assinatura_representante}
                                            onChange={handleSignatureChange}
                                            required={true}
                                        />
                                        <div className="space-y-2 mt-3">
                                            {renderTextField('responsavel_nome', 'Nome do Responsável', 'text', true, 255)}
                                            {renderTextField('responsavel_cpf', 'CPF', 'text', true, 20)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Status das assinaturas */}
                            <SignatureStatus />
                        </div>

                        {/* === Upload de Arquivos === */}
                        <div className="bg-gray-50 dark:bg-[#0c0f12] rounded-lg p-6 transition-colors duration-300">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Anexar Arquivos</h2>
                            <FileUpload
                                files={uploadedFiles}
                                onFilesChange={handleFilesChange}
                                maxFiles={10}
                            />
                        </div>

                        {/* === Mensagem de erro === */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400 dark:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Erro ao salvar</h3>
                                        <div className="text-sm text-red-700 dark:text-red-300 mt-1 whitespace-pre-line">{error}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === Botões de ação === */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
                            <Link to="/fiscalizacao" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors duration-300">
                                ← Voltar para Lista
                            </Link>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors duration-300"
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
                                            <svg
                                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                className="w-4 h-4 mr-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                            Salvar Auto de Constatação
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* === Informações adicionais === */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 transition-colors duration-300">
                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-blue-400 dark:text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Informações Importantes</h4>
                                    <div className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                                        <p>• O número do auto será gerado automaticamente pelo sistema.</p>
                                        <p>• Campos marcados com <span className="text-red-500">*</span> são obrigatórios.</p>
                                        <p>• Para campos de múltipla escolha, selecione "Não se aplica" se a situação não for verificada.</p>
                                        <p>• O procedimento administrativo será regulado nos termos do Decreto Estadual 43.614/21.</p>
                                        <p>• <strong>Assinaturas são obrigatórias</strong> apenas quando os nomes correspondentes são preenchidos.</p>
                                        <p>• Registre os atendimentos de caixa para análise da Lei das Filas.</p>
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

export default AutoBancoCreatePage;
