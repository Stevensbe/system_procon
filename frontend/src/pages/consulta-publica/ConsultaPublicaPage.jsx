import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Search } from 'lucide-react';

const ConsultaPublicaPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="h-8 w-8 text-blue-600" />
            Consulta Pública
          </h1>
          <p className="text-gray-600 mt-2">Consultas públicas e transparência</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Consultas Públicas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Módulo de consulta pública em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsultaPublicaPage;
