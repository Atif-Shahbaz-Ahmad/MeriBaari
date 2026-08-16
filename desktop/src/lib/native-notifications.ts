import { isTauriRuntime } from './tauri';

async function sendWebNotification(title: string, body: string) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
    return;
  }
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, { body });
    }
  }
}

export async function notifyDesktop(title: string, body: string) {
  try {
    if (isTauriRuntime()) {
      const notification = await import('@tauri-apps/plugin-notification');
      let granted = await notification.isPermissionGranted();
      if (!granted) {
        const permission = await notification.requestPermission();
        granted = permission === 'granted';
      }
      if (granted) {
        await notification.sendNotification({ title, body });
        return;
      }
    }
  } catch {
    // Fall through to the Web Notification API.
  }
  await sendWebNotification(title, body);
}
