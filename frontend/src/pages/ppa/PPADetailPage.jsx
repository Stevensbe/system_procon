import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Edit, Archive, FileDown, Plus, ExternalLink,
  Calendar, Clock, Building2, FileText, Paperclip, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AddMovimentacaoModal from "../../components/ppa/AddMovimentacaoModal";
import AddAnexoModal from "../../components/ppa/AddAnexoModal";
import AddParecerModal from "../../components/ppa/AddParecerModal";
import ppaService from "../../services/ppaService";

const STATUS_CONFIGS = {
  criado: { label: "Triagem inicial", color: "bg-indigo-100 text-indigo-800" },
  em_analise: { label: "Em análise", color: "bg-blue-100 text-blue-800" },
  notificado: { label: "Notificados", color: "bg-cyan-100 text-cyan-800" },
  aguardando_resposta: { label: "Aguardando resposta", color: "bg-amber-100 text-amber-800" },
  com_defesa: { label: "Com defesa", color: "bg-orange-100 text-orange-800" },
  parecer_elaborado: { label: "Parecer elaborado", color: "bg-emerald-100 text-emerald-800" },
  concluido: { label: "Concluídos", color: "bg-green-100 text-green-800" },
  arquivado: { label: "Arquivados", color: "bg-red-100 text-red-800" }
};

