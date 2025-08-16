import { db } from '../db';
import { documentsTable } from '../db/schema';
import { type Document } from '../schema';
import { eq } from 'drizzle-orm';

export const getDocuments = async (applicationId: number): Promise<Document[]> => {
  try {
    const results = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.application_id, applicationId))
      .execute();

    return results.map(document => ({
      ...document,
      // No numeric conversion needed - all fields are already the correct type
    }));
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    throw error;
  }
};