import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteService } from '../handlers/delete_service';

// Test service data
const testService = {
  title: 'Test Service',
  description: 'A service for testing',
  icon: 'test-icon',
  is_active: true,
  order_index: 1
};

describe('deleteService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing service', async () => {
    // Create a test service first
    const [createdService] = await db.insert(servicesTable)
      .values(testService)
      .returning()
      .execute();

    // Delete the service
    const result = await deleteService(createdService.id);

    expect(result).toBe(true);

    // Verify service is deleted from database
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, createdService.id))
      .execute();

    expect(services).toHaveLength(0);
  });

  it('should return false when service does not exist', async () => {
    // Try to delete non-existent service
    const result = await deleteService(999);

    expect(result).toBe(false);
  });

  it('should not affect other services when deleting one', async () => {
    // Create multiple test services
    const service1 = await db.insert(servicesTable)
      .values({ ...testService, title: 'Service 1' })
      .returning()
      .execute();

    const service2 = await db.insert(servicesTable)
      .values({ ...testService, title: 'Service 2' })
      .returning()
      .execute();

    const service3 = await db.insert(servicesTable)
      .values({ ...testService, title: 'Service 3' })
      .returning()
      .execute();

    // Delete one service
    const result = await deleteService(service2[0].id);

    expect(result).toBe(true);

    // Verify only the target service was deleted
    const remainingServices = await db.select()
      .from(servicesTable)
      .execute();

    expect(remainingServices).toHaveLength(2);
    expect(remainingServices.map(s => s.title).sort()).toEqual(['Service 1', 'Service 3']);

    // Verify the deleted service is not found
    const deletedService = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, service2[0].id))
      .execute();

    expect(deletedService).toHaveLength(0);
  });

  it('should handle deletion of service with different properties', async () => {
    // Create service with different properties
    const specialService = {
      title: 'Special Service',
      description: 'Service with special properties',
      icon: null, // null icon
      is_active: false, // inactive service
      order_index: 99
    };

    const [createdService] = await db.insert(servicesTable)
      .values(specialService)
      .returning()
      .execute();

    // Delete the service
    const result = await deleteService(createdService.id);

    expect(result).toBe(true);

    // Verify deletion
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, createdService.id))
      .execute();

    expect(services).toHaveLength(0);
  });
});