import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { socialAssistanceApplicationsTable, statusTimelineTable } from '../db/schema';
import { getStatusTimeline } from '../handlers/get_status_timeline';

// Test data
const testApplication = {
  tracking_number: 'TEST-2024-001',
  full_name: 'John Doe',
  nik: '1234567890123456',
  place_of_birth: 'Jakarta',
  date_of_birth: '1990-01-01',
  gender: 'LAKI_LAKI' as const,
  marital_status: 'BELUM_MENIKAH' as const,
  phone: '081234567890',
  email: 'john@example.com',
  address: 'Jl. Test No. 1',
  village: 'Test Village',
  district: 'Test District',
  assistance_category: 'BANTUAN_SOSIAL' as const,
  assistance_type: 'Bantuan Pangan',
  reason: 'Kebutuhan sehari-hari',
  family_members_count: 4,
  monthly_income_range: 'KURANG_DARI_1JT' as const,
  status: 'SUBMITTED' as const
};

const testTimelineEntries = [
  {
    status: 'SUBMITTED' as const,
    notes: 'Permohonan berhasil disubmit'
  },
  {
    status: 'UNDER_REVIEW' as const,
    notes: 'Permohonan sedang dalam tahap review'
  },
  {
    status: 'VERIFIED' as const,
    notes: 'Data pemohon telah diverifikasi'
  }
];

describe('getStatusTimeline', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for non-existent application', async () => {
    const result = await getStatusTimeline(999);
    expect(result).toEqual([]);
  });

  it('should return timeline entries for existing application', async () => {
    // Create test application
    const [application] = await db.insert(socialAssistanceApplicationsTable)
      .values(testApplication)
      .returning()
      .execute();

    // Create timeline entries with delays to ensure different timestamps
    for (let i = 0; i < testTimelineEntries.length; i++) {
      await db.insert(statusTimelineTable)
        .values({
          application_id: application.id,
          ...testTimelineEntries[i]
        })
        .execute();
      
      // Small delay to ensure different timestamps
      if (i < testTimelineEntries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    const result = await getStatusTimeline(application.id);

    expect(result).toHaveLength(3);
    
    // Verify all timeline entries are present
    const statuses = result.map(entry => entry.status);
    expect(statuses).toContain('SUBMITTED');
    expect(statuses).toContain('UNDER_REVIEW');
    expect(statuses).toContain('VERIFIED');

    // Verify structure of timeline entries
    result.forEach(entry => {
      expect(entry.id).toBeDefined();
      expect(entry.application_id).toBe(application.id);
      expect(entry.status).toBeDefined();
      expect(entry.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return timeline ordered by most recent first', async () => {
    // Create test application
    const [application] = await db.insert(socialAssistanceApplicationsTable)
      .values(testApplication)
      .returning()
      .execute();

    // Create timeline entries with explicit timestamps
    const now = new Date();
    const entries = [
      {
        application_id: application.id,
        status: 'SUBMITTED' as const,
        notes: 'First entry'
      },
      {
        application_id: application.id,
        status: 'UNDER_REVIEW' as const,
        notes: 'Second entry'
      },
      {
        application_id: application.id,
        status: 'VERIFIED' as const,
        notes: 'Third entry'
      }
    ];

    // Insert entries with delays to ensure different timestamps
    for (const entry of entries) {
      await db.insert(statusTimelineTable)
        .values(entry)
        .execute();
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const result = await getStatusTimeline(application.id);

    expect(result).toHaveLength(3);
    
    // Verify ordering - most recent should be first
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at.getTime()).toBeGreaterThanOrEqual(
        result[i + 1].created_at.getTime()
      );
    }

    // Verify the most recent entry is the last one we inserted
    expect(result[0].status).toBe('VERIFIED');
    expect(result[0].notes).toBe('Third entry');
  });

  it('should handle timeline entries with null notes', async () => {
    // Create test application
    const [application] = await db.insert(socialAssistanceApplicationsTable)
      .values(testApplication)
      .returning()
      .execute();

    // Create timeline entry with null notes
    await db.insert(statusTimelineTable)
      .values({
        application_id: application.id,
        status: 'SUBMITTED',
        notes: null
      })
      .execute();

    const result = await getStatusTimeline(application.id);

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
    expect(result[0].status).toBe('SUBMITTED');
    expect(result[0].application_id).toBe(application.id);
  });

  it('should return only timeline entries for specified application', async () => {
    // Create two test applications
    const [app1] = await db.insert(socialAssistanceApplicationsTable)
      .values({
        ...testApplication,
        tracking_number: 'TEST-2024-001'
      })
      .returning()
      .execute();

    const [app2] = await db.insert(socialAssistanceApplicationsTable)
      .values({
        ...testApplication,
        tracking_number: 'TEST-2024-002',
        nik: '9876543210987654'
      })
      .returning()
      .execute();

    // Create timeline entries for both applications
    await db.insert(statusTimelineTable)
      .values([
        {
          application_id: app1.id,
          status: 'SUBMITTED',
          notes: 'App 1 submitted'
        },
        {
          application_id: app1.id,
          status: 'UNDER_REVIEW',
          notes: 'App 1 under review'
        },
        {
          application_id: app2.id,
          status: 'SUBMITTED',
          notes: 'App 2 submitted'
        }
      ])
      .execute();

    // Get timeline for first application
    const result1 = await getStatusTimeline(app1.id);
    expect(result1).toHaveLength(2);
    result1.forEach(entry => {
      expect(entry.application_id).toBe(app1.id);
      expect(entry.notes).toContain('App 1');
    });

    // Get timeline for second application
    const result2 = await getStatusTimeline(app2.id);
    expect(result2).toHaveLength(1);
    expect(result2[0].application_id).toBe(app2.id);
    expect(result2[0].notes).toBe('App 2 submitted');
  });
});