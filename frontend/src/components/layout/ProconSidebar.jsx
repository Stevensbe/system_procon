import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Shield,
  FileText,
  Building2,
  ClipboardCheck,
  Inbox as InboxIcon,
  Bell,
  BarChart3,
  Home,
  Users,
  Settings,
  Scale,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { useInboxStats } from '@/hooks/useInboxStats';

// Menu principal do sistema
const mainMenuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Fiscalização', url: '/fiscalizacao', icon: ClipboardCheck },
  { title: 'Jurídico', url: '/juridico', icon: Scale },
  { title: 'Processos', url: '/processos', icon: FileText },
  { title: 'Multas', url: '/multas', icon: DollarSign },
  { title: 'Financeiro', url: '/financeiro', icon: TrendingUp },
  { title: 'Empresas', url: '/empresas', icon: Building2 },
  { title: 'Usuários', url: '/usuarios', icon: Users },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

// Caixa de entrada unificada
const caixasEntradaItems = [
  {
    title: 'Caixa de Entrada',
    url: '/caixa-entrada',
    icon: InboxIcon,
    badge: 'inbox',
    description: 'Visão unificada da caixa pessoal e do setor'
  },
];

// Itens de notificação e inbox
const notificationItems = [
  { title: 'Inbox', url: '/caixa-entrada', icon: InboxIcon, hasBadge: 'inbox' },
  { title: 'Notificações', url: '/notificacoes', icon: Bell, hasBadge: 'notifications' },
];

export function ProconSidebar() {
  const { state } = useSidebar();
  const { unreadCount } = useNotifications();
  const { stats: inboxStats } = useInboxStats();
  
  const isCollapsed = state === 'collapsed';

  // Obter contadores das caixas de entrada
  const getBadgeCount = (type) => {
    const counts = {
      inbox: (inboxStats?.pessoal || 0) + (inboxStats?.setor || 0),
      notifications: unreadCount || 0,
    };
    return counts[type] || 0;
  };

  const renderMenuItem = (item, showBadge = false) => {
    const badgeCount = showBadge ? getBadgeCount(item.badge || item.hasBadge) : 0;
    
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end
            className={({ isActive }) =>
              isActive
                ? 'bg-primary/10 text-primary font-medium border-l-4 border-primary'
                : 'hover:bg-muted/50 text-foreground'
            }
          >
            <item.icon className="h-4 w-4" />
            {!isCollapsed && (
              <div className="flex items-center justify-between flex-1">
                <span>{item.title}</span>
                {badgeCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {badgeCount}
                  </Badge>
                )}
              </div>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="border-r border-border/50 bg-card">
      <SidebarContent>
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-xl shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-lg text-foreground">PROCON</h2>
                <p className="text-xs text-muted-foreground">Sistema Integrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Principal */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Caixas de Entrada Setoriais */}
        <SidebarGroup>
          <SidebarGroupLabel>Caixas de Entrada</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {caixasEntradaItems.map((item) => renderMenuItem(item, true))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Notificações e Inbox */}
        <SidebarGroup>
          <SidebarGroupLabel>Comunicação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {notificationItems.map((item) => renderMenuItem(item, true))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Estatísticas Rápidas */}
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Estatísticas</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-4 py-2 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Inbox</span>
                  <span className="font-medium">{getBadgeCount('inbox')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Notificações</span>
                  <span className="font-medium">{getBadgeCount('notifications')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Denúncias</span>
                  <span className="font-medium">{getBadgeCount('denuncias')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fiscalização</span>
                  <span className="font-medium">{getBadgeCount('fiscalizacao')}</span>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Status do Sistema */}
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Status</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-4 py-2 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">Sistema Online</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-muted-foreground">API Conectada</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-muted-foreground">Sincronização</span>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
