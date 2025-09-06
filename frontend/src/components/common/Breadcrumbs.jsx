import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

// Mapeamento de rotas para nomes amigáveis
const routeNames = {
  dashboard: 'Dashboard',
  fiscalizacao: 'Fiscalização',
  bancos: 'Bancos',
  supermercados: 'Supermercados',
  postos: 'Postos',
  diversos: 'Diversos',
  infracoes: 'Infrações',
  multas: 'Multas',
  financeiro: 'Financeiro',
  empresas: 'Empresas',
  notificacoes: 'Notificações',
  recursos: 'Recursos e Defesas',
  cobranca: 'Cobrança',
  auditoria: 'Auditoria',
  agenda: 'Agenda',
  'consulta-publica': 'Consulta Pública',
  produtos: 'Produtos',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
  perfil: 'Perfil',
  ajuda: 'Ajuda',
  processos: 'Processos',
  novo: 'Novo',
  editar: 'Editar',
  detalhes: 'Detalhes'
};

const Breadcrumbs = ({ className, ...props }) => {
  const location = useLocation();
  
  // Gerar breadcrumbs baseado na URL atual
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    // Sempre adicionar Home
    breadcrumbs.push({
      name: 'Home',
      href: '/dashboard',
      icon: HomeIcon,
      current: pathnames.length === 0
    });
    
    // Construir breadcrumbs dinamicamente
    let currentPath = '';
    pathnames.forEach((pathname, index) => {
      currentPath += `/${pathname}`;
      
      // Pular IDs numéricos
      if (/^\d+$/.test(pathname)) {
        return;
      }
      
      const name = routeNames[pathname] || pathname.charAt(0).toUpperCase() + pathname.slice(1);
      const isLast = index === pathnames.length - 1;
      
      breadcrumbs.push({
        name,
        href: isLast ? undefined : currentPath,
        current: isLast
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  if (breadcrumbs.length <= 1) {
    return null;
  }
  
  return (
    <nav className={cn("flex", className)} aria-label="Breadcrumb" {...props}>
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href || index} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" aria-hidden="true" />
            )}
            
            {breadcrumb.current ? (
              <span
                className="text-sm font-medium text-gray-500"
                aria-current="page"
              >
                {breadcrumb.icon && <breadcrumb.icon className="h-4 w-4 inline mr-1" />}
                {breadcrumb.name}
              </span>
            ) : (
              <Link
                to={breadcrumb.href}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 flex items-center"
              >
                {breadcrumb.icon && <breadcrumb.icon className="h-4 w-4 mr-1" />}
                {breadcrumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
