import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ppaService from "../../services/ppaService";

export default function AddParecerModal({ ppaId, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    numero_parecer: "",
    titulo: "",
    sintese_fatica: "",
    relatorio: "",
    fundamentacao: "",
    conclusao: "procedente",
    recomendacoes: "",
    elaborado_por: ""
  });

  const createMutation = useMutation({
    mutationFn: (data) => ppaService.adicionarParecer(ppaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pareceres', ppaId]);
      queryClient.invalidateQueries(['ppa', ppaId]);
      onClose();
    },
    onError: (error) => {
      console.error('Erro ao adicionar parecer:', error);
      const errorMessage = error?.response?.data?.detail || 
                          error?.response?.data?.message ||
                          Object.values(error?.response?.data || {}).flat().join(', ') ||
                          'Erro ao salvar parecer. Verifique os dados e tente novamente.';
      alert(errorMessage);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.relatorio.trim() || !formData.fundamentacao.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    // Remover campos que serão definidos automaticamente pelo backend
    const { numero_parecer, elaborado_por, ...dataToSend } = formData;
    // Garantir que campos opcionais vazios sejam null ao invés de string vazia
    if (!dataToSend.sintese_fatica) dataToSend.sintese_fatica = "";
    if (!dataToSend.recomendacoes) dataToSend.recomendacoes = "";
    createMutation.mutate(dataToSend);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📝 Adicionar Parecer Técnico</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                placeholder="Título do parecer"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conclusao">III - Decisão *</Label>
              <Select value={formData.conclusao} onValueChange={(val) => setFormData({...formData, conclusao: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="procedente">Procedente - Criar AI</SelectItem>
                  <SelectItem value="improcedente">Improcedente - Arquivar</SelectItem>
                  <SelectItem value="mais_informacoes">Necessita Mais Informações</SelectItem>
                  <SelectItem value="encaminhar">Encaminhar para Outro Órgão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sintese_fatica">
              I - Síntese Fática
              <span className="text-xs text-gray-500 ml-2">(Relato cronológico completo dos fatos)</span>
            </Label>
            <Textarea
              id="sintese_fatica"
              value={formData.sintese_fatica}
              onChange={(e) => setFormData({...formData, sintese_fatica: e.target.value})}
              placeholder="Descreva cronologicamente os fatos que deram origem ao caso, incluindo histórico de tentativas, eventos, audiências e posicionamento das partes..."
              rows={6}
            />
            <p className="text-xs text-gray-500">
              {formData.sintese_fatica.length} caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relatorio">II - Parecer *</Label>
            <Textarea
              id="relatorio"
              value={formData.relatorio}
              onChange={(e) => setFormData({...formData, relatorio: e.target.value})}
              placeholder="Análise jurídica e técnica do caso, identificação de violações legais, citações de artigos do CDC..."
              rows={6}
              required
            />
            <p className="text-xs text-gray-500">
              {formData.relatorio.length} caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fundamentacao">Fundamentação Legal *</Label>
            <Textarea
              id="fundamentacao"
              value={formData.fundamentacao}
              onChange={(e) => setFormData({...formData, fundamentacao: e.target.value})}
              placeholder="Fundamentação legal e normativa..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recomendacoes">Recomendações</Label>
            <Textarea
              id="recomendacoes"
              value={formData.recomendacoes}
              onChange={(e) => setFormData({...formData, recomendacoes: e.target.value})}
              placeholder="Recomendações e ações sugeridas..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="elaborado_por">Elaborado Por</Label>
            <Input
              id="elaborado_por"
              value={formData.elaborado_por}
              onChange={(e) => setFormData({...formData, elaborado_por: e.target.value})}
              placeholder="Nome do responsável"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Salvando..." : "Salvar Parecer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
