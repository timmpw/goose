import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IntlTestWrapper } from '../i18n/test-utils';
import type { Message } from '../types/message';
import MessageList from './MessageList';

const metadata: Message['metadata'] = { agentVisible: true, userVisible: true };

const userMessage: Message = {
  id: 'u1',
  role: 'user',
  created: 1,
  content: [{ type: 'text', text: 'Hello' }],
  metadata,
};

const errorMessage: Message = {
  id: 'e1',
  role: 'assistant',
  created: 2,
  content: [
    {
      type: 'text',
      text: 'Ran into this error: Rate limit exceeded: [1308][Limit reached.][abc] (provider request id: abc).',
    },
  ],
  metadata: { ...metadata, userVisible: true, agentVisible: false, error: { kind: 'other' } },
};

function renderList(messages: Message[], onMessageUpdate = vi.fn()) {
  render(
    <MessageList
      messages={messages}
      sessionId="session"
      isUserMessage={(message) => message.role === 'user'}
      onMessageUpdate={onMessageUpdate}
    />,
    { wrapper: IntlTestWrapper }
  );
  return onMessageUpdate;
}

describe('MessageErrorBanner in MessageList', () => {
  it('renders the provider error as a banner and retries the last prompt', () => {
    const onMessageUpdate = renderList([userMessage, errorMessage]);

    expect(screen.getByTestId('message-error-banner')).toBeInTheDocument();
    expect(screen.getByText('Rate limit reached')).toBeInTheDocument();
    expect(screen.getByText('Limit reached.')).toBeInTheDocument();
    expect(screen.getByText('Code: 1308 · Request ID: abc')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry request' }));

    expect(onMessageUpdate).toHaveBeenCalledWith('u1', 'Hello', 'edit', []);
  });

  it('offers no retry for an error that is no longer the last message', () => {
    const laterReply: Message = {
      id: 'a2',
      role: 'assistant',
      created: 3,
      content: [{ type: 'text', text: 'Later reply' }],
      metadata,
    };
    renderList([userMessage, errorMessage, { ...userMessage, id: 'u2', created: 3 }, laterReply]);

    expect(screen.getByTestId('message-error-banner')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry request' })).not.toBeInTheDocument();
  });

  it('keeps retry available when an agent-only message follows the error', () => {
    const hiddenAfterError: Message = {
      id: 'h1',
      role: 'assistant',
      created: 3,
      content: [{ type: 'text', text: 'agent only' }],
      metadata: { agentVisible: true, userVisible: false },
    };
    renderList([userMessage, errorMessage, hiddenAfterError]);

    expect(screen.getByRole('button', { name: 'Retry request' })).toBeInTheDocument();
  });

  it('re-enables retry when the retry does not replace the error', async () => {
    let finishRetry: () => void = () => {};
    const onMessageUpdate = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishRetry = resolve;
        })
    );
    renderList([userMessage, errorMessage], onMessageUpdate);
    const retryButton = screen.getByRole('button', { name: 'Retry request' });

    fireEvent.click(retryButton);
    expect(retryButton).toBeDisabled();

    await act(async () => finishRetry());
    expect(retryButton).toBeEnabled();
  });
});
