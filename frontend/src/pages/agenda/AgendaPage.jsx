import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Calendar } from 'lucide-react';

const AgendaPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            Agenda
          </h1>
          <p className="text-gray-600 mt-2">Agenda e calendário de fiscalizações</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Módulo de agenda em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendaPage;
