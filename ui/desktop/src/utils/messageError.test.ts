import { describe, expect, it } from 'vitest';
import type { Message, MessageContent } from '../types/message';
import { findRetryableUserMessage, getMessageErrorText, parseMessageError } from './messageError';

const RETRY_HINT = '\n\nPlease retry if you think this is a transient or recoverable error.';

function message(
  id: string,
  role: Message['role'],
  content: MessageContent[],
  metadata: Partial<Message['metadata']> = {}
): Message {
  return {
    id,
    role,
    created: 1,
    content,
    metadata: { agentVisible: true, userVisible: true, ...metadata },
  };
}

describe('parseMessageError', () => {
  it('unwraps a GLM rate-limit error with its code and request id', () => {
    const text =
      'Ran into this error: Rate limit exceeded: [1308][You have reached the 5-hour usage limit.]' +
      '[20261109abc] (provider request id: 20261109abc).' +
      RETRY_HINT;

    expect(parseMessageError(text)).toEqual({
      category: 'rateLimit',
      detail: 'You have reached the 5-hour usage limit.',
      code: '1308',
      requestId: '20261109abc',
    });
  });

  it('keeps the provider message of a rejected request', () => {
    const text =
      'Ran into this error: Request failed: Bad request (400): thinking.adaptive.clear_thinking: ' +
      'Extra inputs are not permitted (provider request id: req_011).' +
      RETRY_HINT;

    expect(parseMessageError(text)).toEqual({
      category: 'requestFailed',
      detail: 'Bad request (400): thinking.adaptive.clear_thinking: Extra inputs are not permitted',
      requestId: 'req_011',
    });
  });

  it('drops the resend hint of a network error', () => {
    expect(
      parseMessageError(
        'Network error: connection reset\n\nPlease resend your message to try again.'
      )
    ).toEqual({ category: 'network', detail: 'connection reset' });
  });

  it('lets the server error kind decide the category', () => {
    expect(
      parseMessageError('Ran into this error: token expired.' + RETRY_HINT, 'authentication')
    ).toEqual({
      category: 'authentication',
      detail: 'token expired',
    });
  });
});

describe('getMessageErrorText', () => {
  it('recognises messages tagged by the server', () => {
    const tagged = message('a', 'assistant', [{ type: 'text', text: 'Network error: x' }], {
      error: { kind: 'other' },
    });
    expect(getMessageErrorText(tagged)).toBe('Network error: x');
  });

  it('recognises legacy plain-text errors and ignores ordinary replies', () => {
    const legacyText = 'Ran into this error: x.' + RETRY_HINT;
    const legacy = message('a', 'assistant', [{ type: 'text', text: legacyText }]);
    const reply = message('b', 'assistant', [{ type: 'text', text: 'Hello' }]);
    expect(getMessageErrorText(legacy)).toBe(legacyText);
    expect(getMessageErrorText(reply)).toBeNull();
  });

  it('does not treat a reply that only quotes the error phrase as an error', () => {
    const quoted = message('a', 'assistant', [
      { type: 'text', text: 'Ran into this error: x. means the provider failed.' },
    ]);
    expect(getMessageErrorText(quoted)).toBeNull();
  });
});

describe('findRetryableUserMessage', () => {
  it('skips tool-response turns back to the user prompt', () => {
    const messages = [
      message('u1', 'user', [{ type: 'text', text: 'do it' }]),
      message('a1', 'assistant', [
        {
          type: 'toolRequest',
          id: 't1',
          toolCall: { status: 'success', value: { name: 'tool', arguments: {} } },
        },
      ]),
      message('u2', 'user', [
        {
          type: 'toolResponse',
          id: 't1',
          toolResult: { status: 'success', value: { content: [] } },
        },
      ]),
      message('e1', 'assistant', [{ type: 'text', text: 'Ran into this error: x.' }]),
    ];

    expect(findRetryableUserMessage(messages, 3)?.id).toBe('u1');
  });
});
