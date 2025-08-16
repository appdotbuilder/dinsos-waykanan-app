import { db } from '../db';
import { featuredProgramsTable } from '../db/schema';
import { type UpdateFeaturedProgramInput, type FeaturedProgram } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateFeaturedProgram(input: UpdateFeaturedProgramInput): Promise<FeaturedProgram> {
  try {
    // Build update values object only with provided fields
    const updateValues: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateValues.title = input.title;
    }
    if (input.description !== undefined) {
      updateValues.description = input.description;
    }
    if (input.image_path !== undefined) {
      updateValues.image_path = input.image_path;
    }
    if (input.target_beneficiaries !== undefined) {
      updateValues.target_beneficiaries = input.target_beneficiaries;
    }
    if (input.budget !== undefined) {
      updateValues.budget = input.budget ? input.budget.toString() : null;
    }
    if (input.is_active !== undefined) {
      updateValues.is_active = input.is_active;
    }
    if (input.order_index !== undefined) {
      updateValues.order_index = input.order_index;
    }

    // Update the featured program
    const result = await db
      .update(featuredProgramsTable)
      .set(updateValues)
      .where(eq(featuredProgramsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Featured program with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers
    const program = result[0];
    return {
      ...program,
      budget: program.budget ? parseFloat(program.budget) : null
    };
  } catch (error) {
    console.error('Featured program update failed:', error);
    throw error;
  }
}