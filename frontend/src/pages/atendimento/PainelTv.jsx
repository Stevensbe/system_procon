import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Users, Clock } from 'lucide-react';

import atendimentoFilaService from '../../services/atendimentoFilaService';

const REFRESH_INTERVAL = 10000;

function PainelTv() {
  const { balcaoId } = useParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let interval;

    const carregar = async () => {
      try {
        setError(null);
        const data = await atendimentoFilaService.obterStatusFila(balcaoId);
        setStatus(data);
      } catch (err) {
        console.error(err);
        setError('Falha ao atualizar painel.');
      } finally {
        setLoading(false);
      }
    };

    carregar();
    interval = setInterval(carregar, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [balcaoId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center gap-3 text-xl font-semibold">
          <Loader2 className="h-6 w-6 animate-spin" />
          Carregando painel...
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <p className="text-lg">{error || 'Painel indisponivel.'}</p>
      </div>
    );
  }

  const senhaAtual = status.senhas?.em_atendimento?.[0] || null;
  const proximaSenha = status.senhas?.em_espera?.[0] || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-8 py-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-300">Fila de atendimento</p>
          <h1 className="text-4xl font-bold text-white">{status.balcao?.nome || 'Balcao'}</h1>
          <div className="flex items-center gap-4 text-sm text-blue-200/80">
            <Clock className="h-4 w-4" />
            Atualizado em {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-blue-500/40 bg-blue-500/10 p-8 shadow-[0_25px_70px_-40px_rgba(59,130,246,0.6)] backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-200/80">Atendimento</p>
            <h2 className="mt-3 text-6xl font-bold text-white">
              {senhaAtual ? senhaAtual.identificador : ''}
            </h2>
            <p className="mt-2 text-lg text-blue-100/90">
              {senhaAtual ? `Prioridade ${senhaAtual.prioridade.toLowerCase()}` : 'Aguardando chamada'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Proxima senha</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-100">
                {proximaSenha ? proximaSenha.identificador : ''}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-700 bg-slate-900/60 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300/60">Em espera</p>
              <div className="mt-3 flex items-center gap-3 text-3xl font-semibold text-slate-100">
                <Users className="h-8 w-8 text-slate-400" />
                {status.senhas?.em_espera?.length || 0}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-900/60 p-8">
          <h3 className="mb-4 text-sm uppercase tracking-[0.3em] text-slate-300/70">Ultimas senhas</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {status.senhas?.finalizadas?.slice(0, 8).map((senha) => (
              <div key={senha.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-center">
                <p className="text-lg font-semibold text-white">{senha.identificador}</p>
                <p className="text-xs text-slate-400">
                  {senha.finalizado_em ? new Date(senha.finalizado_em).toLocaleTimeString('pt-BR') : ''}
                </p>
              </div>
            ))}
            {!status.senhas?.finalizadas?.length && (
              <p className="text-sm text-slate-400">Sem finalizacoes registradas.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default PainelTv;
