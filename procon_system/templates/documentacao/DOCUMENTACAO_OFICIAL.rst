================================================================================
          DOCUMENTAÇÃO OFICIAL DO SISTEMA PROCON-AM
          Sistema Integrado de Proteção e Defesa do Consumidor
================================================================================

SUMÁRIO EXECUTIVO
================================================================================

+------------------+----------------------------------------------------+
| Item             | Descrição                                          |
+==================+====================================================+
| Nome do Sistema  | SISPROCON - Sistema PROCON-AM                      |
+------------------+----------------------------------------------------+
| Versão           | 1.0.0                                              |
+------------------+----------------------------------------------------+
| Desenvolvido     | PROCON do Estado do Amazonas                       |
+------------------+----------------------------------------------------+
| Arquitetura      | Full-Stack (Django REST + React)                   |
+------------------+----------------------------------------------------+
| Banco de Dados   | PostgreSQL / SQLite (desenvolvimento)              |
+------------------+----------------------------------------------------+


1. INTRODUÇÃO E VISÃO GERAL
================================================================================

1.1 O que é o SISPROCON?
------------------------

O SISPROCON (Sistema Integrado de Proteção ao Consumidor) é uma plataforma 
web completa desenvolvida para o PROCON do Estado do Amazonas. O sistema 
digitaliza e automatiza todos os processos relacionados à proteção e defesa 
do consumidor, desde o atendimento inicial até a conclusão de processos 
administrativos.

1.2 Objetivos do Sistema
------------------------

1. Digitalização Completa: Eliminar processos manuais e em papel
2. Gestão Integrada: Unificar todos os setores em uma única plataforma
3. Transparência: Permitir acompanhamento público de processos
4. Eficiência Operacional: Automatizar fluxos de trabalho
5. Business Intelligence: Fornecer dados analíticos para decisão
6. Compliance com LGPD: Garantir proteção de dados pessoais
7. Auditoria Completa: Rastreabilidade de todas as ações

1.3 Público-Alvo
----------------

- Cidadão/Consumidor: Portal para reclamações e consultas
- Empresas: Portal para responder reclamações
- Atendentes: Triagem e atendimento presencial
- Fiscais: Autos de constatação e infração
- Analistas Jurídicos: Análise de processos e pareceres
- Gestores/Diretores: Dashboards e relatórios
- TI/Administradores: Gestão de usuários e configurações


2. ARQUITETURA TÉCNICA
================================================================================

2.1 Stack Tecnológico
---------------------

BACKEND (procon_system/):
- Django 4.x (Framework Web Python)
- Django REST Framework (API REST)
- SimpleJWT (Autenticação JWT)
- PostgreSQL (Banco de Dados Principal)
- Redis (Cache e Sessões)
- Celery (Tarefas Assíncronas)
- drf-spectacular (Documentação OpenAPI)
- Prometheus (Métricas e Monitoramento)
- Gunicorn (Servidor WSGI)

FRONTEND (frontend/):
- React 18.x (Biblioteca UI)
- React Router 6 (Roteamento SPA)
- TailwindCSS (Framework CSS)
- Vite (Build Tool)
- Axios (HTTP Client)
- Chart.js / Recharts (Gráficos)
- Jest + Playwright (Testes)

INFRAESTRUTURA:
- Docker / Docker Compose
- Nginx (Proxy Reverso)
- GitHub Actions (CI/CD)
- Prometheus + Grafana (Monitoramento)


3. MÓDULOS DO SISTEMA
================================================================================

3.1 MÓDULO DE ATENDIMENTO
-------------------------

Gerencia todo o fluxo de atendimento presencial e remoto do PROCON.

Modelos Principais:
- BalcaoAtendimento: Guichês de atendimento
- Atendimento: Registro de cada atendimento
- FilaAtendimento: Controle de filas
- ConfiguracaoAtendimento: Parâmetros do sistema
- RegraDistribuicaoAtendimento: Regras de distribuição

Funcionalidades:
[x] Totem de autoatendimento para senhas
[x] Painel TV para chamada de senhas
[x] Fila de espera com prioridades
[x] Registro de atendimentos com LGPD
[x] Estatísticas de tempo de espera
[x] Distribuição automática de reclamações
[x] Classificação por gravidade (BAIXA, MÉDIA, ALTA)


