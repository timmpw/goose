import { type ReactNode, useEffect, useState } from 'react';
import { RequestError } from '@agentclientprotocol/sdk';
import { getAcpClient } from '../../acp/acpConnection';
import {
  TENROUTER_PROVIDER_ID,
  acpGetProviderDetails,
  acpSaveProviderConfig,
  normalizeTenRouterModelId,
} from '../../acp/providers';
import { errorMessage } from '../../utils/conversionUtils';
import { TenRouterMark } from '../icons';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SecureStorageNotice } from '../settings/providers/modal/subcomponents/SecureStorageNotice';
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { defineMessages, useIntl } from '../../i18n';

export { TENROUTER_PROVIDER_ID };
const TENROUTER_API_KEY_CONFIG = 'TENROUTER_API_KEY';

// Kept in sync with AUTH_REQUIRED_CODE in src/acp/errors.ts.
const AUTH_REQUIRED_CODE = -32000;

const i18n = defineMessages({
  title: {
    id: 'tenRouterKeyForm.title',
    defaultMessage: 'Connect to 10router',
  },
  description: {
    id: 'tenRouterKeyForm.description',
    defaultMessage:
      'Enter your 10router API key (it starts with 10r_). The model list is fetched automatically from <link>10r.sokolov.io</link>.',
  },
  keyLabel: {
    id: 'tenRouterKeyForm.keyLabel',
    defaultMessage: 'API key',
  },
  keyPlaceholder: {
    id: 'tenRouterKeyForm.keyPlaceholder',
    defaultMessage: '10r_…',
  },
  connect: {
    id: 'tenRouterKeyForm.connect',
    defaultMessage: 'Connect',
  },
  connecting: {
    id: 'tenRouterKeyForm.connecting',
    defaultMessage: 'Connecting...',
  },
  requiredError: {
    id: 'tenRouterKeyForm.requiredError',
    defaultMessage: 'Please enter your API key',
  },
  savedKeyHint: {
    id: 'tenRouterKeyForm.savedKeyHint',
    defaultMessage:
      'A key is already saved — press Connect to continue with it, or paste a new one.',
  },
  invalidKey: {
    id: 'tenRouterKeyForm.invalidKey',
    defaultMessage: 'The key was rejected by 10router. Check the key and try again.',
  },
  fetchModelsError: {
    id: 'tenRouterKeyForm.fetchModelsError',
    defaultMessage: 'Could not fetch the model list from 10router: {detail}',
  },
  noModels: {
    id: 'tenRouterKeyForm.noModels',
    defaultMessage: '10router returned no models for this key.',
  },
});

function versionTuple(id: string): number[] {
  const match = id.match(/\d+(?:-\d+)*/);
  return match ? match[0].split('-').map(Number) : [];
}

