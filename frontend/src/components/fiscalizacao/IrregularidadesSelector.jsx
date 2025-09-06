import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  ChevronDown,
  ChevronUp,
  Shield,
  ShoppingCart,
  FileText,
  Info
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Configuração das irregularidades por categoria
const IRREGULARIDADES_CONFIG = {
  supermercado: {
    title: "Irregularidades em Supermercados",
    icon: ShoppingCart,
    color: "emerald",
    items: [
      {
        key: 'comercializar_produtos_vencidos',
        label: 'Comercializar produtos vencidos',
        description: 'Produtos com data de validade expirada',
        baseLegal: 'Art. 18 do CDC'
      },
      {
        key: 'comercializar_embalagem_violada',
        label: 'Comercializar embalagem violada',
        description: 'Produtos com embalagem danificada ou violada',
        baseLegal: 'Art. 18 do CDC'
      },
      {
        key: 'comercializar_lata_amassada',
        label: 'Comercializar lata amassada',
        description: 'Produtos em latas amassadas ou danificadas',
        baseLegal: 'Art. 18 do CDC'
      },
      {
        key: 'comercializar_sem_validade',
        label: 'Comercializar sem validade',
        description: 'Produtos sem data de validade ou ilegível',
        baseLegal: 'Art. 18 do CDC'
      },
      {
        key: 'comercializar_mal_armazenados',
        label: 'Comercializar mal armazenados',
        description: 'Produtos em condições inadequadas de armazenamento',
        baseLegal: 'Art. 18 do CDC'
      },
      {
        key: 'comercializar_descongelados',
        label: 'Comercializar descongelados',
        description: 'Produtos parcialmente ou totalmente descongelados',
        baseLegal: 'Art. 18 do CDC'
      },
      {
        key: 'publicidade_enganosa',
        label: 'Publicidade enganosa',
        description: 'Propaganda que induz o consumidor ao erro',
        baseLegal: 'Art. 37 caput, §1º e §3º; Art. 38 do CDC'
      },
      {
        key: 'obstrucao_monitor',
        label: 'Obstrução do monitor',
        description: 'Monitor de preços obstruído ou não visível',
        baseLegal: 'Lei nº 10.962/2004'
      },
      {
        key: 'afixacao_precos_fora_padrao',
        label: 'Afixação de preços fora do padrão',
        description: 'Preços não afixados conforme padrão legal',
        baseLegal: 'Art. 2º, incisos I e II da Lei nº 10.962/2004'
      },
      {
        key: 'ausencia_afixacao_precos',
        label: 'Ausência de afixação de preços',
        description: 'Produtos sem preços afixados',
        baseLegal: 'Art. 2º, incisos I e II da Lei nº 10.962/2004'
      },
      {
        key: 'afixacao_precos_fracionados_fora_padrao',
        label: 'Preços fracionados fora do padrão',
        description: 'Produtos fracionados sem preços adequados',
        baseLegal: 'Art. 2º-A Lei nº 10.962/2010'
      },
      {
        key: 'ausencia_visibilidade_descontos',
        label: 'Ausência de visibilidade de descontos',
        description: 'Descontos não visíveis ao consumidor',
        baseLegal: 'Art. 5º-A da Lei nº 10.962/2010'
      },
      {
        key: 'ausencia_placas_promocao_vencimento',
        label: 'Ausência de placas de promoção/vencimento',
        description: 'Falta de informação sobre produtos em promoção',
        baseLegal: 'Lei nº 10.962/2004'
      }
    ]
  },
  diversos: {
    title: "Irregularidades Diversas",
    icon: Shield,
    color: "purple",
    items: [
      {
        key: 'publicidade_enganosa',
        label: 'Publicidade enganosa',
        description: 'Propaganda que induz o consumidor ao erro',
        baseLegal: 'Art. 37 caput, §1º e §3º; Art. 38 do CDC'
      },
      {
        key: 'afixacao_precos_fora_padrao',
        label: 'Afixação de preços fora do padrão',
        description: 'Preços não afixados conforme padrão legal',
        baseLegal: 'Art. 2º, incisos I e II da Lei nº 10.962/2004'
      },
      {
        key: 'ausencia_afixacao_precos',
        label: 'Ausência de afixação de preços',
        description: 'Produtos sem preços afixados',
        baseLegal: 'Art. 2º, incisos I e II da Lei nº 10.962/2004'
      },
      {
        key: 'afixacao_precos_eletronico_fora_padrao',
        label: 'Preços no e-commerce fora do padrão',
        description: 'Preços em comércio eletrônico inadequados',
        baseLegal: 'Art. 2º, inciso III da Lei nº 10.962/2004'
      },
      {
        key: 'ausencia_afixacao_precos_eletronico',
        label: 'Ausência de preços no e-commerce',
        description: 'Falta de preços em comércio eletrônico',
        baseLegal: 'Art. 2º, inciso III da Lei Estadual nº 10.962/2004'
      },
      {
        key: 'afixacao_precos_fracionados_fora_padrao',
        label: 'Preços fracionados fora do padrão',
        description: 'Produtos fracionados sem preços adequados',
        baseLegal: 'Art. 2º-A Lei nº 10.962/2010'
      },
      {
        key: 'ausencia_visibilidade_descontos',
        label: 'Ausência de visibilidade de descontos',
        description: 'Descontos não visíveis ao consumidor',
        baseLegal: 'Art. 5º-A da Lei nº 10.962/2010'
      },
      {
        key: 'ausencia_exemplar_cdc',
        label: 'Ausência do exemplar do CDC',
        description: 'CDC não disponível em local visível',
        baseLegal: 'Art. 1º da Lei nº 12.291/2010'
      },
      {
        key: 'substituicao_troco',
        label: 'Substituição do troco por produtos',
        description: 'Troco em dinheiro substituído por produtos',
        baseLegal: 'Art. 39, inciso V, da Lei Federal nº 8.078/1990'
      }
    ]
  }
};

