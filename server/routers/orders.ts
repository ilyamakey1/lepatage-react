import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../database/db.js';
import { orders, orderItems, products } from '../../database/schema.js';
import { eq, desc } from 'drizzle-orm';

// Order creation schema
const createOrderSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  shippingAddress: z.object({
    country: z.string(),
    city: z.string(),
    address: z.string(),
    postalCode: z.string().optional(),
    region: z.string().optional(),
  }),
  billingAddress: z.object({
    country: z.string(),
    city: z.string(),
    address: z.string(),
    postalCode: z.string().optional(),
    region: z.string().optional(),
  }).optional(),
  currency: z.enum(['BYN', 'EUR', 'USD', 'RUB']).default('BYN'),
  paymentMethod: z.enum(['bepaid', 'cash', 'transfer']).default('bepaid'),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().min(1),
    selectedColor: z.string().optional(),
    selectedSize: z.string().optional(),
  })).min(1),
  notes: z.string().optional(),
});

// Address validation schema
const addressSchema = z.object({
  country: z.string().min(1, 'Страна обязательна'),
  city: z.string().min(1, 'Город обязателен'),
  address: z.string().min(5, 'Адрес должен содержать минимум 5 символов'),
  postalCode: z.string().optional(),
  region: z.string().optional(),
});

export const ordersRouter = router({
  // Create new order
  create: publicProcedure
    .input(createOrderSchema)
    .mutation(async ({ input }) => {
      try {
        // Generate unique order number
        const orderNumber = `LP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Calculate totals
        let subtotal = 0;
        const orderItemsData = [];

        for (const item of input.items) {
          // Get product details
          const product = await db.select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          if (product.length === 0) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }

          const productData = product[0];
          const price = productData.salePrice || productData.price;
          const itemTotal = price * item.quantity;
          subtotal += itemTotal;

          orderItemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            price: price,
            name: productData.name,
            image: productData.images ? JSON.parse(productData.images)[0] : null,
          });
        }

        // Calculate shipping (можно настроить логику)
        const shipping = subtotal > 100 ? 0 : 10; // Бесплатная доставка от 100 BYN
        const tax = 0; // НДС можно добавить позже
        const total = subtotal + shipping + tax;

        // Create order
        const [newOrder] = await db.insert(orders).values({
          orderNumber,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          shippingAddress: JSON.stringify(input.shippingAddress),
          billingAddress: input.billingAddress ? JSON.stringify(input.billingAddress) : JSON.stringify(input.shippingAddress),
          subtotal,
          shipping,
          tax,
          total,
          currency: input.currency,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
        }).returning();

        // Create order items
        const orderItemsWithOrderId = orderItemsData.map(item => ({
          ...item,
          orderId: newOrder.id,
        }));

        await db.insert(orderItems).values(orderItemsWithOrderId);

        return {
          success: true,
          order: {
            ...newOrder,
            items: orderItemsWithOrderId,
          },
        };
      } catch (error) {
        console.error('Error creating order:', error);
        throw new Error('Failed to create order');
      }
    }),

  // Get order by number
  getByNumber: publicProcedure
    .input(z.object({
      orderNumber: z.string(),
    }))
    .query(async ({ input }) => {
      const order = await db.select()
        .from(orders)
        .where(eq(orders.orderNumber, input.orderNumber))
        .limit(1);

      if (order.length === 0) {
        throw new Error('Order not found');
      }

      const items = await db.select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order[0].id));

      return {
        ...order[0],
        shippingAddress: order[0].shippingAddress ? JSON.parse(order[0].shippingAddress) : null,
        billingAddress: order[0].billingAddress ? JSON.parse(order[0].billingAddress) : null,
        paymentData: order[0].paymentData ? JSON.parse(order[0].paymentData) : null,
        items,
      };
    }),

  // Get all orders (for admin)
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(orders).orderBy(desc(orders.createdAt));

      if (input.status) {
        query = query.where(eq(orders.status, input.status));
      }

      const ordersResult = await query.limit(input.limit).offset(input.offset);

      return ordersResult.map(order => ({
        ...order,
        shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : null,
        billingAddress: order.billingAddress ? JSON.parse(order.billingAddress) : null,
        paymentData: order.paymentData ? JSON.parse(order.paymentData) : null,
      }));
    }),

  // Update order status
  updateStatus: publicProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
      paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: any = {
        status: input.status,
        updatedAt: new Date().toISOString(),
      };

      if (input.paymentStatus) {
        updateData.paymentStatus = input.paymentStatus;
      }

      await db.update(orders)
        .set(updateData)
        .where(eq(orders.id, input.orderId));

      return { success: true };
    }),

  // Validate address
  validateAddress: publicProcedure
    .input(addressSchema)
    .mutation(async ({ input }) => {
      // Базовая валидация адреса
      const errors: string[] = [];

      // Проверка на поддерживаемые страны
      const supportedCountries = ['Беларусь', 'Belarus', 'Россия', 'Russia', 'РФ'];
      if (!supportedCountries.some(country => 
        input.country.toLowerCase().includes(country.toLowerCase())
      )) {
        errors.push('Доставка доступна только в Беларуси и России');
      }

      // Проверка города
      if (input.city.length < 2) {
        errors.push('Название города слишком короткое');
      }

      // Проверка адреса
      if (input.address.length < 5) {
        errors.push('Адрес должен быть более подробным');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    }),
});