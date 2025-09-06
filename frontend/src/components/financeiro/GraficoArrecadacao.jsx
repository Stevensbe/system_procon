import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const GraficoArrecadacao = ({ dados = [], isLoading = false, height = 300 }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Mês: ${label}`}</p>
          <p className="text-blue-600">
            {`Arrecadação: ${formatCurrency(payload[0].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="animate-pulse bg-gray-200 h-6 w-48 rounded"></div>
        </div>
        <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
      </div>
    );
  }

  if (!dados || dados.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <i className="fas fa-chart-bar text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">Nenhum dado de arrecadação disponível</p>
          <p className="text-gray-400 text-sm mt-2">
            Os dados aparecerão aqui quando houver multas pagas registradas no sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <i className="fas fa-chart-bar text-blue-500 mr-2"></i>
          Arrecadação Mensal (Últimos 12 Meses)
        </h3>
        <div className="flex items-center text-sm text-gray-500">
          <i className="fas fa-info-circle mr-1"></i>
          <span>Clique nas barras para mais detalhes</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={dados}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="mes" 
            stroke="#666"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="total" 
            name="Arrecadação (R$)"
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-gray-500 text-center">
        * Valores representam multas efetivamente pagas no período
      </div>
    </div>
  );
};

export default GraficoArrecadacao;