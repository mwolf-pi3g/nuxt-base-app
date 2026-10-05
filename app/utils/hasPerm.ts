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

export function hasPerm(permissions?: string | string[] | { permissions?: string | string[] }): boolean {
  const { user } = useUserSession()
  const userPerms = (user.value as any)?.permissions

  let reqsInput = permissions
  if (typeof permissions === 'object' && permissions !== null && !Array.isArray(permissions) && 'permissions' in permissions) {
    reqsInput = permissions.permissions
  }

  if (!reqsInput || (Array.isArray(reqsInput) && reqsInput.length === 0)) {
    return true
  }

  if (!userPerms || !Array.isArray(userPerms) || userPerms.length === 0) {
    return false
  }

  const reqs = Array.isArray(reqsInput) ? reqsInput : [reqsInput]
  return reqs.every(req => checkSinglePerm(userPerms, req))
}

export default hasPerm
