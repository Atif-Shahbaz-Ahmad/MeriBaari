/**
 * Temporary DEV-only push registration diagnostics (Prompt 4.8).
 * Safe logs only — never logs secrets, auth tokens, or full push tokens.
 */

type PushDiagStage =
  | 'bootstrap'
  | 'auto_register'
  | 'after_join'
  | 'permission'
  | 'channel'
  | 'project_id'
  | 'expo_token'
  | 'supabase_rpc'
  | 'register_for_user';

function redactToken(token: string | null | undefined): string {
  if (!token) return '(empty)';
  if (token.length <= 16) return `(len=${token.length})`;
  return `${token.slice(0, 12)}…${token.slice(-4)} (len=${token.length})`;
}

export function pushDiag(
  stage: PushDiagStage,
  message: string,
  details?: Record<string, unknown>,
): void {
  if (!__DEV__) return;
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.log(`[push:diag][${stage}] ${message}${payload}`);
}

export function pushDiagError(
  stage: PushDiagStage,
  message: string,
  error: unknown,
): void {
  if (!__DEV__) return;
  const err =
    error instanceof Error
      ? { name: error.name, message: error.message }
      : { message: String(error) };
  console.warn(`[push:diag][${stage}] ${message}`, err);
}

export { redactToken };
