'use client';

import { useState } from 'react';

import { ORGANIZATION_CATEGORY_OPTIONS } from '@/constants/organization-categories';
import { isOrganizationPublic } from '@/domain/models';
import {
  useActivateOrganization,
  useCreateOrganization,
  useDeactivateOrganization,
  useUpdateOrganization,
} from '@/features/organization/hooks/use-organization-mutations';
import { useMyOrganization } from '@/features/organization/hooks/use-organizations';
import { useTranslation } from '@/hooks/use-translation';
import { Button, Card, Input, LoadingSkeleton } from '@web/components/ui';
import { LocationMap } from '@web/components/LocationMap';
import type { OrganizationCategory } from '@/types/organization';

export default function BusinessProfilePage() {
  const { t } = useTranslation();
  const orgQuery = useMyOrganization();
  const create = useCreateOrganization();
  const update = useUpdateOrganization();
  const activate = useActivateOrganization();
  const deactivate = useDeactivateOrganization();
  const org = orgQuery.data;
  const [name, setName] = useState(org?.name ?? '');
  const [city, setCity] = useState(org?.city ?? '');
  const [address, setAddress] = useState(org?.address ?? '');
  const [description, setDescription] = useState(org?.description ?? '');
  const [category, setCategory] = useState<OrganizationCategory>('other');

  if (orgQuery.isLoading) return <LoadingSkeleton />;

  if (!org) {
    return (
      <Card className="space-y-3">
        <h1 className="text-2xl font-bold">Create your business</h1>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <select
          className="w-full rounded-xl border border-line bg-surface-input px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value as OrganizationCategory)}
        >
          {ORGANIZATION_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <Button
          disabled={create.isPending || name.trim().length < 2}
          onClick={() =>
            void create.mutateAsync({
              name: name.trim(),
              category,
              city,
              address,
            })
          }
        >
          Create
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{org.name}</h1>
      <Card
        className={
          isOrganizationPublic(org)
            ? 'border-emerald-400 bg-emerald-50 dark:bg-[#14532D]'
            : 'border-amber-300 bg-amber-50 dark:bg-[#422006]'
        }
      >
        <p className="font-semibold text-ink">
          {org.adminHidden
            ? t('subscription.status.adminHiddenTitle')
            : isOrganizationPublic(org)
              ? t('subscription.status.activeTitle')
              : t('subscription.status.activeHiddenTitle')}
        </p>
        <p className="mt-1 text-sm text-ink">
          {org.adminHidden
            ? t('subscription.status.adminHiddenBody')
            : isOrganizationPublic(org)
              ? t('subscription.status.activeBody')
              : t('subscription.status.activeHiddenBody')}
        </p>
      </Card>
      <Card className="space-y-3">
        <Input label="Name" defaultValue={org.name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Description"
          defaultValue={org.description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input label="City" defaultValue={org.city} onChange={(e) => setCity(e.target.value)} />
        <Input
          label="Address"
          defaultValue={org.address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <LocationMap
          latitude={org.latitude}
          longitude={org.longitude}
          label={org.name}
          address={address || org.address}
        />
        <Button
          onClick={() =>
            void update.mutateAsync({
              id: org.id,
              data: {
                name: name || org.name,
                description,
                city: city || org.city,
                address: address || org.address,
              },
            })
          }
        >
          Save
        </Button>
        {org.isActive ? (
          <Button variant="ghost" onClick={() => void deactivate.mutateAsync(org.id)}>
            Hide from customers
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => void activate.mutateAsync(org.id)}>
            Make active
          </Button>
        )}
      </Card>
    </div>
  );
}
