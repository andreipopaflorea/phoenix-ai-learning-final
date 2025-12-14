import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { ApiError } from '@/lib/api-error-handler';

interface RateLimitErrorProps {
  error: ApiError;
  onRetry: () => void;
  retryDelay?: number;
}

export function RateLimitError({ error, onRetry, retryDelay = 5 }: RateLimitErrorProps) {
  const [countdown, setCountdown] = useState(retryDelay);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setCanRetry(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanRetry(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isUsageLimit = error.type === 'usage_limit';

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-border bg-muted/30 text-center space-y-4">
      <div className={`p-3 rounded-full ${isUsageLimit ? 'bg-destructive/10' : 'bg-warning/10'}`}>
        {isUsageLimit ? (
          <AlertCircle className="h-8 w-8 text-destructive" />
        ) : (
          <Clock className="h-8 w-8 text-warning" />
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-lg text-foreground">
          {isUsageLimit ? 'Usage Limit Reached' : 'Rate Limited'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error.message}
        </p>
      </div>

      {!isUsageLimit && (
        <div className="flex items-center gap-2">
          {!canRetry && (
            <span className="text-sm text-muted-foreground">
              Retry available in {countdown}s
            </span>
          )}
          <Button
            onClick={onRetry}
            disabled={!canRetry}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}

      {isUsageLimit && (
        <p className="text-xs text-muted-foreground">
          Please try again later or contact support if this persists.
        </p>
      )}
    </div>
  );
}
