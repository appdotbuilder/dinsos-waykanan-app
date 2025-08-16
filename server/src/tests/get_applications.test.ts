import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { socialAssistanceApplicationsTable } from '../db/schema';
import { getApplications } from '../handlers/get_applications';
import { desc } from 'drizzle-orm';

// Test data for creating sample applications
const testApplication1 = {
  tracking_number: 'APP-2024-001',
  full_name: 'John Doe',
  nik: '1234567890123456',
  place_of_birth: 'Jakarta',
  date_of_birth: '1990-01-01',
  gender: 'LAKI_LAKI' as const,
  marital_status: 'MENIKAH' as const,
  phone: '081234567890',
  email: 'john.doe@example.com',
  address: 'Jl. Merdeka No. 1',
  village: 'Kemayoran',
  district: 'Jakarta Pusat',
  assistance_category: 'BANTUAN_SOSIAL' as const,
  assistance_type: 'Bantuan Sembako',
  reason: 'Kehilangan pekerjaan akibat pandemi',
  family_members_count: 4,
  monthly_income_range: '1JT_SAMPAI_2JT' as const,
  status: 'SUBMITTED' as const
};

const testApplication2 = {
  tracking_number: 'APP-2024-002',
  full_name: 'Jane Smith',
  nik: '1234567890123457',
  place_of_birth: 'Surabaya',
  date_of_birth: '1985-05-15',
  gender: 'PEREMPUAN' as const,
  marital_status: 'BELUM_MENIKAH' as const,
  phone: '081234567891',
  email: 'jane.smith@example.com',
  address: 'Jl. Pemuda No. 15',
  village: 'Gubeng',
  district: 'Surabaya Tengah',
  assistance_category: 'BANTUAN_PENDIDIKAN' as const,
  assistance_type: 'Beasiswa Kuliah',
  reason: 'Tidak mampu biaya kuliah',
  family_members_count: 3,
  monthly_income_range: 'KURANG_DARI_1JT' as const,
  status: 'UNDER_REVIEW' as const
};

const testApplication3 = {
  tracking_number: 'APP-2024-003',
  full_name: 'Ahmad Rahman',
  nik: '1234567890123458',
  place_of_birth: 'Bandung',
  date_of_birth: '1992-12-25',
  gender: 'LAKI_LAKI' as const,
  marital_status: 'CERAI_HIDUP' as const,
  phone: '081234567892',
  email: 'ahmad.rahman@example.com',
  address: 'Jl. Asia Afrika No. 25',
  village: 'Braga',
  district: 'Bandung Tengah',
  assistance_category: 'BANTUAN_KESEHATAN' as const,
  assistance_type: 'Kartu Sehat',
  reason: 'Membutuhkan bantuan biaya pengobatan',
  family_members_count: 2,
  monthly_income_range: '2JT_SAMPAI_3JT' as const,
  status: 'APPROVED' as const
};

