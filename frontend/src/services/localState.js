export function readLocalState(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    if (Array.isArray(fallback) ? !Array.isArray(value) : !value || typeof value !== 'object') return fallback;
    return value;
  } catch {
    return fallback;
  }
}

export function writeLocalState(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    window.dispatchEvent(new CustomEvent('alacena-storage-error'));
    return false;
  }
}
