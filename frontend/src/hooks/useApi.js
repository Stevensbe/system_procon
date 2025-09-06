import { useState, useCallback } from 'react';
import { useNotifications } from '../context/NotificationContext';

/**
 * Hook personalizado para gerenciar chamadas de API
 * Inclui loading, erro e notificações automáticas
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showApiError, showSuccess } = useNotifications();

  const execute = useCallback(async (apiCall, options = {}) => {
    const {
      showLoading = true,
      showError = true,
      showSuccess: showSuccessMessage = false,
      successMessage = 'Operação realizada com sucesso!',
      errorMessage = 'Erro na operação',
      onSuccess,
      onError,
      onFinally
    } = options;

    try {
      setError(null);
      if (showLoading) setLoading(true);

      const result = await apiCall();

      if (showSuccessMessage) {
        showSuccess(successMessage);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      return { success: true, data: result };
    } catch (err) {
      setError(err);
      
      if (showError) {
        showApiError(err, errorMessage);
      }

      if (onError) {
        onError(err);
      }

      return { success: false, error: err };
    } finally {
      if (showLoading) setLoading(false);
      if (onFinally) onFinally();
    }
  }, [showApiError, showSuccess]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError
  };
}

/**
 * Hook para operações CRUD básicas
 */
export function useCrud(service, options = {}) {
  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  
  const api = useApi();
  const { showSuccess } = useNotifications();

  const {
    successMessages = {
      create: 'Item criado com sucesso!',
      update: 'Item atualizado com sucesso!',
      delete: 'Item excluído com sucesso!',
      list: 'Dados carregados com sucesso!'
    }
  } = options;

  // Listar itens
  const list = useCallback(async (params = {}) => {
    const result = await api.execute(
      () => service.list({ ...filters, ...params, page, page_size: pageSize }),
      {
        showSuccess: false,
        successMessage: successMessages.list
      }
    );

    if (result.success) {
      setItems(result.data.results || result.data);
      setTotal(result.data.count || result.data.length);
    }

    return result;
  }, [api, service, filters, page, pageSize, successMessages.list]);

  // Buscar item por ID
  const get = useCallback(async (id) => {
    const result = await api.execute(
      () => service.get(id),
      { showSuccess: false }
    );

    if (result.success) {
      setData(result.data);
    }

    return result;
  }, [api, service]);

  // Criar item
  const create = useCallback(async (itemData) => {
    const result = await api.execute(
      () => service.create(itemData),
      {
        successMessage: successMessages.create,
        onSuccess: () => {
          // Recarregar lista após criar
          list();
        }
      }
    );

    return result;
  }, [api, service, successMessages.create, list]);

  // Atualizar item
  const update = useCallback(async (id, itemData) => {
    const result = await api.execute(
      () => service.update(id, itemData),
      {
        successMessage: successMessages.update,
        onSuccess: () => {
          // Atualizar item na lista
          setItems(prev => 
            prev.map(item => 
              item.id === id ? { ...item, ...itemData } : item
            )
          );
          // Atualizar dados do item atual
          if (data?.id === id) {
            setData(prev => ({ ...prev, ...itemData }));
          }
        }
      }
    );

    return result;
  }, [api, service, successMessages.update, data]);

  // Excluir item
  const remove = useCallback(async (id) => {
    const result = await api.execute(
      () => service.delete(id),
      {
        successMessage: successMessages.delete,
        onSuccess: () => {
          // Remover item da lista
          setItems(prev => prev.filter(item => item.id !== id));
          // Limpar dados do item atual se for o mesmo
          if (data?.id === id) {
            setData(null);
          }
        }
      }
    );

    return result;
  }, [api, service, successMessages.delete, data]);

  // Atualizar filtros
  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset para primeira página
  }, []);

  // Atualizar paginação
  const updatePagination = useCallback((newPage, newPageSize) => {
    setPage(newPage);
    if (newPageSize) setPageSize(newPageSize);
  }, []);

  // Limpar dados
  const clear = useCallback(() => {
    setData(null);
    setItems([]);
    setTotal(0);
    setPage(1);
    setFilters({});
  }, []);

  return {
    // Estado
    data,
    items,
    total,
    page,
    pageSize,
    filters,
    loading: api.loading,
    error: api.error,
    
    // Ações
    list,
    get,
    create,
    update,
    remove,
    updateFilters,
    updatePagination,
    clear,
    clearError: api.clearError
  };
}

/**
 * Hook para formulários com validação
 */
export function useForm(initialData = {}, validationSchema = null) {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setFieldValue = useCallback((field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando alterado
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((field, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const validate = useCallback(async () => {
    if (!validationSchema) return { isValid: true, errors: {} };

    try {
      await validationSchema.validate(data, { abortEarly: false });
      setErrors({});
      return { isValid: true, errors: {} };
    } catch (validationError) {
      const newErrors = {};
      validationError.inner.forEach(error => {
        newErrors[error.path] = error.message;
      });
      setErrors(newErrors);
      return { isValid: false, errors: newErrors };
    }
  }, [data, validationSchema]);

  const reset = useCallback((newData = initialData) => {
    setData(newData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  const isValid = Object.keys(errors).length === 0;

  return {
    data,
    errors,
    touched,
    isValid,
    setFieldValue,
    setFieldTouched,
    validate,
    reset
  };
}
