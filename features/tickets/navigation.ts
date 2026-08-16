import { router, type Href } from 'expo-router';

import { AuthHref } from '@/features/auth/navigation';

/** Ticket Experience hrefs — cast until Expo typed routes regenerate. */
export const TicketHref = {
  detail: (id: string) => `/tickets/${id}` as Href,
  progress: (id: string) => `/tickets/${id}/progress` as Href,
  history: '/tickets/history' as Href,
  list: AuthHref.customerTickets,
};

export function pushTicketDetail(id: string) {
  router.push(TicketHref.detail(id));
}

export function pushTicketProgress(id: string) {
  router.push(TicketHref.progress(id));
}

export function pushTicketHistory() {
  router.push(TicketHref.history);
}

export function pushRateTicket(ticketId: string) {
  router.push(`/tickets/${ticketId}/rate` as Href);
}

export function replaceTicketDetail(id: string) {
  router.replace(TicketHref.detail(id));
}
