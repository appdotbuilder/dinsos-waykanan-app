import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { newsTable } from '../db/schema';
import { type CreateNewsInput } from '../schema';
import { getAnnouncements } from '../handlers/get_announcements';

describe('getAnnouncements', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestAnnouncement = async (overrides: Partial<CreateNewsInput> = {}): Promise<number> => {
    const baseData: CreateNewsInput = {
      title: 'Test Announcement',
      content: 'This is a test announcement content',
      summary: 'Test announcement summary',
      image_path: '/images/test.jpg',
      is_announcement: true,
      is_published: true
    };

    const result = await db.insert(newsTable)
      .values({
        ...baseData,
        ...overrides,
        published_at: new Date()
      })
      .returning()
      .execute();

    return result[0].id;
  };

  const createTestNews = async (): Promise<number> => {
    const newsData: CreateNewsInput = {
      title: 'Test News',
      content: 'This is a test news content',
      summary: 'Test news summary',
      image_path: null,
      is_announcement: false,
      is_published: true
    };

    const result = await db.insert(newsTable)
      .values({
        ...newsData,
        published_at: new Date()
      })
      .returning()
      .execute();

    return result[0].id;
  };

  it('should return published announcements only', async () => {
    // Create test data
    await createTestAnnouncement({ title: 'Published Announcement 1' });
    await createTestAnnouncement({ title: 'Published Announcement 2' });
    await createTestNews(); // This is news, not announcement

    const results = await getAnnouncements();

    expect(results).toHaveLength(2);
    results.forEach(announcement => {
      expect(announcement.is_announcement).toBe(true);
      expect(announcement.is_published).toBe(true);
      expect(announcement.title).toContain('Published Announcement');
    });
  });

  it('should not return unpublished announcements', async () => {
    // Create published and unpublished announcements
    await createTestAnnouncement({ 
      title: 'Published Announcement',
      is_published: true 
    });
    await createTestAnnouncement({ 
      title: 'Unpublished Announcement',
      is_published: false 
    });

    const results = await getAnnouncements();

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Published Announcement');
    expect(results[0].is_published).toBe(true);
  });

  it('should not return regular news items', async () => {
    // Create announcements and regular news
    await createTestAnnouncement({ title: 'Test Announcement' });
    await createTestNews(); // Regular news item

    const results = await getAnnouncements();

    expect(results).toHaveLength(1);
    expect(results[0].is_announcement).toBe(true);
    expect(results[0].title).toBe('Test Announcement');
  });

  it('should return announcements ordered by published_at descending', async () => {
    const now = new Date();
    const olderDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
    const newerDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now

    // Create announcements with different published dates
    await db.insert(newsTable)
      .values({
        title: 'Older Announcement',
        content: 'Older content',
        summary: null,
        image_path: null,
        is_announcement: true,
        is_published: true,
        published_at: olderDate
      })
      .execute();

    await db.insert(newsTable)
      .values({
        title: 'Newer Announcement',
        content: 'Newer content',
        summary: null,
        image_path: null,
        is_announcement: true,
        is_published: true,
        published_at: newerDate
      })
      .execute();

    const results = await getAnnouncements();

    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('Newer Announcement');
    expect(results[1].title).toBe('Older Announcement');
    
    // Verify ordering by published_at
    expect(results[0].published_at!.getTime()).toBeGreaterThan(results[1].published_at!.getTime());
  });

  it('should return empty array when no announcements exist', async () => {
    // Create only regular news (no announcements)
    await createTestNews();

    const results = await getAnnouncements();

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle announcements with null optional fields', async () => {
    await createTestAnnouncement({
      title: 'Minimal Announcement',
      content: 'Content only',
      summary: null,
      image_path: null
    });

    const results = await getAnnouncements();

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Minimal Announcement');
    expect(results[0].content).toBe('Content only');
    expect(results[0].summary).toBeNull();
    expect(results[0].image_path).toBeNull();
    expect(results[0].is_announcement).toBe(true);
    expect(results[0].is_published).toBe(true);
  });

  it('should return proper data types for all fields', async () => {
    await createTestAnnouncement({
      title: 'Type Check Announcement',
      content: 'Testing field types'
    });

    const results = await getAnnouncements();

    expect(results).toHaveLength(1);
    const announcement = results[0];

    expect(typeof announcement.id).toBe('number');
    expect(typeof announcement.title).toBe('string');
    expect(typeof announcement.content).toBe('string');
    expect(typeof announcement.is_announcement).toBe('boolean');
    expect(typeof announcement.is_published).toBe('boolean');
    expect(announcement.created_at).toBeInstanceOf(Date);
    expect(announcement.updated_at).toBeInstanceOf(Date);
    expect(announcement.published_at).toBeInstanceOf(Date);
  });

  it('should handle multiple filtering conditions correctly', async () => {
    // Create various combinations
    await db.insert(newsTable)
      .values([
        {
          title: 'Published Announcement',
          content: 'Should be returned',
          summary: null,
          image_path: null,
          is_announcement: true,
          is_published: true,
          published_at: new Date()
        },
        {
          title: 'Unpublished Announcement',
          content: 'Should not be returned',
          summary: null,
          image_path: null,
          is_announcement: true,
          is_published: false,
          published_at: null
        },
        {
          title: 'Published News',
          content: 'Should not be returned',
          summary: null,
          image_path: null,
          is_announcement: false,
          is_published: true,
          published_at: new Date()
        },
        {
          title: 'Unpublished News',
          content: 'Should not be returned',
          summary: null,
          image_path: null,
          is_announcement: false,
          is_published: false,
          published_at: null
        }
      ])
      .execute();

    const results = await getAnnouncements();

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Published Announcement');
    expect(results[0].is_announcement).toBe(true);
    expect(results[0].is_published).toBe(true);
  });
});