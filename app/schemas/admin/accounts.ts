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
        //{ title: t('table.email.messageId') as string, key: 'messageId', get_type: "string" },
        {
            title: t('table.account.user') as string, key: 'user', get_type: "string", set_type: "string_line", rules: [
                (v: string) => !!v || t('rules.invalid_field'),
                (v: string) => zod_rules.user.safeParse(v).success || t('account.user.invalid_email')
            ]
        },
        {
            title: t('table.account.password'), key: 'password', set_type: 'password_confirm', actions: ["create"], rules: [
                (v: string) => !!v || t('rules.password.required'),
                (v: string) => zod_rules.password.safeParse(v).success || t('account.password.too_short')
            ]
        },
        { title: t('table.account.roles') as string, key: 'roles', get_type: "list_tag", set_type: "strarr_chips", enum_values: rolesList, color_delimiter: ":" },
        { title: t('table.account.limits') as string, key: 'limits', get_type: "string", set_type: "string_line" },
        { title: t('table.account.validated') as string, key: 'validated', get_type: "boolean", set_type: "boolean", set_as_number: true },
        { title: t('table.common.actions'), key: 'actions', sortable: false },
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
        title: t('table.account.title', 2) as string,
        headers: await getHeaders(t),
        path_base: '/api/admin/account',
        features,
        readOnMount: true,
        customActions: [
            { icon: 'mdi-account-convert-outline', tooltip: t('table.account.set_ident'), onActionClick: callbacks?.onSetIdent }
        ]
    }
}