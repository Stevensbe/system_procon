import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { criarAutoPosto, consultarCNPJReceita } from '../../../services/fiscalizacaoService';
import SignaturePad from "../../../components/shared/SignaturePad";
import FileUpload from "../../../components/shared/FileUpload";

function AutoPostoCreatePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cnpjStatus, setCnpjStatus] = useState(null);
    const [cnpjLoading, setCnpjLoading] = useState(false);

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
        
        // Responsáveis pelas assinaturas
        fiscal_nome_1: '',
        fiscal_nome_2: '',
        responsavel_nome: '',
        responsavel_cpf: '',
        
        // === CAMPOS ESPECÍFICOS DO AutoPosto ===
        porte: '',
        atuacao: '',
        
        // Cominação Legal
        nada_consta: false,
        sem_irregularidades: false,
        
        // Preços dos combustíveis no totem
        preco_gasolina_comum: '',
        preco_gasolina_aditivada: '',
        preco_etanol: '',
        preco_diesel_comum: '',
        preco_diesel_s10: '',
        preco_gnv: '',
        
        // Produtos não comercializados
        nao_vende_gas_comum: false,
        nao_vende_gas_aditivada: false,
        nao_vende_etanol: false,
        nao_vende_diesel_comum: false,
        nao_vende_diesel_s10: false,
        nao_vende_gnv: false,
        
        // Prazo para envio de documentos
        prazo_envio_documentos: 48,
        
        // Campos para observações
        info_adicionais: '',
        outras_irregularidades: '',
        dispositivos_legais: ''
    });

    // Estados para assinaturas - ESTRUTURA IGUAL AO AUTO BANCO
    const [signatures, setSignatures] = useState({
        assinatura_fiscal_1: '',
        assinatura_fiscal_2: '',
        assinatura_representante: ''
    });

    // Estados para arquivos anexados
    const [uploadedFiles, setUploadedFiles] = useState([]);

    // Estados para notas fiscais (seguindo o modelo Django)
    const [notasFiscais, setNotasFiscais] = useState([]);
    const [novaNota, setNovaNota] = useState({
        tipo_nota: 'aumento',
        produto: 'gas_comum',
        numero_nota: '',
        data: '',
        preco: ''
    });

    // Estados para cupons fiscais (seguindo o modelo Django)
    const [cuponsFiscais, setCuponsFiscais] = useState([]);
    const [novoCupom, setNovoCupom] = useState({
        item_tabela: '',
        dia: '',
        numero_cupom: '',
        produto: '',
        valor: '',
        percentual_diferenca: ''
    });

    // ========== FUNÇÕES DE VALIDAÇÃO IGUAIS AO AUTO BANCO ==========
    
    // Validação simples de CPF
    const isValidCPF = (cpf) => {
        const cleanCPF = cpf.replace(/\D/g, '');
        return cleanCPF.length === 11 && !/^(\d)\1{10}$/.test(cleanCPF);
    };

    // Validações para campos de assinatura - CORRIGIDA IGUAL AO AUTO BANCO
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

    // Função de validação antes do submit - CORRIGIDA IGUAL AO AUTO BANCO
    const validateFormBeforeSubmit = () => {
        const signatureErrors = validateSignatures();
        
        // Campos obrigatórios baseados no modelo Django AutoPosto
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

    // Componente para exibir status das assinaturas - IGUAL AO AUTO BANCO
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

    // Handle signature changes from SignaturePad components - IGUAL AO AUTO BANCO
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

    // Handlers para notas fiscais (modelo correto)
    const handleNotaChange = (e) => {
        const { name, value } = e.target;
        setNovaNota(prev => ({ ...prev, [name]: value }));
    };

    const adicionarNota = () => {
        if (!novaNota.numero_nota || !novaNota.data || !novaNota.preco) {
            alert('Preencha todos os campos da nota fiscal.');
            return;
        }
        setNotasFiscais(prev => [...prev, { ...novaNota }]);
        setNovaNota({ 
            tipo_nota: 'aumento',
            produto: 'gas_comum',
            numero_nota: '',
            data: '',
            preco: ''
        });
    };

    const removerNota = (index) => {
        setNotasFiscais(prev => prev.filter((_, i) => i !== index));
    };

    // Handlers para cupons fiscais (modelo correto)
    const handleCupomChange = (e) => {
        const { name, value } = e.target;
        setNovoCupom(prev => ({ ...prev, [name]: value }));
    };

    const adicionarCupom = () => {
        if (!novoCupom.item_tabela || !novoCupom.dia || !novoCupom.numero_cupom || !novoCupom.produto || !novoCupom.valor) {
            alert('Preencha todos os campos obrigatórios do cupom fiscal.');
            return;
        }
        setCuponsFiscais(prev => [...prev, { ...novoCupom }]);
        setNovoCupom({
            item_tabela: '',
            dia: '',
            numero_cupom: '',
            produto: '',
            valor: '',
            percentual_diferenca: ''
        });
    };

    const removerCupom = (index) => {
        setCuponsFiscais(prev => prev.filter((_, i) => i !== index));
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

    // Função handleSubmit corrigida
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
            
            // Mapeamento correto para backend Django
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
                
                // Responsáveis
                fiscal_nome_1: autoData.fiscal_nome_1 || '',
                fiscal_nome_2: autoData.fiscal_nome_2 || '',
                responsavel_nome: autoData.responsavel_nome || '',
                responsavel_cpf: autoData.responsavel_cpf || '',
                
                // Campos específicos do AutoPosto
                porte: autoData.porte || '',
                atuacao: autoData.atuacao || '',
                nada_consta: autoData.nada_consta || false,
                sem_irregularidades: autoData.sem_irregularidades || false,

                // Preços dos combustíveis
                preco_gasolina_comum: autoData.preco_gasolina_comum || null,
                preco_gasolina_aditivada: autoData.preco_gasolina_aditivada || null,
                preco_etanol: autoData.preco_etanol || null,
                preco_diesel_comum: autoData.preco_diesel_comum || null,
                preco_diesel_s10: autoData.preco_diesel_s10 || null,
                preco_gnv: autoData.preco_gnv || null,

                // Produtos que não são vendidos
                nao_vende_gas_comum: autoData.nao_vende_gas_comum || false,
                nao_vende_gas_aditivada: autoData.nao_vende_gas_aditivada || false,
                nao_vende_etanol: autoData.nao_vende_etanol || false,
                nao_vende_diesel_comum: autoData.nao_vende_diesel_comum || false,
                nao_vende_diesel_s10: autoData.nao_vende_diesel_s10 || false,
                nao_vende_gnv: autoData.nao_vende_gnv || false,

                // Prazo para envio de documentos
                prazo_envio_documentos: parseInt(autoData.prazo_envio_documentos) || 48,
                
                // Campos textuais
                info_adicionais: autoData.info_adicionais || '',
                outras_irregularidades: autoData.outras_irregularidades || '',
                dispositivos_legais: autoData.dispositivos_legais || ''
            };
            
            // Enviar campos um por um com conversão adequada
            Object.keys(fieldsToSend).forEach(key => {
                const value = fieldsToSend[key];
                
                if (typeof value === 'boolean') {
                    formData.append(key, value ? 'true' : 'false');
                } else if (value !== null && value !== undefined && value !== '') {
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

            // Adicionar notas fiscais (modelo correto)
            notasFiscais.forEach((nota, index) => {
                formData.append(`notas_fiscais[${index}][tipo_nota]`, nota.tipo_nota);
                formData.append(`notas_fiscais[${index}][produto]`, nota.produto);
                formData.append(`notas_fiscais[${index}][numero_nota]`, nota.numero_nota);
                formData.append(`notas_fiscais[${index}][data]`, nota.data);
                formData.append(`notas_fiscais[${index}][preco]`, nota.preco);
            });

            // Adicionar cupons fiscais (modelo correto)
            cuponsFiscais.forEach((cupom, index) => {
                formData.append(`cupons_fiscais[${index}][item_tabela]`, cupom.item_tabela);
                formData.append(`cupons_fiscais[${index}][dia]`, cupom.dia);
                formData.append(`cupons_fiscais[${index}][numero_cupom]`, cupom.numero_cupom);
                formData.append(`cupons_fiscais[${index}][produto]`, cupom.produto);
                formData.append(`cupons_fiscais[${index}][valor]`, cupom.valor);
                if (cupom.percentual_diferenca) {
                    formData.append(`cupons_fiscais[${index}][percentual_diferenca]`, cupom.percentual_diferenca);
                }
            });

            // Log detalhado para debug
            console.log('=== DADOS SENDO ENVIADOS PARA AUTOPOSTO ===');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }

            const response = await criarAutoPosto(formData);
            alert(`Auto de Posto "${response.numero}" criado com sucesso!`);
            navigate('/fiscalizacao/postos');
        } catch (err) {
            setError(err.message || 'Ocorreu um erro ao salvar. Verifique os dados e a conexão.');
        } finally {
            setLoading(false);
        }
    };

    const renderTextField = (name, label, type = 'text', required = false, maxLength = null, step = null) => (
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
                step={step}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" 
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
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" 
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
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mt-1" 
            />
            <label htmlFor={name} className="ml-2 block text-sm text-gray-700">{label}</label>
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
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
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


    // Opções corretas para nota fiscal (seguindo modelo)
    const tipoNotaOptions = [
        { value: 'aumento', label: 'Último Aumento' },
        { value: 'anterior', label: 'Anteriores' }
    ];

    const produtoNotaOptions = [
        { value: 'gas_comum', label: 'Gasolina Comum' },
        { value: 'gas_aditivada', label: 'Gasolina Aditivada' },
        { value: 'etanol', label: 'Etanol' },
        { value: 'diesel_comum', label: 'Diesel Comum' },
        { value: 'diesel_s10', label: 'Diesel S-10' },
        { value: 'gnv', label: 'GNV' }
    ];

    const prazoOptions = [
        { value: 24, label: '24 horas' },
        { value: 48, label: '48 horas' },
        { value: 72, label: '72 horas' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-orange-600 px-6 py-4">
                        <h1 className="text-2xl font-bold text-white">Novo Auto de Constatação - Posto de Combustível</h1>
                        <p className="text-orange-100 mt-1">
                            Número: <span className="font-mono bg-orange-700 px-2 py-1 rounded text-sm">Gerado Automaticamente</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        {/* === DADOS DO ESTABELECIMENTO === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm mr-2">1</span>
                                Dados do Estabelecimento
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {renderTextField('razao_social', 'Razão Social', 'text', true, 255)}
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
                                                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleConsultarCNPJ}
                                                disabled={cnpjLoading}
                                                className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 text-sm font-medium"
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
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm mr-2">2</span>
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

                        {/* === ORIGEM DA FISCALIZAÇÃO === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm mr-2">3</span>
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
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm mr-2">4</span>
                                Data e Hora da Fiscalização
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderTextField('data_fiscalizacao', 'Data da Fiscalização', 'date', true)}
                                {renderTextField('hora_fiscalizacao', 'Hora da Fiscalização', 'time', true)}
                            </div>
                            <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <p className="text-sm text-orange-800">
                                    <strong>Cominação Legal:</strong> Às <strong>{autoData.hora_fiscalizacao || '__:__'}</strong> horas do dia{' '}
                                    <strong>
                                        {autoData.data_fiscalizacao 
                                            ? new Date(autoData.data_fiscalizacao + 'T00:00:00').toLocaleDateString('pt-BR') 
                                            : '__/__/____'
                                        }
                                    </strong>, no exercício das competências dispostas no art. 55 e seguintes da Lei Federal nº 8.078/90, 
                                    legalmente atribuídas ao Instituto de Defesa do Consumidor – PROCON AMAZONAS, neste ato fiscalizatório, fora constatado que:
                                </p>
                            </div>
                        </div>

                        {/* === COMINAÇÃO LEGAL === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm mr-2">5</span>
                                Cominação Legal
                            </h2>
                            <div className="space-y-4">
                                {renderCheckboxField('nada_consta', 'Nada consta')}
                                {renderCheckboxField('sem_irregularidades', 'Não foram encontradas irregularidades')}
                            </div>
                        </div>

                        {/* === PREÇOS DOS COMBUSTÍVEIS NO TOTEM === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm mr-2">6</span>
                                Preços dos Combustíveis Expostos no Totem
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {renderTextField('preco_gasolina_comum', 'Gasolina Comum (R$ por litro)', 'number', false, null, '0.001')}
                                {renderTextField('preco_gasolina_aditivada', 'Gasolina Aditivada (R$ por litro)', 'number', false, null, '0.001')}
                                {renderTextField('preco_etanol', 'Etanol (R$ por litro)', 'number', false, null, '0.001')}
                                {renderTextField('preco_diesel_comum', 'Diesel Comum (R$ por litro)', 'number', false, null, '0.001')}
                                {renderTextField('preco_diesel_s10', 'Diesel S-10 (R$ por litro)', 'number', false, null, '0.001')}
                                {renderTextField('preco_gnv', 'GNV (R$ por metro cúbico)', 'number', false, null, '0.001')}
                            </div>

                            <div className="mt-6">
                                <h3 className="text-md font-medium text-gray-800 mb-3">Produtos não comercializados pelo estabelecimento:</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {renderCheckboxField('nao_vende_gas_comum', 'Gasolina Comum')}
                                    {renderCheckboxField('nao_vende_gas_aditivada', 'Gasolina Aditivada')}
                                    {renderCheckboxField('nao_vende_etanol', 'Etanol')}
                                    {renderCheckboxField('nao_vende_diesel_comum', 'Diesel Comum')}
                                    {renderCheckboxField('nao_vende_diesel_s10', 'Diesel S-10')}
                                    {renderCheckboxField('nao_vende_gnv', 'GNV')}
                                </div>
                            </div>
                        </div>

                        {/* === NOTAS FISCAIS === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm mr-2">7</span>
                                Notas Fiscais de Aquisição
                            </h2>
                            
                            {/* Lista de notas fiscais */}
                            <div className="bg-white rounded-lg border border-gray-200 mb-4 max-h-40 overflow-y-auto">
                                {notasFiscais.length > 0 ? (
                                    <div className="p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">Notas Registradas:</h4>
                                        <div className="space-y-2">
                                            {notasFiscais.map((nota, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <span className="text-sm">
                                                        <strong>NF:</strong> {nota.numero_nota} | 
                                                        <strong> Data:</strong> {new Date(nota.data + 'T00:00:00').toLocaleDateString('pt-BR')} | 
                                                        <strong> {produtoNotaOptions.find(p => p.value === nota.produto)?.label}:</strong> R$ {nota.preco} |
                                                        <strong> Tipo:</strong> {tipoNotaOptions.find(t => t.value === nota.tipo_nota)?.label}
                                                    </span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removerNota(i)}
                                                        className="text-red-600 hover:text-red-800 font-bold text-sm"
                                                    >
                                                        Remover
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-gray-500">
                                        Nenhuma nota fiscal registrada
                                    </div>
                                )}
                            </div>

                            {/* Formulário para nova nota fiscal */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h4 className="font-medium text-gray-900 mb-3">Adicionar Nova Nota Fiscal:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                                        <select 
                                            name="tipo_nota" 
                                            value={novaNota.tipo_nota} 
                                            onChange={handleNotaChange} 
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                        >
                                            {tipoNotaOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Produto</label>
                                        <select 
                                            name="produto" 
                                            value={novaNota.produto} 
                                            onChange={handleNotaChange} 
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                        >
                                            {produtoNotaOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Número da NF</label>
                                        <input 
                                            type="text" 
                                            placeholder="123456" 
                                            name="numero_nota" 
                                            value={novaNota.numero_nota} 
                                            onChange={handleNotaChange} 
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Data</label>
                                        <input 
                                            type="date" 
                                            name="data" 
                                            value={novaNota.data} 
                                            onChange={handleNotaChange} 
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Preço/Litro (R$)</label>
                                        <input 
                                            type="number" 
                                            step="0.001"
                                            placeholder="0.000" 
                                            name="preco" 
                                            value={novaNota.preco} 
                                            onChange={handleNotaChange} 
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={adicionarNota} 
                                    className="mt-3 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm font-medium"
                                >
                                    Adicionar Nota Fiscal
                                </button>
                            </div>
                        </div>

                        {/* === CUPONS FISCAIS === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm mr-2">8</span>
                                Cupons Fiscais de Venda
                            </h2>
                            
                            {/* Lista de cupons fiscais */}
                            <div className="bg-white rounded-lg border border-gray-200 mb-4 max-h-40 overflow-y-auto">
                                {cuponsFiscais.length > 0 ? (
                                    <div className="p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">Cupons Registrados:</h4>
                                        <div className="space-y-2">
                                            {cuponsFiscais.map((cupom, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <span className="text-sm">
                                                        <strong>Item:</strong> {cupom.item_tabela} | 
                                                        <strong> Data:</strong> {new Date(cupom.dia + 'T00:00:00').toLocaleDateString('pt-BR')} | 
                                                        <strong> Cupom:</strong> {cupom.numero_cupom} | 
                                                        <strong> Produto:</strong> {cupom.produto} | 
                                                        <strong> Valor:</strong> R$ {cupom.valor}
                                                        {cupom.percentual_diferenca && <span> | <strong>Dif.:</strong> {cupom.percentual_diferenca}%</span>}
                                                    </span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removerCupom(i)}
                                                        className="text-red-600 hover:text-red-800 font-bold text-sm"
                                                    >
                                                        Remover
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-gray-500">
                                        Nenhum cupom fiscal registrado
                                    </div>
                                )}
                            </div>

                            {/* Formulário para novo cupom fiscal */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h4 className="font-medium text-gray-900 mb-3">Adicionar Novo Cupom Fiscal:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Item Tabela</label>
                                        <input 
                                            type="text" 
                                            placeholder="1" 
                                            name="item_tabela" 
                                            value={novoCupom.item_tabela} 
                                            onChange={handleCupomChange} 
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                            maxLength="5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Data</label>
                                        <input 
                                            type="date" 
                                            name="dia" 
                                            value={novoCupom.dia} 
                                            onChange={handleCupomChange} 
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Nº Cupom</label>
                                        <input 
                                            type="text" 
                                            placeholder="123456" 
                                            name="numero_cupom" 
                                            value={novoCupom.numero_cupom} 
                                            onChange={handleCupomChange} 
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Produto</label>
                                        <input 
                                            type="text" 
                                            placeholder="Gasolina Comum" 
                                            name="produto" 
                                            value={novoCupom.produto} 
                                            onChange={handleCupomChange} 
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Valor (R$)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            placeholder="0.00" 
                                            name="valor" 
                                            value={novoCupom.valor} 
                                            onChange={handleCupomChange} 
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Diferença (%)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            placeholder="0.00" 
                                            name="percentual_diferenca" 
                                            value={novoCupom.percentual_diferenca} 
                                            onChange={handleCupomChange} 
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={adicionarCupom} 
                                    className="mt-3 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm font-medium"
                                >
                                    Adicionar Cupom Fiscal
                                </button>
                            </div>
                        </div>

                        {/* === PRAZO PARA DOCUMENTOS === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm mr-2">9</span>
                                Prazo para Envio de Documentos
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    {renderSelect('prazo_envio_documentos', 'Prazo para apresentação dos documentos', prazoOptions)}
                                </div>
                            </div>
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    <strong>Notificação:</strong> A empresa fica notificada a apresentar, no prazo de {autoData.prazo_envio_documentos || 48} horas, 
                                    via e-mail <strong>fiscalizacaoprocon@procon.am.gov.br</strong>, as notas fiscais de aquisição e os cupons fiscais de venda 
                                    ao consumidor até a presente data desta fiscalização.
                                </p>
                            </div>
                        </div>

                        {/* === OUTRAS INFORMAÇÕES === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm mr-2">10</span>
                                Outras Informações
                            </h2>
                            <div className="space-y-4">
                                {renderTextArea('outras_irregularidades', 'Outras irregularidades constatadas/outras cominações legais', 4)}
                                {renderTextArea('dispositivos_legais', 'Dispositivos legais infringidos', 4)}
                                {renderTextArea('info_adicionais', 'Informações adicionais', 4)}
                            </div>
                        </div>

                        {/* === RESPONSÁVEIS E ASSINATURAS === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm mr-2">11</span>
                                Responsáveis e Assinaturas
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="font-medium text-gray-700 mb-4 text-center">AUTORIDADE FISCALIZADORA</h3>
                                    
                                    {/* SignaturePad for Fiscal 1 - IGUAL AO AUTO BANCO */}
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

                                    {/* SignaturePad for Fiscal 2 - IGUAL AO AUTO BANCO */}
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
                                
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="font-medium text-gray-700 mb-4 text-center">ESTABELECIMENTO FISCALIZADO</h3>
                                    
                                    {/* SignaturePad for Responsible - IGUAL AO AUTO BANCO */}
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
                            
                            {/* Status das assinaturas - IGUAL AO AUTO BANCO */}
                            <SignatureStatus />
                        </div>

                        {/* === Upload de Arquivos - IGUAL AO AUTO BANCO === */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Anexar Arquivos</h2>
                            <FileUpload
                                files={uploadedFiles}
                                onFilesChange={handleFilesChange}
                                maxFiles={10}
                            />
                        </div>

                        {/* === MENSAGEM DE ERRO === */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                clipRule="evenodd"
                                            />
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
                                    className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center"
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
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-orange-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-orange-800">Informações Importantes</h4>
                                    <div className="text-sm text-orange-700 mt-1 space-y-1">
                                        <p>• O número do auto será gerado automaticamente pelo sistema.</p>
                                        <p>• Campos marcados com <span className="text-red-500">*</span> são obrigatórios.</p>
                                        <p>• Registre os preços dos combustíveis conforme exibidos no totem do posto.</p>
                                        <p>• Adicione as notas fiscais e cupons fiscais para análise de margens de lucro.</p>
                                        <p>• <strong>Assinaturas são obrigatórias</strong> apenas quando os nomes correspondentes são preenchidos.</p>
                                        <p>• O procedimento administrativo será regulado nos termos do Decreto Estadual 43.614/21.</p>
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
                                        <p>• <strong>ANP - Agência Nacional do Petróleo</strong> - Regulamentação de combustíveis</p>
                                        <p>• <strong>Decreto Estadual nº 43.614/2021</strong> - Processo administrativo</p>
                                        <p>• <strong>Portaria ANP nº 116/2000</strong> - Qualidade dos combustíveis</p>
                                        <p>• <strong>Lei nº 9.847/99</strong> - Atividades de revenda de combustíveis</p>
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

export default AutoPostoCreatePage;
