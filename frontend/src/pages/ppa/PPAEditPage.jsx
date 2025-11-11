import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ppaService from "../../services/ppaService";

export default function PPAEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const { isLoading } = useQuery({
    queryKey: ['ppa', id],
    queryFn: async () => {
      const ppa = await ppaService.detalhesPPA(id);
      setFormData({
        sigla: ppa.sigla || "BANCO",
        assunto: ppa.assunto || "",
        interessado: ppa.interessado || "",
        cnpj_interessado: ppa.cnpj_interessado || "",
        endereco_interessado: ppa.endereco_interessado || "",
        analista_responsavel: ppa.analista_responsavel || "",
        supervisor: ppa.supervisor || "",
        status: ppa.status || "criado",
        prazo_analise: ppa.prazo_analise || "",
        prazo_resposta: ppa.prazo_resposta || "",
        observacoes: ppa.observacoes || "",
        observacoes_internas: ppa.observacoes_internas || "",
      });
      return ppa;
    },
    enabled: !!id
  });

  const updateMutation = useMutation({
    mutationFn: (data) => ppaService.atualizarPPA(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ppa', id]);
      navigate(`/ppa/${id}`);
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.interessado?.trim()) {
      newErrors.interessado = "Interessado é obrigatório";
    }
    if (!formData.assunto?.trim()) {
      newErrors.assunto = "Assunto é obrigatório";
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      ...formData,
      prazo_analise: formData.prazo_analise || null,
      prazo_resposta: formData.prazo_resposta || null,
    };
    updateMutation.mutate(payload);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/ppa/${id}`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">✏️ Editar PPA</h1>
            <p className="text-gray-500">Atualizar informações do procedimento preliminar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Classificação */}
          <Card>
            <CardHeader>
              <CardTitle>📌 Classificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sigla">Sigla/Tipo <span className="text-red-500">*</span></Label>
                  <Select value={formData.sigla} onValueChange={(val) => handleChange("sigla", val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANCO">Banco</SelectItem>
                      <SelectItem value="POSTO">Posto de Combustível</SelectItem>
                      <SelectItem value="SUPERMERCADO">Supermercado</SelectItem>
                      <SelectItem value="DIVERSOS">Diversos</SelectItem>
                      <SelectItem value="TELECOMUNICACOES">Telecomunicações</SelectItem>
                      <SelectItem value="ENERGIA">Energia</SelectItem>
                      <SelectItem value="PLANO_SAUDE">Plano de Saúde</SelectItem>
                      <SelectItem value="OUTROS">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(val) => handleChange("status", val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="criado">Criado</SelectItem>
                      <SelectItem value="em_analise">Em Análise</SelectItem>
                      <SelectItem value="notificado">Notificado</SelectItem>
                      <SelectItem value="aguardando_resposta">Aguardando Resposta</SelectItem>
                      <SelectItem value="com_defesa">Com Defesa</SelectItem>
                      <SelectItem value="parecer_elaborado">Parecer Elaborado</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Interessado */}
          <Card>
            <CardHeader>
              <CardTitle>🏢 Dados do Interessado (Empresa)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="interessado">Razão Social / Nome <span className="text-red-500">*</span></Label>
                  <Input
                    id="interessado"
                    value={formData.interessado || ""}
                    onChange={(e) => handleChange("interessado", e.target.value)}
                    placeholder="Ex: Banco Bradesco S.A."
                    className={errors.interessado ? "border-red-500" : ""}
                  />
                  {errors.interessado && (
                    <p className="text-sm text-red-500">{errors.interessado}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj_interessado || ""}
                    onChange={(e) => handleChange("cnpj_interessado", e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco_interessado || ""}
                  onChange={(e) => handleChange("endereco_interessado", e.target.value)}
                  placeholder="Endereço completo da empresa"
                />
              </div>
            </CardContent>
          </Card>

          {/* Assunto */}
          <Card>
            <CardHeader>
              <CardTitle>📝 Assunto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assunto">Descrição do Assunto <span className="text-red-500">*</span></Label>
                <Textarea
                  id="assunto"
                  value={formData.assunto || ""}
                  onChange={(e) => handleChange("assunto", e.target.value)}
                  placeholder="Descreva o assunto do PPA..."
                  rows={4}
                  className={errors.assunto ? "border-red-500" : ""}
                />
                {errors.assunto && (
                  <p className="text-sm text-red-500">{errors.assunto}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Responsáveis */}
          <Card>
            <CardHeader>
              <CardTitle>👥 Responsáveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="analista">Analista Responsável</Label>
                  <Input
                    id="analista"
                    value={formData.analista_responsavel || ""}
                    onChange={(e) => handleChange("analista_responsavel", e.target.value)}
                    placeholder="Nome do analista"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supervisor">Supervisor</Label>
                  <Input
                    id="supervisor"
                    value={formData.supervisor || ""}
                    onChange={(e) => handleChange("supervisor", e.target.value)}
                    placeholder="Nome do supervisor"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prazos */}
          <Card>
            <CardHeader>
              <CardTitle>⏰ Prazos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prazo_analise">Prazo para Análise</Label>
                  <Input
                    id="prazo_analise"
                    type="date"
                    value={formData.prazo_analise || ""}
                    onChange={(e) => handleChange("prazo_analise", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prazo_resposta">Prazo para Resposta da Empresa</Label>
                  <Input
                    id="prazo_resposta"
                    type="date"
                    value={formData.prazo_resposta || ""}
                    onChange={(e) => handleChange("prazo_resposta", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>📌 Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Gerais</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes || ""}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  placeholder="Observações gerais sobre o PPA..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes_internas">Observações Internas</Label>
                <Textarea
                  id="observacoes_internas"
                  value={formData.observacoes_internas || ""}
                  onChange={(e) => handleChange("observacoes_internas", e.target.value)}
                  placeholder="Observações internas (não visíveis externamente)..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/ppa/${id}`)}
              disabled={updateMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {updateMutation.isPending ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
