import { zod_rules } from '#b/shared/rules/account';
import { apiGet } from '~/util/fetch/wrappers'

const getHeaders = async (t: any) => {
    let rolesList: any[] = []
    try {
        const res = await apiGet('/api/admin/role')
        rolesList = (res?.data || []).map((r: any) => ({ id: r.id, name: r.name }))
    } catch (e) {
        console.error('Failed to fetch roles for accounts schema:', e)
    }

    return [
        {
            title: t('table.account.user') as string,
            key: 'user',
            get_type: "string",
            set_type: "string_line",
            actions: ["update"],
            rules: [
                (v: string) => !!v || t('rules.invalid_field'),
                (v: string) => zod_rules.user.safeParse(v).success || t('account.user.invalid_email')
            ]
        },
        {
            title: t('table.account.email') as string,
            key: 'email',
            get_type: "string",
        },
        {
            title: t('table.account.password') || 'Password',
            key: 'password',
            set_type: 'password_confirm',
            actions: ["setPassword"],
            rules: [
                (v: string) => !!v || t('rules.password.required'),
                (v: string) => zod_rules.password.safeParse(v).success || t('account.password.too_short')
            ]
        },
        {
            title: t('table.account.lang') as string,
            key: 'lang',
            get_type: "string",
            set_type: "enum",
            enum_values: ["de", "en"],
            actions: ["update"]
        },
        {
            title: t('table.account.roles') as string,
            key: 'roles',
            get_type: "list_tag",
            enum_values: rolesList, color_delimiter: ":"
        },
        {
            title: t('table.account.limits') as string,
            key: 'limits',
            get_type: "string"
        },
        {
            title: t('table.account.validated') as string,
            key: 'validated',
            get_type: "boolean"
        },
        {
            title: t('table.common.actions'),
            key: 'actions',
            sortable: false
        }
    ]
}

export default async function (t: any, callbacks?: any) {

    return {
        title: t('table.account.title', 1),
        headers: await getHeaders(t),
        path_base: '/api/user/account',
        features: ['update', 'delete', 'singular'],
        readOnMount: true,
        customActions: [
            {
                icon: 'mdi-lock-reset',
                tooltip: t('form.actions.setPassword'),
                onFormSubmit: callbacks?.onSetPassword,
                action: "setPassword", // POST editingItem
            }
        ]
    }
}
