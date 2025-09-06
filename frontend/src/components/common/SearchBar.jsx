import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

// Configuração de busca por módulo
const searchConfig = {
  empresas: {
    path: '/empresas',
    label: 'Empresas',
    searchFields: ['razao_social', 'cnpj', 'nome_fantasia']
  },
  multas: {
    path: '/multas',
    label: 'Multas',
    searchFields: ['numero', 'empresa', 'tipo']
  },
  fiscalizacao: {
    path: '/fiscalizacao',
    label: 'Fiscalização',
    searchFields: ['numero', 'empresa', 'tipo']
  },
  processos: {
    path: '/processos',
    label: 'Processos',
    searchFields: ['numero', 'empresa', 'status']
  },
  cobranca: {
    path: '/cobranca',
    label: 'Cobrança',
    searchFields: ['numero', 'empresa', 'status']
  }
};

const SearchBar = ({ 
  className, 
  placeholder = "Buscar no sistema...",
  onSearch,
  showShortcuts = true,
  ...props 
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Carregar buscas recentes do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Salvar busca recente
  const saveRecentSearch = (searchTerm) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Gerar sugestões baseadas na query
  const generateSuggestions = (searchQuery) => {
    if (!searchQuery.trim()) {
      return [];
    }

    const suggestions = [];
    const queryLower = searchQuery.toLowerCase();

    // Sugestões de módulos
    Object.entries(searchConfig).forEach(([key, config]) => {
      if (config.label.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'module',
          label: `Buscar em ${config.label}`,
          path: config.path,
          icon: '📁'
        });
      }
    });

    // Sugestões de buscas recentes
    recentSearches.forEach(search => {
      if (search.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'recent',
          label: search,
          icon: '🕒'
        });
      }
    });

    return suggestions.slice(0, 8);
  };

  // Atualizar sugestões quando query mudar
  useEffect(() => {
    const newSuggestions = generateSuggestions(query);
    setSuggestions(newSuggestions);
    setSelectedIndex(-1);
  }, [query, recentSearches]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navegação por teclado
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // Executar busca
  const handleSearch = () => {
    if (!query.trim()) return;

    saveRecentSearch(query);
    
    if (onSearch) {
      onSearch(query);
    } else {
      // Busca padrão - navegar para empresas
      navigate(`/empresas?search=${encodeURIComponent(query)}`);
    }

    setIsOpen(false);
    setQuery('');
  };

  // Clicar em sugestão
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'module') {
      navigate(`${suggestion.path}?search=${encodeURIComponent(query)}`);
    } else if (suggestion.type === 'recent') {
      setQuery(suggestion.label);
      // Executar busca com o termo recente
      if (onSearch) {
        onSearch(suggestion.label);
      }
    }

    setIsOpen(false);
  };

  // Atalhos de teclado
  const handleKeyPress = (e) => {
    // Ctrl/Cmd + K para focar na busca
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className={cn("relative", className)} {...props}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown de sugestões */}
      {isOpen && (query || recentSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {suggestions.length > 0 ? (
            <ul>
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      "w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center",
                      selectedIndex === index && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <span className="mr-2">{suggestion.icon}</span>
                    <span className="text-sm">{suggestion.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              Nenhuma sugestão encontrada
            </div>
          )}
        </div>
      )}

      {/* Atalhos de teclado */}
      {showShortcuts && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+K</kbd> para buscar
        </div>
      )}
    </div>
  );
};

export default SearchBar;
