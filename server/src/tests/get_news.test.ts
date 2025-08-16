import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsTable } from '../db/schema';
import { getNews } from '../handlers/get_news';

describe('getNews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no news exist', async () => {
    const result = await getNews();
    expect(result).toEqual([]);
  });

  it('should fetch only published news', async () => {
    // Create published news
    await db.insert(newsTable).values({
      title: 'Published News',
      content: 'This is published content',
      summary: 'Published summary',
      image_path: null,
      is_announcement: false,
      is_published: true,
      published_at: new Date('2024-01-15T10:00:00Z')
    }).execute();

    // Create unpublished news
    await db.insert(newsTable).values({
      title: 'Unpublished News',
      content: 'This is unpublished content',
      summary: null,
      image_path: null,
      is_announcement: false,
      is_published: false,
      published_at: null
    }).execute();

    const result = await getNews();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Published News');
    expect(result[0].is_published).toBe(true);
  });

  it('should include both news and announcements when published', async () => {
    // Create published news
    await db.insert(newsTable).values({
      title: 'Regular News',
      content: 'Regular news content',
      summary: 'News summary',
      image_path: '/path/to/news.jpg',
      is_announcement: false,
      is_published: true,
      published_at: new Date('2024-01-15T10:00:00Z')
    }).execute();

    // Create published announcement
    await db.insert(newsTable).values({
      title: 'Important Announcement',
      content: 'Announcement content',
      summary: null,
      image_path: null,
      is_announcement: true,
      is_published: true,
      published_at: new Date('2024-01-16T14:00:00Z')
    }).execute();

    const result = await getNews();

    expect(result).toHaveLength(2);
    
    // Should include both types
    const newsTypes = result.map(item => item.is_announcement);
    expect(newsTypes).toContain(true);  // announcement
    expect(newsTypes).toContain(false); // regular news
  });

  it('should return news ordered by published_at desc, then created_at desc', async () => {
    const baseTime = new Date('2024-01-15T10:00:00Z');
    
    // Create news items with different published_at dates
    await db.insert(newsTable).values({
      title: 'Older News',
      content: 'Older content',
      summary: null,
      image_path: null,
      is_announcement: false,
      is_published: true,
      published_at: new Date(baseTime.getTime() - 86400000) // 1 day earlier
    }).execute();

    await db.insert(newsTable).values({
      title: 'Newer News',
      content: 'Newer content',
      summary: null,
      image_path: null,
      is_announcement: false,
      is_published: true,
      published_at: new Date(baseTime.getTime() + 86400000) // 1 day later
    }).execute();

    await db.insert(newsTable).values({
      title: 'Middle News',
      content: 'Middle content',
      summary: null,
      image_path: null,
      is_announcement: false,
      is_published: true,
      published_at: baseTime
    }).execute();

    const result = await getNews();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Newer News');
    expect(result[1].title).toEqual('Middle News');
    expect(result[2].title).toEqual('Older News');
  });

  it('should handle news with null published_at by using created_at for ordering', async () => {
    const baseTime = new Date('2024-01-15T10:00:00Z');
    
    // Create news with published_at
    await db.insert(newsTable).values({
      title: 'News with Published Date',
      content: 'Content with published date',
      summary: null,
      image_path: null,
      is_announcement: false,
      is_published: true,
      published_at: baseTime
    }).execute();

    // Create news without published_at (will use created_at for ordering)
    await db.insert(newsTable).values({
      title: 'News without Published Date',
      content: 'Content without published date',
      summary: null,
      image_path: null,
      is_announcement: false,
      is_published: true,
      published_at: null
    }).execute();

    const result = await getNews();

    expect(result).toHaveLength(2);
    // Both should be returned, ordered appropriately
    expect(result.some(item => item.title === 'News with Published Date')).toBe(true);
    expect(result.some(item => item.title === 'News without Published Date')).toBe(true);
  });

  it('should return complete news objects with all fields', async () => {
    await db.insert(newsTable).values({
      title: 'Complete News Item',
      content: 'Full content of the news article with detailed information.',
      summary: 'Brief summary of the news',
      image_path: '/uploads/news/image.jpg',
      is_announcement: false,
      is_published: true,
      published_at: new Date('2024-01-15T10:00:00Z')
    }).execute();

    const result = await getNews();

    expect(result).toHaveLength(1);
    const newsItem = result[0];
    
    expect(newsItem.id).toBeDefined();
    expect(newsItem.title).toEqual('Complete News Item');
    expect(newsItem.content).toEqual('Full content of the news article with detailed information.');
    expect(newsItem.summary).toEqual('Brief summary of the news');
    expect(newsItem.image_path).toEqual('/uploads/news/image.jpg');
    expect(newsItem.is_announcement).toBe(false);
    expect(newsItem.is_published).toBe(true);
    expect(newsItem.published_at).toBeInstanceOf(Date);
    expect(newsItem.created_at).toBeInstanceOf(Date);
    expect(newsItem.updated_at).toBeInstanceOf(Date);
  });

  it('should handle mix of announcements and regular news correctly', async () => {
    // Create multiple items of different types
    await db.insert(newsTable).values([
      {
        title: 'Urgent Announcement',
        content: 'Urgent announcement content',
        summary: null,
        image_path: null,
        is_announcement: true,
        is_published: true,
        published_at: new Date('2024-01-16T12:00:00Z')
      },
      {
        title: 'Regular News Update',
        content: 'Regular news content',
        summary: 'News summary',
        image_path: '/news1.jpg',
        is_announcement: false,
        is_published: true,
        published_at: new Date('2024-01-15T08:00:00Z')
      },
      {
        title: 'Policy Announcement',
        content: 'Policy change announcement',
        summary: 'Policy summary',
        image_path: null,
        is_announcement: true,
        is_published: true,
        published_at: new Date('2024-01-17T09:00:00Z')
      }
    ]).execute();

    const result = await getNews();

    expect(result).toHaveLength(3);
    
    // Should be ordered by published_at desc
    expect(result[0].title).toEqual('Policy Announcement');
    expect(result[1].title).toEqual('Urgent Announcement');
    expect(result[2].title).toEqual('Regular News Update');
    
    // Verify mix of types
    const announcements = result.filter(item => item.is_announcement);
    const regularNews = result.filter(item => !item.is_announcement);
    
    expect(announcements).toHaveLength(2);
    expect(regularNews).toHaveLength(1);
  });
});