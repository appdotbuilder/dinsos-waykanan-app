import { db } from '../db';
import { statusTimelineTable } from '../db/schema';
import { type StatusTimeline } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getStatusTimeline = async (applicationId: number): Promise<StatusTimeline[]> => {
  try {
    // Fetch status timeline records ordered by creation date (most recent first)
    const results = await db.select()
      .from(statusTimelineTable)
      .where(eq(statusTimelineTable.application_id, applicationId))
      .orderBy(desc(statusTimelineTable.created_at))
      .execute();

    // Return the results as-is since no numeric conversions are needed
    return results;
  } catch (error) {
    console.error('Failed to fetch status timeline:', error);
    throw error;
  }
};