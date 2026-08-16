export const reviewsQueryKeys = {
  all: ['reviews'] as const,
  byOrganization: (organizationId: string) =>
    ['reviews', 'organization', organizationId] as const,
  byTicket: (ticketId: string) => ['reviews', 'ticket', ticketId] as const,
  reviewedTicketIds: (userId?: string) =>
    ['reviews', 'reviewed-ticket-ids', userId ?? 'anon'] as const,
};
