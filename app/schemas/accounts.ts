import has_perms from '~/util/has_perms'

const getHeaders = (t: any) => [
    //{ title: t('table.email.messageId') as string, key: 'messageId', get_type: "string" },
    { title: t('table.account.user') as string, key: 'user', get_type: "string" },
    { title: t('table.account.email') as string, key: 'email', get_type: "string" },
    { title: t('table.account.roles') as string, key: 'roles', get_type: "string" },
    { title: t('table.account.limits') as string, key: 'limits', get_type: "string" },
    { title: t('table.account.validated') as string, key: 'validated', get_type: "string" },
    { title: t('table.common.actions'), key: 'actions', sortable: false },
];

const features: string[] = [];
if (await has_perms(['account.create'])) features.push('create');
if (await has_perms(['account.update'])) features.push('edit');
if (await has_perms(['account.delete'])) features.push('delete');

export default function (t: any) {
    return {
        title: t('table.account.title') as string,
        headers: getHeaders(t),
        path_base: '/api/admin/account',
        features,
        readOnMount: true
    }
}