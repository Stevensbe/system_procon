import React, { useState } from 'react';
import IrregularidadesSelector from './IrregularidadesSelector';

const IrregularidadesDemo = () => {
  const [irregularidadesDiversos, setIrregularidadesDiversos] = useState({});
  const [irregularidadesSupermercado, setIrregularidadesSupermercado] = useState({});

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎨 Componente de Seleção de Irregularidades
          </h1>
          <p className="text-lg text-gray-600">
            Interface moderna e animada para seleção de irregularidades em autos de fiscalização
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demo Supermercado */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-emerald-800 mb-2">
                🛒 Auto de Supermercado
              </h2>
              <p className="text-sm text-gray-600">
                Irregularidades específicas para estabelecimentos de supermercado
              </p>
            </div>
            
            <IrregularidadesSelector
              tipo="supermercado"
              irregularidades={irregularidadesSupermercado}
              onChange={setIrregularidadesSupermercado}
              showDetails={true}
            />
          </div>

          {/* Demo Diversos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-purple-800 mb-2">
                🏢 Auto Diversos
              </h2>
              <p className="text-sm text-gray-600">
                Irregularidades para estabelecimentos diversos
              </p>
            </div>
            
            <IrregularidadesSelector
              tipo="diversos"
              irregularidades={irregularidadesDiversos}
              onChange={setIrregularidadesDiversos}
              showDetails={true}
            />
          </div>
        </div>

        {/* Resumo das seleções */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Resumo das Seleções
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-emerald-800 mb-2">Supermercado</h4>
              <div className="space-y-1">
                {Object.entries(irregularidadesSupermercado).map(([key, value]) => (
                  value && (
                    <div key={key} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{key}</span>
                    </div>
                  )
                ))}
                {Object.values(irregularidadesSupermercado).every(v => !v) && (
                  <span className="text-sm text-gray-500">Nenhuma irregularidade selecionada</span>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-purple-800 mb-2">Diversos</h4>
              <div className="space-y-1">
                {Object.entries(irregularidadesDiversos).map(([key, value]) => (
                  value && (
                    <div key={key} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{key}</span>
                    </div>
                  )
                ))}
                {Object.values(irregularidadesDiversos).every(v => !v) && (
                  <span className="text-sm text-gray-500">Nenhuma irregularidade selecionada</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Características do componente */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ✨ Características do Componente
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-blue-600 text-2xl mb-2">🎨</div>
              <h4 className="font-medium text-gray-900 mb-1">Design Moderno</h4>
              <p className="text-sm text-gray-600">Interface limpa e profissional com animações suaves</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-green-600 text-2xl mb-2">⚡</div>
              <h4 className="font-medium text-gray-900 mb-1">Animações</h4>
              <p className="text-sm text-gray-600">Transições fluidas e feedback visual interativo</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-purple-600 text-2xl mb-2">📋</div>
              <h4 className="font-medium text-gray-900 mb-1">Categorização</h4>
              <p className="text-sm text-gray-600">Irregularidades organizadas por tipo e severidade</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-orange-600 text-2xl mb-2">🔍</div>
              <h4 className="font-medium text-gray-900 mb-1">Detalhes Expandíveis</h4>
              <p className="text-sm text-gray-600">Informações legais e descrições detalhadas</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-red-600 text-2xl mb-2">📊</div>
              <h4 className="font-medium text-gray-900 mb-1">Contadores</h4>
              <p className="text-sm text-gray-600">Resumo visual das irregularidades selecionadas</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-indigo-600 text-2xl mb-2">🎯</div>
              <h4 className="font-medium text-gray-900 mb-1">Validação</h4>
              <p className="text-sm text-gray-600">Lógica inteligente para "Nada Consta"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IrregularidadesDemo;
