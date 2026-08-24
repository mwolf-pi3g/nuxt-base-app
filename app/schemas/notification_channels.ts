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
        { title: 'table.notification_channels.name', key: 'name', get_type: 'string', set_type: 'string_line' },
        { title: 'table.notification_channels.provider', key: 'provider', get_type: 'string', set_type: 'enum', enum_values: providers },
        { title: 'table.notification_channels.type', key: 'type', get_type: 'string', set_type: 'enum', enum_values: getTypesForProvider },
        { title: 'table.notification_channels.config', key: 'config', set_type: 'form', value: callbacks?.getChannelConfigSchema },
        { title: 'table.common.actions', key: 'actions', sortable: false }
    ];
};

export default async function (t: any, callbacks?: { onAddWhatsapp?: () => void, onSetDefault?: (item: any) => void, form?: any }) {
    return {
        title: 'table.notification_channels.title',
        path_base: '/api/user/notification',
        readOnMount: true,
        features: ['create', "update", 'delete'],
        headers: await getHeaders(t, callbacks?.form),
        customAdd: [
            // { icon: 'mdi-whatsapp', tooltip: t('table.notification_channels.add_whatsapp') as string, onClick: callbacks?.onAddWhatsapp }
        ],
    }
}
