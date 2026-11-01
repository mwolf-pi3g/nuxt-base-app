/**
 * A copy of `values` in which each leaf can be replaced by an env variable named after its path:
 * { queue: { max_depth: 100 } } with prefix 'LIMITS' -> LIMITS_QUEUE_MAX_DEPTH.
 * Numbers are parsed, booleans accept true/false/1/0, number lists are comma separated ("2000,8000,20000").
 * An invalid value is ignored with a warning; the default stays.
 */
export const withEnvOverrides = <T>(values: T, prefix: string, env: Record<string, string | undefined> = {}): T => {
    const walk = (value: any, path: string[]): any => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, walk(v, [...path, key])]));
        }
        const name = [prefix, ...path].join('_').toUpperCase();
        const raw = env[name];
        if (raw === undefined || raw === '') return value;

        const parsed = parse(value, raw.trim());
        if (parsed === undefined) {
            console.warn(`[env] ${name}="${raw}" is not valid for ${JSON.stringify(value)}; using the default`);
            return value;
        }
        return parsed;
    };
    return walk(values, []);
};

/** Parses an env string like the default it replaces; undefined when it doesn't fit. */
const parse = (def: unknown, raw: string): unknown => {
    if (typeof def === 'number') {
        const n = Number(raw);
        return Number.isFinite(n) ? n : undefined;
    }
    if (typeof def === 'boolean') {
        if (/^(true|1|yes)$/i.test(raw)) return true;
        if (/^(false|0|no)$/i.test(raw)) return false;
        return undefined;
    }
    if (Array.isArray(def)) {
        const items = raw.split(',').map((s) => s.trim()).filter(Boolean);
        if (def.every((d) => typeof d === 'number')) {
            const nums = items.map(Number);
            return nums.every(Number.isFinite) ? nums : undefined;
        }
        return items;
    }
    return raw;
};
