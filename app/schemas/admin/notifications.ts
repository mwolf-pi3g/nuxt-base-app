import hasPerm from '#ba/util/hasPerm'
import type { SchemaCallbacks } from '#ba/types/schema_callbacks'

const getHeaders = (t: any) => [
    { title: t('table.common.owner') as string, key: 'owner_id', get_type: "string", set_type: "string_line", rules: [(v: string) => !!v || t('rules.invalid_field')] },
    { title: t('table.notification_channels.type') as string, key: 'type', get_type: 'string' },
    // { title: t('table.notification_channels.is_default') as string, key: 'is_default', get_type: 'string' },
    { title: t('table.notification_channels.created_at') as string, key: 'createdAt', get_type: 'short_date' },
    { title: t('table.common.actions') as string, key: 'actions', align: 'end', sortable: false }
];

export default function (t: any, callbacks?: SchemaCallbacks) {
    const features: string[] = []
    // if (hasPerm(['notification.crud.create'])) features.push('create')
    if (hasPerm(['notification.crud.update'])) features.push('update')
    if (hasPerm(['notification.crud.delete'])) {
        features.push('delete')
        features.push('deleteMany')
    }

    return {
        title: t('table.notification_channels.title') as string,
        headers: getHeaders(t),
        path_base: '/api/admin/notification',
        features,
        readOnMount: true,
        customAdd: [
            // { icon: 'mdi-whatsapp', tooltip: t('table.notification_channels.add_whatsapp') as string, onClick: callbacks?.onAddWhatsapp }
        ],
        // customActions: [
        //   { icon: 'mdi-star-box', tooltip: t('table.notification_channels.set_default') as string, onClick: callbacks?.onSetDefault }
        // ]
    }
}
