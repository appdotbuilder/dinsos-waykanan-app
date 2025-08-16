import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { featuredProgramsTable } from '../db/schema';
import { type CreateFeaturedProgramInput } from '../schema';
import { getFeaturedPrograms } from '../handlers/get_featured_programs';

describe('getFeaturedPrograms', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testProgram1: CreateFeaturedProgramInput = {
    title: 'Program Bantuan Sosial',
    description: 'Program bantuan untuk keluarga tidak mampu',
    image_path: '/images/bantuan-sosial.jpg',
    target_beneficiaries: '1000 keluarga',
    budget: 500000000,
    is_active: true,
    order_index: 1
  };

  const testProgram2: CreateFeaturedProgramInput = {
    title: 'Program Beasiswa Pendidikan',
    description: 'Beasiswa untuk siswa berprestasi',
    image_path: '/images/beasiswa.jpg',
    target_beneficiaries: '500 siswa',
    budget: 250000000,
    is_active: true,
    order_index: 2
  };

  const inactiveProgram: CreateFeaturedProgramInput = {
    title: 'Program Tidak Aktif',
    description: 'Program yang sudah tidak aktif',
    image_path: null,
    target_beneficiaries: null,
    budget: null,
    is_active: false,
    order_index: 3
  };

  it('should return active featured programs ordered by order_index', async () => {
    // Create test programs
    await db.insert(featuredProgramsTable)
      .values([
        {
          ...testProgram2,
          budget: testProgram2.budget?.toString() ?? null
        },
        {
          ...testProgram1,
          budget: testProgram1.budget?.toString() ?? null
        }
      ])
      .execute();

    const result = await getFeaturedPrograms();

    expect(result).toHaveLength(2);
    
    // Should be ordered by order_index (1, 2)
    expect(result[0].title).toBe('Program Bantuan Sosial');
    expect(result[0].order_index).toBe(1);
    expect(result[1].title).toBe('Program Beasiswa Pendidikan');
    expect(result[1].order_index).toBe(2);

    // Check all fields
    expect(result[0].description).toBe('Program bantuan untuk keluarga tidak mampu');
    expect(result[0].image_path).toBe('/images/bantuan-sosial.jpg');
    expect(result[0].target_beneficiaries).toBe('1000 keluarga');
    expect(result[0].budget).toBe(500000000);
    expect(typeof result[0].budget).toBe('number');
    expect(result[0].is_active).toBe(true);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should exclude inactive programs', async () => {
    // Create both active and inactive programs
    await db.insert(featuredProgramsTable)
      .values([
        {
          ...testProgram1,
          budget: testProgram1.budget?.toString() ?? null
        },
        {
          ...inactiveProgram,
          budget: null
        }
      ])
      .execute();

    const result = await getFeaturedPrograms();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Program Bantuan Sosial');
    expect(result[0].is_active).toBe(true);
  });

  it('should handle programs with null budget', async () => {
    const programWithNullBudget = {
      ...testProgram1,
      budget: null
    };

    await db.insert(featuredProgramsTable)
      .values({
        ...programWithNullBudget,
        budget: null
      })
      .execute();

    const result = await getFeaturedPrograms();

    expect(result).toHaveLength(1);
    expect(result[0].budget).toBeNull();
    expect(result[0].title).toBe('Program Bantuan Sosial');
  });

  it('should handle programs with null optional fields', async () => {
    const minimalProgram: CreateFeaturedProgramInput = {
      title: 'Program Minimal',
      description: 'Program dengan field minimal',
      image_path: null,
      target_beneficiaries: null,
      budget: null,
      is_active: true,
      order_index: 1
    };

    await db.insert(featuredProgramsTable)
      .values({
        ...minimalProgram,
        budget: null
      })
      .execute();

    const result = await getFeaturedPrograms();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Program Minimal');
    expect(result[0].image_path).toBeNull();
    expect(result[0].target_beneficiaries).toBeNull();
    expect(result[0].budget).toBeNull();
  });

  it('should return empty array when no active programs exist', async () => {
    // Create only inactive programs
    await db.insert(featuredProgramsTable)
      .values({
        ...inactiveProgram,
        budget: null
      })
      .execute();

    const result = await getFeaturedPrograms();

    expect(result).toHaveLength(0);
  });

  it('should maintain correct order with multiple programs', async () => {
    // Create programs in random order
    const programs = [
      { ...testProgram1, order_index: 3, budget: testProgram1.budget?.toString() ?? null },
      { ...testProgram2, order_index: 1, budget: testProgram2.budget?.toString() ?? null },
      { 
        title: 'Program Kesehatan',
        description: 'Program bantuan kesehatan',
        image_path: '/images/kesehatan.jpg',
        target_beneficiaries: '2000 orang',
        budget: '750000000',
        is_active: true,
        order_index: 2
      }
    ];

    await db.insert(featuredProgramsTable)
      .values(programs)
      .execute();

    const result = await getFeaturedPrograms();

    expect(result).toHaveLength(3);
    
    // Should be ordered by order_index: 1, 2, 3
    expect(result[0].order_index).toBe(1);
    expect(result[0].title).toBe('Program Beasiswa Pendidikan');
    
    expect(result[1].order_index).toBe(2);
    expect(result[1].title).toBe('Program Kesehatan');
    
    expect(result[2].order_index).toBe(3);
    expect(result[2].title).toBe('Program Bantuan Sosial');
  });

  it('should handle numeric budget conversion correctly', async () => {
    await db.insert(featuredProgramsTable)
      .values({
        ...testProgram1,
        budget: '1234567890.50' // Large number with decimal
      })
      .execute();

    const result = await getFeaturedPrograms();

    expect(result).toHaveLength(1);
    expect(result[0].budget).toBe(1234567890.5);
    expect(typeof result[0].budget).toBe('number');
  });
});