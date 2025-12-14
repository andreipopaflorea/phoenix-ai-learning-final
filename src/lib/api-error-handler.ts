export interface ApiError {
  type: 'rate_limit' | 'usage_limit' | 'generic';
  message: string;
  retryAfter?: number;
  isRetryable: boolean;
}

export function parseApiError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'error' in error) {
    const errorObj = error as { error: string };
    
    if (errorObj.error?.includes('rate limit') || errorObj.error?.includes('429')) {
      return {
        type: 'rate_limit',
        message: 'Too many requests. Please wait a moment before trying again.',
        retryAfter: 5,
        isRetryable: true,
      };
    }
    
    if (errorObj.error?.includes('usage limit') || errorObj.error?.includes('credits exhausted') || errorObj.error?.includes('402')) {
      return {
        type: 'usage_limit',
        message: 'AI usage limit reached. Please try again later or contact support.',
        isRetryable: false,
      };
    }
    
    return {
      type: 'generic',
      message: errorObj.error || 'An unexpected error occurred.',
      isRetryable: false,
    };
  }
  
  return {
    type: 'generic',
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    isRetryable: false,
  };
}

export function isRateLimitError(error: ApiError): boolean {
  return error.type === 'rate_limit';
}

export function isUsageLimitError(error: ApiError): boolean {
  return error.type === 'usage_limit';
}

export function getRetryDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 8000);
}

export function getUserFriendlyMessage(error: ApiError): string {
  switch (error.type) {
    case 'rate_limit':
      return 'Taking a short break to avoid overloading the system. Retrying shortly...';
    case 'usage_limit':
      return 'You\'ve reached the AI usage limit. Please try again later.';
    default:
      return error.message;
  }
}
