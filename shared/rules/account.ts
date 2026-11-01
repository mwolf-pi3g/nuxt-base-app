import { z } from 'zod';

export const zod_rules = {
  // A username: letters, digits and . _ - @ + (so email addresses stay valid usernames)
  user: z.string({ invalid_type_error: "table.account.rules.user.type" })
    .min(1, "table.account.rules.user.required")
    .max(128, "table.account.rules.user.too_long")
    .regex(/^[A-Za-z0-9._@+-]+$/, "table.account.rules.user.invalid"),

  password: z.string({ invalid_type_error: "table.account.rules.password.type" })
    .min(12, "table.account.rules.password.too_short")
    .max(128, "table.account.rules.password.too_long"),

  lang: z.enum(['de', 'en'], { errorMap: () => ({ message: "table.account.rules.lang.invalid" }) })
    .default('en'),

  roles: z.array(
    z.string({ invalid_type_error: "table.account.rules.roles.item.type" }),
    { invalid_type_error: "table.account.rules.roles.type" }
  ).default([]),

  cron_active: z.union([z.literal(0), z.literal(1)], {
    errorMap: () => ({ message: "table.account.rules.cron_active.type" })
  }).default(1)
};

// API tokens: only the description is entered; the rest is made by the server
export const token_rules = {
  description: z.string({ invalid_type_error: "table.api_tokens.rules.description.type" })
    .trim()
    .min(1, "table.api_tokens.rules.description.required")
    .max(100, "table.api_tokens.rules.description.too_long"),
};
