import type { Session } from '../types/session';
import type { ModelInfo } from '../types/providers';
import type { RecentModel } from '../utils/settings';
import {
  acpGetProviderDetails,
  acpReadThinkingEffort,
  acpSetSessionProviderModel,
  normalizeTenRouterModelId,
} from './providers';

export async function rememberUserModel(provider: string, model: string): Promise<void> {
  try {
    await window.electron.setSetting('userModel', { provider, model });
  } catch (error) {
    console.warn('Failed to remember user model:', error);
  }
}

async function findAvailableModel({ provider, model }: RecentModel): Promise<ModelInfo | null> {
  const details = await acpGetProviderDetails(provider);
  if (!details.is_configured) return null;
  return (
    details.metadata.known_models.find(
      (known) => normalizeTenRouterModelId(provider, known.name) === model
    ) ?? null
  );
}

/**
 * The model the user last picked, if the provider still offers it. A model that is
 * gone is forgotten, so new chats fall back to the config default and the user picks again.
 */
export async function resolveUserModel(): Promise<(RecentModel & { reasoning?: boolean }) | null> {
  try {
    const userModel = (await window.electron.getSetting('userModel')) ?? null;
    if (!userModel) return null;

    const available = await findAvailableModel(userModel);
    if (!available) {
      await window.electron.setSetting('userModel', null);
      return null;
    }
    return { ...userModel, reasoning: available.reasoning };
  } catch (error) {
    console.warn('Failed to resolve user model:', error);
    return null;
  }
}

export async function applyUserModel(session: Session): Promise<Session> {
  const userModel = await resolveUserModel();
  if (!userModel) return session;

  const { provider, model } = userModel;
  if (session.provider_name === provider && session.model_config?.model_name === model) {
    return session;
  }

  try {
    const effort = userModel.reasoning !== false ? await acpReadThinkingEffort() : null;
    const applied = await acpSetSessionProviderModel(session.id, provider, model, effort);
    return {
      ...session,
      provider_name: applied.providerId ?? provider,
      model_config: {
        ...(session.model_config ?? { toolshim: false }),
        model_name: applied.modelId ?? model,
      },
    };
  } catch (error) {
    console.warn('Failed to apply user model to new session:', error);
    return session;
  }
}
