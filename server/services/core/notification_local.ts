import fs from 'node:fs';
import path from 'node:path';
import { getExtensionFromMime } from '#bs/utils/get_extensions_from_mime_type';

export class Local {
    /**
     * Returns schema definitions for the Local disk storage notification provider.
     */
    static async getSchemas(): Promise<any[]> {
        return [
            {
                service_name: 'disk',
                details: {
                    templates: [
                        'file://'
                    ],
                    tokens: {}
                }
            }
        ];
    }

    /**
     * Saves notification items and artifacts directly to disk.
     * The first child folder within LOCAL_ARTIFACTS_DIR is named after the user ID.
     *
     * @param title Title or subject of the notification / artifact batch
     * @param items Notification payloads or artifacts to write to disk
     * @param options Context containing channel configuration and user information
     */
    static async sendItems(
        title: string,
        items: Array<{ content: any; mime_type?: string; filename?: string; name?: string; metadata?: any }> | string,
        options: { channel?: Record<string, any>; user_id?: string; [key: string]: any }
    ) {
        const channel = options?.channel;
        const userId = channel?.owner_id || options?.user_id || 'default';

        // Base directory resolved from LOCAL_ARTIFACTS_DIR env variable or fallback ./Artifacts
        const rawBaseDir = process.env.LOCAL_ARTIFACTS_DIR || path.resolve(process.cwd(), 'Artifacts');
        const baseDir = path.resolve(rawBaseDir);

        // Path structure: <baseDir>/<userId>/
        const targetDir = path.join(baseDir, String(userId));

        // Ensure user directory exists
        await fs.promises.mkdir(targetDir, { recursive: true });

        // Normalize items into array
        const normalizedItems: Array<{ content: any; mime_type?: string; filename?: string; name?: string; metadata?: any }> = [];
        if (typeof items === 'string') {
            normalizedItems.push({
                content: items,
                mime_type: 'text/markdown'
            });
        } else if (Array.isArray(items)) {
            for (const it of items) {
                if (typeof it === 'string') {
                    normalizedItems.push({ content: it, mime_type: 'text/markdown' });
                } else if (it && typeof it === 'object') {
                    normalizedItems.push(it);
                }
            }
        } else if (items && typeof items === 'object') {
            normalizedItems.push(items);
        }

        const savedFiles: string[] = [];
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        for (let i = 0; i < normalizedItems.length; i++) {
            const item = normalizedItems[i];
            const mimeType = item.mime_type || 'text/markdown';
            const ext = getExtensionFromMime(mimeType);

            // Determine filename
            let baseName = item.filename || item.name || item.metadata?.filename || item.metadata?.name;
            if (!baseName) {
                const cleanTitle = (title || 'artifact')
                    .trim()
                    .replace(/[/\\?%*:|"<>]/g, '_')
                    .replace(/\s+/g, '_')
                    .substring(0, 80);

                baseName = normalizedItems.length > 1
                    ? `${cleanTitle}_${i + 1}_${timestamp}`
                    : `${cleanTitle}_${timestamp}`;
            } else {
                baseName = path.basename(baseName);
            }

            const fileName = baseName.includes('.') ? baseName : `${baseName}.${ext}`;
            const filePath = path.join(targetDir, fileName);

            // Format content data
            let contentData: string | Buffer;
            const rawContent = item.content !== undefined ? item.content : '';

            if (Buffer.isBuffer(rawContent)) {
                contentData = rawContent;
            } else if (typeof rawContent === 'object') {
                contentData = JSON.stringify(rawContent, null, 2);
            } else if (typeof rawContent === 'string') {
                const isBinaryMime = !mimeType.toLowerCase().startsWith('text/') &&
                    !mimeType.toLowerCase().includes('json') &&
                    !mimeType.toLowerCase().includes('javascript') &&
                    !mimeType.toLowerCase().includes('xml');

                if (isBinaryMime && /^[A-Za-z0-9+/=]+$/.test(rawContent.trim()) && rawContent.length % 4 === 0) {
                    try {
                        contentData = Buffer.from(rawContent, 'base64');
                    } catch {
                        contentData = rawContent;
                    }
                } else {
                    contentData = rawContent;
                }
            } else {
                contentData = String(rawContent);
            }

            await fs.promises.writeFile(filePath, contentData);
            savedFiles.push(filePath);
            console.log(`[LocalNotificationProvider] Saved artifact to: ${filePath}`);
        }

        return {
            success: true,
            files: savedFiles,
            directory: targetDir
        };
    }
}

export const LocalNotificationProvider = Local;
export default Local;
