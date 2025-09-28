/**
 * Utilitários para controle do Sidebar Moderno
 * Sistema PROCON-AM
 */

// =========================================================================
// === CONTROLE DO SIDEBAR ===
// =========================================================================

class SidebarController {
  constructor() {
    this.sidebar = null;
    this.isCollapsed = false;
    this.isMobile = window.innerWidth <= 768;
    this.init();
  }

  init() {
    this.sidebar = document.querySelector('.sidebar');
    this.setupEventListeners();
    this.setupResponsive();
  }

  setupEventListeners() {
    // Toggle do sidebar em mobile
    document.addEventListener('click', (e) => {
      if (e.target.matches('.sidebar-toggle-btn')) {
        this.toggle();
      }
    });

    // Fechar sidebar ao clicar fora (mobile)
    document.addEventListener('click', (e) => {
      if (this.isMobile && this.isOpen() && !e.target.closest('.sidebar')) {
        this.close();
      }
    });

    // Controle de teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  setupResponsive() {
    window.addEventListener('resize', () => {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth <= 768;
      
      if (wasMobile !== this.isMobile) {
        this.handleResponsiveChange();
      }
    });
  }

  handleResponsiveChange() {
    if (this.isMobile) {
      this.sidebar?.classList.add('mobile');
      this.close();
    } else {
      this.sidebar?.classList.remove('mobile');
      this.open();
    }
  }

  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.sidebar) {
      this.sidebar.classList.remove('sidebar-toggle');
      this.sidebar.classList.add('open');
      document.body.classList.add('sidebar-open');
    }
  }

  close() {
    if (this.sidebar) {
      this.sidebar.classList.add('sidebar-toggle');
      this.sidebar.classList.remove('open');
      document.body.classList.remove('sidebar-open');
    }
  }

  isOpen() {
    return this.sidebar?.classList.contains('open') || false;
  }

  collapse() {
    if (this.sidebar) {
      this.sidebar.classList.add('sidebar-collapsed');
      this.isCollapsed = true;
    }
  }

  expand() {
    if (this.sidebar) {
      this.sidebar.classList.remove('sidebar-collapsed');
      this.isCollapsed = false;
    }
  }

  toggleCollapse() {
    if (this.isCollapsed) {
      this.expand();
    } else {
      this.collapse();
    }
  }
}

// =========================================================================
// === CONTROLE DE SUBMENUS ===
// =========================================================================

class SubmenuController {
  constructor() {
    this.init();
  }

  init() {
    // Configurar cliques nos submenus
    document.addEventListener('click', (e) => {
      const submenuToggle = e.target.closest('.sub-menu > a');
      if (submenuToggle) {
        e.preventDefault();
        this.toggleSubmenu(submenuToggle);
      }
    });

    // Configurar navegação ativa
    this.setActiveNavigation();
  }

  toggleSubmenu(toggleElement) {
    const submenu = toggleElement.nextElementSibling;
    const arrow = toggleElement.querySelector('.arrow');
    
    if (submenu) {
      const isOpen = submenu.style.display === 'block';
      
      // Fechar todos os outros submenus
      this.closeAllSubmenus();
      
      if (!isOpen) {
        submenu.style.display = 'block';
        toggleElement.classList.add('active');
        if (arrow) {
          arrow.classList.remove('fa-angle-right');
          arrow.classList.add('fa-angle-down');
        }
      }
    }
  }

  closeAllSubmenus() {
    const allSubmenus = document.querySelectorAll('.sub-menu ul');
    const allToggles = document.querySelectorAll('.sub-menu a');
    const allArrows = document.querySelectorAll('.sub-menu a .arrow');
    
    allSubmenus.forEach(submenu => {
      submenu.style.display = 'none';
    });
    
    allToggles.forEach(toggle => {
      toggle.classList.remove('active');
    });
    
    allArrows.forEach(arrow => {
      arrow.classList.remove('fa-angle-down');
      arrow.classList.add('fa-angle-right');
    });
  }

  setActiveNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar a[href]');
    
    // Remover classe active de todos os links
    navLinks.forEach(link => {
      link.classList.remove('active');
    });
    
    // Adicionar classe active ao link atual
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath || currentPath.startsWith(href + '/')) {
        link.classList.add('active');
        
        // Expandir submenu pai se necessário
        const submenu = link.closest('.sub-menu');
        if (submenu) {
          const toggle = submenu.querySelector('a');
          if (toggle) {
            this.toggleSubmenu(toggle);
          }
        }
      }
    });
  }
}

// =========================================================================
// === NANO SCROLLER ===
// =========================================================================

class NanoScroller {
  constructor(container) {
    this.container = container;
    this.content = container.querySelector('.nano-content');
    this.init();
  }

  init() {
    if (this.content) {
      this.setupScrollbar();
    }
  }

  setupScrollbar() {
    // Adicionar scrollbar personalizada se necessário
    this.content.style.overflowY = 'auto';
    this.content.style.overflowX = 'hidden';
  }

  refresh() {
    // Atualizar scrollbar se necessário
    if (this.content) {
      this.content.style.height = 'auto';
      this.content.style.height = this.content.scrollHeight + 'px';
    }
  }
}

// =========================================================================
// === INICIALIZAÇÃO ===
// =========================================================================

let sidebarController;
let submenuController;

function initSidebar() {
  // Aguardar o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeControllers();
    });
  } else {
    initializeControllers();
  }
}

function initializeControllers() {
  sidebarController = new SidebarController();
  submenuController = new SubmenuController();
  
  // Inicializar nano scroller se existir
  const nanoContainer = document.querySelector('.nano');
  if (nanoContainer) {
    new NanoScroller(nanoContainer);
  }
}

// =========================================================================
// === EXPORTS ===
// =========================================================================

export {
  SidebarController,
  SubmenuController,
  NanoScroller,
  initSidebar
};

// Auto-inicializar se não estiver em um módulo
if (typeof window !== 'undefined') {
  initSidebar();
}
