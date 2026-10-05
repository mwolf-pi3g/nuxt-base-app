import fs from 'node:fs';
import path from 'node:path';

defineRouteMeta({
  openAPI: {
    tags: ['App Artifacts'],
    description: 'Delete a specific artifact file for the authenticated user.',
    responses: {
      200: {
        description: 'Success response'
      },
      403: {
        description: 'Not logged in'
      },
      404: {
        description: 'Artifact not found'
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

  const rawId = getRouterParam(event, 'id');
  if (!rawId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'error artifacts.missing_id',
    });
  }

  const fileName = path.basename(rawId);
  const rawBaseDir = process.env.LOCAL_ARTIFACTS_DIR || path.resolve(process.cwd(), 'Artifacts');
  const userDir = path.resolve(path.join(path.resolve(rawBaseDir), String(userId)));
  const targetFile = path.join(userDir, fileName);

  try {
    await fs.promises.unlink(targetFile);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      throw createError({
        statusCode: 404,
        statusMessage: 'error artifacts.not_found',
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: `error artifacts.delete_failed: ${err?.message || err}`,
    });
  }

  return {
    statusMessage: 'success artifacts.delete.success',
  };
});
