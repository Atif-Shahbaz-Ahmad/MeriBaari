export async function getItemAsync(key: string) {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(key);
}

export async function setItemAsync(key: string, value: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, value);
}

export async function deleteItemAsync(key: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(key);
}
