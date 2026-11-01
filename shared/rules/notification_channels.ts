import { z } from 'zod';

// Rules of a notification channel, used by the form and the server.
// The fixed fields have static rules; `config` depends on the provider's service description
// ({ templates, tokens }, Apprise's format, which every provider uses) and is built with configSchema().

export const zod_rules = {
  name: z.string({ invalid_type_error: "table.notification_channels.rules.name.type", required_error: "table.notification_channels.rules.name.required" })
    .trim()
    .min(1, "table.notification_channels.rules.name.required")
    .max(100, "table.notification_channels.rules.name.too_long"),

  provider: z.string({ invalid_type_error: "table.notification_channels.rules.provider.required", required_error: "table.notification_channels.rules.provider.required" })
    .min(1, "table.notification_channels.rules.provider.required"),

  type: z.string({ invalid_type_error: "table.notification_channels.rules.type.required", required_error: "table.notification_channels.rules.type.required" })
    .min(1, "table.notification_channels.rules.type.required"),

  config: z.record(z.any(), {
    errorMap: () => ({ message: "table.notification_channels.rules.config.type" })
  }),
};

/** A service as a provider describes it: URL templates and the tokens they use. */
export interface ServiceDetails {
  templates: string[];
  tokens: Record<string, any>;
}

/** Builds a message from an i18n key. The server keeps the key; the form passes `t` to fill in {min}, {max}. */
export type RuleMessage = (key: string, params?: Record<string, unknown>) => string;
const keyOnly: RuleMessage = (key) => key;

const M = 'table.notification_channels.rules.config';

/** Keys a template uses: '{schema}://{user}@{host}' -> ['schema', 'user', 'host'] */
export const templateKeys = (template: string | undefined): string[] =>
  [...(template || '').matchAll(/\{([a-zA-Z0-9_-]+)\}/g)].map((m) => m[1]!);

const isEmpty = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/**
 * Allowed values of a choice token: a list (strings or { title, value }), or a map keyed by the value of the
 * token named in `conditional_field`. Null when they can't be known (no list for that parent value).
 */
export const choiceValues = (token: any, parentValue?: unknown): string[] | null => {
  const raw = token.conditional_field ? token.values?.[String(parentValue)] : token.values;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw.map((v: any) => String(v && typeof v === 'object' ? v.value : v));
};

/** A token's regex, given as [pattern, flags]; null when the pattern isn't valid in JavaScript. */
const tokenRegex = (token: any): RegExp | null => {
  if (!Array.isArray(token.regex) || !token.regex[0]) return null;
  try {
    return new RegExp(token.regex[0], (token.regex[1] || '').replace(/[^dgimsuy]/g, ''));
  } catch {
    return null;
  }
};

/** Rule for the value of one token. `parentValue` is the value of its conditional_field, if it has one. */
export const tokenRule = (token: any, parentValue?: unknown, msg: RuleMessage = keyOnly): z.ZodTypeAny => {
  const type = String(token?.type || '');
  let rule: z.ZodTypeAny;

  if (type === 'bool') {
    rule = z.union([z.boolean(), z.enum(['true', 'false', 'yes', 'no', '1', '0']), z.literal(1), z.literal(0)], {
      errorMap: () => ({ message: msg(`${M}.bool`) })
    });
  } else if (type.startsWith('choice')) {
    const values = choiceValues(token, parentValue);
    rule = z.union([z.string(), z.number()], { errorMap: () => ({ message: msg(`${M}.choice`) }) })
      .refine((v) => !values || values.includes(String(v)), msg(`${M}.choice`));
  } else if (type === 'int' || type === 'float') {
    let num = z.number({ invalid_type_error: msg(`${M}.number`) });
    if (type === 'int') num = num.int(msg(`${M}.number`));
    if (typeof token.min === 'number') num = num.min(token.min, msg(`${M}.min`, { min: token.min }));
    if (typeof token.max === 'number') num = num.max(token.max, msg(`${M}.max`, { max: token.max }));
    rule = z.union([z.number(), z.string().trim().regex(/^-?\d+(\.\d+)?$/, msg(`${M}.number`))], {
      errorMap: () => ({ message: msg(`${M}.number`) })
    }).transform(Number).pipe(num);
  } else if (type === 'string' || type.startsWith('list')) {
    const regex = tokenRegex(token);
    let str = z.string().trim();
    if (regex) str = str.regex(regex, msg(`${M}.regex`));
    rule = z.union([z.string(), z.number()], { errorMap: () => ({ message: msg(`${M}.invalid`) }) })
      .transform(String).pipe(str);
  } else {
    rule = z.any();   // a type the form doesn't offer: not checked
  }

  // Empty means "not set": refused when required, otherwise skipped
  return z.preprocess(
    (v) => (isEmpty(v) ? undefined : v),
    token?.required
      ? z.any().refine((v) => v !== undefined, msg(`${M}.required`)).pipe(rule)
      : rule.optional()
  );
};

/** Schema of a channel's `config` for one service: the template must be one of the service's, each token it uses must be valid. */
export const configSchema = (details: ServiceDetails, config: Record<string, any> = {}, msg: RuleMessage = keyOnly) => {
  const templates = details?.templates || [];
  const tokens = details?.tokens || {};
  const shape: Record<string, z.ZodTypeAny> = {
    template: z.string({ errorMap: () => ({ message: msg(`${M}.template`) }) })
      .refine((t) => templates.includes(t), msg(`${M}.template`)),
  };
  for (const key of templateKeys(config.template)) {
    const token = tokens[key];
    if (token) shape[key] = tokenRule(token, token.conditional_field ? config[token.conditional_field] : undefined, msg);
  }
  return z.object(shape).passthrough();
};
