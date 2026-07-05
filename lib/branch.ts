import { cookies } from 'next/headers'

/**
 * Retrieves the currently active branch ID from the request cookies.
 * Defaults to 1 (main branch) if the cookie is not present or invalid.
 */
export function getActiveBranchId(): number {
    try {
        const cookieStore = cookies()
        const branchIdStr = cookieStore.get('active_branch_id')?.value
        if (branchIdStr) {
            const parsed = parseInt(branchIdStr)
            if (!isNaN(parsed)) {
                return parsed
            }
        }
    } catch (e) {
        // cookies() can throw in environments like static generation or build time
    }
    return 1 // Default branch ID
}
