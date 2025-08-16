import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { socialAssistanceApplicationsTable, documentsTable, type NewSocialAssistanceApplication, type NewDocument } from '../db/schema';
import { type UploadDocumentInput } from '../schema';
import { getDocuments } from '../handlers/get_documents';

// Test data for database insertion
const testApplicationData: Omit<NewSocialAssistanceApplication, 'id' | 'created_at' | 'updated_at' | 'status'> = {
  tracking_number: 'TEST001',
  full_name: 'John Doe',
  nik: '1234567890123456',
  place_of_birth: 'Jakarta',
  date_of_birth: '1990-01-01', // String format for date column
  gender: 'LAKI_LAKI',
  marital_status: 'MENIKAH',
  phone: '08123456789',
  email: 'john.doe@example.com',
  address: 'Jl. Test No. 123',
  village: 'Test Village',
  district: 'Test District',
  assistance_category: 'BANTUAN_SOSIAL',
  assistance_type: 'Bantuan Pangan',
  reason: 'Need food assistance',
  family_members_count: 4,
  monthly_income_range: 'KURANG_DARI_1JT'
};

const testDocument1Data: Omit<NewDocument, 'id' | 'uploaded_at' | 'application_id'> = {
  document_type: 'KTP',
  file_name: 'ktp.jpg',
  file_path: '/uploads/documents/ktp.jpg',
  file_size: 1024000
};

const testDocument2Data: Omit<NewDocument, 'id' | 'uploaded_at' | 'application_id'> = {
  document_type: 'KARTU_KELUARGA',
  file_name: 'kartu_keluarga.pdf',
  file_path: '/uploads/documents/kartu_keluarga.pdf',
  file_size: 2048000
};

describe('getDocuments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all documents for an application', async () => {
    // Create test application
    const [application] = await db.insert(socialAssistanceApplicationsTable)
      .values(testApplicationData)
      .returning()
      .execute();

    // Create test documents
    await db.insert(documentsTable)
      .values([
        {
          application_id: application.id,
          ...testDocument1Data
        },
        {
          application_id: application.id,
          ...testDocument2Data
        }
      ])
      .execute();

    // Get documents
    const result = await getDocuments(application.id);

    // Verify results
    expect(result).toHaveLength(2);
    
    const ktpDoc = result.find(doc => doc.document_type === 'KTP');
    expect(ktpDoc).toBeDefined();
    expect(ktpDoc!.file_name).toEqual('ktp.jpg');
    expect(ktpDoc!.file_path).toEqual('/uploads/documents/ktp.jpg');
    expect(ktpDoc!.file_size).toEqual(1024000);
    expect(ktpDoc!.application_id).toEqual(application.id);
    expect(ktpDoc!.uploaded_at).toBeInstanceOf(Date);
    expect(ktpDoc!.id).toBeDefined();

    const kkDoc = result.find(doc => doc.document_type === 'KARTU_KELUARGA');
    expect(kkDoc).toBeDefined();
    expect(kkDoc!.file_name).toEqual('kartu_keluarga.pdf');
    expect(kkDoc!.file_path).toEqual('/uploads/documents/kartu_keluarga.pdf');
    expect(kkDoc!.file_size).toEqual(2048000);
    expect(kkDoc!.application_id).toEqual(application.id);
    expect(kkDoc!.uploaded_at).toBeInstanceOf(Date);
    expect(kkDoc!.id).toBeDefined();
  });

  it('should return empty array when no documents exist for application', async () => {
    // Create test application without documents
    const [application] = await db.insert(socialAssistanceApplicationsTable)
      .values({
        ...testApplicationData,
        tracking_number: 'TEST002'
      })
      .returning()
      .execute();

    // Get documents
    const result = await getDocuments(application.id);

    // Verify empty result
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent application', async () => {
    // Use non-existent application ID
    const result = await getDocuments(99999);

    // Verify empty result
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return documents for the specified application', async () => {
    // Create two applications
    const [application1] = await db.insert(socialAssistanceApplicationsTable)
      .values({
        ...testApplicationData,
        tracking_number: 'TEST003'
      })
      .returning()
      .execute();

    const [application2] = await db.insert(socialAssistanceApplicationsTable)
      .values({
        ...testApplicationData,
        tracking_number: 'TEST004',
        full_name: 'Jane Doe',
        nik: '9876543210123456'
      })
      .returning()
      .execute();

    // Create documents for both applications
    await db.insert(documentsTable)
      .values([
        {
          application_id: application1.id,
          ...testDocument1Data
        },
        {
          application_id: application1.id,
          ...testDocument2Data
        },
        {
          application_id: application2.id,
          document_type: 'SURAT_KETERANGAN_TIDAK_MAMPU',
          file_name: 'sktm.pdf',
          file_path: '/uploads/documents/sktm.pdf',
          file_size: 512000
        }
      ])
      .execute();

    // Get documents for application1
    const result1 = await getDocuments(application1.id);
    expect(result1).toHaveLength(2);
    result1.forEach(doc => {
      expect(doc.application_id).toEqual(application1.id);
    });

    // Get documents for application2
    const result2 = await getDocuments(application2.id);
    expect(result2).toHaveLength(1);
    expect(result2[0].application_id).toEqual(application2.id);
    expect(result2[0].document_type).toEqual('SURAT_KETERANGAN_TIDAK_MAMPU');
  });

  it('should return documents ordered by uploaded_at', async () => {
    // Create test application
    const [application] = await db.insert(socialAssistanceApplicationsTable)
      .values({
        ...testApplicationData,
        tracking_number: 'TEST005'
      })
      .returning()
      .execute();

    // Create documents with different timestamps (simulate time difference)
    const firstDoc = await db.insert(documentsTable)
      .values({
        application_id: application.id,
        ...testDocument1Data
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondDoc = await db.insert(documentsTable)
      .values({
        application_id: application.id,
        ...testDocument2Data
      })
      .returning()
      .execute();

    // Get documents
    const result = await getDocuments(application.id);

    expect(result).toHaveLength(2);
    
    // Verify all documents have valid timestamps
    result.forEach(doc => {
      expect(doc.uploaded_at).toBeInstanceOf(Date);
    });

    // Find the documents by their content to verify order doesn't matter
    const ktpDoc = result.find(doc => doc.document_type === 'KTP');
    const kkDoc = result.find(doc => doc.document_type === 'KARTU_KELUARGA');
    
    expect(ktpDoc).toBeDefined();
    expect(kkDoc).toBeDefined();
    expect(ktpDoc!.uploaded_at <= kkDoc!.uploaded_at).toBe(true);
  });
});