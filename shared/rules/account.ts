import { z } from 'zod';

export const zod_rules = {
  user: z.string({ error: () => "rules.account.user.type" })
    .email("rules.account.user.invalid_email"),

  email: z.string({ error: () => "rules.account.email.type" })
    .email("rules.account.email.invalid")
    .optional(),

  password: z.string({ error: () => "rules.account.password.type" })
    .min(12, "rules.account.password.too_short")
    .max(128, "rules.account.password.too_long"),

  lang: z.enum(['de', 'en'], { error: () => "rules.account.lang.invalid" })
    .default('en'),

  roles: z.array(
    z.string({ error: () => "rules.account.roles.item.type" }),
    { error: () => "rules.account.roles.type" }
  ).default(['user']),

  limits: z.string({ error: () => "rules.account.limits.type" })
    .default('free'),

  validated: z.boolean({ error: () => "rules.account.validated.type" })
    .default(false),
};