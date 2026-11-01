// Public self-registration is off unless REGISTRATION_ENABLE is explicitly 'true' or '1'.
export function isRegistrationEnabled(): boolean {
    const value = (process.env.REGISTRATION_ENABLE ?? '').trim().toLowerCase();
    return value === 'true' || value === '1';
}
