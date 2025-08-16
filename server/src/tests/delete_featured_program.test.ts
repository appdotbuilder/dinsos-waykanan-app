import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { featuredProgramsTable } from '../db/schema';
import { type CreateFeaturedProgramInput } from '../schema';
import { deleteFeaturedProgram } from '../handlers/delete_featured_program';
import { eq } from 'drizzle-orm';

// Test input for creating featured programs
const testProgram: CreateFeaturedProgramInput = {
  title: 'Program Bantuan Pendidikan',
  description: 'Program bantuan beasiswa untuk siswa kurang mampu',
  image_path: '/images/education-program.jpg',
  target_beneficiaries: 'Siswa SMA/SMK kurang mampu',
  budget: 500000000,
  is_active: true,
  order_index: 1
};

describe('deleteFeaturedProgram', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete existing featured program and return true', async () => {
    // Create a test featured program first
    const createResult = await db.insert(featuredProgramsTable)
      .values({
        title: testProgram.title,
        description: testProgram.description,
        image_path: testProgram.image_path,
        target_beneficiaries: testProgram.target_beneficiaries,
        budget: testProgram.budget?.toString(), // Convert number to string for numeric column
        is_active: testProgram.is_active,
        order_index: testProgram.order_index
      })
      .returning()
      .execute();

    const programId = createResult[0].id;

    // Delete the featured program
    const result = await deleteFeaturedProgram(programId);

    expect(result).toBe(true);

    // Verify the program was actually deleted
    const programs = await db.select()
      .from(featuredProgramsTable)
      .where(eq(featuredProgramsTable.id, programId))
      .execute();

    expect(programs).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent featured program', async () => {
    const nonExistentId = 99999;

    const result = await deleteFeaturedProgram(nonExistentId);

    expect(result).toBe(false);
  });

  it('should not affect other featured programs when deleting one', async () => {
    // Create multiple test featured programs
    const program1Result = await db.insert(featuredProgramsTable)
      .values({
        title: 'Program 1',
        description: 'Description 1',
        image_path: '/images/program1.jpg',
        target_beneficiaries: 'Target 1',
        budget: '100000000',
        is_active: true,
        order_index: 1
      })
      .returning()
      .execute();

    const program2Result = await db.insert(featuredProgramsTable)
      .values({
        title: 'Program 2',
        description: 'Description 2',
        image_path: '/images/program2.jpg',
        target_beneficiaries: 'Target 2',
        budget: '200000000',
        is_active: true,
        order_index: 2
      })
      .returning()
      .execute();

    const program1Id = program1Result[0].id;
    const program2Id = program2Result[0].id;

    // Delete only the first program
    const result = await deleteFeaturedProgram(program1Id);

    expect(result).toBe(true);

    // Verify first program is deleted
    const deletedProgram = await db.select()
      .from(featuredProgramsTable)
      .where(eq(featuredProgramsTable.id, program1Id))
      .execute();

    expect(deletedProgram).toHaveLength(0);

    // Verify second program still exists
    const remainingProgram = await db.select()
      .from(featuredProgramsTable)
      .where(eq(featuredProgramsTable.id, program2Id))
      .execute();

    expect(remainingProgram).toHaveLength(1);
    expect(remainingProgram[0].title).toBe('Program 2');
  });

  it('should handle deletion of programs with null values', async () => {
    // Create a featured program with null values
    const createResult = await db.insert(featuredProgramsTable)
      .values({
        title: 'Program with Nulls',
        description: 'Program description',
        image_path: null,
        target_beneficiaries: null,
        budget: null,
        is_active: false,
        order_index: 0
      })
      .returning()
      .execute();

    const programId = createResult[0].id;

    // Delete the featured program
    const result = await deleteFeaturedProgram(programId);

    expect(result).toBe(true);

    // Verify the program was deleted
    const programs = await db.select()
      .from(featuredProgramsTable)
      .where(eq(featuredProgramsTable.id, programId))
      .execute();

    expect(programs).toHaveLength(0);
  });

  it('should verify database state after multiple deletions', async () => {
    // Create several test programs
    const programs = [];
    for (let i = 1; i <= 3; i++) {
      const result = await db.insert(featuredProgramsTable)
        .values({
          title: `Program ${i}`,
          description: `Description ${i}`,
          image_path: `/images/program${i}.jpg`,
          target_beneficiaries: `Target ${i}`,
          budget: (i * 100000000).toString(),
          is_active: true,
          order_index: i
        })
        .returning()
        .execute();
      
      programs.push(result[0]);
    }

    // Delete first and third programs
    const deleteResult1 = await deleteFeaturedProgram(programs[0].id);
    const deleteResult3 = await deleteFeaturedProgram(programs[2].id);

    expect(deleteResult1).toBe(true);
    expect(deleteResult3).toBe(true);

    // Verify only the middle program remains
    const remainingPrograms = await db.select()
      .from(featuredProgramsTable)
      .execute();

    expect(remainingPrograms).toHaveLength(1);
    expect(remainingPrograms[0].title).toBe('Program 2');
    expect(remainingPrograms[0].id).toBe(programs[1].id);
  });
});