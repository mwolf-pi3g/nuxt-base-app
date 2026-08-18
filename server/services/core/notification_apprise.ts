function getExtensionFromMime(mimeType: string): string {
    const map: Record<string, string> = {
        'text/plain': 'txt',
        'text/markdown': 'md',
        'text/html': 'html',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/gif': 'gif',
        'application/pdf': 'pdf',
        'application/json': 'json',
    };
    if (map[mimeType]) return map[mimeType];
    const parts = mimeType.split('/');
    if (parts.length > 1 && parts[1]) {
        return parts[1].replace(/[^a-zA-Z0-9]/g, '');
    }
    return 'bin';
}

export class Apprise {
    static async getSchemas(): Promise<any[]> {
        const appriseUrl = process.env.APPRISE_URL || 'http://localhost';
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
        items: Array<{ content: string; mime_type?: string }> | string,
        context?: any
    ) {
        const channel = context?.channel;
        const formattedUrl = Apprise.getFormattedAppriseUrl(channel);

        const appriseUrl = process.env.APPRISE_URL || 'http://localhost';
        const endpoint = `${appriseUrl.replace(/\/$/, '')}/notify`;
        console.log("Endpoint: ", endpoint, formattedUrl);

        let messageText = '';
        const attachmentItems: Array<{ content: string; mime_type?: string }> = [];

        if (typeof items === 'string') {
            messageText = items;
        } else if (Array.isArray(items)) {
            const textItems: Array<{ content: string; mime_type?: string }> = [];
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
                        const filename = `attachment_${i + 1}.${ext}`;
                        formData.append('attach', blob, filename);
                    }

                    await $fetch(endpoint, {
                        method: 'POST',
                        body: formData
                    });
                    return;
                } else {
                    console.log(`Service ${channelType} does not support attachments.`);
                }
            }

            await $fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: {
                    urls: formattedUrl,
                    title: title || '',
                    body: messageText || '',
                }
            });
        } catch (error) {
            console.error("Apprise notification failed", error);
        }
    }
}
