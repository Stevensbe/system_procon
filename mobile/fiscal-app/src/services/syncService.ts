import { client } from '@/api/client';

export interface BootstrapResponse {
  timestamp: string;
  empresas: any[];
  agendamentos: any[];
  checklists: any[];
  autos_pendentes: any[];
  config: {
    timezone: string;
    assinatura_obrigatoria: boolean;
  };
}

export async function fetchBootstrap(lastSync?: string) {
  const { data } = await client.get<BootstrapResponse>('/mobile/sync/bootstrap', {
    params: lastSync ? { last_sync: lastSync } : undefined,
  });
  return data;
}

export interface AutoConstatacaoPayload {
  uuid: string;
  empresa_id: number | null;
  tipo: string;
  descricao: string;
  observacoes?: string;
  origem?: string;
  geo?: { lat: number; lng: number; precision?: number };
  emitido_em?: string;
}

export async function enviarAutoConstatacao(payload: AutoConstatacaoPayload) {
  const { data } = await client.post('/mobile/autos/constatacao', payload);
  return data;
}

export interface AutoInfracaoPayload {
  uuid: string;
  auto_constatacao_id: number;
  fundamentacao: string;
  dispositivos_legais: string[];
  valor_multa_estimado?: number;
  finalizar_no_orgao?: boolean;
  emitido_em?: string;
}

export async function enviarAutoInfracao(payload: AutoInfracaoPayload) {
  const { data } = await client.post('/mobile/autos/infracao', payload);
  return data;
}

export interface PedidoNotificacaoPayload {
  auto_id: number;
  tipo: string;
  canal_preferencial: string;
  observacoes?: string;
  anexos?: string[];
}

export async function registrarPedidoNotificacao(payload: PedidoNotificacaoPayload) {
  const { data } = await client.post('/mobile/notificacoes/pedidos', payload);
  return data;
}

export interface AgendamentoResumo {
  id: number;
  data_inicio: string;
  data_fim: string;
  local: string;
  tipo: string;
  status: string;
  empresa?: {
    id: number;
    razao_social: string;
  };
}

export async function listarAgendamentos() {
  const { data } = await client.get<AgendamentoResumo[]>('/mobile/agendamentos');
  return data;
}

export async function checkinAgendamento(agendamentoId: number, geo: { lat: number; lng: number }) {
  const { data } = await client.post(`/mobile/agendamentos/${agendamentoId}/checkin`, {
    geo,
    realizado_em: new Date().toISOString(),
  });
  return data;
}
