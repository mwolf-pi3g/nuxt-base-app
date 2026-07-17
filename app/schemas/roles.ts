const { has } = usePerms()

const getHeaders = (t: any) => [
    //{ title: t('table.email.messageId') as string, key: 'messageId', get_type: "string" },
    { title: t('table.role.name') as string, key: 'name', get_type: "string" },
    { title: t('table.role.permissions') as string, key: 'permissions', get_type: "string" },
];

const features: string[] = [];
if (await has(['role.create'])) features.push('create');
if (await has(['role.update'])) features.push('edit');
if (await has(['role.delete'])) features.push('delete');

export default function (t: any) {
    return {
        title: t('table.role.title') as string,
        headers: getHeaders(t),
        path_base: '/api/admin/role',
        features,
        readOnMount: true
    }
}