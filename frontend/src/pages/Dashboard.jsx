import { useState, useEffect } from "react";
import {
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Users,
  BarChart3,
  RefreshCw,
  Calendar,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { ActivityItem } from "@/components/dashboard/ActivityItem";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dashboardService from "../services/dashboardService";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

// Mock data para fallback
const generateMockData = () => ({
  stats: {
    totalProcessos: 1247,
    processosEmAndamento: 892,
    processosConcluidos: 355,
    multasPendentes: 144,
    multasVencidas: 45,
    multasPagas: 423,
    arrecadacaoMes: 1250000,
    arrecadacaoAno: 15800000,
    taxaResolucao: 78.5,
    usuariosAtivos: 45,
    tempoMedioResolucao: 12.3,
  },
  charts: {
    arrecadacaoMensal: [
      { mes: "Jan", valor: 1200000, meta: 1000000 },
      { mes: "Fev", valor: 1350000, meta: 1000000 },
      { mes: "Mar", valor: 1100000, meta: 1000000 },
      { mes: "Abr", valor: 1400000, meta: 1000000 },
      { mes: "Mai", valor: 1250000, meta: 1000000 },
      { mes: "Jun", valor: 1300000, meta: 1000000 },
    ],
    processosPorStatus: [
      { status: "Em Andamento", quantidade: 892, percentual: 71.5 },
      { status: "Concluído", quantidade: 355, percentual: 28.5 },
      { status: "Pendente", quantidade: 234, percentual: 18.8 },
      { status: "Cancelado", quantidade: 45, percentual: 3.6 },
    ],
    performanceMensal: [
      { mes: "Jan", processos: 120, multas: 45, fiscalizacoes: 15 },
      { mes: "Fev", processos: 135, multas: 52, fiscalizacoes: 18 },
      { mes: "Mar", processos: 110, multas: 38, fiscalizacoes: 12 },
      { mes: "Abr", processos: 140, multas: 61, fiscalizacoes: 20 },
      { mes: "Mai", processos: 125, multas: 48, fiscalizacoes: 16 },
      { mes: "Jun", processos: 130, multas: 55, fiscalizacoes: 19 },
    ],
  },
  alertas: [
    {
      id: 1,
      type: "warning",
      title: "Multas vencendo",
      message: "15 multas vencem nos próximos 7 dias",
      action: "Ver detalhes",
    },
    {
      id: 2,
      type: "info",
      title: "Novos processos",
      message: "23 novos processos foram protocolados hoje",
      action: "Revisar",
    },
    {
      id: 3,
      type: "success",
      title: "Meta atingida",
      message: "Meta mensal de arrecadação foi superada em 15%",
      action: "Ver relatório",
    },
  ],
  atividades: [
    {
      id: 1,
      icon: FileText,
      title: "Processo #2025-001234 protocolado",
      description: "Denúncia contra Loja XYZ",
      time: "2 min atrás",
      user: "Maria Silva",
      variant: "default",
    },
    {
      id: 2,
      icon: DollarSign,
      title: "Multa #M2025-000567 paga",
      description: "Valor: R$ 15.000,00",
      time: "15 min atrás",
      user: "Sistema",
      variant: "success",
    },
    {
      id: 3,
      icon: AlertTriangle,
      title: "Fiscalização agendada",
      description: "Posto de combustível - Centro",
      time: "1 hora atrás",
      user: "João Santos",
      variant: "warning",
    },
    {
      id: 4,
      icon: BarChart3,
      title: "Relatório mensal gerado",
      description: "Janeiro 2025 - Estatísticas completas",
      time: "2 horas atrás",
      user: "Sistema",
      variant: "info",
    },
  ],
});

const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  success: "hsl(var(--chart-2))",
  warning: "hsl(var(--chart-3))",
  destructive: "hsl(var(--chart-4))",
  accent: "hsl(var(--chart-5))",
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodo, setPeriodo] = useState("mes");
  const [data, setData] = useState(generateMockData());

  useEffect(() => {
    loadDashboardData();
  }, [periodo]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Carregar dados usando o serviço
      const [estatisticas, graficos, alertasData, atividadesData] = await Promise.all([
        dashboardService.getEstatisticasPrincipais(periodo),
        dashboardService.getDadosGraficos(periodo),
        dashboardService.getAlertas(),
        dashboardService.getAtividadesRecentes(10)
      ]);

      // Transformar dados do serviço para o formato esperado
      setData({
        stats: {
          totalProcessos: estatisticas.totalProcessos || 0,
          processosEmAndamento: estatisticas.processosEmAndamento || 0,
          processosConcluidos: estatisticas.processosConcluidos || 0,
          multasPendentes: estatisticas.multasPendentes || 0,
          multasVencidas: estatisticas.multasVencidas || 0,
          multasPagas: estatisticas.multasPagas || 0,
          arrecadacaoMes: estatisticas.arrecadacaoMes || 0,
          arrecadacaoAno: estatisticas.arrecadacaoAno || 0,
          taxaResolucao: estatisticas.taxaResolucao || 0,
          usuariosAtivos: estatisticas.usuariosAtivos || 0,
          tempoMedioResolucao: estatisticas.tempoMedioResolucao || 0,
        },
        charts: {
          arrecadacaoMensal: graficos.arrecadacaoMensal || [],
          processosPorStatus: graficos.processosPorStatus || [],
          performanceMensal: graficos.performanceMensal || [],
        },
        alertas: alertasData || [],
        atividades: (atividadesData || []).map((atividade) => {
          // Mapear tipos de atividade para ícones se não tiverem icon
          const iconMap = {
            processo: FileText,
            multa: DollarSign,
            fiscalizacao: AlertTriangle,
            relatorio: BarChart3,
          };
          
          // Mapear campos do serviço (português) para o formato do componente (inglês)
          return {
            id: atividade.id,
            icon: atividade.icon || iconMap[atividade.tipo] || Activity,
            title: atividade.title || atividade.titulo || '',
            description: atividade.description || atividade.descricao || '',
            time: atividade.time || atividade.tempo || '',
            user: atividade.user || atividade.usuario || '',
            variant: atividade.variant || atividade.tipo || "default",
          };
        }),
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // Usar dados mock em caso de erro
      setData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard Executivo
            </h1>
            <p className="text-muted-foreground mt-1">
              Sistema PROCON -{" "}
              {new Date().toLocaleDateString("pt-BR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes">Último mês</SelectItem>
                <SelectItem value="trimestre">Último trimestre</SelectItem>
                <SelectItem value="ano">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="icon"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {data.alertas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.alertas.map((alerta) => (
            <AlertCard 
              key={alerta.id} 
              type={alerta.type || alerta.tipo}
              title={alerta.title || alerta.titulo}
              message={alerta.message || alerta.mensagem}
              action={alerta.action || alerta.acao}
              onAction={alerta.onAction}
            />
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Processos"
          value={data.stats.totalProcessos.toLocaleString("pt-BR")}
          icon={FileText}
          variant="default"
          trend={{ value: 12, isPositive: true }}
          subtitle={`${data.stats.processosEmAndamento} em andamento`}
        />
        <StatCard
          title="Arrecadação Mensal"
          value={formatCurrency(data.stats.arrecadacaoMes)}
          icon={DollarSign}
          variant="success"
          trend={{ value: 8, isPositive: true }}
          subtitle="Meta: R$ 1.000.000"
        />
        <StatCard
          title="Multas Pendentes"
          value={data.stats.multasPendentes}
          icon={AlertTriangle}
          variant="warning"
          trend={{ value: -5, isPositive: false }}
          subtitle={`${data.stats.multasVencidas} vencidas`}
        />
        <StatCard
          title="Taxa de Resolução"
          value={`${data.stats.taxaResolucao}%`}
          icon={CheckCircle}
          variant="default"
          trend={{ value: 3, isPositive: true }}
          subtitle={`${data.stats.tempoMedioResolucao} dias médio`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arrecadação vs Meta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Arrecadação vs Meta</span>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.charts.arrecadacaoMensal}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.primary}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.primary}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke={CHART_COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorValor)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="meta"
                  stroke={CHART_COLORS.accent}
                  fillOpacity={0.1}
                  fill={CHART_COLORS.accent}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Processos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Distribuição de Processos</span>
              <Activity className="h-5 w-5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.charts.processosPorStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentual }) =>
                    `${status} ${percentual}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="quantidade"
                >
                  {data.charts.processosPorStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        Object.values(CHART_COLORS)[
                          index % Object.values(CHART_COLORS).length
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Mensal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Performance Mensal</span>
              <BarChart3 className="h-5 w-5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.charts.performanceMensal}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="processos"
                  fill={CHART_COLORS.primary}
                  name="Processos"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="multas"
                  fill={CHART_COLORS.success}
                  name="Multas"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="fiscalizacoes"
                  fill={CHART_COLORS.warning}
                  name="Fiscalizações"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Atividades Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Atividades Recentes</span>
            <Button variant="link" size="sm">
              Ver todas →
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.atividades.map((atividade) => (
              <ActivityItem key={atividade.id} {...atividade} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
