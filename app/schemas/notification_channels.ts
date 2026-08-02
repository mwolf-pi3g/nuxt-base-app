import { apiGet } from "~/util/fetch/wrappers";

const getHeaders = async (t: any, callbacks) => [
    { title: t('table.notification_channels.name') as string, key: 'name', get_type: 'string', set_type: 'string_line' },
    { title: t('table.notification_channels.provider') as string, key: 'provider', get_type: 'string', set_type: 'enum', enum_values: ['Apprise', 'Email'] },
    { title: t('table.notification_channels.type') as string, key: 'type', get_type: 'string', set_type: 'enum', enum_values: await apiGet('/api/user/notification/schema/services') },
    { title: t('table.notification_channels.config') as string, key: 'config', set_type: 'form', value: callbacks.getChannelConfigSchema },
    { title: t('table.common.actions') as string, key: 'actions', sortable: false }
];

export default async function (t: any, callbacks?: { onAddWhatsapp?: () => void, onSetDefault?: (item: any) => void }) {
    return {
        title: t('table.notification_channels.title') as string,
        path_base: '/api/user/notification',
        readOnMount: true,
        features: ['create', "update", 'delete'],
        headers: await getHeaders(t, callbacks?.form),
        customAdd: [
            // { icon: 'mdi-whatsapp', tooltip: t('table.notification_channels.add_whatsapp') as string, onClick: callbacks?.onAddWhatsapp }
        ],
    }
}
