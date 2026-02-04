import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listarAutosPostos} from '../../../services/fiscalizacaoService';

function AutoPostoListPage() {
  const [data, setData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const carregarAutos = async () => {
      setLoading(true);
      setError('');
      
      try {
        console.log(`🔄 Carregando autos de postos da página ${currentPage}...`);
        
        const responseData = await listarAutosPostos(currentPage, filters);
        console.log('✅ Dados recebidos:', responseData);
        
        // ✅ CORREÇÃO: Agora sempre recebemos estrutura normalizada
        if (responseData && responseData.results && Array.isArray(responseData.results)) {
          setData(responseData);
          console.log(`📊 ${responseData.results.length} autos carregados de ${responseData.count} total`);
        } else if (Array.isArray(responseData)) {
          // Fallback para resposta direta como array
          setData({
            results: responseData,
            count: responseData.length,
            next: null,
            previous: null,
            current_page: currentPage,
            total_pages: Math.ceil(responseData.length / 10)
          });
          console.log(`📊 ${responseData.length} autos carregados (array direto)`);
        } else {
          // Fallback para estrutura inesperada
          console.warn('⚠️ Estrutura inesperada, usando fallback:', responseData);
          setData({
            results: [],
            count: 0,
            next: null,
            previous: null,
            current_page: currentPage,
            total_pages: 0,
            debug_data: responseData
          });
          setError('Dados recebidos em formato inesperado');
        }
        
      } catch (err) {
        console.error('❌ Erro ao carregar autos:', err);
        setError(err.message || 'Erro ao carregar autos de posto.');
        
        // Dados vazios em caso de erro
        setData({
          results: [],
          count: 0,
          next: null,
          previous: null,
          current_page: currentPage,
          total_pages: 0
        });
      } finally {
        setLoading(false);
      }
    };

    carregarAutos();
  }, [currentPage, filters]);

  // ✅ FUNÇÃO DE DEBUG para usar no console
  const handleDebug = async () => {
    console.log('🔍 Executando debug da API...');
    try {
      const result = await listarAutosPostos(1, {});
      console.log('📋 Resultado do debug:', result);
    } catch (error) {
      console.error('❌ Erro no debug:', error);
    }
  };

  const contarCombustiveis = (auto) => {
    const combustiveis = [
      auto.gasolina_comum_totem,
      auto.gasolina_aditivada_totem,
      auto.etanol_totem,
      auto.diesel_comum_totem,
      auto.diesel_s10_totem,
      auto.gnv_totem
    ];
    return combustiveis.filter(preco => preco && parseFloat(preco) > 0).length;
  };

  const contarNotasFiscais = (auto) => {
    const notasApos = auto.notas_fiscais_apos ? auto.notas_fiscais_apos.length : 0;
    const notasAntes = auto.notas_fiscais_antes ? auto.notas_fiscais_antes.length : 0;
    return notasApos + notasAntes;
  };

  const contarCupons = (auto) => {
    const cuponsApos = auto.cupons_fiscais_apos ? auto.cupons_fiscais_apos.length : 0;
    const cuponsAntes = auto.cupons_fiscais_antes ? auto.cupons_fiscais_antes.length : 0;
    return cuponsApos + cuponsAntes;
  };

  // ✅ LOADING melhorado
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-64 bg-gray-50 dark:bg-[#0c0f12] transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 dark:border-orange-400"></div>
          <div className="text-lg text-gray-600 dark:text-gray-300 transition-colors duration-300">Carregando autos de postos...</div>
          <div className="text-sm text-gray-400 dark:text-gray-500 transition-colors duration-300">Página {currentPage}</div>
        </div>
      </div>
    );
  }

  // ✅ ERROR melhorado com botão de debug
  if (error) {
    return (
      <div className="p-8 bg-gray-50 dark:bg-[#0c0f12] transition-colors duration-300">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-200 px-6 py-4 rounded-lg transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Erro ao carregar dados</h3>
              <p className="mt-2">{error}</p>
              <div className="mt-4 text-sm">
                <strong>Página solicitada:</strong> {currentPage}<br/>
                <strong>Filtros aplicados:</strong> {JSON.stringify(filters)}
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                🔄 Recarregar
              </button>
              <button
                onClick={handleDebug}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
              >
                🔍 Debug API
              </button>
            </div>
          </div>
          
          {data?.debug_data && (
            <details className="mt-4">
              <summary className="cursor-pointer font-medium">📊 Dados recebidos (Debug)</summary>
              <pre className="mt-2 p-3 bg-red-50 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(data.debug_data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  // ✅ Verifica se data existe e tem results
  if (!data || !data.results) {
    return (
      <div className="p-8 bg-gray-50 dark:bg-[#0c0f12] transition-colors duration-300">
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-200 px-6 py-4 rounded-lg transition-colors duration-300">
          <h3 className="font-bold">Nenhum dado disponível</h3>
          <p className="mt-2">Não foi possível carregar os dados dos autos de posto.</p>
          <button
            onClick={handleDebug}
            className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            🔍 Diagnosticar Problema
          </button>
        </div>
      </div>
    );
  }

  const autos = data.results;

  return (
    <div className="p-8 bg-gray-50 dark:bg-[#0c0f12] transition-colors duration-300">
      {/* ✅ Header com estatísticas */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Autos de Constatação - Postos de Combustível</h1>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
            {data.count > 0 ? (
              <>
                <span className="font-medium">{data.count}</span> auto{data.count !== 1 ? 's' : ''} encontrado{data.count !== 1 ? 's' : ''}
                {data.total_pages > 1 && (
                  <span className="ml-2">• Página {data.current_page || currentPage} de {data.total_pages}</span>
                )}
              </>
            ) : (
              'Nenhum auto encontrado'
            )}
          </div>
        </div>
        
        <div className="flex gap-3">
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleDebug}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
            >
              🔍 Debug
            </button>
          )}
          <Link
            to="/fiscalizacao/postos/novo"
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            ➕ Novo Auto
          </Link>
        </div>
      </div>

      {/* ✅ Filtros rápidos */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-[#1a1d21] rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">Município:</label>
            <input
              type="text"
              placeholder="Filtrar por município"
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
              onChange={(e) => {
                const newFilters = { ...filters };
                if (e.target.value) {
                  newFilters.municipio = e.target.value;
                } else {
                  delete newFilters.municipio;
                }
                setFilters(newFilters);
              }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Documentos:</label>
            <select
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              onChange={(e) => {
                const newFilters = { ...filters };
                if (e.target.value !== '') {
                  newFilters.documentos_apresentados = e.target.value;
                } else {
                  delete newFilters.documentos_apresentados;
                }
                setFilters(newFilters);
              }}
            >
              <option value="">Todos</option>
              <option value="true">Apresentados</option>
              <option value="false">Pendentes</option>
            </select>
          </div>
          
          {Object.keys(filters).length > 0 && (
            <button
              onClick={() => setFilters({})}
              className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
            >
              ✖️ Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ✅ Tabela ou mensagem vazia */}
      {autos.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#1a1d21] rounded-lg shadow border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors duration-300">
          <div className="text-6xl mb-4">⛽</div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-300">Nenhum auto de posto encontrado</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 transition-colors duration-300">
            {Object.keys(filters).length > 0 
              ? 'Nenhum auto corresponde aos filtros aplicados.' 
              : 'Ainda não há autos de posto cadastrados.'
            }
          </p>
          <Link
            to="/fiscalizacao/postos/novo"
            className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            ➕ Criar Primeiro Auto
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1a1d21] rounded-lg shadow overflow-hidden transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left p-4 font-semibold text-gray-900 dark:text-white transition-colors duration-300">Número</th>
                  <th className="text-left p-4 font-semibold text-gray-900 dark:text-white transition-colors duration-300">Estabelecimento</th>
                  <th className="text-left p-4 font-semibold text-gray-900 dark:text-white transition-colors duration-300">CNPJ</th>
                  <th className="text-left p-4 font-semibold text-gray-900 dark:text-white transition-colors duration-300">Município</th>
                  <th className="text-left p-4 font-semibold text-gray-900 dark:text-white transition-colors duration-300">Data</th>
                  <th className="text-left p-4 font-semibold text-gray-900 dark:text-white transition-colors duration-300">Combustíveis</th>
                  <th className="text-left p-4 font-semibold text-gray-900 dark:text-white transition-colors duration-300">Documentos</th>
                  <th className="text-left p-4 font-semibold text-gray-900 dark:text-white transition-colors duration-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {autos.map((auto) => (
                  <tr key={auto.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="p-4">
                      <code className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-sm font-mono text-gray-900 dark:text-white transition-colors duration-300">
                        {auto.numero || `POSTO-${auto.id}`}
                      </code>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-white transition-colors duration-300">{auto.razao_social || 'N/A'}</div>
                      {auto.nome_fantasia && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{auto.nome_fantasia}</div>
                      )}
                    </td>
                    <td className="p-4 text-gray-700 dark:text-gray-300 transition-colors duration-300">{auto.cnpj || 'N/A'}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-300 transition-colors duration-300">{auto.municipio || 'N/A'}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      {auto.data_fiscalizacao 
                        ? new Date(auto.data_fiscalizacao + 'T00:00:00').toLocaleDateString('pt-BR')
                        : 'Data não informada'
                      }
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        ⛽ {contarCombustiveis(auto)} tipo(s)
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {auto.documentos_apresentados ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            ✅ Apresentados
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            ⏰ Pendentes ({auto.prazo_apresentacao || 24}h)
                          </span>
                        )}
                        <div className="text-xs text-gray-500">
                          NF: {contarNotasFiscais(auto)} | Cupons: {contarCupons(auto)}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link
                          to={`/fiscalizacao/postos/${auto.id}`}
                          className="text-orange-600 hover:text-orange-800 font-medium text-sm transition-colors"
                        >
                          👁️ Ver
                        </Link>
                        <Link
                          to={`/fiscalizacao/postos/${auto.id}/editar`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                        >
                          ✏️ Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ✅ Paginação melhorada */}
      {data.total_pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!data.previous}
            className="px-4 py-2 bg-gray-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            ⬅️ Anterior
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, data.total_pages) }, (_, i) => {
              const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (pageNum > data.total_pages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded transition-colors ${
                    pageNum === currentPage
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!data.next}
            className="px-4 py-2 bg-gray-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            Próxima ➡️
          </button>
        </div>
      )}

      {/* ✅ Debug info em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && data && (
        <details className="mt-8 p-4 bg-gray-100 rounded">
          <summary className="cursor-pointer font-medium text-gray-700">🔧 Debug Info</summary>
          <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40">
            {JSON.stringify({ data, currentPage, filters }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

export default AutoPostoListPage;
