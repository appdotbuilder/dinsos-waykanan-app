import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { documentsTable, socialAssistanceApplicationsTable } from '../db/schema';
import { type UploadDocumentInput } from '../schema';
import { uploadDocument } from '../handlers/upload_document';
import { eq } from 'drizzle-orm';

describe('uploadDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test application
  const createTestApplication = async () => {
    const result = await db.insert(socialAssistanceApplicationsTable)
      .values({
        tracking_number: 'TEST-2024-001',
        full_name: 'John Doe',
        nik: '1234567890123456',
        place_of_birth: 'Jakarta',
        date_of_birth: '1990-01-01', // String format for date field
        gender: 'LAKI_LAKI',
        marital_status: 'BELUM_MENIKAH',
        phone: '081234567890',
        email: 'john.doe@example.com',
        address: 'Jl. Test No. 123',
        village: 'Kelurahan Test',
        district: 'Kecamatan Test',
        assistance_category: 'BANTUAN_SOSIAL',
        assistance_type: 'Bantuan Sembako',
        reason: 'Kebutuhan sehari-hari',
        family_members_count: 4,
        monthly_income_range: 'KURANG_DARI_1JT'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should upload document metadata successfully', async () => {
    const application = await createTestApplication();
    
    const testInput: UploadDocumentInput = {
      application_id: application.id,
      document_type: 'KTP',
      file_name: 'ktp_john_doe.pdf',
      file_path: '/uploads/documents/ktp_john_doe.pdf',
      file_size: 1024000
    };

    const result = await uploadDocument(testInput);

    // Basic field validation
    expect(result.application_id).toEqual(application.id);
    expect(result.document_type).toEqual('KTP');
    expect(result.file_name).toEqual('ktp_john_doe.pdf');
    expect(result.file_path).toEqual('/uploads/documents/ktp_john_doe.pdf');
    expect(result.file_size).toEqual(1024000);
    expect(result.id).toBeDefined();
    expect(result.uploaded_at).toBeInstanceOf(Date);
  });

  it('should save document metadata to database', async () => {
    const application = await createTestApplication();
    
    const testInput: UploadDocumentInput = {
      application_id: application.id,
      document_type: 'KARTU_KELUARGA',
      file_name: 'kk_john_doe.jpg',
      file_path: '/uploads/documents/kk_john_doe.jpg',
      file_size: 2048000
    };

    const result = await uploadDocument(testInput);

    // Query document from database
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, result.id))
      .execute();

    expect(documents).toHaveLength(1);
    expect(documents[0].application_id).toEqual(application.id);
    expect(documents[0].document_type).toEqual('KARTU_KELUARGA');
    expect(documents[0].file_name).toEqual('kk_john_doe.jpg');
    expect(documents[0].file_path).toEqual('/uploads/documents/kk_john_doe.jpg');
    expect(documents[0].file_size).toEqual(2048000);
    expect(documents[0].uploaded_at).toBeInstanceOf(Date);
  });

  it('should handle multiple documents for same application', async () => {
    const application = await createTestApplication();
    
    const document1Input: UploadDocumentInput = {
      application_id: application.id,
      document_type: 'KTP',
      file_name: 'ktp.pdf',
      file_path: '/uploads/ktp.pdf',
      file_size: 500000
    };

    const document2Input: UploadDocumentInput = {
      application_id: application.id,
      document_type: 'SURAT_KETERANGAN_TIDAK_MAMPU',
      file_name: 'sktm.pdf',
      file_path: '/uploads/sktm.pdf',
      file_size: 750000
    };

    const result1 = await uploadDocument(document1Input);
    const result2 = await uploadDocument(document2Input);

    // Verify both documents exist
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.application_id, application.id))
      .execute();

    expect(documents).toHaveLength(2);
    expect(documents.some(doc => doc.document_type === 'KTP')).toBe(true);
    expect(documents.some(doc => doc.document_type === 'SURAT_KETERANGAN_TIDAK_MAMPU')).toBe(true);
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should handle various document types correctly', async () => {
    const application = await createTestApplication();
    
    const documentTypes = [
      'KTP',
      'KARTU_KELUARGA', 
      'SURAT_KETERANGAN_TIDAK_MAMPU',
      'FOTO_RUMAH',
      'DOKUMEN_TAMBAHAN'
    ] as const;

    for (const docType of documentTypes) {
      const input: UploadDocumentInput = {
        application_id: application.id,
        document_type: docType,
        file_name: `${docType.toLowerCase()}.pdf`,
        file_path: `/uploads/${docType.toLowerCase()}.pdf`,
        file_size: 1000000
      };

      const result = await uploadDocument(input);
      expect(result.document_type).toEqual(docType);
    }

    // Verify all documents were created
    const allDocuments = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.application_id, application.id))
      .execute();

    expect(allDocuments).toHaveLength(documentTypes.length);
  });

  it('should throw error for non-existent application', async () => {
    const testInput: UploadDocumentInput = {
      application_id: 99999, // Non-existent ID
      document_type: 'KTP',
      file_name: 'ktp.pdf',
      file_path: '/uploads/ktp.pdf',
      file_size: 1024000
    };

    await expect(uploadDocument(testInput)).rejects.toThrow(/Application with ID 99999 not found/i);
  });

  it('should handle large file sizes correctly', async () => {
    const application = await createTestApplication();
    
    const testInput: UploadDocumentInput = {
      application_id: application.id,
      document_type: 'FOTO_RUMAH',
      file_name: 'foto_rumah_high_res.jpg',
      file_path: '/uploads/documents/foto_rumah_high_res.jpg',
      file_size: 10485760 // 10MB
    };

    const result = await uploadDocument(testInput);

    expect(result.file_size).toEqual(10485760);
    expect(typeof result.file_size).toBe('number');
  });

  it('should handle different file paths and names correctly', async () => {
    const application = await createTestApplication();
    
    const testCases = [
      {
        file_name: 'document with spaces.pdf',
        file_path: '/uploads/documents/document with spaces.pdf'
      },
      {
        file_name: 'document_with_underscores.jpg',
        file_path: '/cloud-storage/bucket/document_with_underscores.jpg'
      },
      {
        file_name: 'document-with-dashes.png',
        file_path: 'https://storage.example.com/document-with-dashes.png'
      }
    ];

    for (const testCase of testCases) {
      const input: UploadDocumentInput = {
        application_id: application.id,
        document_type: 'DOKUMEN_TAMBAHAN',
        file_name: testCase.file_name,
        file_path: testCase.file_path,
        file_size: 1024
      };

      const result = await uploadDocument(input);
      expect(result.file_name).toEqual(testCase.file_name);
      expect(result.file_path).toEqual(testCase.file_path);
    }
  });
});