3.2 MÓDULO DE FISCALIZAÇÃO
--------------------------

Sistema completo para fiscalização de estabelecimentos comerciais.

Modelos Principais:
- AutoConstatacaoBase: Classe base abstrata
- AutoBanco: Auto para agências bancárias
- AutoPosto: Auto para postos de combustível
- AutoSupermercado: Auto para supermercados
- AutoDiversos: Auto para legislação diversa
- AutoInfracao: Auto de infração
- Processo: Processo administrativo

Campos Comuns dos Autos:
- Número do auto (gerado automaticamente)
- UUID local (para sincronização offline)
- CNPJ e Razão Social
- Endereço completo
- Data/Hora da fiscalização
- Fiscal responsável
- Assinatura digital
- Origem (WEB/MOBILE)
- Geolocalização (latitude/longitude)

Funcionalidades:
[x] Criação de autos com geolocalização
[x] Leitura de código de barras de produtos
[x] Captura de fotos e anexos
[x] Assinatura digital
[x] Modo offline com sincronização
[x] Geração automática de número sequencial
[x] Fluxo para auto de infração


3.3 MÓDULO DE MULTAS
--------------------

Gerenciamento completo do ciclo de vida de multas.

Modelos Principais:
- Multa: Registro principal da multa
- Cobranca: Tentativas de cobrança
- Peticao: Petições recebidas
- Recurso: Recursos impetrados
- Analise: Análises de recursos

Status da Multa:
PENDENTE | NOTIFICADA | QUITADA | PARCELADA | CANCELADA | EM_RECURSO | EM_EXECUCAO_FISCAL

Funcionalidades:
[x] Geração automática de multas a partir de processos
[x] Cálculo de juros e correção monetária
[x] Notificações automáticas de vencimento
[x] Registro de pagamentos
[x] Fluxo de recursos (1ª e 2ª instância)


3.4 MÓDULO JURÍDICO
-------------------

Suporte completo ao setor jurídico do PROCON.

Modelos Principais:
- AnalistaJuridico: Perfil do analista
- ProcessoJuridico: Processo principal
- AnaliseJuridica: Análise técnica
- RespostaJuridica: Respostas formais
- PrazoJuridico: Controle de prazos
- DocumentoJuridico: Documentos anexados

Status do Processo:
ABERTO | EM_ANALISE | AGUARDANDO_DOCUMENTO | RESPONDIDO | FINALIZADO | ARQUIVADO

Funcionalidades:
[x] Gestão de processos jurídicos
[x] Controle de prazos com alertas
[x] Elaboração de pareceres e análises
[x] Gestão de documentos por processo
[x] Histórico completo de tramitações


3.5 MÓDULO DE PROTOCOLO
-----------------------

Sistema de protocolo único para todos os documentos.

Modelos Principais:
- TipoProtocolo: Tipos disponíveis
- StatusProtocolo: Status possíveis
- Protocolo: Registro principal
- DocumentoProtocolo: Documentos anexados
- TramitacaoProtocolo: Histórico de tramitação

Tipos de Protocolo:
DENUNCIA | RECLAMACAO | CONSULTA | PETICAO | RECURSO | NOTIFICACAO | OUTROS

Prioridades:
BAIXA | NORMAL | ALTA | URGENTE


3.6 MÓDULO PPA (Procedimento Preliminar Administrativo)
-------------------------------------------------------

Gerencia o PPA - "capa" do processo.

Modelos Principais:
- ProcedimentoPreAdministrativo: PPA principal
- MovimentacaoPPA: Registro de eventos
- AnexoPPA: Documentos anexados
- ParecerPPA: Parecer técnico

Tipos de Anexo:
AC (Auto de Constatação) | AI (Auto de Infração) | NOT (Notificação)
DEF (Defesa) | RAZ (Razões Finais) | PAR (Parecer) | DEC (Decisão)

Funcionalidades:
[x] Criação automática de PPA a partir de AC/AI
[x] Vinculação genérica de documentos
[x] Timeline de movimentações
[x] Geração de pareceres técnicos
[x] Exportação em Word/PDF


