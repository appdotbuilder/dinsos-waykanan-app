import { db } from '../db';
import { newsTable } from '../db/schema';
import { type UpdateNewsInput, type News } from '../schema';
import { eq } from 'drizzle-orm';

export const updateNews = async (input: UpdateNewsInput): Promise<News> => {
  try {
    // Build update values object only with provided fields
    const updateValues: Partial<typeof newsTable.$inferInsert> = {
      updated_at: new Date() // Always update the timestamp
    };

    // Only include fields that are provided in the input
    if (input.title !== undefined) {
      updateValues.title = input.title;
    }
    if (input.content !== undefined) {
      updateValues.content = input.content;
    }
    if (input.summary !== undefined) {
      updateValues.summary = input.summary;
    }
    if (input.image_path !== undefined) {
      updateValues.image_path = input.image_path;
    }
    if (input.is_announcement !== undefined) {
      updateValues.is_announcement = input.is_announcement;
    }
    if (input.is_published !== undefined) {
      updateValues.is_published = input.is_published;
      
      // If is_published is being set to true, set published_at to now if it's not already set
      if (input.is_published === true) {
        // Check current published_at value first
        const current = await db.select({ published_at: newsTable.published_at })
          .from(newsTable)
          .where(eq(newsTable.id, input.id))
          .execute();
        
        if (current.length > 0 && current[0].published_at === null) {
          updateValues.published_at = new Date();
        }
      }
    }

    // Perform the update
    const result = await db.update(newsTable)
      .set(updateValues)
      .where(eq(newsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`News with id ${input.id} not found`);
    }

    // Convert numeric fields if any (budget field doesn't exist in news table, so no conversion needed)
    const news = result[0];
    return {
      ...news,
      // Convert dates to Date objects
      created_at: new Date(news.created_at),
      updated_at: new Date(news.updated_at),
      published_at: news.published_at ? new Date(news.published_at) : null
    };
  } catch (error) {
    console.error('News update failed:', error);
    throw error;
  }
};