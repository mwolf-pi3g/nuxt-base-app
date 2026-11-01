import { zod_rules } from '#b/shared/rules/account';
import { getRules } from '#b/shared/rules/getRules'

const rules = getRules(zod_rules)
import { apiGet } from '~/utils/fetch/wrappers'

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
                (v: string) => !!v || 'table.account.rules.user.required',
                rules.user
            ]
        },

        {
            title: 'table.account.password',
            key: 'password',
            set_type: 'password_confirm',
            actions: ["setPassword"],
            rules: [
                (v: string) => !!v || 'rules.password.required',
                rules.password
            ]
        },
        {
            title: 'table.account.lang',
            key: 'lang',
            get_type: "string",
            set_type: "enum",
            opts: { enum_values: ["de", "en"] },
            rules: rules.lang,
            actions: ["update"]
        },
        {
            title: 'table.account.roles',
            key: 'roles',
            get_type: "list_tag",
            opts: { enum_values: rolesList, color_delimiter: ":" }
        },
        {
            // Shown only: cron is switched on and off in the dashboard
            title: 'table.account.cron_active',
            key: 'cron_active',
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
            },
            { icon: 'mdi-key-variant', tooltip: t('table.api_tokens.manage'), onActionClick: callbacks?.onShowTokens },
        ]
    }
}