describe('getApplications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no applications exist', async () => {
    const result = await getApplications();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all applications', async () => {
    // Create test applications
    await db.insert(socialAssistanceApplicationsTable)
      .values([testApplication1, testApplication2, testApplication3])
      .execute();

    const result = await getApplications();

    expect(result).toHaveLength(3);
    
    // Verify all applications are returned with correct data
    const trackingNumbers = result.map(app => app.tracking_number);
    expect(trackingNumbers).toContain('APP-2024-001');
    expect(trackingNumbers).toContain('APP-2024-002');
    expect(trackingNumbers).toContain('APP-2024-003');

    // Verify data integrity for first application
    const johnApp = result.find(app => app.tracking_number === 'APP-2024-001');
    expect(johnApp?.full_name).toBe('John Doe');
    expect(johnApp?.nik).toBe('1234567890123456');
    expect(johnApp?.gender).toBe('LAKI_LAKI');
    expect(johnApp?.assistance_category).toBe('BANTUAN_SOSIAL');
    expect(johnApp?.status).toBe('SUBMITTED');
    expect(johnApp?.family_members_count).toBe(4);
    expect(johnApp?.created_at).toBeInstanceOf(Date);
    expect(johnApp?.updated_at).toBeInstanceOf(Date);
  });

  it('should return applications ordered by created_at descending', async () => {
    // Create applications with specific timing
    const firstApp = await db.insert(socialAssistanceApplicationsTable)
      .values(testApplication1)
      .returning()
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondApp = await db.insert(socialAssistanceApplicationsTable)
      .values(testApplication2)
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const thirdApp = await db.insert(socialAssistanceApplicationsTable)
      .values(testApplication3)
      .returning()
      .execute();

    const result = await getApplications();

    expect(result).toHaveLength(3);

    // Verify ordering - newest first (descending by created_at)
    expect(result[0].tracking_number).toBe('APP-2024-003'); // Latest created
    expect(result[1].tracking_number).toBe('APP-2024-002'); // Second created
    expect(result[2].tracking_number).toBe('APP-2024-001'); // First created

    // Verify timestamps are properly ordered
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return applications with all required fields', async () => {
    // Create a test application
    await db.insert(socialAssistanceApplicationsTable)
      .values(testApplication1)
      .execute();

    const result = await getApplications();

    expect(result).toHaveLength(1);

    const application = result[0];

    // Verify all fields are present and have correct types
    expect(typeof application.id).toBe('number');
    expect(typeof application.tracking_number).toBe('string');
    expect(typeof application.full_name).toBe('string');
    expect(typeof application.nik).toBe('string');
    expect(typeof application.place_of_birth).toBe('string');
    expect(application.date_of_birth).toBeInstanceOf(Date);
    expect(typeof application.gender).toBe('string');
    expect(typeof application.marital_status).toBe('string');
    expect(typeof application.phone).toBe('string');
    expect(typeof application.email).toBe('string');
    expect(typeof application.address).toBe('string');
    expect(typeof application.village).toBe('string');
    expect(typeof application.district).toBe('string');
    expect(typeof application.assistance_category).toBe('string');
    expect(typeof application.assistance_type).toBe('string');
    expect(typeof application.reason).toBe('string');
    expect(typeof application.family_members_count).toBe('number');
    expect(typeof application.monthly_income_range).toBe('string');
    expect(typeof application.status).toBe('string');
    expect(application.created_at).toBeInstanceOf(Date);
    expect(application.updated_at).toBeInstanceOf(Date);
  });

  it('should handle applications with different statuses', async () => {
    // Create applications with various statuses
    const submittedApp = { ...testApplication1, status: 'SUBMITTED' as const };
    const reviewApp = { ...testApplication2, status: 'UNDER_REVIEW' as const };
    const approvedApp = { ...testApplication3, status: 'APPROVED' as const };

    await db.insert(socialAssistanceApplicationsTable)
      .values([submittedApp, reviewApp, approvedApp])
      .execute();

    const result = await getApplications();

    expect(result).toHaveLength(3);

    const statuses = result.map(app => app.status);
    expect(statuses).toContain('SUBMITTED');
    expect(statuses).toContain('UNDER_REVIEW');
    expect(statuses).toContain('APPROVED');
  });

  it('should verify database query structure', async () => {
    // Create test data
    await db.insert(socialAssistanceApplicationsTable)
      .values(testApplication1)
      .execute();

    // Verify that the handler produces the correctly transformed results
    const directQuery = await db.select()
      .from(socialAssistanceApplicationsTable)
      .orderBy(desc(socialAssistanceApplicationsTable.created_at))
      .execute();

    const handlerResult = await getApplications();

    expect(handlerResult).toHaveLength(1);
    expect(handlerResult[0].tracking_number).toBe('APP-2024-001');
    
    // Verify the handler correctly transforms date_of_birth to Date object
    expect(handlerResult[0].date_of_birth).toBeInstanceOf(Date);
    expect(handlerResult[0].date_of_birth.toISOString().split('T')[0]).toBe('1990-01-01');
    
    // Compare other fields (excluding date_of_birth due to type transformation)
    const { date_of_birth: handlerDob, ...handlerRest } = handlerResult[0];
    const { date_of_birth: directDob, ...directRest } = directQuery[0];
    
    expect(handlerRest).toEqual(directRest);
    expect(typeof directDob).toBe('string');
    expect(handlerDob).toBeInstanceOf(Date);
  });
});