function compareModels(a: string, b: string): number {
  const ta = versionTuple(a);
  const tb = versionTuple(b);
  for (let i = 0; i < Math.max(ta.length, tb.length); i += 1) {
    const diff = (ta[i] ?? 0) - (tb[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return a.localeCompare(b);
}

/**
 * Pick the model goose starts on when 10router has been connected: the newest
 * plain sonnet (the balanced default for an agent), then any full-size GLM
 * model, then whatever came first. Long-context `[1m]` ids are skipped so the
 * default stays on the standard context window.
 */
function pickDefaultModel(models: string[]): string | null {
  if (models.length === 0) {
    return null;
  }
  const plain = models.filter((model) => !model.includes('['));
  const pool = plain.length > 0 ? plain : models;

  const sonnets = pool.filter((model) => /^claude-sonnet-\d/.test(model));
  if (sonnets.length > 0) {
    return [...sonnets].sort(compareModels).pop() ?? null;
  }
  const glm = pool.filter((model) => /^glm-[\d.]+$/.test(model));
  if (glm.length > 0) {
    return [...glm].sort(compareModels).pop() ?? null;
  }
  const glmFull = pool.filter((model) => model.startsWith('glm-') && !model.includes('flash'));
  if (glmFull.length > 0) {
    return [...glmFull].sort(compareModels).pop() ?? null;
  }
  return pool[0];
}

interface TenRouterKeyFormProps {
  /** Called with the auto-picked model once the key is validated and defaults saved upstream. */
  onConnected: (modelId: string | null) => void | Promise<void>;
}

export default function TenRouterKeyForm({ onConnected }: TenRouterKeyFormProps) {
  const intl = useIntl();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A saved key (e.g. defaults were cleared but the secret remains) lets the
  // user continue without re-entering it: submitting with an empty input
  // reuses the stored key.
  const [hasSavedKey, setHasSavedKey] = useState(false);

  useEffect(() => {
    acpGetProviderDetails(TENROUTER_PROVIDER_ID)
      .then((details) => setHasSavedKey(details.is_configured))
      .catch(() => setHasSavedKey(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = apiKey.trim();
    if (!trimmedKey && !hasSavedKey) {
      setError(intl.formatMessage(i18n.requiredError));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (trimmedKey) {
        await acpSaveProviderConfig(TENROUTER_PROVIDER_ID, [
          { key: TENROUTER_API_KEY_CONFIG, value: trimmedKey },
        ]);
      }

      // Live check: hits GET https://10r.sokolov.io/v1/models with the saved
      // key, so a rejected key surfaces here instead of in the first chat.
      let models: string[] = [];
      try {
        const client = await getAcpClient();
        const response = await client.goose.providersSupportedModelsList_unstable({
          providerId: TENROUTER_PROVIDER_ID,
        });
        models = response.models.map((id) =>
          normalizeTenRouterModelId(TENROUTER_PROVIDER_ID, id)
        );
      } catch (err) {
        if (err instanceof RequestError && err.code === AUTH_REQUIRED_CODE) {
          throw new Error(intl.formatMessage(i18n.invalidKey), { cause: err });
        }
        throw new Error(intl.formatMessage(i18n.fetchModelsError, { detail: errorMessage(err) }), {
          cause: err,
        });
      }

      const model = pickDefaultModel(models);
      if (!model) {
        const details = await acpGetProviderDetails(TENROUTER_PROVIDER_ID);
        const fallback = details.metadata.default_model;
        if (!fallback) {
          throw new Error(intl.formatMessage(i18n.noModels));
        }
        await onConnected(fallback);
        return;
      }
      await onConnected(model);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="hero-gradient h-screen w-full overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className="flex flex-col items-center p-4 pt-[12vh] pb-8">
          <div className="surface-card max-w-md w-full mx-auto p-8">
            <div className="mb-6">
              <TenRouterMark className="h-10 w-auto" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              {intl.formatMessage(i18n.title)}
            </h1>
            <p className="text-text-secondary text-base sm:text-lg mb-8">
              {intl.formatMessage(i18n.description, {
                link: (chunks: ReactNode) => (
                  <a
                    href="https://10r.sokolov.io"
                    onClick={(e) => {
                      e.preventDefault();
                      window.electron.openExternal('https://10r.sokolov.io');
                    }}
                    className="underline underline-offset-2 hover:text-text-primary"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>

            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {intl.formatMessage(i18n.keyLabel)}
                {!hasSavedKey && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary pointer-events-none" />
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={intl.formatMessage(i18n.keyPlaceholder)}
                  autoComplete="off"
                  autoFocus
                  disabled={isSubmitting}
                  className={`w-full h-14 pl-11 pr-12 rounded-lg shadow-none ${
                    error ? 'border-2 border-red-500' : 'border border-border-primary'
                  } bg-background-primary text-lg placeholder:text-text-secondary text-text-primary`}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  tabIndex={-1}
                >
                  {showKey ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>

              <SecureStorageNotice className="mt-2" />

              {hasSavedKey && (
                <p className="mt-2 text-sm text-text-secondary">
                  {intl.formatMessage(i18n.savedKeyHint)}
                </p>
              )}

              {error && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800 text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6">
                <Button type="submit" disabled={isSubmitting} className="w-full h-11">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {intl.formatMessage(i18n.connecting)}
                    </>
                  ) : (
                    intl.formatMessage(i18n.connect)
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
