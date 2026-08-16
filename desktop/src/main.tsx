import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import './styles.css';

function showBootError(error: unknown) {
  const root = document.getElementById('root');
  if (!root) return;
  const message = error instanceof Error ? error.stack || error.message : String(error);
  root.innerHTML = `<div style="min-height:100vh;display:grid;place-items:center;padding:24px;font-family:system-ui,sans-serif"><div style="max-width:640px"><h1 style="margin:0 0 12px;font-size:20px">MeriBaari failed to start</h1><pre style="white-space:pre-wrap;color:#b91c1c;font-size:12px"></pre></div></div>`;
  const pre = root.querySelector('pre');
  if (pre) pre.textContent = message || 'Unknown startup error';
}

async function boot() {
  try {
    const { App } = await import('./App');
    const root = document.getElementById('root');
    if (!root) throw new Error('Root element #root was not found.');
    root.setAttribute('data-booted', 'true');
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    showBootError(error);
    throw error;
  }
}

void boot();
