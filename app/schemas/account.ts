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
            title: 'table.account.user',
            key: 'user',
            get_type: "string",
            set_type: "string_line",
            actions: ["update"],
            rules: [
                (v: string) => !!v || 'rules.invalid_field',
                (v: string) => zod_rules.user.safeParse(v).success || 'account.user.invalid_email'
            ]
        },

        {
            title: 'table.account.password',
            key: 'password',
            set_type: 'password_confirm',
            actions: ["setPassword"],
            rules: [
                (v: string) => !!v || 'rules.password.required',
                (v: string) => zod_rules.password.safeParse(v).success || 'account.password.too_short'
            ]
        },
        {
            title: 'table.account.lang',
            key: 'lang',
            get_type: "string",
            set_type: "enum",
            enum_values: ["de", "en"],
            actions: ["update"]
        },
        {
            title: 'table.account.roles',
            key: 'roles',
            get_type: "list_tag",
            enum_values: rolesList, color_delimiter: ":"
        },
        {
            title: 'table.account.limits',
            key: 'limits',
            get_type: "string"
        },
        {
            title: 'table.account.validated',
            key: 'validated',
            get_type: "boolean"
        },
        {
            title: 'table.common.actions',
            key: 'actions',
            sortable: false
        }
    ]
}

export default async function (t: any, callbacks?: any) {

    return {
        title: ['table.account.title', 1],
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
