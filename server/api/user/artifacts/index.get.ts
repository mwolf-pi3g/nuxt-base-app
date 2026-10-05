import fs from 'node:fs';
import path from 'node:path';

defineRouteMeta({
  openAPI: {
    tags: ['App Artifacts'],
    description: 'List all artifacts for the authenticated user.',
    responses: {
      200: {
        description: 'Success response'
      },
      403: {
        description: 'Not logged in'
      }
    }
  }
});

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const userId = session.user?.id;

  if (!userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'error auth.not_authenticated',
    });
  }

  const rawBaseDir = process.env.LOCAL_ARTIFACTS_DIR || path.resolve(process.cwd(), 'Artifacts');
  const userDir = path.join(path.resolve(rawBaseDir), String(userId));

  const files: any[] = [];
  try {
    const entries = await fs.promises.readdir(userDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const fullPath = path.join(userDir, entry.name);
        const stat = await fs.promises.stat(fullPath);
        files.push({
          id: entry.name,
          size: stat.size,
          extension: path.extname(entry.name).replace(/^\./, ''),
          createdAt: stat.birthtime,
          updatedAt: stat.mtime
        });
      }
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error('[Artifacts] Failed to list user directory:', userDir, error);
    }
  }

  // Sort newest first
  files.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return {
    data: files,
    statusMessage: 'success artifacts.read.success',
  };
});
