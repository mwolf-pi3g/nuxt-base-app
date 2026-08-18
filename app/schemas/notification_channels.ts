import { apiGet } from "~/util/fetch/wrappers";

const getHeaders = async (t: any, callbacks: any) => {
    const servicesRes = await apiGet('/api/user/notification/schema/services') || {};
    
    const normalizedServices: Record<string, string[]> = {};
    if (servicesRes && typeof servicesRes === 'object' && !Array.isArray(servicesRes)) {
        for (const [k, v] of Object.entries(servicesRes)) {
            normalizedServices[k.toLowerCase()] = Array.isArray(v) ? v : [];
        }
    }

    const providers = Object.keys(normalizedServices);

    const getTypesForProvider = (_header: any, formData: any) => {
        const selectedProvider = formData?.provider?.toLowerCase();
        if (selectedProvider && normalizedServices[selectedProvider]) {
            return normalizedServices[selectedProvider];
        }
        return Object.values(normalizedServices).flat();
    };

    return [
        { title: t('table.notification_channels.name') as string, key: 'name', get_type: 'string', set_type: 'string_line' },
        { title: t('table.notification_channels.provider') as string, key: 'provider', get_type: 'string', set_type: 'enum', enum_values: providers },
        { title: t('table.notification_channels.type') as string, key: 'type', get_type: 'string', set_type: 'enum', enum_values: getTypesForProvider },
        { title: t('table.notification_channels.config') as string, key: 'config', set_type: 'form', value: callbacks?.getChannelConfigSchema },
        { title: t('table.common.actions') as string, key: 'actions', sortable: false }
    ];
};

export default async function (t: any, callbacks?: { onAddWhatsapp?: () => void, onSetDefault?: (item: any) => void, form?: any }) {
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
