import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import notificacaoService from '../../services/fiscalizacaoNotificacaoService';

const AUTO_TIPOS = [
  { value: '', label: 'Selecione' },
  { value: 'banco', label: 'Auto Banco' },
  { value: 'posto', label: 'Auto Posto' },
  { value: 'supermercado', label: 'Auto Supermercado' },
  { value: 'diversos', label: 'Auto Diversos' },
  { value: 'infracao', label: 'Auto Infracao (AI)' },
];

const TIPO_NOTIFICACAO = [
  { value: 'auto_infracao', label: 'Auto Infracao' },
  { value: 'arquivamento', label: 'Arquivamento' },
  { value: 'prazo_vencendo', label: 'Prazo Vencendo' },
  { value: 'prazo_vencido', label: 'Prazo Vencido' },
  { value: 'defesa_apresentada', label: 'Defesa Apresentada' },
  { value: 'recurso_apresentado', label: 'Recurso Apresentado' },
  { value: 'decisao_proferida', label: 'Decisao Proferida' },
];

const STATUS_LABELS = {
  pendente: 'Pendente',
  enviada: 'Enviada',
  entregue: 'Entregue',
  lida: 'Lida',
  erro: 'Erro',
};

const AUTO_FIELD_MAP = {
  banco: 'auto',
  posto: 'auto_posto',
  supermercado: 'auto_supermercado',
  diversos: 'auto_diversos',
  infracao: 'auto_infracao',
};

const AUTO_ENDPOINTS = {
  banco: { list: '/bancos/', detail: '/bancos/', searchParam: 'search' },
  posto: { list: '/postos/', detail: '/postos/', searchParam: 'search' },
  supermercado: { list: '/supermercados/', detail: '/supermercados/', searchParam: 'search' },
  diversos: { list: '/diversos/', detail: '/diversos/', searchParam: 'search' },
  infracao: { list: '/infracoes/', detail: '/infracoes/', searchParam: 'numero' },
};

const FILE_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

const initialForm = {
  auto_tipo: '',
  auto_numero: '',
  auto_id: '',
  auto_infracao_numero: '',
  auto_infracao_id: '',
  tipo_notificacao: 'auto_infracao',
  destinatario_nome: '',
  destinatario_email: '',
  destinatario_cpf_cnpj: '',
  representante_legal: '',
  endereco: '',
  municipio: '',
  estado: '',
  cep: '',
  mensagem: '',
};

const normalizarNumero = (valor) => (
  String(valor || '')
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/[^0-9A-Z/]/g, '')
);

const padNumeroSequencial = (valor) => {
  const texto = normalizarNumero(valor);
  const partes = texto.split('/');
  if (partes.length !== 2) return texto;
  const [seq, ano] = partes;
  if (!seq || !ano || !/^\d+$/.test(seq) || !/^\d{4}$/.test(ano)) {
    return texto;
  }
  return `${seq.padStart(3, '0')}/${ano}`;
};

const formatDocumentoNumero = (numero) => (numero ? `${numero}-DFISC/PROCON` : 'Gerado ao salvar');

const formatarDataExtenso = (data) => (
  data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
);

