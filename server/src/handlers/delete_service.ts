import { db } from '../db';
import { servicesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteService = async (id: number): Promise<boolean> => {
  try {
    // Delete the service record
    const result = await db.delete(servicesTable)
      .where(eq(servicesTable.id, id))
      .execute();

    // Return true if a record was deleted, false if no record was found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Service deletion failed:', error);
    throw error;
  }
};