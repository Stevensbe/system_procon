import React, { useEffect, useMemo, useState } from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  ClockIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
  InboxIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatDateTime } from '../../utils/formatters';
import caixaEntradaService from '../../services/caixaEntradaService';
import triagemService from '../../services/triagemService';

const formatarValor = (valor) => {
  if (!valor && valor !== 0) {
    return '-';
  }
  if (typeof valor === 'string') {
    return valor;
  }
  return String(valor);
};

const DocumentoDetalheModal = ({
  aberto,
  carregando,
  documento,
  historico = [],
  anexos = [],
  erro,
  onClose,
  onErroLimpar,
}) => {
  const [downloadEmProgresso, setDownloadEmProgresso] = useState(null);
  const [triagemLoading, setTriagemLoading] = useState(false);
  const [triagemSalvando, setTriagemSalvando] = useState(false);
  const [triagemErro, setTriagemErro] = useState('');
  const [triagemStatus, setTriagemStatus] = useState(null);
  const [triagem, setTriagem] = useState({
    competencia_procon: '',
    orientacao_destino: '',
    resposta_fiscal: '',
  });

  const tramitacoesList = useMemo(() => {
    if (documento?.tramitacoes?.length) {
      return documento.tramitacoes;
    }
    return historico;
  }, [documento, historico]);

  const resumoDocumento = useMemo(() => {
    if (!documento) {
      return [];
    }

    return [
      { rotulo: 'Número do Protocolo', valor: documento.numero_protocolo },
      { rotulo: 'Tipo de Documento', valor: documento.tipo_documento },
      { rotulo: 'Status', valor: documento.status },
      { rotulo: 'Prioridade', valor: documento.prioridade },
      { rotulo: 'Setor Destino', valor: documento.setor_destino },
      { rotulo: 'Responsavel Atual', valor: documento.responsavel_atual_nome },
      { rotulo: 'Data de Entrada', valor: formatDateTime(documento.data_entrada) },
      { rotulo: 'Prazo de Resposta', valor: formatDateTime(documento.prazo_resposta) },
    ];
  }, [documento]);

  const dadosRemetente = useMemo(() => {
    if (!documento) {
      return [];
    }

    return [
      { rotulo: 'Remetente', valor: documento.remetente_nome },
      { rotulo: 'Documento', valor: documento.remetente_documento },
      { rotulo: 'E-mail', valor: documento.remetente_email },
      { rotulo: 'Telefone', valor: documento.remetente_telefone },
    ];
  }, [documento]);

  const dadosEmpresa = useMemo(() => {
    if (!documento) {
      return [];
    }

    return [
      { rotulo: 'Empresa', valor: documento.empresa_nome },
      { rotulo: 'CNPJ', valor: documento.empresa_cnpj },
      { rotulo: 'Setor Lotação', valor: documento.setor_lotacao },
    ];
  }, [documento]);

  const isDenunciaFiscalizacao = useMemo(() => {
    if (!documento?.denuncia_id) {
      return false;
    }
    const setor = (documento.setor_destino || '').toLowerCase();
    return setor.includes('fiscal');
  }, [documento]);

  useEffect(() => {
    if (!aberto || !documento?.denuncia_id) {
      return;
    }

    setTriagemLoading(true);
    setTriagemErro('');

    triagemService
      .obterRespostaDenuncia(documento.denuncia_id)
      .then((payload) => {
        setTriagemStatus(payload?.status || null);
        const competenciaValue =
          payload?.competencia_procon === true ? 'true' : payload?.competencia_procon === false ? 'false' : '';
        setTriagem({
          competencia_procon: competenciaValue,
          orientacao_destino: payload?.orientacao_destino || '',
          resposta_fiscal: payload?.resposta_fiscal || '',
        });
      })
      .catch((error) => {
        console.error('Erro ao carregar triagem da denuncia:', error);
        setTriagemErro('Nao foi possivel carregar a triagem da denuncia.');
      })
      .finally(() => {
        setTriagemLoading(false);
      });
  }, [aberto, documento?.denuncia_id]);

  const handleTriagemChange = (event) => {
    const { name, value } = event.target;
    setTriagem((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSalvarTriagem = async () => {
    if (!documento?.denuncia_id) {
      return;
    }

    const payload = {};
    if (triagem.competencia_procon !== '') {
      payload.competencia_procon = triagem.competencia_procon === 'true';
    }
    if (triagem.orientacao_destino.trim()) {
      payload.orientacao_destino = triagem.orientacao_destino.trim();
    }
    if (triagem.resposta_fiscal.trim()) {
      payload.resposta_fiscal = triagem.resposta_fiscal.trim();
    }

    if (!Object.keys(payload).length) {
      setTriagemErro('Preencha pelo menos um campo para salvar a triagem.');
      return;
    }

    setTriagemErro('');
    setTriagemSalvando(true);

    try {
      const resposta = await triagemService.responderDenuncia(documento.denuncia_id, payload);
      const competenciaValue =
        resposta?.competencia_procon === true ? 'true' : resposta?.competencia_procon === false ? 'false' : '';
      setTriagemStatus(resposta?.status || triagemStatus);
      setTriagem({
        competencia_procon: competenciaValue,
        orientacao_destino: resposta?.orientacao_destino || triagem.orientacao_destino,
        resposta_fiscal: resposta?.resposta_fiscal || triagem.resposta_fiscal,
      });
    } catch (error) {
      console.error('Erro ao salvar triagem:', error);
      setTriagemErro('Nao foi possivel salvar a triagem.');
    } finally {
      setTriagemSalvando(false);
    }
  };


  const handleDownloadAnexo = async (anexo) => {
    if (!anexo || !anexo.id) {
      return;
    }

    setDownloadEmProgresso(anexo.id);
    try {
      const resposta = await caixaEntradaService.downloadAnexo(anexo.id);
      let arquivoUrl = resposta?.arquivo;
      const nomeArquivo = resposta?.nome_original || anexo.nome_original || `anexo-${anexo.id}`;

      if (!arquivoUrl) {
        throw new Error('URL do anexo não disponível');
      }

      if (!/^https?:\/\//i.test(arquivoUrl)) {
        const base = window.location.origin;
        arquivoUrl = `${base}${arquivoUrl.startsWith('/') ? '' : '/'}${arquivoUrl}`;
      }

      const link = document.createElement('a');
      link.href = arquivoUrl;
      link.setAttribute('download', nomeArquivo);
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (errorOcorrido) {
      console.error('Erro ao baixar anexo:', errorOcorrido);
      window.alert('Não foi possível baixar o anexo. Tente novamente.');
    } finally {
      setDownloadEmProgresso(null);
    }
  };

  if (!aberto) {
    return null;
  }

  const tituloDocumento = documento && documento.assunto ? documento.assunto : 'Documento';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/60">
          <div className="flex items-center space-x-3">
            <InboxIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{tituloDocumento}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Número: {(documento && documento.numero_protocolo) || 'N/A'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full p-1 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={() => {
              if (onErroLimpar) {
                onErroLimpar();
              }
              onClose();
            }}
            aria-label="Fechar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="relative max-h-[75vh] overflow-y-auto p-6">
          {carregando && (
            <div className="flex min-h-[240px] items-center justify-center">
              <LoadingSpinner />
            </div>
          )}

          {!carregando && erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              <p>Não foi possível carregar os detalhes do documento.</p>
              <p className="mt-1 text-xs opacity-80">{erro.message || String(erro)}</p>
            </div>
          )}

          {!carregando && !erro && documento && (
            <div className="space-y-6">
              <section className="grid gap-4 md:grid-cols-2">
                {resumoDocumento.map((item) => (
                  <div
                    key={item.rotulo}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {item.rotulo}
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {formatarValor(item.valor)}
                    </p>
                  </div>
                ))}
              </section>

              {documento.descricao && (
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-2 flex items-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <DocumentTextIcon className="mr-2 h-5 w-5 text-blue-500 dark:text-blue-300" />
                    Descrição do Documento
                  </h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {documento.descricao}
                  </p>
                </section>
              )}

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-3 flex items-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <UserIcon className="mr-2 h-5 w-5 text-indigo-500 dark:text-indigo-300" />
                    Dados do Remetente
                  </h3>
                  <dl className="space-y-2">
                    {dadosRemetente.map((item) => (
                      <div key={item.rotulo}>
                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {item.rotulo}
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">
                          {formatarValor(item.valor)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-3 flex items-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <BuildingOfficeIcon className="mr-2 h-5 w-5 text-emerald-500 dark:text-emerald-300" />
                    Dados da Empresa
                  </h3>
                  <dl className="space-y-2">
                    {dadosEmpresa.map((item) => (
                      <div key={item.rotulo}>
                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {item.rotulo}
                        </dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">
                          {formatarValor(item.valor)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>

              {isDenunciaFiscalizacao && (
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircleIcon className="mr-2 h-5 w-5 text-emerald-500" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Triagem da Denuncia (Fiscalizacao)
                      </h3>
                    </div>
                    {triagemStatus && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                        Status: {triagemStatus}
                      </span>
                    )}
                  </div>

                  {triagemLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                          Competencia do PROCON
                        </label>
                        <select
                          name="competencia_procon"
                          value={triagem.competencia_procon}
                          onChange={handleTriagemChange}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Em analise</option>
                          <option value="true">Sim, dentro do ambito</option>
                          <option value="false">Nao, fora do ambito</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                          Orientacao ao cidadao
                        </label>
                        <textarea
                          name="orientacao_destino"
                          value={triagem.orientacao_destino}
                          onChange={handleTriagemChange}
                          rows={3}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Informe a orientacao caso a denuncia esteja fora do ambito."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                          Resposta do fiscal
                        </label>
                        <textarea
                          name="resposta_fiscal"
                          value={triagem.resposta_fiscal}
                          onChange={handleTriagemChange}
                          rows={4}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Digite a resposta que sera enviada ao cidadao."
                        />
                      </div>

                      {triagemErro && (
                        <p className="text-sm text-red-600">{triagemErro}</p>
                      )}

                      <button
                        type="button"
                        onClick={handleSalvarTriagem}
                        disabled={triagemSalvando}
                        className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {triagemSalvando ? 'Salvando...' : 'Salvar triagem'}
                      </button>
                    </div>
                  )}
                </section>
              )}

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-3 flex items-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <ClockIcon className="mr-2 h-5 w-5 text-amber-500 dark:text-amber-300" />
                  Histórico de Tramitações
                </h3>
                {tramitacoesList.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nenhum evento registrado para este documento.</p>
                ) : (
                  <ul className="space-y-3">
                    {tramitacoesList.map((evento, index) => {
                      const chaveEvento = evento.id || `${evento.acao || 'evento'}-${evento.data_tramitacao || evento.data_acao || index}`;
                      const acaoLabel = evento.acao_display || evento.acao || 'Evento';
                      const dataEvento = evento.data_tramitacao || evento.data_acao;
                      const responsavel = evento.usuario_nome || evento.recebido_por_nome;
                      const detalhes = evento.detalhes || evento.observacoes || evento.motivo;
                      const setores = evento.setor_origem_nome && evento.setor_destino_nome
                        ? `${evento.setor_origem_nome} -> ${evento.setor_destino_nome}`
                        : '';
                      return (
                        <li
                          key={chaveEvento}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800/60"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <CheckCircleIcon className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">{acaoLabel}</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDateTime(dataEvento)}
                            </span>
                          </div>
                          {setores && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Setores: {setores}
                            </p>
                          )}
                          {responsavel && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Responsavel: {responsavel}
                            </p>
                          )}
                          {detalhes && (
                            <p className="mt-2 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                              {detalhes}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-3 flex items-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <PaperClipIcon className="mr-2 h-5 w-5 text-fuchsia-500 dark:text-fuchsia-300" />
                  Anexos
                </h3>
                {anexos.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nenhum anexo disponível.</p>
                ) : (
                  <ul className="space-y-2">
                    {anexos.map((anexo) => (
                      <li
                        key={anexo.id}
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900/60"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {anexo.nome_original || 'Anexo ' + anexo.id}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Enviado em {formatDateTime(anexo.upload_em)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadAnexo(anexo)}
                          className="inline-flex items-center rounded-full border border-blue-500 px-3 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-900/40"
                          disabled={downloadEmProgresso === anexo.id}
                        >
                          <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
                          {downloadEmProgresso === anexo.id ? 'Baixando...' : 'Baixar'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentoDetalheModal;
