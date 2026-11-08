import { useEffect, useRef, useState } from 'react';
import { useConfig } from '../ConfigContext';
import { useModelAndProvider } from '../ModelAndProviderContext';
import { acpReadDefaults, acpSaveDefaults } from '../../acp/providers';
import { TenRouterMark } from '../icons';
import { Button } from '../ui/button';
import TenRouterKeyForm, { TENROUTER_PROVIDER_ID } from './TenRouterKeyForm';
import {
  trackOnboardingStarted,
  trackOnboardingCompleted,
  trackOnboardingProviderSelected,
  setTelemetryEnabled as setAnalyticsTelemetryEnabled,
} from '../../utils/analytics';
import { defineMessages, useIntl } from '../../i18n';

const i18n = defineMessages({
  checkProviderErrorTitle: {
    id: 'onboardingGuard.checkProviderErrorTitle',
    defaultMessage: 'Unable to connect to 10Router server',
  },
  checkProviderErrorDescription: {
    id: 'onboardingGuard.checkProviderErrorDescription',
    defaultMessage: 'The server may be starting up or temporarily unavailable.',
  },
  retry: {
    id: 'onboardingGuard.retry',
    defaultMessage: 'Retry',
  },
});

const TELEMETRY_CONFIG_KEY = 'GOOSE_TELEMETRY_ENABLED';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const intl = useIntl();
  const { upsert } = useConfig();
  const { getFallbackModelAndProvider, refreshCurrentModelAndProvider } = useModelAndProvider();

  const [isCheckingProvider, setIsCheckingProvider] = useState(true);
  const [hasProvider, setHasProvider] = useState(false);
  const [checkProviderError, setCheckProviderError] = useState(false);
  const hasTrackedOnboardingStart = useRef(false);

  const checkProvider = async (retries = 3, delay = 1000) => {
    setIsCheckingProvider(true);
    setCheckProviderError(false);
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { providerId: provider } = await acpReadDefaults();
        if (provider?.trim()) {
          setHasProvider(true);
          setIsCheckingProvider(false);
          return;
        }

        const fallback = await getFallbackModelAndProvider();
        if (fallback.provider?.trim() && fallback.model?.trim()) {
          const { providerId: configuredProvider, modelId: configuredModel } =
            await acpReadDefaults();
          if (configuredProvider?.trim() && configuredModel?.trim()) {
            await refreshCurrentModelAndProvider();
            setHasProvider(true);
            setIsCheckingProvider(false);
            return;
          }
        }

        setHasProvider(false);
        setIsCheckingProvider(false);
        return;
      } catch (error) {
        console.error(`Error checking provider (attempt ${attempt + 1}/${retries + 1}):`, error);
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    setCheckProviderError(true);
    setIsCheckingProvider(false);
  };

  useEffect(() => {
    checkProvider();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      !isCheckingProvider &&
      !hasProvider &&
      !checkProviderError &&
      !hasTrackedOnboardingStart.current
    ) {
      trackOnboardingStarted();
      hasTrackedOnboardingStart.current = true;
    }
  }, [isCheckingProvider, hasProvider, checkProviderError]);

  // The 10router first-run window validates the key and picks a model on its
  // own; when it reports back, save the defaults and drop straight into chat.
  // This build is a dedicated 10router client, so there is no provider picker
  // and no success screen, and telemetry is turned off: the app talks to the
  // user's own 10router gateway, not Block's backend.
  const handleTenRouterConnected = async (modelId: string | null) => {
    trackOnboardingProviderSelected({ provider: TENROUTER_PROVIDER_ID });
    await acpSaveDefaults(TENROUTER_PROVIDER_ID, modelId);
    try {
      await upsert(TELEMETRY_CONFIG_KEY, false, false);
    } catch (error) {
      console.error('Failed to save telemetry preference:', error);
    }
    setAnalyticsTelemetryEnabled(false);
    await refreshCurrentModelAndProvider();
    trackOnboardingCompleted(TENROUTER_PROVIDER_ID, modelId ?? undefined);
    setHasProvider(true);
  };

  if (isCheckingProvider) {
    return null;
  }

  if (checkProviderError) {
    return (
      <div className="hero-gradient h-screen w-full flex flex-col items-center justify-center">
        <div className="surface-card text-center max-w-md p-8">
          <div className="mb-4">
            <TenRouterMark className="h-9 w-auto mx-auto" />
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-3">
            {intl.formatMessage(i18n.checkProviderErrorTitle)}
          </h1>
          <p className="text-text-secondary mb-6">
            {intl.formatMessage(i18n.checkProviderErrorDescription)}
          </p>
          <Button onClick={() => checkProvider()}>{intl.formatMessage(i18n.retry)}</Button>
        </div>
      </div>
    );
  }

  if (hasProvider) {
    return <>{children}</>;
  }

  return <TenRouterKeyForm onConnected={handleTenRouterConnected} />;
}
