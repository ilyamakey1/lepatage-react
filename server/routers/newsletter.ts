import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { db } from '../../database/db.js';
import { newsletterSubscriptions } from '../../database/schema.js';
import { eq, desc } from 'drizzle-orm';

export const newsletterRouter = router({
  // Subscribe to newsletter
  subscribe: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Check if email already exists
        const existing = await db.select()
          .from(newsletterSubscriptions)
          .where(eq(newsletterSubscriptions.email, input.email))
          .limit(1);

        if (existing.length > 0) {
          // If exists but inactive, reactivate
          if (!existing[0].isActive) {
            await db.update(newsletterSubscriptions)
              .set({ isActive: true })
              .where(eq(newsletterSubscriptions.email, input.email));
            
            return { success: true, message: 'Подписка возобновлена!' };
          }
          
          return { success: false, message: 'Этот email уже подписан на рассылку' };
        }

        // Insert new subscription
        await db.insert(newsletterSubscriptions).values({
          email: input.email,
          isActive: true,
        });

        return { success: true, message: 'Спасибо за подписку!' };
      } catch (error) {
        console.error('Newsletter subscription error:', error);
        throw new Error('Ошибка при подписке на рассылку');
      }
    }),

  // Unsubscribe from newsletter
  unsubscribe: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await db.update(newsletterSubscriptions)
          .set({ isActive: false })
          .where(eq(newsletterSubscriptions.email, input.email));

        return { success: true, message: 'Вы отписались от рассылки' };
      } catch (error) {
        console.error('Newsletter unsubscription error:', error);
        throw new Error('Ошибка при отписке от рассылки');
      }
    }),

  // Get all subscribers (for admin)
  getAllSubscribers: publicProcedure
    .query(async () => {
      try {
        const subscribers = await db.select()
          .from(newsletterSubscriptions)
          .orderBy(desc(newsletterSubscriptions.createdAt));

        return subscribers;
      } catch (error) {
        console.error('Error fetching subscribers:', error);
        throw new Error('Ошибка при получении подписчиков');
      }
    }),
});