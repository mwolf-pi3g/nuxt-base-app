import hasPerm from '#ba/utils/hasPerm'
import { apiGet } from '~/utils/fetch/wrappers'
import { zod_rules } from '#b/shared/rules/account'
import { getRules } from '#b/shared/rules/getRules'

const rules = getRules(zod_rules)
import type { SchemaCallbacks } from '~/types/schema_callbacks'

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
            title: 'table.account.user', key: 'user', get_type: "string", set_type: "string_line", rules: [
                (v: string) => !!v || 'table.account.rules.user.required',
                rules.user
            ]
        },
        {
            title: 'table.account.password', key: 'password', set_type: 'password_confirm', actions: ["create"], rules: [
                (v: string) => !!v || 'rules.password.required',
                rules.password
            ]
        },
        { title: 'table.account.roles', key: 'roles', get_type: "list_tag", set_type: "strarr_chips", opts: { enum_values: rolesList, color_delimiter: ":" }, rules: rules.roles },
        // Shown only: cron is switched on and off in the dashboard
        { title: 'table.account.cron_active', key: 'cron_active', get_type: "boolean" },
        { title: 'table.common.actions', key: 'actions', sortable: false },
    ]
}

export default async function (t: any, callbacks?: SchemaCallbacks) {
    const features: string[] = []
    if (hasPerm(['account.crud.create'])) features.push('create')
    if (hasPerm(['account.crud.update'])) features.push('update')
    if (hasPerm(['account.crud.delete'])) {
        features.push('delete')
        features.push('deleteMany')
    }

    return {
        title: ['table.account.title', 2],
        headers: await getHeaders(t),
        path_base: '/api/admin/account',
        features,
        readOnMount: true,
        customActions: [
            { icon: 'mdi-account-convert-outline', tooltip: t('table.account.set_ident'), onActionClick: callbacks?.onSetIdent },
            { icon: 'mdi-key-variant', tooltip: t('table.api_tokens.manage'), onActionClick: callbacks?.onShowTokens },
        ]
    }
}