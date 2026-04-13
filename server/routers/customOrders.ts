import { z } from 'zod';
import { publicProcedure, adminProcedure, router } from '../trpc.js';
import { db } from '../../database/db.js';
import { customOrders } from '../../database/schema.js';
import { eq, desc } from 'drizzle-orm';

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CO-${timestamp.slice(-6)}${random}`;
}

export const customOrdersRouter = router({
  // Create new custom order
  create: publicProcedure
    .input(z.object({
      // Contact info
      name: z.string().min(2).max(50),
      email: z.string().email(),
      phone: z.string().min(7).max(20),
      preferredContact: z.enum(['phone', 'messenger', 'email']),
      socialLink: z.string().optional(),
      
      // Measurements
      bust: z.string().optional(),
      waist: z.string().optional(),
      hips: z.string().optional(),
      sendMeasurementsLater: z.boolean().default(false),
      photos: z.array(z.string()).default([]),
      figureComments: z.string().optional(),
      
      // Initials
      metalType: z.enum(['gold', 'silver']),
      initials: z.string().min(1).max(20),
      
      // Delivery
      country: z.string().min(1),
      city: z.string().min(1),
      postalCode: z.string().optional(),
      address: z.string().min(1),
      deliveryMethod: z.enum(['courier', 'europost', 'cdek']),
      desiredDate: z.string().optional(),
      needOnlineMeasurements: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const orderNumber = generateOrderNumber();
      
      const [customOrder] = await db.insert(customOrders).values({
        orderNumber,
        name: input.name,
        email: input.email,
        phone: input.phone,
        preferredContact: input.preferredContact,
        socialLink: input.socialLink || null,
        bust: input.bust || null,
        waist: input.waist || null,
        hips: input.hips || null,
        sendMeasurementsLater: input.sendMeasurementsLater,
        photos: JSON.stringify(input.photos),
        figureComments: input.figureComments || null,
        metalType: input.metalType,
        initials: input.initials,
        country: input.country,
        city: input.city,
        postalCode: input.postalCode || null,
        address: input.address,
        deliveryMethod: input.deliveryMethod,
        desiredDate: input.desiredDate || null,
        needOnlineMeasurements: input.needOnlineMeasurements,
        status: 'new',
      }).returning();

      return customOrder;
    }),

  // Get all custom orders (admin only)
  getAll: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      status: z.enum(['new', 'in_progress', 'completed', 'cancelled']).optional(),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(customOrders);
      
      if (input.status) {
        query = query.where(eq(customOrders.status, input.status)) as typeof query;
      }
      
      const orders = await query
        .orderBy(desc(customOrders.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Parse JSON fields
      return orders.map(order => ({
        ...order,
        photos: order.photos ? JSON.parse(order.photos) : [],
      }));
    }),

  // Get single custom order by ID (admin only)
  getById: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const [order] = await db
        .select()
        .from(customOrders)
        .where(eq(customOrders.id, input.id));

      if (!order) {
        throw new Error('Custom order not found');
      }

      return {
        ...order,
        photos: order.photos ? JSON.parse(order.photos) : [],
      };
    }),

  // Update custom order status and notes (admin only)
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['new', 'in_progress', 'completed', 'cancelled']).optional(),
      adminNotes: z.string().optional(),
      estimatedPrice: z.number().min(0).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      
      const [updatedOrder] = await db
        .update(customOrders)
        .set({
          ...updateData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(customOrders.id, id))
        .returning();

      if (!updatedOrder) {
        throw new Error('Custom order not found');
      }

      return {
        ...updatedOrder,
        photos: updatedOrder.photos ? JSON.parse(updatedOrder.photos) : [],
      };
    }),

  // Delete custom order (admin only)
  delete: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const [deletedOrder] = await db
        .delete(customOrders)
        .where(eq(customOrders.id, input.id))
        .returning();

      if (!deletedOrder) {
        throw new Error('Custom order not found');
      }

      return { success: true };
    }),

  // Get order counts by status (admin only)
  getStats: adminProcedure
    .query(async () => {
      const allOrders = await db.select().from(customOrders);
      
      const stats = {
        total: allOrders.length,
        new: allOrders.filter(o => o.status === 'new').length,
        in_progress: allOrders.filter(o => o.status === 'in_progress').length,
        completed: allOrders.filter(o => o.status === 'completed').length,
        cancelled: allOrders.filter(o => o.status === 'cancelled').length,
      };

      return stats;
    }),
});
