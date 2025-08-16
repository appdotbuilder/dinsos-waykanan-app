import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsTable } from '../db/schema';
import { deleteNews } from '../handlers/delete_news';
import { eq } from 'drizzle-orm';

describe('deleteNews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing news entry', async () => {
    // Create test news entry
    const newsData = {
      title: 'Test News Article',
      content: 'This is a test news article content',
      summary: 'Test summary',
      image_path: '/images/test.jpg',
      is_announcement: false,
      is_published: true,
      published_at: new Date()
    };

    const [insertedNews] = await db.insert(newsTable)
      .values(newsData)
      .returning()
      .execute();

    // Verify the news was created
    const newsBeforeDelete = await db.select()
      .from(newsTable)
      .where(eq(newsTable.id, insertedNews.id))
      .execute();
    expect(newsBeforeDelete).toHaveLength(1);

    // Delete the news entry
    const result = await deleteNews(insertedNews.id);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify the news was deleted
    const newsAfterDelete = await db.select()
      .from(newsTable)
      .where(eq(newsTable.id, insertedNews.id))
      .execute();
    expect(newsAfterDelete).toHaveLength(0);
  });

  it('should delete an announcement entry', async () => {
    // Create test announcement entry
    const announcementData = {
      title: 'Important Announcement',
      content: 'This is an important announcement',
      summary: null,
      image_path: null,
      is_announcement: true,
      is_published: true,
      published_at: new Date()
    };

    const [insertedAnnouncement] = await db.insert(newsTable)
      .values(announcementData)
      .returning()
      .execute();

    // Delete the announcement
    const result = await deleteNews(insertedAnnouncement.id);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify the announcement was deleted
    const announcementAfterDelete = await db.select()
      .from(newsTable)
      .where(eq(newsTable.id, insertedAnnouncement.id))
      .execute();
    expect(announcementAfterDelete).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent news', async () => {
    // Try to delete a news entry with an ID that doesn't exist
    const result = await deleteNews(999999);

    // Should return false since no rows were affected
    expect(result).toBe(false);
  });

  it('should not affect other news entries when deleting one', async () => {
    // Create multiple test news entries
    const newsData1 = {
      title: 'News Article 1',
      content: 'Content for news 1',
      summary: 'Summary 1',
      image_path: null,
      is_announcement: false,
      is_published: true,
      published_at: new Date()
    };

    const newsData2 = {
      title: 'News Article 2',
      content: 'Content for news 2',
      summary: 'Summary 2',
      image_path: '/images/news2.jpg',
      is_announcement: true,
      is_published: false,
      published_at: null
    };

    const [insertedNews1] = await db.insert(newsTable)
      .values(newsData1)
      .returning()
      .execute();

    const [insertedNews2] = await db.insert(newsTable)
      .values(newsData2)
      .returning()
      .execute();

    // Verify both entries exist
    const allNewsBefore = await db.select()
      .from(newsTable)
      .execute();
    expect(allNewsBefore).toHaveLength(2);

    // Delete only the first entry
    const result = await deleteNews(insertedNews1.id);
    expect(result).toBe(true);

    // Verify only first entry was deleted, second remains
    const allNewsAfter = await db.select()
      .from(newsTable)
      .execute();
    expect(allNewsAfter).toHaveLength(1);
    expect(allNewsAfter[0].id).toBe(insertedNews2.id);
    expect(allNewsAfter[0].title).toBe('News Article 2');
  });

  it('should handle unpublished news deletion', async () => {
    // Create unpublished news entry
    const unpublishedNewsData = {
      title: 'Draft News Article',
      content: 'This is a draft article',
      summary: null,
      image_path: null,
      is_announcement: false,
      is_published: false,
      published_at: null
    };

    const [insertedNews] = await db.insert(newsTable)
      .values(unpublishedNewsData)
      .returning()
      .execute();

    // Delete the unpublished news
    const result = await deleteNews(insertedNews.id);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify the news was deleted
    const newsAfterDelete = await db.select()
      .from(newsTable)
      .where(eq(newsTable.id, insertedNews.id))
      .execute();
    expect(newsAfterDelete).toHaveLength(0);
  });
});