import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  dependencies?: any[];
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiState<T> & {
  execute: () => Promise<void>;
  reset: () => void;
} {
  const { immediate = true, dependencies = [] } = options;
  
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.message || 'An error occurred',
      });
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate, ...dependencies]);

  return {
    ...state,
    execute,
    reset,
  };
}

// Hook for mutations (POST, PUT, DELETE)
export function useApiMutation<T, R>(
  mutationFn: (data: T) => Promise<R>
): {
  mutate: (data: T) => Promise<R | null>;
  loading: boolean;
  error: string | null;
  reset: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: T): Promise<R | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mutationFn(data);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
      return null;
    }
  }, [mutationFn]);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    loading,
    error,
    reset,
  };
}
