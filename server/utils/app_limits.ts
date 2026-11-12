import { defu } from 'defu';
import appDefaults from '#server/metadata/app_defaults.json';
import { withEnvOverrides } from '#bs/../shared/utils/env_overrides';

// The base app's own limits; the app's app_defaults.json (limits) can change them.
const BASE_LIMITS = {
    notifications: { apprise_timeout_ms: 60000 },
    user_events: { retention_days: 30 },            // events older than this are deleted nightly (users delete the others)
    accounts: { max_api_tokens: 20 },
    http: { max_body_mb: 5 },                       // larger request bodies are refused (413); raise it for big imports
    stream: { max_per_user: 10 },                   // open live update streams per user (one per tab); the oldest closes
};

type Limits = typeof BASE_LIMITS & Record<string, any>;
let resolved: Limits | null = null;

/** limits from app_defaults.json, each value overridable by LIMITS_<PATH> (e.g. LIMITS_USER_EVENTS_RETENTION_DAYS). */
export const appLimits = (): Limits =>
    resolved ??= withEnvOverrides(defu((appDefaults as any).limits ?? {}, BASE_LIMITS) as Limits, 'LIMITS', process.env);
