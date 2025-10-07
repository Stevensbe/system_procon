import React, { useMemo, useState } from 'react';
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
      { rotulo: 'Responsável Atual', valor: documento.responsavel_atual_nome },
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

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-3 flex items-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <ClockIcon className="mr-2 h-5 w-5 text-amber-500 dark:text-amber-300" />
                  Histórico de Tramitações
                </h3>
                {historico.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nenhum evento registrado para este documento.</p>
                ) : (
                  <ul className="space-y-3">
                    {historico.map((evento) => {
                      const chaveEvento = evento.id || (evento.acao + '-' + evento.data_acao);
                      return (
                        <li
                          key={chaveEvento}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800/60"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <CheckCircleIcon className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">{evento.acao}</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDateTime(evento.data_acao)}
                            </span>
                          </div>
                          {evento.usuario_nome && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Responsável: {evento.usuario_nome}
                            </p>
                          )}
                          {evento.detalhes && (
                            <p className="mt-2 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                              {evento.detalhes}
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
