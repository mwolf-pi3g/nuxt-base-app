import { z } from "zod";

export const getRules = <T extends Record<string, z.ZodTypeAny>>(zod_rules: T) => {
    return Object.fromEntries(
        Object.entries(zod_rules).map(([key, schema]) => [
            key,
            (val: any) => {
                const rv = schema.safeParse(val);
                return rv.success || rv.error?.issues?.[0]?.message || "Invalid input";
            }
        ])
    ) as { [K in keyof T]: (val: z.infer<T[K]>) => true | string };
}   