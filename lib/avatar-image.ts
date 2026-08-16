import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const AVATAR_SIZE = 256;
const AVATAR_QUALITY = 0.72;

const ORG_LOGO_SIZE = 512;
const ORG_LOGO_QUALITY = 0.75;

const PAYMENT_PROOF_MAX_WIDTH = 1280;
const PAYMENT_PROOF_QUALITY = 0.72;

/**
 * Compress and resize a local image before upload.
 * Target ~256×256 JPEG to keep storage small.
 */
export async function optimizeAvatarImage(uri: string): Promise<{
  uri: string;
  mimeType: string;
}> {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: AVATAR_SIZE, height: AVATAR_SIZE } }],
    {
      compress: AVATAR_QUALITY,
      format: SaveFormat.JPEG,
    },
  );
  return { uri: result.uri, mimeType: 'image/jpeg' };
}

/**
 * Compress/resize organization logos before upload (~512×512 JPEG).
 */
export async function optimizeOrganizationLogoImage(uri: string): Promise<{
  uri: string;
  mimeType: string;
}> {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: ORG_LOGO_SIZE, height: ORG_LOGO_SIZE } }],
    {
      compress: ORG_LOGO_QUALITY,
      format: SaveFormat.JPEG,
    },
  );
  return { uri: result.uri, mimeType: 'image/jpeg' };
}

/**
 * Compress payment-receipt screenshots (keep readable, cap width).
 */
export async function optimizePaymentProofImage(uri: string): Promise<{
  uri: string;
  mimeType: string;
}> {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: PAYMENT_PROOF_MAX_WIDTH } }],
    {
      compress: PAYMENT_PROOF_QUALITY,
      format: SaveFormat.JPEG,
    },
  );
  return { uri: result.uri, mimeType: 'image/jpeg' };
}
