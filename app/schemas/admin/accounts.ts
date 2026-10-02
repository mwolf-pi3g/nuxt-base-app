import hasPerm from '#ba/util/hasPerm'
import { apiGet } from '~/util/fetch/wrappers'
import { zod_rules } from '#b/shared/rules/account'
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
                (v: string) => !!v || 'rules.invalid_field',
                (v: string) => zod_rules.user.safeParse(v).success || 'account.user.invalid_email'
            ]
        },
        {
            title: 'table.account.password', key: 'password', set_type: 'password_confirm', actions: ["create"], rules: [
                (v: string) => !!v || 'rules.password.required',
                (v: string) => zod_rules.password.safeParse(v).success || 'account.password.too_short'
            ]
        },
        { title: 'table.account.roles', key: 'roles', get_type: "list_tag", set_type: "strarr_chips", enum_values: rolesList, color_delimiter: ":" },
        { title: 'table.account.limits', key: 'limits', get_type: "string", set_type: "string_line" },
        { title: 'table.account.validated', key: 'validated', get_type: "boolean", set_type: "boolean", set_as_number: true },
        { title: 'table.account.cron_active', key: 'cron_active', get_type: "boolean", set_type: "boolean", set_as_number: true },
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
            { icon: 'mdi-account-convert-outline', tooltip: t('table.account.set_ident'), onActionClick: callbacks?.onSetIdent }
        ]
    }
}