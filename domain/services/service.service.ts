import type { ServiceRepository } from '@/domain/repositories';

export class ServiceService {
  constructor(private readonly services: ServiceRepository) {}

  getById(id: string) {
    return this.services.getById(id);
  }

  listByDepartment(departmentId: string) {
    return this.services.listByDepartment(departmentId);
  }

  listByIds(ids: string[]) {
    return this.services.listByIds(ids);
  }
}
