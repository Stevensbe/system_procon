import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ppaService from "../../services/ppaService";

export default function AddMovimentacaoModal({ ppaId, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    atendimento: "",
    usuario_nome: ""
  });

  const createMutation = useMutation({
    mutationFn: (payload) => ppaService.adicionarMovimentacao(ppaId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['movimentacoes', ppaId]);
      queryClient.invalidateQueries(['ppa', ppaId]);
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.atendimento.trim()) {
      alert("O campo atendimento é obrigatório");
      return;
    }
    const payload = {
      data: formData.data,
      hora: formData.hora || null,
      tipo_movimentacao: "observacao",
      atendimento: formData.usuario_nome
        ? `${formData.atendimento}\nResponsável: ${formData.usuario_nome}`
        : formData.atendimento,
    };
    createMutation.mutate(payload);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>📝 Adicionar Movimentação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({...formData, data: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora</Label>
              <Input
                id="hora"
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData({...formData, hora: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="atendimento">Atendimento *</Label>
            <Textarea
              id="atendimento"
              value={formData.atendimento}
              onChange={(e) => setFormData({...formData, atendimento: e.target.value})}
              placeholder="Descreva o atendimento realizado..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="usuario_nome">Responsável</Label>
            <Input
              id="usuario_nome"
              value={formData.usuario_nome}
              onChange={(e) => setFormData({...formData, usuario_nome: e.target.value})}
              placeholder="Nome do responsável"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
