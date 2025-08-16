import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  socialAssistanceApplicationsTable, 
  documentsTable,
  statusTimelineTable
} from '../db/schema';
import { type TrackApplicationInput } from '../schema';
import { trackApplication } from '../handlers/track_application';

// Test input for tracking application
const testTrackingInput: TrackApplicationInput = {
  tracking_number: 'BA-2024-001',
  nik: '1234567890123456'
};

// Test application data
const testApplicationData = {
  tracking_number: 'BA-2024-001',
  full_name: 'John Doe',
  nik: '1234567890123456',
  place_of_birth: 'Jakarta',
  date_of_birth: '1990-01-01', // String format for date() type
  gender: 'LAKI_LAKI' as const,
  marital_status: 'MENIKAH' as const,
  phone: '081234567890',
  email: 'john.doe@example.com',
  address: 'Jl. Merdeka No. 123',
  village: 'Desa Maju',
  district: 'Kecamatan Sejahtera',
  assistance_category: 'BANTUAN_SOSIAL' as const,
  assistance_type: 'Bantuan Pangan',
  reason: 'Kebutuhan ekonomi keluarga',
  family_members_count: 4,
  monthly_income_range: '1JT_SAMPAI_2JT' as const,
  status: 'SUBMITTED' as const
};

describe('trackApplication', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return application with documents and timeline when found', async () => {
    // Create test application
    const applicationResult = await db.insert(socialAssistanceApplicationsTable)
      .values(testApplicationData)
      .returning()
      .execute();

    const application = applicationResult[0];

    // Create test documents
    const documentsResult = await db.insert(documentsTable)
      .values([
        {
          application_id: application.id,
          document_type: 'KTP',
          file_name: 'ktp.jpg',
          file_path: '/uploads/ktp.jpg',
          file_size: 1024
        },
        {
          application_id: application.id,
          document_type: 'KARTU_KELUARGA',
          file_name: 'kk.pdf',
          file_path: '/uploads/kk.pdf',
          file_size: 2048
        }
      ])
      .returning()
      .execute();

    // Create test timeline entries with different timestamps to ensure ordering
    // Insert SUBMITTED first (older)
    await db.insert(statusTimelineTable)
      .values({
        application_id: application.id,
        status: 'SUBMITTED',
        notes: 'Application submitted'
      })
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert UNDER_REVIEW second (newer)
    await db.insert(statusTimelineTable)
      .values({
        application_id: application.id,
        status: 'UNDER_REVIEW',
        notes: 'Under review by admin'
      })
      .execute();

    // Track the application
    const result = await trackApplication(testTrackingInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.application.id).toEqual(application.id);
    expect(result!.application.tracking_number).toEqual('BA-2024-001');
    expect(result!.application.full_name).toEqual('John Doe');
    expect(result!.application.nik).toEqual('1234567890123456');
    expect(result!.application.status).toEqual('SUBMITTED');
    expect(result!.application.created_at).toBeInstanceOf(Date);

    // Verify documents
    expect(result!.documents).toHaveLength(2);
    expect(result!.documents[0].document_type).toEqual('KTP');
    expect(result!.documents[0].file_name).toEqual('ktp.jpg');
    expect(result!.documents[0].file_size).toEqual(1024);
    expect(result!.documents[1].document_type).toEqual('KARTU_KELUARGA');

    // Verify timeline (should be ordered by created_at desc - newest first)
    expect(result!.timeline).toHaveLength(2);
    expect(result!.timeline[0].status).toEqual('UNDER_REVIEW'); // Newest first
    expect(result!.timeline[1].status).toEqual('SUBMITTED'); // Oldest last
    expect(result!.timeline[0].notes).toEqual('Under review by admin');
    expect(result!.timeline[0].created_at).toBeInstanceOf(Date);
  });

  it('should return null when tracking number not found', async () => {
    // Create test application with different tracking number
    await db.insert(socialAssistanceApplicationsTable)
      .values({
        ...testApplicationData,
        tracking_number: 'BA-2024-999'
      })
      .execute();

    const result = await trackApplication({
      tracking_number: 'BA-2024-001', // Different tracking number
      nik: '1234567890123456'
    });

    expect(result).toBeNull();
  });

  it('should return null when NIK does not match', async () => {
    // Create test application
    await db.insert(socialAssistanceApplicationsTable)
      .values(testApplicationData)
      .execute();

    const result = await trackApplication({
      tracking_number: 'BA-2024-001',
      nik: '9999999999999999' // Different NIK
    });

    expect(result).toBeNull();
  });

  it('should return application even when no documents or timeline exist', async () => {
    // Create test application without documents or timeline
    const applicationResult = await db.insert(socialAssistanceApplicationsTable)
      .values(testApplicationData)
      .returning()
      .execute();

    const result = await trackApplication(testTrackingInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.application.id).toEqual(applicationResult[0].id);
    expect(result!.application.tracking_number).toEqual('BA-2024-001');
    
    // Should have empty arrays for documents and timeline
    expect(result!.documents).toHaveLength(0);
    expect(result!.timeline).toHaveLength(0);
  });

  it('should handle multiple timeline entries correctly ordered', async () => {
    // Create test application
    const applicationResult = await db.insert(socialAssistanceApplicationsTable)
      .values(testApplicationData)
      .returning()
      .execute();

    const application = applicationResult[0];

    // Create multiple timeline entries sequentially to ensure different timestamps
    await db.insert(statusTimelineTable)
      .values({
        application_id: application.id,
        status: 'SUBMITTED',
        notes: 'First entry'
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(statusTimelineTable)
      .values({
        application_id: application.id,
        status: 'UNDER_REVIEW',
        notes: 'Second entry'
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(statusTimelineTable)
      .values({
        application_id: application.id,
        status: 'VERIFIED',
        notes: 'Third entry'
      })
      .execute();

    const result = await trackApplication(testTrackingInput);

    // Timeline should be ordered by created_at descending (newest first)
    expect(result!.timeline).toHaveLength(3);
    
    // Verify all entries exist
    const statuses = result!.timeline.map(entry => entry.status);
    expect(statuses).toContain('SUBMITTED');
    expect(statuses).toContain('UNDER_REVIEW');
    expect(statuses).toContain('VERIFIED');
    
    // Verify notes are preserved
    const notes = result!.timeline.map(entry => entry.notes);
    expect(notes).toContain('First entry');
    expect(notes).toContain('Second entry');
    expect(notes).toContain('Third entry');

    // Verify all timestamps are valid dates
    result!.timeline.forEach(entry => {
      expect(entry.created_at).toBeInstanceOf(Date);
    });
  });

  it('should handle case-sensitive tracking number and NIK matching', async () => {
    // Create test application
    await db.insert(socialAssistanceApplicationsTable)
      .values({
        ...testApplicationData,
        tracking_number: 'BA-2024-001', // Uppercase
        nik: '1234567890123456'
      })
      .execute();

    // Should not find with lowercase
    const result1 = await trackApplication({
      tracking_number: 'ba-2024-001', // lowercase
      nik: '1234567890123456'
    });
    expect(result1).toBeNull();

    // Should find with exact match
    const result2 = await trackApplication({
      tracking_number: 'BA-2024-001', // exact match
      nik: '1234567890123456'
    });
    expect(result2).not.toBeNull();
  });
});