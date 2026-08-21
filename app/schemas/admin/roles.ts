import hasPerm from '#ba/util/hasPerm'
import { apiGet } from '~/util/fetch/wrappers'

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
        { title: t('table.role.name') as string, key: 'name', get_type: "string", set_type: "string_line" },
        { title: t('table.role.permissions') as string, key: 'permissions', get_type: "list_tag", set_type: "strarr_chips", enum_values: permissionsList, color_delimiter: ":" },
        { title: t('table.common.actions'), key: 'actions', sortable: false }
    ]
}

export default async function (t: any) {
    const features: string[] = []
    if (hasPerm(['role:crud:create'])) features.push('create')
    if (hasPerm(['role:crud:update'])) features.push('update')
    if (hasPerm(['role:crud:delete'])) {
        features.push('delete')
        features.push('deleteMany')
    }

    return {
        title: t('table.role.title') as string,
        headers: await getHeaders(t),
        path_base: '/api/admin/role',
        features,
        readOnMount: true
    }
}