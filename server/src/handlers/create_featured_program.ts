import { db } from '../db';
import { featuredProgramsTable } from '../db/schema';
import { type CreateFeaturedProgramInput, type FeaturedProgram } from '../schema';

export const createFeaturedProgram = async (input: CreateFeaturedProgramInput): Promise<FeaturedProgram> => {
  try {
    // Insert featured program record
    const result = await db.insert(featuredProgramsTable)
      .values({
        title: input.title,
        description: input.description,
        image_path: input.image_path,
        target_beneficiaries: input.target_beneficiaries,
        budget: input.budget ? input.budget.toString() : null, // Convert number to string for numeric column
        is_active: input.is_active,
        order_index: input.order_index
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const program = result[0];
    return {
      ...program,
      budget: program.budget ? parseFloat(program.budget) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Featured program creation failed:', error);
    throw error;
  }
};