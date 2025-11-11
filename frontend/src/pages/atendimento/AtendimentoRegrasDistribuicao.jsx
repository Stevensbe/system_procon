import React, { useEffect, useMemo, useState } from 'react';
import atendimentoService from '../../services/atendimentoService';
import { tiService } from '../../services/tiService';
import { useNotification } from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const gravidadeOptions = [
  { value: '', label: 'Qualquer Gravidade' },
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
];

const defaultForm = {
  id: null,
  nome: '',
  prioridade: 1,
  gravidade: '',
  assunto: '',
  tipo_classificacao: '',
  responsavel: '',
  ativo: true,
};

const AtendimentoRegrasDistribuicao = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [regras, setRegras] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [filtroAtivas, setFiltroAtivas] = useState('todas');

  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        const [listaRegras, listaUsuarios] = await Promise.all([
          atendimentoService.listarRegrasDistribuicao(),
          tiService.listarUsuarios(),
        ]);

        setRegras(listaRegras || []);
        setUsuarios(listaUsuarios || []);
      } catch (error) {
        console.error(error);
        showError('Não foi possível carregar as regras de distribuição.');
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [showError]);

  const usuariosOptions = useMemo(() => {
    return (usuarios || []).map((usuario) => ({
      value: usuario.id,
      label: usuario?.nome_completo || usuario?.full_name || usuario?.username || `Usuário #${usuario.id}`,
    }));
  }, [usuarios]);

  const regrasFiltradas = useMemo(() => {
    if (filtroAtivas === 'ativas') {
      return regras.filter((regra) => regra.ativo);
    }
    if (filtroAtivas === 'inativas') {
      return regras.filter((regra) => !regra.ativo);
    }
    return regras;
  }, [regras, filtroAtivas]);

  const atualizarLista = async () => {
    const lista = await atendimentoService.listarRegrasDistribuicao();
    setRegras(lista || []);
  };

  const atualizarCampo = (campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const limparFormulario = () => {
    setForm(defaultForm);
  };

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    if (!form.nome?.trim()) {
      showError('Informe o nome da regra.');
      return;
    }
    if (!form.responsavel) {
      showError('Selecione o responsável.');
      return;
    }

    const payload = {
      nome: form.nome.trim(),
      prioridade: Number(form.prioridade) || 1,
      gravidade: form.gravidade || '',
      assunto: form.assunto?.trim() || '',
      tipo_classificacao: form.tipo_classificacao?.trim() || '',
      responsavel: form.responsavel,
      ativo: Boolean(form.ativo),
    };

    try {
      setSubmitting(true);
      if (form.id) {
        await atendimentoService.atualizarRegraDistribuicao(form.id, payload);
        showSuccess('Regra atualizada com sucesso.');
      } else {
        await atendimentoService.criarRegraDistribuicao(payload);
        showSuccess('Regra criada com sucesso.');
      }
      await atualizarLista();
      limparFormulario();
    } catch (error) {
      console.error(error);
      showError('Não foi possível salvar a regra. Verifique os dados e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const iniciarEdicao = (regra) => {
    setForm({
      id: regra.id,
      nome: regra.nome,
      prioridade: regra.prioridade,
      gravidade: regra.gravidade || '',
      assunto: regra.assunto || '',
      tipo_classificacao: regra.tipo_classificacao || '',
      responsavel: regra.responsavel,
      ativo: regra.ativo,
    });
  };

  const removerRegra = async (regraId) => {
    if (!window.confirm('Deseja realmente remover esta regra de distribuição?')) {
      return;
    }

    try {
      await atendimentoService.removerRegraDistribuicao(regraId);
      showSuccess('Regra removida com sucesso.');
      await atualizarLista();
    } catch (error) {
      console.error(error);
      showError('Não foi possível remover a regra.');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando regras de distribuição..." />;
  }

  return (
    <div className="space-y-6">
      <header className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Regras de Distribuição</h1>
          <p className="text-sm text-gray-500">Configure como os atendimentos serão encaminhados automaticamente.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">Filtro:</label>
          <select
            value={filtroAtivas}
            onChange={(event) => setFiltroAtivas(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="todas">Todas</option>
            <option value="ativas">Somente ativas</option>
            <option value="inativas">Somente inativas</option>
          </select>
        </div>
      </header>

      <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {form.id ? 'Editar Regra' : 'Nova Regra'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nome da Regra *</label>
            <input
              type="text"
              value={form.nome}
              onChange={(event) => atualizarCampo('nome', event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Ex: Reclamações Alta Gravidade"
              maxLength={120}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Prioridade *</label>
            <input
              type="number"
              min={1}
              value={form.prioridade}
              onChange={(event) => atualizarCampo('prioridade', event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Gravidade</label>
            <select
              value={form.gravidade}
              onChange={(event) => atualizarCampo('gravidade', event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              {gravidadeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Assunto (classificação)</label>
            <input
              type="text"
              value={form.assunto}
              onChange={(event) => atualizarCampo('assunto', event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Ex: TELECOMUNICACOES"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tipo de Classificação</label>
            <input
              type="text"
              value={form.tipo_classificacao}
              onChange={(event) => atualizarCampo('tipo_classificacao', event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Ex: CIP"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Responsável *</label>
            <select
              value={form.responsavel}
              onChange={(event) => atualizarCampo('responsavel', event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Selecione o responsável</option>
              {usuariosOptions.map((usuario) => (
                <option key={usuario.value} value={usuario.value}>
                  {usuario.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              id="regra-ativo"
              type="checkbox"
              checked={form.ativo}
              onChange={(event) => atualizarCampo('ativo', event.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="regra-ativo" className="text-sm font-medium text-gray-700">
              Regra ativa
            </label>
          </div>

          <div className="col-span-full flex justify-end gap-3 mt-2">
            {form.id && (
              <button
                type="button"
                onClick={limparFormulario}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar edição
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {submitting ? 'Salvando...' : form.id ? 'Atualizar Regra' : 'Adicionar Regra'}
            </button>
          </div>
        </form>
      </section>

  <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Regras cadastradas</h2>
          <span className="text-sm text-gray-500">
            {regrasFiltradas.length} regras exibidas
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condições</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsável</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {regrasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Nenhuma regra encontrada para o filtro selecionado.
                  </td>
                </tr>
              )}
              {regrasFiltradas.map((regra) => (
                <tr key={regra.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{regra.nome}</div>
                    <div className="text-xs text-gray-500">
                      Criada em {new Date(regra.criado_em).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{regra.prioridade}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 space-y-1">
                    <div>
                      <span className="text-xs uppercase text-gray-500">Gravidade:</span>{' '}
                      <strong>{regra.gravidade || 'Qualquer'}</strong>
                    </div>
                    <div>
                      <span className="text-xs uppercase text-gray-500">Assunto:</span>{' '}
                      <strong>{regra.assunto || 'Qualquer'}</strong>
                    </div>
                    <div>
                      <span className="text-xs uppercase text-gray-500">Tipo:</span>{' '}
                      <strong>{regra.tipo_classificacao || 'Qualquer'}</strong>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {regra.responsavel_nome || `#${regra.responsavel}`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        regra.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {regra.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => iniciarEdicao(regra)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => removerRegra(regra.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AtendimentoRegrasDistribuicao;
