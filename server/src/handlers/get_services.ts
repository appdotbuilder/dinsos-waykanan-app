import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type Service } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getServices = async (): Promise<Service[]> => {
  try {
    // Fetch active services ordered by order_index
    const results = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.is_active, true))
      .orderBy(asc(servicesTable.order_index))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch services:', error);
    throw error;
  }
};