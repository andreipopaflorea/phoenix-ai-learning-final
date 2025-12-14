import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseApiError, getRetryDelay, isRateLimitError, ApiError } from '@/lib/api-error-handler';
import { toast } from '@/hooks/use-toast';

interface UseEdgeFunctionOptions {
  maxRetries?: number;
  baseDelay?: number;
  onRetry?: (attempt: number, delay: number) => void;
}

interface UseEdgeFunctionResult<T> {
  invoke: (functionName: string, body: Record<string, unknown>) => Promise<T | null>;
  loading: boolean;
  error: ApiError | null;
  retryCount: number;
  reset: () => void;
}

export function useEdgeFunctionWithRetry<T = unknown>(
  options: UseEdgeFunctionOptions = {}
): UseEdgeFunctionResult<T> {
  const { maxRetries = 3, baseDelay = 1000, onRetry } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const reset = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const invoke = useCallback(async (
    functionName: string,
    body: Record<string, unknown>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const { data, error: fnError } = await supabase.functions.invoke(functionName, { body });

        if (fnError) {
          throw fnError;
        }

        if (data?.error) {
          const parsedError = parseApiError(data);
          
          if (isRateLimitError(parsedError) && attempt < maxRetries) {
            const delay = getRetryDelay(attempt, baseDelay);
            setRetryCount(attempt + 1);
            onRetry?.(attempt + 1, delay);
            
            toast({
              title: 'Rate limited',
              description: `Retrying in ${Math.ceil(delay / 1000)} seconds... (Attempt ${attempt + 1}/${maxRetries})`,
              variant: 'default',
            });
            
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
            continue;
          }
          
          setError(parsedError);
          setLoading(false);
          
          if (parsedError.type === 'usage_limit') {
            toast({
              title: 'Usage limit reached',
              description: parsedError.message,
              variant: 'destructive',
            });
          }
          
          return null;
        }

        setLoading(false);
        setRetryCount(0);
        return data as T;
        
      } catch (err) {
        const parsedError = parseApiError(err);
        
        if (isRateLimitError(parsedError) && attempt < maxRetries) {
          const delay = getRetryDelay(attempt, baseDelay);
          setRetryCount(attempt + 1);
          onRetry?.(attempt + 1, delay);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        
        setError(parsedError);
        setLoading(false);
        
        toast({
          title: 'Error',
          description: parsedError.message,
          variant: 'destructive',
        });
        
        return null;
      }
    }

    setLoading(false);
    return null;
  }, [maxRetries, baseDelay, onRetry]);

  return { invoke, loading, error, retryCount, reset };
}
