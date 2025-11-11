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
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.relatorio.trim() || !formData.fundamentacao.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate(formData);
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
              <Label htmlFor="numero_parecer">Número do Parecer</Label>
              <Input
                id="numero_parecer"
                value={formData.numero_parecer}
                onChange={(e) => setFormData({...formData, numero_parecer: e.target.value})}
                placeholder="Ex: PAR-001/2025"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conclusao">Conclusão *</Label>
              <Select value={formData.conclusao} onValueChange={(val) => setFormData({...formData, conclusao: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="procedente">Procedente</SelectItem>
                  <SelectItem value="improcedente">Improcedente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
            <Label htmlFor="relatorio">Relatório *</Label>
            <Textarea
              id="relatorio"
              value={formData.relatorio}
              onChange={(e) => setFormData({...formData, relatorio: e.target.value})}
              placeholder="Relatório detalhado do parecer..."
              rows={4}
              required
            />
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
