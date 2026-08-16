const memoryStore = new Map<string, string>();

async function getWebItem(key: string): Promise<string | null> {
  if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  return memoryStore.get(key) ?? null;
}

async function setWebItem(key: string, value: string): Promise<void> {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
    return;
  }
  memoryStore.set(key, value);
}

async function removeWebItem(key: string): Promise<void> {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
    return;
  }
  memoryStore.delete(key);
}

export const secureStorage = {
  getItem: getWebItem,
  setItem: setWebItem,
  removeItem: removeWebItem,
};
