import { getTextAndImageContent, type Message, type MessageErrorKind } from '../types/message';

export type MessageErrorCategory =
  | 'rateLimit'
  | 'requestFailed'
  | 'authentication'
  | 'contextLength'
  | 'network'
  | 'server'
  | 'generic';

export interface ParsedMessageError {
  category: MessageErrorCategory;
  detail: string;
  code?: string;
  requestId?: string;
}

// Servers that predate the `goose.error` chunk meta send provider errors as plain text
// in this shape (see Message::from_provider_error in goose-provider-types).
const LEGACY_ERROR_PREFIX = 'Ran into this error: ';

const LEGACY_RETRY_HINT = 'Please retry if you think this is a transient or recoverable error.';

const HINT_PARAGRAPHS = [LEGACY_RETRY_HINT, 'Please resend your message to try again.'];

const CATEGORY_PREFIXES: ReadonlyArray<[string, MessageErrorCategory]> = [
  ['Rate limit exceeded: ', 'rateLimit'],
  ['Request failed: ', 'requestFailed'],
  ['Authentication error: ', 'authentication'],
  ['Context length exceeded: ', 'contextLength'],
  ['Network error: ', 'network'],
  ['Server error: ', 'server'],
];

const REQUEST_ID_SUFFIX = /\s*\(provider request id: ([^)]+)\)\s*$/;
// Providers such as GLM wrap their payload as `[code][message][trace id]`.
const BRACKETED_PROVIDER_ERROR = /^\[([^\]]+)\]\[([\s\S]+)\]\[[^\]]+\]$/;

export function getMessageErrorText(
  message: Message,
  textContent: string = getTextAndImageContent(message).textContent
): string | null {
  if (message.role !== 'assistant') {
    return null;
  }
  if (message.metadata.error) {
    return textContent.trim() ? textContent : null;
  }
  // Without the server marker only the full error template counts, so a model reply that
  // merely mentions the phrase is not mistaken for a failed turn.
  const isLegacyError =
    textContent.startsWith(LEGACY_ERROR_PREFIX) &&
    textContent.trimEnd().endsWith(`\n\n${LEGACY_RETRY_HINT}`);
  return isLegacyError ? textContent : null;
}

export function parseMessageError(text: string, kind?: MessageErrorKind): ParsedMessageError {
  let detail = text.trim();
  const hasErrorTemplate = detail.startsWith(LEGACY_ERROR_PREFIX);
  if (hasErrorTemplate) {
    detail = detail.slice(LEGACY_ERROR_PREFIX.length);
  }

  detail = detail
    .split('\n\n')
    .filter((paragraph) => !HINT_PARAGRAPHS.includes(paragraph.trim()))
    .join('\n\n')
    .trim();
  // The template is `Ran into this error: {err}.`; drop only the period it appended.
  if (hasErrorTemplate && detail.endsWith('.')) {
    detail = detail.slice(0, -1);
  }

  let requestId: string | undefined;
  const requestIdMatch = detail.match(REQUEST_ID_SUFFIX);
  if (requestIdMatch) {
    requestId = requestIdMatch[1].trim();
    detail = detail.slice(0, requestIdMatch.index).trim();
  }

  let category: MessageErrorCategory = 'generic';
  for (const [prefix, prefixCategory] of CATEGORY_PREFIXES) {
    if (detail.startsWith(prefix)) {
      category = prefixCategory;
      detail = detail.slice(prefix.length).trim();
      break;
    }
  }
  if (kind === 'authentication') {
    category = 'authentication';
  } else if (kind === 'contextLengthExceeded') {
    category = 'contextLength';
  }

  let code: string | undefined;
  const bracketed = detail.match(BRACKETED_PROVIDER_ERROR);
  if (bracketed) {
    code = bracketed[1].trim();
    detail = bracketed[2].trim();
  }

  return {
    category,
    detail,
    ...(code ? { code } : {}),
    ...(requestId ? { requestId } : {}),
  };
}

// The request to resend is the last user prompt before the error. Tool-response-only user
// messages are skipped so a failure mid tool chain retries the whole turn.
export function findRetryableUserMessage(
  messages: readonly Message[],
  errorIndex: number
): Message | undefined {
  for (let index = errorIndex - 1; index >= 0; index--) {
    const message = messages[index];
    if (message.role !== 'user' || !message.metadata.userVisible) {
      continue;
    }
    const isPrompt = message.content.some(
      (content) => content.type === 'text' || content.type === 'image'
    );
    if (isPrompt && message.id) {
      return message;
    }
  }
  return undefined;
}
