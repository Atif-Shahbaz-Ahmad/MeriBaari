/**
 * Release-safe entry. Worklets/Reanimated/Gesture Handler must load before
 * expo-router, otherwise the first animated screen (splash) can fatal-exit.
 */
import 'react-native-gesture-handler';
import 'react-native-worklets';
import 'react-native-reanimated';
import 'expo-router/entry';

const errorUtils = globalThis.ErrorUtils;
if (errorUtils?.getGlobalHandler && errorUtils.setGlobalHandler) {
  const previousHandler = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    console.error('MeriBaari fatal', isFatal, error, error?.stack);
    previousHandler?.(error, isFatal);
  });
}
