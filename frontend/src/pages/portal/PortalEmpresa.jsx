import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import portalEmpresaService from '../../services/portalEmpresaService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorFallback from '../../components/common/ErrorFallback';

function PortalEmpresa() {
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const carregarResumo = async () => {
      try {
        setLoading(true);
        const dados = await portalEmpresaService.obterResumoPortalEmpresa();
        setResumo(dados);
        setErro(null);
      } catch (error) {
        console.error('Erro ao carregar resumo do portal da empresa', error);
        setErro(error);
      } finally {
        setLoading(false);
      }
    };

    carregarResumo();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Carregando dados do Portal da Empresa..." />;
  }

  if (erro) {
    return (
      <ErrorFallback
        error={erro}
        message="NÃ£o foi possÃ­vel carregar os dados do Portal da Empresa."
        onReset={() => window.location.reload()}
      />
    );
  }

  const {
    empresasRecentes = [],
    tokensRecentes = [],
    respostasRecentes = [],
    historicosRecentes = [],
    reclamacoesRecentes = [],
    analyticsResumo = {},
    engajamentoResumo = {},
  } = resumo || {};

  const formatPercent = (valor) => {
    if (valor === null || valor === undefined) {
      return '-';
    }
    return `${Number(valor).toFixed(1)}%`;
  };

  const formatHoras = (valor) => {
    if (valor === null || valor === undefined) {
      return '-';
    }
    return `${Number(valor).toFixed(1)} h`;
  };

  const formatInteiro = (valor) => {
    if (valor === null || valor === undefined) {
      return '-';
    }
    return Number(valor).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portal da Empresa</h1>
          <p className="text-sm text-gray-600">
            Gerencie credenciais, usuÃ¡rios e acompanhe as respostas encaminhadas pelo portal corporativo.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/portal-empresa/solicitacoes"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-400 hover:text-blue-700"
          >
            <i className="fa fa-inbox"></i>
            SolicitaÃ§Ãµes de Cadastro
          </Link>
          <Link
            to="/portal-empresa/reclamacoes"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-400 hover:text-blue-700"
          >
            <i className="fa fa-list"></i>
            Minhas Reclamacoes
          </Link>
          <Link
            to="/empresas"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            <i className="fa fa-building"></i>
            Ver Empresas
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Taxa de resposta"
          valor={engajamentoResumo?.taxa_resposta_percentual}
          subtitulo="Reclamacoes respondidas no periodo monitorado"
          formatter={formatPercent}
        />
        <ResumoCard
          titulo="Tempo medio de resposta"
          valor={engajamentoResumo?.tempo_medio_resposta_horas}
          subtitulo="Media de tempo ate a primeira manifestacao"
          formatter={formatHoras}
        />
        <ResumoCard
          titulo="Reclamacoes pendentes"
          valor={engajamentoResumo?.reclamacoes_pendentes}
          subtitulo="Aguardando resposta das empresas"
          formatter={formatInteiro}
        />
        <ResumoCard
          titulo="Tokens expirando (7 dias)"
          valor={engajamentoResumo?.tokens_expirando_7_dias}
          subtitulo="Planeje a renovacao antecipada"
          formatter={formatInteiro}
        />
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Empresas ativas"
          valor={engajamentoResumo?.empresas_monitoradas ?? empresasRecentes.length}
          subtitulo="Monitoradas pelo portal"
          formatter={formatInteiro}
        />
        <ResumoCard
          titulo="Tokens emitidos"
          valor={engajamentoResumo?.tokens_ativos ?? analyticsResumo?.indicadores?.tokensAtivos ?? tokensRecentes.length}
          subtitulo="Controle de integracoes"
          formatter={formatInteiro}
        />
        <ResumoCard
          titulo="Respostas recebidas"
          valor={engajamentoResumo?.respostas_ultimos_30_dias ?? analyticsResumo?.indicadores?.respostasMes ?? respostasRecentes.length}
          subtitulo="Ultimos 30 dias"
          formatter={formatInteiro}
        />
        <ResumoCard
          titulo="Webhooks ativos"
          valor={analyticsResumo?.indicadores?.webhooksAtivos ?? 0}
          subtitulo="Monitoramento em tempo real"
          formatter={formatInteiro}
        />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <ListaWidget titulo="Empresas recentes" itens={empresasRecentes} propriedadeTitulo="razao_social" />
        <ListaWidget titulo="Reclamacoes recentes" itens={reclamacoesRecentes} propriedadeTitulo="numero_protocolo" />
        <ListaWidget titulo="Tokens recentes" itens={tokensRecentes} propriedadeTitulo="descricao" />
        <ListaWidget titulo="Respostas recentes" itens={respostasRecentes} propriedadeTitulo="titulo" />
        <ListaWidget titulo="HistÃ³rico de envio" itens={historicosRecentes} propriedadeTitulo="evento" />
      </section>
    </div>
  );
}

function ResumoCard({ titulo, valor, subtitulo, formatter }) {
  const displayValue = formatter ? formatter(valor) : valor ?? '-';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{titulo}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{displayValue}</p>
      <p className="mt-1 text-xs text-gray-500">{subtitulo}</p>
    </div>
  );
}

function ListaWidget({ titulo, itens, propriedadeTitulo }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-800">{titulo}</h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {Array.isArray(itens) && itens.length > 0 ? (
          itens.map((item) => (
            <li key={item.id || item.codigo || JSON.stringify(item)} className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900">{item[propriedadeTitulo] ?? '-'}</p>
              {item.created_at && (
                <p className="text-xs text-gray-500">
                  {new Date(item.created_at).toLocaleString('pt-BR')}
                </p>
              )}
            </li>
          ))
        ) : (
          <li className="px-4 py-6 text-center text-sm text-gray-500">Nenhum registro disponÃ­vel.</li>
        )}
      </ul>
    </div>
  );
}

export default PortalEmpresa;
