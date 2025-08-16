import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { featuredProgramsTable } from '../db/schema';
import { type UpdateFeaturedProgramInput } from '../schema';
import { updateFeaturedProgram } from '../handlers/update_featured_program';
import { eq } from 'drizzle-orm';

describe('updateFeaturedProgram', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test featured program
  const createTestProgram = async () => {
    const result = await db.insert(featuredProgramsTable)
      .values({
        title: 'Original Program',
        description: 'Original description',
        image_path: '/original-image.jpg',
        target_beneficiaries: 'Original beneficiaries',
        budget: '5000000.00',
        is_active: true,
        order_index: 1
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update all fields of a featured program', async () => {
    const originalProgram = await createTestProgram();
    
    const input: UpdateFeaturedProgramInput = {
      id: originalProgram.id,
      title: 'Updated Program Title',
      description: 'Updated program description',
      image_path: '/updated-image.jpg',
      target_beneficiaries: 'Updated target beneficiaries',
      budget: 10000000,
      is_active: false,
      order_index: 2
    };

    const result = await updateFeaturedProgram(input);

    // Verify returned data
    expect(result.id).toEqual(originalProgram.id);
    expect(result.title).toEqual('Updated Program Title');
    expect(result.description).toEqual('Updated program description');
    expect(result.image_path).toEqual('/updated-image.jpg');
    expect(result.target_beneficiaries).toEqual('Updated target beneficiaries');
    expect(result.budget).toEqual(10000000);
    expect(typeof result.budget).toBe('number');
    expect(result.is_active).toEqual(false);
    expect(result.order_index).toEqual(2);
    expect(result.created_at).toEqual(originalProgram.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalProgram.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    const originalProgram = await createTestProgram();
    
    const input: UpdateFeaturedProgramInput = {
      id: originalProgram.id,
      title: 'Partially Updated Title',
      is_active: false
    };

    const result = await updateFeaturedProgram(input);

    // Verify updated fields
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.is_active).toEqual(false);

    // Verify unchanged fields
    expect(result.description).toEqual(originalProgram.description);
    expect(result.image_path).toEqual(originalProgram.image_path);
    expect(result.target_beneficiaries).toEqual(originalProgram.target_beneficiaries);
    expect(result.budget).toEqual(originalProgram.budget ? parseFloat(originalProgram.budget) : null);
    expect(result.order_index).toEqual(originalProgram.order_index);
    expect(result.created_at).toEqual(originalProgram.created_at);
  });

  it('should handle null values correctly', async () => {
    const originalProgram = await createTestProgram();
    
    const input: UpdateFeaturedProgramInput = {
      id: originalProgram.id,
      image_path: null,
      target_beneficiaries: null,
      budget: null
    };

    const result = await updateFeaturedProgram(input);

    expect(result.image_path).toBeNull();
    expect(result.target_beneficiaries).toBeNull();
    expect(result.budget).toBeNull();
  });

  it('should save updates to database', async () => {
    const originalProgram = await createTestProgram();
    
    const input: UpdateFeaturedProgramInput = {
      id: originalProgram.id,
      title: 'Database Update Test',
      budget: 7500000
    };

    await updateFeaturedProgram(input);

    // Query database directly to verify changes
    const programs = await db.select()
      .from(featuredProgramsTable)
      .where(eq(featuredProgramsTable.id, originalProgram.id))
      .execute();

    expect(programs).toHaveLength(1);
    const savedProgram = programs[0];
    expect(savedProgram.title).toEqual('Database Update Test');
    expect(parseFloat(savedProgram.budget!)).toEqual(7500000);
    expect(savedProgram.updated_at).toBeInstanceOf(Date);
    expect(savedProgram.updated_at > originalProgram.updated_at).toBe(true);
  });

  it('should handle budget conversion correctly', async () => {
    const originalProgram = await createTestProgram();
    
    const input: UpdateFeaturedProgramInput = {
      id: originalProgram.id,
      budget: 12345678.99
    };

    const result = await updateFeaturedProgram(input);

    expect(result.budget).toEqual(12345678.99);
    expect(typeof result.budget).toBe('number');

    // Verify in database
    const programs = await db.select()
      .from(featuredProgramsTable)
      .where(eq(featuredProgramsTable.id, originalProgram.id))
      .execute();

    expect(parseFloat(programs[0].budget!)).toEqual(12345678.99);
  });

  it('should throw error when featured program not found', async () => {
    const input: UpdateFeaturedProgramInput = {
      id: 99999,
      title: 'Non-existent Program'
    };

    await expect(updateFeaturedProgram(input)).rejects.toThrow(/featured program with id 99999 not found/i);
  });

  it('should update only updated_at when no other fields provided', async () => {
    const originalProgram = await createTestProgram();
    
    const input: UpdateFeaturedProgramInput = {
      id: originalProgram.id
    };

    const result = await updateFeaturedProgram(input);

    // All fields should remain the same except updated_at
    expect(result.title).toEqual(originalProgram.title);
    expect(result.description).toEqual(originalProgram.description);
    expect(result.image_path).toEqual(originalProgram.image_path);
    expect(result.target_beneficiaries).toEqual(originalProgram.target_beneficiaries);
    expect(result.budget).toEqual(originalProgram.budget ? parseFloat(originalProgram.budget) : null);
    expect(result.is_active).toEqual(originalProgram.is_active);
    expect(result.order_index).toEqual(originalProgram.order_index);
    expect(result.created_at).toEqual(originalProgram.created_at);
    expect(result.updated_at > originalProgram.updated_at).toBe(true);
  });

  it('should handle order_index updates correctly', async () => {
    const originalProgram = await createTestProgram();
    
    const input: UpdateFeaturedProgramInput = {
      id: originalProgram.id,
      order_index: 5
    };

    const result = await updateFeaturedProgram(input);

    expect(result.order_index).toEqual(5);

    // Verify in database
    const programs = await db.select()
      .from(featuredProgramsTable)
      .where(eq(featuredProgramsTable.id, originalProgram.id))
      .execute();

    expect(programs[0].order_index).toEqual(5);
  });
});