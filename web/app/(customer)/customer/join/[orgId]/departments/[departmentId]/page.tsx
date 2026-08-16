'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useDepartment, useServices } from '@/features/structure/hooks/use-structure-queries';
import { Card, EmptyState, LoadingSkeleton } from '@web/components/ui';
import { formatPrice } from '@web/lib/cn';

export default function DepartmentServicesPage() {
  const params = useParams<{ orgId: string; departmentId: string }>();
  const department = useDepartment(params.departmentId);
  const services = useServices(params.departmentId, { activeOnly: true });

  if (department.isLoading || services.isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{department.data?.name ?? 'Services'}</h1>
      {services.data?.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {services.data.map((service) => (
            <Card key={service.id} className="space-y-2">
              <p className="font-semibold">{service.name}</p>
              <p className="text-sm text-ink-secondary">
                {formatPrice(service.price) ?? 'Price on request'}
                {service.estimatedDurationMinutes
                  ? ` · ${service.estimatedDurationMinutes} min`
                  : ''}
              </p>
              <Link
                className="text-sm font-semibold text-primary"
                href={`/customer/join/${params.orgId}/confirm/${service.id}`}
              >
                Join queue
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No services" />
      )}
    </div>
  );
}
