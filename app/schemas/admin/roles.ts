import hasPerm from '#ba/utils/hasPerm'
import { apiGet } from '~/utils/fetch/wrappers'
import { zod_rules } from '#b/shared/rules/role'
import { getRules } from '#b/shared/rules/getRules'

const rules = getRules(zod_rules)

const getHeaders = async (t: any) => {
    let permissionsList: string[] = []
    try {
        const res = await apiGet('/api/user/permissions')
        permissionsList = res?.data || []
    } catch (e) {
        console.error('Failed to fetch permissions for roles schema:', e)
    }

    return [
        //{ title: t('table.email.messageId') as string, key: 'messageId', get_type: "string" },
        { title: 'table.role.name', key: 'name', get_type: "string", set_type: "string_line", rules: rules.name },
        { title: 'table.role.permissions', key: 'permissions', get_type: "list_tag", set_type: "strarr_chips", opts: { enum_values: permissionsList, color_delimiter: ":" }, rules: rules.permissions },
        { title: 'table.common.actions', key: 'actions', sortable: false }
    ]
}

export default async function (t: any) {
    const features: string[] = []
    if (hasPerm(['role.crud.create'])) features.push('create')
    if (hasPerm(['role.crud.update'])) features.push('update')
    if (hasPerm(['role.crud.delete'])) {
        features.push('delete')
        features.push('deleteMany')
    }

    return {
        title: 'table.role.title',
        headers: await getHeaders(t),
        path_base: '/api/admin/role',
        features,
        readOnMount: true
    }
}