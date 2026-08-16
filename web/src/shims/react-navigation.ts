import { useEffect } from 'react';

export function useFocusEffect(effect: () => void | (() => void)) {
  useEffect(() => {
    return effect();
  }, [effect]);
}
