import { db } from "hub:db";
import { notificationChannels } from "#bs/db/schema";
import { genericService } from "#bs/services/generic";
// import { WhatsappChannel } from "./notification_channels/whatsapp";
import { dbFindAll } from "#bs/db/wrappers/db_find_all";
import { getNotificationSchemas } from "#bs/utils/getNotificationSchemas";
// import { dbFindOneAndUpdate } from "#layers/nuxt-base-app/server/db/wrappers/db_find_one_and_update";
// import { dbCreate } from "#layers/nuxt-base-app/server/db/wrappers/db_create";

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

class notificationService extends genericService {
    channel: any;

    cleanConfigKeys(config: any, template: string) {
        if (!config || !template) return;

        const allowedKeys = new Set<string>(['template']);
        const matches = template.match(/\{([a-zA-Z0-9_-]+)\}/g);
        if (matches) {
            for (const match of matches) {
                allowedKeys.add(match.slice(1, -1));
            }
        }

        for (const key of Object.keys(config)) {
            if (!allowedKeys.has(key)) {
                delete config[key];
            }
        }
    }

    async create(body: any, hooks?: any) {
        if (body?.provider === 'Apprise' && body?.config?.template) {
            this.cleanConfigKeys(body.config, body.config.template);
        }
        return super.create(body, hooks);
    }

    async update(id: string, body: any, hooks?: any) {
        if (body?.provider === 'Apprise' && body?.config?.template) {
            this.cleanConfigKeys(body.config, body.config.template);
        }
        return super.update(id, body, hooks);
    }

    async init(id?: string) {
        const record = await dbFindAll(
            this.db,
            this.table,
            id ? { id, owner_id: this.user_id } : { owner_id: this.user_id }
        );

        if (record && record.length > 0) {
            this.channel = record[0];
        }

        if (!this.channel) {
            console.log("No notification channel configured for user:", this.user_id);
        }
        return this;
    }

    // TODO: use the super. with zod functions.  Not direct db* calls
    // async saveConfig(configData: any) {
    //     const existing = await dbFindOne(this.db, this.table, { owner_id: this.user_id, type: 'whatsapp' });
    //     if (existing) {
    //         await dbFindOneAndUpdate(this.db, this.table, { owner_id: this.user_id, type: 'whatsapp' }, { config: configData });
    //     } else {
    //         await dbCreate(this.db, this.table, { owner_id: this.user_id, type: 'whatsapp', config: configData, is_default: 0 });
    //     }
    // }

    // async create(event: any) {
    //     const eventStream = createEventStream(event);

    //     console.log("Creating whatsapp channel for user:", this.user_id);
    //     this.channel = new WhatsappChannel(null, this.saveConfig.bind(this));
    //     await this.channel.authorize(eventStream);
    //     return eventStream.send();
    // }

    getAppriseUrl() {
        if (!this.channel) return '';
        const config = this.channel.config || this.channel;
        let url = config.template || '';
        const matches = url.match(/\{([a-zA-Z0-9_-]+)\}/g);
        if (matches) {
            for (const match of matches) {
                const tokenName = match.slice(1, -1);
                const tokenValue = config[tokenName] || '';
                url = url.replace(match, tokenValue);
            }
        }
        return url;
    }

    getFormattedAppriseUrl() {
        let url = this.getAppriseUrl();
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

    async sendMessage(title: string, text: string) {
        if (this.channel) {
            // await this.channel.sendMessage(text);
            if (this.channel.provider === "Apprise") {
                const url = this.getFormattedAppriseUrl();

                const appriseUrl = process.env.APPRISE_URL || 'http://localhost';
                const endpoint = `${appriseUrl.replace(/\/$/, '')}/notify`;
                console.log("Endpoint: ", endpoint, url);

                try {
                    await $fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: {
                            urls: url,
                            title: title || '',
                            body: text,
                        }
                    });
                } catch (error) {
                    console.error("Apprise notification failed", error);
                }
            }
        } else {
            console.log("No notification channel configured for user:", this.user_id);
        }
    }

    // async sendAudio(data: any) {
    //     if (this.channel) {

    //         if (this.channel.provider === "Apprise") {
    //             try {
    //                 const schemasObj = await getNotificationSchemas();
    //                 const schemas = schemasObj?.schemas || [];
    //                 const found = schemas.find((item: any) => item && item.service_name === this.channel.type);

    //                 if (found?.attachment_support === true) {
    //                     const url = this.getFormattedAppriseUrl();

    //                     const appriseUrl = process.env.APPRISE_URL || 'http://localhost';
    //                     const endpoint = `${appriseUrl.replace(/\/$/, '')}/notify`;

    //                     const formData = new FormData();
    //                     formData.append('urls', url);
    //                     formData.append('title', 'Email Reporter Audio');
    //                     formData.append('body', 'Attached is your audio report.');

    //                     const audioBuffer = Buffer.from(data, 'base64');
    //                     const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    //                     formData.append('attach', audioBlob, 'report.mp3');

    //                     await $fetch(endpoint, {
    //                         method: 'POST',
    //                         body: formData
    //                     });
    //                 } else {
    //                     console.log(`Service ${this.channel.type} does not support attachments.`);
    //                 }
    //             } catch (error) {
    //                 console.error("Apprise audio notification failed", error);
    //             }
    //         }
    //     } else {
    //         console.log("No notification channel configured for user:", this.user_id);
    //     }
    // }

    async sendItems(title: string, items: Array<{ content: string; mime_type?: string }>) {
        if (!this.channel) {
            console.log("No notification channel configured for user:", this.user_id);
            return;
        }

        if (!items || items.length === 0) {
            return;
        }

        const textItems: Array<{ content: string; mime_type?: string }> = [];
        const attachmentItems: Array<{ content: string; mime_type?: string }> = [];

        for (const item of items) {
            if (item.mime_type && item.mime_type.toLowerCase().startsWith('text/')) {
                textItems.push(item);
            } else {
                attachmentItems.push(item);
            }
        }

        let messageText = '';
        if (textItems.length > 0) {
            messageText = textItems[0].content || '';
            if (textItems.length > 1) {
                attachmentItems.push(...textItems.slice(1));
            }
        }

        if (attachmentItems.length === 0) {
            await this.sendMessage(title, messageText);
            return;
        }

        if (this.channel.provider === "Apprise") {
            try {
                const schemasObj = await getNotificationSchemas();
                const schemas = schemasObj?.schemas || [];
                const found = schemas.find((item: any) => item && item.service_name === this.channel.type);

                if (found?.attachment_support === true) {
                    const url = this.getFormattedAppriseUrl();
                    const appriseUrl = process.env.APPRISE_URL || 'http://localhost';
                    const endpoint = `${appriseUrl.replace(/\/$/, '')}/notify`;

                    const formData = new FormData();
                    formData.append('urls', url);
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
                } else {
                    console.log(`Service ${this.channel.type} does not support attachments.`);
                    if (messageText) {
                        await this.sendMessage(title, messageText);
                    }
                }
            } catch (error) {
                console.error("Apprise notification failed", error);
            }
        }
    }
}

export const getService = async (event: any = null, channel_id?: string) => {
    const session = await getUserSession(event);
    const service = new notificationService(db, notificationChannels, {}, session.user?.id);
    return await service.init(channel_id); // because no awaiting in constructor
}

export const getServiceNoAuth = async (owner_id: string, channel_id?: string) => {
    const service = new notificationService(db, notificationChannels, {}, owner_id);
    return await service.init(channel_id);
}

export const getAdminService = () => {
    return new notificationService(db, notificationChannels, {});
}
