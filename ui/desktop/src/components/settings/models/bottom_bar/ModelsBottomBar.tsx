import { Bot, Check, ChevronDown, LoaderCircle, Settings } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useModelAndProvider } from '../../../ModelAndProviderContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../ui/dropdown-menu';
import Model, { getProviderMetadata } from '../modelInterface';
import {
  acpListProviderModels,
  acpReadThinkingEffort,
  acpSaveThinkingEffort,
  acpSetSessionProviderModel,
} from '../../../../acp/providers';
import type { ThinkingEffort } from '../../../../types/providers';

import { ModelSettingsPanel } from '../../localInference/ModelSettingsPanel';
import { ScrollArea } from '../../../ui/scroll-area';
import { defineMessages, useIntl } from '../../../../i18n';
import { addToRecentModels } from '../../../../utils/recentModels';
import { trackModelChanged } from '../../../../utils/analytics';
import { compareModelIds, describeModel, type ModelTier } from '../../../../utils/modelDisplay';
import { EffortSlider } from './EffortSlider';

const i18n = defineMessages({
  selectModel: {
    id: 'modelsBottomBar.selectModel',
    defaultMessage: 'Select Model',
  },
  loadingModels: {
    id: 'modelsBottomBar.loadingModels',
    defaultMessage: 'Loading models…',
  },
  models: {
    id: 'modelsBottomBar.models',
    defaultMessage: 'Models',
  },
  effort: {
    id: 'modelsBottomBar.effort',
    defaultMessage: 'Effort',
  },
  effortOff: {
    id: 'modelsBottomBar.effortOff',
    defaultMessage: 'Off',
  },
  effortLow: {
    id: 'modelsBottomBar.effortLow',
    defaultMessage: 'Low',
  },
  effortMedium: {
    id: 'modelsBottomBar.effortMedium',
    defaultMessage: 'Medium',
  },
  effortHigh: {
    id: 'modelsBottomBar.effortHigh',
    defaultMessage: 'High',
  },
  effortMax: {
    id: 'modelsBottomBar.effortMax',
    defaultMessage: 'Max',
  },
  tierCapable: {
    id: 'modelsBottomBar.tierCapable',
    defaultMessage: 'Most capable for ambitious work',
  },
  tierEfficient: {
    id: 'modelsBottomBar.tierEfficient',
    defaultMessage: 'Most efficient for everyday tasks',
  },
  tierFast: {
    id: 'modelsBottomBar.tierFast',
    defaultMessage: 'Fastest for quick answers',
  },
  tierCoding: {
    id: 'modelsBottomBar.tierCoding',
    defaultMessage: 'Tuned for agentic coding',
  },
  longContext: {
    id: 'modelsBottomBar.longContext',
    defaultMessage: '1M context window',
  },
  failedToLoadModels: {
    id: 'modelsBottomBar.failedToLoadModels',
    defaultMessage: 'Could not load models',
  },
  localModelSettings: {
    id: 'modelsBottomBar.localModelSettings',
    defaultMessage: 'Local Model Settings',
  },
  localModelSettingsTitle: {
    id: 'modelsBottomBar.localModelSettingsTitle',
    defaultMessage: 'Local Model Settings — {modelName}',
  },
});

const EFFORT_VALUES: ThinkingEffort[] = ['off', 'low', 'medium', 'high', 'max'];

const EFFORT_MESSAGES = {
  off: i18n.effortOff,
  low: i18n.effortLow,
  medium: i18n.effortMedium,
  high: i18n.effortHigh,
  max: i18n.effortMax,
} as const satisfies Record<ThinkingEffort, (typeof i18n)[keyof typeof i18n]>;

const TIER_MESSAGES = {
  capable: i18n.tierCapable,
  efficient: i18n.tierEfficient,
  fast: i18n.tierFast,
  coding: i18n.tierCoding,
} as const satisfies Record<ModelTier, (typeof i18n)[keyof typeof i18n]>;

// Persisting effort talks to the backend; while the slider is being dragged
// only the last position is saved.
const EFFORT_SAVE_DELAY_MS = 250;

interface ModelsBottomBarProps {
  sessionId: string | null;
  dropdownRef: React.RefObject<HTMLDivElement>;
  sessionModel?: string | null;
  sessionProvider?: string | null;
  onModelChanged: (override: { model: string; provider: string }) => void;
  sessionLoaded?: boolean;
}

