import { zod_rules } from '#b/shared/rules/account';
import { getRules } from '#b/shared/rules/getRules'

const rules = getRules(zod_rules)

const getHeaders = async (t: any) => {
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
            // Names from /api/user/account (a user may not read the role list, an admin route)
            title: 'table.account.roles',
            key: 'role_names',
            get_type: "list_tag",
            opts: { color_delimiter: ":" }
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
