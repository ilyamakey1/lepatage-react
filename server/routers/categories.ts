import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { db } from '../../database/db.js';
import { categories, products } from '../../database/schema.js';
import { eq, count } from 'drizzle-orm';

export const categoriesRouter = router({
  // Get all categories
  getAll: publicProcedure
    .query(async () => {
      const result = await db.select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
      })
      .from(categories)
      .orderBy(categories.name);

      return result;
    }),

  // Get category by slug with product count
  getBySlug: publicProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .query(async ({ input }) => {
      const result = await db.select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
      })
      .from(categories)
      .where(eq(categories.slug, input.slug))
      .limit(1);

      if (result.length === 0) {
        throw new Error('Category not found');
      }

      const category = result[0];

      // Get product count for this category
      const productCount = await db.select({ count: count() })
        .from(products)
        .where(eq(products.categoryId, category.id));

      return {
        ...category,
        productCount: productCount[0]?.count || 0,
      };
    }),

  // Get categories with product counts
  getWithProductCounts: publicProcedure
    .query(async () => {
      const result = await db.select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .groupBy(categories.id)
      .orderBy(categories.name);

      return result;
    }),
});