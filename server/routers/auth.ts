import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { db } from '../../database/db.js';
import { users } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authRouter = router({
  // Register new user
  register: publicProcedure
    .input(z.object({
      email: z.string().email('Неверный формат email'),
      password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
      firstName: z.string().min(1, 'Имя обязательно'),
      lastName: z.string().min(1, 'Фамилия обязательна'),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Check if user already exists
        const existingUser = await db.select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (existingUser.length > 0) {
          throw new Error('Пользователь с таким email уже существует');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Create user
        const newUser = await db.insert(users).values({
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          passwordHash,
          isAdmin: false,
        }).returning();

        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: newUser[0].id, 
            email: newUser[0].email,
            isAdmin: newUser[0].isAdmin 
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return {
          success: true,
          message: 'Регистрация успешна!',
          user: {
            id: newUser[0].id,
            email: newUser[0].email,
            firstName: newUser[0].firstName,
            lastName: newUser[0].lastName,
            isAdmin: newUser[0].isAdmin,
          },
          token,
        };
      } catch (error) {
        console.error('Registration error:', error);
        throw new Error((error as any).message || 'Ошибка при регистрации');
      }
    }),

  // Login user
  login: publicProcedure
    .input(z.object({
      email: z.string().email('Неверный формат email'),
      password: z.string().min(1, 'Пароль обязателен'),
    }))
    .mutation(async ({ input }) => {
      try {
        // Find user
        const user = await db.select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (user.length === 0) {
          throw new Error('Неверный email или пароль');
        }

        // Check password
        const isValidPassword = await bcrypt.compare(input.password, user[0].passwordHash || '');
        
        if (!isValidPassword) {
          throw new Error('Неверный email или пароль');
        }

        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: user[0].id, 
            email: user[0].email,
            isAdmin: user[0].isAdmin 
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return {
          success: true,
          message: 'Вход выполнен успешно!',
          user: {
            id: user[0].id,
            email: user[0].email,
            firstName: user[0].firstName,
            lastName: user[0].lastName,
            isAdmin: user[0].isAdmin,
          },
          token,
        };
      } catch (error) {
        console.error('Login error:', error);
        throw new Error((error as any).message || 'Ошибка при входе');
      }
    }),

  // Get all users (for admin)
  getAllUsers: publicProcedure
    .query(async () => {
      try {
        const allUsers = await db.select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
        }).from(users);

        return allUsers;
      } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error('Ошибка при получении пользователей');
      }
    }),

  // Verify token
  verifyToken: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const decoded = jwt.verify(input.token, JWT_SECRET) as any;
        
        // Get fresh user data
        const user = await db.select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          isAdmin: users.isAdmin,
        })
          .from(users)
          .where(eq(users.id, decoded.userId))
          .limit(1);

        if (user.length === 0) {
          throw new Error('Пользователь не найден');
        }

        return {
          valid: true,
          user: user[0],
        };
      } catch (error) {
        return {
          valid: false,
          user: null,
        };
      }
    }),

  // Update user profile
  updateUser: publicProcedure
    .input(z.object({
      defaultAddress: z.string().optional(),
      phone: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // For now, we'll use a simple approach without proper auth middleware
        // In production, you should implement proper JWT verification
        const token = input.token; // This should come from context in production
        
        if (!token) {
          throw new Error('Требуется авторизация');
        }

        // Verify token and get user ID
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const userId = decoded.userId;

        // Update user
        const updatedUser = await db.update(users)
          .set({
            ...input,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(users.id, userId))
          .returning();

        return {
          success: true,
          message: 'Профиль обновлен',
          user: updatedUser[0],
        };
      } catch (error) {
        console.error('Update user error:', error);
        throw new Error((error as any).message || 'Ошибка при обновлении профиля');
      }
    }),
});