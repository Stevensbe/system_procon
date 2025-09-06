// Utilitários para otimização de performance
import { debounce, throttle } from 'lodash';

// Cache para dados frequentemente acessados
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export class PerformanceOptimizer {
  // Cache inteligente com expiração
  static setCache(key, data, duration = CACHE_DURATION) {
    const item = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration
    };
    cache.set(key, item);
  }

  static getCache(key) {
    const item = cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  static clearCache() {
    cache.clear();
  }

  // Debounce para inputs de busca
  static debouncedSearch = debounce((callback, delay = 300) => {
    callback();
  }, delay);

  // Throttle para scroll events
  static throttledScroll = throttle((callback) => {
    callback();
  }, 100);

  // Lazy loading de imagens
  static lazyLoadImage(imgElement, src) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          imgElement.src = src;
          observer.unobserve(imgElement);
        }
      });
    });
    
    observer.observe(imgElement);
  }

  // Preload de recursos críticos
  static preloadResource(url, type = 'fetch') {
    if (type === 'image') {
      const img = new Image();
      img.src = url;
    } else {
      fetch(url, { method: 'HEAD' });
    }
  }

  // Otimização de listas grandes
  static virtualizeList(items, itemHeight, containerHeight) {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(window.scrollY / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount, items.length);
    
    return {
      items: items.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight
    };
  }

  // Compressão de dados
  static compressData(data) {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('Erro ao comprimir dados:', error);
      return data;
    }
  }

  // Decompressão de dados
  static decompressData(compressedData) {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.error('Erro ao descomprimir dados:', error);
      return compressedData;
    }
  }

  // Monitoramento de performance
  static measurePerformance(name, callback) {
    const start = performance.now();
    const result = callback();
    const end = performance.now();
    
    console.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
    return result;
  }

  // Otimização de re-renders
  static memoizeFunction(fn, keyFn) {
    const cache = new Map();
    
    return (...args) => {
      const key = keyFn ? keyFn(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  }
}

// Hook para otimização de performance
export const usePerformanceOptimization = () => {
  const optimizeScroll = (callback) => {
    return PerformanceOptimizer.throttledScroll(callback);
  };

  const optimizeSearch = (callback, delay = 300) => {
    return PerformanceOptimizer.debouncedSearch(callback, delay);
  };

  const memoizeData = (data, key) => {
    return PerformanceOptimizer.memoizeFunction(() => data, () => key);
  };

  return {
    optimizeScroll,
    optimizeSearch,
    memoizeData,
    setCache: PerformanceOptimizer.setCache,
    getCache: PerformanceOptimizer.getCache,
    clearCache: PerformanceOptimizer.clearCache
  };
};

export default PerformanceOptimizer;
