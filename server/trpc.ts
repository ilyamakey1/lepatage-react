import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { getUserFromAuthHeader, type AuthUser } from './lib/auth.js';

export async function createContext(opts: CreateExpressContextOptions) {
  const user = await getUserFromAuthHeader(opts.req.headers.authorization);
  return { user };
}

export type Context = {
  user: AuthUser | null;
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user?.isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Требуются права администратора',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const adminProcedure = publicProcedure.use(enforceAdmin);
