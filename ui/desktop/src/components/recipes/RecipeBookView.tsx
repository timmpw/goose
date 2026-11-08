import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AlertCircle, BookOpen, CloudDownload, EyeOff, LayoutGrid, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import BackButton from '../ui/BackButton';
import { MainPanelLayout } from '../Layout/MainPanelLayout';
import { toastSuccess, toastError } from '../../toasts';
import { defineMessages, useIntl } from '../../i18n';
import { errorMessage } from '../../utils/conversionUtils';
import {
  harnessFetch,
  harnessList,
  harnessUnpublish,
  type HarnessKind,
  type HarnessListItem,
} from '../../acp/harness';
import { listSavedRecipes, saveRecipe } from '../../recipe/recipe_management';
import { parseRecipeFromFile } from '../../recipe';
import { importMcpApp, listMcpApps } from '../../acp/mcp-apps';

const i18n = defineMessages({
  title: {
    id: 'recipeBook.title',
    defaultMessage: 'Recipe Book',
  },
  titleApps: {
    id: 'recipeBook.titleApps',
    defaultMessage: 'App Library',
  },
  descriptionRecipes: {
    id: 'recipeBook.descriptionRecipes',
    defaultMessage:
      'Recipes other 10router users shared. Installing saves a recipe to your recipes.',
  },
  descriptionApps: {
    id: 'recipeBook.descriptionApps',
    defaultMessage:
      'Applications other 10router users shared. Installing adds an application to your apps.',
  },
  refresh: {
    id: 'recipeBook.refresh',
    defaultMessage: 'Refresh',
  },
  loading: {
    id: 'recipeBook.loading',
    defaultMessage: 'Loading…',
  },
  emptyTitle: {
    id: 'recipeBook.emptyTitle',
    defaultMessage: 'Nothing shared yet',
  },
  emptyDescriptionRecipes: {
    id: 'recipeBook.emptyDescriptionRecipes',
    defaultMessage: 'Shared recipes will appear here. Use “Share to 10router” on a recipe card.',
  },
  emptyDescriptionApps: {
    id: 'recipeBook.emptyDescriptionApps',
    defaultMessage:
      'Shared applications will appear here. Use “Share to 10router” on an application card.',
  },
  errorTitle: {
    id: 'recipeBook.errorTitle',
    defaultMessage: 'Failed to load the library',
  },
  retry: {
    id: 'recipeBook.retry',
    defaultMessage: 'Retry',
  },
  install: {
    id: 'recipeBook.install',
    defaultMessage: 'Install',
  },
  installing: {
    id: 'recipeBook.installing',
    defaultMessage: 'Installing…',
  },
  installed: {
    id: 'recipeBook.installed',
    defaultMessage: 'Installed',
  },
  unpublish: {
    id: 'recipeBook.unpublish',
    defaultMessage: 'Unpublish',
  },
  installedRecipeMsg: {
    id: 'recipeBook.installedRecipeMsg',
    defaultMessage: 'Recipe "{title}" saved to your library',
  },
  installedAppMsg: {
    id: 'recipeBook.installedAppMsg',
    defaultMessage: 'Application "{title}" added',
  },
  installFailedTitle: {
    id: 'recipeBook.installFailedTitle',
    defaultMessage: 'Install failed',
  },
  unpublishedMsg: {
    id: 'recipeBook.unpublishedMsg',
    defaultMessage: '"{title}" is no longer published',
  },
  unpublishFailedTitle: {
    id: 'recipeBook.unpublishFailedTitle',
    defaultMessage: 'Failed to unpublish',
  },
  you: {
    id: 'recipeBook.you',
    defaultMessage: 'you',
  },
});

// The shared 10router library for one kind of item. Recipes live in the
// Recipes section (/recipes/library), applications in Apps (/apps/library).
export const HARNESS_LIBRARY_PATH: Record<HarnessKind, string> = {
  recipe: '/recipes/library',
  app: '/apps/library',
};

