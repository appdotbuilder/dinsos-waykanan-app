import { db } from '../db';
import { featuredProgramsTable } from '../db/schema';
import { type FeaturedProgram } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getFeaturedPrograms = async (): Promise<FeaturedProgram[]> => {
  try {
    // Query featured programs that are active, ordered by order_index
    const results = await db.select()
      .from(featuredProgramsTable)
      .where(eq(featuredProgramsTable.is_active, true))
      .orderBy(asc(featuredProgramsTable.order_index))
      .execute();

    // Convert numeric fields to proper types
    return results.map(program => ({
      ...program,
      budget: program.budget ? parseFloat(program.budget) : null // Convert numeric to number
    }));
  } catch (error) {
    console.error('Failed to get featured programs:', error);
    throw error;
  }
};