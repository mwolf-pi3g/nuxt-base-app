import { db } from 'hub:db'
import { roles } from 'hub:db:schema'
import { dbFindAll } from '#bs/db/wrappers/db_find_all'
import { getPermissions } from '#bs/utils/perms'

/**
 * Given an array of role IDs, look them up in the database,
 * resolve their permissions (expanding globs like "account:*" into
 * every leaf permission), and return a sorted, deduplicated array
 * of concrete (non-glob) permission strings.
 */
export async function permissionsByRoles(roleIds: string[]): Promise<string[]> {
    if (!roleIds || roleIds.length === 0) return []

    const allLeafPerms = new Set<string>()

    // Fetch each role from the DB by ID
    for (const roleId of roleIds) {
        const matches = await dbFindAll(db, roles, { id: roleId })
        if (matches.length === 0) continue

        const role = matches[0]
        const perms: string[] = role.permissions || []

        for (const perm of perms) {
            if (perm.endsWith(':*')) {
                // Glob – expand by looking up the path prefix in permissions.json
                const prefix = perm.slice(0, -2) // strip trailing ":*"
                const expanded = getPermissions(prefix)
                for (const p of expanded) {
                    if (!p.endsWith(':*')) {
                        allLeafPerms.add(p)
                    }
                }
            } else {
                allLeafPerms.add(perm)
            }
        }
    }

    return [...allLeafPerms].sort()
}

export default permissionsByRoles
