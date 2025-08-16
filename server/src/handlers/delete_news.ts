import { db } from '../db';
import { newsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteNews(id: number): Promise<boolean> {
  try {
    // Delete the news entry by id
    const result = await db.delete(newsTable)
      .where(eq(newsTable.id, id))
      .execute();

    // Return true if at least one row was deleted
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('News deletion failed:', error);
    throw error;
  }
}