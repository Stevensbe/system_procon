/**
 * SISPROCON - Sistema de Controle de Processos Administrativos
 * JavaScript utilities and components
 * 
 * @version 1.0.0
 * @author SISPROCON Team
 */

(function(global) {
    'use strict';

    // Main SISPROCON object
    const SISPROCON = {
        version: '1.0.0',
        debug: false,
        config: {
            animations: true,
            toastDuration: 5000,
            apiTimeout: 30000,
            pageSize: 25
        },
        
        // Initialize the system
        init: function(options = {}) {
            this.config = { ...this.config, ...options };
            this.debug = options.debug || window.location.hostname === 'localhost';
            
            this.log('SISPROCON initialized', this.config);
            
            // Initialize components
            this.initializeComponents();
            this.bindGlobalEvents();
            this.setupAjax();
            
            return this;
        },
        
        // Logging utility
        log: function(...args) {
            if (this.debug) {
                console.log('[SISPROCON]', ...args);
            }
        },
        
        // Error logging
        error: function(...args) {
            console.error('[SISPROCON]', ...args);
        },
        
        // Initialize all components
        initializeComponents: function() {
            this.Toast.init();
            this.Modal.init();
            this.DataTable.init();
            this.Forms.init();
            this.Charts.init();
            this.FileUpload.init();
            this.Search.init();
        },
        
        // Bind global events
        bindGlobalEvents: function() {
            // Global keyboard shortcuts
            document.addEventListener('keydown', this.handleGlobalKeyboard.bind(this));
            
            // Handle AJAX errors globally
            window.addEventListener('unhandledrejection', this.handleError.bind(this));
            
            // Page visibility changes
            document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
            
            // Connection status
            window.addEventListener('online', () => this.showToast('Conexão restaurada', 'success'));
            window.addEventListener('offline', () => this.showToast('Conexão perdida', 'warning'));
        },
        
        // Setup AJAX defaults
        setupAjax: function() {
            // Set default headers for all requests
            const csrfToken = this.getCookie('csrftoken');
            if (csrfToken) {
                // Add CSRF token to all AJAX requests
                const originalFetch = window.fetch;
                window.fetch = function(url, options = {}) {
                    if (options.method && options.method.toUpperCase() !== 'GET') {
                        options.headers = {
                            'X-CSRFToken': csrfToken,
                            ...options.headers
                        };
                    }
                    return originalFetch(url, options);
                };
            }
        },
        
        // Global keyboard handler
        handleGlobalKeyboard: function(e) {
            // Ctrl+/ for help
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                this.showHelp();
            }
            
            // Escape to close modals/overlays
            if (e.key === 'Escape') {
                this.closeAllOverlays();
            }
            
            // Ctrl+K for search
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.Search.focus();
            }
        },
        
        // Handle visibility changes
        handleVisibilityChange: function() {
            if (document.hidden) {
                this.log('Page hidden - pausing real-time updates');
                this.pauseRealTimeUpdates();
            } else {
                this.log('Page visible - resuming real-time updates');
                this.resumeRealTimeUpdates();
            }
        },
        
        // Error handler
        handleError: function(error) {
            this.error('Unhandled error:', error);
            this.showToast('Ocorreu um erro inesperado', 'error');
        },
        
        // Utility functions
        utils: {
            // Debounce function
            debounce: function(func, wait, immediate) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        timeout = null;
                        if (!immediate) func(...args);
                    };
                    const callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) func(...args);
                };
            },
            
            // Throttle function
            throttle: function(func, limit) {
                let inThrottle;
                return function(...args) {
                    if (!inThrottle) {
                        func.apply(this, args);
                        inThrottle = true;
                        setTimeout(() => inThrottle = false, limit);
                    }
                };
            },
            
            // Format currency
            formatCurrency: function(value, currency = 'BRL') {
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: currency
                }).format(value);
            },
            
            // Format date
            formatDate: function(date, options = {}) {
                const defaultOptions = {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                };
                return new Intl.DateTimeFormat('pt-BR', { ...defaultOptions, ...options }).format(new Date(date));
            },
            
            // Format file size
            formatFileSize: function(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            },
            
            // Generate UUID
            generateUUID: function() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },
            
            // Sanitize HTML
            sanitizeHTML: function(str) {
                const temp = document.createElement('div');
                temp.textContent = str;
                return temp.innerHTML;
            },
            
            // Deep clone object
            deepClone: function(obj) {
                return JSON.parse(JSON.stringify(obj));
            }
        },
        
        // Get cookie value
        getCookie: function(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        },
        
        // Show toast notification
        showToast: function(message, type = 'info', duration = null) {
            return this.Toast.show(message, type, duration);
        },
        
        // Show confirmation dialog
        confirm: function(message, onConfirm, onCancel = null) {
            return this.Modal.confirm(message, onConfirm, onCancel);
        },
        
        // Show loading state
        showLoading: function(element) {
            if (element) {
                element.classList.add('loading');
                element.setAttribute('aria-busy', 'true');
            }
        },
        
        // Hide loading state
        hideLoading: function(element) {
            if (element) {
                element.classList.remove('loading');
                element.removeAttribute('aria-busy');
            }
        },
        
        // Close all overlays
        closeAllOverlays: function() {
            // Close modals
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) bsModal.hide();
            });
            
            // Close dropdowns
            const dropdowns = document.querySelectorAll('.dropdown-menu.show');
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('show');
            });
            
            // Close popovers
            const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
            popovers.forEach(trigger => {
                const popover = bootstrap.Popover.getInstance(trigger);
                if (popover) popover.hide();
            });
        },
        
        // Show help
        showHelp: function() {
            this.Modal.show({
                title: 'Atalhos do Teclado',
                body: `
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Navegação</h6>
                            <ul class="list-unstyled">
                                <li><kbd>Ctrl</kbd> + <kbd>/</kbd> - Ajuda</li>
                                <li><kbd>Ctrl</kbd> + <kbd>K</kbd> - Buscar</li>
                                <li><kbd>Esc</kbd> - Fechar</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6>Formulários</h6>
                            <ul class="list-unstyled">
                                <li><kbd>Ctrl</kbd> + <kbd>S</kbd> - Salvar</li>
                                <li><kbd>Ctrl</kbd> + <kbd>Enter</kbd> - Enviar</li>
                                <li><kbd>Tab</kbd> - Próximo campo</li>
                            </ul>
                        </div>
                    </div>
                `,
                size: 'lg'
            });
        },
        
        // Pause real-time updates
        pauseRealTimeUpdates: function() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        },
        
        // Resume real-time updates
        resumeRealTimeUpdates: function() {
            if (!this.updateInterval) {
                this.updateInterval = setInterval(() => {
                    this.DataTable.refresh();
                }, 30000); // 30 seconds
            }
        }
    };
    
    // Toast component
    SISPROCON.Toast = {
        container: null,
        
        init: function() {
            this.createContainer();
        },
        
        createContainer: function() {
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.className = 'toast-container position-fixed top-0 end-0 p-3';
                this.container.style.zIndex = '1055';
                document.body.appendChild(this.container);
            }
        },
        
        show: function(message, type = 'info', duration = null) {
            const id = SISPROCON.utils.generateUUID();
            const toastDuration = duration || SISPROCON.config.toastDuration;
            
            const toastHtml = `
                <div class="toast align-items-center text-bg-${type} border-0" id="${id}" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="d-flex">
                        <div class="toast-body">
                            <i class="fas fa-${this.getIcon(type)} me-2"></i>
                            ${SISPROCON.utils.sanitizeHTML(message)}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
                    </div>
                </div>
            `;
            
            this.container.insertAdjacentHTML('beforeend', toastHtml);
            const toastElement = document.getElementById(id);
            
            const toast = new bootstrap.Toast(toastElement, {
                delay: toastDuration
            });
            
            toast.show();
            
            // Remove element after hiding
            toastElement.addEventListener('hidden.bs.toast', () => {
                toastElement.remove();
            });
            
            SISPROCON.log('Toast shown:', message, type);
            return toast;
        },
        
        getIcon: function(type) {
            const icons = {
                success: 'check-circle',
                error: 'exclamation-triangle',
                warning: 'exclamation-triangle',
                info: 'info-circle',
                danger: 'exclamation-triangle'
            };
            return icons[type] || 'info-circle';
        }
    };
    
    // Modal component
    SISPROCON.Modal = {
        init: function() {
            // Global modal container
            if (!document.getElementById('globalModal')) {
                const modalHtml = `
                    <div class="modal fade" id="globalModal" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title"></h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                                </div>
                                <div class="modal-body"></div>
                                <div class="modal-footer"></div>
                            </div>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHtml);
            }
        },
        
        show: function(options) {
            const modal = document.getElementById('globalModal');
            const dialog = modal.querySelector('.modal-dialog');
            const title = modal.querySelector('.modal-title');
            const body = modal.querySelector('.modal-body');
            const footer = modal.querySelector('.modal-footer');
            
            // Set size
            dialog.className = `modal-dialog ${options.size ? 'modal-' + options.size : ''}`;
            
            // Set content
            title.textContent = options.title || '';
            body.innerHTML = options.body || '';
            
            // Set footer
            if (options.footer) {
                footer.innerHTML = options.footer;
                footer.style.display = 'block';
            } else {
                footer.style.display = 'none';
            }
            
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            return bsModal;
        },
        
        confirm: function(message, onConfirm, onCancel = null) {
            const modalId = 'confirmModal_' + Date.now();
            const modalHtml = `
                <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Confirmação</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                            </div>
                            <div class="modal-body">
                                <i class="fas fa-question-circle text-warning me-2"></i>
                                ${SISPROCON.utils.sanitizeHTML(message)}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" id="confirmBtn">Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = document.getElementById(modalId);
            const confirmBtn = document.getElementById('confirmBtn');
            
            const bsModal = new bootstrap.Modal(modal);
            
            confirmBtn.addEventListener('click', () => {
                bsModal.hide();
                if (onConfirm) onConfirm();
            });
            
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                if (onCancel) onCancel();
            });
            
            bsModal.show();
            return bsModal;
        }
    };
    
    // DataTable component
    SISPROCON.DataTable = {
        tables: new Map(),
        
        init: function() {
            // Initialize all data tables
            document.querySelectorAll('.data-table').forEach(table => {
                this.create(table);
            });
        },
        
        create: function(table, options = {}) {
            if (!window.$ || !$.fn.DataTable) {
                SISPROCON.error('DataTables library not found');
                return null;
            }
            
            const defaultOptions = {
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json'
                },
                pageLength: SISPROCON.config.pageSize,
                responsive: true,
                order: [],
                columnDefs: [
                    { orderable: false, targets: 'no-sort' }
                ],
                dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                     '<"row"<"col-sm-12"tr>>' +
                     '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>'
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            const dataTable = $(table).DataTable(mergedOptions);
            
            this.tables.set(table.id || table, dataTable);
            SISPROCON.log('DataTable created:', table.id);
            
            return dataTable;
        },
        
        refresh: function(tableId = null) {
            if (tableId) {
                const table = this.tables.get(tableId);
                if (table) table.ajax.reload(null, false);
            } else {
                this.tables.forEach(table => {
                    if (table.ajax && table.ajax.reload) {
                        table.ajax.reload(null, false);
                    }
                });
            }
        },
        
        destroy: function(tableId) {
            const table = this.tables.get(tableId);
            if (table) {
                table.destroy();
                this.tables.delete(tableId);
            }
        }
    };
    
    // Forms component
    SISPROCON.Forms = {
        init: function() {
            this.setupValidation();
            this.setupMasks();
            this.setupAutosave();
        },
        
        setupValidation: function() {
            // Real-time validation
            document.addEventListener('input', function(e) {
                if (e.target.hasAttribute('required')) {
                    if (e.target.value.trim()) {
                        e.target.classList.remove('is-invalid');
                        e.target.classList.add('is-valid');
                    } else {
                        e.target.classList.remove('is-valid');
                    }
                }
            });
            
            // Email validation
            document.addEventListener('blur', function(e) {
                if (e.target.type === 'email' && e.target.value) {
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (emailPattern.test(e.target.value)) {
                        e.target.classList.remove('is-invalid');
                        e.target.classList.add('is-valid');
                    } else {
                        e.target.classList.remove('is-valid');
                        e.target.classList.add('is-invalid');
                    }
                }
            });
        },
        
        setupMasks: function() {
            // CPF/CNPJ mask
            document.addEventListener('input', function(e) {
                if (e.target.dataset.mask === 'cpf-cnpj') {
                    let value = e.target.value.replace(/\D/g, '');
                    
                    if (value.length <= 11) {
                        // CPF format
                        value = value.replace(/(\d{3})(\d)/, '$1.$2');
                        value = value.replace(/(\d{3})(\d)/, '$1.$2');
                        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                    } else {
                        // CNPJ format
                        value = value.replace(/^(\d{2})(\d)/, '$1.$2');
                        value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                        value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
                        value = value.replace(/(\d{4})(\d)/, '$1-$2');
                    }
                    
                    e.target.value = value;
                }
                
                // Phone mask
                if (e.target.dataset.mask === 'phone') {
                    let value = e.target.value.replace(/\D/g, '');
                    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
                    e.target.value = value;
                }
                
                // CEP mask
                if (e.target.dataset.mask === 'cep') {
                    let value = e.target.value.replace(/\D/g, '');
                    value = value.replace(/^(\d{5})(\d)/, '$1-$2');
                    e.target.value = value;
                }
            });
        },
        
        setupAutosave: function() {
            // Auto-save forms every 30 seconds
            const forms = document.querySelectorAll('[data-autosave="true"]');
            forms.forEach(form => {
                let timeout;
                
                form.addEventListener('input', SISPROCON.utils.debounce(() => {
                    this.autosave(form);
                }, 30000));
            });
        },
        
        autosave: function(form) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            localStorage.setItem(`autosave_${form.id}`, JSON.stringify(data));
            SISPROCON.log('Form autosaved:', form.id);
        },
        
        loadAutosave: function(formId) {
            const saved = localStorage.getItem(`autosave_${formId}`);
            if (saved) {
                const data = JSON.parse(saved);
                const form = document.getElementById(formId);
                
                Object.entries(data).forEach(([name, value]) => {
                    const field = form.querySelector(`[name="${name}"]`);
                    if (field) field.value = value;
                });
                
                SISPROCON.showToast('Rascunho carregado', 'info');
            }
        },
        
        clearAutosave: function(formId) {
            localStorage.removeItem(`autosave_${formId}`);
        }
    };
    
    // Charts component
    SISPROCON.Charts = {
        charts: new Map(),
        
        init: function() {
            // Initialize charts if Chart.js is available
            if (window.Chart) {
                this.setupDefaults();
                this.initializeCharts();
            }
        },
        
        setupDefaults: function() {
            Chart.defaults.font.family = 'Inter, sans-serif';
            Chart.defaults.color = '#6c757d';
            Chart.defaults.plugins.legend.position = 'bottom';
        },
        
        initializeCharts: function() {
            document.querySelectorAll('[data-chart]').forEach(canvas => {
                this.createChart(canvas);
            });
        },
        
        createChart: function(canvas, options = {}) {
            const type = canvas.dataset.chart;
            const dataUrl = canvas.dataset.chartData;
            
            if (dataUrl) {
                fetch(dataUrl)
                    .then(response => response.json())
                    .then(data => {
                        const chart = new Chart(canvas, {
                            type: type,
                            data: data,
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                ...options
                            }
                        });
                        
                        this.charts.set(canvas.id, chart);
                        SISPROCON.log('Chart created:', canvas.id, type);
                    })
                    .catch(error => {
                        SISPROCON.error('Failed to load chart data:', error);
                    });
            }
        },
        
        updateChart: function(chartId, newData) {
            const chart = this.charts.get(chartId);
            if (chart) {
                chart.data = newData;
                chart.update();
            }
        },
        
        destroyChart: function(chartId) {
            const chart = this.charts.get(chartId);
            if (chart) {
                chart.destroy();
                this.charts.delete(chartId);
            }
        }
    };
    
    // File Upload component
    SISPROCON.FileUpload = {
        init: function() {
            document.querySelectorAll('[data-file-upload]').forEach(element => {
                this.setup(element);
            });
        },
        
        setup: function(element) {
            const input = element.querySelector('input[type="file"]');
            const dropArea = element.querySelector('.file-upload-area');
            
            if (!input || !dropArea) return;
            
            // Click to select files
            dropArea.addEventListener('click', () => input.click());
            
            // Drag and drop
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropArea.addEventListener(eventName, this.preventDefaults, false);
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
            });
            
            dropArea.addEventListener('drop', (e) => {
                this.handleFiles(e.dataTransfer.files, element);
            });
            
            input.addEventListener('change', (e) => {
                this.handleFiles(e.target.files, element);
            });
        },
        
        preventDefaults: function(e) {
            e.preventDefault();
            e.stopPropagation();
        },
        
        handleFiles: function(files, container) {
            Array.from(files).forEach(file => {
                if (this.validateFile(file, container)) {
                    this.addFileToList(file, container);
                }
            });
        },
        
        validateFile: function(file, container) {
            const maxSize = parseInt(container.dataset.maxSize) || 10 * 1024 * 1024; // 10MB
            const allowedTypes = container.dataset.allowedTypes?.split(',') || [];
            
            if (file.size > maxSize) {
                SISPROCON.showToast(`Arquivo muito grande: ${file.name}`, 'error');
                return false;
            }
            
            if (allowedTypes.length && !allowedTypes.includes(file.type)) {
                SISPROCON.showToast(`Tipo de arquivo não permitido: ${file.name}`, 'error');
                return false;
            }
            
            return true;
        },
        
        addFileToList: function(file, container) {
            const fileList = container.querySelector('.file-list');
            if (!fileList) return;
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-file file-icon"></i>
                    <div>
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${SISPROCON.utils.formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.file-item').remove()">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            fileList.appendChild(fileItem);
        }
    };
    
    // Search component
    SISPROCON.Search = {
        init: function() {
            this.setupGlobalSearch();
            this.setupQuickSearch();
        },
        
        setupGlobalSearch: function() {
            const globalSearch = document.getElementById('globalSearch');
            if (globalSearch) {
                globalSearch.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.performGlobalSearch(globalSearch.value);
                    }
                });
            }
        },
        
        setupQuickSearch: function() {
            document.querySelectorAll('[data-quick-search]').forEach(input => {
                input.addEventListener('input', SISPROCON.utils.debounce((e) => {
                    this.performQuickSearch(e.target.value, e.target.dataset.quickSearch);
                }, 300));
            });
        },
        
        performGlobalSearch: function(query) {
            if (query.trim()) {
                window.location.href = `/admin/search/?q=${encodeURIComponent(query)}`;
            }
        },
        
        performQuickSearch: function(query, target) {
            const rows = document.querySelectorAll(`${target} tbody tr`);
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                const matches = text.includes(query.toLowerCase());
                row.style.display = matches ? '' : 'none';
            });
        },
        
        focus: function() {
            const globalSearch = document.getElementById('globalSearch');
            if (globalSearch) {
                globalSearch.focus();
                globalSearch.select();
            }
        }
    };
    
    // API helper
    SISPROCON.api = {
        request: function(url, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': SISPROCON.getCookie('csrftoken')
                },
                timeout: SISPROCON.config.apiTimeout
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            
            return fetch(url, mergedOptions)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .catch(error => {
                    SISPROCON.error('API request failed:', error);
                    throw error;
                });
        },
        
        get: function(url, options = {}) {
            return this.request(url, { ...options, method: 'GET' });
        },
        
        post: function(url, data, options = {}) {
            return this.request(url, {
                ...options,
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        
        put: function(url, data, options = {}) {
            return this.request(url, {
                ...options,
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        delete: function(url, options = {}) {
            return this.request(url, { ...options, method: 'DELETE' });
        }
    };
    
    // Storage helper
    SISPROCON.storage = {
        set: function(key, value, expiry = null) {
            const item = {
                value: value,
                expiry: expiry ? Date.now() + expiry : null
            };
            localStorage.setItem(key, JSON.stringify(item));
        },
        
        get: function(key) {
            const item = localStorage.getItem(key);
            if (!item) return null;
            
            const parsed = JSON.parse(item);
            
            if (parsed.expiry && Date.now() > parsed.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            
            return parsed.value;
        },
        
        remove: function(key) {
            localStorage.removeItem(key);
        },
        
        clear: function() {
            localStorage.clear();
        }
    };
    
    // Expose SISPROCON globally
    global.SISPROCON = SISPROCON;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SISPROCON.init());
    } else {
        SISPROCON.init();
    }
    
})(window);