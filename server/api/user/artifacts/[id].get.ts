import fs from 'node:fs';
import path from 'node:path';

defineRouteMeta({
  openAPI: {
    tags: ['App Artifacts'],
    description: 'Read or download a specific artifact file for the authenticated user.',
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
  const requestedFile = path.join(userDir, fileName);

  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(requestedFile);
    if (!stat.isFile()) {
      throw createError({
        statusCode: 404,
        statusMessage: 'error artifacts.not_found',
      });
    }
  } catch (err: any) {
    if (err.statusCode) throw err;
    throw createError({
      statusCode: 404,
      statusMessage: 'error artifacts.not_found',
    });
  }

  const query = getQuery(event);

  // If ?download=1 or ?raw=1, stream the file directly
  if (query.download || query.raw) {
    const fileStream = fs.createReadStream(requestedFile);
    if (query.download) {
      setResponseHeader(event, 'Content-Disposition', `attachment; filename="${fileName}"`);
    } else {
      setResponseHeader(event, 'Content-Disposition', `inline; filename="${fileName}"`);
      const ext = path.extname(fileName).toLowerCase().replace(/^\./, '');
      const mimeTypes: Record<string, string> = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        m4a: 'audio/mp4',
        aac: 'audio/aac',
        flac: 'audio/flac',
        webm: 'audio/webm',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        pdf: 'application/pdf',
        json: 'application/json',
        txt: 'text/plain',
      };
      if (mimeTypes[ext]) {
        setResponseHeader(event, 'Content-Type', mimeTypes[ext]);
      }
    }
    return sendStream(event, fileStream);
  }

  // Read file content
  let content: string;
  try {
    content = await fs.promises.readFile(requestedFile, 'utf-8');
  } catch {
    const buffer = await fs.promises.readFile(requestedFile);
    content = buffer.toString('base64');
  }

  return {
    data: {
      id: fileName,
      size: stat.size,
      extension: path.extname(fileName).replace(/^\./, ''),
      content,
      createdAt: stat.birthtime,
      updatedAt: stat.mtime,
    },
    statusMessage: 'success artifacts.read.success',
  };
});
