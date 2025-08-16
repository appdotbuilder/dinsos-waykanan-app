import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsTable } from '../db/schema';
import { type CreateNewsInput } from '../schema';
import { createNews } from '../handlers/create_news';
import { eq } from 'drizzle-orm';

// Test inputs with all required fields
const testNewsInput: CreateNewsInput = {
  title: 'Test News Article',
  content: 'This is a comprehensive test news article content that provides detailed information about the news.',
  summary: 'This is a test news summary',
  image_path: '/images/test-news.jpg',
  is_announcement: false,
  is_published: true
};

const testAnnouncementInput: CreateNewsInput = {
  title: 'Important Announcement',
  content: 'This is an important announcement for all citizens regarding new social assistance programs.',
  summary: null,
  image_path: null,
  is_announcement: true,
  is_published: false
};

describe('createNews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a published news article', async () => {
    const result = await createNews(testNewsInput);

    // Basic field validation
    expect(result.title).toEqual('Test News Article');
    expect(result.content).toEqual(testNewsInput.content);
    expect(result.summary).toEqual('This is a test news summary');
    expect(result.image_path).toEqual('/images/test-news.jpg');
    expect(result.is_announcement).toEqual(false);
    expect(result.is_published).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.published_at).toBeInstanceOf(Date);
  });

  it('should create an unpublished announcement', async () => {
    const result = await createNews(testAnnouncementInput);

    // Validate announcement-specific fields
    expect(result.title).toEqual('Important Announcement');
    expect(result.content).toEqual(testAnnouncementInput.content);
    expect(result.summary).toBeNull();
    expect(result.image_path).toBeNull();
    expect(result.is_announcement).toEqual(true);
    expect(result.is_published).toEqual(false);
    expect(result.published_at).toBeNull(); // Should be null when not published
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save news to database correctly', async () => {
    const result = await createNews(testNewsInput);

    // Query database to verify data was saved
    const newsItems = await db.select()
      .from(newsTable)
      .where(eq(newsTable.id, result.id))
      .execute();

    expect(newsItems).toHaveLength(1);
    const savedNews = newsItems[0];
    
    expect(savedNews.title).toEqual('Test News Article');
    expect(savedNews.content).toEqual(testNewsInput.content);
    expect(savedNews.summary).toEqual('This is a test news summary');
    expect(savedNews.image_path).toEqual('/images/test-news.jpg');
    expect(savedNews.is_announcement).toEqual(false);
    expect(savedNews.is_published).toEqual(true);
    expect(savedNews.published_at).toBeInstanceOf(Date);
    expect(savedNews.created_at).toBeInstanceOf(Date);
    expect(savedNews.updated_at).toBeInstanceOf(Date);
  });

  it('should handle published_at correctly for published content', async () => {
    const publishedInput: CreateNewsInput = {
      ...testNewsInput,
      is_published: true
    };

    const result = await createNews(publishedInput);

    expect(result.is_published).toEqual(true);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at!.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('should handle published_at correctly for unpublished content', async () => {
    const unpublishedInput: CreateNewsInput = {
      ...testNewsInput,
      is_published: false
    };

    const result = await createNews(unpublishedInput);

    expect(result.is_published).toEqual(false);
    expect(result.published_at).toBeNull();
  });

  it('should handle null values correctly', async () => {
    const minimalInput: CreateNewsInput = {
      title: 'Minimal News',
      content: 'Minimal content for testing null handling',
      summary: null,
      image_path: null,
      is_announcement: false,
      is_published: false
    };

    const result = await createNews(minimalInput);

    expect(result.title).toEqual('Minimal News');
    expect(result.content).toEqual('Minimal content for testing null handling');
    expect(result.summary).toBeNull();
    expect(result.image_path).toBeNull();
    expect(result.is_announcement).toEqual(false);
    expect(result.is_published).toEqual(false);
    expect(result.published_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple news items independently', async () => {
    const newsInput1: CreateNewsInput = {
      title: 'First News',
      content: 'Content of first news',
      summary: 'First summary',
      image_path: '/images/first.jpg',
      is_announcement: false,
      is_published: true
    };

    const newsInput2: CreateNewsInput = {
      title: 'Second Announcement',
      content: 'Content of second announcement',
      summary: null,
      image_path: null,
      is_announcement: true,
      is_published: false
    };

    const result1 = await createNews(newsInput1);
    const result2 = await createNews(newsInput2);

    // Verify both were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('First News');
    expect(result2.title).toEqual('Second Announcement');
    expect(result1.is_announcement).toEqual(false);
    expect(result2.is_announcement).toEqual(true);
    expect(result1.is_published).toEqual(true);
    expect(result2.is_published).toEqual(false);

    // Verify both exist in database
    const allNews = await db.select().from(newsTable).execute();
    expect(allNews).toHaveLength(2);
  });

  it('should preserve exact content and formatting', async () => {
    const complexContentInput: CreateNewsInput = {
      title: 'News with Complex Content',
      content: `This is a multi-line content with:
- Bullet points
- Special characters: @#$%^&*()
- Numbers: 12345
- Unicode: 🎉 📢 ✅

And multiple paragraphs for testing.`,
      summary: 'Complex content summary with émojis 🚀',
      image_path: '/path/with spaces/and-special_chars.jpg',
      is_announcement: false,
      is_published: true
    };

    const result = await createNews(complexContentInput);

    expect(result.content).toEqual(complexContentInput.content);
    expect(result.summary).toEqual('Complex content summary with émojis 🚀');
    expect(result.image_path).toEqual('/path/with spaces/and-special_chars.jpg');
  });
});