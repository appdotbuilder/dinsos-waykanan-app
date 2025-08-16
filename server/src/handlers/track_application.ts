import { db } from '../db';
import { 
  socialAssistanceApplicationsTable, 
  documentsTable, 
  statusTimelineTable 
} from '../db/schema';
import { type TrackApplicationInput, type ApplicationTrackingResponse } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export async function trackApplication(input: TrackApplicationInput): Promise<ApplicationTrackingResponse | null> {
  try {
    // Find the application by tracking number and NIK for security verification
    const applications = await db.select()
      .from(socialAssistanceApplicationsTable)
      .where(
        and(
          eq(socialAssistanceApplicationsTable.tracking_number, input.tracking_number),
          eq(socialAssistanceApplicationsTable.nik, input.nik)
        )
      )
      .execute();

    if (applications.length === 0) {
      return null;
    }

    const application = applications[0];

    // Get all documents for this application
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.application_id, application.id))
      .execute();

    // Get status timeline ordered by creation date (newest first)
    const timeline = await db.select()
      .from(statusTimelineTable)
      .where(eq(statusTimelineTable.application_id, application.id))
      .orderBy(desc(statusTimelineTable.created_at))
      .execute();

    // Convert date_of_birth from string to Date to match Zod schema
    const applicationWithConvertedDate = {
      ...application,
      date_of_birth: new Date(application.date_of_birth)
    };

    return {
      application: applicationWithConvertedDate,
      documents,
      timeline
    };
  } catch (error) {
    console.error('Application tracking failed:', error);
    throw error;
  }
}