export default function PPADetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const formatDateTime = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return format(parsed, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return format(parsed, "dd/MM/yyyy", { locale: ptBR });
  };

  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false);
  const [showAnexoModal, setShowAnexoModal] = useState(false);
  const [showParecerModal, setShowParecerModal] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState({ pdf: false, docx: false });

  const { data: ppa, isLoading } = useQuery({
    queryKey: ['ppa', id],
    queryFn: () => ppaService.detalhesPPA(id),
    enabled: !!id,
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ['movimentacoes', id],
    queryFn: async () => {
      const data = await ppaService.listarMovimentacoes(id);
      return Array.isArray(data) ? data : data?.results ?? [];
    },
    enabled: !!id,
  });

  const { data: anexos = [] } = useQuery({
    queryKey: ['anexos', id],
    queryFn: async () => {
      const data = await ppaService.listarAnexos(id);
      return Array.isArray(data) ? data : data?.results ?? [];
    },
    enabled: !!id,
  });

  const { data: pareceres = [] } = useQuery({
    queryKey: ['pareceres', id],
    queryFn: async () => {
      const data = await ppaService.listarPareceres(id);
      return Array.isArray(data) ? data : data?.results ?? [];
    },
    enabled: !!id,
  });

  const arquivarMutation = useMutation({
    mutationFn: async () => {
      const motivo = prompt("Motivo do arquivamento:");
      if (!motivo) throw new Error("Cancelado");

      return ppaService.arquivarPPA(id, motivo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ppa', id]);
      alert("PPA arquivado com sucesso!");
    },
  });

  const concluirMutation = useMutation({
    mutationFn: async (decisao) => {
      const fundamentacao = prompt("Fundamentação da decisão:");
      if (!fundamentacao) throw new Error("Cancelado");

      return ppaService.concluirPPA(id, {
        decisao_final: decisao,
        fundamentacao_decisao: fundamentacao,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ppa', id]);
      alert("PPA concluído com sucesso!");
    },
  });

  const handleConcluir = () => {
    const decisao = prompt(
      "Decisão final:\n1 - Arquivado\n2 - Auto Criado\n3 - Encaminhado\n\nDigite o número:"
    );
    const decisoes = { '1': 'arquivado', '2': 'auto_criado', '3': 'encaminhado' };
    
    if (decisoes[decisao]) {
      concluirMutation.mutate(decisoes[decisao]);
    }
  };

  const handleDownload = async (tipo) => {
    if (!id) return;
    setDownloadStatus((prev) => ({ ...prev, [tipo]: true }));

    try {
      const blob = tipo === "pdf"
        ? await ppaService.baixarPdf(id)
        : await ppaService.baixarDocx(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const numero = (ppa?.numero || "PPA").replace("/", "-");
      const ext = tipo === "pdf" ? "pdf" : "docx";

      link.href = url;
      link.download = `PPA_${numero}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar PPA:", error);
      alert("Erro ao baixar o arquivo do PPA.");
    } finally {
      setDownloadStatus((prev) => ({ ...prev, [tipo]: false }));
    }
  };

  const getPrazoBadge = () => {
    if (!ppa?.prazo_analise) return <Badge variant="secondary">Sem prazo</Badge>;
    
    const prazo = new Date(ppa.prazo_analise);
    const hoje = new Date();
    const diff = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Vencido há {Math.abs(diff)} dias
        </Badge>
      );
    } else if (diff === 0) {
      return <Badge variant="destructive">Vence hoje</Badge>;
    } else if (diff <= 5) {
      return <Badge className="bg-amber-100 text-amber-800">Faltam {diff} dias</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Faltam {diff} dias</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Carregando PPA...</p>
        </div>
      </div>
    );
  }

  if (!ppa) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">PPA não encontrado</h2>
            <Button onClick={() => navigate("/ppa")}>
              Voltar à lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/ppa")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📋 {ppa.numero}</h1>
              <p className="text-gray-500">{ppa.interessado}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleDownload("pdf")}
              disabled={downloadStatus.pdf}
            >
              <FileDown className="w-4 h-4" />
              {downloadStatus.pdf ? "Baixando..." : "PDF"}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleDownload("docx")}
              disabled={downloadStatus.docx}
            >
              <FileText className="w-4 h-4" />
              {downloadStatus.docx ? "Baixando..." : "DOCX"}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate(`/ppa/${id}/editar`)}
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => arquivarMutation.mutate()}
              disabled={arquivarMutation.isPending}
            >
              <Archive className="w-4 h-4" />
              Arquivar
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <label className="text-xs uppercase text-gray-500 block mb-1">Número do PPA</label>
              <h3 className="text-2xl font-bold text-gray-900">{ppa.numero}</h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <label className="text-xs uppercase text-gray-500 block mb-1">Sigla/Tipo</label>
              <h3 className="text-2xl font-bold text-gray-900">{ppa.sigla}</h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <label className="text-xs uppercase text-gray-500 block mb-1">Status</label>
              <Badge className={`${STATUS_CONFIGS[ppa.status]?.color} text-base px-3 py-1`}>
                {STATUS_CONFIGS[ppa.status]?.label || ppa.status}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <label className="text-xs uppercase text-gray-500 block mb-1">Decisão Final</label>
              <Badge variant={ppa.decisao_final === "pendente" ? "secondary" : "default"} className="text-base px-3 py-1">
                {ppa.decisao_final === "pendente" ? "Pendente" : ppa.decisao_final}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes do Processo */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes do Processo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Interessado (Empresa)</label>
                  <p className="text-gray-900">{ppa.interessado}</p>
                </div>

                {ppa.cnpj_interessado && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">CNPJ</label>
                    <p className="text-gray-900">{ppa.cnpj_interessado}</p>
                  </div>
                )}

                {ppa.endereco_interessado && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Endereço</label>
                    <p className="text-gray-900">{ppa.endereco_interessado}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Assunto</label>
                  <p className="text-gray-900">{ppa.assunto}</p>
                </div>
              </div>

              <div className="space-y-4">
                {ppa.analista_responsavel && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Analista Responsável</label>
                    <p className="text-gray-900">{ppa.analista_responsavel}</p>
                  </div>
                )}

                {ppa.supervisor && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Supervisor</label>
                    <p className="text-gray-900">{ppa.supervisor}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Prazo de Análise</label>
                  <div className="flex items-center gap-2">
                    {ppa.prazo_analise ? (
                      <>
                        <p className="text-gray-900">
                          {formatDate(ppa.prazo_analise)}
                        </p>
                        {getPrazoBadge()}
                      </>
                    ) : (
                      <p className="text-gray-400">Não definido</p>
                    )}
                  </div>
                </div>

                {ppa.prazo_resposta && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Prazo de Resposta</label>
                    <p className="text-gray-900">
                      {formatDate(ppa.prazo_resposta)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {ppa.observacoes && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm font-semibold text-gray-700 block mb-1">Observações</label>
                <p className="text-gray-900">{ppa.observacoes}</p>
              </div>
            )}

            {ppa.fundamentacao_decisao && (
              <div className="mt-6 pt-6 border-t bg-blue-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 block mb-1">Fundamentação da Decisão</label>
                <p className="text-gray-900">{ppa.fundamentacao_decisao}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Movimentação do Processo */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-t-lg">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Movimentação do Processo
              </CardTitle>
              <Button
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={() => setShowMovimentacaoModal(true)}
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-32">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-24">Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Atendimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {movimentacoes.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                        Nenhuma movimentação registrada
                      </td>
                    </tr>
                  ) : (
                    movimentacoes.map((mov) => (
                      <tr key={mov.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {formatDate(mov.data)}
                        </td>
                        <td className="px-4 py-3 text-sm">{mov.hora || "-"}</td>
                        <td className="px-4 py-3 text-sm">
                          <div>{mov.atendimento}</div>
                          {mov.usuario_nome && (
                            <small className="text-gray-500">Por: {mov.usuario_nome}</small>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Anexos */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Anexos ({anexos.length})
              </CardTitle>
              <Button
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={() => setShowAnexoModal(true)}
              >
                <Plus className="w-4 h-4" />
                Adicionar Anexo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {anexos.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum anexo adicionado</p>
            ) : (
              <div className="space-y-4">
                {anexos.map((anexo) => (
                  <div key={anexo.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <strong className="text-gray-900">{anexo.tipo_documento}</strong>
                        {anexo.numero_documento && (
                          <Badge variant="secondary">{anexo.numero_documento}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{anexo.descricao}</p>
                      <small className="text-xs text-gray-500">
                        {formatDateTime(anexo.data_anexacao || anexo.created_date)}
                        {anexo.anexado_por_nome && ` - ${anexo.anexado_por_nome}`}
                        {!anexo.anexado_por_nome && anexo.anexado_por && ` - ${anexo.anexado_por}`}
                      </small>
                    </div>
                    {anexo.arquivo_url && (
                      <a
                        href={anexo.arquivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pareceres */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Pareceres ({pareceres.length})
              </CardTitle>
              <Button
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={() => setShowParecerModal(true)}
              >
                <Plus className="w-4 h-4" />
                Adicionar Parecer
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {pareceres.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum parecer elaborado</p>
            ) : (
              <div className="space-y-4">
                {pareceres.map((parecer) => (
                  <div key={parecer.id} className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h6 className="font-semibold text-gray-900">
                          {parecer.numero_parecer} - {parecer.titulo}
                        </h6>
                        <small className="text-gray-500">
                          {formatDateTime(parecer.criado_em || parecer.created_date)}
                          {parecer.elaborado_por_nome && ` - ${parecer.elaborado_por_nome}`}
                          {!parecer.elaborado_por_nome && parecer.elaborado_por && ` - ${parecer.elaborado_por}`}
                        </small>
                      </div>
                      <Badge variant={parecer.conclusao === "procedente" ? "default" : "destructive"}>
                        {parecer.conclusao}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong className="text-gray-700">Relatório:</strong>
                        <p className="text-gray-600">{parecer.relatorio}</p>
                      </div>
                      <div>
                        <strong className="text-gray-700">Fundamentação:</strong>
                        <p className="text-gray-600">{parecer.fundamentacao}</p>
                      </div>
                      {parecer.recomendacoes && (
                        <div>
                          <strong className="text-gray-700">Recomendações:</strong>
                          <p className="text-blue-600">{parecer.recomendacoes}</p>
                        </div>
                      )}
                      {parecer.aprovado_por && (
                        <div className="bg-green-100 p-2 rounded">
                          ✅ Aprovado {parecer.aprovado_por_nome && `por ${parecer.aprovado_por_nome}`}
                          {parecer.data_aprovacao && ` em ${formatDateTime(parecer.data_aprovacao)}`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        {ppa.status !== "concluido" && ppa.status !== "arquivado" && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-t-lg">
              <CardTitle>⚙️ Ações</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h6 className="font-semibold mb-3">Ações Gerais</h6>
                  <div className="space-y-2">
                    <Button
                      className="w-full justify-start gap-2"
                      variant="outline"
                      onClick={() => setShowMovimentacaoModal(true)}
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Movimentação
                    </Button>
                    <Button
                      className="w-full justify-start gap-2"
                      variant="outline"
                      onClick={() => setShowAnexoModal(true)}
                    >
                      <Paperclip className="w-4 h-4" />
                      Adicionar Anexo
                    </Button>
                    <Button
                      className="w-full justify-start gap-2"
                      variant="outline"
                      onClick={() => setShowParecerModal(true)}
                    >
                      <FileText className="w-4 h-4" />
                      Adicionar Parecer
                    </Button>
                  </div>
                </div>
                <div>
                  <h6 className="font-semibold mb-3">Conclusão</h6>
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
                    onClick={handleConcluir}
                    disabled={concluirMutation.isPending}
                  >
                    <FileText className="w-4 h-4" />
                    Concluir PPA
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showMovimentacaoModal && (
        <AddMovimentacaoModal
          ppaId={id}
          onClose={() => setShowMovimentacaoModal(false)}
        />
      )}

      {showAnexoModal && (
        <AddAnexoModal
          ppaId={id}
          onClose={() => setShowAnexoModal(false)}
        />
      )}

      {showParecerModal && (
        <AddParecerModal
          ppaId={id}
          onClose={() => setShowParecerModal(false)}
        />
      )}
    </div>
  );
}
