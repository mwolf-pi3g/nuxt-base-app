import permissionsJson from '../metadata/permissions.json'

interface PermissionNode {
    name: string;
    children?: PermissionNode[];
}

export function getPermissions(path?: string): string[] {
    const results: string[] = []

    // Helper to recursively collect permissions
    const collect = (node: PermissionNode, currentPrefix: string) => {
        if (node.children && node.children.length > 0) {
            results.push(`${currentPrefix}:*`)
            for (const child of node.children) {
                collect(child, `${currentPrefix}:${child.name}`)
            }
        } else {
            results.push(currentPrefix)
        }
    }

    let current: PermissionNode | PermissionNode[] = permissionsJson as PermissionNode[]

    if (path) {
        const parts = path.split(':')
        let matchedNode: PermissionNode | null = null

        for (const part of parts) {
            const found: PermissionNode | undefined = current.find(n => n.name === part)
            if (!found) return []
            matchedNode = found
            current = found.children || []
        }

        if (matchedNode) {
            collect(matchedNode, path)
        }
    } else {
        // Root list
        for (const node of current) {
            collect(node, node.name)
        }
    }

    return results.sort()
}

export default getPermissions
