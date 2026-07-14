import { z } from 'zod';

export const zod_rules = {
  name: z.string({ error: () => "rules.account.name.type" })
    .min(2, "rules.account.name.too_short")
    .max(50, "rules.account.name.too_long"),

  tags: z.array(
    z.string({ error: () => "rules.account.tags.item.type" }),
    { error: () => "rules.account.tags.type" }
  ).default(['user.all']),
};