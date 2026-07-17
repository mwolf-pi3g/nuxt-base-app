import { apiGet } from '~/util/fetch/wrappers'

export const usePerms = () => {
    // get user roles from session
    const { user } = useUserSession()
    const nuxtApp = useNuxtApp()

    const has = async (perms: string[]): Promise<boolean> => {
        const userRoleNames = (user.value as any)?.roles || []

        if (userRoleNames.length === 0) {
            return false
        }

        // get roles from db
        try {
            // const response = await apiGet<{ data: { name: string; permissions: string[] }[] }>('/api/admin/role')
            const response = await nuxtApp.runWithContext(() => {
                return apiGet('/api/admin/role')
            })
            const dbRoles = response.data || []

            // check if user has all of the permissions
            const userPermissions = new Set<string>()
            for (const roleName of userRoleNames) {
                const matchedRole = dbRoles.find(r => r.name === roleName)
                if (matchedRole && matchedRole.permissions) {
                    for (const p of matchedRole.permissions) {
                        userPermissions.add(p)
                    }
                }
            }

            const hasSinglePerm = (req: string) => {
                if (userPermissions.has('all.all')) {
                    return true
                }
                if (userPermissions.has(req)) {
                    return true
                }

                if (req.includes('.')) {
                    const [rubric] = req.split('.')
                    if (userPermissions.has(`${rubric}.all`)) {
                        return true
                    }
                } else {
                    if (userPermissions.has(`${req}.all`)) {
                        return true
                    }
                    for (const userPerm of userPermissions) {
                        if (userPerm.startsWith(`${req}.`)) {
                            return true
                        }
                    }
                }
                return false
            }

            // return true if user has all of the permissions
            for (const req of perms) {
                if (!hasSinglePerm(req)) {
                    return false
                }
            }

            return true
        } catch (e) {
            console.error('Error in has_perms:', e)
            // return false otherwise
            return false
        }
    }

    return {
        has
    }
}