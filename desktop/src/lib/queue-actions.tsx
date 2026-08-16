import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface DesktopQueueActions {
  callNext?: () => void;
  serve?: () => void;
  togglePause?: () => void;
  canCallNext?: boolean;
  canServe?: boolean;
  canTogglePause?: boolean;
}

const QueueActionsContext = createContext<{
  actions: DesktopQueueActions;
  setActions: (next: DesktopQueueActions) => void;
}>({
  actions: {},
  setActions: () => undefined,
});

export function QueueActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsState] = useState<DesktopQueueActions>({});
  const setActions = useCallback((next: DesktopQueueActions) => {
    setActionsState(next);
  }, []);
  const value = useMemo(() => ({ actions, setActions }), [actions, setActions]);
  return (
    <QueueActionsContext.Provider value={value}>
      {children}
    </QueueActionsContext.Provider>
  );
}

export function useQueueActions() {
  return useContext(QueueActionsContext);
}
