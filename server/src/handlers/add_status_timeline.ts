import { db } from '../db';
import { statusTimelineTable, socialAssistanceApplicationsTable } from '../db/schema';
import { type AddStatusTimelineInput, type StatusTimeline } from '../schema';
import { eq } from 'drizzle-orm';

export const addStatusTimeline = async (input: AddStatusTimelineInput): Promise<StatusTimeline> => {
  try {
    // First verify that the application exists
    const existingApplication = await db.select()
      .from(socialAssistanceApplicationsTable)
      .where(eq(socialAssistanceApplicationsTable.id, input.application_id))
      .limit(1)
      .execute();

    if (existingApplication.length === 0) {
      throw new Error(`Application with ID ${input.application_id} not found`);
    }

    // Insert the new status timeline entry
    const result = await db.insert(statusTimelineTable)
      .values({
        application_id: input.application_id,
        status: input.status,
        notes: input.notes
      })
      .returning()
      .execute();

    const timelineEntry = result[0];
    
    return {
      ...timelineEntry
    };
  } catch (error) {
    console.error('Status timeline creation failed:', error);
    throw error;
  }
};