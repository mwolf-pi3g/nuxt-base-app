import { zod_rules } from '#b/shared/rules/account'
import { getRules } from '#b/shared/rules/getRules'

const rules = getRules(zod_rules);

const getHeaders = (t: any) => [
    { title: t('frontend.auth.email'), key: 'user', set_type: "string_line", rules: rules.user },
    { title: t('frontend.auth.password'), key: 'password', set_type: "string_line", type: "password" },
];

export default function (t: any) {
    return {
        headers: getHeaders(t),
    }
}
