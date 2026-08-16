import { useEffect } from 'react';

import { useQueueActions } from '../lib/queue-actions';

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export function QueueShortcuts() {
  const { actions } = useQueueActions();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === 'n' && actions.canCallNext && actions.callNext) {
        event.preventDefault();
        actions.callNext();
      }
      if (key === 's' && actions.canServe && actions.serve) {
        event.preventDefault();
        actions.serve();
      }
      if (key === 'p' && actions.canTogglePause && actions.togglePause) {
        event.preventDefault();
        actions.togglePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions]);

  return null;
}
