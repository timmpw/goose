import { describe, expect, it } from 'vitest';
import { compareModelIds, describeModel } from './modelDisplay';

describe('describeModel', () => {
  it.each([
    ['claude-opus-5-5', 'Opus 5.5', 'capable', false],
    ['claude-opus-5-5[1m]', 'Opus 5.5 1M', 'capable', true],
    ['claude-sonnet-5', 'Sonnet 5', 'efficient', false],
    ['claude-haiku-4-5-20251001', 'Haiku 4.5', 'fast', false],
    ['claude-3-5-sonnet', 'Sonnet 3.5', 'efficient', false],
    ['glm-5.3', 'GLM 5.3', 'capable', false],
    ['glm-5.3-flash[1m]', 'GLM 5.3 Flash 1M', 'efficient', true],
    ['glm-4.5-air', 'GLM 4.5 Air', 'efficient', false],
    ['glm-5v-turbo', 'GLM 5v Turbo', null, false],
    ['gpt-5.5', 'GPT-5.5', 'capable', false],
    ['gpt-5.5-codex', 'GPT-5.5 Codex', 'coding', false],
    ['gpt-5.4-mini', 'GPT-5.4 Mini', 'fast', false],
  ])('%s → %s', (id, label, tier, longContext) => {
    expect(describeModel(id)).toEqual({ label, tier, longContext });
  });

  it('passes unknown ids through unchanged', () => {
    expect(describeModel('config-model')).toEqual({
      label: 'config-model',
      tier: null,
      longContext: false,
    });
  });
});

describe('compareModelIds', () => {
  it('orders families, newest versions first, each 1M right after its base', () => {
    const ids = [
      'claude-haiku-4-5-20251001',
      'glm-5.3',
      'glm-5.3[1m]',
      'claude-opus-5',
      'claude-opus-5-5',
      'claude-opus-5-5[1m]',
      'claude-opus-5[1m]',
      'glm-5.3-flash',
      'glm-5.3-flash[1m]',
      'claude-sonnet-5-5',
      'some-other-model',
      'gpt-5.5-codex',
      'gpt-5.5',
    ];
    expect([...ids].sort(compareModelIds)).toEqual([
      'claude-opus-5-5',
      'claude-opus-5-5[1m]',
      'claude-opus-5',
      'claude-opus-5[1m]',
      'claude-sonnet-5-5',
      'claude-haiku-4-5-20251001',
      'glm-5.3',
      'glm-5.3[1m]',
      'glm-5.3-flash',
      'glm-5.3-flash[1m]',
      'gpt-5.5',
      'gpt-5.5-codex',
      'some-other-model',
    ]);
  });
});
