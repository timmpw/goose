import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, type RenderOptions } from '@testing-library/react';
import ModelsBottomBar from './ModelsBottomBar';
import { IntlTestWrapper } from '../../../../i18n/test-utils';

const renderWithIntl = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: IntlTestWrapper, ...options });

const createDropdownRef = (): React.RefObject<HTMLDivElement> =>
  ({ current: document.createElement('div') }) as React.RefObject<HTMLDivElement>;

let mockCurrentModel: string | null = 'config-model';
let mockCurrentProvider: string | null = 'config-provider';
let mockMenuOpen = false;
const mockChangeModel = vi.fn();
const mockOnModelChanged = vi.fn();
const mockPreventCloseAutoFocus = vi.fn();
const mockListProviderModels = vi.fn();
const mockReadThinkingEffort = vi.fn();
const mockSaveThinkingEffort = vi.fn();
const mockSetSessionProviderModel = vi.fn();
const mockGetSetting = vi.fn();
const mockSetSetting = vi.fn();
const mockTrackModelChanged = vi.fn();

vi.mock('../../../ModelAndProviderContext', () => ({
  useModelAndProvider: () => ({
    currentModel: mockCurrentModel,
    currentProvider: mockCurrentProvider,
    changeModel: mockChangeModel,
  }),
}));

vi.mock('../modelInterface', () => ({
  getProviderMetadata: vi.fn().mockResolvedValue({ display_name: 'Config Provider' }),
}));

vi.mock('../../../../acp/providers', () => ({
  acpListProviderModels: (...args: unknown[]) => mockListProviderModels(...args),
  acpReadThinkingEffort: () => mockReadThinkingEffort(),
  acpSaveThinkingEffort: (...args: unknown[]) => mockSaveThinkingEffort(...args),
  acpSetSessionProviderModel: (...args: unknown[]) => mockSetSessionProviderModel(...args),
}));

vi.mock('../../../../utils/analytics', () => ({
  trackModelChanged: (...args: unknown[]) => mockTrackModelChanged(...args),
}));

vi.mock('../../../ui/dropdown-menu', () => ({
  DropdownMenu: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => {
    mockMenuOpen = open;
    return (
      <div data-testid="model-menu" data-open={open}>
        <button onClick={() => onOpenChange(true)}>Open model menu</button>
        {children}
      </div>
    );
  },
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({
    children,
    onCloseAutoFocus,
  }: {
    children: React.ReactNode;
    onCloseAutoFocus?: (event: Pick<Event, 'preventDefault'>) => void;
  }) => (
    <div>
      <button onClick={() => onCloseAutoFocus?.({ preventDefault: mockPreventCloseAutoFocus })}>
        Complete model menu close
      </button>
      {mockMenuOpen ? children : null}
    </div>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onSelect,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
  }) => <button onClick={onSelect}>{children}</button>,
  DropdownMenuSeparator: () => null,
}));

vi.mock('../../localInference/ModelSettingsPanel', () => ({
  ModelSettingsPanel: () => null,
}));

