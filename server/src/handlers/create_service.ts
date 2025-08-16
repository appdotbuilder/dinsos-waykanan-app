import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput, type Service } from '../schema';

export const createService = async (input: CreateServiceInput): Promise<Service> => {
  try {
    // Insert service record
    const result = await db.insert(servicesTable)
      .values({
        title: input.title,
        description: input.description,
        icon: input.icon,
        is_active: input.is_active,
        order_index: input.order_index
      })
      .returning()
      .execute();

    // Return the created service
    return result[0];
  } catch (error) {
    console.error('Service creation failed:', error);
    throw error;
  }
};