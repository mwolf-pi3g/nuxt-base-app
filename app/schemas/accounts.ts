const getHeaders = (t: any) => [
    //{ title: t('table.email.messageId') as string, key: 'messageId', get_type: "string" },
    { title: t('table.account.user') as string, key: 'user', get_type: "string" },
    { title: t('table.account.email') as string, key: 'email', get_type: "string" },
    { title: t('table.account.roles') as string, key: 'roles', get_type: "string" },
    { title: t('table.account.limits') as string, key: 'limits', get_type: "string" },
    { title: t('table.account.validated') as string, key: 'validated', get_type: "string" },
];

export default function (t: any) {
    return {
        title: t('table.account.title') as string,
        headers: getHeaders(t),
        path_base: '/api/admin/account',
        features: [],
        readOnMount: true
    }
}