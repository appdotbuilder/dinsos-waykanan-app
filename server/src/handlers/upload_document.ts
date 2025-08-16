import { db } from '../db';
import { documentsTable, socialAssistanceApplicationsTable } from '../db/schema';
import { type UploadDocumentInput, type Document } from '../schema';
import { eq } from 'drizzle-orm';

export const uploadDocument = async (input: UploadDocumentInput): Promise<Document> => {
  try {
    // Verify that the application exists
    const existingApplication = await db.select()
      .from(socialAssistanceApplicationsTable)
      .where(eq(socialAssistanceApplicationsTable.id, input.application_id))
      .limit(1)
      .execute();

    if (existingApplication.length === 0) {
      throw new Error(`Application with ID ${input.application_id} not found`);
    }

    // Insert document record
    const result = await db.insert(documentsTable)
      .values({
        application_id: input.application_id,
        document_type: input.document_type,
        file_name: input.file_name,
        file_path: input.file_path,
        file_size: input.file_size
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Document upload failed:', error);
    throw error;
  }
};