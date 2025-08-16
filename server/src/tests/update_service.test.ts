import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type UpdateServiceInput } from '../schema';
import { updateService } from '../handlers/update_service';
import { eq } from 'drizzle-orm';

describe('updateService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testServiceId: number;

  beforeEach(async () => {
    // Create a test service to update
    const result = await db.insert(servicesTable)
      .values({
        title: 'Original Service',
        description: 'Original description',
        icon: 'original-icon',
        is_active: true,
        order_index: 1
      })
      .returning()
      .execute();

    testServiceId = result[0].id;
  });

  it('should update service with all fields', async () => {
    const input: UpdateServiceInput = {
      id: testServiceId,
      title: 'Updated Service Title',
      description: 'Updated description',
      icon: 'updated-icon',
      is_active: false,
      order_index: 5
    };

    const result = await updateService(input);

    expect(result.id).toEqual(testServiceId);
    expect(result.title).toEqual('Updated Service Title');
    expect(result.description).toEqual('Updated description');
    expect(result.icon).toEqual('updated-icon');
    expect(result.is_active).toEqual(false);
    expect(result.order_index).toEqual(5);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update service with partial fields', async () => {
    const input: UpdateServiceInput = {
      id: testServiceId,
      title: 'Partially Updated Title',
      is_active: false
    };

    const result = await updateService(input);

    expect(result.id).toEqual(testServiceId);
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.icon).toEqual('original-icon'); // Should remain unchanged
    expect(result.is_active).toEqual(false);
    expect(result.order_index).toEqual(1); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only the description', async () => {
    const input: UpdateServiceInput = {
      id: testServiceId,
      description: 'Only description updated'
    };

    const result = await updateService(input);

    expect(result.id).toEqual(testServiceId);
    expect(result.title).toEqual('Original Service');
    expect(result.description).toEqual('Only description updated');
    expect(result.icon).toEqual('original-icon');
    expect(result.is_active).toEqual(true);
    expect(result.order_index).toEqual(1);
  });

  it('should update icon to null', async () => {
    const input: UpdateServiceInput = {
      id: testServiceId,
      icon: null
    };

    const result = await updateService(input);

    expect(result.icon).toBeNull();
    expect(result.title).toEqual('Original Service'); // Other fields unchanged
  });

  it('should update order_index to zero', async () => {
    const input: UpdateServiceInput = {
      id: testServiceId,
      order_index: 0
    };

    const result = await updateService(input);

    expect(result.order_index).toEqual(0);
    expect(result.title).toEqual('Original Service'); // Other fields unchanged
  });

  it('should save updated service to database', async () => {
    const input: UpdateServiceInput = {
      id: testServiceId,
      title: 'Database Updated Title',
      is_active: false
    };

    await updateService(input);

    // Verify the update was persisted
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, testServiceId))
      .execute();

    expect(services).toHaveLength(1);
    expect(services[0].title).toEqual('Database Updated Title');
    expect(services[0].is_active).toEqual(false);
    expect(services[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Get the original service
    const originalService = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, testServiceId))
      .execute();

    const originalUpdatedAt = originalService[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateServiceInput = {
      id: testServiceId,
      title: 'Timestamp Test'
    };

    const result = await updateService(input);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error for non-existent service', async () => {
    const input: UpdateServiceInput = {
      id: 99999, // Non-existent ID
      title: 'Will not work'
    };

    await expect(updateService(input)).rejects.toThrow(/Service with id 99999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    const input: UpdateServiceInput = {
      id: testServiceId
      // No other fields provided
    };

    const result = await updateService(input);

    // Should return the service with only updated_at changed
    expect(result.id).toEqual(testServiceId);
    expect(result.title).toEqual('Original Service');
    expect(result.description).toEqual('Original description');
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});