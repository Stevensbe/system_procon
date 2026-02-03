import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAutoSupermercadoById, atualizarAutoSupermercado, consultarCNPJReceita } from '../../../services/fiscalizacaoService';
import IrregularidadesSelector from '../../../components/fiscalizacao/IrregularidadesSelector';

function AutoSupermercadoEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
    const [cnpjStatus, setCnpjStatus] = useState(null);
    const [cnpjLoading, setCnpjLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    numero: '',
    data_fiscalizacao: '',
    hora_fiscalizacao: '',

    razao_social: '',
    nome_fantasia: '',
    porte: '',
    atuacao: '',
    atividade: '',
    cnpj: '',
    endereco: '',
    municipio: '',
    estado: 'AM',
    cep: '',
    telefone: '',
    email: '',

    origem: 'acao',
    origem_outros: '',

    nada_consta: false,
    cominacao_legal: '',

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

    fiscal_nome_1: '',
    fiscal_nome_2: '',
    responsavel_nome: '',
    responsavel_cpf: ''
  });

  useEffect(() => {
    carregarAuto();
  }, [id]);

  const carregarAuto = async () => {
    try {
      setLoading(true);
      const data = await getAutoSupermercadoById(id);
      
      // Formatar dados para o formulário
      const formattedData = {
        ...data,
        data_fiscalizacao: data.data_fiscalizacao || '',
        hora_fiscalizacao: data.hora_fiscalizacao || '',
        porte: data.porte || '',
        atuacao: data.atuacao || '',
        atividade: data.atividade || '',
        estado: data.estado || 'AM',
        origem: data.origem || 'acao',
        origem_outros: data.origem_outros || '',
        prazo_cumprimento_dias: data.prazo_cumprimento_dias || 5,
        nada_consta: Boolean(data.nada_consta),
        comercializar_produtos_vencidos: Boolean(data.comercializar_produtos_vencidos),
        comercializar_embalagem_violada: Boolean(data.comercializar_embalagem_violada),
        comercializar_lata_amassada: Boolean(data.comercializar_lata_amassada),
        comercializar_sem_validade: Boolean(data.comercializar_sem_validade),
        comercializar_mal_armazenados: Boolean(data.comercializar_mal_armazenados),
        comercializar_descongelados: Boolean(data.comercializar_descongelados),
        publicidade_enganosa: Boolean(data.publicidade_enganosa),
        obstrucao_monitor: Boolean(data.obstrucao_monitor),
        afixacao_precos_fora_padrao: Boolean(data.afixacao_precos_fora_padrao),
        ausencia_afixacao_precos: Boolean(data.ausencia_afixacao_precos),
        afixacao_precos_fracionados_fora_padrao: Boolean(data.afixacao_precos_fracionados_fora_padrao),
        ausencia_visibilidade_descontos: Boolean(data.ausencia_visibilidade_descontos),
        ausencia_placas_promocao_vencimento: Boolean(data.ausencia_placas_promocao_vencimento),
        possui_anexo: Boolean(data.possui_anexo),
        auto_apreensao: Boolean(data.auto_apreensao),
        necessita_pericia: Boolean(data.necessita_pericia),
        vicios_aparentes: Boolean(data.vicios_aparentes),
        receita_bruta_notificada: Boolean(data.receita_bruta_notificada),
        cominacao_legal: data.cominacao_legal || '',
        instrucoes_fiscalizado: data.instrucoes_fiscalizado || '',
        outras_irregularidades: data.outras_irregularidades || '',
        narrativa_fatos: data.narrativa_fatos || '',
        auto_apreensao_numero: data.auto_apreensao_numero || '',
      };;
      
      setFormData(formattedData);
    } catch (err) {
      setError(err.message || 'Erro ao carregar auto de supermercado');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'cnpj') {
      setCnpjStatus(null);
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleConsultarCNPJ = async () => {
    try {
      setCnpjLoading(true);
      setCnpjStatus(null);
      const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
      const data = await consultarCNPJReceita(cleanCNPJ);
        setFormData(prev => ({
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
        email: data.email || prev.email,
      }));
      const detalhe = data.razao_social ? `Razao social: ${data.razao_social}` : 'CNPJ confirmado na Receita Federal.';
      setCnpjStatus({ type: 'success', message: detalhe, cnpj: cleanCNPJ });
    } catch (err) {
      setCnpjStatus({ type: 'error', message: err.message || 'Erro ao consultar CNPJ.' });
    } finally {
      setCnpjLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');

      const cleanCNPJ = (formData.cnpj || '').replace(/\D/g, '');
      if (!cnpjStatus || cnpjStatus.type !== 'success' || cnpjStatus.cnpj !== cleanCNPJ) {
        try {
          setCnpjLoading(true);
          const data = await consultarCNPJReceita(cleanCNPJ);
          setFormData(prev => ({
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
            email: data.email || prev.email,
          }));
          const detalhe = data.razao_social ? `Razao social: ${data.razao_social}` : 'CNPJ confirmado na Receita Federal.';
          setCnpjStatus({ type: 'success', message: detalhe, cnpj: cleanCNPJ });
        } catch (err) {
          setError(`CNPJ: ${err.message || 'Erro ao consultar CNPJ.'}`);
          setSaving(false);
          return;
        } finally {
          setCnpjLoading(false);
        }
      }
      
      await atualizarAutoSupermercado(id, formData);
      navigate(`/fiscalizacao/supermercados/${id}`, { 
        state: { message: 'Auto de supermercado atualizado com sucesso!' }
      });
    } catch (err) {
      setError(err.message || 'Erro ao atualizar auto de supermercado');
    } finally {
      setSaving(false);
    }
  };



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
    { value: 'grande', label: 'Grande Porte' },
  ];

  const prazoOptions = [
    { value: 5, label: '5 dias' },
    { value: 10, label: '10 dias' },
    { value: 15, label: '15 dias' },
    { value: 30, label: '30 dias' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <div className="text-lg text-gray-600">Carregando auto de supermercado...</div>
        </div>
      </div>
    );
  }

  if (error && !formData.id) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <h3 className="font-bold text-lg">Erro ao carregar auto</h3>
          <p className="mt-2">{error}</p>
          <Link 
            to="/fiscalizacao/supermercado"
            className="mt-3 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            ← Voltar à lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Editar Auto de Supermercado</h1>
            <p className="text-gray-600">Auto nº {formData.numero || id}</p>
          </div>
          <Link
            to={`/fiscalizacao/supermercados/${id}`}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            ← Voltar
          </Link>
        </div>
      </div>

      {/* Erro de salvamento */}
      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Dados básicos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Dados Básicos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do Auto
              </label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Ex: 2024/001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data da Fiscalização *
              </label>
              <input
                type="date"
                name="data_fiscalizacao"
                value={formData.data_fiscalizacao}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora da Fiscalização
              </label>
              <input
                type="time"
                name="hora_fiscalizacao"
                value={formData.hora_fiscalizacao}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>



        {/* Cominacao Legal */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Cominacao Legal</h2>
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              <strong>Cominacao Legal:</strong> às <strong>{formData.hora_fiscalizacao || '__:__'}</strong> horas do dia{' '}
              <strong>
                {formData.data_fiscalizacao
                  ? new Date(formData.data_fiscalizacao + 'T00:00:00').toLocaleDateString('pt-BR')
                  : '__/__/____'}
              </strong>, no exercício das competências dispostas no art. 55 e seguintes da Lei Federal nº 8.078/90,
              legalmente atribuídas ao Instituto de Defesa do Consumidor - PROCON AMAZONAS, neste ato fiscalizatório, constatamos que:
            </p>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texto principal da cominacao legal
            </label>
            <textarea
              name="cominacao_legal"
              value={formData.cominacao_legal}
              onChange={handleChange}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Dados do estabelecimento */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Dados do Estabelecimento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razão Social *
              </label>
              <input
                type="text"
                name="razao_social"
                value={formData.razao_social}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Digite a razão social"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Fantasia
              </label>
              <input
                type="text"
                name="nome_fantasia"
                value={formData.nome_fantasia}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Digite o nome fantasia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Porte
              </label>
              <select
                name="porte"
                value={formData.porte}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione...</option>
                {porteOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Atuacao
              </label>
              <input
                type="text"
                name="atuacao"
                value={formData.atuacao}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Natureza juridica"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Atividade *
              </label>
              <input
                type="text"
                name="atividade"
                value={formData.atividade}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Atividade principal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ *
              </label>
              <div className="mt-1 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    required
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                    placeholder="00.000.000/0000-00"
                  />
                  <button
                    type="button"
                    onClick={handleConsultarCNPJ}
                    disabled={cnpjLoading}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Município *
              </label>
              <input
                type="text"
                name="municipio"
                value={formData.municipio}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Digite o município"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado *
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {estadoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Digite o endereço completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <input
                type="text"
                name="cep"
                value={formData.cep}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="00000-000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="(00) 0000-0000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
        </div>



        {/* Origem da Fiscalização */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Origem da Fiscalização</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origem
              </label>
              <select
                name="origem"
                value={formData.origem}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="acao">Ação Fiscalizatória</option>
                <option value="denuncia">Denúncia</option>
                <option value="forca_tarefa">Força Tarefa</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            {formData.origem === 'outros' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especificar Outros
                </label>
                <input
                  type="text"
                  name="origem_outros"
                  value={formData.origem_outros}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            )}
          </div>
        </div>

        {/* Responsável legal */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Responsável Legal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Responsável
              </label>
              <input
                type="text"
                name="responsavel_nome"
                value={formData.responsavel_nome}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF do Responsável
              </label>
              <input
                type="text"
                name="responsavel_cpf"
                value={formData.responsavel_cpf}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="000.000.000-00"
              />
            </div>
          </div>
        </div>


        {/* Irregularidades Constatadas */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Irregularidades Constatadas</h2>
          <IrregularidadesSelector
            tipo="supermercado"
            irregularidades={{
              comercializar_produtos_vencidos: formData.comercializar_produtos_vencidos,
              comercializar_embalagem_violada: formData.comercializar_embalagem_violada,
              comercializar_lata_amassada: formData.comercializar_lata_amassada,
              comercializar_sem_validade: formData.comercializar_sem_validade,
              comercializar_mal_armazenados: formData.comercializar_mal_armazenados,
              comercializar_descongelados: formData.comercializar_descongelados,
              publicidade_enganosa: formData.publicidade_enganosa,
              obstrucao_monitor: formData.obstrucao_monitor,
              afixacao_precos_fora_padrao: formData.afixacao_precos_fora_padrao,
              ausencia_afixacao_precos: formData.ausencia_afixacao_precos,
              afixacao_precos_fracionados_fora_padrao: formData.afixacao_precos_fracionados_fora_padrao,
              ausencia_visibilidade_descontos: formData.ausencia_visibilidade_descontos,
              ausencia_placas_promocao_vencimento: formData.ausencia_placas_promocao_vencimento,
              nada_consta: formData.nada_consta
            }}
            onChange={(irregularidades) => {
              setFormData(prev => ({
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

        {/* Prazo e Outras Informações */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Prazo e Outras Informações</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo para cumprimento da obrigação (dias)</label>
                <select
                  name="prazo_cumprimento_dias"
                  value={formData.prazo_cumprimento_dias}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {prazoOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="possui_anexo"
                    checked={formData.possui_anexo}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Possui anexo</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="auto_apreensao"
                    checked={formData.auto_apreensao}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Possui auto de apreensão/inutilização</span>
                </label>
                {formData.auto_apreensao && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número do Auto de Apreensão/Inutilização</label>
                    <input
                      type="text"
                      name="auto_apreensao_numero"
                      value={formData.auto_apreensao_numero}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="necessita_pericia"
                    checked={formData.necessita_pericia}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Os itens apreendidos e ou descartados necessitam de perícia</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="vicios_aparentes"
                    checked={formData.vicios_aparentes}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Todos os vícios estavam aparentes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="receita_bruta_notificada"
                    checked={formData.receita_bruta_notificada}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Receita Bruta Notificada</span>
                </label>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outras irregularidades constatadas/outras cominações legais</label>
                <textarea
                  name="outras_irregularidades"
                  value={formData.outras_irregularidades}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Narrativa dos fatos</label>
                <textarea
                  name="narrativa_fatos"
                  value={formData.narrativa_fatos}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instruções ao fiscalizado</label>
                <textarea
                  name="instrucoes_fiscalizado"
                  value={formData.instrucoes_fiscalizado}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> O autuado deverá encaminhar, no prazo de 05 (cinco) dias corridos,
                  documento oficial que indique a receita bruta anual do estabelecimento fiscalizado, referente aos 12 (doze) meses
                  anteriores à lavratura deste auto, sob pena de o valor ser estimado quando do cálculo da multa,
                  nos termos do Decreto Estadual do Amazonas nº 43.614/2021.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fiscais responsáveis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Fiscais Responsáveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiscal Responsável
              </label>
              <input
                type="text"
                name="fiscal_nome_1"
                value={formData.fiscal_nome_1}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Nome do fiscal responsável"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiscal Secundário
              </label>
              <input
                type="text"
                name="fiscal_nome_2"
                value={formData.fiscal_nome_2}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Nome do fiscal secundário"
              />
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-4">
          <Link
            to={`/fiscalizacao/supermercados/${id}`}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-3 rounded-lg text-white font-medium ${
              saving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AutoSupermercadoEditPage;
