export async function setStringAsync(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(value);
  }
}

export async function getStringAsync() {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.readText();
  }
  return '';
}
