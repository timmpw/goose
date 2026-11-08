// How a provider model id reads in the model picker: a human name
// ("claude-opus-5-5[1m]" → "Opus 5.5 1M") and what it is good for, so the
// list is not a column of raw ids. Unknown ids pass through unchanged.

export type ModelTier = 'capable' | 'efficient' | 'fast' | 'coding';

export interface ModelDisplay {
  label: string;
  /** What the model is for; null when we do not know the family. */
  tier: ModelTier | null;
  /** A `[1m]` long-context variant — its subtitle is the context window. */
  longContext: boolean;
}

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
const suffixWords = (suffix: string) => suffix.split('-').filter(Boolean).map(capitalize).join(' ');

const CLAUDE_TIER: Record<string, ModelTier> = {
  opus: 'capable',
  sonnet: 'efficient',
  haiku: 'fast',
};

export function describeModel(id: string): ModelDisplay {
  const longContext = /\[1m\]$/i.test(id);
  // Drop a context tag ([1m]) and a dated snapshot suffix (-20251001).
  const base = id.replace(/\[[^\]]*\]$/, '').replace(/-\d{8}$/, '');

  let label: string;
  let tier: ModelTier | null = null;
  let match: RegExpExecArray | null;

  if ((match = /^claude-(opus|sonnet|haiku)-(\d+(?:-\d+)*)$/.exec(base))) {
    label = `${capitalize(match[1])} ${match[2].replace(/-/g, '.')}`;
    tier = CLAUDE_TIER[match[1]];
  } else if ((match = /^claude-(\d+(?:-\d+)*)-(opus|sonnet|haiku)$/.exec(base))) {
    label = `${capitalize(match[2])} ${match[1].replace(/-/g, '.')}`;
    tier = CLAUDE_TIER[match[2]];
  } else if ((match = /^glm-(\d+(?:\.\d+)*[a-z]?)(?:-(.+))?$/.exec(base))) {
    label = `GLM ${match[1]}${match[2] ? ` ${suffixWords(match[2])}` : ''}`;
    if (!match[2]) tier = 'capable';
    else if (/flash|air/.test(match[2])) tier = 'efficient';
  } else if ((match = /^gpt-(\d+(?:\.\d+)*)(?:-(.+))?$/.exec(base))) {
    label = `GPT-${match[1]}${match[2] ? ` ${suffixWords(match[2])}` : ''}`;
    if (!match[2]) tier = 'capable';
    else if (/codex/.test(match[2])) tier = 'coding';
    else if (/mini|nano/.test(match[2])) tier = 'fast';
  } else {
    return { label: id, tier: null, longContext: false };
  }

  return { label: longContext ? `${label} 1M` : label, tier, longContext };
}

// Picker order: Opus, Sonnet, Haiku, then GLM, then GPT, then the rest;
// newer versions first; within a version the base model, then its variants
// (Flash, Codex…), each followed by its 1M twin.
const FAMILY_ORDER = ['opus', 'sonnet', 'haiku', 'glm', 'gpt'];

function sortKey(id: string) {
  const { label, longContext } = describeModel(id);
  const words = label
    .replace(/ 1M$/, '')
    .toLowerCase()
    .split(/[\s-]+/);
  const family = FAMILY_ORDER.indexOf(words[0]);
  const version = (words[1] ?? '').split('.').map((part) => parseInt(part, 10) || 0);
  return {
    family: family === -1 ? FAMILY_ORDER.length : family,
    version,
    variant: words.slice(2).join(' '),
    longContext,
  };
}

export function compareModelIds(a: string, b: string): number {
  const ka = sortKey(a);
  const kb = sortKey(b);
  if (ka.family !== kb.family) return ka.family - kb.family;
  if (ka.family === FAMILY_ORDER.length) return a.localeCompare(b);
  for (let i = 0; i < Math.max(ka.version.length, kb.version.length); i += 1) {
    const diff = (kb.version[i] ?? 0) - (ka.version[i] ?? 0);
    if (diff !== 0) return diff;
  }
  if (ka.variant !== kb.variant) {
    if (!ka.variant) return -1;
    if (!kb.variant) return 1;
    return ka.variant.localeCompare(kb.variant);
  }
  return Number(ka.longContext) - Number(kb.longContext);
}
