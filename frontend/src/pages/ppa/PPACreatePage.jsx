import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ppaService from "../../services/ppaService";

export default function PPACreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    sigla: "BANCO",
    assunto: "",
    interessado: "",
    cnpj_interessado: "",
    endereco_interessado: "",
    analista_responsavel: "",
    supervisor: "",
    status: "criado",
    prazo_analise: "",
    prazo_resposta: "",
    observacoes: "",
    observacoes_internas: "",
  });

  const [errors, setErrors] = useState({});

  const createMutation = useMutation({
    mutationFn: (data) => ppaService.criarPPA(data),
    onSuccess: (novoPpa) => {
      queryClient.invalidateQueries(['ppas']);
      navigate(`/ppa/${novoPpa.id}`);
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
    if (!formData.interessado.trim()) {
      newErrors.interessado = "Interessado é obrigatório";
    }
    if (!formData.assunto.trim()) {
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
    createMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/ppa")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📋 Novo PPA</h1>
            <p className="text-gray-500">Criar nova capa de processo preliminar administrativo</p>
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
                    value={formData.interessado}
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
                    value={formData.cnpj_interessado}
                    onChange={(e) => handleChange("cnpj_interessado", e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco_interessado}
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
                  value={formData.assunto}
                  onChange={(e) => handleChange("assunto", e.target.value)}
                  placeholder="Descreva o assunto do PPA..."
                  rows={4}
                  className={errors.assunto ? "border-red-500" : ""}
                />
                {errors.assunto && (
                  <p className="text-sm text-red-500">{errors.assunto}</p>
                )}
                <p className="text-sm text-gray-500">
                  Descreva resumidamente o problema ou situação que motivou a criação do PPA
                </p>
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
                    value={formData.prazo_analise}
                    onChange={(e) => handleChange("prazo_analise", e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Se não informado, será definido automaticamente como 30 dias
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prazo_resposta">Prazo para Resposta da Empresa</Label>
                  <Input
                    id="prazo_resposta"
                    type="date"
                    value={formData.prazo_resposta}
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
                  value={formData.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  placeholder="Observações gerais sobre o PPA..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes_internas">Observações Internas</Label>
                <Textarea
                  id="observacoes_internas"
                  value={formData.observacoes_internas}
                  onChange={(e) => handleChange("observacoes_internas", e.target.value)}
                  placeholder="Observações internas (não visíveis externamente)..."
                  rows={2}
                />
                <p className="text-sm text-gray-500">
                  Estas observações são apenas para uso interno
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/ppa")}
              disabled={createMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {createMutation.isPending ? (
                <>Criando...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Criar PPA
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h6 className="font-semibold mb-2 flex items-center gap-2">
              <span>ℹ️</span> Informações:
            </h6>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• O número do PPA será gerado automaticamente no formato PPA-001/2025</li>
              <li>• Após criar o PPA, você poderá anexar documentos (AC, AI, Notificações, etc)</li>
              <li>• O PPA é a capa do processo onde ficam registradas todas as movimentações</li>
              <li>• Você pode adicionar pareceres técnicos e concluir o PPA posteriormente</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