// Componente de item de irregularidade
const IrregularidadeItem = ({ 
  item, 
  checked, 
  onChange, 
  color = "blue",
  showDetails = false 
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      checkbox: 'checked:bg-blue-600 checked:border-blue-600'
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      checkbox: 'checked:bg-emerald-600 checked:border-emerald-600'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      checkbox: 'checked:bg-purple-600 checked:border-purple-600'
    }
  };

  const classes = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative border rounded-lg p-4 transition-all duration-200",
        checked ? classes.bg : "bg-white",
        checked ? classes.border : "border-gray-200",
        checked ? "shadow-md" : "shadow-sm",
        "hover:shadow-lg"
      )}
    >
      <div className="flex items-start space-x-3">
        {/* Checkbox animado */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex-shrink-0 mt-1"
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className={cn(
              "w-5 h-5 rounded border-2 transition-all duration-200",
              "focus:ring-2 focus:ring-offset-2",
              classes.checkbox,
              "focus:ring-blue-500"
            )}
          />
        </motion.div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <h3 className={cn("font-medium text-sm", classes.text)}>
              {item.label}
            </h3>
          </div>

          {/* Descrição sempre visível */}
          <p className="text-sm text-gray-600 mt-1">
            {item.description}
          </p>

          {/* Base Legal sempre visível */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">
                Base Legal:
              </span>
              <span className="text-xs text-gray-600">
                {item.baseLegal}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de seleção */}
      {checked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2"
        >
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            classes.bg
          )}>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Componente principal
const IrregularidadesSelector = ({
  tipo = 'diversos',
  irregularidades = {},
  onChange,
  showDetails = true,
  className,
  disabled = false
}) => {
  const config = IRREGULARIDADES_CONFIG[tipo];
  
  if (!config) {
    console.error(`Tipo de irregularidade não encontrado: ${tipo}`);
    return null;
  }

  const handleIrregularidadeChange = (key, checked) => {
    const newIrregularidades = {
      ...irregularidades,
      [key]: checked
    };
    
    // Se marcou alguma irregularidade, desmarca "nada consta"
    if (checked && irregularidades.nada_consta) {
      newIrregularidades.nada_consta = false;
    }
    
    onChange(newIrregularidades);
  };

  const handleNadaConstaChange = (checked) => {
    const newIrregularidades = {
      ...irregularidades,
      nada_consta: checked
    };
    
    // Se marcou "nada consta", desmarca todas as irregularidades
    if (checked) {
      config.items.forEach(item => {
        newIrregularidades[item.key] = false;
      });
    }
    
    onChange(newIrregularidades);
  };

  const irregularidadesSelecionadas = config.items.filter(
    item => irregularidades[item.key]
  ).length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-lg",
            config.color === 'emerald' ? 'bg-emerald-100' : 'bg-purple-100'
          )}>
            <config.icon className={cn(
              "w-6 h-6",
              config.color === 'emerald' ? 'text-emerald-600' : 'text-purple-600'
            )} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {config.title}
            </h3>
            <p className="text-sm text-gray-600">
              Selecione as irregularidades constatadas
            </p>
          </div>
        </div>
        
        {/* Contador */}
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {irregularidadesSelecionadas} selecionada{irregularidadesSelecionadas !== 1 ? 's' : ''}
            </div>
            <div className="text-xs text-gray-500">
              de {config.items.length} irregularidades
            </div>
          </div>
        </div>
      </div>

      {/* Opção "Nada Consta" */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg"
      >
        <input
          type="checkbox"
          checked={irregularidades.nada_consta || false}
          onChange={(e) => handleNadaConstaChange(e.target.checked)}
          disabled={disabled}
          className="w-5 h-5 rounded border-2 border-green-300 checked:bg-green-600 checked:border-green-600 focus:ring-2 focus:ring-green-500"
        />
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-medium text-green-800">
            Nada Consta
          </span>
        </div>
        <span className="text-sm text-green-700">
          Nenhuma irregularidade foi constatada
        </span>
      </motion.div>

      {/* Lista de irregularidades */}
      <div className="space-y-3">
        {config.items.map((item, index) => (
          <IrregularidadeItem
            key={item.key}
            item={item}
            checked={irregularidades[item.key] || false}
            onChange={(e) => handleIrregularidadeChange(item.key, e.target.checked)}
            color={config.color}
            showDetails={showDetails}
          />
        ))}
      </div>

      {/* Resumo */}
      {irregularidadesSelecionadas > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">
              Resumo das Irregularidades
            </span>
          </div>
          <div className="mt-2 space-y-1">
            {irregularidadesSelecionadas === 1 ? (
              <p className="text-sm text-blue-700">
                Foi constatada <strong>1 irregularidade</strong> no estabelecimento.
              </p>
            ) : (
              <p className="text-sm text-blue-700">
                Foram constatadas <strong>{irregularidadesSelecionadas} irregularidades</strong> no estabelecimento.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default IrregularidadesSelector;
