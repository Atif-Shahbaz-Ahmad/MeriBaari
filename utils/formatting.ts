export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function formatWaitTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} hr`;
  return `${hours} hr ${remaining} min`;
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function maskDestination(value: string, channel: 'phone' | 'email'): string {
  if (channel === 'email') {
    const [local, domain] = value.split('@');
    if (!domain) return value;
    return `${local.slice(0, 2)}***@${domain}`;
  }
  if (value.length < 4) return value;
  return `${value.slice(0, -4).replace(/\d/g, '•')}${value.slice(-4)}`;
}

export function formatTicketDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTicketTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PK', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PK', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
