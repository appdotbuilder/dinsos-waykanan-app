import { db } from '../db';
import { newsTable } from '../db/schema';
import { type News } from '../schema';
import { eq, desc, or } from 'drizzle-orm';

export const getNews = async (): Promise<News[]> => {
  try {
    // Fetch all published news and announcements, ordered by published_at (desc) then created_at (desc)
    const results = await db.select()
      .from(newsTable)
      .where(eq(newsTable.is_published, true))
      .orderBy(desc(newsTable.published_at), desc(newsTable.created_at))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(news => ({
      ...news,
      // No numeric columns to convert in this table
    }));
  } catch (error) {
    console.error('News retrieval failed:', error);
    throw error;
  }
};