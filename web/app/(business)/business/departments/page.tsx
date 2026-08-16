'use client';

import { useState } from 'react';

import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { useDepartments } from '@/features/structure/hooks/use-structure-queries';
import { useCreateDepartment } from '@/features/structure/hooks/use-structure-mutations';
import { useBusinessQueues } from '@/features/queue/hooks/use-queue-queries';
import { Button, Card, EmptyState, Input, LoadingSkeleton } from '@web/components/ui';

export default function BusinessDepartmentsPage() {
  const org = useMyOrganization();
  const departments = useDepartments(org.data?.id);
  const queues = useBusinessQueues(org.data?.id);
  const create = useCreateDepartment();
  const [name, setName] = useState('');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Departments</h1>
      <Card className="space-y-3">
        <Input label="New department" value={name} onChange={(e) => setName(e.target.value)} />
        <Button
          disabled={!org.data || !name.trim() || create.isPending}
          onClick={() =>
            void create.mutateAsync({
              organizationId: org.data!.id,
              name: name.trim(),
            })
          }
        >
          Create
        </Button>
      </Card>
      {departments.isLoading ? (
        <LoadingSkeleton />
      ) : departments.data?.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {departments.data.map((dept) => {
            const related = (queues.data ?? []).filter(
              (q) => q.departmentName === dept.name,
            );
            return (
              <Card key={dept.id}>
                <p className="font-semibold">{dept.name}</p>
                <p className="text-sm text-ink-secondary">
                  {related.length} queue{related.length === 1 ? '' : 's'}
                </p>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No departments yet" />
      )}
    </div>
  );
}
