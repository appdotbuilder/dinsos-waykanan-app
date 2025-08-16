import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsTable } from '../db/schema';
import { type UpdateNewsInput, type CreateNewsInput } from '../schema';
import { updateNews } from '../handlers/update_news';
import { eq } from 'drizzle-orm';

// Helper function to create initial news entry
const createInitialNews = async (): Promise<number> => {
  const initialNews: CreateNewsInput = {
    title: 'Original Title',
    content: 'Original content for the news article',
    summary: 'Original summary',
    image_path: '/images/original.jpg',
    is_announcement: false,
    is_published: false
  };

  const result = await db.insert(newsTable)
    .values({
      ...initialNews,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateNews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic news fields', async () => {
    const newsId = await createInitialNews();
    
    const updateInput: UpdateNewsInput = {
      id: newsId,
      title: 'Updated Title',
      content: 'Updated content for the news article',
      summary: 'Updated summary'
    };

    const result = await updateNews(updateInput);

    expect(result.id).toEqual(newsId);
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Updated content for the news article');
    expect(result.summary).toEqual('Updated summary');
    expect(result.image_path).toEqual('/images/original.jpg'); // Should remain unchanged
    expect(result.is_announcement).toEqual(false); // Should remain unchanged
    expect(result.is_published).toEqual(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const newsId = await createInitialNews();

    const updateInput: UpdateNewsInput = {
      id: newsId,
      title: 'Only Title Updated'
    };

    const result = await updateNews(updateInput);

    expect(result.title).toEqual('Only Title Updated');
    expect(result.content).toEqual('Original content for the news article'); // Should remain unchanged
    expect(result.summary).toEqual('Original summary'); // Should remain unchanged
  });

  it('should update image path and set nullable fields', async () => {
    const newsId = await createInitialNews();

    const updateInput: UpdateNewsInput = {
      id: newsId,
      image_path: '/images/updated.jpg',
      summary: null // Test setting nullable field to null
    };

    const result = await updateNews(updateInput);

    expect(result.image_path).toEqual('/images/updated.jpg');
    expect(result.summary).toBeNull();
  });

  it('should update boolean fields correctly', async () => {
    const newsId = await createInitialNews();

    const updateInput: UpdateNewsInput = {
      id: newsId,
      is_announcement: true,
      is_published: false
    };

    const result = await updateNews(updateInput);

    expect(result.is_announcement).toEqual(true);
    expect(result.is_published).toEqual(false);
    expect(result.published_at).toBeNull(); // Should remain null since is_published is false
  });

  it('should set published_at when is_published changes from false to true', async () => {
    const newsId = await createInitialNews();

    const updateInput: UpdateNewsInput = {
      id: newsId,
      is_published: true
    };

    const result = await updateNews(updateInput);

    expect(result.is_published).toEqual(true);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at).not.toBeNull();
  });

  it('should not overwrite existing published_at when is_published is already true', async () => {
    // Create news that's already published
    const publishedAt = new Date('2024-01-01T10:00:00Z');
    const result = await db.insert(newsTable)
      .values({
        title: 'Published News',
        content: 'Already published content',
        summary: null,
        image_path: null,
        is_announcement: false,
        is_published: true,
        published_at: publishedAt,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    const newsId = result[0].id;

    const updateInput: UpdateNewsInput = {
      id: newsId,
      title: 'Updated Published News',
      is_published: true // Setting to true again
    };

    const updateResult = await updateNews(updateInput);

    expect(updateResult.is_published).toEqual(true);
    expect(updateResult.published_at).toEqual(publishedAt); // Should keep original published_at
  });

  it('should save updates to database correctly', async () => {
    const newsId = await createInitialNews();

    const updateInput: UpdateNewsInput = {
      id: newsId,
      title: 'Database Test Title',
      content: 'Database test content',
      is_announcement: true,
      is_published: true
    };

    await updateNews(updateInput);

    // Verify changes were persisted to database
    const savedNews = await db.select()
      .from(newsTable)
      .where(eq(newsTable.id, newsId))
      .execute();

    expect(savedNews).toHaveLength(1);
    expect(savedNews[0].title).toEqual('Database Test Title');
    expect(savedNews[0].content).toEqual('Database test content');
    expect(savedNews[0].is_announcement).toEqual(true);
    expect(savedNews[0].is_published).toEqual(true);
    expect(savedNews[0].published_at).toBeInstanceOf(Date);
    expect(savedNews[0].updated_at).toBeInstanceOf(Date);
  });

  it('should always update the updated_at timestamp', async () => {
    const newsId = await createInitialNews();
    
    // Get original updated_at
    const original = await db.select()
      .from(newsTable)
      .where(eq(newsTable.id, newsId))
      .execute();
    
    const originalUpdatedAt = original[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateNewsInput = {
      id: newsId,
      title: 'Updated for timestamp test'
    };

    const result = await updateNews(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when news does not exist', async () => {
    const updateInput: UpdateNewsInput = {
      id: 99999, // Non-existent ID
      title: 'This will fail'
    };

    await expect(updateNews(updateInput)).rejects.toThrow(/News with id 99999 not found/i);
  });

  it('should handle complex update with all fields', async () => {
    const newsId = await createInitialNews();

    const updateInput: UpdateNewsInput = {
      id: newsId,
      title: 'Complete Update Title',
      content: 'Complete update content with all fields changed',
      summary: 'Complete update summary',
      image_path: '/images/complete-update.jpg',
      is_announcement: true,
      is_published: true
    };

    const result = await updateNews(updateInput);

    expect(result.id).toEqual(newsId);
    expect(result.title).toEqual('Complete Update Title');
    expect(result.content).toEqual('Complete update content with all fields changed');
    expect(result.summary).toEqual('Complete update summary');
    expect(result.image_path).toEqual('/images/complete-update.jpg');
    expect(result.is_announcement).toEqual(true);
    expect(result.is_published).toEqual(true);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});