export async function optimizeAvatarImage(uri: string): Promise<{
  uri: string;
  mimeType: string;
}> {
  return { uri, mimeType: 'image/jpeg' };
}

export async function optimizeOrganizationLogoImage(uri: string): Promise<{
  uri: string;
  mimeType: string;
}> {
  return { uri, mimeType: 'image/jpeg' };
}

export async function optimizePaymentProofImage(uri: string): Promise<{
  uri: string;
  mimeType: string;
}> {
  return { uri, mimeType: 'image/jpeg' };
}
