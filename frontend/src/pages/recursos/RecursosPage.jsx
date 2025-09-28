import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileText, Plus, Filter, Search } from 'lucide-react';

const RecursosPage = () => {
  const [recursos, setRecursos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Implementar carregamento de recursos
    setRecursos([
      {
        id: 1,
        numero: 'REC-001/2024',
        tipo: 'recurso',
        empresa: 'Empresa ABC Ltda',
        status: 'pendente',
        data_entrada: '2024-01-15'
      },
      {
        id: 2,
        numero: 'DEF-002/2024',
        tipo: 'defesa',
        empresa: 'Empresa XYZ Ltda',
        status: 'analisando',
        data_entrada: '2024-01-10'
      }
    ]);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Recursos e Defesas
          </h1>
          <p className="text-gray-600 mt-2">Gerencie recursos e defesas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Recurso
          </Button>
        </div>
      </div>

      {/* Lista de Recursos */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos e Defesas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando recursos...</p>
            </div>
          ) : recursos.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum recurso encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recursos.map((recurso) => (
                <div key={recurso.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{recurso.numero}</h3>
                    <p className="text-sm text-gray-600">
                      Tipo: {recurso.tipo} | 
                      Empresa: {recurso.empresa} | 
                      Status: <span className={`font-medium ${
                        recurso.status === 'pendente' ? 'text-yellow-600' : 
                        recurso.status === 'analisando' ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {recurso.status}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Data de entrada: {new Date(recurso.data_entrada).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      Visualizar
                    </Button>
                    <Button size="sm" variant="outline">
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecursosPage;
