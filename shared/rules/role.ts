import { z } from 'zod';

export const zod_rules = {
  name: z.string({ invalid_type_error: "rules.account.name.type" })
    .min(2, "rules.account.name.too_short")
    .max(50, "rules.account.name.too_long"),

  permissions: z.array(
    z.string({ invalid_type_error: "rules.account.permissions.item.type" }),
    { errorMap: () => ({ message: "rules.account.permissions.type" }) }
  )
    .refine(
      (perms) => {
        // Skip validation on client-side, let server handle it
        if (typeof window !== 'undefined') {
          return true;
        }
        const allowed = (globalThis as any).permissions || [];
        return perms.every((p) => allowed.includes(p));
      },
      {
        message: "rules.account.permissions.invalid"
      }
    )
    .default([]),
};