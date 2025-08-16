import { db } from '../db';
import { newsTable } from '../db/schema';
import { type News } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export const getAnnouncements = async (): Promise<News[]> => {
  try {
    // Query for published announcements only
    const results = await db.select()
      .from(newsTable)
      .where(
        and(
          eq(newsTable.is_announcement, true),
          eq(newsTable.is_published, true)
        )
      )
      .orderBy(desc(newsTable.published_at))
      .execute();

    // Convert numeric fields and return
    return results.map(result => ({
      ...result,
      // Convert date fields to proper Date objects (they're already converted by Drizzle)
      created_at: result.created_at,
      updated_at: result.updated_at,
      published_at: result.published_at
    }));
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    throw error;
  }
};