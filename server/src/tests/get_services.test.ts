import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput } from '../schema';
import { getServices } from '../handlers/get_services';

// Test service data
const testService1: CreateServiceInput = {
  title: 'Bantuan Sosial Tunai',
  description: 'Program bantuan sosial tunai untuk keluarga tidak mampu',
  icon: 'money-icon',
  is_active: true,
  order_index: 1
};

const testService2: CreateServiceInput = {
  title: 'Bantuan Pendidikan',
  description: 'Program beasiswa dan bantuan pendidikan untuk siswa berprestasi',
  icon: 'education-icon',
  is_active: true,
  order_index: 2
};

const inactiveService: CreateServiceInput = {
  title: 'Layanan Non-Aktif',
  description: 'Layanan yang sedang tidak aktif',
  icon: 'inactive-icon',
  is_active: false,
  order_index: 0
};

describe('getServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no services exist', async () => {
    const result = await getServices();
    expect(result).toEqual([]);
  });

  it('should return only active services', async () => {
    // Create services with different active status
    await db.insert(servicesTable).values(testService1);
    await db.insert(servicesTable).values(inactiveService);

    const result = await getServices();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Bantuan Sosial Tunai');
    expect(result[0].is_active).toBe(true);
  });

  it('should return services ordered by order_index', async () => {
    // Insert services in reverse order
    await db.insert(servicesTable).values(testService2); // order_index: 2
    await db.insert(servicesTable).values(testService1); // order_index: 1

    const result = await getServices();

    expect(result).toHaveLength(2);
    // Should be ordered by order_index ascending
    expect(result[0].title).toEqual('Bantuan Sosial Tunai'); // order_index: 1
    expect(result[1].title).toEqual('Bantuan Pendidikan'); // order_index: 2
    expect(result[0].order_index).toBe(1);
    expect(result[1].order_index).toBe(2);
  });

  it('should return all service fields correctly', async () => {
    await db.insert(servicesTable).values(testService1);

    const result = await getServices();

    expect(result).toHaveLength(1);
    const service = result[0];

    expect(service.id).toBeDefined();
    expect(service.title).toEqual('Bantuan Sosial Tunai');
    expect(service.description).toEqual('Program bantuan sosial tunai untuk keluarga tidak mampu');
    expect(service.icon).toEqual('money-icon');
    expect(service.is_active).toBe(true);
    expect(service.order_index).toBe(1);
    expect(service.created_at).toBeInstanceOf(Date);
    expect(service.updated_at).toBeInstanceOf(Date);
  });

  it('should handle services with null icon field', async () => {
    const serviceWithoutIcon: CreateServiceInput = {
      title: 'Layanan Tanpa Icon',
      description: 'Layanan yang tidak memiliki icon',
      icon: null,
      is_active: true,
      order_index: 3
    };

    await db.insert(servicesTable).values(serviceWithoutIcon);

    const result = await getServices();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Layanan Tanpa Icon');
    expect(result[0].icon).toBe(null);
  });

  it('should handle multiple services with same order_index', async () => {
    const service1: CreateServiceInput = {
      title: 'Service A',
      description: 'Description A',
      icon: 'icon-a',
      is_active: true,
      order_index: 1
    };

    const service2: CreateServiceInput = {
      title: 'Service B', 
      description: 'Description B',
      icon: 'icon-b',
      is_active: true,
      order_index: 1
    };

    await db.insert(servicesTable).values(service1);
    await db.insert(servicesTable).values(service2);

    const result = await getServices();

    expect(result).toHaveLength(2);
    // Both should have same order_index
    expect(result[0].order_index).toBe(1);
    expect(result[1].order_index).toBe(1);
  });

  it('should exclude inactive services from results', async () => {
    await db.insert(servicesTable).values(testService1);
    await db.insert(servicesTable).values(testService2);
    await db.insert(servicesTable).values(inactiveService);

    const result = await getServices();

    expect(result).toHaveLength(2);
    // Verify no inactive services are returned
    result.forEach(service => {
      expect(service.is_active).toBe(true);
      expect(service.title).not.toEqual('Layanan Non-Aktif');
    });
  });
});