import { db } from '../db';
import { newsTable } from '../db/schema';
import { type CreateNewsInput, type News } from '../schema';

export const createNews = async (input: CreateNewsInput): Promise<News> => {
  try {
    // Set published_at if the news is being published
    const publishedAt = input.is_published ? new Date() : null;

    // Insert news record
    const result = await db.insert(newsTable)
      .values({
        title: input.title,
        content: input.content,
        summary: input.summary,
        image_path: input.image_path,
        is_announcement: input.is_announcement,
        is_published: input.is_published,
        published_at: publishedAt
      })
      .returning()
      .execute();

    // Convert any numeric fields if needed (budget field doesn't exist in news table)
    const news = result[0];
    return {
      ...news,
      // Convert dates to proper Date objects
      created_at: new Date(news.created_at),
      updated_at: new Date(news.updated_at),
      published_at: news.published_at ? new Date(news.published_at) : null
    };
  } catch (error) {
    console.error('News creation failed:', error);
    throw error;
  }
};