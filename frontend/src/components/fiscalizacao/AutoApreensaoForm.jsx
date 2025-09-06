import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CameraIcon } from '@heroicons/react/24/outline';
import BarcodeScannerGoogleVision from './BarcodeScannerGoogleVision';
import produtosService from '../../services/produtosService';

const AutoApreensaoForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [autosSupermercado, setAutosSupermercado] = useState([]);
    const [proximoNumero, setProximoNumero] = useState('');
    const [auto, setAuto] = useState({
        tipo_documento: 'apreensao',
        numero_documento: '',
        ano_documento: new Date().getFullYear(),
        auto_constatacao: null, // ID do auto de constatação selecionado
        razao_social: '',
        nome_fantasia: '',
        atividade: '',
        endereco: '',
        cep: '',
        municipio: '',
        estado: 'AM',
        cnpj: '',
        telefone: '',
        cominacao_legal: '',
        auto_constatacao_numero: '',
        itens: [],
        necessita_pericia: false,
        justificativa_pericia: '',
        local: '',
        data_fiscalizacao: '',
        hora_inicio: '',
        hora_termino: '',
        fiscal_1: '',
        fiscal_2: '',
        responsavel_estabelecimento: '',
        cpf_responsavel: ''
    });

    const [novoItem, setNovoItem] = useState({
        item: '',
        quantidade: 1,
        unidade: '',
        especificacao: '',
        valor_unitario: 0,
        motivo_apreensao: ''
    });

    const [showScanner, setShowScanner] = useState(false);
    const [loadingProduct, setLoadingProduct] = useState(false);

    useEffect(() => {
        if (id) {
            carregarAuto();
        } else {
            carregarAutosSupermercado();
            carregarProximoNumero();
        }
    }, [id]);

    const carregarAuto = async () => {
        try {
            setLoading(true);
            if (id === 'novo') {
                // Para novo auto, não faz requisição GET
                setAuto({
                    tipo_documento: 'apreensao',
                    numero_documento: '',
                    ano_documento: new Date().getFullYear(),
                    auto_constatacao: null,
                    razao_social: '',
                    nome_fantasia: '',
                    atividade: '',
                    endereco: '',
                    cep: '',
                    municipio: '',
                    estado: 'AM',
                    cnpj: '',
                    telefone: '',
                    cominacao_legal: '',
                    auto_constatacao_numero: '',
                    itens: [],
                    necessita_pericia: false,
                    justificativa_pericia: '',
                    local: '',
                    data_fiscalizacao: new Date().toISOString().split('T')[0],
                    hora_inicio: '',
                    hora_termino: '',
                    fiscal_1: '',
                    fiscal_2: '',
                    responsavel_estabelecimento: '',
                    cpf_responsavel: ''
                });
            } else {
                const response = await axios.get(`/api/fiscalizacao/apreensao-inutilizacao/${id}/`);
                setAuto(response.data);
            }
        } catch (error) {
            toast.error('Erro ao carregar auto de apreensão');
        } finally {
            setLoading(false);
        }
    };

    const carregarAutosSupermercado = async () => {
        try {
            const response = await axios.get('/api/fiscalizacao/apreensao-inutilizacao/autos_supermercado_disponiveis/');
            setAutosSupermercado(response.data);
        } catch (error) {
            console.error('Erro ao carregar autos de supermercado:', error);
        }
    };

    const carregarProximoNumero = async () => {
        try {
            const response = await axios.get('/api/fiscalizacao/apreensao-inutilizacao/proximo_numero/');
            setProximoNumero(response.data.proximo_numero);
        } catch (error) {
            console.error('Erro ao carregar próximo número:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAuto(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (value || '')
        }));
    };

    const handleItemChange = (e) => {
        const { name, value } = e.target;
        setNovoItem(prev => ({
            ...prev,
            [name]: value || ''
        }));
    };

    const selecionarAutoConstatacao = (autoConstatacao) => {
        setAuto(prev => ({
            ...prev,
            auto_constatacao: autoConstatacao.id,
            razao_social: autoConstatacao.razao_social || '',
            nome_fantasia: autoConstatacao.nome_fantasia || '',
            atividade: autoConstatacao.atividade || '',
            endereco: autoConstatacao.endereco || '',
            cep: autoConstatacao.cep || '',
            municipio: autoConstatacao.municipio || '',
            estado: autoConstatacao.estado || 'AM',
            cnpj: autoConstatacao.cnpj || '',
            telefone: autoConstatacao.telefone || '',
            auto_constatacao_numero: autoConstatacao.numero || '',
            data_fiscalizacao: autoConstatacao.data_fiscalizacao || '',
            hora_inicio: autoConstatacao.hora_fiscalizacao || '',
            fiscal_1: autoConstatacao.fiscal_nome_1 || '',
            fiscal_2: autoConstatacao.fiscal_nome_2 || '',
            responsavel_estabelecimento: autoConstatacao.responsavel_nome || '',
            cpf_responsavel: autoConstatacao.responsavel_cpf || ''
        }));
        
        toast.success(`Auto de Constatação ${autoConstatacao.numero} selecionado!`);
    };

    const adicionarItem = () => {
        if (!novoItem.item || !novoItem.especificacao) {
            toast.error('Preencha os campos obrigatórios do item');
            return;
        }

        setAuto(prev => ({
            ...prev,
            itens: [...prev.itens, { ...novoItem, id: Date.now() }]
        }));

        setNovoItem({
            item: '',
            quantidade: 1,
            unidade: '',
            especificacao: '',
            valor_unitario: 0,
            motivo_apreensao: ''
        });
    };

    const removerItem = (index) => {
        setAuto(prev => ({
            ...prev,
            itens: prev.itens.filter((_, i) => i !== index)
        }));
    };

    const handleBarcodeScan = async (codigoBarras) => {
        try {
            setLoadingProduct(true);
            setShowScanner(false);
            
            // Usar a nova API unificada de código de barras
            const response = await produtosService.buscarPorCodigoBarras(codigoBarras);
            
            if (response.success && response.produto) {
                const produto = response.produto;
                
                // Preencher o formulário com os dados do produto
                setNovoItem(prev => ({
                    ...prev,
                    item: produto.nome || `Produto ${codigoBarras}`,
                    especificacao: produto.especificacao || 'Produto escaneado - especificações devem ser preenchidas manualmente',
                    valor_unitario: produto.preco_referencia ? parseFloat(produto.preco_referencia) : 0,
                    unidade: produto.unidade_medida || 'un'
                }));

                // Mostrar mensagem baseada na fonte dos dados
                let mensagem = `Produto escaneado: ${produto.nome}`;
                if (response.source === 'internal') {
                    mensagem += ' (Dados do sistema interno)';
                } else if (response.source === 'external') {
                    mensagem += ' (Dados de API externa)';
                } else if (response.source === 'generic') {
                    mensagem += ' (Produto genérico - preencha especificações)';
                }
                
                toast.success(mensagem);
                
                // Se for produto externo, oferecer para salvar no banco interno
                if (response.source === 'external' || response.source === 'generic') {
                    const salvar = window.confirm(
                        'Produto encontrado em fonte externa. Deseja salvar no banco interno para futuras consultas?'
                    );
                    
                    if (salvar) {
                        try {
                            await produtosService.criarProdutoAPIScanner({
                                nome: produto.nome,
                                codigo_barras: produto.codigo_barras,
                                especificacao: produto.especificacao,
                                unidade_medida: produto.unidade_medida,
                                preco_referencia: produto.preco_referencia,
                                classificacao_risco: produto.classificacao_risco,
                                controlado_anvisa: produto.controlado_anvisa,
                                tem_validade: produto.tem_validade,
                                condicoes_armazenamento: produto.condicoes_armazenamento
                            });
                            toast.success('Produto salvo no banco interno!');
                        } catch (error) {
                            console.error('Erro ao salvar produto:', error);
                            toast.error('Erro ao salvar produto no banco interno');
                        }
                    }
                }
            } else {
                toast.error('Produto não encontrado');
            }
            
        } catch (error) {
            console.error('Erro ao processar código de barras:', error);
            toast.error('Erro ao buscar informações do produto');
        } finally {
            setLoadingProduct(false);
        }
    };

    const handleScannerClose = () => {
        setShowScanner(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!auto.razao_social || !auto.nome_fantasia || !auto.endereco) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        try {
            setLoading(true);
            
            if (id) {
                await axios.put(`/api/fiscalizacao/apreensao-inutilizacao/${id}/`, auto);
                toast.success('Auto de apreensão atualizado com sucesso');
            } else {
                await axios.post('/api/fiscalizacao/apreensao-inutilizacao/', auto);
                toast.success('Auto de apreensão criado com sucesso');
            }
            
            navigate('/fiscalizacao/apreensao-inutilizacao');
        } catch (error) {
            toast.error('Erro ao salvar auto de apreensão');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {id ? 'Editar' : 'Novo'} Auto de Apreensão/Inutilização
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tipo do Documento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo do Documento
                        </label>
                        <select
                            name="tipo_documento"
                            value={auto.tipo_documento}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="apreensao">Auto de Apreensão</option>
                            <option value="inutilizacao">Inutilização</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número do Documento
                        </label>
                                                 <input
                             type="text"
                             name="numero_documento"
                             value={proximoNumero || auto.numero_documento || ''}
                             readOnly
                             className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                             placeholder="Gerado automaticamente"
                         />
                        <p className="text-xs text-gray-500 mt-1">Número gerado automaticamente</p>
                    </div>
                </div>

                {/* Seleção do Auto de Constatação */}
                {!id && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">
                            📋 Selecionar Auto de Constatação de Supermercado
                        </h3>
                        
                        {autosSupermercado.length > 0 ? (
                            <div className="space-y-3">
                                <p className="text-sm text-blue-700">
                                    Selecione o Auto de Constatação para preencher automaticamente os dados:
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {autosSupermercado.map((autoConstatacao) => (
                                        <div
                                            key={autoConstatacao.id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                auto.auto_constatacao === autoConstatacao.id
                                                    ? 'border-blue-500 bg-blue-100'
                                                    : 'border-gray-200 bg-white hover:border-blue-300'
                                            }`}
                                            onClick={() => selecionarAutoConstatacao(autoConstatacao)}
                                        >
                                            <div className="font-medium text-sm text-gray-800">
                                                {autoConstatacao.numero}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                {autoConstatacao.razao_social}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(autoConstatacao.data_fiscalizacao).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-blue-700">
                                    Nenhum Auto de Constatação de Supermercado disponível.
                                </p>
                                <p className="text-sm text-blue-600 mt-1">
                                    Crie primeiro um Auto de Constatação de Supermercado.
                                </p>
                            </div>
                        )}
                    </div>
                )}



                {/* Estabelecimento */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Dados do Estabelecimento</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Razão Social *
                            </label>
                                                         <input
                                 type="text"
                                 name="razao_social"
                                 value={auto.razao_social || ''}
                                 onChange={handleInputChange}
                                 required
                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                             />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome Fantasia *
                            </label>
                            <input
                                type="text"
                                name="nome_fantasia"
                                value={auto.nome_fantasia || ''}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Atividade
                            </label>
                            <input
                                type="text"
                                name="atividade"
                                value={auto.atividade || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CNPJ
                            </label>
                            <input
                                type="text"
                                name="cnpj"
                                value={auto.cnpj || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="00.000.000/0000-00"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Endereço *
                            </label>
                            <input
                                type="text"
                                name="endereco"
                                value={auto.endereco || ''}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CEP
                            </label>
                            <input
                                type="text"
                                name="cep"
                                value={auto.cep || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="00000-000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Município
                            </label>
                            <input
                                type="text"
                                name="municipio"
                                value={auto.municipio || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Justificativa Legal */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cominação Legal
                    </label>
                    <textarea
                        name="cominacao_legal"
                                                 value={auto.cominacao_legal || ''}
                        onChange={handleInputChange}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Base legal para a apreensão/inutilização..."
                    />
                </div>

                {/* Auto de Constatação */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auto de Constatação Nº
                    </label>
                    <input
                        type="text"
                        name="auto_constatacao_numero"
                                                 value={auto.auto_constatacao_numero || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Número do auto de constatação"
                    />
                </div>

                {/* Itens */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Itens Apreendidos/Inutilizados</h3>
                    
                    {/* Lista de itens */}
                    {auto.itens.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-medium mb-2">Itens adicionados:</h4>
                            <div className="space-y-2">
                                {auto.itens.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                                        <div>
                                            <span className="font-medium">{item.item}</span>
                                            <span className="text-gray-600 ml-2">
                                                - {item.quantidade} {item.unidade}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removerItem(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Formulário para novo item */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Item *
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    name="item"
                                                                         value={novoItem.item || ''}
                                    onChange={handleItemChange}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nome do item"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowScanner(true)}
                                    disabled={loadingProduct}
                                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                    title="Escanear código de barras"
                                >
                                    <CameraIcon className="h-4 w-4" />
                                </button>
                            </div>
                            {loadingProduct && (
                                <p className="text-sm text-blue-600 mt-1">
                                    Buscando informações do produto...
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantidade
                            </label>
                            <input
                                type="number"
                                name="quantidade"
                                value={novoItem.quantidade || 1}
                                onChange={handleItemChange}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Unidade
                            </label>
                            <input
                                type="text"
                                name="unidade"
                                value={novoItem.unidade || ''}
                                onChange={handleItemChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="un, kg, l, etc."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Especificação *
                            </label>
                            <input
                                type="text"
                                name="especificacao"
                                value={novoItem.especificacao || ''}
                                onChange={handleItemChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Descrição detalhada do item"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valor Unitário (R$)
                            </label>
                            <input
                                type="number"
                                name="valor_unitario"
                                value={novoItem.valor_unitario || 0}
                                onChange={handleItemChange}
                                step="0.01"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Motivo da Apreensão/Inutilização
                            </label>
                            <textarea
                                name="motivo_apreensao"
                                                                 value={novoItem.motivo_apreensao || ''}
                                onChange={handleItemChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Motivo da apreensão ou inutilização..."
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={adicionarItem}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Adicionar Item
                    </button>
                </div>

                {/* Perícia */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Perícia</h3>
                    
                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            name="necessita_pericia"
                            checked={auto.necessita_pericia}
                            onChange={handleInputChange}
                            className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">
                            Os itens apreendidos/inutilizados necessitam de perícia?
                        </label>
                    </div>

                    {auto.necessita_pericia && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Justificativa da Perícia
                            </label>
                            <textarea
                                name="justificativa_pericia"
                                value={auto.justificativa_pericia || ''}
                                onChange={handleInputChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Justificativa para a necessidade de perícia..."
                            />
                        </div>
                    )}
                </div>

                {/* Data e Hora */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Local
                        </label>
                        <input
                            type="text"
                            name="local"
                            value={auto.local || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data da Fiscalização
                        </label>
                        <input
                            type="date"
                            name="data_fiscalizacao"
                            value={auto.data_fiscalizacao || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hora do Início
                        </label>
                        <input
                            type="time"
                            name="hora_inicio"
                            value={auto.hora_inicio || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hora do Término
                        </label>
                        <input
                            type="time"
                            name="hora_termino"
                            value={auto.hora_termino || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Assinaturas */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Assinaturas</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fiscal 1
                            </label>
                            <input
                                type="text"
                                name="fiscal_1"
                                value={auto.fiscal_1 || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fiscal 2
                            </label>
                            <input
                                type="text"
                                name="fiscal_2"
                                value={auto.fiscal_2 || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome do Responsável
                            </label>
                            <input
                                type="text"
                                name="responsavel_estabelecimento"
                                value={auto.responsavel_estabelecimento || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CPF do Responsável
                            </label>
                            <input
                                type="text"
                                name="cpf_responsavel"
                                value={auto.cpf_responsavel || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="000.000.000-00"
                            />
                        </div>
                    </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate('/fiscalizacao/apreensao-inutilizacao')}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : (id ? 'Atualizar' : 'Salvar')}
                    </button>
                </div>
            </form>

            {/* Componente de Escaneamento de Código de Barras */}
            <BarcodeScannerGoogleVision
                isOpen={showScanner}
                onScan={handleBarcodeScan}
                onClose={handleScannerClose}
            />
        </div>
    );
};

export default AutoApreensaoForm;
