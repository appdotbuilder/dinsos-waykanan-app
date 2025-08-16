import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { featuredProgramsTable } from '../db/schema';
import { type CreateFeaturedProgramInput } from '../schema';
import { createFeaturedProgram } from '../handlers/create_featured_program';
import { eq } from 'drizzle-orm';

// Test inputs
const basicTestInput: CreateFeaturedProgramInput = {
  title: 'Program Bantuan Pendidikan',
  description: 'Program bantuan pendidikan untuk siswa kurang mampu',
  image_path: '/images/education-program.jpg',
  target_beneficiaries: 'Siswa SD, SMP, SMA dari keluarga kurang mampu',
  budget: 500000000.50,
  is_active: true,
  order_index: 1
};

const minimalTestInput: CreateFeaturedProgramInput = {
  title: 'Program Minimal',
  description: 'Deskripsi program minimal',
  image_path: null,
  target_beneficiaries: null,
  budget: null,
  is_active: true,
  order_index: 0
};

const programWithDefaults: CreateFeaturedProgramInput = {
  title: 'Program dengan Default',
  description: 'Program yang menggunakan nilai default',
  image_path: null,
  target_beneficiaries: null,
  budget: null,
  is_active: true,
  order_index: 0
};

describe('createFeaturedProgram', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a featured program with complete data', async () => {
    const result = await createFeaturedProgram(basicTestInput);

    // Basic field validation
    expect(result.title).toEqual('Program Bantuan Pendidikan');
    expect(result.description).toEqual(basicTestInput.description);
    expect(result.image_path).toEqual('/images/education-program.jpg');
    expect(result.target_beneficiaries).toEqual('Siswa SD, SMP, SMA dari keluarga kurang mampu');
    expect(result.budget).toEqual(500000000.50);
    expect(typeof result.budget).toEqual('number');
    expect(result.is_active).toEqual(true);
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a featured program with minimal data', async () => {
    const result = await createFeaturedProgram(minimalTestInput);

    // Basic field validation
    expect(result.title).toEqual('Program Minimal');
    expect(result.description).toEqual('Deskripsi program minimal');
    expect(result.image_path).toBeNull();
    expect(result.target_beneficiaries).toBeNull();
    expect(result.budget).toBeNull();
    expect(result.is_active).toEqual(true);
    expect(result.order_index).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a featured program with default-like values', async () => {
    const result = await createFeaturedProgram(programWithDefaults);

    // Check basic fields and default-like values
    expect(result.title).toEqual('Program dengan Default');
    expect(result.description).toEqual('Program yang menggunakan nilai default');
    expect(result.is_active).toEqual(true);
    expect(result.order_index).toEqual(0);
    expect(result.image_path).toBeNull();
    expect(result.target_beneficiaries).toBeNull();
    expect(result.budget).toBeNull();
  });

  it('should save featured program to database', async () => {
    const result = await createFeaturedProgram(basicTestInput);

    // Query using proper drizzle syntax
    const programs = await db.select()
      .from(featuredProgramsTable)
      .where(eq(featuredProgramsTable.id, result.id))
      .execute();

    expect(programs).toHaveLength(1);
    expect(programs[0].title).toEqual('Program Bantuan Pendidikan');
    expect(programs[0].description).toEqual(basicTestInput.description);
    expect(programs[0].image_path).toEqual('/images/education-program.jpg');
    expect(programs[0].target_beneficiaries).toEqual('Siswa SD, SMP, SMA dari keluarga kurang mampu');
    expect(parseFloat(programs[0].budget!)).toEqual(500000000.50); // Database stores as string
    expect(programs[0].is_active).toEqual(true);
    expect(programs[0].order_index).toEqual(1);
    expect(programs[0].created_at).toBeInstanceOf(Date);
    expect(programs[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null values correctly in database', async () => {
    const result = await createFeaturedProgram(minimalTestInput);

    // Verify in database
    const programs = await db.select()
      .from(featuredProgramsTable)
      .where(eq(featuredProgramsTable.id, result.id))
      .execute();

    expect(programs).toHaveLength(1);
    expect(programs[0].image_path).toBeNull();
    expect(programs[0].target_beneficiaries).toBeNull();
    expect(programs[0].budget).toBeNull();
  });

  it('should handle large budget amounts correctly', async () => {
    const largebudgetInput: CreateFeaturedProgramInput = {
      title: 'Program Budget Besar',
      description: 'Program dengan budget yang sangat besar',
      image_path: null,
      target_beneficiaries: null,
      budget: 999999999999.99, // Very large budget
      is_active: true,
      order_index: 0
    };

    const result = await createFeaturedProgram(largebudgetInput);

    expect(result.budget).toEqual(999999999999.99);
    expect(typeof result.budget).toEqual('number');

    // Verify in database
    const programs = await db.select()
      .from(featuredProgramsTable)
      .where(eq(featuredProgramsTable.id, result.id))
      .execute();

    expect(parseFloat(programs[0].budget!)).toEqual(999999999999.99);
  });

  it('should handle decimal budget values correctly', async () => {
    const decimalBudgetInput: CreateFeaturedProgramInput = {
      title: 'Program Budget Desimal',
      description: 'Program dengan budget desimal',
      image_path: null,
      target_beneficiaries: null,
      budget: 1234567.89,
      is_active: true,
      order_index: 0
    };

    const result = await createFeaturedProgram(decimalBudgetInput);

    expect(result.budget).toEqual(1234567.89);
    expect(typeof result.budget).toEqual('number');

    // Verify precision is maintained in database
    const programs = await db.select()
      .from(featuredProgramsTable)
      .where(eq(featuredProgramsTable.id, result.id))
      .execute();

    expect(parseFloat(programs[0].budget!)).toEqual(1234567.89);
  });

  it('should create multiple featured programs with different order indices', async () => {
    const program1Input: CreateFeaturedProgramInput = {
      title: 'Program Pertama',
      description: 'Deskripsi program pertama',
      image_path: null,
      target_beneficiaries: null,
      budget: null,
      is_active: true,
      order_index: 5
    };

    const program2Input: CreateFeaturedProgramInput = {
      title: 'Program Kedua',
      description: 'Deskripsi program kedua',
      image_path: null,
      target_beneficiaries: null,
      budget: null,
      is_active: false,
      order_index: 10
    };

    const result1 = await createFeaturedProgram(program1Input);
    const result2 = await createFeaturedProgram(program2Input);

    expect(result1.order_index).toEqual(5);
    expect(result1.is_active).toEqual(true);
    expect(result2.order_index).toEqual(10);
    expect(result2.is_active).toEqual(false);

    // Verify both programs exist in database
    const programs = await db.select()
      .from(featuredProgramsTable)
      .execute();

    expect(programs).toHaveLength(2);
  });
});