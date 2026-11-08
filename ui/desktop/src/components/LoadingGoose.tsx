import { TenRouterMark } from './icons';
import { BrandSpinner } from './ui/BrandSpinner';
import { ChatState } from '../types/chatState';
import { defineMessages, useIntl } from '../i18n';

interface LoadingGooseProps {
  message?: string;
  chatState?: ChatState;
}

const i18n = defineMessages({
  loadingConversation: {
    id: 'loadingGoose.loadingConversation',
    defaultMessage: 'loading conversation...',
  },
  thinking: {
    id: 'loadingGoose.thinking',
    defaultMessage: '10Router is thinking…',
  },
  streaming: {
    id: 'loadingGoose.streaming',
    defaultMessage: '10Router is working on it…',
  },
  waiting: {
    id: 'loadingGoose.waiting',
    defaultMessage: '10Router is waiting…',
  },
  compacting: {
    id: 'loadingGoose.compacting',
    defaultMessage: '10Router is compacting the conversation...',
  },
  idle: {
    id: 'loadingGoose.idle',
    defaultMessage: '10Router is working on it…',
  },
  restartingAgent: {
    id: 'loadingGoose.restartingAgent',
    defaultMessage: 'restarting session...',
  },
});

// Every busy state shows the same brand-blue spinner; waiting for the user
// pulses instead, and idle shows the 10router mark.
const STATE_ICONS: Record<ChatState, React.ReactNode> = {
  [ChatState.LoadingConversation]: <BrandSpinner />,
  [ChatState.Thinking]: <BrandSpinner />,
  [ChatState.Streaming]: <BrandSpinner />,
  [ChatState.WaitingForUserInput]: <BrandSpinner variant="waiting" />,
  [ChatState.Compacting]: <BrandSpinner />,
  [ChatState.Idle]: <TenRouterMark className="h-7 w-auto" />,
  [ChatState.RestartingAgent]: <BrandSpinner />,
};

const STATE_MESSAGE_KEYS: Record<ChatState, keyof typeof i18n> = {
  [ChatState.LoadingConversation]: 'loadingConversation',
  [ChatState.Thinking]: 'thinking',
  [ChatState.Streaming]: 'streaming',
  [ChatState.WaitingForUserInput]: 'waiting',
  [ChatState.Compacting]: 'compacting',
  [ChatState.Idle]: 'idle',
  [ChatState.RestartingAgent]: 'restartingAgent',
};

const LoadingGoose = ({ message, chatState = ChatState.Idle }: LoadingGooseProps) => {
  const intl = useIntl();
  const displayMessage = message || intl.formatMessage(i18n[STATE_MESSAGE_KEYS[chatState]]);
  const icon = STATE_ICONS[chatState];

  return (
    <div className="w-full animate-fade-slide-up">
      <div
        data-testid="loading-indicator"
        className="flex items-center gap-2 text-xs text-text-primary py-2"
      >
        {icon}
        {displayMessage}
      </div>
    </div>
  );
};

export default LoadingGoose;
