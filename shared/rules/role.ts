import { z } from 'zod';

export const zod_rules = {
  name: z.string({ invalid_type_error: "table.role.rules.name.type" })
    .trim()
    .min(2, "table.role.rules.name.too_short")
    .max(50, "table.role.rules.name.too_long")
    .regex(/^[^\p{Cc}]*$/u, "table.role.rules.name.control"),   // no control characters

  permissions: z.array(
    z.string({ invalid_type_error: "table.role.rules.permissions.item.type" }),
    { errorMap: () => ({ message: "table.role.rules.permissions.type" }) }
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
        message: "table.role.rules.permissions.invalid"
      }
    )
    .default([]),
};