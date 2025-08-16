import { db } from '../db';
import { socialAssistanceApplicationsTable } from '../db/schema';
import { type CreateApplicationInput, type SocialAssistanceApplication } from '../schema';

export const createApplication = async (input: CreateApplicationInput): Promise<SocialAssistanceApplication> => {
  try {
    // Generate unique tracking number
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 5).toUpperCase();
    const trackingNumber = `SA-${timestamp}-${randomId}`;

    // Insert application record
    const result = await db.insert(socialAssistanceApplicationsTable)
      .values({
        tracking_number: trackingNumber,
        full_name: input.full_name,
        nik: input.nik,
        place_of_birth: input.place_of_birth,
        date_of_birth: input.date_of_birth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        gender: input.gender,
        marital_status: input.marital_status,
        phone: input.phone,
        email: input.email,
        address: input.address,
        village: input.village,
        district: input.district,
        assistance_category: input.assistance_category,
        assistance_type: input.assistance_type,
        reason: input.reason,
        family_members_count: input.family_members_count,
        monthly_income_range: input.monthly_income_range,
        status: 'SUBMITTED',
        updated_at: new Date()
      })
      .returning()
      .execute();

    // Convert date_of_birth string back to Date object before returning
    const application = result[0];
    return {
      ...application,
      date_of_birth: new Date(application.date_of_birth)
    };
  } catch (error) {
    console.error('Application creation failed:', error);
    throw error;
  }
};