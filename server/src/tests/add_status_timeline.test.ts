import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { socialAssistanceApplicationsTable, statusTimelineTable } from '../db/schema';
import { type AddStatusTimelineInput } from '../schema';
import { addStatusTimeline } from '../handlers/add_status_timeline';
import { eq } from 'drizzle-orm';

describe('addStatusTimeline', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testApplicationId: number;

  beforeEach(async () => {
    // Create a test application first
    const applicationResult = await db.insert(socialAssistanceApplicationsTable)
      .values({
        tracking_number: 'TEST001',
        full_name: 'Test User',
        nik: '1234567890123456',
        place_of_birth: 'Jakarta',
        date_of_birth: '1990-01-01',
        gender: 'LAKI_LAKI',
        marital_status: 'BELUM_MENIKAH',
        phone: '08123456789',
        email: 'test@example.com',
        address: 'Test Address',
        village: 'Test Village',
        district: 'Test District',
        assistance_category: 'BANTUAN_SOSIAL',
        assistance_type: 'Bantuan Sembako',
        reason: 'Kebutuhan pokok keluarga',
        family_members_count: 4,
        monthly_income_range: 'KURANG_DARI_1JT',
        status: 'SUBMITTED'
      })
      .returning()
      .execute();

    testApplicationId = applicationResult[0].id;
  });

  it('should create a status timeline entry successfully', async () => {
    const testInput: AddStatusTimelineInput = {
      application_id: testApplicationId,
      status: 'UNDER_REVIEW',
      notes: 'Application is being reviewed by admin'
    };

    const result = await addStatusTimeline(testInput);

    // Verify the returned data
    expect(result.application_id).toBe(testApplicationId);
    expect(result.status).toBe('UNDER_REVIEW');
    expect(result.notes).toBe('Application is being reviewed by admin');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save timeline entry to database', async () => {
    const testInput: AddStatusTimelineInput = {
      application_id: testApplicationId,
      status: 'VERIFIED',
      notes: 'Documents verified successfully'
    };

    const result = await addStatusTimeline(testInput);

    // Query the database to verify the entry was saved
    const timelineEntries = await db.select()
      .from(statusTimelineTable)
      .where(eq(statusTimelineTable.id, result.id))
      .execute();

    expect(timelineEntries).toHaveLength(1);
    expect(timelineEntries[0].application_id).toBe(testApplicationId);
    expect(timelineEntries[0].status).toBe('VERIFIED');
    expect(timelineEntries[0].notes).toBe('Documents verified successfully');
    expect(timelineEntries[0].created_at).toBeInstanceOf(Date);
  });

  it('should create timeline entry with null notes', async () => {
    const testInput: AddStatusTimelineInput = {
      application_id: testApplicationId,
      status: 'APPROVED',
      notes: null
    };

    const result = await addStatusTimeline(testInput);

    expect(result.application_id).toBe(testApplicationId);
    expect(result.status).toBe('APPROVED');
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const timelineEntries = await db.select()
      .from(statusTimelineTable)
      .where(eq(statusTimelineTable.id, result.id))
      .execute();

    expect(timelineEntries[0].notes).toBeNull();
  });

  it('should throw error when application does not exist', async () => {
    const testInput: AddStatusTimelineInput = {
      application_id: 99999, // Non-existent application ID
      status: 'APPROVED',
      notes: 'This should fail'
    };

    await expect(addStatusTimeline(testInput)).rejects.toThrow(/Application with ID 99999 not found/i);
  });

  it('should handle different status values correctly', async () => {
    const statuses: ('UNDER_REVIEW' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'COMPLETED')[] = [
      'UNDER_REVIEW', 
      'VERIFIED', 
      'APPROVED', 
      'REJECTED', 
      'COMPLETED'
    ];
    
    for (const status of statuses) {
      const testInput: AddStatusTimelineInput = {
        application_id: testApplicationId,
        status: status,
        notes: `Status changed to ${status}`
      };

      const result = await addStatusTimeline(testInput);
      expect(result.status).toBe(status);
      expect(result.notes).toBe(`Status changed to ${status}`);
    }

    // Verify all entries were created
    const allEntries = await db.select()
      .from(statusTimelineTable)
      .where(eq(statusTimelineTable.application_id, testApplicationId))
      .execute();

    expect(allEntries).toHaveLength(statuses.length);
  });

  it('should create multiple timeline entries for same application', async () => {
    const timelineUpdates: Array<{
      status: 'UNDER_REVIEW' | 'VERIFIED' | 'APPROVED';
      notes: string;
    }> = [
      { status: 'UNDER_REVIEW', notes: 'Initial review started' },
      { status: 'VERIFIED', notes: 'Documents verified' },
      { status: 'APPROVED', notes: 'Application approved' }
    ];

    const results = [];
    for (const update of timelineUpdates) {
      const testInput: AddStatusTimelineInput = {
        application_id: testApplicationId,
        status: update.status,
        notes: update.notes
      };

      const result = await addStatusTimeline(testInput);
      results.push(result);
    }

    // Verify all entries have different IDs and correct data
    expect(results).toHaveLength(3);
    expect(new Set(results.map(r => r.id)).size).toBe(3); // All unique IDs

    // Verify in database
    const allEntries = await db.select()
      .from(statusTimelineTable)
      .where(eq(statusTimelineTable.application_id, testApplicationId))
      .execute();

    expect(allEntries).toHaveLength(3);
    expect(allEntries.map(e => e.status)).toEqual(['UNDER_REVIEW', 'VERIFIED', 'APPROVED']);
  });
});