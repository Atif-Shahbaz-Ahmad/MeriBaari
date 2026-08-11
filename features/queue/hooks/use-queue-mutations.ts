import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getContainer } from '@/data';
import type { JoinQueueInput } from '@/domain/repositories';
import {
  queueQueryKeys,
  ticketQueryKeys,
} from '@/features/queue/query-keys';

function invalidateQueueAndTickets(
  queryClient: ReturnType<typeof useQueryClient>,
  queueId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: ticketQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: queueQueryKeys.all });
  if (queueId) {
    void queryClient.invalidateQueries({
      queryKey: queueQueryKeys.detail(queueId),
    });
    void queryClient.invalidateQueries({
      queryKey: queueQueryKeys.entries(queueId),
    });
    void queryClient.invalidateQueries({
      queryKey: queueQueryKeys.waiting(queueId),
    });
  }
}

export function useJoinQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: JoinQueueInput) =>
      getContainer().ticketService.joinQueue(input),
    onSuccess: (ticket) => {
      queryClient.setQueryData(ticketQueryKeys.detail(ticket.id), ticket);
      queryClient.setQueryData(ticketQueryKeys.active, ticket);
      invalidateQueueAndTickets(queryClient, ticket.queueId);
    },
  });
}

export function useCancelQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) =>
      getContainer().ticketService.cancel(ticketId),
    onSuccess: (ticket) => {
      queryClient.setQueryData(ticketQueryKeys.detail(ticket.id), ticket);
      invalidateQueueAndTickets(queryClient, ticket.queueId);
    },
  });
}

export function useCallNext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queueId: string) =>
      getContainer().queueService.callNextCustomer(queueId),
    onSuccess: (_result, queueId) => {
      invalidateQueueAndTickets(queryClient, queueId);
    },
  });
}

export function useStartServing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) =>
      getContainer().queueService.startServing(entryId),
    onSuccess: () => {
      invalidateQueueAndTickets(queryClient);
    },
  });
}

export function useServeCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) =>
      getContainer().queueService.serveCustomer(entryId),
    onSuccess: () => {
      invalidateQueueAndTickets(queryClient);
    },
  });
}

export function useSkipCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) =>
      getContainer().queueService.skipCustomer(entryId),
    onSuccess: () => {
      invalidateQueueAndTickets(queryClient);
    },
  });
}

export function usePauseQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queueId: string) =>
      getContainer().queueService.pauseQueue(queueId),
    onSuccess: (queue) => {
      queryClient.setQueryData(queueQueryKeys.detail(queue.id), queue);
      invalidateQueueAndTickets(queryClient, queue.id);
    },
  });
}

export function useResumeQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queueId: string) =>
      getContainer().queueService.resumeQueue(queueId),
    onSuccess: (queue) => {
      queryClient.setQueryData(queueQueryKeys.detail(queue.id), queue);
      invalidateQueueAndTickets(queryClient, queue.id);
    },
  });
}

export function useCloseQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queueId: string) =>
      getContainer().queueService.closeQueue(queueId),
    onSuccess: (queue) => {
      queryClient.setQueryData(queueQueryKeys.detail(queue.id), queue);
      invalidateQueueAndTickets(queryClient, queue.id);
    },
  });
}
