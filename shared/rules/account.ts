import { z } from 'zod';

export const zod_rules = {
  user: z.string({ invalid_type_error: "rules.account.user.type" })
    .email("rules.account.user.invalid_email"),

  password: z.string({ invalid_type_error: "rules.account.password.type" })
    .min(12, "rules.account.password.too_short")
    .max(128, "rules.account.password.too_long"),

  lang: z.enum(['de', 'en'], { invalid_type_error: "rules.account.lang.invalid" })
    .default('en'),

  roles: z.array(
    z.string({ invalid_type_error: "rules.account.roles.item.type" }),
    { invalid_type_error: "rules.account.roles.type" }
  ).default([]),

  limits: z.string({ invalid_type_error: "rules.account.limits.type" })
    .max(128, "rules.account.limits.too_long")
    .optional()
    .default('basic'),

  validated: z.union([z.literal(0), z.literal(1)], {
    errorMap: () => ({ message: "rules.account.validated.type" })
  }).default(0)
};