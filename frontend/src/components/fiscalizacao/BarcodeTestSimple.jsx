import React, { useState } from 'react';
import produtosService from '../../services/produtosService';
import { toast } from 'react-hot-toast';

const BarcodeTestSimple = () => {
    const [manualCode, setManualCode] = useState('');
    const [testResults, setTestResults] = useState([]);

    const testManualCode = async () => {
        if (!manualCode.trim()) {
            toast.error('Digite um código de barras');
            return;
        }
        
        try {
            console.log('Testando código:', manualCode);
            
            // Testar a API
            const response = await produtosService.buscarPorCodigoBarras(manualCode);
            
            const result = {
                code: manualCode,
                timestamp: new Date().toLocaleTimeString(),
                success: response.success,
                source: response.source,
                produto: response.produto,
                error: response.error
            };
            
            setTestResults(prev => [result, ...prev]);
            
            if (response.success) {
                toast.success(`Produto encontrado: ${response.produto.nome}`);
            } else {
                toast.error(`Erro: ${response.error}`);
            }
            
        } catch (error) {
            console.error('Erro ao testar código:', error);
            
            const result = {
                code: manualCode,
                timestamp: new Date().toLocaleTimeString(),
                success: false,
                error: error.message
            };
            
            setTestResults(prev => [result, ...prev]);
            toast.error('Erro ao buscar produto');
        }
        
        setManualCode('');
    };

    const clearResults = () => {
        setTestResults([]);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                🧪 Teste Simples do Scanner
            </h2>

            {/* Teste Manual */}
            <div className="mb-6">
                <div className="flex space-x-2 mb-4">
                    <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Digite um código de barras para testar"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && testManualCode()}
                    />
                    <button
                        onClick={testManualCode}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        Testar
                    </button>
                    <button
                        onClick={clearResults}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Limpar
                    </button>
                </div>

                {/* Códigos de Teste */}
                <div className="text-sm text-gray-600">
                    <p className="font-medium mb-2">Códigos de teste:</p>
                    <div className="flex flex-wrap gap-2">
                        {['7891234567890', '3017620422003', '7891000100103'].map(code => (
                            <button
                                key={code}
                                onClick={() => setManualCode(code)}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                                {code}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Resultados */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    📊 Resultados dos Testes ({testResults.length})
                </h3>
                
                {testResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>Nenhum teste realizado ainda.</p>
                        <p>Digite um código de barras para testar.</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {testResults.map((result, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border ${
                                    result.success 
                                        ? 'bg-green-50 border-green-200' 
                                        : 'bg-red-50 border-red-200'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                result.success 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {result.success ? '✅ Sucesso' : '❌ Erro'}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {result.timestamp}
                                            </span>
                                        </div>
                                        
                                        <p className="font-mono text-sm mb-2">
                                            Código: {result.code}
                                        </p>
                                        
                                        {result.success && result.produto && (
                                            <div className="text-sm">
                                                <p><strong>Nome:</strong> {result.produto.nome}</p>
                                                <p><strong>Fonte:</strong> {result.source}</p>
                                                <p><strong>Especificação:</strong> {result.produto.especificacao?.substring(0, 100)}...</p>
                                            </div>
                                        )}
                                        
                                        {result.error && (
                                            <p className="text-sm text-red-600">
                                                <strong>Erro:</strong> {result.error}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BarcodeTestSimple;
