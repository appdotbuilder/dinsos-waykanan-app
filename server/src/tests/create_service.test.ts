import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput } from '../schema';
import { createService } from '../handlers/create_service';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateServiceInput = {
  title: 'Bantuan Kesehatan',
  description: 'Layanan bantuan kesehatan untuk masyarakat kurang mampu',
  icon: 'health-icon.svg',
  is_active: true,
  order_index: 1
};

describe('createService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a service with all fields', async () => {
    const result = await createService(testInput);

    // Basic field validation
    expect(result.title).toEqual('Bantuan Kesehatan');
    expect(result.description).toEqual(testInput.description);
    expect(result.icon).toEqual('health-icon.svg');
    expect(result.is_active).toEqual(true);
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save service to database', async () => {
    const result = await createService(testInput);

    // Query using proper drizzle syntax
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(services).toHaveLength(1);
    expect(services[0].title).toEqual('Bantuan Kesehatan');
    expect(services[0].description).toEqual(testInput.description);
    expect(services[0].icon).toEqual('health-icon.svg');
    expect(services[0].is_active).toEqual(true);
    expect(services[0].order_index).toEqual(1);
    expect(services[0].created_at).toBeInstanceOf(Date);
    expect(services[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create service with null icon', async () => {
    const inputWithNullIcon: CreateServiceInput = {
      title: 'Bantuan Pendidikan',
      description: 'Program beasiswa untuk siswa berprestasi',
      icon: null,
      is_active: true,
      order_index: 2
    };

    const result = await createService(inputWithNullIcon);

    expect(result.title).toEqual('Bantuan Pendidikan');
    expect(result.description).toEqual(inputWithNullIcon.description);
    expect(result.icon).toBeNull();
    expect(result.is_active).toEqual(true);
    expect(result.order_index).toEqual(2);
    expect(result.id).toBeDefined();
  });

  it('should create service with default values applied by Zod', async () => {
    const minimalInput = {
      title: 'Bantuan Sosial',
      description: 'Program bantuan sosial untuk keluarga tidak mampu',
      icon: null
    } as CreateServiceInput; // Zod defaults: is_active=true, order_index=0

    const result = await createService(minimalInput);

    expect(result.title).toEqual('Bantuan Sosial');
    expect(result.description).toEqual(minimalInput.description);
    expect(result.icon).toBeNull();
    expect(result.is_active).toEqual(true); // Default from Zod
    expect(result.order_index).toEqual(0); // Default from Zod
    expect(result.id).toBeDefined();
  });

  it('should create inactive service', async () => {
    const inactiveInput: CreateServiceInput = {
      title: 'Bantuan Khusus',
      description: 'Layanan bantuan khusus yang sedang dalam pengembangan',
      icon: 'special-icon.png',
      is_active: false,
      order_index: 99
    };

    const result = await createService(inactiveInput);

    expect(result.title).toEqual('Bantuan Khusus');
    expect(result.is_active).toEqual(false);
    expect(result.order_index).toEqual(99);
    expect(result.id).toBeDefined();

    // Verify in database
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(services[0].is_active).toEqual(false);
  });

  it('should create multiple services with different order indices', async () => {
    const service1: CreateServiceInput = {
      title: 'Service 1',
      description: 'First service',
      icon: null,
      is_active: true,
      order_index: 1
    };

    const service2: CreateServiceInput = {
      title: 'Service 2', 
      description: 'Second service',
      icon: 'icon2.svg',
      is_active: true,
      order_index: 2
    };

    const result1 = await createService(service1);
    const result2 = await createService(service2);

    expect(result1.order_index).toEqual(1);
    expect(result2.order_index).toEqual(2);
    expect(result1.id).not.toEqual(result2.id);

    // Verify both services exist in database
    const allServices = await db.select()
      .from(servicesTable)
      .execute();

    expect(allServices).toHaveLength(2);
  });
});