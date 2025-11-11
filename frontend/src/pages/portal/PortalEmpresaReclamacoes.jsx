import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Inbox, Send } from 'lucide-react';
import {
  listarReclamacoesEmpresa,
  obterReclamacaoEmpresa,
  responderReclamacaoEmpresa,
} from '../../services/portalEmpresaService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_OPTIONS = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'denuncia_recebida', label: 'Recebida' },
  { value: 'em_analise', label: 'Em analise' },
  { value: 'encaminhada_fiscal', label: 'Encaminhada' },
  { value: 'arquivada', label: 'Arquivada' },
];

const DOCUMENTO_OPTIONS = [
  { value: 'DEFESA_CIP', label: 'Defesa de CIP' },
  { value: 'RESPOSTA_ALEGACOES', label: 'Resposta as Alegacoes' },
  { value: 'PROPOSTA_ACORDOS', label: 'Proposta de Acordo' },
  { value: 'COMPLEMENTACAO_DOCS', label: 'Complementacao de Documentos' },
  { value: 'SOLICITA_CLARIFICACAO', label: 'Solicitacao de Esclarecimento' },
  { value: 'PROTESTA_DECISAO', label: 'Protesto de Decisao' },
];

function PortalEmpresaReclamacoes() {
  const [lista, setLista] = useState([]);
  const [statusFiltro, setStatusFiltro] = useState('TODAS');
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [erroLista, setErroLista] = useState(null);

  const [selecionada, setSelecionada] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  const [form, setForm] = useState({
    tipo_documento: 'DEFESA_CIP',
    titulo: '',
    conteudo: '',
    valor_proposta: '',
    prazo_pagamento: '',
    forma_pagamento: '',
    anexos: [],
  });
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const carregar = async () => {
      setCarregandoLista(true);
      setErroLista(null);
      try {
        const params = { ordering: '-criado_em' };
        if (statusFiltro !== 'TODAS') {
          params.status = statusFiltro;
        }
        const data = await listarReclamacoesEmpresa(params);
        const registros = data?.results ?? data ?? [];
        setLista(registros);
        if (registros.length > 0) {
          setSelecionada((prev) => prev || registros[0].id);
        } else {
          setSelecionada(null);
          setDetalhe(null);
        }
      } catch (error) {
        console.error('Erro ao carregar reclamacoes', error);
        setErroLista(error.message || 'Falha ao carregar as reclamacoes.');
      } finally {
        setCarregandoLista(false);
      }
    };

    carregar();
  }, [statusFiltro]);

  useEffect(() => {
    const carregarDetalhe = async () => {
      if (!selecionada) {
        setDetalhe(null);
        return;
      }
      setCarregandoDetalhe(true);
      try {
        const data = await obterReclamacaoEmpresa(selecionada);
        setDetalhe(data);
      } catch (error) {
        console.error('Erro ao carregar detalhes da reclamacao', error);
        setDetalhe(null);
      } finally {
        setCarregandoDetalhe(false);
      }
    };

    carregarDetalhe();
  }, [selecionada]);

  const resumo = useMemo(
    () => ({ total: lista.length }),
    [lista],
  );

  const handleArquivoChange = (event) => {
    const files = Array.from(event.target.files || []);
    setForm((prev) => ({ ...prev, anexos: files }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!detalhe) return;

    if (!form.titulo.trim() || !form.conteudo.trim()) {
      setFeedback({ type: 'error', message: 'Preencha titulo e conteudo da resposta.' });
      return;
    }

    setEnviando(true);
    setFeedback(null);
    try {
      const payload = {
        tipo_documento: form.tipo_documento,
        titulo: form.titulo.trim(),
        conteudo: form.conteudo.trim(),
      };

      if (form.valor_proposta) payload.valor_proposta = form.valor_proposta;
      if (form.prazo_pagamento) payload.prazo_pagamento = form.prazo_pagamento;
      if (form.forma_pagamento) payload.forma_pagamento = form.forma_pagamento;

      const resultado = await responderReclamacaoEmpresa(detalhe.id, payload, form.anexos);
      setFeedback({ type: 'success', message: resultado?.mensagem || 'Resposta enviada com sucesso.' });
      const detalheAtualizado = resultado?.reclamacao || (await obterReclamacaoEmpresa(detalhe.id));
      setDetalhe(detalheAtualizado);
      setForm((prev) => ({
        ...prev,
        titulo: '',
        conteudo: '',
        valor_proposta: '',
        prazo_pagamento: '',
        forma_pagamento: '',
        anexos: [],
      }));
    } catch (error) {
      console.error('Falha ao enviar resposta', error);
      const message = error?.response?.data?.erro || error?.message || 'Nao foi possivel enviar a resposta.';
      setFeedback({ type: 'error', message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Reclamacoes</h1>
          <p className="text-sm text-gray-600">
            Acompanhe as reclamacoes do atendimento presencial e responda diretamente pelo portal corporativo.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-600">
            Total listadas: <strong>{resumo.total}</strong>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-semibold text-gray-700" htmlFor="filtro-status">
              Filtrar por status
            </label>
            <select
              id="filtro-status"
              value={statusFiltro}
              onChange={(event) => setStatusFiltro(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-700">Reclamacoes</h2>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
              {carregandoLista && (
                <div className="p-4">
                  <LoadingSpinner message="Carregando reclamacoes..." compact />
                </div>
              )}
              {!carregandoLista && erroLista && (
                <div className="p-4 text-sm text-rose-600">{erroLista}</div>
              )}
              {!carregandoLista && !erroLista && lista.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500">
                  Nenhuma reclamacao encontrada.
                </div>
              )}
              {!carregandoLista && !erroLista &&
                lista.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelecionada(item.id)}
                    className={`w-full px-4 py-3 text-left transition hover:bg-blue-50 ${
                      item.id === selecionada ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                      <span>{item.numero_protocolo}</span>
                      <span className="text-xs font-medium uppercase text-gray-500">
                        {item.status_label || item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {item.descricao_fatos || 'Descricao nao informada.'}
                    </p>
                    <p className="mt-2 text-[11px] uppercase tracking-wide text-gray-400">
                      Registrada em {new Date(item.criado_em).toLocaleString('pt-BR')}
                    </p>
                  </button>
                ))}
            </div>
          </div>
        </aside>

        <main className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {carregandoDetalhe && (
            <div className="py-12">
              <LoadingSpinner message="Carregando detalhes..." compact />
            </div>
          )}

          {!carregandoDetalhe && detalhe && (
            <div className="space-y-6">
              <section className="border-b border-gray-200 pb-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{detalhe.numero_protocolo}</h2>
                    <p className="text-sm text-gray-500">
                      Registrada em {new Date(detalhe.criado_em).toLocaleString('pt-BR')} - Status:{' '}
                      {detalhe.status_label || detalhe.status}
                    </p>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                  <p><strong>Empresa:</strong> {detalhe.empresa_razao_social}</p>
                  <p><strong>Descricao:</strong> {detalhe.descricao_fatos || 'Nao informada.'}</p>
                  {detalhe.valor_envolvido && (
                    <p><strong>Valor envolvido:</strong> R$ {Number(detalhe.valor_envolvido).toFixed(2)}</p>
                  )}
                  {detalhe.prazo_resposta && (
                    <p><strong>Prazo para resposta:</strong> {new Date(detalhe.prazo_resposta).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Anexos</h3>
                <div className="rounded-lg border border-gray-100">
                  {Array.isArray(detalhe.anexos) && detalhe.anexos.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {detalhe.anexos.map((anexo) => (
                        <li key={anexo.id} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="flex items-center gap-2 text-gray-700">
                            <FileText className="h-4 w-4 text-gray-400" />
                            {anexo.descricao}
                          </span>
                          {anexo.arquivo_url && (
                            <a
                              href={anexo.arquivo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 hover:underline"
                            >
                              Baixar
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-3 py-4 text-sm text-gray-500">Nenhum anexo disponivel.</p>
                  )}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Respostas anteriores</h3>
                <div className="rounded-lg border border-gray-100">
                  {Array.isArray(detalhe.respostas_enviadas) && detalhe.respostas_enviadas.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {detalhe.respostas_enviadas.map((resposta) => (
                        <li key={resposta.id} className="px-3 py-3 text-sm">
                          <div className="flex items-center justify-between text-gray-700">
                            <strong>{resposta.titulo}</strong>
                            <span className="text-xs uppercase text-gray-500">{resposta.tipo_documento}</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Enviada em{' '}
                            {(resposta.data_envio || resposta.data_criacao)
                              ? new Date(resposta.data_envio || resposta.data_criacao).toLocaleString('pt-BR')
                              : 'Nao informado'}
                          </p>
                          {resposta.status && (
                            <p className="mt-1 text-xs text-gray-500">Status interno: {resposta.status}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-3 py-4 text-sm text-gray-500">Nenhuma resposta registrada.</p>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Enviar nova resposta</h3>
                {feedback && (
                  <div
                    className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                      feedback.type === 'success'
                        ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700'
                        : 'border-rose-500/40 bg-rose-50 text-rose-700'
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>{feedback.message}</span>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-gray-700">
                      Tipo de documento
                      <select
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={form.tipo_documento}
                        onChange={(event) => setForm((prev) => ({ ...prev, tipo_documento: event.target.value }))}
                      >
                        {DOCUMENTO_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm text-gray-700">
                      Valor proposta (opcional)
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={form.valor_proposta}
                        onChange={(event) => setForm((prev) => ({ ...prev, valor_proposta: event.target.value }))}
                        placeholder="Ex: 2500,00"
                      />
                    </label>
                    <label className="text-sm text-gray-700">
                      Prazo pagamento (dias)
                      <input
                        type="number"
                        min="0"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={form.prazo_pagamento}
                        onChange={(event) => setForm((prev) => ({ ...prev, prazo_pagamento: event.target.value }))}
                        placeholder="Ex: 10"
                      />
                    </label>
                    <label className="text-sm text-gray-700">
                      Forma de pagamento
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={form.forma_pagamento}
                        onChange={(event) => setForm((prev) => ({ ...prev, forma_pagamento: event.target.value }))}
                        placeholder="PIX, TED, Boleto..."
                      />
                    </label>
                  </div>

                  <label className="text-sm text-gray-700">
                    Titulo
                    <input
                      type="text"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={form.titulo}
                      onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))}
                      placeholder="Resumo da resposta"
                      required
                    />
                  </label>

                  <label className="text-sm text-gray-700">
                    Conteudo
                    <textarea
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      rows={6}
                      value={form.conteudo}
                      onChange={(event) => setForm((prev) => ({ ...prev, conteudo: event.target.value }))}
                      placeholder="Descreva a posicao da empresa."
                      required
                    />
                  </label>

                  <label className="text-sm text-gray-700">
                    Anexos (PDF, DOC, JPG, PNG, TXT)
                    <input
                      type="file"
                      multiple
                      className="mt-1 w-full text-sm"
                      onChange={handleArquivoChange}
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={enviando}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    <Send className="h-4 w-4" />
                    {enviando ? 'Enviando...' : 'Enviar resposta'}
                  </button>
                </form>
              </section>
            </div>
          )}

          {!carregandoDetalhe && !detalhe && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-500">
              <Inbox className="h-10 w-10" />
              <p className="text-sm">Selecione uma reclamacao para visualizar os detalhes.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default PortalEmpresaReclamacoes;
