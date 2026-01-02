import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { db } from '../../database/db.js';
import { homepageSettings } from '../../database/schema.js';
import { eq } from 'drizzle-orm';

export const homepageRouter = router({
  // Get all homepage settings
  getSettings: publicProcedure.query(async () => {
    try {
      const settings = await db.select().from(homepageSettings);
      
      // Convert array to object for easier access
      const settingsObj: Record<string, string> = {};
      settings.forEach(setting => {
        settingsObj[setting.key] = setting.value || '';
      });
      
      return settingsObj;
    } catch (error) {
      console.error('Error fetching homepage settings:', error);
      throw new Error('Ошибка при получении настроек главной страницы');
    }
  }),

  // Update homepage setting
  updateSetting: publicProcedure
    .input(z.object({
      key: z.string(),
      value: z.string().nullable(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Check if setting exists
        const existing = await db.select()
          .from(homepageSettings)
          .where(eq(homepageSettings.key, input.key))
          .limit(1);

        if (existing.length > 0) {
          // Update existing
          await db.update(homepageSettings)
            .set({
              value: input.value,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(homepageSettings.key, input.key));
        } else {
          // Create new
          await db.insert(homepageSettings).values({
            key: input.key,
            value: input.value,
          });
        }

        return { success: true };
      } catch (error) {
        console.error('Error updating homepage setting:', error);
        throw new Error('Ошибка при обновлении настройки');
      }
    }),

  // Update multiple settings at once
  updateSettings: publicProcedure
    .input(z.object({
      settings: z.record(z.string(), z.string().nullable()),
    }))
    .mutation(async ({ input }) => {
      try {
        for (const [key, value] of Object.entries(input.settings)) {
          const existing = await db.select()
            .from(homepageSettings)
            .where(eq(homepageSettings.key, key))
            .limit(1);

          if (existing.length > 0) {
            await db.update(homepageSettings)
              .set({
                value,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(homepageSettings.key, key));
          } else {
            await db.insert(homepageSettings).values({
              key,
              value,
            });
          }
        }

        return { success: true };
      } catch (error) {
        console.error('Error updating homepage settings:', error);
        throw new Error('Ошибка при обновлении настроек');
      }
    }),
});


