import fs from 'node:fs';
import path from 'node:path';

defineRouteMeta({
  openAPI: {
    tags: ['App Artifacts'],
    description: 'Delete multiple artifact files for the authenticated user.',
    responses: {
      200: {
        description: 'Success response'
      },
      400: {
        description: 'Missing files in body'
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

  const body = await readBody(event).catch(() => ({}));
  const files: string[] = Array.isArray(body?.files) ? body.files : (Array.isArray(body?.ids) ? body.ids : []);

  if (!files || files.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'error artifacts.missing_files',
    });
  }

  const rawBaseDir = process.env.LOCAL_ARTIFACTS_DIR || path.resolve(process.cwd(), 'Artifacts');
  const userDir = path.resolve(path.join(path.resolve(rawBaseDir), String(userId)));

  let deletedCount = 0;
  for (const file of files) {
    const targetFile = path.resolve(path.join(userDir, String(file)));
    if (targetFile.startsWith(userDir + path.sep) || targetFile === userDir) {
      try {
        await fs.promises.unlink(targetFile);
        deletedCount++;
      } catch {
        // Ignore if already deleted
      }
    }
  }

  return {
    deleted: deletedCount,
    statusMessage: 'success artifacts.delete.success',
  };
});
