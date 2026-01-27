import { AlertTriangle, RefreshCw, HelpCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { handleError } from '@/lib/errorHandler';

export interface ErrorContext {
  studioId?: string;
  workflowId?: string;
  phase?: string;
  operation?: string;
}

interface AGErrorPresenterProps {
  error: Error | string;
  context?: ErrorContext;
  onRetry?: () => void;
  onCancel?: () => void;
  retryable?: boolean;
  variant?: 'alert' | 'card' | 'inline';
}

// Studio-specific error messages and recovery suggestions
const getContextualMessage = (errorInfo: any, context?: ErrorContext): { title: string; message: string; action: string } => {
  const studioMessages: Record<string, { title: string; message: string; action: string }> = {
    'ideation-lab': {
      title: 'Idea Validation Failed',
      message: 'We encountered an issue validating your startup idea. This could be due to insufficient market data or network connectivity.',
      action: 'Try simplifying your idea description or check your industry selection.'
    },
    'engineering-forge': {
      title: 'Code Generation Failed',
      message: 'The AI agents couldn\'t generate code for your requirements. This might be due to complex specifications or technical constraints.',
      action: 'Try breaking down your requirements into smaller, simpler components.'
    },
    'market-intelligence': {
      title: 'Market Research Failed',
      message: 'We couldn\'t gather competitor intelligence or market trends. This could be due to limited data availability.',
      action: 'Try adjusting your industry or target market to get better results.'
    },
    'product-blueprint': {
      title: 'PRD Generation Failed',
      message: 'Product requirements generation encountered an error. This might be due to incomplete specifications.',
      action: 'Ensure you\'ve provided clear product vision and target features.'
    }
  };

  if (context?.studioId && studioMessages[context.studioId]) {
    return studioMessages[context.studioId];
  }

  // Fallback messages based on error type
  const fallbackMessages: Record<string, { title: string; message: string; action: string }> = {
    'NETWORK_ERROR': {
      title: 'Connection Lost',
      message: 'Unable to reach our AI agents. Please check your internet connection.',
      action: 'Retry in a few moments or refresh the page.'
    },
    'TIMEOUT_ERROR': {
      title: 'Request Timed Out',
      message: 'The operation took too long to complete. Our agents might be processing a complex workflow.',
      action: 'Retry with simpler requirements or try again later.'
    },
    'AUTH_ERROR': {
      title: 'Authentication Required',
      message: 'Your session may have expired. Please log in again to continue.',
      action: 'Refresh the page and log in again.'
    },
    'RATE_LIMIT_ERROR': {
      title: 'Rate Limit Exceeded',
      message: 'You\'ve made too many requests in a short time. Please wait before trying again.',
      action: 'Wait a minute and retry your request.'
    },
    'SERVER_ERROR': {
      title: 'Server Error',
      message: 'Our AI orchestration system encountered an internal error. Our team has been notified.',
      action: 'Retry in a few moments or contact support if the issue persists.'
    }
  };

  return fallbackMessages[errorInfo.code] || {
    title: 'Something Went Wrong',
    message: 'We encountered an unexpected error. Don\'t worry, your data is safe.',
    action: 'Please retry the operation or contact support if the problem continues.'
  };
};

export default function AGErrorPresenter({
  error,
  context,
  onRetry,
  onCancel,
  retryable = true,
  variant = 'card'
}: AGErrorPresenterProps) {
  const errorInfo = handleError(error, context?.studioId || context?.workflowId);
  const { title, message, action } = getContextualMessage(errorInfo, context);

  const content = (
    <>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {errorInfo.severity === 'critical' || errorInfo.severity === 'high' ? (
            <XCircle className="w-5 h-5 text-red-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{message}</p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Recovery Suggestion:</strong> {action}
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                Developer Details
              </summary>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                {JSON.stringify({ errorInfo, context }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        {retryable && onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            className="flex items-center gap-2"
            data-testid="button-error-retry"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        )}
        
        <Button
          onClick={() => window.location.href = '/help'}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          data-testid="button-error-help"
        >
          <HelpCircle className="w-4 h-4" />
          Get Help
        </Button>

        {onCancel && (
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            data-testid="button-error-cancel"
          >
            Cancel
          </Button>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Error ID: {errorInfo.timestamp.getTime().toString(36).toUpperCase()}
      </div>
    </>
  );

  if (variant === 'alert') {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="space-y-2">
          {content}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        {content}
      </div>
    );
  }

  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardContent className="pt-6">
        {content}
      </CardContent>
    </Card>
  );
}
