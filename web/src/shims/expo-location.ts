export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  UNDETERMINED = 'undetermined',
}

export const Accuracy = { Balanced: 3 };

export async function getForegroundPermissionsAsync() {
  return { status: PermissionStatus.UNDETERMINED };
}

export async function requestForegroundPermissionsAsync() {
  return { status: PermissionStatus.UNDETERMINED };
}

export async function getCurrentPositionAsync() {
  throw new Error('Use the web geolocation adapter.');
}