vi.mock('../../../ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ModelsBottomBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMenuOpen = false;
    mockCurrentModel = 'config-model';
    mockCurrentProvider = 'config-provider';
    mockChangeModel.mockResolvedValue(true);
    mockListProviderModels.mockResolvedValue([
      { id: 'glm-5.3', reasoning: true },
      { id: 'glm-5.3-flash', reasoning: true },
    ]);
    mockReadThinkingEffort.mockResolvedValue('max');
    mockSaveThinkingEffort.mockResolvedValue(undefined);
    mockSetSessionProviderModel.mockResolvedValue({});
    mockGetSetting.mockResolvedValue([]);
    mockSetSetting.mockResolvedValue(undefined);
    Object.assign(window, {
      electron: { getSetting: mockGetSetting, setSetting: mockSetSetting },
    });
  });

  it('shows a loading placeholder while the active session model is still loading', () => {
    renderWithIntl(
      <ModelsBottomBar
        sessionId="session-123"
        dropdownRef={createDropdownRef()}
        onModelChanged={mockOnModelChanged}
        sessionLoaded={false}
      />
    );

    expect(screen.getByTestId('model-loading-state')).toHaveTextContent('Loading models…');
  });

  it('shows the active session model and saved effort once the session has loaded', async () => {
    renderWithIntl(
      <ModelsBottomBar
        sessionId="session-123"
        dropdownRef={createDropdownRef()}
        sessionModel="glm-5.3"
        sessionProvider="config-provider"
        onModelChanged={mockOnModelChanged}
        sessionLoaded={true}
      />
    );

    // The raw id reads as a model name in the trigger.
    expect(await screen.findByText('GLM 5.3')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.queryByTestId('model-loading-state')).not.toBeInTheDocument();
  });

  it('shows the configured model when there is no active session', () => {
    renderWithIntl(
      <ModelsBottomBar
        sessionId={null}
        dropdownRef={createDropdownRef()}
        onModelChanged={mockOnModelChanged}
      />
    );

    expect(screen.getByText('config-model')).toBeInTheDocument();
    expect(screen.queryByTestId('model-loading-state')).not.toBeInTheDocument();
  });

  it('lists all provider models with names and subtitles, marks the current one, and switches on click', async () => {
    mockCurrentModel = 'glm-5.3';
    renderWithIntl(
      <ModelsBottomBar
        sessionId="session-123"
        dropdownRef={createDropdownRef()}
        sessionModel="glm-5.3"
        sessionProvider="config-provider"
        onModelChanged={mockOnModelChanged}
        sessionLoaded={true}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open model menu' }));

    expect(
      await screen.findByRole('button', {
        name: /^GLM 5\.3 Flash\s*Most efficient for everyday tasks$/,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^GLM 5\.3\s*Most capable for ambitious work$/ })
    ).toBeInTheDocument();
    expect(screen.getByText('Models')).toBeInTheDocument();
    expect(screen.getByText('Config Provider')).toBeInTheDocument();
    expect(screen.getByTestId('selected-model-check')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^GLM 5\.3 Flash/ }));

    await waitFor(() => {
      expect(mockChangeModel).toHaveBeenCalledWith('session-123', {
        name: 'glm-5.3-flash',
        provider: 'config-provider',
        context_limit: undefined,
        reasoning: true,
        request_params: { thinking_effort: 'max' },
      });
    });
    expect(mockTrackModelChanged).toHaveBeenCalledWith('config-provider', 'glm-5.3-flash');
    expect(mockSetSetting).toHaveBeenCalledWith('recentModels', [
      { provider: 'config-provider', model: 'glm-5.3' },
    ]);
    expect(mockOnModelChanged).toHaveBeenCalledWith({
      model: 'glm-5.3-flash',
      provider: 'config-provider',
    });
  });

  it('changes effort with the slider, persists it, and applies it to the session', async () => {
    renderWithIntl(
      <ModelsBottomBar
        sessionId="session-123"
        dropdownRef={createDropdownRef()}
        sessionModel="glm-5.3"
        sessionProvider="config-provider"
        onModelChanged={mockOnModelChanged}
        sessionLoaded={true}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open model menu' }));
    await screen.findByRole('button', { name: /^GLM 5\.3 Flash/ });

    const control = screen.getByTestId('effort-control');
    expect(control).toHaveTextContent('Effort');
    await waitFor(() => expect(screen.getByTestId('effort-value')).toHaveTextContent('Max'));

    const slider = screen.getByRole('slider', { name: 'Effort' });
    // off, low, medium, high, max → "high" is step 3.
    fireEvent.change(slider, { target: { value: '3' } });

    await waitFor(() => {
      expect(mockSaveThinkingEffort).toHaveBeenCalledWith('high');
    });
    expect(mockSetSessionProviderModel).toHaveBeenCalledWith(
      'session-123',
      'config-provider',
      'glm-5.3',
      'high'
    );
    expect(screen.getByTestId('effort-value')).toHaveTextContent('High');
    expect(slider).toHaveAttribute('aria-valuetext', 'High');
    // Selecting an effort does not switch the model.
    expect(mockChangeModel).not.toHaveBeenCalled();
  });

  it('hides the effort control for models without reasoning support', async () => {
    mockListProviderModels.mockResolvedValue([{ id: 'glm-5.3', reasoning: false }]);
    renderWithIntl(
      <ModelsBottomBar
        sessionId={null}
        dropdownRef={createDropdownRef()}
        sessionModel="glm-5.3"
        sessionProvider="config-provider"
        onModelChanged={mockOnModelChanged}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open model menu' }));
    await screen.findByRole('button', { name: /^GLM 5\.3/ });

    expect(screen.queryByTestId('effort-control')).not.toBeInTheDocument();
    expect(screen.queryByText('Max')).not.toBeInTheDocument();
  });

  it('opens the local model settings overlay after the menu closes', () => {
    renderWithIntl(
      <ModelsBottomBar
        sessionId="session-123"
        dropdownRef={createDropdownRef()}
        sessionModel="local-model"
        sessionProvider="local"
        onModelChanged={mockOnModelChanged}
        sessionLoaded={true}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open model menu' }));
    expect(screen.getByTestId('model-menu')).toHaveAttribute('data-open', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Local Model Settings' }));
    expect(screen.getByTestId('model-menu')).toHaveAttribute('data-open', 'false');
    expect(
      screen.queryByRole('heading', { name: 'Local Model Settings — local-model' })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Complete model menu close' }));
    expect(
      screen.getByRole('heading', { name: 'Local Model Settings — local-model' })
    ).toBeInTheDocument();
    expect(mockPreventCloseAutoFocus).toHaveBeenCalledOnce();
  });
});