3.7 MÓDULO CAIXA DE ENTRADA
---------------------------

Sistema de caixa de entrada unificada, similar ao SIGED.

Setores:
ATENDIMENTO | FISCALIZACAO | JURIDICO | DIRETORIA | DAF | TI

Status do Documento:
NAO_LIDO | LIDO | EM_ANALISE | RESPONDIDO | ENCAMINHADO | ARQUIVADO | URGENTE

Funcionalidades:
[x] Visualização por setor (caixa pessoal e do setor)
[x] Distribuição automática ou manual
[x] Controle de prazos de resposta
[x] Encaminhamento entre setores
[x] Alertas de documentos atrasados


3.8 MÓDULO DE TRIAGEM
---------------------

Centraliza a triagem de todas as demandas.

Origens:
PORTAL | TELEFONE | PRESENCIAL | EMAIL | OFICIO | REPRESENTACAO

Status:
nova | em_analise | pendente_informacao | em_atendimento | encaminhada | concluida | arquivada

Funcionalidades:
[x] Recepção de demandas do portal
[x] Classificação automática de prioridade
[x] Encaminhamento para fiscalização
[x] Agendamento automático de fiscalização
[x] Criação de PPA a partir da triagem


3.9 MÓDULO DE COBRANÇA
----------------------

Gestão completa de cobranças de multas.

Modelos Principais:
- ConfiguracaoCobranca: Parâmetros
- BoletoMulta: Boletos gerados
- PagamentoMulta: Registro de pagamentos

Funcionalidades:
[x] Geração automática de boletos
[x] Cálculo de juros e multa por atraso
[x] Geração de código PIX (EMV)
[x] Código de barras padronizado
[x] Registro e confirmação de pagamentos


3.10 MÓDULO DE NOTIFICAÇÕES
---------------------------

Sistema centralizado de notificações multicanal.

Canais:
email | sms | push | sistema

Funcionalidades:
[x] Múltiplos canais de envio
[x] Templates configuráveis
[x] Agendamento de envio
[x] Push para mobile


3.11 MÓDULO DE BUSINESS INTELLIGENCE
------------------------------------

Dashboards executivos e KPIs governamentais.

Tipos de Dashboard:
EXECUTIVO | OPERACIONAL | TATICO | GERENCIAL

Funcionalidades:
[x] KPIs governamentais configuráveis
[x] Dashboards por perfil de usuário
[x] Gráficos e visualizações
[x] Relatórios automatizados
[x] Exportação Excel/PDF


3.12 PORTAL DO CIDADÃO
----------------------

Interface pública para cidadãos.

Funcionalidades:
[x] Registro de reclamações online
[x] Denúncia anônima
[x] Consulta de processos
[x] Acompanhamento de reclamações
[x] Download de formulários
[x] Ranking de empresas
[x] Pesquisa de preços


3.13 PORTAL DA EMPRESA
----------------------

Interface para empresas.

Funcionalidades:
[x] Login com CNPJ
[x] Visualização de reclamações
[x] Resposta a reclamações
[x] Upload de documentos
[x] Pagamento de multas


3.14 MÓDULO DE AUDITORIA
------------------------

Sistema completo de logs e auditoria.

Níveis de Log:
DEBUG | INFO | WARNING | ERROR | CRITICAL

Funcionalidades:
[x] Log de todas as ações
[x] Rastreamento de alterações
[x] Registro de sessões de usuário
[x] Controle de acessos
[x] Exportação de logs


4. SEGURANÇA E AUTENTICAÇÃO
================================================================================

4.1 Autenticação JWT
--------------------
ACCESS_TOKEN_LIFETIME: 30 minutos
REFRESH_TOKEN_LIFETIME: 24 horas
ROTATE_REFRESH_TOKENS: True
BLACKLIST_AFTER_ROTATION: True

4.2 Níveis de Permissão
-----------------------
admin    - Administrador: Acesso total
staff    - Funcionário PROCON: Módulos operacionais
empresa  - Representante: Portal Empresa
consumer - Consumidor: Portal Consumidor

