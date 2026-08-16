'use client';

import { useParams, useRouter } from 'next/navigation';

import { getQueueErrorMessage } from '@/domain/errors/queue-error';
import { useService } from '@/features/structure/hooks/use-structure-queries';
import { useQueueJoinPreview } from '@/features/queue/hooks/use-queue-queries';
import { useJoinQueue } from '@/features/queue/hooks/use-queue-mutations';
import { Button, Card, ErrorState, LoadingSkeleton, StatusBadge } from '@web/components/ui';
import { formatPrice } from '@web/lib/cn';

export default function ConfirmJoinPage() {
  const params = useParams<{ orgId: string; serviceId: string }>();
  const router = useRouter();
  const service = useService(params.serviceId);
  const preview = useQueueJoinPreview(params.serviceId);
  const join = useJoinQueue();

  if (service.isLoading || preview.isLoading) return <LoadingSkeleton />;
  if (!service.data) {
    return <ErrorState title="Service not found" />;
  }

  return (
    <Card className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Confirm join</h1>
      <p className="font-semibold">{service.data.name}</p>
      <p className="text-sm text-ink-secondary">
        {formatPrice(service.data.price) ?? 'Price on request'}
      </p>
      {preview.data ? (
        <div className="space-y-1 text-sm">
          <StatusBadge label={preview.data.queueStatus} />
          <p>Waiting: {preview.data.waitingCount}</p>
          {preview.data.estimatedWaitMinutes ? (
            <p>Est. wait {preview.data.estimatedWaitMinutes} min</p>
          ) : null}
        </div>
      ) : null}
      {join.error ? (
        <p className="text-sm text-danger">{getQueueErrorMessage(join.error)}</p>
      ) : null}
      <Button
        disabled={join.isPending}
        onClick={async () => {
          const ticket = await join.mutateAsync({ serviceId: params.serviceId });
          router.replace(`/customer/tickets?joined=${ticket.id}`);
        }}
      >
        Get ticket
      </Button>
    </Card>
  );
}
