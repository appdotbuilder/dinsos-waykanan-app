import { db } from '../db';
import { socialAssistanceApplicationsTable, statusTimelineTable } from '../db/schema';
import { type UpdateApplicationStatusInput, type SocialAssistanceApplication } from '../schema';
import { eq } from 'drizzle-orm';

export const updateApplicationStatus = async (input: UpdateApplicationStatusInput): Promise<SocialAssistanceApplication> => {
  try {
    // First verify the application exists
    const existingApplication = await db.select()
      .from(socialAssistanceApplicationsTable)
      .where(eq(socialAssistanceApplicationsTable.id, input.id))
      .execute();

    if (existingApplication.length === 0) {
      throw new Error(`Application with ID ${input.id} not found`);
    }

    // Update the application status
    const updatedApplications = await db.update(socialAssistanceApplicationsTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(socialAssistanceApplicationsTable.id, input.id))
      .returning()
      .execute();

    const updatedApplication = updatedApplications[0];

    // Create a timeline entry for the status change
    await db.insert(statusTimelineTable)
      .values({
        application_id: input.id,
        status: input.status,
        notes: `Status updated to ${input.status}`,
      })
      .execute();

    return {
      id: updatedApplication.id,
      tracking_number: updatedApplication.tracking_number,
      full_name: updatedApplication.full_name,
      nik: updatedApplication.nik,
      place_of_birth: updatedApplication.place_of_birth,
      date_of_birth: new Date(updatedApplication.date_of_birth),
      gender: updatedApplication.gender,
      marital_status: updatedApplication.marital_status,
      phone: updatedApplication.phone,
      email: updatedApplication.email,
      address: updatedApplication.address,
      village: updatedApplication.village,
      district: updatedApplication.district,
      assistance_category: updatedApplication.assistance_category,
      assistance_type: updatedApplication.assistance_type,
      reason: updatedApplication.reason,
      family_members_count: updatedApplication.family_members_count,
      monthly_income_range: updatedApplication.monthly_income_range,
      status: updatedApplication.status,
      created_at: updatedApplication.created_at,
      updated_at: updatedApplication.updated_at
    };
  } catch (error) {
    console.error('Application status update failed:', error);
    throw error;
  }
};