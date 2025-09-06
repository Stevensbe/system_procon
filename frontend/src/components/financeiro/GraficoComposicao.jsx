import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

const GraficoComposicao = ({ dados = [], isLoading = false, height = 300 }) => {
  const COLORS = {
    'Pago': '#10B981',      // green
    'Pendente': '#F59E0B',  // yellow
    'Vencido': '#EF4444'    // red
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.status}</p>
          <p className="text-sm">
            <span className="font-medium">Valor:</span> {formatCurrency(data.valor)}
          </p>
          <p className="text-sm">
            <span className="font-medium">Percentual:</span> {data.percentual.toFixed(1)}%
          </p>
          <p className="text-sm">
            <span className="font-medium">Quantidade:</span> {data.count} multas
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => {
          const data = dados.find(d => d.status === entry.value);
          return (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded mr-2"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm text-gray-700">
                {entry.value} ({data ? data.percentual.toFixed(1) : 0}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="animate-pulse bg-gray-200 h-6 w-40 rounded"></div>
        </div>
        <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
      </div>
    );
  }

  if (!dados || dados.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i className="fas fa-chart-pie text-green-500 mr-2"></i>
          Composição da Carteira
        </h3>
        <div className="text-center py-12">
          <i className="fas fa-chart-pie text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">Nenhum dado disponível</p>
          <p className="text-gray-400 text-sm mt-2">
            A composição aparecerá quando houver multas cadastradas no sistema.
          </p>
        </div>
      </div>
    );
  }

  // Filtrar dados com valores maiores que zero
  const dadosComValor = dados.filter(item => item.valor > 0);

  if (dadosComValor.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i className="fas fa-chart-pie text-green-500 mr-2"></i>
          Composição da Carteira
        </h3>
        <div className="text-center py-12">
          <i className="fas fa-chart-pie text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">Nenhuma multa com valor encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <i className="fas fa-chart-pie text-green-500 mr-2"></i>
          Composição da Carteira
        </h3>
        <div className="text-sm text-gray-500">
          <i className="fas fa-info-circle mr-1"></i>
          <span>Por status das multas</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={dadosComValor}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="valor"
            nameKey="status"
            label={({ status, percentual }) => `${percentual.toFixed(1)}%`}
            labelLine={false}
          >
            {dadosComValor.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.status] || '#8884d8'} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Resumo em formato de lista */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {dadosComValor.map((item, index) => (
          <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
            <div 
              className="w-4 h-4 rounded mx-auto mb-2"
              style={{ backgroundColor: COLORS[item.status] }}
            ></div>
            <p className="font-medium text-gray-900">{item.status}</p>
            <p className="text-sm text-gray-600">{formatCurrency(item.valor)}</p>
            <p className="text-xs text-gray-500">{item.count} multas</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GraficoComposicao;