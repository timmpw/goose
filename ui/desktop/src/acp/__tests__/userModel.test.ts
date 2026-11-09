import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '../../types/session';
import type { ProviderDetails } from '../../types/providers';
import {
  acpGetProviderDetails,
  acpReadThinkingEffort,
  acpSetSessionProviderModel,
} from '../providers';
import { applyUserModel, resolveUserModel } from '../userModel';

vi.mock('../providers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../providers')>();
  return {
    normalizeTenRouterModelId: actual.normalizeTenRouterModelId,
    acpGetProviderDetails: vi.fn(),
    acpReadThinkingEffort: vi.fn(),
    acpSetSessionProviderModel: vi.fn(),
  };
});

const settings: Record<string, unknown> = {};

function provider(models: { name: string; reasoning?: boolean }[], configured = true) {
  return {
    name: 'tenrouter',
    is_configured: configured,
    metadata: { known_models: models },
  } as unknown as ProviderDetails;
}

function newSession(): Session {
  return {
    id: 'session-1',
    created_at: '',
    updated_at: '',
    extension_data: {},
    message_count: 0,
    name: '',
    working_dir: '/tmp',
    provider_name: 'tenrouter',
    model_config: { model_name: 'claude-sonnet-4-6', toolshim: false },
  } as Session;
}

beforeEach(() => {
  vi.resetAllMocks();
  for (const key of Object.keys(settings)) delete settings[key];
  window.electron = {
    ...window.electron,
    getSetting: vi.fn(async (key: string) => settings[key]),
    setSetting: vi.fn(async (key: string, value: unknown) => {
      settings[key] = value;
    }),
  } as typeof window.electron;
});

describe('resolveUserModel', () => {
  it('returns nothing when the user never picked a model', async () => {
    expect(await resolveUserModel()).toBeNull();
    expect(acpGetProviderDetails).not.toHaveBeenCalled();
  });

  it('returns the picked model while the provider still offers it', async () => {
    settings.userModel = { provider: 'tenrouter', model: 'claude-opus-4-7' };
    vi.mocked(acpGetProviderDetails).mockResolvedValue(
      provider([{ name: 'claude-opus-4-7', reasoning: true }])
    );

    expect(await resolveUserModel()).toEqual({
      provider: 'tenrouter',
      model: 'claude-opus-4-7',
      reasoning: true,
    });
  });

  it('matches 10router GLM slot ids by their real model id', async () => {
    settings.userModel = { provider: 'tenrouter', model: 'glm-5.3' };
    vi.mocked(acpGetProviderDetails).mockResolvedValue(
      provider([{ name: 'claude-opus-4-5-20251101' }])
    );

    expect(await resolveUserModel()).toMatchObject({ model: 'glm-5.3' });
  });

  it('forgets a model the provider no longer offers', async () => {
    settings.userModel = { provider: 'tenrouter', model: 'claude-opus-4-1' };
    vi.mocked(acpGetProviderDetails).mockResolvedValue(provider([{ name: 'claude-opus-4-7' }]));

    expect(await resolveUserModel()).toBeNull();
    expect(settings.userModel).toBeNull();
  });

  it('forgets a model whose provider is no longer configured', async () => {
    settings.userModel = { provider: 'tenrouter', model: 'claude-opus-4-7' };
    vi.mocked(acpGetProviderDetails).mockResolvedValue(
      provider([{ name: 'claude-opus-4-7' }], false)
    );

    expect(await resolveUserModel()).toBeNull();
    expect(settings.userModel).toBeNull();
  });
});

describe('applyUserModel', () => {
  it('switches a new session to the picked model with the saved effort', async () => {
    settings.userModel = { provider: 'tenrouter', model: 'claude-opus-4-7' };
    vi.mocked(acpGetProviderDetails).mockResolvedValue(
      provider([{ name: 'claude-opus-4-7', reasoning: true }])
    );
    vi.mocked(acpReadThinkingEffort).mockResolvedValue('high');
    vi.mocked(acpSetSessionProviderModel).mockResolvedValue({
      providerId: 'tenrouter',
      modelId: 'claude-opus-4-7',
    });

    const session = await applyUserModel(newSession());

    expect(acpSetSessionProviderModel).toHaveBeenCalledWith(
      'session-1',
      'tenrouter',
      'claude-opus-4-7',
      'high'
    );
    expect(session.model_config?.model_name).toBe('claude-opus-4-7');
  });

  it('keeps the default model when the picked one is gone', async () => {
    settings.userModel = { provider: 'tenrouter', model: 'claude-opus-4-1' };
    vi.mocked(acpGetProviderDetails).mockResolvedValue(provider([{ name: 'claude-sonnet-4-6' }]));

    const session = await applyUserModel(newSession());

    expect(acpSetSessionProviderModel).not.toHaveBeenCalled();
    expect(session.model_config?.model_name).toBe('claude-sonnet-4-6');
  });

  it('leaves the session alone when it already runs the picked model', async () => {
    settings.userModel = { provider: 'tenrouter', model: 'claude-sonnet-4-6' };
    vi.mocked(acpGetProviderDetails).mockResolvedValue(provider([{ name: 'claude-sonnet-4-6' }]));

    await applyUserModel(newSession());

    expect(acpSetSessionProviderModel).not.toHaveBeenCalled();
  });

  it('keeps the default model when switching fails', async () => {
    settings.userModel = { provider: 'tenrouter', model: 'claude-opus-4-7' };
    vi.mocked(acpGetProviderDetails).mockResolvedValue(
      provider([{ name: 'claude-opus-4-7', reasoning: false }])
    );
    vi.mocked(acpSetSessionProviderModel).mockRejectedValue(new Error('boom'));

    const session = await applyUserModel(newSession());

    expect(acpReadThinkingEffort).not.toHaveBeenCalled();
    expect(session.model_config?.model_name).toBe('claude-sonnet-4-6');
  });
});
