export async function getPermissionsAsync() {
  return { status: 'undetermined', granted: false };
}

export async function requestPermissionsAsync() {
  return { status: 'undetermined', granted: false };
}

export async function getExpoPushTokenAsync() {
  return { data: null };
}

export async function setNotificationHandler() {
  return;
}

export const AndroidImportance = { MAX: 5 };
export async function setNotificationChannelAsync() {
  return;
}

export function addNotificationResponseReceivedListener() {
  return { remove: () => undefined };
}
