import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { socialAssistanceApplicationsTable, statusTimelineTable, type NewSocialAssistanceApplication } from '../db/schema';
import { type UpdateApplicationStatusInput } from '../schema';
import { updateApplicationStatus } from '../handlers/update_application_status';
import { eq } from 'drizzle-orm';

// Helper function to create a test application
const createTestApplication = async (): Promise<number> => {
  const testData: NewSocialAssistanceApplication = {
    tracking_number: 'TEST-001',
    full_name: 'Test User',
    nik: '1234567890123456',
    place_of_birth: 'Jakarta',
    date_of_birth: '1990-01-01',
    gender: 'LAKI_LAKI',
    marital_status: 'BELUM_MENIKAH',
    phone: '081234567890',
    email: 'test@example.com',
    address: 'Jl. Test No. 123',
    village: 'Test Village',
    district: 'Test District',
    assistance_category: 'BANTUAN_SOSIAL',
    assistance_type: 'Bantuan Sembako',
    reason: 'Membutuhkan bantuan untuk kebutuhan sehari-hari',
    family_members_count: 4,
    monthly_income_range: 'KURANG_DARI_1JT',
    status: 'SUBMITTED'
  };

  const result = await db.insert(socialAssistanceApplicationsTable)
    .values(testData)
    .returning()
    .execute();

  return result[0].id;
};

describe('updateApplicationStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update application status successfully', async () => {
    const applicationId = await createTestApplication();
    
    const updateInput: UpdateApplicationStatusInput = {
      id: applicationId,
      status: 'UNDER_REVIEW'
    };

    const result = await updateApplicationStatus(updateInput);

    expect(result.id).toBe(applicationId);
    expect(result.status).toBe('UNDER_REVIEW');
    expect(result.full_name).toBe('Test User');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated status to database', async () => {
    const applicationId = await createTestApplication();
    
    const updateInput: UpdateApplicationStatusInput = {
      id: applicationId,
      status: 'VERIFIED'
    };

    await updateApplicationStatus(updateInput);

    const applications = await db.select()
      .from(socialAssistanceApplicationsTable)
      .where(eq(socialAssistanceApplicationsTable.id, applicationId))
      .execute();

    expect(applications).toHaveLength(1);
    expect(applications[0].status).toBe('VERIFIED');
    expect(applications[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create timeline entry when status is updated', async () => {
    const applicationId = await createTestApplication();
    
    const updateInput: UpdateApplicationStatusInput = {
      id: applicationId,
      status: 'APPROVED'
    };

    await updateApplicationStatus(updateInput);

    const timeline = await db.select()
      .from(statusTimelineTable)
      .where(eq(statusTimelineTable.application_id, applicationId))
      .execute();

    expect(timeline).toHaveLength(1);
    expect(timeline[0].status).toBe('APPROVED');
    expect(timeline[0].notes).toBe('Status updated to APPROVED');
    expect(timeline[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle all valid status transitions', async () => {
    const applicationId = await createTestApplication();
    
    const statuses = ['UNDER_REVIEW', 'VERIFIED', 'APPROVED', 'REJECTED', 'COMPLETED'] as const;
    
    for (const status of statuses) {
      const updateInput: UpdateApplicationStatusInput = {
        id: applicationId,
        status: status
      };

      const result = await updateApplicationStatus(updateInput);
      expect(result.status).toBe(status);
    }

    // Verify all timeline entries were created
    const timeline = await db.select()
      .from(statusTimelineTable)
      .where(eq(statusTimelineTable.application_id, applicationId))
      .execute();

    expect(timeline).toHaveLength(statuses.length);
  });

  it('should throw error for non-existent application', async () => {
    const updateInput: UpdateApplicationStatusInput = {
      id: 99999,
      status: 'APPROVED'
    };

    await expect(updateApplicationStatus(updateInput)).rejects.toThrow(/Application with ID 99999 not found/i);
  });

  it('should update updated_at timestamp', async () => {
    const applicationId = await createTestApplication();
    
    // Get original timestamp
    const originalApplication = await db.select()
      .from(socialAssistanceApplicationsTable)
      .where(eq(socialAssistanceApplicationsTable.id, applicationId))
      .execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateApplicationStatusInput = {
      id: applicationId,
      status: 'UNDER_REVIEW'
    };

    const result = await updateApplicationStatus(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalApplication[0].updated_at.getTime());
  });

  it('should preserve all other application data when updating status', async () => {
    const applicationId = await createTestApplication();
    
    const updateInput: UpdateApplicationStatusInput = {
      id: applicationId,
      status: 'VERIFIED'
    };

    const result = await updateApplicationStatus(updateInput);

    // Verify all original data is preserved
    expect(result.tracking_number).toBe('TEST-001');
    expect(result.full_name).toBe('Test User');
    expect(result.nik).toBe('1234567890123456');
    expect(result.place_of_birth).toBe('Jakarta');
    expect(result.gender).toBe('LAKI_LAKI');
    expect(result.marital_status).toBe('BELUM_MENIKAH');
    expect(result.phone).toBe('081234567890');
    expect(result.email).toBe('test@example.com');
    expect(result.assistance_category).toBe('BANTUAN_SOSIAL');
    expect(result.family_members_count).toBe(4);
    expect(result.monthly_income_range).toBe('KURANG_DARI_1JT');
  });
});