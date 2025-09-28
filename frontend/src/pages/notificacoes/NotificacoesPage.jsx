import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Bell, Plus, Filter, Search } from 'lucide-react';

const NotificacoesPage = () => {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Implementar carregamento de notificações
    setNotificacoes([
      {
        id: 1,
        tipo: 'sistema',
        titulo: 'Nova multa registrada',
        mensagem: 'Uma nova multa foi registrada no sistema',
        data: '2024-01-15T10:30:00',
        lida: false
      },
      {
        id: 2,
        tipo: 'prazo',
        titulo: 'Prazo vencendo',
        mensagem: 'Prazo para defesa vence em 3 dias',
        data: '2024-01-14T15:45:00',
        lida: true
      }
    ]);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-8 w-8 text-blue-600" />
            Notificações
          </h1>
          <p className="text-gray-600 mt-2">Gerencie as notificações do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Notificação
          </Button>
        </div>
      </div>

      {/* Lista de Notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando notificações...</p>
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notificacoes.map((notificacao) => (
                <div key={notificacao.id} className={`flex items-center justify-between p-4 border rounded-lg ${!notificacao.lida ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{notificacao.titulo}</h3>
                    <p className="text-sm text-gray-600">{notificacao.mensagem}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notificacao.data).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notificacao.lida && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                    <Button size="sm" variant="outline">
                      Marcar como lida
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

export default NotificacoesPage;
