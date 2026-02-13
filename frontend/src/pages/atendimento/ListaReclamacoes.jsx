import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import atendimentoService from '../../services/atendimentoService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'REGISTRADA', label: 'Registrada' },
  { value: 'EM_ANALISE', label: 'Em analise' },
  { value: 'CLASSIFICADA', label: 'Classificada' },
  { value: 'NOTIFICADA', label: 'Notificada' },
  { value: 'AGUARDANDO_RESPOSTA', label: 'Aguardando resposta' },
  { value: 'EM_CONCILIACAO', label: 'Em conciliacao' },
  { value: 'CONCILIADA', label: 'Conciliada' },
  { value: 'EM_INSTRUCAO', label: 'Em instrucao' },
  { value: 'DECIDIDA', label: 'Decidida' },
  { value: 'APLICADA_PENALIDADE', label: 'Aplicada penalidade' },
  { value: 'RECURSO_APRESENTADO', label: 'Recurso apresentado' },
  { value: 'FINALIZADA', label: 'Finalizada' },
  { value: 'ARQUIVADA', label: 'Arquivada' },
];

const TIPO_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'RECLAMACAO', label: 'Reclamacao' },
  { value: 'DENUNCIA', label: 'Denuncia' },
];

const STATUS_BADGE = {
  REGISTRADA: 'bg-blue-100 text-blue-800',
  EM_ANALISE: 'bg-yellow-100 text-yellow-800',
  CLASSIFICADA: 'bg-amber-100 text-amber-800',
  NOTIFICADA: 'bg-orange-100 text-orange-800',
  AGUARDANDO_RESPOSTA: 'bg-orange-100 text-orange-800',
  EM_CONCILIACAO: 'bg-purple-100 text-purple-800',
  CONCILIADA: 'bg-green-100 text-green-800',
  EM_INSTRUCAO: 'bg-indigo-100 text-indigo-800',
  DECIDIDA: 'bg-teal-100 text-teal-800',
  APLICADA_PENALIDADE: 'bg-teal-100 text-teal-800',
  RECURSO_APRESENTADO: 'bg-rose-100 text-rose-800',
  FINALIZADA: 'bg-slate-100 text-slate-800',
  ARQUIVADA: 'bg-gray-200 text-gray-700',
};

const TIPO_BADGE = {
  RECLAMACAO: 'bg-blue-50 text-blue-700',
  DENUNCIA: 'bg-rose-50 text-rose-700',
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
};

function ListaReclamacoes() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [paginacao, setPaginacao] = useState({
    count: 0,
    total_pages: 1,
    page: 1,
    page_size: PAGE_SIZE,
  });

  const [filtros, setFiltros] = useState({
    status: '',
    tipo: '',
    search: '',
  });
  const [searchInput, setSearchInput] = useState('');

  const resumo = useMemo(() => ({
    total: paginacao.count || 0,
  }), [paginacao.count]);

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      setErro('');
      try {
        const data = await atendimentoService.listarReclamacoes(filtros, pagina, PAGE_SIZE);
        const resultados = data?.results ?? data ?? [];
        setLista(resultados);
        setPaginacao({
          count: data?.count ?? resultados.length,
          total_pages: data?.total_pages ?? Math.max(1, Math.ceil((data?.count ?? resultados.length) / PAGE_SIZE)),
          page: data?.page ?? pagina,
          page_size: data?.page_size ?? PAGE_SIZE,
        });
      } catch (error) {
        const mensagem = error?.response?.data?.detail || error?.message || 'Erro ao carregar reclamacoes';
        setErro(mensagem);
        setLista([]);
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [filtros, pagina]);

  const updateFiltro = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPagina(1);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateFiltro('search', searchInput.trim());
  };

  const limparFiltros = () => {
    setFiltros({ status: '', tipo: '', search: '' });
    setSearchInput('');
    setPagina(1);
  };

  const handlePagina = (novaPagina) => {
    if (novaPagina < 1 || novaPagina > paginacao.total_pages) return;
    setPagina(novaPagina);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <header className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lista de Reclamacoes</h1>
              <p className="text-sm text-gray-600">
                Gerencie reclamacoes e denuncias registradas no atendimento.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                Total: <strong>{resumo.total}</strong>
              </div>
              <button
                type="button"
                onClick={() => navigate('/atendimento/reclamacoes/nova')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                Nova Reclamacao
              </button>
            </div>
          </div>
        </header>

        <section className="bg-white shadow rounded-lg">
          <form onSubmit={handleSearchSubmit} className="p-4 border-b border-gray-200 space-y-4 md:space-y-0 md:flex md:flex-wrap md:items-end md:gap-4">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-medium text-gray-700">Buscar</label>
              <div className="mt-1 relative">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Protocolo, consumidor, CPF/CNPJ, empresa..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filtros.status}
                onChange={(event) => updateFiltro('status', event.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[160px]">
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <select
                value={filtros.tipo}
                onChange={(event) => updateFiltro('tipo', event.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIPO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                Buscar
              </button>
              <button
                type="button"
                onClick={limparFiltros}
                className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Limpar
              </button>
            </div>
          </form>

          {loading && (
            <div className="p-10 flex justify-center">
              <LoadingSpinner text="Carregando reclamacoes..." />
            </div>
          )}

          {!loading && erro && (
            <div className="p-6 text-sm text-red-600">{erro}</div>
          )}

          {!loading && !erro && lista.length === 0 && (
            <div className="p-10 text-center text-gray-500">
              Nenhuma reclamacao encontrada com os filtros informados.
            </div>
          )}

          {!loading && !erro && lista.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Protocolo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Consumidor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criada em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lista.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.numero_protocolo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${TIPO_BADGE[item.tipo_demanda] || 'bg-gray-100 text-gray-700'}`}>
                          {item.tipo_demanda_display || item.tipo_demanda}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{item.consumidor_nome || '-'}</div>
                        <div className="text-xs text-gray-500">{item.consumidor_cpf || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{item.empresa_razao_social || '-'}</div>
                        <div className="text-xs text-gray-500">{item.empresa_cnpj || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[item.status] || 'bg-gray-100 text-gray-700'}`}>
                          {item.status_display || item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.criado_em)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => navigate(`/atendimento/reclamacoes/${item.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !erro && lista.length > 0 && (
            <div className="flex flex-col gap-3 items-center justify-between border-t border-gray-200 px-6 py-4 sm:flex-row">
              <p className="text-sm text-gray-600">
                Pagina {paginacao.page} de {paginacao.total_pages} - {paginacao.count} registros
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePagina(pagina - 1)}
                  disabled={pagina <= 1}
                  className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => handlePagina(pagina + 1)}
                  disabled={pagina >= paginacao.total_pages}
                  className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proxima
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ListaReclamacoes;
