import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { socialAssistanceApplicationsTable } from '../db/schema';
import { type CreateApplicationInput } from '../schema';
import { createApplication } from '../handlers/create_application';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateApplicationInput = {
  // Personal details
  full_name: 'John Doe',
  nik: '1234567890123456',
  place_of_birth: 'Jakarta',
  date_of_birth: new Date('1985-05-15'),
  gender: 'LAKI_LAKI',
  marital_status: 'MENIKAH',
  phone: '081234567890',
  email: 'john.doe@example.com',
  address: 'Jl. Example No. 123',
  village: 'Example Village',
  district: 'Example District',
  // Assistance details
  assistance_category: 'BANTUAN_SOSIAL',
  assistance_type: 'Program Keluarga Harapan',
  reason: 'Membutuhkan bantuan untuk kebutuhan sehari-hari keluarga',
  family_members_count: 4,
  monthly_income_range: '1JT_SAMPAI_2JT'
};

describe('createApplication', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an application successfully', async () => {
    const result = await createApplication(testInput);

    // Basic field validation
    expect(result.full_name).toEqual('John Doe');
    expect(result.nik).toEqual('1234567890123456');
    expect(result.place_of_birth).toEqual('Jakarta');
    expect(result.date_of_birth).toEqual(testInput.date_of_birth);
    expect(result.gender).toEqual('LAKI_LAKI');
    expect(result.marital_status).toEqual('MENIKAH');
    expect(result.phone).toEqual('081234567890');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.address).toEqual('Jl. Example No. 123');
    expect(result.village).toEqual('Example Village');
    expect(result.district).toEqual('Example District');
    expect(result.assistance_category).toEqual('BANTUAN_SOSIAL');
    expect(result.assistance_type).toEqual('Program Keluarga Harapan');
    expect(result.reason).toEqual('Membutuhkan bantuan untuk kebutuhan sehari-hari keluarga');
    expect(result.family_members_count).toEqual(4);
    expect(result.monthly_income_range).toEqual('1JT_SAMPAI_2JT');
    expect(result.status).toEqual('SUBMITTED');
    expect(result.id).toBeDefined();
    expect(result.tracking_number).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique tracking number', async () => {
    const result = await createApplication(testInput);

    expect(result.tracking_number).toMatch(/^SA-\d+-[A-Z0-9]{5}$/);
    expect(result.tracking_number.length).toBeGreaterThan(10);
  });

  it('should save application to database', async () => {
    const result = await createApplication(testInput);

    // Query the database to verify the record was saved
    const applications = await db.select()
      .from(socialAssistanceApplicationsTable)
      .where(eq(socialAssistanceApplicationsTable.id, result.id))
      .execute();

    expect(applications).toHaveLength(1);
    const savedApplication = applications[0];
    
    expect(savedApplication.full_name).toEqual('John Doe');
    expect(savedApplication.nik).toEqual('1234567890123456');
    expect(savedApplication.tracking_number).toEqual(result.tracking_number);
    expect(savedApplication.status).toEqual('SUBMITTED');
    expect(savedApplication.family_members_count).toEqual(4);
    expect(savedApplication.created_at).toBeInstanceOf(Date);
    expect(savedApplication.updated_at).toBeInstanceOf(Date);
    // Database stores date as string, convert for comparison
    expect(savedApplication.date_of_birth).toEqual('1985-05-15');
  });

  it('should handle different assistance categories correctly', async () => {
    const healthInput = {
      ...testInput,
      assistance_category: 'BANTUAN_KESEHATAN' as const,
      assistance_type: 'Bantuan Pengobatan'
    };

    const result = await createApplication(healthInput);

    expect(result.assistance_category).toEqual('BANTUAN_KESEHATAN');
    expect(result.assistance_type).toEqual('Bantuan Pengobatan');
  });

  it('should handle different gender and marital status correctly', async () => {
    const femaleInput = {
      ...testInput,
      full_name: 'Jane Doe',
      gender: 'PEREMPUAN' as const,
      marital_status: 'BELUM_MENIKAH' as const
    };

    const result = await createApplication(femaleInput);

    expect(result.full_name).toEqual('Jane Doe');
    expect(result.gender).toEqual('PEREMPUAN');
    expect(result.marital_status).toEqual('BELUM_MENIKAH');
  });

  it('should handle different income ranges correctly', async () => {
    const highIncomeInput = {
      ...testInput,
      monthly_income_range: 'LEBIH_DARI_5JT' as const
    };

    const result = await createApplication(highIncomeInput);

    expect(result.monthly_income_range).toEqual('LEBIH_DARI_5JT');
  });

  it('should generate different tracking numbers for multiple applications', async () => {
    const result1 = await createApplication(testInput);
    
    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result2 = await createApplication({
      ...testInput,
      full_name: 'Jane Smith',
      nik: '6543210987654321',
      email: 'jane.smith@example.com'
    });

    expect(result1.tracking_number).not.toEqual(result2.tracking_number);
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should set default status to SUBMITTED', async () => {
    const result = await createApplication(testInput);

    expect(result.status).toEqual('SUBMITTED');
  });

  it('should handle date_of_birth correctly', async () => {
    const specificDate = new Date('1990-12-25');
    const dateInput = {
      ...testInput,
      date_of_birth: specificDate
    };

    const result = await createApplication(dateInput);

    expect(result.date_of_birth).toEqual(specificDate);
    
    // Verify in database
    const applications = await db.select()
      .from(socialAssistanceApplicationsTable)
      .where(eq(socialAssistanceApplicationsTable.id, result.id))
      .execute();

    // Database stores date as string, so we compare the date string
    expect(applications[0].date_of_birth).toEqual('1990-12-25');
  });
});