import { useQuery } from '@tanstack/react-query';

import { getContainer } from '@/data';
import {
  queueQueryKeys,
  ticketQueryKeys,
} from '@/features/queue/query-keys';

export function useQueue(queueId: string | undefined) {
  return useQuery({
    queryKey: queueQueryKeys.detail(queueId ?? ''),
    queryFn: () => getContainer().queueService.getQueueById(queueId!),
    enabled: Boolean(queueId),
  });
}

export function useQueueByService(serviceId: string | undefined) {
  return useQuery({
    queryKey: queueQueryKeys.byService(serviceId ?? ''),
    queryFn: () => getContainer().queueService.getQueueByService(serviceId!),
    enabled: Boolean(serviceId),
  });
}

export function useOrganizationQueues(organizationId: string | undefined) {
  return useQuery({
    queryKey: queueQueryKeys.organization(organizationId ?? ''),
    queryFn: () =>
      getContainer().queueService.getOrganizationQueues(organizationId!),
    enabled: Boolean(organizationId),
  });
}

export function useBusinessQueues(organizationId: string | undefined) {
  return useQuery({
    queryKey: queueQueryKeys.business(organizationId),
    queryFn: () =>
      getContainer().queueService.listBusinessQueues(organizationId),
    enabled: Boolean(organizationId),
  });
}

export function useBusinessQueueDetails(queueId: string | undefined) {
  return useQuery({
    queryKey: queueQueryKeys.businessDetail(queueId ?? ''),
    queryFn: () =>
      getContainer().queueService.getBusinessQueueDetails(queueId!),
    enabled: Boolean(queueId),
  });
}

export function useQueueEntries(queueId: string | undefined) {
  return useQuery({
    queryKey: queueQueryKeys.entries(queueId ?? ''),
    queryFn: () => getContainer().queueService.getQueueEntries(queueId!),
    enabled: Boolean(queueId),
  });
}

export function useWaitingCustomers(queueId: string | undefined) {
  return useQuery({
    queryKey: queueQueryKeys.waiting(queueId),
    queryFn: () =>
      getContainer().queueService.listWaitingCustomers(queueId),
    enabled: Boolean(queueId),
  });
}

export function useQueueJoinPreview(serviceId: string | undefined) {
  return useQuery({
    queryKey: queueQueryKeys.preview(serviceId ?? ''),
    queryFn: () => getContainer().ticketService.getJoinPreview(serviceId!),
    enabled: Boolean(serviceId),
  });
}

export function useMyTickets() {
  return useQuery({
    queryKey: ticketQueryKeys.mine,
    queryFn: () => getContainer().ticketService.getMyTickets(),
  });
}

export function useMyActiveTicket() {
  return useQuery({
    queryKey: ticketQueryKeys.active,
    queryFn: () => getContainer().ticketService.getActiveTicket(),
  });
}

export function useTicket(ticketId: string | undefined) {
  return useQuery({
    queryKey: ticketQueryKeys.detail(ticketId ?? ''),
    queryFn: () => getContainer().ticketService.getTicketById(ticketId!),
    enabled: Boolean(ticketId),
  });
}

export function useTicketProgress(ticketId: string | undefined) {
  return useQuery({
    queryKey: ticketQueryKeys.progress(ticketId ?? ''),
    queryFn: () =>
      getContainer().queueService.getProgressByTicketId(ticketId!),
    enabled: Boolean(ticketId),
  });
}
