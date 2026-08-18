export function getExtensionFromMime(mimeType: string): string {
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

export const getExtensionsFromMime = getExtensionFromMime;
export default getExtensionFromMime;