export default function RecipeBookView({ kind }: { kind: HarnessKind }) {
  const intl = useIntl();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<HarnessListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<number | null>(null);
  const [installedTitles, setInstalledTitles] = useState<Set<string>>(new Set());
  const [unpublishingId, setUnpublishingId] = useState<number | null>(null);

  const load = useCallback(async (currentKind: HarnessKind, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      if (currentKind === 'recipe') {
        const [library, localRecipes] = await Promise.all([
          harnessList(currentKind),
          listSavedRecipes(),
        ]);
        if (signal?.aborted) return;
        setItems(library);
        setInstalledTitles(new Set(localRecipes.map((entry) => entry.recipe.title)));
      } else {
        const [library, localApps] = await Promise.all([harnessList(currentKind), listMcpApps()]);
        if (signal?.aborted) return;
        setItems(library);
        setInstalledTitles(new Set(localApps.map((app) => app.name)));
      }
    } catch (err) {
      if (signal?.aborted) return;
      setError(errorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(kind, controller.signal);
    return () => controller.abort();
  }, [kind, load]);

  const install = useCallback(
    async (itemKind: HarnessKind, item: HarnessListItem) => {
      setInstallingId(item.id);
      try {
        const fetched = await harnessFetch(itemKind, item.id);
        if (itemKind === 'recipe') {
          const recipe = await parseRecipeFromFile(fetched.payload);
          await saveRecipe(recipe, null);
          toastSuccess({
            title: item.title,
            msg: intl.formatMessage(i18n.installedRecipeMsg, { title: item.title }),
          });
        } else {
          await importMcpApp(fetched.payload);
          toastSuccess({
            title: item.title,
            msg: intl.formatMessage(i18n.installedAppMsg, { title: item.title }),
          });
        }
        setInstalledTitles((prev) => new Set(prev).add(item.title));
      } catch (err) {
        toastError({
          title: intl.formatMessage(i18n.installFailedTitle),
          msg: errorMessage(err),
        });
      } finally {
        setInstallingId(null);
      }
    },
    [intl]
  );

  const unpublish = useCallback(
    async (item: HarnessListItem) => {
      setUnpublishingId(item.id);
      try {
        await harnessUnpublish(kind, item.id);
        toastSuccess({
          title: item.title,
          msg: intl.formatMessage(i18n.unpublishedMsg, { title: item.title }),
        });
        await load(kind);
      } catch (err) {
        toastError({
          title: intl.formatMessage(i18n.unpublishFailedTitle),
          msg: errorMessage(err),
        });
      } finally {
        setUnpublishingId(null);
      }
    },
    [intl, kind, load]
  );

  // A `10router://harness/install` deeplink lands here as
  // <library path>?install=<kind>:<id> — install that item once, then clean
  // the URL so a refresh does not repeat it. An item of the other kind is
  // handed to its own section's library.
  const pendingInstall = searchParams.get('install');
  useEffect(() => {
    if (!pendingInstall || loading) return;
    const match = /^(recipe|app):(\d+)$/.exec(pendingInstall);
    if (!match) {
      setSearchParams({}, { replace: true });
      return;
    }
    const itemKind = match[1] as HarnessKind;
    const itemId = Number(match[2]);
    if (itemKind !== kind) {
      navigate(`${HARNESS_LIBRARY_PATH[itemKind]}?install=${pendingInstall}`, { replace: true });
      return;
    }
    setSearchParams({}, { replace: true });
    const item = items.find((entry) => entry.id === itemId);
    if (item) {
      install(itemKind, item);
    } else {
      // Not in the loaded page (e.g. hidden since) — still fetch by id.
      install(itemKind, { id: itemId, title: itemKind === 'recipe' ? 'Recipe' : 'App' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingInstall, loading, items]);

  const isRecipes = kind === 'recipe';
  const TitleIcon = isRecipes ? BookOpen : LayoutGrid;

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => Number(b.mine ?? false) - Number(a.mine ?? false)),
    [items]
  );

  return (
    <MainPanelLayout>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-background-primary px-8 pb-8 pt-10">
          <div className="flex flex-col page-transition">
            <BackButton
              variant="ghost"
              size="sm"
              className="mb-4 self-start px-2"
              onClick={() => navigate(isRecipes ? '/recipes' : '/apps')}
            />
            <div className="flex justify-between items-center mb-1">
              <h1 className="font-display text-[32px] font-bold tracking-tight flex items-center gap-3">
                <TitleIcon className="w-8 h-8" />
                {intl.formatMessage(isRecipes ? i18n.title : i18n.titleApps)}
              </h1>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => load(kind)}
              >
                <RefreshCw className="h-4 w-4" />
                {intl.formatMessage(i18n.refresh)}
              </Button>
            </div>
            <p className="text-sm text-text-secondary">
              {intl.formatMessage(isRecipes ? i18n.descriptionRecipes : i18n.descriptionApps)}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <AlertCircle className="w-8 h-8 text-text-danger" />
              <p className="text-sm text-text-secondary">
                {intl.formatMessage(i18n.errorTitle)}: {error}
              </p>
              <Button onClick={() => load(kind)}>{intl.formatMessage(i18n.retry)}</Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-text-secondary">{intl.formatMessage(i18n.loading)}</p>
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">{intl.formatMessage(i18n.emptyTitle)}</h3>
                <p className="text-sm text-text-secondary max-w-md">
                  {intl.formatMessage(
                    isRecipes ? i18n.emptyDescriptionRecipes : i18n.emptyDescriptionApps
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedItems.map((item) => {
                const isInstalled = installedTitles.has(item.title);
                const busy = installingId === item.id;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col p-4 border rounded-lg hover:border-border-primary transition-colors"
                  >
                    <div className="flex-1 mb-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-text-primary">{item.title}</h3>
                        {item.mine ? (
                          <span className="px-2 py-0.5 text-xs rounded bg-background-secondary text-text-secondary shrink-0">
                            {intl.formatMessage(i18n.you)}
                          </span>
                        ) : null}
                      </div>
                      {item.description ? (
                        <p className="text-sm text-text-secondary mb-2 line-clamp-3">
                          {item.description}
                        </p>
                      ) : null}
                      {item.activities && item.activities.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.activities.map((activity) => (
                            <span
                              key={activity}
                              className="px-2 py-0.5 text-xs bg-background-secondary text-text-secondary rounded"
                            >
                              {activity}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <p className="text-xs text-text-tertiary">
                        {item.author || '—'} · {item.updated_at?.slice(0, 10)}
                        {item.install_count ? ` · ${item.install_count}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {isInstalled ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled
                          title={intl.formatMessage(i18n.installed)}
                        >
                          {intl.formatMessage(i18n.installed)}
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => install(kind, item)}
                          disabled={busy}
                        >
                          <CloudDownload className="h-4 w-4" />
                          {busy
                            ? intl.formatMessage(i18n.installing)
                            : intl.formatMessage(i18n.install)}
                        </Button>
                      )}
                      {item.mine ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unpublish(item)}
                          disabled={unpublishingId === item.id}
                          title={intl.formatMessage(i18n.unpublish)}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainPanelLayout>
  );
}
