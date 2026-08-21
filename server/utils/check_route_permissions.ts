import { H3Event, createError } from 'h3'

function checkSinglePerm(userPerms: string[], req: string): boolean {
  if (!req) return true
  const normReq = req.replace(/:/g, '.')

  for (const perm of userPerms) {
    if (perm === '*') return true

    const normPerm = perm.replace(/:/g, '.')

    if (normPerm === normReq) return true

    if (normPerm.endsWith('.*')) {
      const prefix = normPerm.slice(0, -2)
      if (normReq === prefix || normReq.startsWith(prefix + '.')) return true
    }

    if (normReq.endsWith('.*')) {
      const prefix = normReq.slice(0, -2)
      if (normPerm === prefix || normPerm.startsWith(prefix + '.')) return true
    }
  }

  return false
}

/**
 * Checks if the session user has all of the required permissions.
 * Returns true if authorized, or throws a 403 Forbidden error if not.
 */
export async function checkRoutePermissions(event: H3Event, requiredPermissions: string[]): Promise<boolean> {
  const session = await getUserSession(event)
  const userPerms = session?.user?.permissions

  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true
  }

  if (!userPerms || !Array.isArray(userPerms) || userPerms.length === 0) {
    throw createError({
      statusCode: 403,
      statusMessage: 'error auth.not_authorized',
    })
  }

  const authorized = requiredPermissions.every(req => checkSinglePerm(userPerms, req))

  if (!authorized) {
    throw createError({
      statusCode: 403,
      statusMessage: 'error auth.not_authorized',
    })
  }

  return true
}

export default checkRoutePermissions