export default function ModelsBottomBar({
  sessionId,
  dropdownRef,
  sessionModel,
  sessionProvider,
  onModelChanged,
  sessionLoaded,
}: ModelsBottomBarProps) {
  // ChatInput owns the override state and passes effective model/provider as sessionModel/sessionProvider.
  // Fall back to config defaults when no session-specific model is available.
  const {
    currentModel: configModel,
    currentProvider: configProvider,
    changeModel,
  } = useModelAndProvider();
  const currentModel = sessionModel ?? configModel;
  const currentProvider = sessionProvider ?? configProvider;

  const intl = useIntl();
  const [displayProvider, setDisplayProvider] = useState<string | null>(null);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isLocalModelSettingsOpen, setIsLocalModelSettingsOpen] = useState(false);
  const [providerDefaultModel, setProviderDefaultModel] = useState<string | null>(null);
  const [models, setModels] = useState<Model[] | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [failedToLoadModels, setFailedToLoadModels] = useState(false);
  const [effort, setEffort] = useState<ThinkingEffort | null>(null);
  const pendingLocalSettingsRef = useRef(false);
  const effortSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modelsCacheRef = useRef<Map<string, Model[]>>(new Map());

  // Show a visible loading placeholder while session metadata is still being fetched,
  // rather than flashing the config default or leaving the footer blank.
  const isModelLoading = Boolean(sessionId && !sessionLoaded);
  const displayModel = currentModel || providerDefaultModel;

  useEffect(() => {
    if (!currentProvider) return;
    getProviderMetadata(currentProvider)
      .then((metadata) => {
        setDisplayProvider(metadata.display_name || currentProvider);
      })
      .catch(() => {
        setDisplayProvider(currentProvider);
      });
  }, [currentProvider, currentModel]);

  // Fetch provider default model when provider changes and no current model
  useEffect(() => {
    if (currentProvider && !currentModel) {
      (async () => {
        try {
          const metadata = await getProviderMetadata(currentProvider);
          setProviderDefaultModel(metadata.default_model);
        } catch (error) {
          console.error('Failed to get provider default model:', error);
          setProviderDefaultModel(null);
        }
      })();
    } else if (currentModel) {
      setProviderDefaultModel(null);
    }
  }, [currentProvider, currentModel]);

  useEffect(() => {
    acpReadThinkingEffort()
      .then((saved) => setEffort(saved))
      .catch(() => {});
  }, []);

  // Refresh the model list and saved effort every time the menu opens so
  // dynamically discovered models show up without restarting the app.
  useEffect(() => {
    if (!isModelMenuOpen || !currentProvider) return;
    let cancelled = false;

    const cached = modelsCacheRef.current.get(currentProvider);
    if (cached) {
      setModels(cached);
      setFailedToLoadModels(false);
    } else {
      setModels(null);
      setFailedToLoadModels(false);
    }
    setIsLoadingModels(true);
    acpReadThinkingEffort()
      .then((saved) => {
        if (!cancelled && saved) setEffort(saved);
      })
      .catch(() => {});
    acpListProviderModels(currentProvider)
      .then((providerModels) => {
        if (cancelled) return;
        const sorted = [...providerModels].sort((a, b) => compareModelIds(a.id, b.id));
        const list: Model[] = sorted.map((m) => ({
          name: m.id,
          provider: currentProvider,
          context_limit: m.contextLimit ?? undefined,
          reasoning: m.reasoning ?? undefined,
        }));
        modelsCacheRef.current.set(currentProvider, list);
        setModels(list);
        setFailedToLoadModels(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to list provider models:', error);
        setFailedToLoadModels(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingModels(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isModelMenuOpen, currentProvider]);

  const currentModelInfo = models?.find((m) => m.name === currentModel) ?? null;
  // Effort only applies to reasoning models; unknown metadata (null) is treated as supported.
  const effortSupported = currentModelInfo?.reasoning !== false;

  const handleModelClick = async (model: Model) => {
    if (!currentProvider) return;
    const previousModel = currentModel;
    const modelArg: Model =
      model.reasoning !== false && effort != null
        ? { ...model, request_params: { thinking_effort: effort } }
        : { name: model.name, provider: currentProvider };

    const success = await changeModel(sessionId, modelArg);
    if (!success) return;

    trackModelChanged(currentProvider, model.name);
    if (previousModel) {
      try {
        const stored = (await window.electron.getSetting('recentModels')) ?? [];
        await window.electron.setSetting(
          'recentModels',
          addToRecentModels(stored, currentProvider, previousModel)
        );
      } catch (error) {
        console.warn('Failed to update recent models:', error);
      }
    }
    onModelChanged({ model: model.name, provider: currentProvider });
  };

  const applyEffort = async (value: ThinkingEffort) => {
    if (!currentProvider) return;
    acpSaveThinkingEffort(value).catch(console.warn);
    if (sessionId && currentModel && effortSupported) {
      try {
        await acpSetSessionProviderModel(sessionId, currentProvider, currentModel, value);
      } catch (error) {
        console.error('Failed to apply thinking effort to session:', error);
      }
    }
  };

  const handleEffortChange = (value: ThinkingEffort) => {
    if (!currentProvider) return;
    setEffort(value);
    if (effortSaveTimerRef.current) clearTimeout(effortSaveTimerRef.current);
    effortSaveTimerRef.current = setTimeout(() => {
      effortSaveTimerRef.current = null;
      void applyEffort(value);
    }, EFFORT_SAVE_DELAY_MS);
  };

  useEffect(
    () => () => {
      if (effortSaveTimerRef.current) clearTimeout(effortSaveTimerRef.current);
    },
    []
  );

  const modelSubtitle = (id: string) => {
    const { tier, longContext } = describeModel(id);
    if (longContext) return intl.formatMessage(i18n.longContext);
    return tier ? intl.formatMessage(TIER_MESSAGES[tier]) : null;
  };

  const handleModelMenuCloseAutoFocus = (event: Event) => {
    if (!pendingLocalSettingsRef.current) return;

    pendingLocalSettingsRef.current = false;
    setIsLocalModelSettingsOpen(true);
    // The dropdown would refocus its trigger; the settings overlay handles focus itself.
    event.preventDefault();
  };

  const triggerLabel = isModelLoading
    ? intl.formatMessage(i18n.loadingModels)
    : displayModel
      ? describeModel(displayModel).label
      : intl.formatMessage(i18n.selectModel);

  const effortLabel =
    effort != null && effortSupported ? intl.formatMessage(EFFORT_MESSAGES[effort]) : null;

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <DropdownMenu open={isModelMenuOpen} onOpenChange={setIsModelMenuOpen}>
        <DropdownMenuTrigger className="flex items-center hover:cursor-pointer max-w-[180px] md:max-w-[200px] lg:max-w-[380px] min-w-0 text-text-primary/70 hover:text-text-primary transition-colors">
          <div className="flex items-center gap-1 truncate max-w-[130px] md:max-w-[200px] lg:max-w-[360px] min-w-0">
            <Bot className="h-4 w-4 shrink-0" />
            {isModelLoading ? (
              <span
                data-testid="model-loading-state"
                className="inline-flex items-center gap-1 truncate text-xs"
              >
                <LoaderCircle className="h-3 w-3 animate-spin shrink-0" />
                <span className="truncate">{triggerLabel}</span>
              </span>
            ) : (
              <>
                <span className="truncate text-xs">{triggerLabel}</span>
                {effortLabel && (
                  <span className="text-xs text-text-secondary whitespace-nowrap">
                    {effortLabel}
                  </span>
                )}
              </>
            )}
            <ChevronDown className="h-3 w-3 shrink-0 text-text-secondary" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="center"
          className="flex w-72 flex-col overflow-hidden text-sm"
          onCloseAutoFocus={handleModelMenuCloseAutoFocus}
        >
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="text-xs text-text-primary">{intl.formatMessage(i18n.models)}</span>
            {!isModelLoading && displayProvider && (
              <span className="text-xs text-text-secondary truncate">{displayProvider}</span>
            )}
          </DropdownMenuLabel>
          {/* Only the model list scrolls; the effort slider stays in view below it. */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoadingModels && !models && (
              <div
                data-testid="models-loading"
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-text-secondary"
              >
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {intl.formatMessage(i18n.loadingModels)}
              </div>
            )}
            {failedToLoadModels && !models && (
              <div className="px-2 py-1.5 text-sm text-text-danger">
                {intl.formatMessage(i18n.failedToLoadModels)}
              </div>
            )}
            {models?.map((model) => {
              const subtitle = modelSubtitle(model.name);
              return (
                <DropdownMenuItem
                  key={model.name}
                  onSelect={() => void handleModelClick(model)}
                  title={model.name}
                  className="items-start"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-text-primary">
                      {describeModel(model.name).label}
                    </span>
                    {subtitle && (
                      <span className="truncate text-xs text-text-secondary">{subtitle}</span>
                    )}
                  </span>
                  {model.name === currentModel && (
                    <Check
                      data-testid="selected-model-check"
                      className="ml-auto mt-0.5 text-text-info"
                    />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
          {effortSupported && (
            <>
              <DropdownMenuSeparator />
              <EffortSlider
                values={EFFORT_VALUES}
                value={effort}
                onChange={handleEffortChange}
                title={intl.formatMessage(i18n.effort)}
                labelFor={(value) => intl.formatMessage(EFFORT_MESSAGES[value])}
              />
            </>
          )}
          {currentProvider === 'local' && currentModel && (
            <DropdownMenuItem
              onSelect={() => {
                pendingLocalSettingsRef.current = true;
                setIsModelMenuOpen(false);
              }}
            >
              <span>{intl.formatMessage(i18n.localModelSettings)}</span>
              <Settings className="ml-auto h-4 w-4" />
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isLocalModelSettingsOpen && currentModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background-primary border border-border-primary rounded-lg shadow-lg w-[480px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <h3 className="text-sm font-medium text-text-default">
                {intl.formatMessage(i18n.localModelSettingsTitle, {
                  modelName: currentModel,
                })}
              </h3>
              <button
                onClick={() => setIsLocalModelSettingsOpen(false)}
                className="text-text-muted hover:text-text-default text-lg leading-none"
              >
                ×
              </button>
            </div>
            <ScrollArea className="flex-1 px-4 py-3 overflow-y-auto max-h-[calc(80vh-52px)]">
              <ModelSettingsPanel modelId={currentModel} />
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
