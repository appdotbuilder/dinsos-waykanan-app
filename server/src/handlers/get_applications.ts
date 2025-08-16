import { db } from '../db';
import { socialAssistanceApplicationsTable } from '../db/schema';
import { desc } from 'drizzle-orm';
import { type SocialAssistanceApplication } from '../schema';

export const getApplications = async (): Promise<SocialAssistanceApplication[]> => {
  try {
    // Fetch all social assistance applications ordered by created_at descending (newest first)
    const results = await db.select()
      .from(socialAssistanceApplicationsTable)
      .orderBy(desc(socialAssistanceApplicationsTable.created_at))
      .execute();

    // Convert date_of_birth from string to Date object to match schema expectations
    return results.map(application => ({
      ...application,
      date_of_birth: new Date(application.date_of_birth)
    }));
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    throw error;
  }
};