import { z } from 'zod';

export const zod_rules = {
  name: z.string({
    error: (issue) => "report_spec.name.type"
  }).min(2, "rules.report_spec.name.min").max(50, "rules.report_spec.name.max"),

  dow: z.array(z.boolean({ error: (issue) => "rules.report_spec.dow.invalid" })).length(7, "rules.report_spec.dow.invalid"),

  desc: z.string()
    .min(20, "rules.report_spec.desc.min")
    .max(300, "rules.report_spec.desc.max")
    .nonempty(),

  lang: z.enum(['de', 'en']).default('en'),
};



