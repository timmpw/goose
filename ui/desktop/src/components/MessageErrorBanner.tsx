import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Copy, RotateCcw } from 'lucide-react';
import { defineMessages, useIntl } from '../i18n';
import type { MessageErrorKind } from '../types/message';
import { type MessageErrorCategory, parseMessageError } from '../utils/messageError';
import { Button } from './ui/button';

const i18n = defineMessages({
  titleRateLimit: {
    id: 'messageErrorBanner.titleRateLimit',
    defaultMessage: 'Rate limit reached',
  },
  titleRequestFailed: {
    id: 'messageErrorBanner.titleRequestFailed',
    defaultMessage: 'The provider rejected the request',
  },
  titleAuthentication: {
    id: 'messageErrorBanner.titleAuthentication',
    defaultMessage: 'Authentication failed',
  },
  titleContextLength: {
    id: 'messageErrorBanner.titleContextLength',
    defaultMessage: 'The conversation is too long for the model',
  },
  titleNetwork: {
    id: 'messageErrorBanner.titleNetwork',
    defaultMessage: 'Network error',
  },
  titleServer: {
    id: 'messageErrorBanner.titleServer',
    defaultMessage: 'Provider server error',
  },
  titleGeneric: {
    id: 'messageErrorBanner.titleGeneric',
    defaultMessage: 'Request failed',
  },
  code: {
    id: 'messageErrorBanner.code',
    defaultMessage: 'Code: {code}',
  },
  requestId: {
    id: 'messageErrorBanner.requestId',
    defaultMessage: 'Request ID: {requestId}',
  },
  retry: {
    id: 'messageErrorBanner.retry',
    defaultMessage: 'Retry request',
  },
  copy: {
    id: 'messageErrorBanner.copy',
    defaultMessage: 'Copy details',
  },
  copied: {
    id: 'messageErrorBanner.copied',
    defaultMessage: 'Copied!',
  },
});

const TITLES: Record<MessageErrorCategory, (typeof i18n)[keyof typeof i18n]> = {
  rateLimit: i18n.titleRateLimit,
  requestFailed: i18n.titleRequestFailed,
  authentication: i18n.titleAuthentication,
  contextLength: i18n.titleContextLength,
  network: i18n.titleNetwork,
  server: i18n.titleServer,
  generic: i18n.titleGeneric,
};

interface MessageErrorBannerProps {
  text: string;
  kind?: MessageErrorKind;
  timestamp?: string;
  onRetry?: () => void | Promise<void>;
}

export default function MessageErrorBanner({
  text,
  kind,
  timestamp,
  onRetry,
}: MessageErrorBannerProps) {
  const intl = useIntl();
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const error = parseMessageError(text, kind);
  const meta = [
    error.code ? intl.formatMessage(i18n.code, { code: error.code }) : null,
    error.requestId ? intl.formatMessage(i18n.requestId, { requestId: error.requestId }) : null,
  ].filter((part): part is string => part !== null);

  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    },
    []
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopied(true);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      console.error('Failed to copy error details:', copyError);
    }
  };

  // A successful retry removes this message; when the retry is refused (chat busy) or
  // fails, the banner stays and the button must become usable again.
  const handleRetry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div
        role="alert"
        data-testid="message-error-banner"
        className="rounded-lg border border-border-danger bg-background-danger/10 p-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-text-danger" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="text-sm font-semibold text-text-danger">
              {intl.formatMessage(TITLES[error.category])}
            </div>
            {error.detail && (
              <div className="whitespace-pre-wrap break-words text-sm text-text-primary select-text">
                {error.detail}
              </div>
            )}
            {meta.length > 0 && (
              <div className="break-all font-mono text-xs text-text-secondary select-text">
                {meta.join(' · ')}
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {onRetry && (
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={handleRetry}
                  disabled={retrying}
                >
                  <RotateCcw />
                  {intl.formatMessage(i18n.retry)}
                </Button>
              )}
              <Button type="button" size="sm" variant="ghost" onClick={handleCopy}>
                {copied ? <Check /> : <Copy />}
                {intl.formatMessage(copied ? i18n.copied : i18n.copy)}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {timestamp && <div className="pt-1 font-mono text-xs text-text-secondary">{timestamp}</div>}
    </div>
  );
}
