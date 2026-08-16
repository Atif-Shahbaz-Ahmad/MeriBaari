export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function homeForRole(role: string | null | undefined): string {
  if (role === 'business') return '/business/dashboard';
  if (role === 'admin') return '/admin';
  if (role === 'customer') return '/customer/home';
  return '/role-select';
}

export function formatPrice(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return `Rs ${value.toLocaleString('en-PK')}`;
}