const NotificacoesFiscalizacaoPage = () => {
  const [formData, setFormData] = useState(initialForm);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [selectedNumero, setSelectedNumero] = useState('');
  const [autoData, setAutoData] = useState(null);
  const [autoInfracaoData, setAutoInfracaoData] = useState(null);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoInfracaoLoading, setAutoInfracaoLoading] = useState(false);
  const [autoError, setAutoError] = useState('');
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState(null);
  const [sendEmail, setSendEmail] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendSubject, setSendSubject] = useState('');
  const [sendProcessoNumero, setSendProcessoNumero] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const statusOptions = useMemo(() => [
    { value: '', label: 'Todos' },
    ...Object.keys(STATUS_LABELS).map((key) => ({
      value: key,
      label: STATUS_LABELS[key],
    })),
  ], []);

  const previewData = useMemo(() => {
    const cidade = formData.municipio || 'Manaus';
    const estado = formData.estado || 'AM';
    const cep = formData.cep || '';
    return {
      numero: formatDocumentoNumero(selectedNumero),
      ppa: 'Gerado ao enviar',
      data: `${cidade}, ${formatarDataExtenso(new Date())}`,
      destinatario: formData.destinatario_nome,
      cnpj: formData.destinatario_cpf_cnpj,
      representante: formData.representante_legal,
      endereco: formData.endereco,
      cidadeLinha: `${cidade}-${estado}${cep ? ` - CEP: ${cep}` : ''}`,
      mensagem: formData.mensagem,
    };
  }, [formData, selectedNumero]);

  const loadNotificacoes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificacaoService.listNotificacoes(
        statusFilter ? { status: statusFilter, ordering: '-id' } : { ordering: '-id' }
      );
      const lista = Array.isArray(data) ? data : data?.results || [];
      setItems(lista);
    } catch (err) {
      setError(err?.message || 'Erro ao carregar notificacoes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotificacoes();
  }, [statusFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'auto_tipo') {
        next.auto_numero = '';
        next.auto_id = '';
      }
      if (name === 'auto_numero') {
        next.auto_id = '';
      }
      if (name === 'auto_infracao_numero') {
        next.auto_infracao_id = '';
      }
      return next;
    });
    if (name === 'auto_tipo' || name === 'auto_numero') {
      setAutoData(null);
      setAutoError('');
    }
    if (name === 'auto_infracao_numero') {
      setAutoInfracaoData(null);
    }
  };

  const preencherDadosAuto = (auto) => {
    setAutoData(auto);
    setFormData((prev) => ({
      ...prev,
      auto_id: auto?.id ? String(auto.id) : prev.auto_id,
      auto_numero: auto?.numero || prev.auto_numero,
      destinatario_nome: auto?.razao_social || prev.destinatario_nome,
      destinatario_cpf_cnpj: auto?.cnpj || prev.destinatario_cpf_cnpj,
      representante_legal: prev.representante_legal || auto?.responsavel_nome || '',
      endereco: auto?.endereco || prev.endereco,
      municipio: auto?.municipio || prev.municipio,
      estado: auto?.estado || prev.estado,
      cep: auto?.cep || prev.cep,
    }));
  };

  const preencherAutoInfracao = (auto) => {
    setAutoInfracaoData(auto);
    setFormData((prev) => ({
      ...prev,
      auto_infracao_id: auto?.id ? String(auto.id) : prev.auto_infracao_id,
      auto_infracao_numero: auto?.numero || prev.auto_infracao_numero,
    }));
  };

  const buscarAutoPorNumero = async (autoTipo, numero) => {
    if (!autoTipo || !numero) {
      setAutoError('Informe o tipo e o numero do auto.');
      return;
    }
    const config = AUTO_ENDPOINTS[autoTipo];
    if (!config) {
      setAutoError('Tipo de auto invalido.');
      return;
    }
    setAutoLoading(true);
    setAutoError('');
    try {
      const numeroNormalizado = padNumeroSequencial(numero);
      const params = { [config.searchParam]: numeroNormalizado };
      const response = await api.get(config.list, { params });
      const data = response.data;
      const lista = Array.isArray(data) ? data : data?.results || [];
      const numeroBusca = normalizarNumero(numeroNormalizado);
      const encontrado = lista.find(
        (item) => {
          const numeroItem = normalizarNumero(item?.numero);
          return (
            numeroItem === numeroBusca ||
            numeroItem.endsWith(numeroBusca) ||
            numeroBusca.endsWith(numeroItem)
          );
        }
      ) || (lista.length === 1 ? lista[0] : null);
      if (!encontrado) {
        try {
          const fallback = await api.get('/buscar-autos/', {
            params: { q: numeroNormalizado, tipo: 'todos', limite: 5 },
          });
          const resultados = fallback.data?.resultados || [];
          const resultado = resultados.find((item) => {
            const numeroItem = normalizarNumero(item?.numero);
            return (
              numeroItem === numeroBusca ||
              numeroItem.endsWith(numeroBusca) ||
              numeroBusca.endsWith(numeroItem)
            );
          }) || (resultados.length === 1 ? resultados[0] : null);
          if (resultado?.id && resultado?.tipo) {
            setFormData((prev) => ({
              ...prev,
              auto_tipo: resultado.tipo,
              auto_id: String(resultado.id),
              auto_numero: resultado.numero || prev.auto_numero,
            }));
            await buscarAutoPorId(resultado.tipo, resultado.id);
            return;
          }
        } catch (fallbackError) {
          // ignorar para exibir erro padrao
        }
        setAutoError('Auto nao encontrado para esse numero.');
        return;
      }
      preencherDadosAuto(encontrado);
    } catch (err) {
      setAutoError(err?.message || 'Nao foi possivel buscar o auto.');
    } finally {
      setAutoLoading(false);
    }
  };

  const buscarAutoPorId = async (autoTipo, autoId) => {
    if (!autoTipo || !autoId) {
      return;
    }
    const config = AUTO_ENDPOINTS[autoTipo];
    if (!config) {
      return;
    }
    setAutoLoading(true);
    setAutoError('');
    try {
      const response = await api.get(`${config.detail}${autoId}/`);
      preencherDadosAuto(response.data);
    } catch (err) {
      setAutoError(err?.message || 'Nao foi possivel carregar o auto.');
    } finally {
      setAutoLoading(false);
    }
  };

  const handleBuscarAuto = () => {
    buscarAutoPorNumero(formData.auto_tipo, formData.auto_numero.trim());
  };

  const buscarAutoInfracaoPorNumero = async (numero) => {
    if (!numero) {
      setAutoError('Informe o numero do auto de infracao.');
      return;
    }
    setAutoInfracaoLoading(true);
    setAutoError('');
    try {
      const numeroNormalizado = padNumeroSequencial(numero);
      const response = await api.get('/infracoes/', { params: { numero: numeroNormalizado } });
      const data = response.data;
      const lista = Array.isArray(data) ? data : data?.results || [];
      const numeroBusca = normalizarNumero(numeroNormalizado);
      const encontrado = lista.find((item) => {
        const numeroItem = normalizarNumero(item?.numero);
        return (
          numeroItem === numeroBusca ||
          numeroItem.endsWith(numeroBusca) ||
          numeroBusca.endsWith(numeroItem)
        );
      }) || (lista.length === 1 ? lista[0] : null);
      if (!encontrado) {
        setAutoError('Auto de infracao nao encontrado para esse numero.');
        return;
      }
      preencherAutoInfracao(encontrado);
    } catch (err) {
      setAutoError(err?.message || 'Nao foi possivel buscar o auto de infracao.');
    } finally {
      setAutoInfracaoLoading(false);
    }
  };

  const buscarAutoInfracaoPorId = async (autoId) => {
    if (!autoId) {
      return;
    }
    setAutoInfracaoLoading(true);
    setAutoError('');
    try {
      const response = await api.get(`/infracoes/${autoId}/`);
      preencherAutoInfracao(response.data);
    } catch (err) {
      setAutoError(err?.message || 'Nao foi possivel carregar o auto de infracao.');
    } finally {
      setAutoInfracaoLoading(false);
    }
  };

  const buildPayload = () => {
    const autoNumeroAssunto = formData.auto_numero ? padNumeroSequencial(formData.auto_numero) : '';
    const assunto = autoNumeroAssunto
      ? `Auto ${autoNumeroAssunto}`
      : 'Notificacao Fiscalizacao';
    const payload = {
      tipo_notificacao: formData.tipo_notificacao,
      destinatario_nome: formData.destinatario_nome || undefined,
      destinatario_email: formData.destinatario_email || undefined,
      destinatario_cpf_cnpj: formData.destinatario_cpf_cnpj || undefined,
      representante_legal: formData.representante_legal || undefined,
      assunto,
      mensagem: formData.mensagem || undefined,
    };

    if (formData.auto_tipo && formData.auto_id) {
      const field = AUTO_FIELD_MAP[formData.auto_tipo];
      payload[field] = Number(formData.auto_id);
    }
    if (formData.auto_infracao_id) {
      payload.auto_infracao = Number(formData.auto_infracao_id);
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = buildPayload();
      if (editingId) {
        await notificacaoService.updateNotificacao(editingId, payload);
        setSuccess('Notificacao atualizada.');
      } else {
        await notificacaoService.createNotificacao(payload);
        setSuccess('Notificacao criada.');
      }
      setFormData(initialForm);
      setEditingId(null);
      setSelectedNumero('');
      setAutoData(null);
      setAutoInfracaoData(null);
      await loadNotificacoes();
    } catch (err) {
      setError(err?.message || 'Erro ao salvar notificacao.');
    } finally {
      setSubmitting(false);
    }
  };

  const abrirEnviarModal = async (item) => {
    setError('');
    setSuccess('');
    setSendTarget(item);
    setSendEmail(item?.destinatario_email || '');
    setSendMessage(item?.mensagem || '');
    setSendSubject(item?.assunto || '');
    setSendProcessoNumero('');
    if (item?.processo) {
      try {
        const response = await api.get(`/processos/${item.processo}/`);
        const numero = response.data?.numero_processo || '';
        if (numero) {
          setSendProcessoNumero(numero);
          setSendSubject(numero);
        }
      } catch (err) {
        setError(err?.message || 'Nao foi possivel carregar o numero do processo.');
      }
    }
    setSendModalOpen(true);
  };

  const fecharEnviarModal = () => {
    setSendModalOpen(false);
    setSendTarget(null);
    setSendLoading(false);
  };

  const confirmarEnvio = async () => {
    if (!sendTarget) return;
    if (!sendEmail || !sendEmail.includes('@')) {
      setError('Informe um email valido para envio.');
      return;
    }
    setSendLoading(true);
    setError('');
    setSuccess('');
    try {
      const assuntoFinal = sendSubject || sendProcessoNumero || sendTarget.assunto || '';
      const payload = {};
      if (sendEmail !== sendTarget.destinatario_email) {
        payload.destinatario_email = sendEmail;
      }
      if (sendMessage !== sendTarget.mensagem) {
        payload.mensagem = sendMessage;
      }
      if (assuntoFinal && assuntoFinal !== sendTarget.assunto) {
        payload.assunto = assuntoFinal;
      }
      if (Object.keys(payload).length > 0) {
        await notificacaoService.updateNotificacao(sendTarget.id, payload);
      }
      await notificacaoService.enviarNotificacao(sendTarget.id);
      setSuccess('Notificacao enviada.');
      fecharEnviarModal();
      await loadNotificacoes();
    } catch (err) {
      setError(err?.message || 'Erro ao enviar notificacao.');
    } finally {
      setSendLoading(false);
    }
  };

  const handleGerarDocumento = async (item) => {
    setError('');
    setSuccess('');
    try {
      await notificacaoService.updateNotificacao(item.id, {});
      setSuccess('Documento atualizado.');
      await loadNotificacoes();
    } catch (err) {
      setError(err?.message || 'Erro ao gerar documento.');
    }
  };

  const handleEditar = (item) => {
    const autoTipo = item.auto
      ? 'banco'
      : item.auto_posto
        ? 'posto'
        : item.auto_supermercado
          ? 'supermercado'
          : item.auto_diversos
            ? 'diversos'
            : item.auto_infracao
              ? 'infracao'
              : '';
    const autoId = item.auto || item.auto_posto || item.auto_supermercado || item.auto_diversos || item.auto_infracao || '';
    setFormData({
      auto_tipo: autoTipo,
      auto_numero: '',
      auto_id: autoId ? String(autoId) : '',
      auto_infracao_numero: '',
      auto_infracao_id: item.auto_infracao ? String(item.auto_infracao) : '',
      tipo_notificacao: item.tipo_notificacao || 'auto_infracao',
      destinatario_nome: item.destinatario_nome || '',
      destinatario_email: item.destinatario_email || '',
      destinatario_cpf_cnpj: item.destinatario_cpf_cnpj || '',
      representante_legal: item.representante_legal || '',
      endereco: '',
      municipio: '',
      estado: '',
      cep: '',
      mensagem: item.mensagem || '',
    });
    setEditingId(item.id);
    setSelectedNumero(item.numero || '');
    if (autoTipo && autoId) {
      buscarAutoPorId(autoTipo, autoId);
    }
    if (item.auto_infracao) {
      buscarAutoInfracaoPorId(item.auto_infracao);
    }
    setSuccess('');
  };

  const handleCancelarEdicao = () => {
    setFormData(initialForm);
    setEditingId(null);
    setSelectedNumero('');
    setAutoData(null);
    setAutoInfracaoData(null);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Deseja excluir esta notificacao?')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await notificacaoService.deleteNotificacao(id);
      setSuccess('Notificacao removida.');
      await loadNotificacoes();
    } catch (err) {
      setError(err?.message || 'Erro ao excluir notificacao.');
    }
  };

  const buildFileUrl = (arquivo) => {
    if (!arquivo) return '';
    const baseUrl = FILE_BASE_URL ? FILE_BASE_URL.replace(/\/$/, '') : '';
    const mediaPath = arquivo.startsWith('/') ? arquivo : `/media/${arquivo}`;
    return baseUrl ? `${baseUrl}${mediaPath}` : mediaPath;
  };

  const getAnexoArquivo = (item) => {
    if (!item || !Array.isArray(item.anexos)) return '';
    const pdf = item.anexos.find(
      (entry) => entry && entry.arquivo && entry.arquivo.toLowerCase().endsWith('.pdf')
    );
    if (pdf) return pdf.arquivo;
    const anexo = item.anexos.find((entry) => entry && entry.arquivo);
    return anexo ? anexo.arquivo : '';
  };

  const fetchFileForShare = async (fileUrl) => {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Nao foi possivel baixar o arquivo para compartilhar.');
    }
    const blob = await response.blob();
    const filename = decodeURIComponent(fileUrl.split('/').pop()?.split('?')[0] || 'notificacao.pdf');
    return new File([blob], filename, { type: blob.type || 'application/octet-stream' });
  };

  const handleCompartilhar = async (item) => {
    setError('');
    const arquivo = getAnexoArquivo(item);
    if (!arquivo) {
      setError('Arquivo da notificacao nao encontrado.');
      return;
    }
    const fileUrl = buildFileUrl(arquivo);
    if (navigator.share) {
      try {
        const file = await fetchFileForShare(fileUrl);
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Notificacao Fiscalizacao',
            files: [file],
          });
          return;
        }
      } catch (err) {
        if (err && err.name !== 'AbortError') {
          setError('Nao foi possivel compartilhar a notificacao.');
        }
        return;
      }
    }
    window.open(fileUrl, '_blank', 'noopener');
  };

  const handleVisualizar = (item) => {
    setError('');
    const arquivo = getAnexoArquivo(item);
    if (!arquivo) {
      setError('Arquivo da notificacao nao encontrado.');
      return;
    }
    const fileUrl = buildFileUrl(arquivo);
    window.open(fileUrl, '_blank', 'noopener');
  };

  const actionButtonBase = 'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Notificacoes - Fiscalizacao</h1>
        <p className="text-sm text-gray-600">
          Crie notificacoes da fiscalizacao, salve e envie quando estiver pronto.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="xl:col-span-2 bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Dados do auto</h2>
            <p className="text-sm text-gray-500">Selecione o auto para preencher os dados da empresa.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Auto</label>
              <select
                name="auto_tipo"
                value={formData.auto_tipo}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              >
                {AUTO_TIPOS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Numero do Auto (AC/AI)</label>
              <input
                type="text"
                name="auto_numero"
                value={formData.auto_numero}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Ex: 001/2025"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleBuscarAuto}
                disabled={autoLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                {autoLoading ? 'Buscando...' : 'Buscar Auto'}
              </button>
            </div>
          </div>

          {autoError && <div className="text-sm text-red-600">{autoError}</div>}
          {autoData && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-700">
              <div className="font-medium">Auto {autoData.numero || formData.auto_numero}</div>
              <div>{autoData.razao_social}</div>
              <div>{autoData.cnpj}</div>
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">PPA</h2>
            <p className="text-sm text-gray-500">
              O PPA sera criado automaticamente quando a notificacao for salva.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Dados do destinatario</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Destinatario</label>
              <input
                type="text"
                name="destinatario_nome"
                value={formData.destinatario_nome}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Razao social"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="destinatario_email"
                value={formData.destinatario_email}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="email@empresa.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CPF/CNPJ</label>
              <input
                type="text"
                name="destinatario_cpf_cnpj"
                value={formData.destinatario_cpf_cnpj}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Representante legal</label>
              <input
                type="text"
                name="representante_legal"
                value={formData.representante_legal}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Nome do representante"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Endereco</label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                readOnly
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                placeholder="Endereco completo"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Municipio</label>
              <input
                type="text"
                name="municipio"
                value={formData.municipio}
                readOnly
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                placeholder="Municipio"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <input
                type="text"
                name="estado"
                value={formData.estado}
                readOnly
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                placeholder="UF"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CEP</label>
              <input
                type="text"
                name="cep"
                value={formData.cep}
                readOnly
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                placeholder="00000-000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Texto principal da notificacao</label>
            <textarea
              name="mensagem"
              value={formData.mensagem}
              onChange={handleChange}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 min-h-[120px]"
              placeholder="Texto principal da notificacao"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          {success && (
            <div className="text-sm text-green-600">{success}</div>
          )}

          <div className="flex items-center justify-end">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelarEdicao}
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>

        <aside className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Pre-visualizacao</h2>
          <div className="border border-gray-200 rounded-lg p-4 space-y-4 text-sm text-gray-700">
            <div className="text-center">
              <div className="text-xs text-gray-500">Governo do Estado</div>
              <div className="text-lg font-semibold text-gray-800">AMAZONAS</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold">{previewData.numero}</div>
              <div>{previewData.ppa ? `PPA: ${previewData.ppa}` : 'PPA: -'}</div>
              <div>{previewData.data}</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold">À</div>
              <div className="uppercase">{previewData.destinatario || 'DESTINATARIO'}</div>
              <div>{previewData.cnpj ? `CNPJ: ${previewData.cnpj}` : 'CNPJ: -'}</div>
              <div>
                {previewData.representante
                  ? `NA PESSOA DE SEU REPRESENTANTE LEGAL: ${previewData.representante}`
                  : 'NA PESSOA DE SEU REPRESENTANTE LEGAL'}
              </div>
              <div>{previewData.endereco || 'ENDERECO COMPLETO'}</div>
              <div>{previewData.cidadeLinha}</div>
            </div>
            <div className="space-y-2">
              <div className="font-medium">Texto principal</div>
              <p className="whitespace-pre-line text-gray-600">
                {previewData.mensagem || 'Texto principal da notificacao.'}
              </p>
              <p className="text-xs text-gray-500">Demais paragrafos seguem o modelo oficial.</p>
            </div>
          </div>
        </aside>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Historico</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Numero</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Destinatario</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Envio</th>
                  <th className="py-2 pr-4">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-4 text-gray-500">
                      Nenhuma notificacao encontrada.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4">{item.id}</td>
                      <td className="py-2 pr-4">{item.numero || '-'}</td>
                      <td className="py-2 pr-4">{item.tipo_notificacao}</td>
                      <td className="py-2 pr-4">{item.destinatario_nome || '-'}</td>
                      <td className="py-2 pr-4">{item.destinatario_email || '-'}</td>
                      <td className="py-2 pr-4">{STATUS_LABELS[item.status] || item.status}</td>
                      <td className="py-2 pr-4">
                        {item.data_envio ? new Date(item.data_envio).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-3">
                          {['pendente', 'erro'].includes(item.status) && (
                            <button
                              type="button"
                              onClick={() => abrirEnviarModal(item)}
                              className={`${actionButtonBase} bg-blue-50 text-blue-700 hover:bg-blue-100`}
                            >
                              Enviar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleGerarDocumento(item)}
                            className={`${actionButtonBase} bg-indigo-50 text-indigo-700 hover:bg-indigo-100`}
                          >
                            Gerar Doc
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCompartilhar(item)}
                            className={`${actionButtonBase} bg-slate-50 text-slate-700 hover:bg-slate-100 ${getAnexoArquivo(item) ? '' : 'opacity-50 cursor-not-allowed'}`}
                            disabled={!getAnexoArquivo(item)}
                          >
                            Compartilhar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVisualizar(item)}
                            className={`${actionButtonBase} bg-gray-50 text-gray-700 hover:bg-gray-100 ${getAnexoArquivo(item) ? '' : 'opacity-50 cursor-not-allowed'}`}
                            disabled={!getAnexoArquivo(item)}
                          >
                            Visualizar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditar(item)}
                            className={`${actionButtonBase} bg-amber-50 text-amber-700 hover:bg-amber-100`}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluir(item.id)}
                            className={`${actionButtonBase} bg-red-50 text-red-700 hover:bg-red-100`}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sendModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Enviar Notificacao</h3>
              <button
                type="button"
                onClick={fecharEnviarModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email do destinatario</label>
              <input
                type="email"
                value={sendEmail}
                onChange={(event) => setSendEmail(event.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="email@empresa.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Assunto (numero do processo)</label>
              <input
                type="text"
                value={sendSubject || sendProcessoNumero || ''}
                readOnly
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mensagem</label>
              <textarea
                value={sendMessage}
                onChange={(event) => setSendMessage(event.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 min-h-[120px]"
                placeholder="Mensagem do email"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={fecharEnviarModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEnvio}
                disabled={sendLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
              >
                {sendLoading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificacoesFiscalizacaoPage;
