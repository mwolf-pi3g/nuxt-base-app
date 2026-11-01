import { getExtensionFromMime } from '#bs/utils/get_extensions_from_mime_type';
import { appLimits } from '#bs/utils/app_limits';
import { reportNotificationFailure, emitTelemetryEvent, EventScope, EventLevel } from '#bs/utils/telemetry/event';

// Apprise API failure (424/400): its details log holds [level, timestamp, message] entries from the service plugin.
const appriseTimeoutMs = () => appLimits().notifications.apprise_timeout_ms;

function extractAppriseReason(err: any): string {
    if (err?.name === 'TimeoutError' || /timeout|timed out/i.test(String(err?.message || ''))) {
        return `Apprise did not respond within ${appriseTimeoutMs() / 1000}s`;
    }
    const data = err?.data;
    if (!data) return `Apprise not reachable: ${err?.message || 'Connection failed'}`;

    const lines = (Array.isArray(data.details) ? data.details : [])
        .filter((d: any) => Array.isArray(d) && ['WARNING', 'ERROR'].includes(String(d[0]).toUpperCase()))
        .map((d: any) => String(d[2] ?? '').trim())
        .filter(Boolean);
    const unique = [...new Set(lines)];

    return unique.length > 0 ? unique.join(', ') : (data.error || err?.message || 'Apprise notification failed');
}

export class Apprise {
    static async getSchemas(): Promise<any[]> {
        const appriseUrl = process.env.APPRISE_URL;
        if (!appriseUrl) return [];
        const url = `${appriseUrl.replace(/\/$/, '')}/details`;

        try {
            const res = await $fetch<any>(url, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (res && res.version && res.version !== '1.12.0') {
                console.warn(
                    `Apprise version ${res.version} detected. Only version 1.12.0 has been tested.`
                );
            }

            if (res && Array.isArray(res.schemas)) {
                return res.schemas;
            }
            return [];
        } catch (error) {
            console.error("Failed to fetch Apprise schemas", error);
            return [];
        }
    }

    static getFormattedAppriseUrl(channel: any): string {
        if (!channel) return '';
        const config = channel.config || channel;
        let url = config.template || '';
        const matches = url.match(/\{([a-zA-Z0-9_-]+)\}/g);
        if (matches) {
            for (const match of matches) {
                const tokenName = match.slice(1, -1);
                const tokenValue = config[tokenName] || '';
                url = url.replace(match, tokenValue);
            }
        }

        if (url) {
            if (url.includes('?')) {
                url += '&format=markdown';
            } else {
                url += '?format=markdown';
            }
            const baseUrl = process.env.BASE_URL;
            if (baseUrl) {
                url += `&avatar_url=${encodeURIComponent(`${baseUrl}/favicon.ico`)}`;
            }
        }
        return url;
    }

    static async sendItems(
        title: string,
        items: Array<{ content: string; mime_type?: string; filename?: string }> | string,
        context?: any
    ): Promise<{ ok: boolean }> {
        const channel = context?.channel;
        const ownerId = channel?.owner_id || context?.owner_id || context?.user_id;
        const channelName = channel?.name || channel?.type || 'Apprise';
        const formattedUrl = Apprise.getFormattedAppriseUrl(channel);

        if (!formattedUrl) {
            await reportNotificationFailure(ownerId, channelName, 'Missing channel URL configuration');
            return { ok: false };
        }

        const appriseUrl = process.env.APPRISE_URL ?? '';
        const endpoint = `${appriseUrl.replace(/\/$/, '')}/notify`;

        let messageText = '';
        const attachmentItems: Array<{ content: string; mime_type?: string; filename?: string }> = [];

        if (typeof items === 'string') {
            messageText = items;
        } else if (Array.isArray(items)) {
            const textItems: Array<{ content: string; mime_type?: string; filename?: string }> = [];
            for (const item of items) {
                if (item.mime_type && item.mime_type.toLowerCase().startsWith('text/')) {
                    textItems.push(item);
                } else {
                    attachmentItems.push(item);
                }
            }
            if (textItems.length > 0) {
                messageText = textItems[0].content || '';
                if (textItems.length > 1) {
                    attachmentItems.push(...textItems.slice(1));
                }
            }
        }

        try {
            if (!appriseUrl) throw new Error('APPRISE_URL is not set');

            if (attachmentItems.length > 0) {
                const schemas = await Apprise.getSchemas();
                const channelType = channel?.type;
                const found = schemas.find((item: any) => item && item.service_name === channelType);

                if (found?.attachment_support === true) {
                    const formData = new FormData();
                    formData.append('urls', formattedUrl);
                    formData.append('title', title || '');
                    formData.append('body', messageText || '');

                    for (let i = 0; i < attachmentItems.length; i++) {
                        const item = attachmentItems[i];
                        const mimeType = item.mime_type || 'application/octet-stream';
                        let blob: Blob;

                        if (mimeType.toLowerCase().startsWith('text/')) {
                            blob = new Blob([item.content || ''], { type: mimeType });
                        } else {
                            const buffer = Buffer.isBuffer(item.content)
                                ? item.content
                                : Buffer.from(item.content || '', 'base64');
                            blob = new Blob([buffer], { type: mimeType });
                        }

                        const ext = getExtensionFromMime(mimeType);
                        const filename = item?.filename || `attachment_${i + 1}.${ext}`;
                        formData.append('attach', blob, filename);
                    }

                    await $fetch(endpoint, {
                        timeout: appriseTimeoutMs(),
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json'
                        },
                        body: formData
                    });
                    return { ok: true };
                } else {
                    if (ownerId) {
                        await emitTelemetryEvent({
                            scope: EventScope.USER,
                            owner_id: ownerId,
                            level: EventLevel.WARN,
                            category: 'notification',
                            message: 'events.notification.attachments_dropped',
                            metadata: { channel: channelName, count: attachmentItems.length }
                        });
                    }
                }
            }

            await $fetch(endpoint, {
                timeout: appriseTimeoutMs(),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: {
                    urls: formattedUrl,
                    title: title || '',
                    body: messageText || '',
                }
            });
            return { ok: true };
        } catch (error: any) {
            await reportNotificationFailure(ownerId, channelName, extractAppriseReason(error));
            return { ok: false };
        }
    }
}
