import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  FolderOpen,
  Plus,
  RefreshCw,
  Filter,
  Search,
  Folder,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ppaService from "../../services/ppaService";
import "./PPAListPage.css";

const STATUS_CONFIGS = {
  criado: { label: "Triagem inicial", color: "bg-indigo-100 text-indigo-800", dotColor: "bg-indigo-500" },
  em_analise: { label: "Em análise", color: "bg-blue-100 text-blue-800", dotColor: "bg-blue-500" },
  notificado: { label: "Notificados", color: "bg-cyan-100 text-cyan-800", dotColor: "bg-cyan-500" },
  aguardando_resposta: { label: "Aguardando resposta", color: "bg-amber-100 text-amber-800", dotColor: "bg-amber-500" },
  com_defesa: { label: "Com defesa", color: "bg-orange-100 text-orange-800", dotColor: "bg-orange-500" },
  parecer_elaborado: { label: "Parecer elaborado", color: "bg-emerald-100 text-emerald-800", dotColor: "bg-emerald-500" },
  concluido: { label: "Concluídos", color: "bg-green-100 text-green-800", dotColor: "bg-green-500" },
  arquivado: { label: "Arquivados", color: "bg-red-100 text-red-800", dotColor: "bg-red-500" },
};

const fetchPPAs = async (filters) => {
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.sigla) params.sigla = filters.sigla;
  if (filters.decisao_final) params.decisao_final = filters.decisao_final;

  const response = await ppaService.listarPPAs(params);
  if (Array.isArray(response)) {
    return response;
  }
  if (response?.results) {
    return response.results;
  }
  return response?.data || [];
};

