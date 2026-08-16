'use client';

import { useState } from 'react';

import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { useDepartments, useServices } from '@/features/structure/hooks/use-structure-queries';
import { useCreateService, useUpdateService } from '@/features/structure/hooks/use-structure-mutations';
import { Button, Card, EmptyState, Input, LoadingSkeleton, StatusBadge } from '@web/components/ui';
import { formatPrice } from '@web/lib/cn';

function DepartmentServices({
  departmentId,
  departmentName,
}: {
  departmentId: string;
  departmentName: string;
}) {
  const services = useServices(departmentId);
  const update = useUpdateService();
  if (services.isLoading) return <LoadingSkeleton count={1} />;
  if (!services.data?.length) return <p className="text-sm text-ink-secondary">No services in {departmentName}.</p>;
  return (
    <ul className="space-y-2">
      {services.data.map((service) => (
        <li key={service.id}>
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{service.name}</p>
              <p className="text-sm text-ink-secondary">
                {departmentName} · {formatPrice(service.price) ?? 'No price'} ·{' '}
                {service.durationMinutes} min
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge
                label={service.isActive ? 'Active' : 'Inactive'}
                tone={service.isActive ? 'secondary' : 'muted'}
              />
              <Button
                variant="ghost"
                onClick={() =>
                  void update.mutateAsync({
                    id: service.id,
                    data: { isActive: !service.isActive },
                  })
                }
              >
                {service.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export default function BusinessServicesPage() {
  const org = useMyOrganization();
  const departments = useDepartments(org.data?.id);
  const create = useCreateService();
  const [departmentId, setDepartmentId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('15');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Services</h1>
      <Card className="space-y-3">
        <h2 className="font-semibold">Add service</h2>
        <select
          className="w-full rounded-xl border border-line bg-surface-input px-3 py-2"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
        >
          <option value="">Department</option>
          {(departments.data ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Price (optional)" value={price} onChange={(e) => setPrice(e.target.value)} />
        <Input
          label="Duration minutes"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <Button
          disabled={!departmentId || !name.trim() || create.isPending}
          onClick={() =>
            void create.mutateAsync({
              departmentId,
              name: name.trim(),
              price: price ? Number(price) : null,
              durationMinutes: Number(duration) || 15,
            })
          }
        >
          Create
        </Button>
      </Card>
      {departments.isLoading ? (
        <LoadingSkeleton />
      ) : departments.data?.length ? (
        departments.data.map((dept) => (
          <section key={dept.id} className="space-y-2">
            <h2 className="text-lg font-semibold">{dept.name}</h2>
            <DepartmentServices departmentId={dept.id} departmentName={dept.name} />
          </section>
        ))
      ) : (
        <EmptyState title="Create a department first" />
      )}
    </div>
  );
}
