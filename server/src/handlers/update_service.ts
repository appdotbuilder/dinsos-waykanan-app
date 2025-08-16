import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type UpdateServiceInput, type Service } from '../schema';
import { eq } from 'drizzle-orm';

export const updateService = async (input: UpdateServiceInput): Promise<Service> => {
  try {
    // First, verify the service exists
    const existingService = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, input.id))
      .execute();

    if (existingService.length === 0) {
      throw new Error(`Service with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.icon !== undefined) {
      updateData.icon = input.icon;
    }

    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    if (input.order_index !== undefined) {
      updateData.order_index = input.order_index;
    }

    // Update the service
    const result = await db.update(servicesTable)
      .set(updateData)
      .where(eq(servicesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Service update failed:', error);
    throw error;
  }
};