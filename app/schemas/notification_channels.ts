import { apiGet, apiPost } from "~/utils/fetch/wrappers";
import { zod_rules } from '#b/shared/rules/notification_channels';
import { getRules } from '#b/shared/rules/getRules';

const rules = getRules(zod_rules);

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
            const allowed = normalizedServices[selectedProvider];
            if (formData && (!formData.type || !allowed.includes(formData.type))) {
                formData.type = allowed[0] || '';
            }
            return allowed;
        }
        return Object.values(normalizedServices).flat();
    };

    return [
        { title: 'table.notification_channels.name', key: 'name', get_type: 'string', set_type: 'string_line', rules: rules.name },
        { title: 'table.notification_channels.provider', key: 'provider', get_type: 'string', set_type: 'enum', opts: { enum_values: providers }, rules: rules.provider },
        { title: 'table.notification_channels.type', key: 'type', get_type: 'string', set_type: 'enum', opts: { enum_values: getTypesForProvider }, rules: rules.type },
        { title: 'table.notification_channels.config', key: 'config', set_type: 'form', opts: { nested_headers: callbacks?.getChannelConfigSchema } },
        { title: 'table.common.actions', key: 'actions', sortable: false }
    ];
};

export default async function (t: any, callbacks?: { onSetDefault?: (item: any) => void, form?: any }) {
    return {
        title: 'table.notification_channels.title',
        path_base: '/api/user/notification',
        readOnMount: true,
        features: ['create', "update", 'delete'],
        headers: await getHeaders(t, callbacks?.form),
        formActions: [
            {
                label: t('table.notification_channels.test'),
                icon: 'mdi-connection',
                successLabel: t('table.notification_channels.sent'),
                run: (data: any) => apiPost('/api/user/notification/test', data)
            }
        ],
    }
}
