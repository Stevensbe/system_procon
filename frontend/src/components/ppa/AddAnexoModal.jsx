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

const DOCUMENT_TYPES = [
  { value: "DOCUMENTO", label: "Documento complementar" },
  { value: "AC", label: "Auto de Constatação" },
  { value: "AI", label: "Auto de Infração" },
  { value: "NOT", label: "Notificação" },
  { value: "DEFESA", label: "Defesa" },
  { value: "PARECER", label: "Parecer" },
  { value: "RESPOSTA", label: "Resposta da empresa" },
  { value: "IMAGEM", label: "Imagem/Fotos" },
  { value: "COMPROVANTE", label: "Comprovante" },
  { value: "OUTROS", label: "Outros" },
];

export default function AddAnexoModal({ ppaId, onClose }) {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState({
    tipo_documento: "DOCUMENTO",
    numero_documento: "",
    descricao: "",
    arquivo: null,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => ppaService.adicionarAnexo(ppaId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['anexos', ppaId]);
      queryClient.invalidateQueries(['ppa', ppaId]);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.arquivo) {
      alert("Por favor, selecione um arquivo.");
      return;
    }

    const data = new FormData();
    data.append("ppa", ppaId);
    data.append("tipo_documento", formState.tipo_documento);
    if (formState.numero_documento) {
      data.append("numero_documento", formState.numero_documento);
    }
    if (formState.descricao) {
      data.append("descricao", formState.descricao);
    }
    data.append("arquivo", formState.arquivo);

    createMutation.mutate(data);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>📎 Adicionar Anexo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_documento">Tipo de documento *</Label>
              <Select
                value={formState.tipo_documento}
                onValueChange={(val) => setFormState((prev) => ({ ...prev, tipo_documento: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_documento">Identificação/Número</Label>
              <Input
                id="numero_documento"
                value={formState.numero_documento}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, numero_documento: e.target.value }))
                }
                placeholder="Ex: NOT 047/2025"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formState.descricao}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, descricao: e.target.value }))
              }
              placeholder="Descreva o conteúdo do documento..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="arquivo">Arquivo *</Label>
            <Input
              id="arquivo"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, arquivo: e.target.files?.[0] || null }))
              }
              required
            />
            {formState.arquivo && (
              <p className="text-sm text-gray-600">
                Selecionado: {formState.arquivo.name} ({(formState.arquivo.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Enviando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