4.3 Rate Limiting
-----------------
60 requests/minuto para endpoints autenticados
10 requests/minuto para endpoints públicos

4.4 LGPD Compliance
-------------------
- Consentimento registrado
- Remoção de dados sob demanda
- Anonimização de registros históricos


5. FRONTEND REACT
================================================================================

5.1 Estatísticas
----------------
Total de Páginas: 154+
Total de Componentes: 100+
Serviços API: 37
Hooks Customizados: 6

5.2 Módulos de Páginas
----------------------
auth/           - 2 páginas (Login, Logout)
atendimento/    - 8 páginas
fiscalizacao/   - 25 páginas
ppa/            - 8 páginas
juridico/       - 10 páginas
cobranca/       - 10 páginas
protocolo/      - 4 páginas
tramitacao/     - 5 páginas
caixa-entrada/  - 9 páginas
configuracoes/  - 6 páginas
portal/         - 8 páginas
relatorios/     - 4 páginas


6. MÉTRICAS DO PROJETO
================================================================================

+------------------+----------+------------------+
| Componente       | Arquivos | Linhas (aprox.)  |
+==================+==========+==================+
| Backend Python   | ~200     | ~50.000          |
+------------------+----------+------------------+
| Frontend React   | ~300     | ~70.000          |
+------------------+----------+------------------+
| Templates Django | ~90      | ~10.000          |
+------------------+----------+------------------+
| Testes           | ~100     | ~15.000          |
+------------------+----------+------------------+
| TOTAL            | ~690     | ~145.000         |
+------------------+----------+------------------+

+-----------------------+--------+
| Categoria             | Qtd    |
+=======================+========+
| Modelos Django        | 150+   |
+-----------------------+--------+
| Endpoints API         | 200+   |
+-----------------------+--------+
| Páginas React         | 154+   |
+-----------------------+--------+
| Componentes React     | 100+   |
+-----------------------+--------+
| Serviços API (JS)     | 37     |
+-----------------------+--------+


7. GLOSSÁRIO
================================================================================

+------------+--------------------------------------------------+
| Termo      | Definição                                        |
+============+==================================================+
| AC         | Auto de Constatação                              |
+------------+--------------------------------------------------+
| AI         | Auto de Infração                                 |
+------------+--------------------------------------------------+
| CDC        | Código de Defesa do Consumidor                   |
+------------+--------------------------------------------------+
| CIP        | Carta de Informação Preliminar                   |
+------------+--------------------------------------------------+
| DAF        | Departamento Administrativo Financeiro           |
+------------+--------------------------------------------------+
| LGPD       | Lei Geral de Proteção de Dados                   |
+------------+--------------------------------------------------+
| NOT        | Notificação                                      |
+------------+--------------------------------------------------+
| PPA        | Procedimento Preliminar Administrativo           |
+------------+--------------------------------------------------+
| PROCON     | Programa de Proteção e Defesa do Consumidor      |
+------------+--------------------------------------------------+
| SIGED      | Sistema Integrado de Gestão de Documentos        |
+------------+--------------------------------------------------+
| SISPROCON  | Sistema Integrado do PROCON                      |
+------------+--------------------------------------------------+


8. CONCLUSÃO
================================================================================

O SISPROCON é um sistema completo e robusto que digitaliza e automatiza 
todos os processos do PROCON-AM:

[x] Gestão completa de fiscalizações, multas e processos
[x] Portais externos para cidadãos e empresas
[x] Fluxo de trabalho integrado entre todos os setores
[x] Business Intelligence para tomada de decisão
[x] Auditoria completa para transparência e compliance
[x] Segurança com JWT, LGPD e controle de acessos
[x] Escalabilidade com Docker, Redis e arquitetura modular

O sistema está preparado para atender às demandas atuais e futuras do 
órgão de proteção ao consumidor, proporcionando eficiência operacional,
transparência aos cidadãos e ferramentas de gestão para os gestores.

================================================================================
Documento gerado em: Janeiro de 2026
Versão do Documento: 1.0
Sistema: SISPROCON - Sistema PROCON-AM
Versão do Sistema: 1.0.0
================================================================================