export default function PPAListPage() {
  const [filtros, setFiltros] = useState({
    status: "",
    sigla: "",
    decisao_final: "",
    busca: "",
    vencidos: false,
  });

  const { data: lista = [], isLoading, refetch } = useQuery({
    queryKey: ["ppas", filtros.status, filtros.sigla, filtros.decisao_final],
    queryFn: () => fetchPPAs(filtros),
  });

  const ppas = useMemo(() => {
    let data = [...lista];

    if (filtros.busca) {
      const searchLower = filtros.busca.toLowerCase();
      data = data.filter(
        (ppa) =>
          ppa.numero?.toLowerCase().includes(searchLower) ||
          ppa.interessado?.toLowerCase().includes(searchLower) ||
          ppa.cnpj_interessado?.toLowerCase().includes(searchLower)
      );
    }

    if (filtros.vencidos) {
      data = data.filter((ppa) => {
        if (!ppa.prazo_analise) return false;
        return new Date(ppa.prazo_analise) < new Date();
      });
    }

    return data;
  }, [lista, filtros.busca, filtros.vencidos]);

  const stats = useMemo(
    () => ({
      total: ppas.length,
      em_analise: ppas.filter((p) => p.status === "em_analise").length,
      vencidos: ppas.filter((p) => p.prazo_analise && new Date(p.prazo_analise) < new Date()).length,
      concluidos: ppas.filter((p) => p.status === "concluido").length,
    }),
    [ppas]
  );

  const statusCounts = useMemo(() => {
    return ppas.reduce((acc, ppa) => {
      acc[ppa.status] = (acc[ppa.status] || 0) + 1;
      return acc;
    }, {});
  }, [ppas]);

  const limparFiltros = () => {
    setFiltros({
      status: "",
      sigla: "",
      decisao_final: "",
      busca: "",
      vencidos: false,
    });
  };

  const getPrazoBadge = (ppa) => {
    if (!ppa.prazo_analise) return <span className="text-gray-400">-</span>;

    const prazo = new Date(ppa.prazo_analise);
    const hoje = new Date();
    const diff = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));

    if (diff < 0) {
      return (
        <Badge variant="destructive" className="font-semibold">
          Vencido
        </Badge>
      );
    }
    if (diff === 0) {
      return <Badge variant="destructive">Hoje</Badge>;
    }
    if (diff <= 5) {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
          {diff}d
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        {diff}d
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Carregando PPAs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
          <CardContent className="bg-slate-900 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <FolderOpen className="w-8 h-8" />
                </div>
                <div>
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold mb-3">
                    FISCALIZAÇÃO
                  </div>
                  <h1 className="text-3xl font-bold mb-2">PPAs - Procedimentos Preliminares</h1>
                  <p className="text-white/80 mb-4">Gerencie processos, acompanhe prazos e organize documentos</p>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                      <span className="text-xs text-white/70 block">Total de anexos</span>
                      <strong className="text-lg">
                        {ppas.reduce((acc, p) => acc + (p.total_anexos || 0), 0)}
                      </strong>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                      <span className="text-xs text-white/70 block">Atualizado</span>
                      <strong className="text-sm">{format(new Date(), "HH:mm", { locale: ptBR })}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => refetch()} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </Button>
                <Link to="/ppa/novo">
                  <Button className="bg-white text-indigo-600 hover:bg-white/90 gap-2">
                    <Plus className="w-4 h-4" />
                    Novo PPA
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <CardTitle>Filtros inteligentes</CardTitle>
              </div>
              {(filtros.status || filtros.sigla || filtros.decisao_final || filtros.busca) && (
                <Button variant="ghost" size="sm" onClick={limparFiltros}>
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filtros.status} onValueChange={(val) => setFiltros({ ...filtros, status: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {Object.entries(STATUS_CONFIGS).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <Select value={filtros.sigla} onValueChange={(val) => setFiltros({ ...filtros, sigla: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="BANCO">Banco</SelectItem>
                    <SelectItem value="POSTO">Posto</SelectItem>
                    <SelectItem value="SUPERMERCADO">Supermercado</SelectItem>
                    <SelectItem value="DIVERSOS">Diversos</SelectItem>
                    <SelectItem value="TELECOMUNICACOES">Telecomunicações</SelectItem>
                    <SelectItem value="ENERGIA">Energia</SelectItem>
                    <SelectItem value="PLANO_SAUDE">Plano de Saúde</SelectItem>
                    <SelectItem value="OUTROS">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Decisão</label>
                <Select value={filtros.decisao_final} onValueChange={(val) => setFiltros({ ...filtros, decisao_final: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                    <SelectItem value="auto_criado">Auto criado</SelectItem>
                    <SelectItem value="encaminhado">Encaminhado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Busca</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Número, empresa, CNPJ..."
                    value={filtros.busca}
                    onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filtros.vencidos}
                  onCheckedChange={(checked) => setFiltros({ ...filtros, vencidos: !!checked })}
                />
                <span className="text-sm">Apenas vencidos</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Folder className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider">Total</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Search className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider">Em análise</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.em_analise}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider">Vencidos</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.vencidos}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider">Concluídos</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.concluidos}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS_CONFIGS).map(([key, config]) => (
            <div key={key} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
              <div className={`w-3 h-3 rounded-full ${config.dotColor}`} />
              <div>
                <strong className="text-sm">{config.label}</strong>
                <span className="text-xs text-gray-500 ml-2">
                  {statusCounts[key] || 0} {(statusCounts[key] || 0) === 1 ? "processo" : "processos"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Número</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Interessado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Assunto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Prazo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Anexos</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ppas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhum PPA encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    ppas.map((ppa) => (
                      <tr key={ppa.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                        <td className="px-4 py-4">
                          <Link to={`/ppa/${ppa.id}`} className="font-semibold text-indigo-600 hover:text-indigo-800">
                            {ppa.numero}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {ppa.sigla}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-xs">
                            <p className="font-medium text-gray-900 truncate">{ppa.interessado}</p>
                            {ppa.cnpj_interessado && (
                              <p className="text-xs text-gray-500">{ppa.cnpj_interessado}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600 truncate max-w-xs">{ppa.assunto}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={STATUS_CONFIGS[ppa.status]?.color || "bg-gray-100 text-gray-800"}>
                            {STATUS_CONFIGS[ppa.status]?.label || ppa.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">{getPrazoBadge(ppa)}</td>
                        <td className="px-4 py-4">
                          <Badge variant="secondary">{ppa.total_anexos || 0}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Link to={`/ppa/${ppa.id}`}>
                              <Button size="sm" variant="ghost" className="gap-2">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link to={`/ppa/${ppa.id}/editar`}>
                              <Button size="sm" variant="ghost" className="gap-2">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
