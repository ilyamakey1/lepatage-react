import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { db } from '../../database/db.js';
import { products, categories, productVariants } from '../../database/schema.js';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';

export const productsRouter = router({
  // Get all products with optional filtering
  getAll: publicProcedure
    .input(z.object({
      categoryId: z.number().optional(),
      search: z.string().optional(),
      featured: z.boolean().optional(),
      onSale: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      sortBy: z.enum(['name', 'price', 'created']).default('created'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }))
    .query(async ({ input }) => {
      let query = db.select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        shortDescription: products.shortDescription,
        price: products.price,
        salePrice: products.salePrice,
        images: products.images,
        colors: products.colors,
        sizes: products.sizes,
        inStock: products.inStock,
        featured: products.featured,
        isNew: products.isNew,
        onSale: products.onSale,
        tags: products.tags,
        createdAt: products.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        }
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));

      // Apply filters
      const conditions = [];
      
      if (input.categoryId) {
        conditions.push(eq(products.categoryId, input.categoryId));
      }
      
      if (input.search) {
        conditions.push(
          or(
            like(products.name, `%${input.search}%`),
            like(products.description, `%${input.search}%`),
            like(products.tags, `%${input.search}%`)
          )
        );
      }
      
      if (input.featured !== undefined) {
        conditions.push(eq(products.featured, input.featured));
      }
      
      if (input.onSale !== undefined) {
        conditions.push(eq(products.onSale, input.onSale));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = input.sortBy === 'name' ? products.name :
                        input.sortBy === 'price' ? products.price :
                        products.createdAt;
      
      const orderFn = input.sortOrder === 'asc' ? asc : desc;
      query = query.orderBy(orderFn(sortColumn));

      // Apply pagination
      query = query.limit(input.limit).offset(input.offset);

      const result = await query.execute();
      
      // Parse JSON fields
      return result.map(product => ({
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        colors: product.colors ? JSON.parse(product.colors) : [],
        tags: product.tags ? JSON.parse(product.tags) : [],
        sizes: product.sizes ? JSON.parse(product.sizes) : undefined,
      }));
    }),

  // Get single product by slug
  getBySlug: publicProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .query(async ({ input }) => {
      const result = await db.select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        shortDescription: products.shortDescription,
        price: products.price,
        salePrice: products.salePrice,
        images: products.images,
        colors: products.colors,
        sizes: products.sizes,
        inStock: products.inStock,
        featured: products.featured,
        isNew: products.isNew,
        onSale: products.onSale,
        tags: products.tags,
        createdAt: products.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        }
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.slug, input.slug))
      .limit(1);

      if (result.length === 0) {
        throw new Error('Product not found');
      }

      const product = result[0];
      
      // Parse JSON fields
      return {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        colors: product.colors ? JSON.parse(product.colors) : [],
        sizes: product.sizes ? JSON.parse(product.sizes) : [],
        tags: product.tags ? JSON.parse(product.tags) : [],
      };
    }),

  // Get featured products
  getFeatured: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(8),
    }))
    .query(async ({ input }) => {
      const result = await db.select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        shortDescription: products.shortDescription,
        price: products.price,
        salePrice: products.salePrice,
        images: products.images,
        colors: products.colors,
        sizes: products.sizes,
        inStock: products.inStock,
        featured: products.featured,
        isNew: products.isNew,
        onSale: products.onSale,
        tags: products.tags,
        createdAt: products.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        }
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.featured, true))
      .orderBy(desc(products.createdAt))
      .limit(input.limit);

      return result.map(product => ({
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        colors: product.colors ? JSON.parse(product.colors) : [],
        tags: product.tags ? JSON.parse(product.tags) : [],
        sizes: product.sizes ? JSON.parse(product.sizes) : undefined,
      }));
    }),

  // Search products
  search: publicProcedure
    .input(z.object({
      query: z.string().min(2),
      limit: z.number().min(1).max(20).default(10),
    }))
    .query(async ({ input }) => {
      const result = await db.select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        shortDescription: products.shortDescription,
        price: products.price,
        salePrice: products.salePrice,
        images: products.images,
        category: {
          name: categories.name,
          slug: categories.slug,
        }
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        or(
          like(products.name, `%${input.query}%`),
          like(products.description, `%${input.query}%`),
          like(categories.name, `%${input.query}%`)
        )
      )
      .orderBy(desc(products.featured), desc(products.createdAt))
      .limit(input.limit);

      return result.map(product => ({
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
      }));
    }),

  // Update product (admin only)
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      shortDescription: z.string().optional(),
      price: z.number().min(0).optional(),
      salePrice: z.number().min(0).optional(),
      images: z.array(z.string()).optional(),
      colors: z.array(z.string()).optional(),
      sizes: z.array(z.string()).optional(),
      inStock: z.boolean().optional(),
      featured: z.boolean().optional(),
      isNew: z.boolean().optional(),
      onSale: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      
      // Convert arrays to JSON strings
      const dbUpdateData: any = { ...updateData };
      if (updateData.images) {
        dbUpdateData.images = JSON.stringify(updateData.images);
      }
      if (updateData.colors) {
        dbUpdateData.colors = JSON.stringify(updateData.colors);
      }
      if (updateData.sizes) {
        dbUpdateData.sizes = JSON.stringify(updateData.sizes);
      }
      if (updateData.tags) {
        dbUpdateData.tags = JSON.stringify(updateData.tags);
      }
      
      dbUpdateData.updatedAt = new Date().toISOString();

      await db.update(products)
        .set(dbUpdateData)
        .where(eq(products.id, id));

      return { success: true };
    }),

  // Delete product (admin only)
  delete: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),

  // Create new product (admin only)
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      shortDescription: z.string().optional(),
      price: z.number().min(0),
      salePrice: z.number().min(0).optional(),
      categoryId: z.number(),
      images: z.array(z.string()).default([]),
      colors: z.array(z.string()).default([]),
      sizes: z.array(z.string()).default([]),
      inStock: z.boolean().default(true),
      featured: z.boolean().default(false),
      isNew: z.boolean().default(false),
      onSale: z.boolean().default(false),
      tags: z.array(z.string()).default([]),
    }))
    .mutation(async ({ input }) => {
      const dbData = {
        ...input,
        images: JSON.stringify(input.images),
        colors: JSON.stringify(input.colors),
        sizes: JSON.stringify(input.sizes),
        tags: JSON.stringify(input.tags),
      };

      const [newProduct] = await db.insert(products).values(dbData).returning();
      return { success: true, product: newProduct };
    }),
});