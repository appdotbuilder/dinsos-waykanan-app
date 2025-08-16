import { db } from '../db';
import { featuredProgramsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteFeaturedProgram(id: number): Promise<boolean> {
  try {
    const result = await db.delete(featuredProgramsTable)
      .where(eq(featuredProgramsTable.id, id))
      .execute();

    // Check if any rows were deleted
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Featured program deletion failed:', error);
    throw error;
  }
}