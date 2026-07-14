import { z } from 'zod';

export const zod_rules = {
  email_id: z.string({ error: () => "rules.report_item.email_id.type" })
    .nonempty("rules.report_item.email_id.required"),

  spec_id: z.string({ error: () => "rules.report_item.spec_id.type" })
    .nonempty("rules.report_item.spec_id.required"),

  text: z.string({ error: () => "rules.report_item.text.type" })
    .min(1, "rules.report_item.text.required")
    .max(2000, "rules.report_item.text.too_long"),

  sent_report_item: z.boolean({ error: () => "rules.report_item.sent.type" })
    .default(false)
    .optional(),
};
